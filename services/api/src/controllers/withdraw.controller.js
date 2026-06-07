const crypto = require("node:crypto");
const { transaction } = require("../db/mysql");
const { getUserFromRequest } = require("./wallet.controller");
const {
  createWithdrawOrder,
  findWithdrawOrderForUpdate,
  findWithdrawByTxidForUpdate,
  updateWithdrawStatus,
  listWithdrawOrders,
  listAutoPayoutCandidates,
  markAutoPayoutProcessing,
  resetStaleAutoPayoutProcessing,
  markAutoPayoutFailed,
  markAutoPayoutManualReview,
  sumTodayWithdrawAmount
} = require("../repositories/withdraw.repository");
const {
  lockBalance,
  unlockBalance,
  consumeLockedBalance
} = require("../repositories/wallet.repository");
const { addAdminAuditLog } = require("../repositories/admin-audit.repository");
const { readGameConfig } = require("../repositories/game-config.repository");
const {
  saveUserWithdrawWallet,
  listUserWithdrawWallets
} = require("../repositories/withdraw-wallet.repository");
const { inspectWithdrawWalletAddress } = require("../utils/withdraw-wallet");
const { getPayoutRuntimeStatus } = require("../utils/payout-runtime");

function createWithdrawOrderNo() {
  return `WD${Date.now()}${crypto.randomBytes(6).toString("hex").toUpperCase()}`;
}

function toWithdrawDto(row) {
  if (!row) return null;

  const amount = Number(row.amount);
  const feeAmount = Number(row.fee_amount ?? 0);
  const payoutAmount = Number(row.payout_amount ?? amount - feeAmount);

  return {
    orderNo: row.order_no,
    uid: row.uid,
    piUsername: row.pi_username || "",
    nickname: row.nickname || "",
    avatarKey: row.avatar_key || "avatar_1",
    amount,
    feeAmount,
    payoutAmount,
    walletAddress: row.wallet_address,
    walletCheckStatus: row.wallet_check_status || "unchecked",
    walletCheckMessage: row.wallet_check_message || "",
    autoPayoutStatus: row.auto_payout_status || "manual_review",
    autoPayoutEligible: Boolean(row.auto_payout_eligible),
    autoPayoutAttempts: Number(row.auto_payout_attempts || 0),
    autoPayoutError: row.auto_payout_error || "",
    status: row.status,
    txid: row.txid || "",
    remark: row.remark || "",
    auditRemark: row.audit_remark || "",
    auditedBy: row.audited_by || "",
    auditedAt: row.audited_at,
    paidAt: row.paid_at,
    createdAt: row.created_at
  };
}

function roundPi(value) {
  return Number(Number(value || 0).toFixed(8));
}

function calculateWithdrawFee(amount, feeRate) {
  return roundPi(Number(amount) * Number(feeRate || 0));
}

function getAutoPayoutDecision({ amount, walletInspection, risk, todayAmount }) {
  const autoPayoutMaxAmount = Number(risk.autoPayoutMaxAmount || 0);
  const autoPayoutDailyLimitAmount = Number(risk.autoPayoutDailyLimitAmount || 0);
  const manualReviewAmount = Number(risk.manualReviewAmount || 0);
  const reasons = [];

  if (!risk.autoPayoutEnabled) reasons.push("自动出款未开启");
  if (!risk.autoApproveEnabled) reasons.push("自动审核未开启");
  if (!walletInspection.valid) reasons.push("钱包地址未通过校验");
  if (manualReviewAmount > 0 && amount >= manualReviewAmount) reasons.push("达到人工复核金额");
  if (autoPayoutMaxAmount > 0 && amount > autoPayoutMaxAmount) reasons.push("超过单笔自动上限");
  if (autoPayoutDailyLimitAmount > 0 && todayAmount + amount > autoPayoutDailyLimitAmount) {
    reasons.push("超过自动出款日上限");
  }

  return {
    eligible: reasons.length === 0,
    reasons
  };
}

function buildAdminRequest(username = "system-auto-payout") {
  return {
    admin: {
      username
    }
  };
}

function toSavedWalletDto(row) {
  return {
    id: Number(row.id),
    walletAddress: row.wallet_address,
    label: row.label || "Pi 主网钱包",
    useCount: Number(row.use_count || 0),
    lastUsedAt: row.last_used_at,
    createdAt: row.created_at
  };
}

function normalizeTxid(txid) {
  const value = String(txid || "").trim();

  if (!value) {
    throw new Error("请填写链上 TXID 后再标记打款");
  }

  if (!/^[a-zA-Z0-9:_-]{12,128}$/.test(value)) {
    throw new Error("TXID 格式不正确，请核对后再提交");
  }

  return value;
}

