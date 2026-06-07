const { query } = require("../db/mysql");

async function findAdminByUsername(username) {
  const rows = await query("SELECT * FROM admin_users WHERE username = ? AND status = 1 LIMIT 1", [
    username
  ]);
  return rows[0] || null;
}

async function updateAdminPassword(username, passwordHash) {
  await query(
    "UPDATE admin_users SET password_hash = ?, updated_at = NOW() WHERE username = ?",
    [passwordHash, username]
  );

  return findAdminByUsername(username);
}

function toAdminProfile(row) {
  return {
    username: row.username,
    nickname: row.nickname,
    roleName: row.role_name
  };
}

module.exports = {
  findAdminByUsername,
  updateAdminPassword,
  toAdminProfile
};
