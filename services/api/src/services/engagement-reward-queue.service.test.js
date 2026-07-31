const test = require("node:test");
const assert = require("node:assert/strict");

const { mapWithConcurrency } = require("./engagement-reward-queue.service");

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
