const { query } = require("../db/mysql");

function executor(connection) {
  return connection || {
    execute: (sql, params) => query(sql, params).then((rows) => [rows])
  };
}

async function createPaymentOrder({ orderNo, uid, paymentId, amount, memo, metadata }) {
  const safePaymentId = String(paymentId || "").trim() || null;

  await query(
    `INSERT INTO payment_orders
       (order_no, uid, pi_payment_id, amount, memo, metadata, status, txid)
     VALUES (?, ?, ?, ?, ?, ?, 'created', NULL)`,
    [orderNo, uid, safePaymentId, amount, memo || "", JSON.stringify(metadata || {})]
  );

  return findPaymentOrder(orderNo);
}

async function findPaymentOrder(orderNo) {
  const rows = await query("SELECT * FROM payment_orders WHERE order_no = ? LIMIT 1", [orderNo]);
  return rows[0] || null;
}

async function findPaymentOrderForUpdate(orderNo, connection) {
  const [rows] = await executor(connection).execute(
    "SELECT * FROM payment_orders WHERE order_no = ? LIMIT 1 FOR UPDATE",
    [orderNo]
  );
  return rows[0] || null;
}

async function findPaymentByPiPaymentId(paymentId) {
  const rows = await query("SELECT * FROM payment_orders WHERE pi_payment_id = ? LIMIT 1", [
    paymentId
  ]);
  return rows[0] || null;
}

async function findPaymentByPiPaymentIdForUpdate(paymentId, connection) {
  const [rows] = await executor(connection).execute(
    "SELECT * FROM payment_orders WHERE pi_payment_id = ? LIMIT 1 FOR UPDATE",
    [paymentId]
  );
  return rows[0] || null;
}

async function findPaymentByTxidForUpdate(txid, connection) {
  const [rows] = await executor(connection).execute(
    "SELECT * FROM payment_orders WHERE txid = ? LIMIT 1 FOR UPDATE",
    [txid]
  );
  return rows[0] || null;
}

async function updatePaymentStatus(orderNo, status, fields = {}, connection = null) {
  const safePaymentId = String(fields.paymentId || "").trim() || null;
  const safeTxid = String(fields.txid || "").trim() || null;

  await executor(connection).execute(
    `UPDATE payment_orders
     SET status = ?,
         pi_payment_id = COALESCE(?, pi_payment_id),
         txid = COALESCE(?, txid),
         metadata = COALESCE(CAST(NULLIF(?, '') AS JSON), metadata),
         completed_at = CASE WHEN ? = 'completed' THEN NOW() ELSE completed_at END
     WHERE order_no = ?`,
    [
      status,
      safePaymentId,
      safeTxid,
      fields.metadata ? JSON.stringify(fields.metadata) : "",
      status,
      orderNo
    ]
  );

  return connection ? findPaymentOrderForUpdate(orderNo, connection) : findPaymentOrder(orderNo);
}

async function listPaymentOrders(limit = 50) {
  const safeLimit = Math.min(200, Math.max(1, Number.parseInt(String(limit), 10) || 50));

  return query(
    `SELECT p.order_no, p.uid, u.pi_username, u.nickname, u.avatar_key,
            p.pi_payment_id, p.amount, p.memo, p.metadata, p.status, p.txid, p.created_at, p.completed_at
     FROM payment_orders p
     LEFT JOIN users u ON u.uid = p.uid
     ORDER BY p.id DESC
     LIMIT ${safeLimit}`
  );
}

async function expireCreatedPaymentOrders(minutes = 30) {
  const safeMinutes = Math.min(1440, Math.max(5, Number.parseInt(String(minutes), 10) || 30));

  const result = await query(
    `UPDATE payment_orders
     SET status = 'expired',
         metadata = JSON_SET(COALESCE(metadata, JSON_OBJECT()), '$.expiredAt', CAST(? AS JSON), '$.expireReason', 'created_without_pi_payment')
     WHERE status = 'created'
       AND (pi_payment_id IS NULL OR pi_payment_id = '')
       AND created_at < DATE_SUB(NOW(), INTERVAL ${safeMinutes} MINUTE)`,
    [JSON.stringify(new Date().toISOString())]
  );

  return Number(result.affectedRows || 0);
}

async function listPaymentSyncCandidates(limit = 50, minutes = 10) {
  const safeLimit = Math.min(100, Math.max(1, Number.parseInt(String(limit), 10) || 50));
  const safeMinutes = Math.min(1440, Math.max(2, Number.parseInt(String(minutes), 10) || 10));

  return query(
    `SELECT *
     FROM payment_orders
     WHERE status IN ('pending', 'approved')
       AND pi_payment_id IS NOT NULL
       AND pi_payment_id <> ''
       AND updated_at < DATE_SUB(NOW(), INTERVAL ${safeMinutes} MINUTE)
     ORDER BY id ASC
     LIMIT ${safeLimit}`
  );
}

module.exports = {
  createPaymentOrder,
  findPaymentOrder,
  findPaymentOrderForUpdate,
  findPaymentByPiPaymentId,
  findPaymentByPiPaymentIdForUpdate,
  findPaymentByTxidForUpdate,
  updatePaymentStatus,
  listPaymentOrders,
  expireCreatedPaymentOrders,
  listPaymentSyncCandidates
};
