const { query, transaction } = require("../db/mysql");
const { readGameConfig } = require("./game-config.repository");
const { increaseBalance } = require("./wallet.repository");

const SUPPORTED_BATTLE_MODES = [
  "quick_battle",
  "points_battle",
  "poc_battle",
  "pi_battle",
  "ticket_battle",
  "rich_battle"
];
const DEFAULT_TASK_MODES = ["points_battle", "poc_battle", "pi_battle"];

function executor(connection) {
  return connection || {
    execute: (sql, params) => query(sql, params).then((rows) => [rows])
  };
}

async function ensureEngagementSchema() {
  await query(
    `CREATE TABLE IF NOT EXISTS engagement_daily_claims (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      uid VARCHAR(64) NOT NULL,
      claim_date DATE NOT NULL,
      claim_type VARCHAR(32) NOT NULL,
      task_key VARCHAR(64) NOT NULL DEFAULT '',
      title VARCHAR(64) NOT NULL DEFAULT '',
      reward_amount DECIMAL(18,8) NOT NULL DEFAULT 0,
      asset_summary VARCHAR(255) NOT NULL DEFAULT '',
      reward_json TEXT NULL,
      status VARCHAR(32) NOT NULL DEFAULT 'claimed',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uk_engagement_claim_once (uid, claim_date, claim_type, task_key),
      KEY idx_engagement_claim_date_id (claim_date, id),
      KEY idx_engagement_claim_uid_id (uid, id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci`
  );
  for (const columnSql of [
    "ADD COLUMN asset_summary VARCHAR(255) NOT NULL DEFAULT '' AFTER reward_amount",
    "ADD COLUMN reward_json TEXT NULL AFTER asset_summary"
  ]) {
    try {
      await query(`ALTER TABLE engagement_daily_claims ${columnSql}`);
    } catch (error) {
      if (!/Duplicate column|ER_DUP_FIELDNAME|1060/i.test(String(error.message || error.code || ""))) {
        throw error;
      }
    }
  }
}

async function ensureEngagementRewardJobSchema() {
  await query(
    `CREATE TABLE IF NOT EXISTS engagement_asset_reward_jobs (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      uid VARCHAR(64) NOT NULL,
      claim_id BIGINT UNSIGNED NOT NULL DEFAULT 0,
      claim_date DATE NOT NULL,
      claim_type VARCHAR(32) NOT NULL DEFAULT '',
      task_key VARCHAR(64) NOT NULL DEFAULT '',
      title VARCHAR(64) NOT NULL DEFAULT '',
      asset_type VARCHAR(16) NOT NULL,
      amount DECIMAL(18,8) NOT NULL DEFAULT 0,
      external_order_no VARCHAR(128) NOT NULL,
      idempotency_key VARCHAR(160) NOT NULL,
      remark VARCHAR(255) NOT NULL DEFAULT '',
      status VARCHAR(32) NOT NULL DEFAULT 'queued',
      attempts INT NOT NULL DEFAULT 0,
      max_attempts INT NOT NULL DEFAULT 5,
      next_retry_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
      locked_at TIMESTAMP NULL DEFAULT NULL,
      processed_at TIMESTAMP NULL DEFAULT NULL,
      last_error VARCHAR(255) NOT NULL DEFAULT '',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uk_engagement_reward_idem (idempotency_key),
      KEY idx_engagement_reward_status_retry (status, next_retry_at, id),
      KEY idx_engagement_reward_uid_id (uid, id),
      KEY idx_engagement_reward_claim (claim_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci`
  );
}

async function getTodayString(connection = null) {
  const [rows] = await executor(connection).execute("SELECT CURDATE() AS today");
  const today = rows[0]?.today;
  return today instanceof Date ? today.toISOString().slice(0, 10) : String(today).slice(0, 10);
}

async function listTodayClaims(uid, connection = null) {
  await ensureEngagementSchema();
  const [rows] = await executor(connection).execute(
    `SELECT * FROM engagement_daily_claims
     WHERE uid = ? AND claim_date = CURDATE()
     ORDER BY id DESC`,
    [uid]
  );
  return rows;
}

