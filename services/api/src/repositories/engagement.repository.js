const { query, transaction } = require("../db/mysql");
const assetGateway = require("../services/asset-gateway.service");
const { readGameConfig } = require("./game-config.repository");
const { findUserByUid } = require("./user.repository");
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
       AND is_bot_room = 0
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
  return Number(result?.affectedRows || 0) > 0;
}

async function claimDailySignIn(uid) {
  await ensureEngagementSchema();

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

    const inserted = await insertClaim(
      {
        uid,
        claimType: "sign_in",
        title: signIn.title,
        rewardAmount: rewards.find((reward) => reward.assetType === "PI")?.amount || 0,
        rewards
      },
      connection
    );
    if (!inserted) {
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

    const remoteRewards = rewards.filter((reward) => ["POINTS", "POC"].includes(reward.assetType));
    if (remoteRewards.length) {
      const user = await findUserByUid(uid);
      if (!user) {
        throw new Error("用户不存在，无法发放积分/POC奖励");
      }
      for (const reward of remoteRewards) {
        await assetGateway.reward({
          assetType: reward.assetType,
          user,
          orderNo: `daily_signin:${uid}:${today}:${reward.assetType}`,
          amount: reward.amount,
          idempotencyKey: `daily_signin:${uid}:${today}:${reward.assetType}`,
          remark: "Pi闪电战每日签到奖励"
        });
      }
    }
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
  listAdminEngagementClaims,
  listUserEngagementAssetRewardRows
};
