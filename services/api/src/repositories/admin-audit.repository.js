const { query } = require("../db/mysql");

function executor(connection) {
  return connection || {
    execute: (sql, params) => query(sql, params).then((rows) => [rows])
  };
}

async function addAdminAuditLog(
  { adminUsername, action, targetType = "", targetId = "", detail = {}, ip = "" },
  connection = null
) {
  await executor(connection).execute(
    `INSERT INTO admin_operation_logs
       (admin_username, action, target_type, target_id, detail, ip)
     VALUES (?, ?, ?, ?, CAST(? AS JSON), ?)`,
    [
      adminUsername || "",
      action,
      targetType || "",
      targetId || "",
      JSON.stringify(detail || {}),
      ip || ""
    ]
  );
}

async function listAdminAuditLogs(limit = 50) {
  const safeLimit = Math.min(200, Math.max(1, Number.parseInt(String(limit), 10) || 50));

  return query(
    `SELECT id, admin_username, action, target_type, target_id, detail, ip, created_at
     FROM admin_operation_logs
     ORDER BY id DESC
     LIMIT ${safeLimit}`
  );
}

module.exports = {
  addAdminAuditLog,
  listAdminAuditLogs
};
