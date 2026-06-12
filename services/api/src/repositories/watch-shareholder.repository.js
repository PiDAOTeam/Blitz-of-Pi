const { query, transaction } = require("../db/mysql");

function executor(connection) {
  return connection || {
    execute: (sql, params) => query(sql, params).then((rows) => [rows])
  };
}

let schemaEnsured = false;

async function ensureWatchShareholderSchema() {
  if (schemaEnsured) return;

  await query(
    `CREATE TABLE IF NOT EXISTS watch_shareholder_periods (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      season_no VARCHAR(32) NOT NULL,
      start_at DATETIME NOT NULL,
      end_at DATETIME NOT NULL,
      status VARCHAR(32) NOT NULL DEFAULT 'settled',
      source_mode VARCHAR(32) NOT NULL DEFAULT 'points_battle',
      asset_type VARCHAR(16) NOT NULL DEFAULT 'POINTS',
      platform_fee_points BIGINT NOT NULL DEFAULT 0,
      share_rate DECIMAL(8,4) NOT NULL DEFAULT 0.5000,
      pool_points BIGINT NOT NULL DEFAULT 0,
      allocated_points BIGINT NOT NULL DEFAULT 0,
      paid_points BIGINT NOT NULL DEFAULT 0,
      unclaimed_points BIGINT NOT NULL DEFAULT 0,
      zero_reward_count INT NOT NULL DEFAULT 0,
      rounding_delta BIGINT NOT NULL DEFAULT 0,
      snapshot_user_count INT NOT NULL DEFAULT 0,
      snapshot_node_count INT NOT NULL DEFAULT 0,
      snapshot_at DATETIME NULL DEFAULT NULL,
      last_error VARCHAR(255) NOT NULL DEFAULT '',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uk_watch_shareholder_season (season_no),
      KEY idx_watch_shareholder_period_status (status, id),
      KEY idx_watch_shareholder_period_time (start_at, end_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci`
  );

  await query(
    `CREATE TABLE IF NOT EXISTS watch_shareholder_rewards (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      period_id BIGINT UNSIGNED NOT NULL,
      season_no VARCHAR(32) NOT NULL,
      hashpi_user_id BIGINT UNSIGNED NOT NULL DEFAULT 0,
      pi_uid VARCHAR(100) NOT NULL,
      pi_username VARCHAR(100) NOT NULL DEFAULT '',
      uid VARCHAR(64) NOT NULL DEFAULT '',
      node_count INT NOT NULL DEFAULT 0,
      raw_amount DECIMAL(20,8) NOT NULL DEFAULT 0,
      reward_points BIGINT NOT NULL DEFAULT 0,
      status VARCHAR(32) NOT NULL DEFAULT 'pending',
      external_order_no VARCHAR(128) NOT NULL DEFAULT '',
      idempotency_key VARCHAR(160) NOT NULL DEFAULT '',
      attempts INT NOT NULL DEFAULT 0,
      max_attempts INT NOT NULL DEFAULT 5,
      next_retry_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
      locked_at TIMESTAMP NULL DEFAULT NULL,
      claimed_at TIMESTAMP NULL DEFAULT NULL,
      processed_at TIMESTAMP NULL DEFAULT NULL,
      last_error VARCHAR(255) NOT NULL DEFAULT '',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uk_watch_shareholder_reward_user (season_no, pi_uid),
      UNIQUE KEY uk_watch_shareholder_reward_idem (idempotency_key),
      KEY idx_watch_shareholder_reward_period (period_id, id),
      KEY idx_watch_shareholder_reward_status (status, next_retry_at, id),
      KEY idx_watch_shareholder_reward_uid (uid, id),
      KEY idx_watch_shareholder_reward_pi_username (pi_username)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci`
  );

  schemaEnsured = true;
}

async function getMysqlDateTime(connection = null) {
  const [rows] = await executor(connection).execute("SELECT NOW() AS now_time");
  const value = rows[0]?.now_time;
  if (value instanceof Date) {
    return value;
  }
  return value ? new Date(value) : new Date();
}

function pad2(value) {
  return String(value).padStart(2, "0");
}

