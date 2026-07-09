const crypto = require("node:crypto");
const { getUserFromRequest } = require("./wallet.controller");
const {
  createPaymentOrder,
  findPaymentOrder,
  findPaymentOrderForUpdate,
  findPaymentByPiPaymentId,
  findPaymentByPiPaymentIdForUpdate,
  findPaymentByTxidForUpdate,
  updatePaymentStatus,
  listPaymentOrders
} = require("../repositories/payment.repository");
const { increaseBalance } = require("../repositories/wallet.repository");
const { readGameConfig } = require("../repositories/game-config.repository");
const { transaction } = require("../db/mysql");
const {
  getPiPayment,
  approvePiPayment,
  completePiPayment
} = require("../services/pi-platform.service");

function createOrderNo() {
  return `PAY${Date.now()}${crypto.randomBytes(6).toString("hex").toUpperCase()}`;
}

function toPaymentDto(order) {
  if (!order) return null;
  const metadata = parseMetadata(order.metadata);
  const bonusAmount = Number(metadata.rechargeBonus?.bonusAmount || 0);
  const totalCreditAmount = Number(order.amount) + bonusAmount;

  return {
    orderNo: order.order_no,
    uid: order.uid,
    piUsername: order.pi_username || "",
    nickname: order.nickname || "",
    avatarKey: order.avatar_key || "avatar_1",
    piPaymentId: order.pi_payment_id || "",
    amount: Number(order.amount),
    bonusAmount,
    totalCreditAmount: normalizePaymentAmount(totalCreditAmount),
    memo: order.memo || "",
    status: order.status,
    txid: order.txid || "",
    createdAt: order.created_at,
    completedAt: order.completed_at
  };
}

function normalizePaymentAmount(value) {
  return Number(Number(value).toFixed(8));
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

function getPaymentMetadata(payment) {
  return payment?.metadata || payment?.memo_metadata || {};
}

function mergePaymentMetadata(orderMetadata, paymentMetadata, extraMetadata = {}) {
  const rechargeBonus = orderMetadata.rechargeBonus || paymentMetadata.rechargeBonus || { bonusAmount: 0 };
  const bonusAmount = normalizePaymentAmount(rechargeBonus.bonusAmount || 0);

  return {
    ...orderMetadata,
    ...paymentMetadata,
    ...extraMetadata,
    rechargeBonus: {
      ...rechargeBonus,
      bonusAmount
    }
  };
}

function calculateRechargeBonus(amount, rechargeBonus = {}) {
  if (!rechargeBonus.enabled) {
    return {
      bonusAmount: 0,
      presetLabel: "",
      bonusRate: 0
    };
  }

  const safeAmount = normalizePaymentAmount(amount);
  const presets = Array.isArray(rechargeBonus.presets) ? rechargeBonus.presets : [];
  const matchedPreset = presets.find(
    (preset) => preset.enabled !== false && Math.abs(Number(preset.amount || 0) - safeAmount) < 0.00000001
  );
  const rateBonus = safeAmount * Number(rechargeBonus.bonusRate || 0);
  const rawBonus = matchedPreset ? Number(matchedPreset.bonusAmount || 0) : rateBonus;
  const maxBonusAmount = Number(rechargeBonus.maxBonusAmount || 0);
  const cappedBonus = maxBonusAmount > 0 ? Math.min(rawBonus, maxBonusAmount) : rawBonus;

  return {
    bonusAmount: normalizePaymentAmount(Math.max(0, cappedBonus)),
    presetLabel: matchedPreset?.label || "",
    bonusRate: Number(rechargeBonus.bonusRate || 0)
  };
}

function getPaymentTxid(payment, fallbackTxid = "") {
  return (
    payment?.transaction?.txid ||
    payment?.transaction?.transaction_id ||
    payment?.txid ||
    fallbackTxid ||
    ""
  );
}

function isTerminalPaymentOrderStatus(status) {
  return ["cancelled", "failed", "expired"].includes(String(status || "").toLowerCase());
}

function canRecoverTerminalRechargeOrder(order, txid) {
  return isTerminalPaymentOrderStatus(order?.status) && Boolean(String(txid || "").trim());
}

function validatePiPaymentMatchesOrder(payment, order) {
  const metadata = getPaymentMetadata(payment);
  const paymentAmount = normalizePaymentAmount(payment?.amount);
  const orderAmount = normalizePaymentAmount(order.amount);

  if (paymentAmount !== orderAmount) {
    throw new Error("Pi 支付金额与订单不一致");
  }

  if (metadata?.orderNo && metadata.orderNo !== order.order_no) {
    throw new Error("Pi 支付订单号不匹配");
  }

  return metadata;
}

async function createRechargeOrder(req, payload) {
  const user = await getUserFromRequest(req);
  const amount = Number(payload.amount);

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("充值金额不正确");
  }

  const config = await readGameConfig();
  const rechargeBonus = calculateRechargeBonus(amount, config.rechargeBonus);

  const order = await createPaymentOrder({
    orderNo: createOrderNo(),
    uid: user.uid,
    paymentId: payload.paymentId || null,
    amount,
    memo: payload.memo || "Pi闪电战钱包充值",
    metadata: {
      source: "wallet_recharge",
      rechargeBonus: {
        ...rechargeBonus,
        enabled: Boolean(config.rechargeBonus?.enabled),
        calculatedAt: new Date().toISOString()
      }
    }
  });

  return toPaymentDto(order);
}