async function createWithdrawRequest(req, payload) {
  const user = await getUserFromRequest(req);
  const amount = Number(payload.amount);
  const walletAddress = String(payload.walletAddress || payload.wallet_address || "").trim();

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("提现金额不正确");
  }

  const config = await readGameConfig();
  const risk = config.withdrawRisk || {};
  const minAmount = Number(risk.minAmount || 0);
  const dailyLimitAmount = Number(risk.dailyLimitAmount || 0);
  const feeRate = Number(risk.feeRate || 0);
  const walletInspection = inspectWithdrawWalletAddress(walletAddress);

  if (minAmount > 0 && amount < minAmount) {
    throw new Error(`单笔提现不能低于 ${minAmount} Pi`);
  }

  if (risk.walletValidationRequired !== false && !walletInspection.valid) {
    throw new Error(walletInspection.message);
  }

  const orderNo = createWithdrawOrderNo();
  const feeAmount = calculateWithdrawFee(amount, feeRate);
  const payoutAmount = roundPi(amount - feeAmount);

  if (payoutAmount <= 0) {
    throw new Error("提现金额扣除手续费后不足以打款");
  }

  const order = await transaction(async (connection) => {
    const todayAmount = dailyLimitAmount > 0 || risk.autoPayoutEnabled ? await sumTodayWithdrawAmount(user.uid, connection) : 0;

    if (dailyLimitAmount > 0) {
      if (todayAmount + amount > dailyLimitAmount) {
        throw new Error(`今日提现额度不足，单日最多 ${dailyLimitAmount} Pi`);
      }
    }

    const autoDecision = getAutoPayoutDecision({
      amount,
      walletInspection,
      risk,
      todayAmount
    });
    const initialStatus = autoDecision.eligible ? "queued" : "manual_review";

    await lockBalance(
      user.uid,
      amount,
      {
        type: "withdraw_lock",
        relatedType: "withdraw_order_lock",
        relatedId: orderNo,
        remark: "提现申请冻结"
      },
      connection
    );

    await createWithdrawOrder(
      {
        orderNo,
        uid: user.uid,
        amount,
        walletAddress: walletInspection.address,
        feeAmount,
        payoutAmount,
        walletCheckStatus: walletInspection.status,
        walletCheckMessage: walletInspection.message,
        autoPayoutStatus: initialStatus,
        autoPayoutEligible: autoDecision.eligible,
        remark: payload.remark || ""
      },
      connection
    );

    if (autoDecision.eligible) {
      await updateWithdrawStatus(
        orderNo,
        "approved",
        {
          auditRemark: "系统自动审核通过，等待自动出款",
          auditedBy: "system-auto-payout"
        },
        connection
      );
    }

    await saveUserWithdrawWallet(
      {
        uid: user.uid,
        walletAddress: walletInspection.address,
        label: payload.walletLabel || "Pi 主网钱包"
      },
      connection
    );

    return findWithdrawOrderForUpdate(orderNo, connection);
  });

  return toWithdrawDto(order);
}

async function getMyWithdrawWallets(req) {
  const user = await getUserFromRequest(req);
  const rows = await listUserWithdrawWallets(user.uid);

  return rows.map(toSavedWalletDto);
}

async function getAdminWithdrawOrders() {
  const rows = await listWithdrawOrders(200);
  return rows.map(toWithdrawDto);
}

async function getAdminWithdrawOps() {
  const [config, rows] = await Promise.all([readGameConfig(), listWithdrawOrders(200)]);
  const withdraws = rows.map(toWithdrawDto);
  const risk = config.withdrawRisk || {};
  const runtime = getPayoutRuntimeStatus();
  const pending = withdraws.filter((order) => order.status === "pending").length;
  const approved = withdraws.filter((order) => order.status === "approved").length;
  const queued = withdraws.filter((order) => order.autoPayoutStatus === "queued").length;
  const failed = withdraws.filter((order) => order.autoPayoutStatus === "failed").length;
  const paidToday = withdraws
    .filter((order) => order.status === "paid" && order.paidAt && new Date(order.paidAt).toDateString() === new Date().toDateString())
    .reduce((total, order) => total + order.payoutAmount, 0);

  return {
    config: {
      withdrawRisk: risk,
      payoutRuntime: {
        horizonConfigured: runtime.horizonConfigured,
        sourceSecretConfigured: runtime.sourceSecretConfigured,
        sourceSecretValid: runtime.sourceSecretValid,
        sourcePublicConfigured: runtime.sourcePublicConfigured,
        sourcePublicValid: runtime.sourcePublicValid,
        sourcePublicMatches: runtime.sourcePublicMatches,
        networkPassphraseConfigured: runtime.networkPassphraseConfigured
      }
    },
    summary: {
      pending,
      approved,
      queued,
      failed,
      paidToday: roundPi(paidToday)
    },
    orders: withdraws
  };
}

async function approveWithdrawOrder(req, orderNo, payload) {
  const order = await transaction(async (connection) => {
    const locked = await findWithdrawOrderForUpdate(orderNo, connection);

    if (!locked) {
      throw new Error("提现订单不存在");
    }

    if (locked.status !== "pending") {
      throw new Error("只有待审核订单可以通过");
    }

    const updated = await updateWithdrawStatus(
      orderNo,
      "approved",
      {
        auditRemark: payload.auditRemark || "审核通过",
        auditedBy: req.admin?.username || ""
      },
      connection
    );

    await addAdminAuditLog(
      {
        adminUsername: req.admin?.username,
        action: "withdraw_approve",
        targetType: "withdraw_order",
        targetId: orderNo,
        detail: {
          amount: Number(locked.amount),
          uid: locked.uid
        }
      },
      connection
    );

    return updated;
  });

  return toWithdrawDto(order);
}

