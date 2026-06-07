const https = require("node:https");
const Redis = require("ioredis");
const { query } = require("../services/api/src/db/mysql");
const { REDIS_HOST, REDIS_PORT } = require("../services/api/src/config");

const PUBLIC_BASE = "https://blitzapi.hashpi.app";

const checks = [];

function addCheck(level, title, detail = "", data = null) {
  checks.push({
    level,
    title,
    detail,
    data
  });
}

function requestHead(path) {
  return new Promise((resolve) => {
    const req = https.request(`${PUBLIC_BASE}${path}`, { method: "HEAD", timeout: 5000 }, (res) => {
      res.resume();
      resolve({
        statusCode: res.statusCode,
        cacheStatus: res.headers["cf-cache-status"] || "",
        contentType: res.headers["content-type"] || ""
      });
    });

    req.on("timeout", () => {
      req.destroy(new Error("timeout"));
    });

    req.on("error", (error) => {
      resolve({
        error: error.message
      });
    });

    req.end();
  });
}

async function checkPaymentIntegrity() {
  const [summary] = await query(`
    SELECT
      SUM(CASE WHEN txid = '' THEN 1 ELSE 0 END) AS empty_txid,
      SUM(CASE WHEN pi_payment_id = '' THEN 1 ELSE 0 END) AS empty_payment_id,
      SUM(CASE WHEN status = 'completed' AND (txid IS NULL OR txid = '') THEN 1 ELSE 0 END) AS completed_without_txid,
      SUM(CASE WHEN status IN ('created', 'pending', 'approved') AND created_at < DATE_SUB(NOW(), INTERVAL 2 HOUR) THEN 1 ELSE 0 END) AS stale_open_orders
    FROM payment_orders
  `);

  if (Number(summary.empty_txid || 0) > 0 || Number(summary.empty_payment_id || 0) > 0) {
    addCheck("danger", "payment empty unique fields", "payment_orders has empty string values in unique nullable fields", summary);
  }

  if (Number(summary.completed_without_txid || 0) > 0) {
    addCheck("danger", "completed payment without txid", "completed recharge order is missing chain txid", summary);
  }

  if (Number(summary.stale_open_orders || 0) > 0) {
    addCheck("warning", "stale payment orders", "open payment orders older than 2 hours should be synced or expired", summary);
  }

  if (
    Number(summary.empty_txid || 0) === 0 &&
    Number(summary.empty_payment_id || 0) === 0 &&
    Number(summary.completed_without_txid || 0) === 0 &&
    Number(summary.stale_open_orders || 0) === 0
  ) {
    addCheck("ok", "payment integrity", "payment order fields and open orders look healthy", summary);
  }
}

async function checkBattleIntegrity() {
  const [summary] = await query(`
    SELECT
      SUM(CASE WHEN status = 'playing' AND created_at < DATE_SUB(NOW(), INTERVAL 5 MINUTE) THEN 1 ELSE 0 END) AS stale_playing_rooms,
      SUM(CASE WHEN entry_fee > 0 AND is_bot_room = 1 THEN 1 ELSE 0 END) AS paid_bot_rooms,
      SUM(CASE WHEN status = 'manual_review' THEN 1 ELSE 0 END) AS manual_review_rooms,
      SUM(CASE WHEN status = 'finished' AND winner_uid = '' AND entry_fee > 0 THEN 1 ELSE 0 END) AS paid_draw_rooms
    FROM battle_rooms
  `);

  if (Number(summary.paid_bot_rooms || 0) > 0) {
    addCheck("danger", "paid bot room detected", "paid modes should not create bot rooms", summary);
  }

  if (Number(summary.stale_playing_rooms || 0) > 0) {
    addCheck("warning", "stale playing rooms", "playing rooms older than 5 minutes may need manual review", summary);
  }

  if (Number(summary.manual_review_rooms || 0) > 0) {
    addCheck("warning", "manual review rooms", "battle rooms are waiting for operator review", summary);
  }

  if (Number(summary.paid_draw_rooms || 0) > 0) {
    addCheck("info", "paid draw rooms", "paid draw rooms exist; confirm refunds were expected", summary);
  }

  if (
    Number(summary.paid_bot_rooms || 0) === 0 &&
    Number(summary.stale_playing_rooms || 0) === 0 &&
    Number(summary.manual_review_rooms || 0) === 0
  ) {
    addCheck("ok", "battle integrity", "battle room risk counters look healthy", summary);
  }
}