function normalizeTaskModes(task = {}) {
  const source = Array.isArray(task.modes) && task.modes.length ? task.modes : DEFAULT_TASK_MODES;
  const modes = source
    .map((mode) => String(mode || "").trim())
    .filter((mode, index, list) => SUPPORTED_BATTLE_MODES.includes(mode) && list.indexOf(mode) === index);
  return modes.length ? modes : DEFAULT_TASK_MODES;
}

function sumStatsByModes(rows = [], modes = DEFAULT_TASK_MODES) {
  const modeSet = new Set(modes);
  return rows.reduce(
    (stats, row) => {
      if (!modeSet.has(row.mode)) return stats;
      stats.battle_count += Number(row.battle_count || 0);
      stats.win_count += Number(row.win_count || 0);
      stats.paid_battle_count += Number(row.paid_battle_count || 0);
      return stats;
    },
    { battle_count: 0, win_count: 0, paid_battle_count: 0 }
  );
}

async function getTodayBattleStats(uid) {
  const modes = SUPPORTED_BATTLE_MODES;
  const placeholders = modes.map(() => "?").join(",");
  const rows = await query(
    `SELECT
       mode,
       COUNT(*) AS battle_count,
       SUM(CASE WHEN winner_uid = ? THEN 1 ELSE 0 END) AS win_count,
       SUM(CASE WHEN entry_fee > 0 THEN 1 ELSE 0 END) AS paid_battle_count
     FROM battle_rooms
     WHERE status = 'finished'
       -- 机器人补位局对用户也是完整对局，需计入每日任务；是否计入由后台任务模式控制。
       AND DATE(finished_at) = CURDATE()
       AND (player_a_uid = ? OR player_b_uid = ?)
       AND mode IN (${placeholders})
     GROUP BY mode`,
    [uid, uid, uid, ...modes]
  );

  return {
    byMode: rows,
    total: sumStatsByModes(rows, modes)
  };
}

function getTaskProgress(task, stats) {
  const taskStats = sumStatsByModes(stats.byMode || [], normalizeTaskModes(task));
  return Number(taskStats[task.condition] || 0);
}

function toClaimKey(claim) {
  return `${claim.claim_type}:${claim.task_key || ""}`;
}

function formatAssetAmount(assetType, amount) {
  const normalizedAssetType = String(assetType || "PI").toUpperCase();
  const value = Number(amount || 0);
  if (normalizedAssetType === "POINTS") {
    return `${Math.floor(value)} 积分`;
  }
  if (normalizedAssetType === "POC") {
    return `${value.toFixed(2).replace(/\.?0+$/, "")} POC`;
  }
  return `${value.toFixed(4).replace(/\.?0+$/, "")} Pi`;
}

function formatRewardSummary(rewards = []) {
  return rewards
    .filter((reward) => Number(reward.amount || 0) > 0)
    .map((reward) => formatAssetAmount(reward.assetType, reward.amount))
    .join(" / ");
}

function buildDailySignInRewards(dailySignIn = {}) {
  const piAmount = Number(dailySignIn.rewardAmount || 0);
  const pointsAmount = Math.floor(Number(dailySignIn.pointsRewardAmount || 0));
  const pocAmount = Number(dailySignIn.pocRewardAmount || 0);
  return [
    dailySignIn.piRewardEnabled !== false && piAmount > 0
      ? { assetType: "PI", amount: Number(piAmount.toFixed(8)) }
      : null,
    dailySignIn.pointsRewardEnabled === true && pointsAmount > 0
      ? { assetType: "POINTS", amount: pointsAmount }
      : null,
    dailySignIn.pocRewardEnabled === true && pocAmount > 0
      ? { assetType: "POC", amount: Number(pocAmount.toFixed(6)) }
      : null
  ].filter(Boolean);
}

