const test = require("node:test");
const assert = require("node:assert/strict");
const {
  isTerminalPaymentOrderStatus,
  canRecoverTerminalRechargeOrder
} = require("./payment.controller");

test("terminal payment order statuses are recognized", () => {
  assert.equal(isTerminalPaymentOrderStatus("failed"), true);
  assert.equal(isTerminalPaymentOrderStatus("cancelled"), true);
  assert.equal(isTerminalPaymentOrderStatus("expired"), true);
  assert.equal(isTerminalPaymentOrderStatus("pending"), false);
});

test("terminal recharge orders can recover when txid is present", () => {
  assert.equal(canRecoverTerminalRechargeOrder({ status: "failed" }, "txid-1"), true);
  assert.equal(canRecoverTerminalRechargeOrder({ status: "cancelled" }, "txid-1"), true);
  assert.equal(canRecoverTerminalRechargeOrder({ status: "expired" }, ""), false);
  assert.equal(canRecoverTerminalRechargeOrder({ status: "approved" }, "txid-1"), false);
});
