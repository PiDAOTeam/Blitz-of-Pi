const { query, transaction } = require("../db/mysql");
const { readGameConfig } = require("./game-config.repository");
const { increaseBalance } = require("./wallet.repository");

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
      status VARCHAR(32) NOT NULL DEFAULT 'claimed',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uk_engagement_claim_once (uid, claim_date, claim_type, task_key),
      KEY idx_engagement_claim_date_id (claim_date, id),
      KEY idx_engagement_claim_uid_id (uid, id)
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

async function getTodayBattleStats(uid, config) {
  const modes = ["quick_battle", "points_battle", "poc_battle", "pi_battle", "ticket_battle", "rich_battle"];
  const placeholders = modes.map(() => "?").join(",");
  const rows = await query(
    `SELECT
       COUNT(*) AS battle_count,
       SUM(CASE WHEN winner_uid = ? THEN 1 ELSE 0 END) AS win_count,
       SUM(CASE WHEN entry_fee > 0 THEN 1 ELSE 0 END) AS paid_battle_count
     FROM battle_rooms
     WHERE status = 'finished'
       AND is_bot_room = 0
       AND DATE(finished_at) = CURDATE()
       AND (player_a_uid = ? OR player_b_uid = ?)
       AND mode IN (${placeholders})`,
    [uid, uid, uid, ...modes]
  );

  return {
    battle_count: Number(rows[0]?.battle_count || 0),
    win_count: Number(rows[0]?.win_count || 0),
    paid_battle_count: Number(rows[0]?.paid_battle_count || 0)
  };
}

function getTaskProgress(task, stats) {
  return Number(stats[task.condition] || 0);
}

function toClaimKey(claim) {
  return `${claim.claim_type}:${claim.task_key || ""}`;
}

function buildStatus(config, claims, stats) {
  const engagement = config.engagement || {};
  const claimSet = new Set(claims.map(toClaimKey));
  const dailySignIn = engagement.dailySignIn || {};
  const signInClaimed = claimSet.has("sign_in:");

  return {
    enabled: engagement.enabled !== false,
    today: new Date().toISOString().slice(0, 10),
    stats,
    dailySignIn: {
      enabled: engagement.enabled !== false && dailySignIn.enabled !== false,
      title: dailySignIn.title || "每日签到",
      rewardAmount: Number(dailySignIn.rewardAmount || 0),
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

async function insertClaim({ uid, claimType, taskKey = "", title, rewardAmount }, connection) {
  const [result] = await executor(connection).execute(
    `INSERT IGNORE INTO engagement_daily_claims
       (uid, claim_date, claim_type, task_key, title, reward_amount, status)
     VALUES (?, CURDATE(), ?, ?, ?, ?, 'claimed')`,
    [uid, claimType, taskKey, title, rewardAmount]
  );
  return Number(result?.affectedRows || 0) > 0;
}

async function claimDailySignIn(uid) {
  await ensureEngagementSchema();

  await transaction(async (connection) => {
    const config = await readGameConfig();
    const status = buildStatus(config, await listTodayClaims(uid, connection), await getTodayBattleStats(uid, config));
    const signIn = status.dailySignIn;

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
        rewardAmount: signIn.rewardAmount
      },
      connection
    );
    if (!inserted) {
      throw new Error("今日已签到");
    }

    if (signIn.rewardAmount > 0) {
      const today = await getTodayString(connection);
      await increaseBalance(
        uid,
        signIn.rewardAmount,
        {
          type: "daily_signin_reward",
          relatedType: "engagement_sign_in",
          relatedId: `${uid}:${today}`,
          remark: "每日签到奖励"
        },
        connection
      );
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
        rewardAmount: task.rewardAmount
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

module.exports = {
  claimDailySignIn,
  claimDailyTask,
  getEngagementStatus,
  listAdminEngagementClaims
};