async function approveRechargePayment(req, payload) {
  const user = await getUserFromRequest(req);
  const order = await findPaymentOrder(payload.orderNo);

  if (!order || order.uid !== user.uid) {
    throw new Error("订单不存在");
  }

  if (!payload.paymentId) {
    throw new Error("缺少 Pi paymentId");
  }

  const existedPayment = await findPaymentByPiPaymentId(payload.paymentId);
  if (existedPayment && existedPayment.order_no !== order.order_no) {
    if (existedPayment.status === "completed") {
      throw new Error("该 Pi 支付已到账，不能重复确认");
    }
    throw new Error("该 Pi 支付已绑定其他订单，请刷新钱包后重试");
  }

  const payment = await getPiPayment(payload.paymentId);
  const metadata = validatePiPaymentMatchesOrder(payment, order);
  const orderMetadata = parseMetadata(order.metadata);
  await updatePaymentStatus(order.order_no, "pending", {
    paymentId: payload.paymentId,
    metadata: mergePaymentMetadata(orderMetadata, metadata, {
      piPayment: {
        identifier: payment.identifier || payload.paymentId,
        amount: payment.amount,
        status: payment.status || ""
      }
    })
  });
  await approvePiPayment(payload.paymentId);

  return toPaymentDto(await updatePaymentStatus(order.order_no, "approved", {
    paymentId: payload.paymentId || order.pi_payment_id
  }));
}

