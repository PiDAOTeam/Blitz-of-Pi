const StellarSdk = require("@stellar/stellar-sdk");
const {
  PI_PAYOUT_HORIZON_URL,
  PI_PAYOUT_NETWORK_PASSPHRASE,
  AUTO_PAYOUT_STALE_MINUTES
} = require("../config");
const { readGameConfig } = require("../repositories/game-config.repository");
const { withNamedLock } = require("../db/mysql");
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

const DEFAULT_HORIZON_READ_TIMEOUT_MS = 20_000;
const DEFAULT_HORIZON_SUBMIT_TIMEOUT_MS = 45_000;

function normalizeTimeout(value, fallback, maximum = 120_000) {
  return Math.min(maximum, Math.max(5_000, Number(value || fallback)));
}

function withTimeout(promise, timeoutMs, errorFactory) {
  let timer;
  return Promise.race([
    promise,
    new Promise((resolve, reject) => {
      timer = setTimeout(() => {
        reject(typeof errorFactory === "function" ? errorFactory() : new Error(String(errorFactory || "请求超时")));
      }, timeoutMs);
    })
  ]).finally(() => clearTimeout(timer));
}

function createSubmissionUncertainError(txid, message) {
  const error = new Error(message || "链上提交结果暂时无法确认");
  error.code = "PAYOUT_SUBMISSION_UNCERTAIN";
  error.txid = String(txid || "");
  error.submissionUncertain = true;
  return error;
}

function isDefinitiveSubmissionRejection(error) {
  const status = Number(error?.response?.status || 0);
  return status === 400 || status === 422;
}

async function sendPiPayment({ destination, amount, memo }) {
  assertPayoutRuntimeReady();

  const server = new StellarSdk.Horizon.Server(PI_PAYOUT_HORIZON_URL);
  const sourceKeypair = getSourceKeypair();
  const readTimeoutMs = normalizeTimeout(
    process.env.PI_PAYOUT_HORIZON_READ_TIMEOUT_MS,
    DEFAULT_HORIZON_READ_TIMEOUT_MS,
    60_000
  );
  const submitTimeoutMs = normalizeTimeout(
    process.env.PI_PAYOUT_HORIZON_SUBMIT_TIMEOUT_MS,
    DEFAULT_HORIZON_SUBMIT_TIMEOUT_MS
  );
  if (!sourceKeypair) {
    throw new Error("出款钱包私钥未配置");
  }
  const sourceAccount = await withTimeout(
    server.loadAccount(sourceKeypair.publicKey()),
    readTimeoutMs,
    "读取出款钱包超时"
  );
  try {
    await withTimeout(server.loadAccount(destination), readTimeoutMs, "校验收款钱包超时");
  } catch (error) {
    if (Number(error?.response?.status) === 404) {
      throw new Error("收款钱包地址未激活，无法链上打款");
    }
    throw error;
  }
  const fee = await withTimeout(server.fetchBaseFee(), readTimeoutMs, "读取链上手续费超时");
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
  const signedTxid = transaction.hash().toString("hex");

  let result;
  try {
    result = await withTimeout(
      server.submitTransaction(transaction),
      submitTimeoutMs,
      () => createSubmissionUncertainError(signedTxid, `链上提交超时，TXID：${signedTxid}`)
    );
  } catch (error) {
    if (error?.submissionUncertain || isDefinitiveSubmissionRejection(error)) throw error;
    throw createSubmissionUncertainError(signedTxid, `链上提交结果异常，TXID：${signedTxid}`);
  }
  const txid = result.hash || result.id || result.transaction_hash || signedTxid;
  if (!txid) {
    throw new Error("链上交易提交后未返回 TXID，自动出款未完成");
  }
  if (result.successful === false) {
    throw new Error(`链上交易提交失败，TXID：${txid}`);
  }

  let submitted;
  try {
    submitted = await withTimeout(
      server.transactions().transaction(txid).call(),
      readTimeoutMs,
      () => createSubmissionUncertainError(txid, `链上确认超时，TXID：${txid}`)
    );
  } catch (error) {
    if (error?.submissionUncertain) throw error;
    throw createSubmissionUncertainError(txid, `链上已提交但确认失败，TXID：${txid}`);
  }
  if (submitted.successful !== true) {
    throw new Error(`链上交易未成功，TXID：${txid}`);
  }

  return txid;
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
    const uncertainTxid = String(error?.txid || submittedTxid || "");
    if (uncertainTxid) {
      const reviewOrder = await markWithdrawAutoManualReview(
        orderNo,
        `链上交易可能已提交但系统确认失败，TXID：${uncertainTxid}，请人工核对后标记`
      );

      return {
        orderNo,
        status: "review",
        txid: uncertainTxid,
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
  return withNamedLock(
    "blitz_auto_payout",
    async () => ({
      enabled: true,
      locked: true,
      ...(await callback())
    }),
    {
      enabled: true,
      locked: false,
      processed: 0,
      message: "已有自动出款任务运行，本次跳过"
    }
  );
}

module.exports = {
  createSubmissionUncertainError,
  getPayoutRuntimeStatus,
  isDefinitiveSubmissionRejection,
  normalizeTimeout,
  processAutoPayoutOnce,
  processAutoPayoutImmediately,
  sendPiPayment,
  withTimeout
};
