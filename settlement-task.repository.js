const { query, transaction } = require("../db/mysql");

let schemaReady = false;
let lockedByColumnReady = false;

function executor(connection) {
  return connection || {
    execute: (sql, params) => query(sql, params).then((rows) => [rows])
  };
}

async function ensureSettlementTaskSchema() {
  if (schemaReady) return;

  await query(
    `CREATE TABLE IF NOT EXISTS battle_settlement_tasks (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      room_no VARCHAR(64) NOT NULL,
      mode VARCHAR(32) NOT NULL DEFAULT 'quick_battle',
      status VARCHAR(24) NOT NULL DEFAULT 'pending',
      attempts INT NOT NULL DEFAULT 0,
      next_run_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      locked_at DATETIME NULL,
      locked_by VARCHAR(128) NOT NULL DEFAULT '',
      finished_at DATETIME NULL,
      last_error VARCHAR(500) NOT NULL DEFAULT '',
      room_payload JSON NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uk_battle_settlement_room (room_no),
      KEY idx_battle_settlement_status_next (status, next_run_at, id),
      KEY idx_battle_settlement_locked (status, locked_at)
    )`
  );

  await ensureLockedByColumn();
  schemaReady = true;
}

async function ensureLockedByColumn() {
  if (lockedByColumnReady) return;

  try {
    await query("ALTER TABLE battle_settlement_tasks ADD COLUMN locked_by VARCHAR(128) NOT NULL DEFAULT '' AFTER locked_at");
  } catch (error) {
    if (error?.code !== "ER_DUP_FIELDNAME") {
      throw error;
    }
  }

  lockedByColumnReady = true;
}

async function enqueueSettlementTask(room) {
  await ensureSettlementTaskSchema();

  const roomNo = String(room?.roomNo || "");
  if (!roomNo) {
    throw new Error("缺少结算房间号");
  }

  await query(
    `INSERT INTO battle_settlement_tasks
       (room_no, mode, status, attempts, next_run_at, last_error, room_payload)
     VALUES (?, ?, 'pending', 0, NOW(), '', CAST(? AS JSON))
     ON DUPLICATE KEY UPDATE
       mode = CASE WHEN status <> 'succeeded' THEN VALUES(mode) ELSE mode END,
       room_payload = CASE WHEN status <> 'succeeded' THEN VALUES(room_payload) ELSE room_payload END,
       status = CASE WHEN status IN ('failed') THEN 'pending' ELSE status END,
       next_run_at = CASE WHEN status IN ('failed') THEN NOW() ELSE next_run_at END,
       last_error = CASE WHEN status IN ('failed') THEN '' ELSE last_error END,
       updated_at = CURRENT_TIMESTAMP`,
    [roomNo, room.mode || "quick_battle", JSON.stringify(room)]
  );

  return findSettlementTaskByRoomNo(roomNo);
}

async function findSettlementTaskByRoomNo(roomNo) {
  await ensureSettlementTaskSchema();
  const rows = await query("SELECT * FROM battle_settlement_tasks WHERE room_no = ? LIMIT 1", [roomNo]);
  return rows[0] || null;
}

async function claimDueSettlementTask(workerId) {
  await ensureSettlementTaskSchema();
  await ensureLockedByColumn();

  return transaction(async (connection) => {
    const claimId = `${workerId}:${Date.now()}:${Math.random().toString(16).slice(2)}`.slice(0, 128);
    const [updateResult] = await executor(connection).execute(
      `UPDATE battle_settlement_tasks
       SET status = 'processing',
           locked_at = NOW(),
           locked_by = ?,
           last_error = ''
       WHERE id = (
         SELECT id FROM (
           SELECT id
           FROM battle_settlement_tasks
           WHERE (
               status IN ('pending', 'failed')
               AND next_run_at <= NOW()
             )
             OR (
               status = 'processing'
               AND locked_at < DATE_SUB(NOW(), INTERVAL 2 MINUTE)
             )
           ORDER BY id ASC
           LIMIT 1
         ) AS due_task
       )
       AND (
         (
           status IN ('pending', 'failed')
           AND next_run_at <= NOW()
         )
         OR (
           status = 'processing'
           AND locked_at < DATE_SUB(NOW(), INTERVAL 2 MINUTE)
         )
       )`,
      [claimId]
    );

    if (!updateResult.affectedRows) return null;

    const [rows] = await executor(connection).execute(
      `SELECT *
       FROM battle_settlement_tasks
       WHERE status = 'processing'
         AND locked_by = ?
       ORDER BY locked_at DESC, id ASC
       LIMIT 1`,
      [claimId]
    );
    const task = rows[0];

    if (!task) return null;

    return { ...task, workerId };
  });
}

async function markSettlementTaskSucceeded(id) {
  await ensureSettlementTaskSchema();
  await query(
    `UPDATE battle_settlement_tasks
     SET status = 'succeeded',
         finished_at = NOW(),
         locked_at = NULL,
         locked_by = '',
         last_error = ''
     WHERE id = ?`,
    [id]
  );
}

async function markSettlementTaskFailed(id, error, retryDelaySeconds = 10) {
  await ensureSettlementTaskSchema();
  const message = String(error?.message || error || "结算失败").slice(0, 500);
  const safeDelay = Math.min(300, Math.max(2, Number(retryDelaySeconds) || 10));

  await query(
    `UPDATE battle_settlement_tasks
     SET status = 'failed',
         attempts = attempts + 1,
         next_run_at = DATE_ADD(NOW(), INTERVAL ? SECOND),
         locked_at = NULL,
         locked_by = '',
         last_error = ?
     WHERE id = ?`,
    [safeDelay, message, id]
  );
}

async function getSettlementTaskStats() {
  await ensureSettlementTaskSchema();
  const rows = await query(
    `SELECT status, COUNT(*) AS count
     FROM battle_settlement_tasks
     WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
     GROUP BY status`
  );

  return rows.reduce((acc, row) => {
    acc[row.status] = Number(row.count || 0);
    return acc;
  }, {});
}

module.exports = {
  ensureSettlementTaskSchema,
  enqueueSettlementTask,
  findSettlementTaskByRoomNo,
  claimDueSettlementTask,
  markSettlementTaskSucceeded,
  markSettlementTaskFailed,
  getSettlementTaskStats
};
