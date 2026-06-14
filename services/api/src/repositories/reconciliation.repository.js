const { query } = require("../db/mysql");
const { readHomeConfig } = require("./home-config.repository");
const { readGameConfig } = require("./game-config.repository");

function toNumber(value) {
  return Number(value || 0);
}

function getBattleAssetUnit(assetType = "") {
  const normalized = String(assetType || "PI").toUpperCase();
  if (normalized === "POINTS") return "积分";
  if (normalized === "POC") return "POC";
  return "Pi";
}

function buildBattleAssetSummary(rows = []) {
  const orderedAssetTypes = ["PI", "POINTS", "POC"];
  const byAssetType = new Map(
    orderedAssetTypes.map((assetType) => [
      assetType,
      {
        assetType,
        assetUnit: getBattleAssetUnit(assetType),
        totalRooms: 0,
        playingRooms: 0,
        finishedRooms: 0,
        platformRevenue: 0
      }
    ])
  );

  for (const row of rows) {
    const assetType = String(row.asset_type || "PI").toUpperCase();
    const current = byAssetType.get(assetType) || {
      assetType,
      assetUnit: getBattleAssetUnit(assetType),
      totalRooms: 0,
      playingRooms: 0,
      finishedRooms: 0,
      platformRevenue: 0
    };

    byAssetType.set(assetType, {
      ...current,
      totalRooms: toNumber(row.total_rooms),
      playingRooms: toNumber(row.playing_rooms),
      finishedRooms: toNumber(row.finished_rooms),
      platformRevenue: toNumber(row.platform_revenue)
    });
  }

  return [
    ...orderedAssetTypes.map((assetType) => byAssetType.get(assetType))
  ];
}

const REQUIRED_LOCALES = ["zh-CN", "en", "vi", "ko", "ja"];

const HOME_I18N_FIELDS = [
  ["projectName", "首页标题"],
  ["englishName", "顶部英文标识"],
  ["bannerDescription", "首页描述"]
];

const OPERATION_I18N_FIELDS = [
  ["rechargeNotice", "充值提示"],
  ["withdrawNotice", "提现提示"],
  ["ruleSummary", "段位规则摘要"]
];

function isBlank(value) {
  return String(value ?? "").trim() === "";
}

function getLocaleMissingFields(localizedContent, locale, fields) {
  const content = localizedContent?.[locale] || {};
  return fields.filter(([key]) => isBlank(content[key])).map(([, label]) => label);
}

async function readI18nIssues() {
  const [homeConfig, gameConfig] = await Promise.all([readHomeConfig(), readGameConfig()]);
  const items = [];

  for (const locale of REQUIRED_LOCALES) {
    const homeMissing = getLocaleMissingFields(homeConfig.localizedContent, locale, HOME_I18N_FIELDS);
    if (homeMissing.length) {
      items.push({
        type: "i18n_home_missing",
        title: "首页多语言内容不完整",
        targetId: locale,
        user: "首页配置",
        amount: 0,
        status: `缺少：${homeMissing.join("、")}`,
        severity: locale === "zh-CN" || locale === "en" ? "warning" : "info",
        hint: "进入后台配置页补齐对应语言，避免海外用户看到空文案或中文回退。"
      });
    }

    const operationMissing = getLocaleMissingFields(
      gameConfig.operation?.localizedContent,
      locale,
      OPERATION_I18N_FIELDS
    );
    if (operationMissing.length) {
      items.push({
        type: "i18n_operation_missing",
        title: "运营规则多语言内容不完整",
        targetId: locale,
        user: "运营文案",
        amount: 0,
        status: `缺少：${operationMissing.join("、")}`,
        severity: locale === "zh-CN" || locale === "en" ? "warning" : "info",
        hint: "充值、提现、规则说明必须优先补齐，减少海外用户误操作。"
      });
    }
  }

  return items;
}

