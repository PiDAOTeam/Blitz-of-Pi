const {
  expireCreatedPaymentOrders,
  listPaymentSyncCandidates,
  findPaymentOrderForUpdate,
  findPaymentByTxidForUpdate,
  updatePaymentStatus
} = require("../repositories/payment.repository");
const { increaseBalance } = require("../repositories/wallet.repository");
const { transaction } = require("../db/mysql");
const { getPiPayment, completePiPayment } = require("./pi-platform.service");

const CHECK_INTERVAL_MS = 10 * 60 * 1000;
let schedulerStarted = false;
let schedulerRunning = false;

function getPaymentMetadata(payment) {
  return payment?.metadata || payment?.memo_metadata || {};
}

function getPaymentTxid(payment) {
  return payment?.transaction?.txid || payment?.transaction?.transaction_id || payment?.txid || "";
}

function normalizePaymentStatus(payment) {
  const status = payment?.status;
  if (typeof status === "string") {
    return status.toLowerCase();
  }

  if (status && typeof status === "object") {
    if (status.cancelled || status.user_cancelled) return "cancelled";
    if (status.developer_completed || status.transaction_verified) return "completed";
    if (status.developer_approved) return "approved";
  }

  return "";
}

function normalizePaymentAmount(value) {
  return Number(Number(value || 0).toFixed(8));
}

function parseMetadata(value) {
  if (!value) return {};
  if (typeof value === "object") return value;

  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
}

async function completeSyncedPayment(order, payment, txid) {
  return transaction(async (connection) => {
    const lockedOrder = await findPaymentOrderForUpdate(order.order_no, connection);

    if (!lockedOrder || lockedOrder.status === "completed") {
      return false;
    }

    if (!["pending", "approved"].includes(lockedOrder.status)) {
      return false;
    }

    const existedTx = await findPaymentByTxidForUpdate(txid, connection);
    if (existedTx && existedTx.order_no !== lockedOrder.order_no) {
      throw new Error("该链上 TXID 已被其他充值订单使用");
    }

    const orderMetadata = parseMetadata(lockedOrder.metadata);
    const paymentMetadata = getPaymentMetadata(payment);
    const rechargeBonus = orderMetadata.rechargeBonus || paymentMetadata.rechargeBonus || { bonusAmount: 0 };
    const bonusAmount = normalizePaymentAmount(rechargeBonus.bonusAmount || 0);

    await updatePaymentStatus(
      lockedOrder.order_no,
      "completed",
      {
        paymentId: lockedOrder.pi_payment_id,
        txid,
        metadata: {
          ...orderMetadata,
          ...paymentMetadata,
          rechargeBonus: {
            ...rechargeBonus,
            bonusAmount
          },
          autoSyncedAt: new Date().toISOString(),
          autoSyncedPaymentStatus: payment.status || ""
        }
      },
      connection
    );

    await increaseBalance(
      lockedOrder.uid,
      Number(lockedOrder.amount),
      {
        type: "recharge",
        relatedType: "payment_order",
        relatedId: lockedOrder.order_no,
        remark: "Pi 钱包充值自动到账"
      },
      connection
    );

    if (bonusAmount > 0) {
      await increaseBalance(
        lockedOrder.uid,
        bonusAmount,
        {
          type: "reward",
          relatedType: "payment_order_bonus",
          relatedId: lockedOrder.order_no,
          remark: `充值赠送 ${bonusAmount} Pi`
        },
        connection
      );
    }

    return true;
  });
}

async function syncOnePaymentOrder(order) {
  const payment = await getPiPayment(order.pi_payment_id);
  const status = normalizePaymentStatus(payment);
  const txid = getPaymentTxid(payment);

  if (["cancelled", "canceled", "failed", "error"].includes(status)) {
    await updatePaymentStatus(order.order_no, "failed", {
      paymentId: order.pi_payment_id,
      metadata: {
        ...getPaymentMetadata(payment),
        autoSyncedAt: new Date().toISOString(),
        autoSyncedPaymentStatus: payment.status || ""
      }
    });
    return "failed";
  }

  if (txid) {
    if (status !== "completed") {
      await completePiPayment(order.pi_payment_id, txid);
    }

    return (await completeSyncedPayment(order, payment, txid)) ? "completed" : "skipped";
  }

  await updatePaymentStatus(order.order_no, "pending", {
    paymentId: order.pi_payment_id,
    metadata: {
      ...getPaymentMetadata(payment),
      autoSyncedAt: new Date().toISOString(),
      autoSyncedPaymentStatus: payment.status || ""
    }
  });
  return "pending";
}

async function runPaymentMaintenance() {
  if (schedulerRunning) return null;

  schedulerRunning = true;
  try {
    const expiredCount = await expireCreatedPaymentOrders(30);
    const candidates = await listPaymentSyncCandidates(30, 10);
    const summary = {
      expired: expiredCount,
      completed: 0,
      failed: 0,
      pending: 0,
      skipped: 0,
      errors: 0
    };

    for (const order of candidates) {
      try {
        const result = await syncOnePaymentOrder(order);
        summary[result] = Number(summary[result] || 0) + 1;
      } catch (error) {
        summary.errors += 1;
        console.error(`[payment-scheduler] sync failed: ${order.order_no}`, error.message);
      }
    }

    if (summary.expired || summary.completed || summary.failed || summary.errors) {
      console.log(`[payment-scheduler] maintenance: ${JSON.stringify(summary)}`);
    }

    return summary;
  } catch (error) {
    console.error("[payment-scheduler] maintenance failed:", error.message);
    return null;
  } finally {
    schedulerRunning = false;
  }
}

function startPaymentScheduler() {
  if (schedulerStarted) return;
  schedulerStarted = true;

  setTimeout(() => {
    runPaymentMaintenance();
  }, 15 * 1000).unref?.();

  setInterval(() => {
    runPaymentMaintenance();
  }, CHECK_INTERVAL_MS).unref?.();

  console.log("[payment-scheduler] payment maintenance scheduler started");
}

module.exports = {
  startPaymentScheduler,
  runPaymentMaintenance
};
