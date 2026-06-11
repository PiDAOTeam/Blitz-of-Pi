const https = require("node:https");
const Redis = require("ioredis");
const { query } = require("../db/mysql");
const { REDIS_HOST, REDIS_PORT } = require("../config");

const PUBLIC_API_BASE = "https://blitzapi.hashpi.app";

function toNumber(value) {
  return Number(value || 0);
}

function head(path) {
  return new Promise((resolve) => {
    const req = https.request(`${PUBLIC_API_BASE}${path}`, { method: "HEAD", timeout: 5000 }, (res) => {
      res.resume();
      resolve({
        statusCode: res.statusCode,
        cacheStatus: res.headers["cf-cache-status"] || "",
        contentType: res.headers["content-type"] || ""
      });
    });

    req.on("timeout", () => req.destroy(new Error("timeout")));
    req.on("error", (error) => resolve({ error: error.message }));
    req.end();
  });
}

function createReportBuilder() {
  const checks = [];

  return {
    add(level, title, detail = "", data = null) {
      checks.push({ level, title, detail, data });
    },
    finish() {
      const summary = checks.reduce(
        (acc, check) => {
          acc[check.level] = (acc[check.level] || 0) + 1;
          return acc;
        },
        { ok: 0, info: 0, warning: 0, danger: 0 }
      );

      return {
        checkedAt: new Date().toISOString(),
        summary,
        checks
      };
    }
  };
}

async function checkPaymentIntegrity(report) {
  const [summary] = await query(`
    SELECT
      SUM(CASE WHEN txid = '' THEN 1 ELSE 0 END) AS empty_txid,
      SUM(CASE WHEN pi_payment_id = '' THEN 1 ELSE 0 END) AS empty_payment_id,
      SUM(CASE WHEN status = 'completed' AND (txid IS NULL OR txid = '') THEN 1 ELSE 0 END) AS completed_without_txid,
      SUM(CASE WHEN status IN ('created', 'pending', 'approved') AND created_at < DATE_SUB(NOW(), INTERVAL 2 HOUR) THEN 1 ELSE 0 END) AS stale_open_orders
    FROM payment_orders
  `);

  if (toNumber(summary.empty_txid) > 0 || toNumber(summary.empty_payment_id) > 0) {
    report.add("danger", "支付唯一字段存在空字符串", "payment_orders 的可空唯一字段应为 NULL，空字符串会导致新订单撞唯一索引。", summary);
    return;
  }

  if (toNumber(summary.completed_without_txid) > 0) {
    report.add("danger", "完成支付缺少 TXID", "已完成充值订单缺少链上 TXID，需要立刻核对。", summary);
    return;
  }

  if (toNumber(summary.stale_open_orders) > 0) {
    report.add("warning", "存在超时未闭环支付", "超过 2 小时仍未完成的支付订单需要同步或过期处理。", summary);
    return;
  }

  report.add("ok", "支付订单健康", "支付唯一字段、完成订单和未闭环订单均正常。", summary);
}

async function checkBattleIntegrity(report) {
  const [summary] = await query(`
    SELECT
      SUM(CASE
        WHEN b.status = 'playing'
         AND b.created_at < DATE_SUB(NOW(), INTERVAL 5 MINUTE)
         AND (b.entry_fee > 0 OR COALESCE(b.asset_type, 'FREE') <> 'FREE')
        THEN 1 ELSE 0 END) AS stale_playing_rooms,
      SUM(CASE WHEN b.entry_fee > 0 AND b.is_bot_room = 1 THEN 1 ELSE 0 END) AS paid_bot_rooms,
      SUM(CASE WHEN b.status = 'manual_review' THEN 1 ELSE 0 END) AS manual_review_rooms,
      SUM(CASE
        WHEN b.status = 'finished'
         AND b.winner_uid = ''
         AND b.entry_fee > 0
         AND COALESCE(b.asset_settlement_status, '') <> 'released'
         AND (
           SELECT COUNT(*)
           FROM wallet_ledgers l
           WHERE l.related_type = 'battle_draw_unlock'
             AND l.related_id IN (CONCAT(b.room_no, ':', b.player_a_uid), CONCAT(b.room_no, ':', b.player_b_uid))
         ) < 2
        THEN 1 ELSE 0 END) AS paid_draw_rooms
    FROM battle_rooms b
  `);

  if (toNumber(summary.paid_bot_rooms) > 0) {
    report.add("danger", "付费场出现机器人局", "付费模式应只允许真人匹配。", summary);
    return;
  }

  if (toNumber(summary.stale_playing_rooms) > 0) {
    report.add("warning", "存在资产场超时房间", "超过 5 分钟仍处于 playing 的付费/资产房需要人工复核；免费快速局会自动作废。", summary);
    return;
  }

  if (toNumber(summary.manual_review_rooms) > 0 || toNumber(summary.paid_draw_rooms) > 0) {
    report.add("warning", "存在待复核对局", "人工复核或付费平局房间需要运营确认。", summary);
    return;
  }

  report.add("ok", "对局结算健康", "资产场超时房间、付费机器人局和待复核房间均正常。", summary);
}