function formatDate(date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function formatDateTime(date) {
  return `${formatDate(date)} ${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())}`;
}

function getPreviousWeekRange(now = new Date()) {
  const base = new Date(now);
  base.setHours(0, 0, 0, 0);
  const day = base.getDay() || 7;
  const currentWeekMonday = new Date(base);
  currentWeekMonday.setDate(base.getDate() - day + 1);
  const start = new Date(currentWeekMonday);
  start.setDate(currentWeekMonday.getDate() - 7);
  const end = new Date(currentWeekMonday);
  end.setSeconds(-1);
  return {
    start,
    end,
    seasonNo: `${formatDate(start).replace(/-/g, "")}_${formatDate(end).replace(/-/g, "")}`
  };
}

async function getPreviousWeekRangeFromDb() {
  const now = await getMysqlDateTime();
  return getPreviousWeekRange(now);
}

async function sumPointsPlatformFee({ startAt, endAt, sourceMode = "points_battle" }) {
  await ensureWatchShareholderSchema();
  const rows = await query(
    `SELECT COALESCE(SUM(FLOOR(platform_fee_amount)), 0) AS total
     FROM battle_rooms
     WHERE mode = ?
       AND asset_type = 'POINTS'
       AND status = 'finished'
       AND is_bot_room = 0
       AND asset_settlement_status = 'settled'
       AND finished_at >= ?
       AND finished_at <= ?`,
    [sourceMode, startAt, endAt]
  );
  return Math.max(0, Math.floor(Number(rows[0]?.total || 0)));
}

async function mapUsersByPiIdentity(piUids = [], piUsernames = []) {
  const uidList = [...new Set(piUids.map((item) => String(item || "").trim()).filter(Boolean))];
  const usernameList = [...new Set(piUsernames.map((item) => String(item || "").trim()).filter(Boolean))];

  if (!uidList.length && !usernameList.length) return new Map();

  const clauses = [];
  const params = [];
  if (uidList.length) {
    clauses.push(`pi_user_id IN (${uidList.map(() => "?").join(",")})`);
    params.push(...uidList);
  }
  if (usernameList.length) {
    clauses.push(`pi_username IN (${usernameList.map(() => "?").join(",")})`);
    params.push(...usernameList);
  }

  const rows = await query(
    `SELECT uid, pi_user_id, pi_username
     FROM users
     WHERE ${clauses.join(" OR ")}`,
    params
  );
  const map = new Map();
  for (const row of rows) {
    if (row.pi_user_id) map.set(`uid:${row.pi_user_id}`, row.uid);
    if (row.pi_username) map.set(`name:${String(row.pi_username).toLowerCase()}`, row.uid);
  }
  return map;
}

function normalizeSnapshotUsers(users = []) {
  return (Array.isArray(users) ? users : [])
    .map((user) => ({
      hashpiUserId: Number(user.user_id || user.hashpi_user_id || 0),
      piUid: String(user.pi_uid || user.piUid || "").trim(),
      piUsername: String(user.pi_username || user.piUsername || user.username || "").trim(),
      nodeCount: Math.max(0, Math.floor(Number(user.node_count || user.nodeCount || 0)))
    }))
    .filter((user) => user.piUid && user.nodeCount > 0);
}

function allocateIntegerRewards({ poolPoints, users, minRewardPoints = 1 }) {
  const pool = Math.max(0, Math.floor(Number(poolPoints || 0)));
  const normalizedUsers = normalizeSnapshotUsers(users);
  const totalNodeCount = normalizedUsers.reduce((sum, user) => sum + user.nodeCount, 0);
  if (pool <= 0 || totalNodeCount <= 0) {
    return {
      totalNodeCount,
      allocatedPoints: 0,
      zeroRewardCount: normalizedUsers.length,
      roundingDelta: pool,
      rewards: normalizedUsers.map((user) => ({
        ...user,
        rawAmount: 0,
        rewardPoints: 0,
        status: "zero"
      }))
    };
  }

  const minReward = Math.max(1, Math.floor(Number(minRewardPoints || 1)));
  const rewards = normalizedUsers.map((user) => {
    const rawAmount = (pool * user.nodeCount) / totalNodeCount;
    const rounded = Math.round(rawAmount);
    const rewardPoints = rounded >= minReward ? rounded : 0;
    return {
      ...user,
      rawAmount,
      rewardPoints,
      fraction: rawAmount - Math.floor(rawAmount),
      status: rewardPoints > 0 ? "pending" : "zero"
    };
  });

  let allocatedPoints = rewards.reduce((sum, reward) => sum + reward.rewardPoints, 0);
  if (allocatedPoints > pool) {
    const candidates = rewards
      .filter((reward) => reward.rewardPoints > 0)
      .sort((a, b) => a.fraction - b.fraction || a.nodeCount - b.nodeCount || a.piUid.localeCompare(b.piUid));
    let index = 0;
    while (allocatedPoints > pool && candidates.length) {
      const reward = candidates[index % candidates.length];
      if (reward.rewardPoints > 0) {
        reward.rewardPoints -= 1;
        allocatedPoints -= 1;
        reward.status = reward.rewardPoints > 0 ? "pending" : "zero";
      }
      index += 1;
      if (index > candidates.length * (pool + 1)) break;
    }
  }

  allocatedPoints = rewards.reduce((sum, reward) => sum + reward.rewardPoints, 0);
  return {
    totalNodeCount,
    allocatedPoints,
    zeroRewardCount: rewards.filter((reward) => reward.rewardPoints <= 0).length,
    roundingDelta: pool - allocatedPoints,
    rewards: rewards.map(({ fraction, ...reward }) => reward)
  };
}

async function findPeriodBySeasonNo(seasonNo, connection = null) {
  await ensureWatchShareholderSchema();
  const [rows] = await executor(connection).execute(
    "SELECT * FROM watch_shareholder_periods WHERE season_no = ? LIMIT 1",
    [seasonNo]
  );
  return rows[0] || null;
}

async function createOrReplacePeriodWithRewards({
  seasonNo,
  startAt,
  endAt,
  sourceMode,
  platformFeePoints,
  shareRate,
  poolPoints,
  snapshot,
  allocation,
  force = false
}) {
  await ensureWatchShareholderSchema();

  return transaction(async (connection) => {
    const existing = await findPeriodBySeasonNo(seasonNo, connection);
    if (existing && !force) {
      return {
        period: existing,
        created: false,
        alreadyExists: true
      };
    }
    if (existing) {
      const [paidRows] = await executor(connection).execute(
        "SELECT COUNT(*) AS total FROM watch_shareholder_rewards WHERE period_id = ? AND status = 'paid'",
        [existing.id]
      );
      if (Number(paidRows[0]?.total || 0) > 0) {
        throw new Error("本期已有用户领取，不能重新生成");
      }
      await executor(connection).execute("DELETE FROM watch_shareholder_rewards WHERE period_id = ?", [existing.id]);
      await executor(connection).execute("DELETE FROM watch_shareholder_periods WHERE id = ?", [existing.id]);
    }

    const [periodResult] = await executor(connection).execute(
      `INSERT INTO watch_shareholder_periods
         (season_no, start_at, end_at, status, source_mode, asset_type, platform_fee_points, share_rate,
          pool_points, allocated_points, paid_points, unclaimed_points, zero_reward_count, rounding_delta,
          snapshot_user_count, snapshot_node_count, snapshot_at)
       VALUES (?, ?, ?, 'settled', ?, 'POINTS', ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?)`,
      [
        seasonNo,
        startAt,
        endAt,
        sourceMode,
        platformFeePoints,
        shareRate,
        poolPoints,
        allocation.allocatedPoints,
        allocation.allocatedPoints,
        allocation.zeroRewardCount,
        allocation.roundingDelta,
        Number(snapshot.user_count || allocation.rewards.length || 0),
        Number(snapshot.node_count || allocation.totalNodeCount || 0),
        snapshot.snapshot_at ? String(snapshot.snapshot_at).replace("T", " ").slice(0, 19) : formatDateTime(new Date())
      ]
    );
    const periodId = Number(periodResult.insertId || 0);
    const piUids = allocation.rewards.map((reward) => reward.piUid);
    const piUsernames = allocation.rewards.map((reward) => reward.piUsername);
    const userMap = await mapUsersByPiIdentity(piUids, piUsernames);

    for (const reward of allocation.rewards) {
      const uid =
        userMap.get(`uid:${reward.piUid}`) ||
        userMap.get(`name:${String(reward.piUsername || "").toLowerCase()}`) ||
        "";
      const orderNo = `watch_shareholder:${seasonNo}:${reward.piUid}:POINTS`;
      await executor(connection).execute(
        `INSERT INTO watch_shareholder_rewards
           (period_id, season_no, hashpi_user_id, pi_uid, pi_username, uid, node_count, raw_amount,
            reward_points, status, external_order_no, idempotency_key, next_retry_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          periodId,
          seasonNo,
          reward.hashpiUserId,
          reward.piUid,
          reward.piUsername,
          uid,
          reward.nodeCount,
          Number(reward.rawAmount || 0).toFixed(8),
          reward.rewardPoints,
          reward.rewardPoints > 0 ? "pending" : "zero",
          orderNo,
          orderNo
        ]
      );
    }

    const period = await findPeriodBySeasonNo(seasonNo, connection);
    return {
      period,
      created: true,
      alreadyExists: false
    };
  }, { label: "create-watch-shareholder-period" });
}

async function getLatestPeriod() {
  await ensureWatchShareholderSchema();
  const rows = await query("SELECT * FROM watch_shareholder_periods ORDER BY start_at DESC, id DESC LIMIT 1");
  return rows[0] || null;
}

async function listPeriods(limit = 20) {
  await ensureWatchShareholderSchema();
  const safeLimit = Math.min(80, Math.max(1, Number.parseInt(String(limit), 10) || 20));
  return query(`SELECT * FROM watch_shareholder_periods ORDER BY start_at DESC, id DESC LIMIT ${safeLimit}`);
}

async function listRewards({ periodId = 0, uid = "", piUid = "", status = "", limit = 200 } = {}) {
  await ensureWatchShareholderSchema();
  const clauses = [];
  const params = [];
  if (periodId) {
    clauses.push("r.period_id = ?");
    params.push(Number(periodId));
  }
  if (uid) {
    clauses.push("r.uid = ?");
    params.push(uid);
  }
  if (piUid) {
    clauses.push("r.pi_uid = ?");
    params.push(piUid);
  }
  if (status) {
    clauses.push("r.status = ?");
    params.push(status);
  }
  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const safeLimit = Math.min(500, Math.max(1, Number.parseInt(String(limit), 10) || 200));

  return query(
    `SELECT r.*, u.nickname, u.avatar_key
     FROM watch_shareholder_rewards r
     LEFT JOIN users u ON u.uid = r.uid
     ${where}
     ORDER BY r.period_id DESC, r.reward_points DESC, r.id ASC
     LIMIT ${safeLimit}`,
    params
  );
}

async function getUserSummary(uid) {
  await ensureWatchShareholderSchema();
  const periods = await query(
    `SELECT
       COUNT(*) AS period_count,
       SUM(CASE WHEN status IN ('pending', 'queued', 'failed', 'manual_review') AND reward_points > 0 THEN 1 ELSE 0 END) AS unclaimed_count,
       COALESCE(SUM(CASE WHEN status IN ('pending', 'queued', 'failed', 'manual_review') THEN reward_points ELSE 0 END), 0) AS claimable_points,
       COALESCE(SUM(CASE WHEN status = 'paid' THEN reward_points ELSE 0 END), 0) AS paid_points,
       COALESCE(MAX(node_count), 0) AS latest_node_count
     FROM watch_shareholder_rewards
     WHERE uid = ?`,
    [uid]
  );
  return {
    periodCount: Number(periods[0]?.period_count || 0),
    unclaimedCount: Number(periods[0]?.unclaimed_count || 0),
    claimablePoints: Number(periods[0]?.claimable_points || 0),
    paidPoints: Number(periods[0]?.paid_points || 0),
    latestNodeCount: Number(periods[0]?.latest_node_count || 0)
  };
}

async function linkRewardsForUser(user = {}) {
  await ensureWatchShareholderSchema();
  const uid = String(user.uid || "").trim();
  const piUid = String(user.piUserId || user.pi_user_id || "").trim();
  const piUsername = String(user.piUsername || user.pi_username || "").trim();

  if (!uid || (!piUid && !piUsername)) return 0;

  const clauses = [];
  const params = [];
  if (piUid) {
    clauses.push("pi_uid = ?");
    params.push(piUid);
  }
  if (piUsername) {
    clauses.push("LOWER(pi_username) = LOWER(?)");
    params.push(piUsername);
  }

  const result = await query(
    `UPDATE watch_shareholder_rewards
     SET uid = ?
     WHERE (uid = '' OR uid IS NULL)
       AND (${clauses.join(" OR ")})`,
    [uid, ...params]
  );
  return Number(result?.affectedRows || 0);
}

async function listUserRewards(uid, limit = 20) {
  return listRewards({ uid, limit });
}

async function markRewardProcessing(id) {
  await ensureWatchShareholderSchema();
  const result = await query(
    `UPDATE watch_shareholder_rewards
     SET status = 'processing',
         attempts = attempts + 1,
         locked_at = NOW(),
         last_error = ''
     WHERE id = ?
       AND reward_points > 0
       AND status IN ('pending', 'queued', 'failed')
       AND attempts < max_attempts`,
    [id]
  );
  if (Number(result?.affectedRows || 0) < 1) return null;
  const rows = await query(
    `SELECT r.*, u.pi_user_id, u.pi_username AS local_pi_username, u.nickname
     FROM watch_shareholder_rewards r
     LEFT JOIN users u ON u.uid = r.uid
     WHERE r.id = ?
     LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}

async function markRewardPaid(id) {
  await ensureWatchShareholderSchema();
  await transaction(async (connection) => {
    const [rows] = await executor(connection).execute(
      "SELECT * FROM watch_shareholder_rewards WHERE id = ? FOR UPDATE",
      [id]
    );
    const reward = rows[0];
    if (!reward || reward.status === "paid") return;
    await executor(connection).execute(
      `UPDATE watch_shareholder_rewards
       SET status = 'paid',
           claimed_at = NOW(),
           processed_at = NOW(),
           last_error = ''
       WHERE id = ?`,
      [id]
    );
    await executor(connection).execute(
      `UPDATE watch_shareholder_periods
       SET paid_points = paid_points + ?,
           unclaimed_points = GREATEST(0, unclaimed_points - ?)
       WHERE id = ?`,
      [Number(reward.reward_points || 0), Number(reward.reward_points || 0), Number(reward.period_id || 0)]
    );
  }, { label: "mark-watch-shareholder-paid" });
}

async function markRewardFailed(id, errorMessage, { manualReview = false, nextRetrySeconds = 60 } = {}) {
  await ensureWatchShareholderSchema();
  const status = manualReview ? "manual_review" : "failed";
  await query(
    `UPDATE watch_shareholder_rewards
     SET status = ?,
         last_error = ?,
         next_retry_at = DATE_ADD(NOW(), INTERVAL ? SECOND)
     WHERE id = ?`,
    [status, String(errorMessage || "发放失败").slice(0, 255), Math.max(1, Number(nextRetrySeconds || 60)), id]
  );
}

async function retryReward(id) {
  await ensureWatchShareholderSchema();
  const result = await query(
    `UPDATE watch_shareholder_rewards
     SET status = 'queued',
         next_retry_at = NOW(),
         last_error = ''
     WHERE id = ?
       AND reward_points > 0
       AND status IN ('failed', 'manual_review', 'processing')`,
    [id]
  );
  return Number(result?.affectedRows || 0) > 0;
}

async function listRewardCandidates(limit = 20) {
  await ensureWatchShareholderSchema();
  const safeLimit = Math.min(50, Math.max(1, Number.parseInt(String(limit), 10) || 20));
  return query(
    `SELECT r.*, u.pi_user_id, u.pi_username AS local_pi_username, u.nickname
     FROM watch_shareholder_rewards r
     LEFT JOIN users u ON u.uid = r.uid
     WHERE r.reward_points > 0
       AND r.status IN ('pending', 'queued', 'failed')
       AND r.attempts < r.max_attempts
       AND (r.next_retry_at IS NULL OR r.next_retry_at <= NOW())
     ORDER BY r.id ASC
     LIMIT ${safeLimit}`
  );
}

async function resetStaleProcessing(staleMinutes = 10) {
  await ensureWatchShareholderSchema();
  const result = await query(
    `UPDATE watch_shareholder_rewards
     SET status = 'failed',
         last_error = '发放任务超时，已回到失败队列等待重试',
         next_retry_at = NOW()
     WHERE status = 'processing'
       AND locked_at < DATE_SUB(NOW(), INTERVAL ? MINUTE)`,
    [Math.max(1, Number(staleMinutes || 10))]
  );
  return Number(result?.affectedRows || 0);
}

async function getAdminOverviewStats() {
  await ensureWatchShareholderSchema();
  const rows = await query(
    `SELECT
       COUNT(*) AS reward_rows,
       COALESCE(SUM(CASE WHEN status IN ('pending', 'queued', 'failed', 'manual_review') THEN reward_points ELSE 0 END), 0) AS pending_points,
       COALESCE(SUM(CASE WHEN status = 'paid' THEN reward_points ELSE 0 END), 0) AS paid_points,
       SUM(CASE WHEN status IN ('failed', 'manual_review', 'processing') THEN 1 ELSE 0 END) AS failed_count
     FROM watch_shareholder_rewards`
  );
  return {
    rewardRows: Number(rows[0]?.reward_rows || 0),
    pendingPoints: Number(rows[0]?.pending_points || 0),
    paidPoints: Number(rows[0]?.paid_points || 0),
    failedCount: Number(rows[0]?.failed_count || 0)
  };
}

module.exports = {
  allocateIntegerRewards,
  createOrReplacePeriodWithRewards,
  ensureWatchShareholderSchema,
  findPeriodBySeasonNo,
  formatDateTime,
  getAdminOverviewStats,
  getLatestPeriod,
  getPreviousWeekRangeFromDb,
  getUserSummary,
  linkRewardsForUser,
  listPeriods,
  listRewardCandidates,
  listRewards,
  listUserRewards,
  markRewardFailed,
  markRewardPaid,
  markRewardProcessing,
  resetStaleProcessing,
  retryReward,
  sumPointsPlatformFee
};