function buildActionText(groupKey, type) {
  const actions = {
    payment_open_too_long: "先查 Pi paymentId 状态，再让用户重进应用触发补账；无 paymentId 的旧订单等待自动过期。",
    payment_missing_ledger: "立即核对该订单是否已给用户加余额，必要时手工补流水后再开放推广。",
    wallet_balance_mismatch: "暂停该用户提现，核对钱包流水和余额差异。",
    withdraw_pending_risk: "尽快审核或打款，超过 24 小时会明显影响信任。",
    battle_room_risk: "资产场优先人工复核，免费异常局会自动作废。",
    battle_missing_reward: "核对胜者奖励是否发放，避免用户赢了没到账。",
    battle_missing_entry: "核对双方入场费扣款，付费场缺流水会影响平台收入。",
    i18n_home_missing: "到配置页补齐首页多语言字段。",
    i18n_operation_missing: "到配置页补齐运营规则多语言字段。"
  };

  return actions[type] || `按${groupKey}分组处理并记录结果。`;
}

function normalizeIssue(groupKey, item, fallbackSeverity) {
  const severity = item.severity || fallbackSeverity;
  return {
    ...item,
    severity,
    actionText: buildActionText(groupKey, item.type)
  };
}

async function readReconciliationReport() {
  const [
    paymentSummaryRows,
    pendingPaymentRows,
    missingRechargeLedgerRows,
    walletMismatchRows,
    withdrawSummaryRows,
    withdrawRiskRows,
    battleSummaryRows,
    battleAssetSummaryRows,
    battleRiskRows,
    missingRewardLedgerRows,
    missingEntryLedgerRows
  ] = await Promise.all([
    query(
      `SELECT
         COUNT(*) AS total_orders,
         SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed_orders,
         COALESCE(SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END), 0) AS completed_amount,
         SUM(CASE WHEN status IN ('pending', 'approved') THEN 1 ELSE 0 END) AS open_orders
       FROM payment_orders`
    ),
    query(
      `SELECT p.order_no, p.uid, u.pi_username, u.nickname, p.pi_payment_id,
              p.amount, p.status, p.created_at, p.updated_at
       FROM payment_orders p
       LEFT JOIN users u ON u.uid = p.uid
       WHERE p.status IN ('pending', 'approved')
         AND p.created_at < DATE_SUB(NOW(), INTERVAL 10 MINUTE)
       ORDER BY p.id DESC
       LIMIT 30`
    ),
    query(
      `SELECT p.order_no, p.uid, u.pi_username, u.nickname, p.pi_payment_id,
              p.amount, p.status, p.txid, p.completed_at
       FROM payment_orders p
       LEFT JOIN wallet_ledgers l
         ON l.related_type = 'payment_order'
        AND l.related_id = p.order_no
       LEFT JOIN users u ON u.uid = p.uid
       WHERE p.status = 'completed'
         AND l.id IS NULL
       ORDER BY p.id DESC
       LIMIT 30`
    ),
    query(
      `SELECT w.uid, u.pi_username, u.nickname,
              w.available_balance, w.locked_balance, w.total_recharge, w.total_withdraw, w.total_reward,
              COALESCE(SUM(CASE WHEN l.direction = 'in' THEN l.amount ELSE 0 END), 0)
                - COALESCE(SUM(CASE
                    WHEN l.direction = 'out'
                     AND l.type <> 'withdraw_paid'
                     AND COALESCE(l.related_type, '') <> 'battle_room_entry_consume'
                    THEN l.amount ELSE 0 END), 0)
                - COALESCE(SUM(CASE WHEN l.direction = 'lock' THEN l.amount ELSE 0 END), 0)
                + COALESCE(SUM(CASE WHEN l.direction = 'unlock' THEN l.amount ELSE 0 END), 0) AS expected_available,
              COALESCE(SUM(CASE WHEN l.direction = 'lock' THEN l.amount ELSE 0 END), 0)
                - COALESCE(SUM(CASE WHEN l.direction = 'unlock' THEN l.amount ELSE 0 END), 0)
                - COALESCE(SUM(CASE WHEN l.type = 'withdraw_paid' THEN l.amount ELSE 0 END), 0)
                - COALESCE(SUM(CASE
                    WHEN l.direction = 'out'
                     AND COALESCE(l.related_type, '') = 'battle_room_entry_consume'
                    THEN l.amount ELSE 0 END), 0) AS expected_locked
       FROM wallets w
       LEFT JOIN users u ON u.uid = w.uid
       LEFT JOIN wallet_ledgers l ON l.uid = w.uid
       GROUP BY w.uid, u.pi_username, u.nickname, w.available_balance, w.locked_balance,
                w.total_recharge, w.total_withdraw, w.total_reward
       HAVING ABS(ROUND(w.available_balance - expected_available, 8)) > 0.00000001
          OR ABS(ROUND(w.locked_balance - expected_locked, 8)) > 0.00000001
       ORDER BY ABS(w.available_balance - expected_available) + ABS(w.locked_balance - expected_locked) DESC
       LIMIT 30`
    ),
    query(
      `SELECT
         COUNT(*) AS total_orders,
         SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending_orders,
         SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) AS approved_orders,
         SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) AS paid_orders,
         COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0) AS paid_amount
       FROM withdraw_orders`
    ),
    query(
      `SELECT w.order_no, w.uid, u.pi_username, u.nickname,
              w.amount, w.status, w.txid, w.created_at, w.audited_at, w.paid_at
       FROM withdraw_orders w
       LEFT JOIN users u ON u.uid = w.uid
       WHERE (w.status = 'pending' AND w.created_at < DATE_SUB(NOW(), INTERVAL 24 HOUR))
          OR (w.status = 'approved' AND w.audited_at < DATE_SUB(NOW(), INTERVAL 24 HOUR))
          OR (w.status = 'paid' AND (w.txid IS NULL OR w.txid = ''))
       ORDER BY w.id DESC
       LIMIT 30`
    ),
    query(
      `SELECT
         COUNT(*) AS total_rooms,
         SUM(CASE WHEN status = 'playing' THEN 1 ELSE 0 END) AS playing_rooms,
         SUM(CASE WHEN status = 'finished' THEN 1 ELSE 0 END) AS finished_rooms,
         COALESCE(SUM(CASE WHEN status = 'finished' THEN entry_fee * 2 - reward_amount ELSE 0 END), 0) AS platform_revenue
       FROM battle_rooms`
    ),
    query(
      `SELECT
         COALESCE(NULLIF(asset_type, ''), 'PI') AS asset_type,
         COUNT(*) AS total_rooms,
         SUM(CASE WHEN status = 'playing' THEN 1 ELSE 0 END) AS playing_rooms,
         SUM(CASE WHEN status = 'finished' THEN 1 ELSE 0 END) AS finished_rooms,
         COALESCE(SUM(CASE WHEN status = 'finished' THEN entry_fee * 2 - reward_amount ELSE 0 END), 0) AS platform_revenue
       FROM battle_rooms
       GROUP BY COALESCE(NULLIF(asset_type, ''), 'PI')`
    ),
    query(
      `SELECT room_no, mode, status, player_a_uid, player_b_uid, winner_uid,
              entry_fee, reward_amount, asset_type, asset_settlement_status, asset_error,
              is_bot_room, created_at, finished_at
       FROM battle_rooms
       WHERE (status = 'playing'
              AND created_at < DATE_SUB(NOW(), INTERVAL 5 MINUTE)
              AND (entry_fee > 0 OR COALESCE(asset_type, 'FREE') <> 'FREE'))
          OR (mode IN ('ticket_battle', 'rich_battle', 'poc_battle', 'pi_battle') AND is_bot_room = 1)
          OR (status = 'finished' AND winner_uid = '' AND is_bot_room = 0 AND entry_fee > 0 AND reward_amount > 0
              AND COALESCE(asset_type, 'PI') = 'PI'
              AND NOT EXISTS (
                SELECT 1
                FROM wallet_ledgers dl
                WHERE dl.related_type = 'battle_draw_unlock'
                  AND dl.related_id IN (CONCAT(battle_rooms.room_no, ':', battle_rooms.player_a_uid), CONCAT(battle_rooms.room_no, ':', battle_rooms.player_b_uid))
              ))
          OR (COALESCE(asset_type, 'PI') IN ('POINTS', 'POC')
              AND status = 'finished'
              AND entry_fee > 0
              AND COALESCE(asset_settlement_status, '') NOT IN ('settled', 'released'))
       ORDER BY id DESC
       LIMIT 30`
    ),
    query(
      `SELECT b.room_no, b.winner_uid, uw.pi_username AS winner_pi_username, uw.nickname AS winner_nickname,
              b.reward_amount, b.asset_type, b.finished_at
       FROM battle_rooms b
       LEFT JOIN wallet_ledgers l
         ON l.related_type = 'battle_reward'
        AND l.related_id = b.room_no
       LEFT JOIN users uw ON uw.uid = b.winner_uid
       WHERE b.status = 'finished'
         AND COALESCE(b.asset_type, 'PI') = 'PI'
         AND b.reward_amount > 0
         AND b.is_bot_room = 0
         AND b.winner_uid IS NOT NULL
         AND b.winner_uid <> ''
         AND l.id IS NULL
       ORDER BY b.id DESC
       LIMIT 30`
    ),
    query(
      `SELECT b.room_no, b.player_a_uid, b.player_b_uid, b.entry_fee, b.asset_type, COUNT(l.id) AS entry_ledger_count
       FROM battle_rooms b
       LEFT JOIN wallet_ledgers l
         ON l.related_type IN ('battle_room_entry', 'battle_room_entry_lock')
        AND l.related_id IN (CONCAT(b.room_no, ':', b.player_a_uid), CONCAT(b.room_no, ':', b.player_b_uid))
       WHERE b.entry_fee > 0
         AND b.is_bot_room = 0
         AND COALESCE(b.asset_type, 'PI') = 'PI'
       GROUP BY b.room_no, b.player_a_uid, b.player_b_uid, b.entry_fee, b.asset_type
       HAVING entry_ledger_count <> 2
       ORDER BY b.room_no DESC
       LIMIT 30`
    )
  ]);

  const paymentSummary = paymentSummaryRows[0] || {};
  const withdrawSummary = withdrawSummaryRows[0] || {};
  const battleSummary = battleSummaryRows[0] || {};
  const battleAssetSummary = buildBattleAssetSummary(battleAssetSummaryRows);
  const piBattleSummary = battleAssetSummary.find((item) => item.assetType === "PI") || {};

  const i18nItems = await readI18nIssues();

  const groups = [
    {
      key: "payments",
      title: "充值订单",
      level: pendingPaymentRows.length || missingRechargeLedgerRows.length ? "warning" : "ok",
      count: pendingPaymentRows.length + missingRechargeLedgerRows.length,
      items: [
        ...pendingPaymentRows.map((row) => ({
          type: "payment_open_too_long",
          title: "充值订单长时间未完成",
          targetId: row.order_no,
          user: row.nickname || row.pi_username || row.uid,
          amount: toNumber(row.amount),
          status: row.status,
          severity: "warning",
          hint: "如果用户已付款但未到账，进入 Pi Developer Portal 核对 paymentId 后让用户重新打开应用触发补账。"
        })),
        ...missingRechargeLedgerRows.map((row) => ({
          type: "payment_missing_ledger",
          title: "充值完成但缺少钱包入账流水",
          targetId: row.order_no,
          user: row.nickname || row.pi_username || row.uid,
          amount: toNumber(row.amount),
          status: row.status,
          severity: "danger",
          hint: "这是高优先级异常，需要核对该订单是否已经给用户加余额。"
        }))
      ]
    },
    {
      key: "wallets",
      title: "钱包余额",
      level: walletMismatchRows.length ? "danger" : "ok",
      count: walletMismatchRows.length,
      items: walletMismatchRows.map((row) => ({
        type: "wallet_balance_mismatch",
        title: "钱包余额与流水计算不一致",
        targetId: row.uid,
        user: row.nickname || row.pi_username || row.uid,
        amount: toNumber(row.available_balance),
        status: `可用应为 ${toNumber(row.expected_available)}，冻结应为 ${toNumber(row.expected_locked)}`,
        severity: "danger",
        hint: "上线前必须人工核对，避免用户资产显示与流水不一致。"
      }))
    },
    {
      key: "withdraws",
      title: "提现处理",
      level: withdrawRiskRows.length ? "warning" : "ok",
      count: withdrawRiskRows.length,
      items: withdrawRiskRows.map((row) => ({
        type: "withdraw_pending_risk",
        title: "提现订单需要处理",
        targetId: row.order_no,
        user: row.nickname || row.pi_username || row.uid,
        amount: toNumber(row.amount),
        status: row.status,
        severity: "warning",
        hint: "待审核/已审核超过 24 小时会影响用户信任，已打款订单必须保留 TXID。"
      }))
    },
    {
      key: "battles",
      title: "对局结算",
      level: battleRiskRows.length || missingRewardLedgerRows.length || missingEntryLedgerRows.length ? "warning" : "ok",
      count: battleRiskRows.length + missingRewardLedgerRows.length + missingEntryLedgerRows.length,
      items: [
        ...battleRiskRows.map((row) => ({
          type: "battle_room_risk",
          title: "对局状态异常",
          targetId: row.room_no,
          user: `${row.player_a_uid} vs ${row.player_b_uid}`,
          amount: toNumber(row.reward_amount),
          assetType: row.asset_type || "PI",
          assetUnit: getBattleAssetUnit(row.asset_type),
          status: row.asset_error || row.asset_settlement_status || row.status,
          severity: ["ticket_battle", "rich_battle", "points_battle", "poc_battle", "pi_battle"].includes(row.mode)
            ? "danger"
            : "warning",
          hint: "可能是长时间未结束、付费场出现机器人、或真人局没有胜者。"
        })),
        ...missingRewardLedgerRows.map((row) => ({
          type: "battle_missing_reward",
          title: "对局已结束但缺少胜利奖励流水",
          targetId: row.room_no,
          user: row.winner_nickname || row.winner_pi_username || row.winner_uid,
          amount: toNumber(row.reward_amount),
          assetType: row.asset_type || "PI",
          assetUnit: getBattleAssetUnit(row.asset_type),
          status: "finished",
          severity: "danger",
          hint: "需要核对奖励是否已发放。"
        })),
        ...missingEntryLedgerRows.map((row) => ({
          type: "battle_missing_entry",
          title: "门票局缺少报名费扣款流水",
          targetId: row.room_no,
          user: `${row.player_a_uid} vs ${row.player_b_uid}`,
          amount: toNumber(row.entry_fee),
          assetType: row.asset_type || "PI",
          assetUnit: getBattleAssetUnit(row.asset_type),
          status: `扣款流水 ${row.entry_ledger_count}/2`,
          severity: "danger",
          hint: "付费对战必须双方都有入场扣款流水。"
        }))
      ]
    },
    {
      key: "i18n",
      title: "多语言完整度",
      level: i18nItems.some((item) => item.severity === "warning") ? "warning" : i18nItems.length ? "info" : "ok",
      count: i18nItems.length,
      items: i18nItems
    }
  ];

  for (const group of groups) {
    const fallbackSeverity = group.level === "danger" ? "danger" : group.level === "ok" ? "info" : "warning";
    group.items = group.items.map((item) => normalizeIssue(group.key, item, fallbackSeverity));
  }

  const issueCount = groups.reduce((total, group) => total + group.count, 0);
  const dangerCount = groups.reduce(
    (total, group) => total + group.items.filter((item) => item.severity === "danger").length,
    0
  );
  const warningCount = groups.reduce(
    (total, group) => total + group.items.filter((item) => item.severity === "warning").length,
    0
  );
  const infoCount = Math.max(0, issueCount - dangerCount - warningCount);

  return {
    checkedAt: new Date().toISOString(),
    healthScore: Math.max(0, 100 - dangerCount * 18 - warningCount * 8 - infoCount * 3),
    issueCount,
    dangerCount,
    warningCount,
    infoCount,
    summary: {
      payments: {
        totalOrders: toNumber(paymentSummary.total_orders),
        completedOrders: toNumber(paymentSummary.completed_orders),
        completedAmount: toNumber(paymentSummary.completed_amount),
        openOrders: toNumber(paymentSummary.open_orders)
      },
      wallets: {
        mismatchCount: walletMismatchRows.length
      },
      withdraws: {
        totalOrders: toNumber(withdrawSummary.total_orders),
        pendingOrders: toNumber(withdrawSummary.pending_orders),
        approvedOrders: toNumber(withdrawSummary.approved_orders),
        paidOrders: toNumber(withdrawSummary.paid_orders),
        paidAmount: toNumber(withdrawSummary.paid_amount)
      },
      battles: {
        totalRooms: toNumber(battleSummary.total_rooms),
        playingRooms: toNumber(battleSummary.playing_rooms),
        finishedRooms: toNumber(battleSummary.finished_rooms),
        platformRevenue: toNumber(piBattleSummary.platformRevenue),
        assets: battleAssetSummary
      }
    },
    groups
  };
}

module.exports = {
  readReconciliationReport
};
