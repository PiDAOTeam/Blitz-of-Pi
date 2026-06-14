const { query, transaction } = require("../db/mysql");

let schemaReady = false;

function executor(connection) {
  return connection || {
    execute: (sql, params) => query(sql, params).then((rows) => [rows])
  };
}

async function ignoreDuplicateColumn(sql, connection = null) {
  try {
    await executor(connection).execute(sql);
  } catch (error) {
    if (!/Duplicate column|ER_DUP_FIELDNAME|1060/i.test(String(error.message || error.code || ""))) {
      throw error;
    }
  }
}

async function ignoreSchemaChangeWarning(sql, connection = null) {
  try {
    await executor(connection).execute(sql);
  } catch (error) {
    if (!/Duplicate column|ER_DUP_FIELDNAME|1060/i.test(String(error.message || error.code || ""))) {
      throw error;
    }
  }
}

async function ensureInviteRewardAmountPrecision(connection = null) {
  const [rows] = await executor(connection).execute(
    `SELECT NUMERIC_PRECISION AS numeric_precision
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'invite_rewards'
       AND COLUMN_NAME = 'amount'
     LIMIT 1`
  );
  const precision = Number(rows[0]?.numeric_precision || 0);
  if (precision > 0 && precision < 20) {
    await ignoreSchemaChangeWarning("ALTER TABLE invite_rewards MODIFY amount DECIMAL(20, 8) NOT NULL", connection);
  }
}

