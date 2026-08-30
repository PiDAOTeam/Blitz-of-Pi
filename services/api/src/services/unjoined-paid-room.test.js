const test = require("node:test");
const assert = require("node:assert/strict");
const {
  isRealtimeMatchStarted,
  isWaitingReadyLifecycleTimedOut,
  shouldReconcileUnjoinedPaidRoom,
  getWaitingReadyDeadlineMs
} = require("./unjoined-paid-room");

const now = 1_800_000_000_000;
const frozenPaid = {
  room_no: "room_stuck",
  mode: "pi_battle",
  status: "playing",
  entry_fee: 1,
  asset_settlement_status: "frozen",
  created_at: now - 60_000
};

test("对战已开始或已结束的 realtime 房不能当未进房退票", () => {
  assert.equal(isRealtimeMatchStarted(null), false);
  assert.equal(isRealtimeMatchStarted({ status: "waiting_ready" }), false);
  assert.equal(isRealtimeMatchStarted({ status: "playing" }), false);
  assert.equal(isRealtimeMatchStarted({ status: "playing", endsAt: now + 10_000 }), true);
  assert.equal(isRealtimeMatchStarted({ status: "finished" }), true);
  assert.equal(isRealtimeMatchStarted({ status: "playing", players: [{ readyAt: now }] }), true);
});

test("API 底房超时、真正 waiting_ready 超时都算准备超时", () => {
  assert.equal(isWaitingReadyLifecycleTimedOut({
    status: "waiting_ready",
    waitingReadyEndsAt: now - 1
  }, now), true);
  assert.equal(isWaitingReadyLifecycleTimedOut({
    status: "waiting_ready",
    waitingReadyEndsAt: now + 1
  }, now), false);
  assert.equal(isWaitingReadyLifecycleTimedOut({
    status: "playing",
    mode: "pi_battle",
    waitingReadyEndsAt: now - 1
  }, now), true);
  assert.equal(isWaitingReadyLifecycleTimedOut({
    status: "playing",
    mode: "pi_battle",
    waitingReadyEndsAt: now - 1,
    endsAt: now + 80_000
  }, now), false);
});

test("未进 WS 的冻结付费房在准备窗+宽限后才对账", () => {
  assert.equal(shouldReconcileUnjoinedPaidRoom({
    battle: frozenPaid,
    baseRoom: { status: "playing", mode: "pi_battle", waitingReadyEndsAt: now - 20_000 },
    realtimeRoom: null,
    now
  }), true);

  assert.equal(shouldReconcileUnjoinedPaidRoom({
    battle: frozenPaid,
    baseRoom: { status: "playing", mode: "pi_battle", waitingReadyEndsAt: now - 5_000 },
    realtimeRoom: null,
    now
  }), false);

  assert.equal(shouldReconcileUnjoinedPaidRoom({
    battle: { ...frozenPaid, asset_settlement_status: "" },
    baseRoom: { status: "playing", mode: "pi_battle", waitingReadyEndsAt: now - 20_000 },
    now
  }), false);
});

test("已经开打或终局的房即使门票还冻着也不走这条对账", () => {
  assert.equal(shouldReconcileUnjoinedPaidRoom({
    battle: frozenPaid,
    realtimeRoom: { status: "playing", endsAt: now + 50_000 },
    now
  }), false);
  assert.equal(shouldReconcileUnjoinedPaidRoom({
    battle: frozenPaid,
    realtimeRoom: { status: "finished", winnerUid: "" },
    now
  }), false);
});

test("realtime 停在 waiting_ready 且已超时，可以补退票", () => {
  assert.equal(shouldReconcileUnjoinedPaidRoom({
    battle: frozenPaid,
    realtimeRoom: { status: "waiting_ready", waitingReadyEndsAt: now - 8_000 },
    now
  }), true);
  assert.equal(shouldReconcileUnjoinedPaidRoom({
    battle: frozenPaid,
    realtimeRoom: { status: "waiting_ready", waitingReadyEndsAt: now - 1_000 },
    now
  }), false);
});

test("没有时间戳时用 created_at + 30s 当准备截止", () => {
  assert.equal(getWaitingReadyDeadlineMs({ created_at: now - 40_000 }), now - 10_000);
  assert.equal(getWaitingReadyDeadlineMs({ waitingReadyEndsAt: now + 5_000, created_at: now - 40_000 }), now + 5_000);
});