async function checkWalletIntegrity(report) {
  const [summary] = await query(`
    SELECT
      SUM(CASE WHEN available_balance < 0 THEN 1 ELSE 0 END) AS negative_available,
      SUM(CASE WHEN locked_balance < 0 THEN 1 ELSE 0 END) AS negative_locked,
      SUM(CASE WHEN available_balance + locked_balance > 100000 THEN 1 ELSE 0 END) AS unusually_large_wallets
    FROM wallets
  `);

  if (toNumber(summary.negative_available) > 0 || toNumber(summary.negative_locked) > 0) {
    report.add("danger", "钱包出现负余额", "用户资产字段出现负数，需暂停提现并核账。", summary);
    return;
  }

  if (toNumber(summary.unusually_large_wallets) > 0) {
    report.add("warning", "钱包余额超过巡检阈值", "存在余额超过 100000 Pi 的钱包，请确认是否为真实运营数据。", summary);
    return;
  }

  report.add("ok", "钱包余额健康", "未发现负余额或异常大额钱包。", summary);
}

async function checkWithdrawIntegrity(report) {
  const [summary] = await query(`
    SELECT
      SUM(CASE WHEN status = 'pending' AND created_at < DATE_SUB(NOW(), INTERVAL 24 HOUR) THEN 1 ELSE 0 END) AS stale_pending,
      SUM(CASE WHEN status = 'approved' AND created_at < DATE_SUB(NOW(), INTERVAL 24 HOUR) THEN 1 ELSE 0 END) AS stale_approved,
      SUM(CASE WHEN status = 'paid' AND (txid IS NULL OR txid = '') THEN 1 ELSE 0 END) AS paid_without_txid
    FROM withdraw_orders
  `);

  if (toNumber(summary.paid_without_txid) > 0) {
    report.add("danger", "已打款提现缺少 TXID", "已标记打款的提现订单必须保留链上 TXID。", summary);
    return;
  }

  if (toNumber(summary.stale_pending) > 0 || toNumber(summary.stale_approved) > 0) {
    report.add("warning", "提现处理超时", "待审核或已审核提现超过 24 小时未处理。", summary);
    return;
  }

  report.add("ok", "提现队列健康", "未发现超时提现或缺少 TXID 的已打款订单。", summary);
}

async function checkRedisState(report) {
  const redis = new Redis({
    host: REDIS_HOST,
    port: REDIS_PORT,
    maxRetriesPerRequest: 1,
    lazyConnect: true
  });

  try {
    await redis.connect();
    const keys = await redis.keys("blitz:*");
    const queueKeys = keys.filter((key) => key.startsWith("blitz:match:queue:"));
    const userRoomKeys = keys.filter((key) => key.startsWith("blitz:user-room:"));
    const realtimeRoomKeys = keys.filter((key) => key.startsWith("blitz:realtime-room:"));
    const queues = {};

    for (const key of queueKeys) {
      const raw = await redis.get(key);
      try {
        queues[key] = JSON.parse(raw || "[]").length;
      } catch {
        queues[key] = "invalid-json";
      }
    }

    const data = {
      keyCount: keys.length,
      queueKeys: queueKeys.length,
      userRoomKeys: userRoomKeys.length,
      realtimeRoomKeys: realtimeRoomKeys.length,
      queues
    };

    if (Object.values(queues).some((value) => value === "invalid-json")) {
      report.add("danger", "Redis 匹配队列格式异常", "匹配队列不是合法 JSON，可能影响匹配。", data);
      return;
    }

    if (userRoomKeys.length > 20 || realtimeRoomKeys.length > 20) {
      report.add("warning", "Redis 房间键数量偏高", "房间绑定键较多，请结合在线人数判断是否有残留。", data);
      return;
    }

    report.add("ok", "Redis 状态健康", "匹配队列和房间状态计数正常。", data);
  } catch (error) {
    report.add("warning", "Redis 巡检失败", error.message);
  } finally {
    redis.disconnect();
  }
}

async function checkPublicExposure(report) {
  const paths = ["/package.json", "/services/api/src/config.js", "/database/mysql/production-blitzhashpi.sql", "/.env.production"];
  const results = {};

  for (const path of paths) {
    results[path] = await head(path);
  }

  const exposed = Object.values(results).some(
    (result) => Number(result.statusCode || 0) >= 200 && Number(result.statusCode || 0) < 300
  );

  if (exposed) {
    report.add("danger", "后端敏感路径公网可访问", "源码、SQL 或环境文件暴露会造成严重生产风险。", results);
    return;
  }

  report.add("ok", "公网暴露检查健康", "敏感后端路径均不可公网访问。", results);
}

async function readRiskAuditReport() {
  const report = createReportBuilder();

  await checkPaymentIntegrity(report);
  await checkBattleIntegrity(report);
  await checkWalletIntegrity(report);
  await checkWithdrawIntegrity(report);
  await checkRedisState(report);
  await checkPublicExposure(report);

  return report.finish();
}

module.exports = {
  readRiskAuditReport
};