async function ensureGrowthSchema() {
  if (schemaReady) return;

  await query(
    `CREATE TABLE IF NOT EXISTS wallet_transfer_orders (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      transfer_no VARCHAR(64) NOT NULL UNIQUE,
      from_uid VARCHAR(64) NOT NULL,
      to_uid VARCHAR(64) NOT NULL,
      amount DECIMAL(18, 8) NOT NULL,
      fee_amount DECIMAL(18, 8) NOT NULL DEFAULT 0,
      status VARCHAR(24) NOT NULL DEFAULT 'completed',
      remark VARCHAR(255) DEFAULT '',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      KEY idx_transfer_from_id (from_uid, id),
      KEY idx_transfer_to_id (to_uid, id),
      KEY idx_transfer_status_id (status, id)
    )`
  );

  await query(
    `CREATE TABLE IF NOT EXISTS invite_relations (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      invitee_uid VARCHAR(64) NOT NULL UNIQUE,
      inviter_uid VARCHAR(64) NOT NULL,
      status VARCHAR(24) NOT NULL DEFAULT 'active',
      bound_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      KEY idx_invite_inviter_id (inviter_uid, id),
      KEY idx_invite_status (status)
    )`
  );

  await query(
    `CREATE TABLE IF NOT EXISTS invite_stats (
      uid VARCHAR(64) PRIMARY KEY,
      level_key VARCHAR(32) NOT NULL DEFAULT 'starter',
      direct_invite_count INT NOT NULL DEFAULT 0,
      qualified_invite_count INT NOT NULL DEFAULT 0,
      paid_battle_count INT NOT NULL DEFAULT 0,
      total_commission DECIMAL(18, 8) NOT NULL DEFAULT 0,
      total_commission_pi DECIMAL(18, 8) NOT NULL DEFAULT 0,
      total_commission_points DECIMAL(20, 0) NOT NULL DEFAULT 0,
      total_commission_poc DECIMAL(20, 6) NOT NULL DEFAULT 0,
      total_qualification_reward DECIMAL(18, 8) NOT NULL DEFAULT 0,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`
  );
  await ignoreDuplicateColumn("ALTER TABLE invite_stats ADD COLUMN total_commission_pi DECIMAL(18, 8) NOT NULL DEFAULT 0 AFTER total_commission");
  await ignoreDuplicateColumn("ALTER TABLE invite_stats ADD COLUMN total_commission_points DECIMAL(20, 0) NOT NULL DEFAULT 0 AFTER total_commission_pi");
  await ignoreDuplicateColumn("ALTER TABLE invite_stats ADD COLUMN total_commission_poc DECIMAL(20, 6) NOT NULL DEFAULT 0 AFTER total_commission_points");
  await query(
    `UPDATE invite_stats
     SET total_commission_pi = total_commission
     WHERE total_commission_pi = 0
       AND total_commission > 0`
  );

  await query(
    `CREATE TABLE IF NOT EXISTS invite_rewards (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      reward_no VARCHAR(64) NOT NULL UNIQUE,
      inviter_uid VARCHAR(64) NOT NULL,
      invitee_uid VARCHAR(64) DEFAULT '',
      battle_room_no VARCHAR(64) DEFAULT '',
      reward_type VARCHAR(32) NOT NULL,
      level_key VARCHAR(32) DEFAULT '',
      asset_type VARCHAR(20) NOT NULL DEFAULT 'PI',
      amount DECIMAL(18, 8) NOT NULL,
      rate DECIMAL(8, 6) NOT NULL DEFAULT 0,
      status VARCHAR(24) NOT NULL DEFAULT 'claimable',
      claimed_at DATETIME DEFAULT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uk_invite_reward_once (reward_type, invitee_uid, battle_room_no),
      KEY idx_invite_reward_inviter_id (inviter_uid, id),
      KEY idx_invite_reward_status (status)
    )`
  );
  await ignoreDuplicateColumn("ALTER TABLE invite_rewards ADD COLUMN asset_type VARCHAR(20) NOT NULL DEFAULT 'PI' AFTER level_key");
  await ensureInviteRewardAmountPrecision();

  await query(
    `CREATE TABLE IF NOT EXISTS invite_commission_reward_jobs (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      reward_no VARCHAR(64) NOT NULL UNIQUE,
      inviter_uid VARCHAR(64) NOT NULL,
      invitee_uid VARCHAR(64) NOT NULL DEFAULT '',
      battle_room_no VARCHAR(64) NOT NULL DEFAULT '',
      asset_type VARCHAR(20) NOT NULL,
      amount DECIMAL(20, 8) NOT NULL DEFAULT 0,
      external_order_no VARCHAR(128) NOT NULL,
      idempotency_key VARCHAR(160) NOT NULL,
      remark VARCHAR(255) NOT NULL DEFAULT '',
      status VARCHAR(32) NOT NULL DEFAULT 'queued',
      attempts INT NOT NULL DEFAULT 0,
      max_attempts INT NOT NULL DEFAULT 5,
      next_retry_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      locked_at DATETIME DEFAULT NULL,
      processed_at DATETIME DEFAULT NULL,
      last_error VARCHAR(255) NOT NULL DEFAULT '',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uk_invite_commission_job_idem (idempotency_key),
      KEY idx_invite_commission_job_status (status, next_retry_at, id),
      KEY idx_invite_commission_job_inviter_id (inviter_uid, id)
    )`
  );

  schemaReady = true;
}

async function findUserByPiUsername(keyword, connection = null) {
  await ensureGrowthSchema();
  const value = String(keyword || "").trim().replace(/^@+/, "");
  if (!value) return null;
  const lowerValue = value.toLowerCase();

  const [rows] = await executor(connection).execute(
    `SELECT u.uid, u.pi_username, u.nickname, u.avatar_key, u.status,
            COALESCE(r.rank_name, u.rank_name) AS rank_name,
            COALESCE(w.available_balance, 0) AS available_balance
     FROM users u
     LEFT JOIN user_ranks r ON r.uid = u.uid
     LEFT JOIN wallets w ON w.uid = u.uid
     WHERE LOWER(u.pi_username) = ? OR u.uid = ?
     LIMIT 1`,
    [lowerValue, value]
  );

  return rows[0] || null;
}

async function searchUsers(keyword, limit = 8) {
  await ensureGrowthSchema();
  const value = String(keyword || "").trim().replace(/^@+/, "");
  if (value.length < 2) return [];
  const safeLimit = Math.min(20, Math.max(1, Number.parseInt(String(limit), 10) || 8));

  return query(
    `SELECT u.uid, u.pi_username, u.nickname, u.avatar_key, u.status,
            COALESCE(r.rank_name, u.rank_name) AS rank_name
     FROM users u
     LEFT JOIN user_ranks r ON r.uid = u.uid
     WHERE u.status = 1
       AND (
         u.pi_username LIKE ?
         OR u.nickname LIKE ?
         OR u.uid = ?
       )
     ORDER BY u.last_login_at DESC, u.id DESC
     LIMIT ${safeLimit}`,
    [`%${value}%`, `%${value}%`, value]
  );
}