function buildStatus(config, claims, stats) {
  const engagement = config.engagement || {};
  const claimSet = new Set(claims.map(toClaimKey));
  const dailySignIn = engagement.dailySignIn || {};
  const signInClaimed = claimSet.has("sign_in:");
  const signInRewards = buildDailySignInRewards(dailySignIn);

  return {
    enabled: engagement.enabled !== false,
    today: new Date().toISOString().slice(0, 10),
    stats,
    dailySignIn: {
      enabled: engagement.enabled !== false && dailySignIn.enabled !== false,
      title: dailySignIn.title || "每日签到",
      rewardAmount: Number(dailySignIn.rewardAmount || 0),
      piRewardEnabled: dailySignIn.piRewardEnabled !== false,
      pointsRewardEnabled: Boolean(dailySignIn.pointsRewardEnabled),
      pointsRewardAmount: Math.floor(Number(dailySignIn.pointsRewardAmount || 0)),
      pocRewardEnabled: Boolean(dailySignIn.pocRewardEnabled),
      pocRewardAmount: Number(dailySignIn.pocRewardAmount || 0),
      rewards: signInRewards,
      rewardSummary: formatRewardSummary(signInRewards),
      claimed: signInClaimed,
      claimable: engagement.enabled !== false && dailySignIn.enabled !== false && !signInClaimed
    },
    tasks: (engagement.tasks || []).filter((task) => task.enabled !== false).map((task) => {
      const progress = getTaskProgress(task, stats);
      const requiredCount = Number(task.requiredCount || 1);
      const claimed = claimSet.has(`task:${task.key}`);
      return {
        key: task.key,
        title: task.title,
        condition: task.condition,
        modes: normalizeTaskModes(task),
        requiredCount,
        progress,
        rewardAmount: Number(task.rewardAmount || 0),
        claimed,
        completed: progress >= requiredCount,
        claimable: engagement.enabled !== false && progress >= requiredCount && !claimed
      };
    })
  };
}

async function getEngagementStatus(uid) {
  await ensureEngagementSchema();
  const config = await readGameConfig();
  const [claims, stats] = await Promise.all([listTodayClaims(uid), getTodayBattleStats(uid, config)]);
  return buildStatus(config, claims, stats);
}

async function insertClaim({ uid, claimType, taskKey = "", title, rewardAmount, rewards = [] }, connection) {
  const rewardSummary = formatRewardSummary(rewards);
  const rewardJson = JSON.stringify(rewards);
  const [result] = await executor(connection).execute(
    `INSERT IGNORE INTO engagement_daily_claims
       (uid, claim_date, claim_type, task_key, title, reward_amount, asset_summary, reward_json, status)
     VALUES (?, CURDATE(), ?, ?, ?, ?, ?, ?, 'claimed')`,
    [uid, claimType, taskKey, title, rewardAmount, rewardSummary, rewardJson]
  );
  return Number(result?.affectedRows || 0) > 0 ? Number(result?.insertId || 0) : 0;
}

async function enqueueAssetRewardJobs({ uid, claimId, claimType, taskKey = "", title = "", rewards = [], today }, connection) {
  const remoteRewards = rewards.filter((reward) => ["POINTS", "POC"].includes(reward.assetType));

  for (const reward of remoteRewards) {
    const assetType = String(reward.assetType || "").toUpperCase();
    const orderNo = `engagement:${claimType}:${uid}:${today}:${taskKey || "daily"}:${assetType}`;
    await executor(connection).execute(
      `INSERT INTO engagement_asset_reward_jobs
         (uid, claim_id, claim_date, claim_type, task_key, title, asset_type, amount,
          external_order_no, idempotency_key, remark, status, next_retry_at)
       VALUES (?, ?, CURDATE(), ?, ?, ?, ?, ?, ?, ?, ?, 'queued', NOW())
       ON DUPLICATE KEY UPDATE
         amount = VALUES(amount),
         title = VALUES(title),
         remark = VALUES(remark),
         updated_at = NOW()`,
      [
        uid,
        claimId || 0,
        claimType,
        taskKey,
        title,
        assetType,
        reward.amount,
        orderNo,
        orderNo,
        "Pi闪电战每日签到奖励"
      ]
    );
  }
}

async function claimDailySignIn(uid) {
  await ensureEngagementSchema();
  await ensureEngagementRewardJobSchema();

  await transaction(async (connection) => {
    const config = await readGameConfig();
    const status = buildStatus(config, await listTodayClaims(uid, connection), await getTodayBattleStats(uid, config));
    const signIn = status.dailySignIn;
    const rewards = signIn.rewards || [];

    if (!status.enabled || !signIn.enabled) {
      throw new Error("每日签到暂未开启");
    }
    if (signIn.claimed) {
      throw new Error("今日已签到");
    }

    const claimId = await insertClaim(
      {
        uid,
        claimType: "sign_in",
        title: signIn.title,
        rewardAmount: rewards.find((reward) => reward.assetType === "PI")?.amount || 0,
        rewards
      },
      connection
    );
    if (!claimId) {
      throw new Error("今日已签到");
    }

    const today = await getTodayString(connection);
    const piReward = rewards.find((reward) => reward.assetType === "PI");
    if (Number(piReward?.amount || 0) > 0) {
      await increaseBalance(
        uid,
        piReward.amount,
        {
          type: "daily_signin_reward",
          relatedType: "engagement_sign_in",
          relatedId: `${uid}:${today}`,
          remark: "每日签到奖励"
        },
        connection
      );
    }

    await enqueueAssetRewardJobs({
      uid,
      claimId,
      claimType: "sign_in",
      title: signIn.title,
      rewards,
      today
    }, connection);
  });

  return getEngagementStatus(uid);
}

