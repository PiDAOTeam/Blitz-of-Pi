const test = require("node:test");
const assert = require("node:assert/strict");

const {
  getRetryDelaySeconds,
  isReleasedTerminalBattle
} = require("./settlement-worker.service");

test("已过期且资产已释放的房间直接进入终态", () => {
  assert.equal(isReleasedTerminalBattle({ status: "expired", asset_settlement_status: "released" }), true);
  assert.equal(isReleasedTerminalBattle({ status: "cancelled", asset_settlement_status: "released" }), true);
  assert.equal(isReleasedTerminalBattle({ status: "finished", asset_settlement_status: "released" }), false);
  assert.equal(isReleasedTerminalBattle({ status: "expired", asset_settlement_status: "frozen" }), false);
});

test("结算重试退避有上限", () => {
  assert.equal(getRetryDelaySeconds(0), 3);
  assert.equal(getRetryDelaySeconds(1), 6);
  assert.equal(getRetryDelaySeconds(20), 180);
});