async function createTransferOrder(order, connection = null) {
  await ensureGrowthSchema();
  await executor(connection).execute(
    `INSERT INTO wallet_transfer_orders
       (transfer_no, from_uid, to_uid, amount, fee_amount, status, remark)
     VALUES (?, ?, ?, ?, ?, 'completed', ?)`,
    [
      order.transferNo,
      order.fromUid,
      order.toUid,
      order.amount,
      order.feeAmount || 0,
      order.remark || ""
    ]
  );

  return findTransferOrder(order.transferNo, connection);
}

async function findTransferOrder(transferNo, connection = null) {
  await ensureGrowthSchema();
  const [rows] = await executor(connection).execute(
    `SELECT t.*, fu.pi_username AS from_pi_username, fu.nickname AS from_nickname, fu.avatar_key AS from_avatar_key,
            tu.pi_username AS to_pi_username, tu.nickname AS to_nickname, tu.avatar_key AS to_avatar_key
     FROM wallet_transfer_orders t
     LEFT JOIN users fu ON fu.uid = t.from_uid
     LEFT JOIN users tu ON tu.uid = t.to_uid
     WHERE t.transfer_no = ?
     LIMIT 1`,
    [transferNo]
  );

  return rows[0] || null;
}

async function listTransfers(uid = "", limit = 80) {
  await ensureGrowthSchema();
  const safeLimit = Math.min(200, Math.max(1, Number.parseInt(String(limit), 10) || 80));
  const params = [];
  let where = "";

  if (uid) {
    where = "WHERE t.from_uid = ? OR t.to_uid = ?";
    params.push(uid, uid);
  }

  return query(
    `SELECT t.*, fu.pi_username AS from_pi_username, fu.nickname AS from_nickname, fu.avatar_key AS from_avatar_key,
            tu.pi_username AS to_pi_username, tu.nickname AS to_nickname, tu.avatar_key AS to_avatar_key
     FROM wallet_transfer_orders t
     LEFT JOIN users fu ON fu.uid = t.from_uid
     LEFT JOIN users tu ON tu.uid = t.to_uid
     ${where}
     ORDER BY t.id DESC
     LIMIT ${safeLimit}`,
    params
  );
}

async function getTodayTransferAmount(uid, connection = null) {
  await ensureGrowthSchema();
  const [rows] = await executor(connection).execute(
    `SELECT COALESCE(SUM(amount + fee_amount), 0) AS total
     FROM wallet_transfer_orders
     WHERE from_uid = ?
       AND status = 'completed'
       AND created_at >= CURDATE()`,
    [uid]
  );

  return Number(rows[0]?.total || 0);
}

async function getLatestTransfer(uid, connection = null) {
  await ensureGrowthSchema();
  const [rows] = await executor(connection).execute(
    `SELECT *
     FROM wallet_transfer_orders
     WHERE from_uid = ?
       AND status = 'completed'
     ORDER BY id DESC
     LIMIT 1`,
    [uid]
  );

  return rows[0] || null;
}

async function ensureInviteStats(uid, connection = null) {
  await ensureGrowthSchema();
  await executor(connection).execute(
    `INSERT INTO invite_stats (uid)
     VALUES (?)
     ON DUPLICATE KEY UPDATE uid = VALUES(uid)`,
    [uid]
  );

  const [rows] = await executor(connection).execute("SELECT * FROM invite_stats WHERE uid = ? LIMIT 1", [uid]);
  return rows[0] || null;
}