async function claimDailyTask(uid, taskKey) {
  await ensureEngagementSchema();

  await transaction(async (connection) => {
    const config = await readGameConfig();
    const status = buildStatus(config, await listTodayClaims(uid, connection), await getTodayBattleStats(uid, config));
    const task = status.tasks.find((item) => item.key === taskKey);

    if (!status.enabled) {
      throw new Error("每日任务暂未开启");
    }
    if (!task) {
      throw new Error("任务不存在或已关闭");
    }
    if (task.claimed) {
      throw new Error("该任务今日已领取");
    }
    if (!task.completed) {
      throw new Error("任务还未完成");
    }

    const inserted = await insertClaim(
      {
        uid,
        claimType: "task",
        taskKey: task.key,
        title: task.title,
        rewardAmount: task.rewardAmount,
        rewards: task.rewardAmount > 0 ? [{ assetType: "PI", amount: Number(task.rewardAmount || 0) }] : []
      },
      connection
    );
    if (!inserted) {
      throw new Error("该任务今日已领取");
    }

    if (task.rewardAmount > 0) {
      const today = await getTodayString(connection);
      await increaseBalance(
        uid,
        task.rewardAmount,
        {
          type: "daily_task_reward",
          relatedType: "engagement_task",
          relatedId: `${uid}:${task.key}:${today}`,
          remark: `每日任务奖励：${task.title}`
        },
        connection
      );
    }

  });

  return getEngagementStatus(uid);
}

async function listAdminEngagementClaims(limit = 200) {
  await ensureEngagementSchema();
  const safeLimit = Math.min(300, Math.max(1, Number.parseInt(String(limit), 10) || 200));

  return query(
    `SELECT c.*, u.pi_username, u.nickname, u.avatar_key
     FROM engagement_daily_claims c
     LEFT JOIN users u ON u.uid = c.uid
     ORDER BY c.id DESC
     LIMIT ${safeLimit}`
  );
}

async function listAdminEngagementRewardJobs(limit = 200) {
  await ensureEngagementRewardJobSchema();
  const safeLimit = Math.min(300, Math.max(1, Number.parseInt(String(limit), 10) || 200));

  return query(
    `SELECT j.*, u.pi_username, u.nickname, u.avatar_key
     FROM engagement_asset_reward_jobs j
     LEFT JOIN users u ON u.uid = j.uid
     ORDER BY j.id DESC
     LIMIT ${safeLimit}`
  );
}

async function listEngagementRewardCandidates(limit = 20) {
  await ensureEngagementRewardJobSchema();
  const safeLimit = Math.min(50, Math.max(1, Number.parseInt(String(limit), 10) || 20));

  return query(
    `SELECT j.*, u.pi_user_id, u.pi_username, u.nickname, u.avatar_key
     FROM engagement_asset_reward_jobs j
     LEFT JOIN users u ON u.uid = j.uid
     WHERE j.status IN ('queued', 'failed')
       AND j.attempts < j.max_attempts
       AND (j.next_retry_at IS NULL OR j.next_retry_at <= NOW())
     ORDER BY j.id ASC
     LIMIT ${safeLimit}`
  );
}