async function checkWalletIntegrity() {
  const [summary] = await query(`
    SELECT
      SUM(CASE WHEN available_balance < 0 THEN 1 ELSE 0 END) AS negative_available,
      SUM(CASE WHEN locked_balance < 0 THEN 1 ELSE 0 END) AS negative_locked,
      SUM(CASE WHEN available_balance + locked_balance > 100000 THEN 1 ELSE 0 END) AS unusually_large_wallets
    FROM wallets
  `);

  if (Number(summary.negative_available || 0) > 0 || Number(summary.negative_locked || 0) > 0) {
    addCheck("danger", "negative wallet balance", "one or more wallets have negative balance fields", summary);
  }

  if (Number(summary.unusually_large_wallets || 0) > 0) {
    addCheck("warning", "large wallet balances", "wallet balance exceeds audit threshold", summary);
  }

  if (
    Number(summary.negative_available || 0) === 0 &&
    Number(summary.negative_locked || 0) === 0 &&
    Number(summary.unusually_large_wallets || 0) === 0
  ) {
    addCheck("ok", "wallet integrity", "wallet balances look healthy", summary);
  }
}

async function checkWithdrawIntegrity() {
  const [summary] = await query(`
    SELECT
      SUM(CASE WHEN status = 'pending' AND created_at < DATE_SUB(NOW(), INTERVAL 24 HOUR) THEN 1 ELSE 0 END) AS stale_pending,
      SUM(CASE WHEN status = 'approved' AND created_at < DATE_SUB(NOW(), INTERVAL 24 HOUR) THEN 1 ELSE 0 END) AS stale_approved,
      SUM(CASE WHEN status = 'paid' AND (txid IS NULL OR txid = '') THEN 1 ELSE 0 END) AS paid_without_txid
    FROM withdraw_orders
  `);

  if (Number(summary.paid_without_txid || 0) > 0) {
    addCheck("danger", "paid withdraw without txid", "paid withdraw order is missing txid", summary);
  }

  if (Number(summary.stale_pending || 0) > 0 || Number(summary.stale_approved || 0) > 0) {
    addCheck("warning", "stale withdraw orders", "withdraw orders have waited more than 24 hours", summary);
  }

  if (
    Number(summary.paid_without_txid || 0) === 0 &&
    Number(summary.stale_pending || 0) === 0 &&
    Number(summary.stale_approved || 0) === 0
  ) {
    addCheck("ok", "withdraw integrity", "withdraw order counters look healthy", summary);
  }
}

async function checkRedisState() {
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

    const invalidQueues = Object.values(queues).some((value) => value === "invalid-json");
    if (invalidQueues) {
      addCheck("danger", "invalid redis queue", "one or more match queues are not valid JSON", data);
    } else if (userRoomKeys.length > 20 || realtimeRoomKeys.length > 20) {
      addCheck("warning", "redis room keys elevated", "room binding keys are higher than expected; verify active users", data);
    } else {
      addCheck("ok", "redis state", "redis match and room state counters look healthy", data);
    }
  } catch (error) {
    addCheck("warning", "redis unavailable", error.message);
  } finally {
    redis.disconnect();
  }
}

async function checkPublicExposure() {
  const paths = [
    "/package.json",
    "/services/api/src/config.js",
    "/database/mysql/production-blitzhashpi.sql",
    "/.env.production"
  ];
  const results = {};

  for (const path of paths) {
    results[path] = await requestHead(path);
  }

  const exposed = Object.entries(results).filter(([, result]) => Number(result.statusCode || 0) >= 200 && Number(result.statusCode || 0) < 300);
  if (exposed.length > 0) {
    addCheck("danger", "public source exposure", "sensitive backend paths are publicly reachable", results);
  } else {
    addCheck("ok", "public exposure", "sensitive backend paths are not publicly reachable", results);
  }
}

async function main() {
  await checkPaymentIntegrity();
  await checkBattleIntegrity();
  await checkWalletIntegrity();
  await checkWithdrawIntegrity();
  await checkRedisState();
  await checkPublicExposure();

  const summary = checks.reduce(
    (acc, check) => {
      acc[check.level] = (acc[check.level] || 0) + 1;
      return acc;
    },
    { ok: 0, info: 0, warning: 0, danger: 0 }
  );

  const report = {
    checkedAt: new Date().toISOString(),
    summary,
    checks
  };

  console.log(JSON.stringify(report, null, 2));

  if (summary.danger > 0) {
    process.exitCode = 2;
  } else if (summary.warning > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(JSON.stringify({
    checkedAt: new Date().toISOString(),
    summary: { danger: 1 },
    checks: [
      {
        level: "danger",
        title: "audit failed",
        detail: error.message
      }
    ]
  }, null, 2));
  process.exitCode = 2;
});