async function findInviteRelationByInvitee(inviteeUid, connection = null) {
  await ensureGrowthSchema();
  const [rows] = await executor(connection).execute(
    `SELECT r.*, u.pi_username AS inviter_pi_username, u.nickname AS inviter_nickname, u.avatar_key AS inviter_avatar_key
     FROM invite_relations r
     LEFT JOIN users u ON u.uid = r.inviter_uid
     WHERE r.invitee_uid = ?
     LIMIT 1`,
    [inviteeUid]
  );

  return rows[0] || null;
}

async function createInviteRelation(inviterUid, inviteeUid, connection = null) {
  await ensureGrowthSchema();
  await executor(connection).execute(
    `INSERT INTO invite_relations (inviter_uid, invitee_uid, status)
     VALUES (?, ?, 'active')`,
    [inviterUid, inviteeUid]
  );

  await executor(connection).execute(
    `INSERT INTO invite_stats (uid, direct_invite_count)
     VALUES (?, 1)
     ON DUPLICATE KEY UPDATE direct_invite_count = direct_invite_count + 1`,
    [inviterUid]
  );

  await ensureInviteStats(inviteeUid, connection);
  return findInviteRelationByInvitee(inviteeUid, connection);
}

async function countFinishedBattles(uid, connection = null) {
  await ensureGrowthSchema();
  const [rows] = await executor(connection).execute(
    `SELECT COUNT(*) AS total
     FROM battle_rooms
     WHERE status = 'finished'
       AND (player_a_uid = ? OR player_b_uid = ?)
       AND is_bot_room = 0`,
    [uid, uid]
  );

  return Number(rows[0]?.total || 0);
}

async function countFinishedBattlesForInviteTrial(uid, connection = null) {
  await ensureGrowthSchema();
  const [rows] = await executor(connection).execute(
    `SELECT COUNT(*) AS total
     FROM battle_rooms
     WHERE status = 'finished'
       AND (player_a_uid = ? OR player_b_uid = ?)`,
    [uid, uid]
  );

  return Number(rows[0]?.total || 0);
}

async function findQualificationReward(inviteeUid, connection = null) {
  await ensureGrowthSchema();
  const [rows] = await executor(connection).execute(
    "SELECT * FROM invite_rewards WHERE reward_type = 'qualification' AND invitee_uid = ? LIMIT 1",
    [inviteeUid]
  );

  return rows[0] || null;
}

async function createQualificationReward({ inviterUid, inviteeUid, amount }, connection = null) {
  await ensureGrowthSchema();
  const rewardNo = `INVQ${Date.now()}${Math.random().toString(16).slice(2, 10).toUpperCase()}`;

  await executor(connection).execute(
    `INSERT IGNORE INTO invite_rewards
       (reward_no, inviter_uid, invitee_uid, reward_type, asset_type, amount, status)
     VALUES (?, ?, ?, 'qualification', 'PI', ?, 'claimable')`,
    [rewardNo, inviterUid, inviteeUid, amount]
  );

  return findQualificationReward(inviteeUid, connection);
}

async function listClaimableRewards(inviterUid, connection = null) {
  await ensureGrowthSchema();
  const [rows] = await executor(connection).execute(
    `SELECT r.*, u.pi_username AS invitee_pi_username, u.nickname AS invitee_nickname, u.avatar_key AS invitee_avatar_key
     FROM invite_rewards r
     LEFT JOIN users u ON u.uid = r.invitee_uid
     WHERE r.inviter_uid = ?
       AND r.status = 'claimable'
     ORDER BY r.id ASC`,
    [inviterUid]
  );

  return rows;
}

async function markRewardClaimed(rewardNo, connection = null) {
  await ensureGrowthSchema();
  await executor(connection).execute(
    `UPDATE invite_rewards
     SET status = 'claimed',
         claimed_at = NOW()
     WHERE reward_no = ?
       AND status = 'claimable'`,
    [rewardNo]
  );

  const [rows] = await executor(connection).execute(
    "SELECT * FROM invite_rewards WHERE reward_no = ? LIMIT 1",
    [rewardNo]
  );
  return rows[0] || null;
}

