const StellarSdk = require("@stellar/stellar-sdk");
const {
  PI_PAYOUT_HORIZON_URL,
  PI_PAYOUT_NETWORK_PASSPHRASE,
  AUTO_PAYOUT_STALE_MINUTES
} = require("../config");
const { readGameConfig } = require("../repositories/game-config.repository");
const { query } = require("../db/mysql");
const {
  getAutoPayoutCandidates,
  markWithdrawAutoProcessing,
  markWithdrawAutoFailed,
  markWithdrawAutoManualReview,
  resetStaleAutoPayouts,
  completeAutoPaidWithdraw
} = require("../controllers/withdraw.controller");
const {
  getSourceKeypair,
  getPayoutRuntimeStatus,
  assertPayoutRuntimeReady
} = require("../utils/payout-runtime");

async function sendPiPayment({ destination, amount, memo }) {
  assertPayoutRuntimeReady();

  const server = new StellarSdk.Horizon.Server(PI_PAYOUT_HORIZON_URL);
  const sourceKeypair = getSourceKeypair();
  if (!sourceKeypair) {
    throw new Error("出款钱包私钥未配置");
  }
  const sourceAccount = await server.loadAccount(sourceKeypair.publicKey());
  const fee = await server.fetchBaseFee();
  const transaction = new StellarSdk.TransactionBuilder(sourceAccount, {
    fee: String(fee),
    networkPassphrase: PI_PAYOUT_NETWORK_PASSPHRASE
  })
    .addOperation(
      StellarSdk.Operation.payment({
        destination,
        asset: StellarSdk.Asset.native(),
        amount: Number(amount).toFixed(8)
      })
    )
    .addMemo(StellarSdk.Memo.text(String(memo || "Blitz of Pi").slice(0, 28)))
    .setTimeout(90)
    .build();

  transaction.sign(sourceKeypair);

  const result = await server.submitTransaction(transaction);
  return result.hash || result.id;
}

async function processAutoPayoutOnce(limit = 10) {
  const config = await readGameConfig();
  const risk = config.withdrawRisk || {};

  if (!risk.autoPayoutEnabled) {
    return {
      enabled: false,
      processed: 0,
      message: "自动出款未开启"
    };
  }

  return withAutoPayoutRunLock(async () => {
    assertPayoutRuntimeReady();
    const resetCount = await resetStaleAutoPayouts(AUTO_PAYOUT_STALE_MINUTES);

    const candidates = await getAutoPayoutCandidates(limit);
    const results = [];

    for (const order of candidates) {
      results.push(await processAutoPayoutOrder(order.orderNo));
    }

    return {
      enabled: true,
      resetCount,
      processed: results.length,
      results
    };
  });
}

async function processAutoPayoutOrder(orderNo) {
  let submittedTxid = "";

  try {
    const processing = await markWithdrawAutoProcessing(orderNo);
    if (!processing || processing.autoPayoutStatus !== "processing") {
      return {
        orderNo,
        status: "skipped",
        message: "订单不在自动出款队列，已跳过"
      };
    }

    const txid = await sendPiPayment({
      destination: processing.walletAddress,
      amount: processing.payoutAmount,
      memo: processing.orderNo
    });
    submittedTxid = txid;
    const paid = await completeAutoPaidWithdraw(processing.orderNo, txid);

    return {
      orderNo: paid.orderNo,
      status: "paid",
      txid,
      order: paid
    };
  } catch (error) {
    if (submittedTxid) {
      const reviewOrder = await markWithdrawAutoManualReview(
        orderNo,
        `链上交易已提交但系统确认失败，TXID：${submittedTxid}，请人工核对后标记`
      );

      return {
        orderNo,
        status: "review",
        txid: submittedTxid,
        error: error.message || "链上已提交，需人工核对",
        order: reviewOrder
      };
    }

    await markWithdrawAutoFailed(orderNo, error.message || "自动出款失败");
    return {
      orderNo,
      status: "failed",
      error: error.message || "自动出款失败"
    };
  }
}

async function processAutoPayoutImmediately(orderNo) {
  const config = await readGameConfig();
  const risk = config.withdrawRisk || {};

  if (!risk.autoPayoutEnabled) {
    return {
      enabled: false,
      processed: 0,
      message: "自动出款未开启"
    };
  }

  return withAutoPayoutRunLock(async () => {
    assertPayoutRuntimeReady();
    const result = await processAutoPayoutOrder(orderNo);

    return {
      enabled: true,
      processed: result.status === "skipped" ? 0 : 1,
      result
    };
  });
}

async function withAutoPayoutRunLock(callback) {
  const rows = await query("SELECT GET_LOCK(?, 0) AS locked", ["blitz_auto_payout"]);
  const locked = Number(rows[0]?.locked || 0) === 1;

  if (!locked) {
    return {
      enabled: true,
      locked: false,
      processed: 0,
      message: "已有自动出款任务运行，本次跳过"
    };
  }

  try {
    return {
      locked: true,
      ...(await callback())
    };
  } finally {
    await query("SELECT RELEASE_LOCK(?) AS released", ["blitz_auto_payout"]);
  }
}

module.exports = {
  getPayoutRuntimeStatus,
  processAutoPayoutOnce,
  processAutoPayoutImmediately,
  sendPiPayment
};
