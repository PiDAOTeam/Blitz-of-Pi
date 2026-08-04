const test = require("node:test");
const assert = require("node:assert/strict");

const {
  createSubmissionUncertainError,
  isDefinitiveSubmissionRejection,
  normalizeTimeout,
  withTimeout
} = require("./auto-payout.service");

test("自动出款超时配置限制在安全范围", () => {
  assert.equal(normalizeTimeout(100, 20_000), 5_000);
  assert.equal(normalizeTimeout(30_000, 20_000), 30_000);
  assert.equal(normalizeTimeout(999_999, 20_000), 120_000);
});

test("只有明确的 Horizon 4xx 拒绝才允许进入普通失败重试", () => {
  assert.equal(isDefinitiveSubmissionRejection({ response: { status: 400 } }), true);
  assert.equal(isDefinitiveSubmissionRejection({ response: { status: 422 } }), true);
  assert.equal(isDefinitiveSubmissionRejection({ response: { status: 408 } }), false);
  assert.equal(isDefinitiveSubmissionRejection({ response: { status: 429 } }), false);
  assert.equal(isDefinitiveSubmissionRejection({ response: { status: 500 } }), false);
  assert.equal(isDefinitiveSubmissionRejection(new Error("socket hang up")), false);
});

test("链上提交不确定错误保留确定性 TXID", () => {
  const error = createSubmissionUncertainError("abc123", "提交超时");
  assert.equal(error.code, "PAYOUT_SUBMISSION_UNCERTAIN");
  assert.equal(error.txid, "abc123");
  assert.equal(error.submissionUncertain, true);
});

test("超时包装器不会永久阻塞 worker", async () => {
  await assert.rejects(
    withTimeout(new Promise(() => {}), 5, "测试超时"),
    /测试超时/
  );
});