async function completeRechargePayment(req, payload) {
  const user = await getUserFromRequest(req);
  const order =
    (payload.orderNo && (await findPaymentOrder(payload.orderNo))) ||
    (payload.paymentId && (await findPaymentByPiPaymentId(payload.paymentId)));

  if (!order || order.uid !== user.uid) {
    throw new Error("订单不存在");
  }

  if (order.status === "completed") {
    return toPaymentDto(order);
  }

  if (!payload.paymentId || !payload.txid) {
    throw new Error("缺少 Pi paymentId 或 txid");
  }

  const payment = await getPiPayment(payload.paymentId);
  const metadata = validatePiPaymentMatchesOrder(payment, order);
  const txid = getPaymentTxid(payment, payload.txid);
  const paymentStatus = String(payment.status || "").toLowerCase();

  if (!txid) {
    throw new Error("缺少链上 TXID，无法完成到账");
  }

  const recoverTerminalOrder = canRecoverTerminalRechargeOrder(order, txid);

  if (["cancelled", "failed", "error"].includes(paymentStatus)) {
    throw new Error(`Pi 支付状态不可完成：${payment.status || "unknown"}`);
  }

  if (!recoverTerminalOrder && isTerminalPaymentOrderStatus(order.status)) {
    throw new Error("订单状态不可完成");
  }

  if (paymentStatus !== "completed") {
    await completePiPayment(payload.paymentId, txid);
  }

  const completed = await transaction(async (connection) => {
    const lockedOrder = await findPaymentOrderForUpdate(order.order_no, connection);

    if (!lockedOrder || lockedOrder.uid !== user.uid) {
      throw new Error("订单不存在");
    }

    if (lockedOrder.status === "completed") {
      return lockedOrder;
    }

    if (!canRecoverTerminalRechargeOrder(lockedOrder, txid) && isTerminalPaymentOrderStatus(lockedOrder.status)) {
      throw new Error("订单状态不可完成");
    }

    const existedPayment = await findPaymentByPiPaymentIdForUpdate(payload.paymentId, connection);
    if (existedPayment && existedPayment.order_no !== lockedOrder.order_no) {
      if (existedPayment.status === "completed") {
        throw new Error("该 Pi 支付已到账，不能重复充值");
      }
      throw new Error("该 Pi 支付已绑定其他订单，请刷新钱包后重试");
    }

    const existedTx = await findPaymentByTxidForUpdate(txid, connection);
    if (existedTx && existedTx.order_no !== lockedOrder.order_no) {
      throw new Error("该链上 TXID 已到账，不能重复充值");
    }

    const orderMetadata = parseMetadata(lockedOrder.metadata);
    const rechargeBonus = orderMetadata.rechargeBonus || { bonusAmount: 0 };
    const bonusAmount = normalizePaymentAmount(rechargeBonus.bonusAmount || 0);
    const nextOrder = await updatePaymentStatus(
      lockedOrder.order_no,
      "completed",
      {
        paymentId: payload.paymentId || lockedOrder.pi_payment_id,
        txid,
        metadata: mergePaymentMetadata(orderMetadata, metadata, {
          completedPayment: {
            identifier: payment.identifier || payload.paymentId,
            amount: payment.amount,
            status: payment.status || ""
          }
        })
      },
      connection
    );

    await increaseBalance(
      user.uid,
      Number(lockedOrder.amount),
      {
        type: "recharge",
        relatedType: "payment_order",
        relatedId: lockedOrder.order_no,
        remark: "Pi 钱包充值到账"
      },
      connection
    );

    if (bonusAmount > 0) {
      await increaseBalance(
        user.uid,
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

    return nextOrder;
  });

  return toPaymentDto(completed);
}

async function cancelRechargePayment(req, payload) {
  const user = await getUserFromRequest(req);
  const order = await findPaymentOrder(payload.orderNo);

  if (!order || order.uid !== user.uid) {
    throw new Error("订单不存在");
  }

  if (order.status === "completed") {
    throw new Error("已完成订单不可取消");
  }

  const orderMetadata = parseMetadata(order.metadata);
  return toPaymentDto(await updatePaymentStatus(order.order_no, "cancelled", {
    paymentId: payload.paymentId || order.pi_payment_id,
    metadata: {
      ...orderMetadata,
      cancelReason: payload.reason || "user_cancelled",
      cancelledAt: new Date().toISOString()
    }
  }));
}

async function syncIncompletePayment(req, payload) {
  const user = await getUserFromRequest(req);
  const paymentId = payload.paymentId || payload.identifier;

  if (!paymentId) {
    throw new Error("缺少 Pi paymentId");
  }

  const payment = await getPiPayment(paymentId);
  const metadata = getPaymentMetadata(payment);

  if (!metadata?.orderNo) {
    throw new Error("未完成支付缺少订单号");
  }

  const order = await findPaymentOrder(metadata.orderNo);

  if (!order || order.uid !== user.uid) {
    throw new Error("未完成支付订单不存在");
  }

  validatePiPaymentMatchesOrder(payment, order);

  const txid = getPaymentTxid(payment, payload.txid);
  const paymentStatus = String(payment.status || "").toLowerCase();
  const orderMetadata = parseMetadata(order.metadata);

  if (txid) {
    return completeRechargePayment(req, {
      orderNo: order.order_no,
      paymentId,
      txid
    });
  }

  if (paymentStatus === "completed" && order.status !== "completed") {
    throw new Error("Pi 支付已完成但缺少 TXID，请在 Pi Developer Portal 核对该 payment 后联系管理员补账");
  }

  return toPaymentDto(await updatePaymentStatus(order.order_no, "pending", {
    paymentId,
    metadata: mergePaymentMetadata(orderMetadata, metadata)
  }));
}

async function getAdminPaymentOrders() {
  const orders = await listPaymentOrders(200);
  return orders.map(toPaymentDto);
}

module.exports = {
  createRechargeOrder,
  approveRechargePayment,
  completeRechargePayment,
  cancelRechargePayment,
  syncIncompletePayment,
  getAdminPaymentOrders,
  isTerminalPaymentOrderStatus,
  canRecoverTerminalRechargeOrder
};