async function findBattleCommissionReward(roomNo, inviterUid, inviteeUid = "", connection = null) {
  await ensureGrowthSchema();
  const [rows] = await executor(connection).execute(
    `SELECT * FROM invite_rewards
     WHERE reward_type = 'battle_commission'
       AND battle_room_no = ?
       AND inviter_uid = ?
       AND invitee_uid = ?
      LIMIT 1`,
    [roomNo, inviterUid, inviteeUid]
  );
  return rows[0] || null;
}

async function createBattleCommissionReward(
  { inviterUid, inviteeUid, roomNo, levelKey, assetType = "PI", amount, rate, status = "claimed" },
  connection = null
) {
  await ensureGrowthSchema();
  const rewardNo = `INVC${Date.now()}${Math.random().toString(16).slice(2, 10).toUpperCase()}`;
  const safeStatus = String(status || "claimed");
  const claimedAtSql = safeStatus === "claimed" ? "NOW()" : "NULL";

  await executor(connection).execute(
    `INSERT IGNORE INTO invite_rewards
       (reward_no, inviter_uid, invitee_uid, battle_room_no, reward_type, level_key, asset_type, amount, rate, status, claimed_at)
     VALUES (?, ?, ?, ?, 'battle_commission', ?, ?, ?, ?, ?, ${claimedAtSql})`,
    [rewardNo, inviterUid, inviteeUid, roomNo, levelKey || "", assetType, amount, rate || 0, safeStatus]
  );

  return findBattleCommissionReward(roomNo, inviterUid, inviteeUid, connection);
}

async function enqueueInviteCommissionRewardJob(reward, connection = null) {
  await ensureGrowthSchema();
  const rewardNo = reward.reward_no || reward.rewardNo;
  const assetType = String(reward.asset_type || reward.assetType || "").toUpperCase();
  if (!rewardNo || !["POINTS", "POC"].includes(assetType)) return false;

  const orderNo = `invite_commission:${rewardNo}:${assetType}`;
  const [result] = await executor(connection).execute(
    `INSERT IGNORE INTO invite_commission_reward_jobs
       (reward_no, inviter_uid, invitee_uid, battle_room_no, asset_type, amount,
        external_order_no, idempotency_key, remark, status, next_retry_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'queued', NOW())`,
    [
      rewardNo,
      reward.inviter_uid || reward.inviterUid,
      reward.invitee_uid || reward.inviteeUid || "",
      reward.battle_room_no || reward.roomNo || "",
      assetType,
      reward.amount || 0,
      orderNo,
      orderNo,
      reward.remark || "Pi闪电战邀请对战提成"
    ]
  );
  return Number(result?.affectedRows || 0) > 0;
}

async function listInviteRewardsForInviter(inviterUid, limit = 20, connection = null) {
  await ensureGrowthSchema();
  const safeLimit = Math.min(100, Math.max(1, Number.parseInt(String(limit), 10) || 20));
  const [rows] = await executor(connection).execute(
    `SELECT r.*, u.pi_username AS invitee_pi_username, u.nickname AS invitee_nickname, u.avatar_key AS invitee_avatar_key
     FROM invite_rewards r
     LEFT JOIN users u ON u.uid = r.invitee_uid
     WHERE r.inviter_uid = ?
     ORDER BY r.id DESC
     LIMIT ${safeLimit}`,
    [inviterUid]
  );

  return rows;
}

async function incrementQualifiedInvite(inviterUid, connection = null) {
  await ensureInviteStats(inviterUid, connection);
  await executor(connection).execute(
    "UPDATE invite_stats SET qualified_invite_count = qualified_invite_count + 1 WHERE uid = ?",
    [inviterUid]
  );
}

async function incrementCommissionStats(inviterUid, amount, assetType = "PI", connection = null) {
  await ensureInviteStats(inviterUid, connection);
  const normalizedAssetType = String(assetType || "PI").toUpperCase();
  const column =
    normalizedAssetType === "POINTS"
      ? "total_commission_points"
      : normalizedAssetType === "POC"
        ? "total_commission_poc"
        : "total_commission_pi";
  await executor(connection).execute(
    `UPDATE invite_stats
     SET paid_battle_count = paid_battle_count + 1,
         total_commission = total_commission + ?,
         ${column} = ${column} + ?
     WHERE uid = ?`,
    [normalizedAssetType === "PI" ? amount : 0, amount, inviterUid]
  );
}

