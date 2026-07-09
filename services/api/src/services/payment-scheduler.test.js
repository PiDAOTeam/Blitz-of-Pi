const test = require("node:test");
const assert = require("node:assert/strict");
const {
  normalizePaymentStatus,
  isStaleOpenPaymentOrder
} = require("./payment-scheduler.service");

test("normalizePaymentStatus maps Pi status objects", () => {
  assert.equal(normalizePaymentStatus({ status: { developer_completed: true } }), "completed");
  assert.equal(normalizePaymentStatus({ status: { transaction_verified: true } }), "completed");
  assert.equal(normalizePaymentStatus({ status: { developer_approved: true } }), "approved");
  assert.equal(normalizePaymentStatus({ status: { cancelled: true } }), "cancelled");
});

test("isStaleOpenPaymentOrder only flags old open orders without txid", () => {
  const nowMs = Date.UTC(2026, 6, 10, 0, 0, 0);
  const staleCreatedAt = new Date(nowMs - 6 * 60 * 60 * 1000 - 1).toISOString();
  const freshCreatedAt = new Date(nowMs - 30 * 60 * 1000).toISOString();

  assert.equal(isStaleOpenPaymentOrder({ status: "approved", created_at: staleCreatedAt }, "", nowMs), true);
  assert.equal(isStaleOpenPaymentOrder({ status: "pending", created_at: freshCreatedAt }, "", nowMs), false);
  assert.equal(isStaleOpenPaymentOrder({ status: "failed", created_at: staleCreatedAt }, "", nowMs), false);
  assert.equal(isStaleOpenPaymentOrder({ status: "approved", created_at: staleCreatedAt }, "txid-1", nowMs), false);
});