async function rejectWithdrawOrder(req, orderNo, payload) {
  const order = await transaction(async (connection) => {
    const locked = await findWithdrawOrderForUpdate(orderNo, connection);

    if (!locked) {
      throw new Error("提现订单不存在");
    }

    if (locked.status !== "pending") {
      throw new Error("只有待审核订单可以拒绝");
    }

    await unlockBalance(
      locked.uid,
      Number(locked.amount),
      {
        type: "withdraw_reject",
        relatedType: "withdraw_order_reject",
        relatedId: orderNo,
        remark: "提现拒绝解冻"
      },
      connection
    );

    const updated = await updateWithdrawStatus(
      orderNo,
      "rejected",
      {
        auditRemark: payload.auditRemark || "审核拒绝",
        auditedBy: req.admin?.username || ""
      },
      connection
    );

    await addAdminAuditLog(
      {
        adminUsername: req.admin?.username,
        action: "withdraw_reject",
        targetType: "withdraw_order",
        targetId: orderNo,
        detail: {
          amount: Number(locked.amount),
          uid: locked.uid,
          reason: payload.auditRemark || ""
        }
      },
      connection
    );

    return updated;
  });

  return toWithdrawDto(order);
}

async function markWithdrawPaid(req, orderNo, payload) {
  const order = await transaction(async (connection) => {
    const txid = normalizeTxid(payload.txid);
    const locked = await findWithdrawOrderForUpdate(orderNo, connection);

    if (!locked) {
      throw new Error("提现订单不存在");
    }

    if (locked.status !== "approved") {
      throw new Error("只有已审核订单可以标记打款");
    }

    const existedTx = await findWithdrawByTxidForUpdate(txid, connection);
    if (existedTx && existedTx.order_no !== orderNo) {
      throw new Error("该 TXID 已被其他提现订单使用");
    }

    await consumeLockedBalance(
      locked.uid,
      Number(locked.amount),
      {
        type: "withdraw_paid",
        relatedType: "withdraw_order_paid",
        relatedId: orderNo,
        remark: `提现已打款，到账 ${Number(locked.payout_amount ?? locked.amount)} Pi`
      },
      connection
    );

    const updated = await updateWithdrawStatus(
      orderNo,
      "paid",
      {
        txid,
        auditRemark: payload.auditRemark || "已打款",
        auditedBy: req.admin?.username || "",
        autoPayoutStatus: payload.autoPayoutStatus || "paid",
        autoPayoutError: ""
      },
      connection
    );

    await addAdminAuditLog(
      {
        adminUsername: req.admin?.username,
        action: "withdraw_paid",
        targetType: "withdraw_order",
        targetId: orderNo,
        detail: {
          amount: Number(locked.amount),
          feeAmount: Number(locked.fee_amount || 0),
          payoutAmount: Number(locked.payout_amount || locked.amount),
          uid: locked.uid,
          txid
        }
      },
      connection
    );

    return updated;
  });

  return toWithdrawDto(order);
}

async function markWithdrawAutoProcessing(orderNo) {
  return toWithdrawDto(await markAutoPayoutProcessing(orderNo));
}

async function markWithdrawAutoFailed(orderNo, errorMessage) {
  return toWithdrawDto(await markAutoPayoutFailed(orderNo, errorMessage));
}

async function markWithdrawAutoManualReview(orderNo, errorMessage) {
  return toWithdrawDto(await markAutoPayoutManualReview(orderNo, errorMessage));
}

async function getAutoPayoutCandidates(limit = 20) {
  const config = await readGameConfig();
  const risk = config.withdrawRisk || {};
  const maxRetryCount = Number(risk.maxRetryCount || 0);
  const rows = await listAutoPayoutCandidates(limit);

  return rows
    .filter((row) => Number(row.auto_payout_attempts || 0) < maxRetryCount)
    .map(toWithdrawDto);
}

async function resetStaleAutoPayouts(staleMinutes = 10) {
  return resetStaleAutoPayoutProcessing(staleMinutes);
}

async function completeAutoPaidWithdraw(orderNo, txid) {
  return markWithdrawPaid(buildAdminRequest(), orderNo, {
    txid,
    auditRemark: "系统自动链上打款成功",
    autoPayoutStatus: "paid"
  });
}

module.exports = {
  createWithdrawRequest,
  getMyWithdrawWallets,
  getAdminWithdrawOrders,
  getAdminWithdrawOps,
  approveWithdrawOrder,
  rejectWithdrawOrder,
  markWithdrawPaid,
  getAutoPayoutCandidates,
  markWithdrawAutoProcessing,
  markWithdrawAutoFailed,
  markWithdrawAutoManualReview,
  resetStaleAutoPayouts,
  completeAutoPaidWithdraw
};