async function incrementQualificationRewardStats(inviterUid, amount, connection = null) {
  await ensureInviteStats(inviterUid, connection);
  await executor(connection).execute(
    "UPDATE invite_stats SET total_qualification_reward = total_qualification_reward + ? WHERE uid = ?",
    [amount, inviterUid]
  );
}

async function updateInviteLevel(uid, levelKey, connection = null) {
  await ensureInviteStats(uid, connection);
  await executor(connection).execute("UPDATE invite_stats SET level_key = ? WHERE uid = ?", [levelKey, uid]);
}

async function getInviteDashboard(uid) {
  await ensureGrowthSchema();
  const stats = await ensureInviteStats(uid);
  const relation = await findInviteRelationByInvitee(uid);
  const rewards = await listClaimableRewards(uid);
  const rewardRows = await listInviteRewardsForInviter(uid, 20);
  const invitedRows = await query(
    `SELECT r.invitee_uid, r.bound_at, u.pi_username, u.nickname, u.avatar_key,
            COALESCE(ir.status, '') AS reward_status,
            COALESCE(ir.amount, 0) AS reward_amount
     FROM invite_relations r
     LEFT JOIN users u ON u.uid = r.invitee_uid
     LEFT JOIN invite_rewards ir ON ir.reward_type = 'qualification' AND ir.invitee_uid = r.invitee_uid
     WHERE r.inviter_uid = ?
     ORDER BY r.id DESC
     LIMIT 50`,
    [uid]
  );

  return {
    stats,
    relation,
    rewards,
    rewardRows,
    invitedRows
  };
}

async function listInviteRelations(limit = 100) {
  await ensureGrowthSchema();
  const safeLimit = Math.min(300, Math.max(1, Number.parseInt(String(limit), 10) || 100));

  return query(
    `SELECT r.*, iu.pi_username AS inviter_pi_username, iu.nickname AS inviter_nickname, iu.avatar_key AS inviter_avatar_key,
            eu.pi_username AS invitee_pi_username, eu.nickname AS invitee_nickname, eu.avatar_key AS invitee_avatar_key
     FROM invite_relations r
     LEFT JOIN users iu ON iu.uid = r.inviter_uid
     LEFT JOIN users eu ON eu.uid = r.invitee_uid
     ORDER BY r.id DESC
     LIMIT ${safeLimit}`
  );
}

async function listInviteRewards(limit = 100) {
  await ensureGrowthSchema();
  const safeLimit = Math.min(300, Math.max(1, Number.parseInt(String(limit), 10) || 100));

  return query(
    `SELECT r.*, iu.pi_username AS inviter_pi_username, iu.nickname AS inviter_nickname, iu.avatar_key AS inviter_avatar_key,
            eu.pi_username AS invitee_pi_username, eu.nickname AS invitee_nickname, eu.avatar_key AS invitee_avatar_key
     FROM invite_rewards r
     LEFT JOIN users iu ON iu.uid = r.inviter_uid
     LEFT JOIN users eu ON eu.uid = r.invitee_uid
     ORDER BY r.id DESC
     LIMIT ${safeLimit}`
  );
}

async function listInviteCommissionRewardJobs(limit = 100) {
  await ensureGrowthSchema();
  const safeLimit = Math.min(300, Math.max(1, Number.parseInt(String(limit), 10) || 100));

  return query(
    `SELECT j.*, iu.pi_user_id AS inviter_pi_user_id, iu.pi_username AS inviter_pi_username,
            iu.nickname AS inviter_nickname, iu.avatar_key AS inviter_avatar_key,
            eu.pi_username AS invitee_pi_username, eu.nickname AS invitee_nickname
     FROM invite_commission_reward_jobs j
     LEFT JOIN users iu ON iu.uid = j.inviter_uid
     LEFT JOIN users eu ON eu.uid = j.invitee_uid
     ORDER BY j.id DESC
     LIMIT ${safeLimit}`
  );
}

