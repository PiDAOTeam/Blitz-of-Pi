const { query } = require("../db/mysql");

function executor(connection) {
  return connection || {
    execute: (sql, params) => query(sql, params).then((rows) => [rows])
  };
}

async function createWithdrawOrder(
  {
    orderNo,
    uid,
    amount,
    walletAddress,
    feeAmount = 0,
    payoutAmount = amount,
    walletCheckStatus = "unchecked",
    walletCheckMessage = "",
    autoPayoutStatus = "manual_review",
    autoPayoutEligible = false,
    remark
  },
  connection = null
) {
  await executor(connection).execute(
    `INSERT INTO withdraw_orders
       (order_no, uid, amount, fee_amount, payout_amount, wallet_address,
        wallet_check_status, wallet_check_message, auto_payout_status,
        auto_payout_eligible, remark, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
    [
      orderNo,
      uid,
      amount,
      feeAmount,
      payoutAmount,
      walletAddress,
      walletCheckStatus,
      walletCheckMessage,
      autoPayoutStatus,
      autoPayoutEligible ? 1 : 0,
      remark || ""
    ]
  );

  return findWithdrawOrder(orderNo, connection);
}

async function findWithdrawOrder(orderNo, connection = null) {
  const [rows] = await executor(connection).execute(
    "SELECT * FROM withdraw_orders WHERE order_no = ? LIMIT 1",
    [orderNo]
  );

  return rows[0] || null;
}

async function findWithdrawOrderForUpdate(orderNo, connection) {
  const [rows] = await executor(connection).execute(
    "SELECT * FROM withdraw_orders WHERE order_no = ? LIMIT 1 FOR UPDATE",
    [orderNo]
  );

  return rows[0] || null;
}

async function findWithdrawByTxidForUpdate(txid, connection) {
  const [rows] = await executor(connection).execute(
    "SELECT * FROM withdraw_orders WHERE txid = ? LIMIT 1 FOR UPDATE",
    [txid]
  );

  return rows[0] || null;
}

async function updateWithdrawStatus(orderNo, status, fields = {}, connection = null) {
  await executor(connection).execute(
    `UPDATE withdraw_orders
     SET status = ?,
         audit_remark = COALESCE(?, audit_remark),
         txid = COALESCE(?, txid),
         audited_by = COALESCE(?, audited_by),
         auto_payout_status = COALESCE(?, auto_payout_status),
         auto_payout_error = COALESCE(?, auto_payout_error),
         audited_at = CASE WHEN ? IN ('approved', 'rejected') THEN NOW() ELSE audited_at END,
         paid_at = CASE WHEN ? = 'paid' THEN NOW() ELSE paid_at END
     WHERE order_no = ?`,
    [
      status,
      fields.auditRemark || null,
      fields.txid || null,
      fields.auditedBy || null,
      fields.autoPayoutStatus || null,
      fields.autoPayoutError || null,
      status,
      status,
      orderNo
    ]
  );

  return findWithdrawOrder(orderNo, connection);
}

async function listWithdrawOrders(limit = 80) {
  const safeLimit = Math.min(200, Math.max(1, Number.parseInt(String(limit), 10) || 80));

  return query(
    `SELECT w.order_no, w.uid, u.pi_username, u.nickname, u.avatar_key,
            w.amount, w.fee_amount, w.payout_amount, w.wallet_address,
            w.wallet_check_status, w.wallet_check_message, w.auto_payout_status,
            w.auto_payout_eligible, w.auto_payout_attempts, w.auto_payout_error,
            w.status, w.txid, w.remark, w.audit_remark, w.audited_by,
            w.audited_at, w.paid_at, w.created_at
     FROM withdraw_orders w
     LEFT JOIN users u ON u.uid = w.uid
     ORDER BY w.id DESC
     LIMIT ${safeLimit}`
  );
}

async function listAutoPayoutCandidates(limit = 20, connection = null) {
  const safeLimit = Math.min(100, Math.max(1, Number.parseInt(String(limit), 10) || 20));
  const [rows] = await executor(connection).execute(
    `SELECT *
     FROM withdraw_orders
     WHERE status = 'approved'
       AND auto_payout_eligible = 1
       AND auto_payout_status IN ('queued', 'failed')
     ORDER BY id ASC
     LIMIT ${safeLimit}`
  );

  return rows;
}

async function markAutoPayoutProcessing(orderNo, connection = null) {
  const [result] = await executor(connection).execute(
    `UPDATE withdraw_orders
     SET auto_payout_status = 'processing',
         auto_payout_attempts = auto_payout_attempts + 1,
         auto_payout_error = NULL
     WHERE order_no = ?
       AND status = 'approved'
       AND auto_payout_status IN ('queued', 'failed')`,
    [orderNo]
  );

  if (!result?.affectedRows) {
    return null;
  }

  return findWithdrawOrder(orderNo, connection);
}

async function queueManualWithdrawForAutoPayout(orderNo, connection = null) {
  const [result] = await executor(connection).execute(
    `UPDATE withdraw_orders
     SET auto_payout_status = 'queued',
         auto_payout_eligible = 1,
         auto_payout_error = NULL
     WHERE order_no = ?
       AND status = 'approved'
       AND auto_payout_status = 'manual_review'
       AND (txid IS NULL OR txid = '')`,
    [orderNo]
  );

  if (!result?.affectedRows) {
    return null;
  }

  return findWithdrawOrder(orderNo, connection);
}

async function resetStaleAutoPayoutProcessing(staleMinutes = 10, connection = null) {
  const safeMinutes = Math.min(60, Math.max(3, Number.parseInt(String(staleMinutes), 10) || 10));
  const [result] = await executor(connection).execute(
    `UPDATE withdraw_orders
     SET auto_payout_status = 'failed',
         auto_payout_error = '自动出款任务超时，已回到失败队列等待重试'
     WHERE status = 'approved'
       AND auto_payout_status = 'processing'
       AND updated_at < DATE_SUB(NOW(), INTERVAL ${safeMinutes} MINUTE)`
  );

  return Number(result?.affectedRows || 0);
}

async function markAutoPayoutFailed(orderNo, errorMessage, connection = null) {
  await executor(connection).execute(
    `UPDATE withdraw_orders
     SET auto_payout_status = 'failed',
         auto_payout_error = ?
     WHERE order_no = ?`,
    [String(errorMessage || "自动出款失败").slice(0, 500), orderNo]
  );

  return findWithdrawOrder(orderNo, connection);
}

async function markAutoPayoutManualReview(orderNo, errorMessage, connection = null) {
  await executor(connection).execute(
    `UPDATE withdraw_orders
     SET auto_payout_status = 'manual_review',
         auto_payout_error = ?
     WHERE order_no = ?`,
    [String(errorMessage || "自动出款需人工复核").slice(0, 500), orderNo]
  );

  return findWithdrawOrder(orderNo, connection);
}

async function sumTodayWithdrawAmount(uid, connection = null) {
  const [rows] = await executor(connection).execute(
    `SELECT COALESCE(SUM(amount), 0) AS total_amount
     FROM withdraw_orders
     WHERE uid = ?
       AND status IN ('pending', 'approved', 'paid')
       AND created_at >= CURRENT_DATE`,
    [uid]
  );

  return Number(rows[0]?.total_amount || 0);
}

module.exports = {
  createWithdrawOrder,
  findWithdrawOrder,
  findWithdrawOrderForUpdate,
  findWithdrawByTxidForUpdate,
  updateWithdrawStatus,
  listWithdrawOrders,
  listAutoPayoutCandidates,
  markAutoPayoutProcessing,
  queueManualWithdrawForAutoPayout,
  resetStaleAutoPayoutProcessing,
  markAutoPayoutFailed,
  markAutoPayoutManualReview,
  sumTodayWithdrawAmount
};
