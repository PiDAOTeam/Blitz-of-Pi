const { query } = require("../db/mysql");

let schemaReady = false;

function executor(connection) {
  return connection || {
    execute: (sql, params) => query(sql, params).then((rows) => [rows])
  };
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
      total_qualification_reward DECIMAL(18, 8) NOT NULL DEFAULT 0,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`
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
       (reward_no, inviter_uid, invitee_uid, reward_type, amount, status)
     VALUES (?, ?, ?, 'qualification', ?, 'claimable')`,
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
  { inviterUid, inviteeUid, roomNo, levelKey, amount, rate },
  connection = null
) {
  await ensureGrowthSchema();
  const rewardNo = `INVC${Date.now()}${Math.random().toString(16).slice(2, 10).toUpperCase()}`;

  await executor(connection).execute(
    `INSERT IGNORE INTO invite_rewards
       (reward_no, inviter_uid, invitee_uid, battle_room_no, reward_type, level_key, amount, rate, status, claimed_at)
     VALUES (?, ?, ?, ?, 'battle_commission', ?, ?, ?, 'claimed', NOW())`,
    [rewardNo, inviterUid, inviteeUid, roomNo, levelKey || "", amount, rate || 0]
  );

  return findBattleCommissionReward(roomNo, inviterUid, inviteeUid, connection);
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

async function incrementCommissionStats(inviterUid, amount, connection = null) {
  await ensureInviteStats(inviterUid, connection);
  await executor(connection).execute(
    `UPDATE invite_stats
     SET paid_battle_count = paid_battle_count + 1,
         total_commission = total_commission + ?
     WHERE uid = ?`,
    [amount, inviterUid]
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
  findQualificationReward,
  createQualificationReward,
  listClaimableRewards,
  markRewardClaimed,
  findBattleCommissionReward,
  createBattleCommissionReward,
  listInviteRewardsForInviter,
  incrementQualifiedInvite,
  incrementCommissionStats,
  incrementQualificationRewardStats,
  updateInviteLevel,
  getInviteDashboard,
  listInviteRelations,
  listInviteRewards
};