async function listInviteCommissionRewardCandidates(limit = 20) {
  await ensureGrowthSchema();
  const safeLimit = Math.min(50, Math.max(1, Number.parseInt(String(limit), 10) || 20));

  return query(
    `SELECT j.*, u.pi_user_id, u.pi_username, u.nickname, u.avatar_key
     FROM invite_commission_reward_jobs j
     LEFT JOIN users u ON u.uid = j.inviter_uid
     WHERE j.status IN ('queued', 'failed')
       AND j.attempts < j.max_attempts
       AND (j.next_retry_at IS NULL OR j.next_retry_at <= NOW())
     ORDER BY j.id ASC
     LIMIT ${safeLimit}`
  );
}

async function markInviteCommissionRewardProcessing(id) {
  await ensureGrowthSchema();
  const [result] = await executor().execute(
    `UPDATE invite_commission_reward_jobs
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

  const [rows] = await executor().execute(
    `SELECT j.*, u.pi_user_id, u.pi_username, u.nickname, u.avatar_key
     FROM invite_commission_reward_jobs j
     LEFT JOIN users u ON u.uid = j.inviter_uid
     WHERE j.id = ?
     LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}

async function markInviteCommissionRewardPaid(id) {
  await ensureGrowthSchema();
  return transaction(async (connection) => {
    const [rows] = await executor(connection).execute(
      "SELECT * FROM invite_commission_reward_jobs WHERE id = ? LIMIT 1 FOR UPDATE",
      [id]
    );
    const job = rows[0] || null;
    if (!job || job.status !== "processing") return null;

    const [result] = await executor(connection).execute(
      `UPDATE invite_commission_reward_jobs
       SET status = 'paid',
           processed_at = NOW(),
           last_error = ''
       WHERE id = ?
         AND status = 'processing'`,
      [id]
    );
    if (Number(result?.affectedRows || 0) < 1) return null;

    await executor(connection).execute(
      `UPDATE invite_rewards
       SET status = 'claimed',
           claimed_at = COALESCE(claimed_at, NOW())
       WHERE reward_no = ?`,
      [job.reward_no]
    );
    await incrementCommissionStats(job.inviter_uid, Number(job.amount || 0), job.asset_type, connection);
    return job;
  }, { label: "invite_commission.mark_paid" });
}

async function markInviteCommissionRewardFailed(id, errorMessage, { manualReview = false, nextRetrySeconds = 60 } = {}) {
  await ensureGrowthSchema();
  const status = manualReview ? "manual_review" : "failed";
  const [rows] = await executor().execute(
    "SELECT reward_no FROM invite_commission_reward_jobs WHERE id = ? LIMIT 1",
    [id]
  );
  const rewardNo = rows[0]?.reward_no || "";
  await executor().execute(
    `UPDATE invite_commission_reward_jobs
     SET status = ?,
         last_error = ?,
         next_retry_at = DATE_ADD(NOW(), INTERVAL ? SECOND)
     WHERE id = ?`,
    [status, String(errorMessage || "发放失败").slice(0, 255), Math.max(1, Number(nextRetrySeconds || 60)), id]
  );
  if (rewardNo) {
    await executor().execute("UPDATE invite_rewards SET status = ? WHERE reward_no = ?", [status, rewardNo]);
  }
}

async function resetStaleInviteCommissionRewardProcessing(staleMinutes = 10) {
  await ensureGrowthSchema();
  const [rows] = await executor().execute(
    `SELECT reward_no FROM invite_commission_reward_jobs
     WHERE status = 'processing'
       AND locked_at < DATE_SUB(NOW(), INTERVAL ? MINUTE)`,
    [Math.max(1, Number(staleMinutes || 10))]
  );
  const [result] = await executor().execute(
    `UPDATE invite_commission_reward_jobs
     SET status = 'failed',
         last_error = '发放任务超时，已回到失败队列等待重试',
         next_retry_at = NOW()
     WHERE status = 'processing'
       AND locked_at < DATE_SUB(NOW(), INTERVAL ? MINUTE)`,
    [Math.max(1, Number(staleMinutes || 10))]
  );
  for (const row of rows || []) {
    await executor().execute("UPDATE invite_rewards SET status = 'failed' WHERE reward_no = ?", [row.reward_no]);
  }
  return Number(result?.affectedRows || 0);
}

async function retryInviteCommissionRewardJob(id) {
  await ensureGrowthSchema();
  const [rows] = await executor().execute(
    "SELECT reward_no FROM invite_commission_reward_jobs WHERE id = ? LIMIT 1",
    [id]
  );
  const rewardNo = rows[0]?.reward_no || "";
  const [result] = await executor().execute(
    `UPDATE invite_commission_reward_jobs
     SET status = 'queued',
         next_retry_at = NOW(),
         last_error = ''
     WHERE id = ?
       AND status IN ('failed', 'manual_review', 'processing')`,
    [id]
  );
  const changed = Number(result?.affectedRows || 0) > 0;
  if (changed && rewardNo) {
    await executor().execute("UPDATE invite_rewards SET status = 'queued' WHERE reward_no = ?", [rewardNo]);
  }
  return changed;
}

async function getInviteCommissionRewardQueueStats() {
  await ensureGrowthSchema();
  const rows = await query(
    `SELECT
       COUNT(*) AS total,
       SUM(CASE WHEN status IN ('queued', 'failed') AND attempts < max_attempts THEN 1 ELSE 0 END) AS retryable,
       SUM(CASE WHEN status = 'queued' THEN 1 ELSE 0 END) AS queued,
       SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) AS failed,
       SUM(CASE WHEN status = 'manual_review' THEN 1 ELSE 0 END) AS manual_review,
       SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) AS processing,
       SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) AS paid
     FROM invite_commission_reward_jobs`
  );
  const row = rows[0] || {};

  return {
    total: Number(row.total || 0),
    retryable: Number(row.retryable || 0),
    queued: Number(row.queued || 0),
    failed: Number(row.failed || 0),
    manualReview: Number(row.manual_review || 0),
    processing: Number(row.processing || 0),
    paid: Number(row.paid || 0)
  };
}

async function listUserInviteCommissionAssetRows(uid, limit = 80) {
  await ensureGrowthSchema();
  const safeLimit = Math.min(120, Math.max(1, Number.parseInt(String(limit), 10) || 80));

  return query(
    `SELECT * FROM invite_rewards
     WHERE inviter_uid = ?
       AND reward_type = 'battle_commission'
       AND asset_type IN ('POINTS', 'POC')
       AND status = 'claimed'
     ORDER BY id DESC
     LIMIT ${safeLimit}`,
    [uid]
  );
}

async function getInviteStats(uid, connection = null) {
  await ensureGrowthSchema();
  const [rows] = await executor(connection).execute("SELECT * FROM invite_stats WHERE uid = ? LIMIT 1", [uid]);
  return rows[0] || null;
}

module.exports = {
  ensureGrowthSchema,
  findUserByPiUsername,
  searchUsers,
  createTransferOrder,
  listTransfers,
  getTodayTransferAmount,
  getLatestTransfer,
  ensureInviteStats,
  findInviteRelationByInvitee,
  createInviteRelation,
  countFinishedBattles,
  countFinishedBattlesForInviteTrial,
  findQualificationReward,
  createQualificationReward,
  listClaimableRewards,
  markRewardClaimed,
  findBattleCommissionReward,
  createBattleCommissionReward,
  enqueueInviteCommissionRewardJob,
  listInviteRewardsForInviter,
  incrementQualifiedInvite,
  incrementCommissionStats,
  incrementQualificationRewardStats,
  updateInviteLevel,
  getInviteDashboard,
  listInviteRelations,
  listInviteRewards,
  listInviteCommissionRewardJobs,
  listInviteCommissionRewardCandidates,
  markInviteCommissionRewardFailed,
  markInviteCommissionRewardPaid,
  markInviteCommissionRewardProcessing,
  resetStaleInviteCommissionRewardProcessing,
  retryInviteCommissionRewardJob,
  getInviteCommissionRewardQueueStats,
  listUserInviteCommissionAssetRows,
  getInviteStats
};
