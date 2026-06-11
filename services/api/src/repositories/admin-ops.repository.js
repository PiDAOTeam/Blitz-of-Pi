const { query } = require("../db/mysql");

async function listUsers(limit = 80) {
  const safeLimit = Math.min(200, Math.max(1, Number.parseInt(String(limit), 10) || 80));

  return query(
    `SELECT u.uid, u.pi_user_id, u.pi_username, u.nickname, u.avatar_url, u.avatar_key,
            u.profile_completed, COALESCE(r.rank_name, u.rank_name) AS rank_name,
            COALESCE(r.rank_key, 'bronze') AS rank_key,
            COALESCE(r.stars, 0) AS stars,
            COALESCE(r.win_streak, 0) AS win_streak,
            u.status, u.last_login_at, u.created_at,
            COALESCE(w.available_balance, 0) AS available_balance,
            COALESCE(w.locked_balance, 0) AS locked_balance,
            COALESCE(w.total_recharge, 0) AS total_recharge,
            COALESCE(w.total_withdraw, 0) AS total_withdraw,
            COALESCE(w.total_reward, 0) AS total_reward
     FROM users u
     LEFT JOIN wallets w ON w.uid = u.uid
     LEFT JOIN user_ranks r ON r.uid = u.uid
     ORDER BY u.id DESC
     LIMIT ${safeLimit}`
  );
}

async function getUserSummary() {
  const rows = await query(
    `SELECT
       COUNT(*) AS total,
       SUM(CASE WHEN COALESCE(u.status, 1) = 1 THEN 1 ELSE 0 END) AS normal,
       SUM(CASE WHEN COALESCE(u.status, 1) <> 1 THEN 1 ELSE 0 END) AS banned,
       SUM(CASE WHEN COALESCE(u.profile_completed, 0) = 0 THEN 1 ELSE 0 END) AS profile_missing,
       SUM(CASE WHEN COALESCE(u.profile_completed, 0) = 1 THEN 1 ELSE 0 END) AS profile_completed,
       SUM(CASE WHEN COALESCE(w.locked_balance, 0) > 0 THEN 1 ELSE 0 END) AS locked_balance
     FROM users u
     LEFT JOIN wallets w ON w.uid = u.uid`
  );
  const summary = rows[0] || {};

  return {
    total: Number(summary.total || 0),
    normal: Number(summary.normal || 0),
    banned: Number(summary.banned || 0),
    profileMissing: Number(summary.profile_missing || 0),
    profileCompleted: Number(summary.profile_completed || 0),
    lockedBalance: Number(summary.locked_balance || 0)
  };
}

async function listWallets(limit = 80) {
  const safeLimit = Math.min(200, Math.max(1, Number.parseInt(String(limit), 10) || 80));

  return query(
    `SELECT w.uid, u.pi_username, u.nickname, u.avatar_key,
            w.available_balance, w.locked_balance, w.total_recharge, w.total_withdraw,
            w.total_reward, w.status, w.created_at, w.updated_at
     FROM wallets w
     LEFT JOIN users u ON u.uid = w.uid
     ORDER BY w.id DESC
     LIMIT ${safeLimit}`
  );
}

async function listRecentLedgers(limit = 100) {
  const safeLimit = Math.min(300, Math.max(1, Number.parseInt(String(limit), 10) || 100));

  return query(
    `SELECT l.id, l.uid, u.pi_username, u.nickname, u.avatar_key,
            l.type, l.direction, l.amount, l.balance_after, l.related_type, l.related_id, l.remark, l.created_at
     FROM wallet_ledgers l
     LEFT JOIN users u ON u.uid = l.uid
     ORDER BY l.id DESC
     LIMIT ${safeLimit}`
  );
}

async function updateUserByAdmin(uid, payload) {
  const { adminUpdateUserProfile } = require("./user.repository");
  return adminUpdateUserProfile(uid, payload);
}

async function findAdminUserDetail(uid) {
  const rows = await query(
    `SELECT u.uid, u.pi_user_id, u.pi_username, u.nickname, u.avatar_url, u.avatar_key,
            u.profile_completed, COALESCE(r.rank_name, u.rank_name) AS rank_name,
            COALESCE(r.rank_key, 'bronze') AS rank_key,
            COALESCE(r.stars, 0) AS stars,
            COALESCE(r.win_streak, 0) AS win_streak,
            u.status, u.last_login_at, u.created_at,
            COALESCE(w.available_balance, 0) AS available_balance,
            COALESCE(w.locked_balance, 0) AS locked_balance,
            COALESCE(w.total_recharge, 0) AS total_recharge,
            COALESCE(w.total_withdraw, 0) AS total_withdraw,
            COALESCE(w.total_reward, 0) AS total_reward
     FROM users u
     LEFT JOIN wallets w ON w.uid = u.uid
     LEFT JOIN user_ranks r ON r.uid = u.uid
     WHERE u.uid = ?
     LIMIT 1`,
    [uid]
  );

  return rows[0] || null;
}

async function listUserLedgers(uid, limit = 80) {
  const safeLimit = Math.min(200, Math.max(1, Number.parseInt(String(limit), 10) || 80));

  return query(
    `SELECT id, uid, type, direction, amount, balance_after, related_type, related_id, remark, created_at
     FROM wallet_ledgers
     WHERE uid = ?
     ORDER BY id DESC
     LIMIT ${safeLimit}`,
    [uid]
  );
}

module.exports = {
  listUsers,
  getUserSummary,
  listWallets,
  listRecentLedgers,
  updateUserByAdmin,
  findAdminUserDetail,
  listUserLedgers
};