async function markEngagementRewardProcessing(id) {
  await ensureEngagementRewardJobSchema();
  const result = await query(
    `UPDATE engagement_asset_reward_jobs
     SET status = 'processing',
         attempts = attempts + 1,
         locked_at = NOW(),
         last_error = ''
     WHERE id = ?
       AND status IN ('queued', 'failed')
       AND attempts < max_attempts`,
    [id]
  );

  if (Number(result?.affectedRows || 0) < 1) return null;

  const rows = await query(
    `SELECT j.*, u.pi_user_id, u.pi_username, u.nickname, u.avatar_key
     FROM engagement_asset_reward_jobs j
     LEFT JOIN users u ON u.uid = j.uid
     WHERE j.id = ?
     LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}

async function markEngagementRewardPaid(id) {
  await query(
    `UPDATE engagement_asset_reward_jobs
     SET status = 'paid',
         processed_at = NOW(),
         last_error = ''
     WHERE id = ?`,
    [id]
  );
}

async function markEngagementRewardFailed(id, errorMessage, { manualReview = false, nextRetrySeconds = 60 } = {}) {
  const status = manualReview ? "manual_review" : "failed";
  await query(
    `UPDATE engagement_asset_reward_jobs
     SET status = ?,
         last_error = ?,
         next_retry_at = DATE_ADD(NOW(), INTERVAL ? SECOND)
     WHERE id = ?`,
    [status, String(errorMessage || "发放失败").slice(0, 255), Math.max(1, Number(nextRetrySeconds || 60)), id]
  );
}

async function resetStaleEngagementRewardProcessing(staleMinutes = 10) {
  await ensureEngagementRewardJobSchema();
  const result = await query(
    `UPDATE engagement_asset_reward_jobs
     SET status = 'failed',
         last_error = '发放任务超时，已回到失败队列等待重试',
         next_retry_at = NOW()
     WHERE status = 'processing'
       AND locked_at < DATE_SUB(NOW(), INTERVAL ? MINUTE)`,
    [Math.max(1, Number(staleMinutes || 10))]
  );
  return Number(result?.affectedRows || 0);
}

async function retryEngagementRewardJob(id) {
  await ensureEngagementRewardJobSchema();
  const result = await query(
    `UPDATE engagement_asset_reward_jobs
     SET status = 'queued',
         next_retry_at = NOW(),
         last_error = ''
     WHERE id = ?
       AND status IN ('failed', 'manual_review', 'processing')`,
    [id]
  );
  return Number(result?.affectedRows || 0) > 0;
}

async function getEngagementRewardQueueStats() {
  await ensureEngagementRewardJobSchema();
  const rows = await query(
    `SELECT
       COUNT(*) AS total,
       SUM(CASE WHEN status IN ('queued', 'failed') AND attempts < max_attempts THEN 1 ELSE 0 END) AS retryable,
       SUM(CASE WHEN status = 'queued' THEN 1 ELSE 0 END) AS queued,
       SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) AS failed,
       SUM(CASE WHEN status = 'manual_review' THEN 1 ELSE 0 END) AS manual_review,
       SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) AS processing,
       SUM(CASE WHEN status IN ('failed', 'manual_review') AND last_error LIKE '%未绑定 HashPi 用户%' THEN 1 ELSE 0 END) AS hashpi_unbound
     FROM engagement_asset_reward_jobs`
  );
  const row = rows[0] || {};

  return {
    total: Number(row.total || 0),
    retryable: Number(row.retryable || 0),
    queued: Number(row.queued || 0),
    failed: Number(row.failed || 0),
    manualReview: Number(row.manual_review || 0),
    processing: Number(row.processing || 0),
    hashpiUnbound: Number(row.hashpi_unbound || 0)
  };
}

async function listUserEngagementAssetRewardRows(uid, limit = 80) {
  await ensureEngagementSchema();
  const safeLimit = Math.min(120, Math.max(1, Number.parseInt(String(limit), 10) || 80));

  return query(
    `SELECT id, uid, claim_date, claim_type, task_key, title, asset_summary, reward_json, created_at
     FROM engagement_daily_claims
     WHERE uid = ?
       AND reward_json IS NOT NULL
       AND reward_json <> ''
     ORDER BY id DESC
     LIMIT ${safeLimit}`,
    [uid]
  );
}

module.exports = {
  claimDailySignIn,
  claimDailyTask,
  getEngagementStatus,
  getEngagementRewardQueueStats,
  listAdminEngagementRewardJobs,
  listAdminEngagementClaims,
  listEngagementRewardCandidates,
  markEngagementRewardFailed,
  markEngagementRewardPaid,
  markEngagementRewardProcessing,
  resetStaleEngagementRewardProcessing,
  retryEngagementRewardJob,
  listUserEngagementAssetRewardRows
};
