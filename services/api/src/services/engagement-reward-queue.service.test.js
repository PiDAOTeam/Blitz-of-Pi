const test = require("node:test");
const assert = require("node:assert/strict");

const {
  getNextRetrySeconds,
  isHashPiIdentityUnboundError,
  mapWithConcurrency
} = require("./engagement-reward-queue.service");

test("奖励队列按受控并发处理，不超过并发上限", async () => {
  let active = 0;
  let maxActive = 0;

  const results = await mapWithConcurrency([1, 2, 3, 4, 5, 6], 2, async (value) => {
    active += 1;
    maxActive = Math.max(maxActive, active);
    await new Promise((resolve) => setTimeout(resolve, 5));
    active -= 1;
    return value * 2;
  });

  assert.deepEqual(results, [2, 4, 6, 8, 10, 12]);
  assert.equal(maxActive, 2);
});

test("未绑定 HashPi 用户属于等待身份业务状态", () => {
  assert.equal(isHashPiIdentityUnboundError(new Error("Pi UID/用户名未绑定 HashPi 用户")), true);
  assert.equal(isHashPiIdentityUnboundError(new Error("资产网络繁忙")), false);
});

test("普通奖励重试延迟包含有限抖动且不超过上限", () => {
  assert.equal(getNextRetrySeconds(1, () => 0), 30);
  assert.equal(getNextRetrySeconds(1, () => 1), 36);
  assert.equal(getNextRetrySeconds(20, () => 1), 1152);
  assert.ok(getNextRetrySeconds(20, () => 1) <= 1800);
});
