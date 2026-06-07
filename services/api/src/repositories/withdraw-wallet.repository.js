const { query } = require("../db/mysql");

function executor(connection) {
  return connection || {
    execute: (sql, params) => query(sql, params).then((rows) => [rows])
  };
}

async function saveUserWithdrawWallet({ uid, walletAddress, label = "Pi 主网钱包" }, connection = null) {
  await executor(connection).execute(
    `INSERT INTO user_withdraw_wallets
       (uid, wallet_address, label, use_count, last_used_at, status)
     VALUES (?, ?, ?, 1, NOW(), 1)
     ON DUPLICATE KEY UPDATE
       label = VALUES(label),
       use_count = use_count + 1,
       last_used_at = NOW(),
       status = 1,
       updated_at = NOW()`,
    [uid, walletAddress, String(label || "Pi 主网钱包").slice(0, 40)]
  );
}

async function listUserWithdrawWallets(uid, limit = 5) {
  const safeLimit = Math.min(10, Math.max(1, Number.parseInt(String(limit), 10) || 5));

  return query(
    `SELECT id, wallet_address, label, use_count, last_used_at, created_at
     FROM user_withdraw_wallets
     WHERE uid = ?
       AND status = 1
     ORDER BY last_used_at DESC, id DESC
     LIMIT ${safeLimit}`,
    [uid]
  );
}

module.exports = {
  saveUserWithdrawWallet,
  listUserWithdrawWallets
};
