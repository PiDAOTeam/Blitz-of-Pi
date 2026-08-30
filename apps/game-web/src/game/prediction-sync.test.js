import test from "node:test";
import assert from "node:assert/strict";
import { BOARD_ROWS as R, BOARD_COLS as C } from "./match3-engine.js";
import {
  shouldPreservePredictedSelf,
  shouldClearAllPending,
  mergeAuthoritativeRoom,
  isPendingFullyResolved,
  isBenignSwapReject,
  previewSwapOnBoard,
  rebasePendingPredictions
} from "./prediction-sync.js";

function checkerBoard() {
  return Array.from({ length: R }, (_, i) => Array.from({ length: C }, (_, j) => (i * 7 + j * 3) % 5));
}

function matchBoard() {
  const board = checkerBoard();
  board[R - 1][0] = 0;
  board[R - 1][1] = 0;
  board[R - 1][2] = 2;
  board[R - 1][3] = 0;
  return board;
}

const current = {
  roomNo: "r1",
  status: "playing",
  players: [
    { uid: "me", board: [[1, 2], [3, 4]], score: 80, combo: 2, lastGain: 20, pressure: 4 },
    { uid: "foe", board: [[5]], score: 10, pressure: 1 }
  ]
};
const incoming = {
  roomNo: "r1",
  status: "playing",
  version: 9,
  remainSeconds: 40,
  players: [
    { uid: "me", board: [[9, 9], [9, 9]], score: 40, combo: 1, lastGain: 10, pressure: 6 },
    { uid: "foe", board: [[8]], score: 30, pressure: 3 }
  ]
};

test("有 pending 的 state 保留己方预测盘，对手仍跟服务器", () => {
  assert.equal(shouldPreservePredictedSelf({ reason: "state", pendingCount: 1, status: "playing" }), true);
  assert.equal(shouldPreservePredictedSelf({ reason: "ack", pendingCount: 0, status: "playing" }), false);

  const { room, preserved } = mergeAuthoritativeRoom(current, incoming, "me", { reason: "state", pendingCount: 1 });
  assert.equal(preserved, true);
  assert.deepEqual(room.players[0].board, [[1, 2], [3, 4]]);
  assert.equal(room.players[0].score, 80);
  assert.equal(room.players[1].score, 30);
  assert.equal(room.remainSeconds, 40);
});

test("最后一步 ack、拒步、快照、终局都吃服务器房间", () => {
  assert.equal(shouldClearAllPending("reject", "playing"), true);
  assert.equal(shouldClearAllPending("snapshot", "playing"), true);
  assert.equal(shouldClearAllPending("ack", "finished"), true);
  assert.equal(shouldClearAllPending("ack", "playing"), false);

  const lastAck = mergeAuthoritativeRoom(current, incoming, "me", { reason: "ack", pendingCount: 0 });
  assert.equal(lastAck.preserved, false);
  assert.deepEqual(lastAck.room.players[0].board, [[9, 9], [9, 9]]);

  const reject = mergeAuthoritativeRoom(current, incoming, "me", { reason: "reject", pendingCount: 2 });
  assert.equal(reject.preserved, false);
  assert.equal(reject.room.players[0].score, 40);
});

test("pending 必须覆盖到最后一步才算结束", () => {
  assert.equal(isPendingFullyResolved({ pendingSeqs: [5, 6, 7], latestEventSeq: 5 }), false);
  assert.equal(isPendingFullyResolved({ pendingSeqs: [5, 6, 7], latestEventSeq: 7 }), true);
  assert.equal(isPendingFullyResolved({ pendingSeqs: [5], finished: true }), true);
  assert.equal(isPendingFullyResolved({ pendingSeqs: [] }), false);
});

test("重复序号和限速拒步不当成回滚", () => {
  assert.equal(isBenignSwapReject({ reason: "duplicate_seq" }), true);
  assert.equal(isBenignSwapReject({ reasonCode: "rate_limited" }), true);
  assert.equal(isBenignSwapReject({ reasonCode: "rule_rejected" }), false);
});

test("ack 后把剩余 pending 叠回服务器盘", () => {
  const serverBoard = matchBoard();
  const pending = [{ seq: 2, positions: [{ row: R - 1, col: 2 }, { row: R - 1, col: 3 }] }];
  const preview = previewSwapOnBoard(serverBoard, pending[0].positions[0], pending[0].positions[1], 2, { roomNo: "r1", version: 3 });
  assert.ok(preview, "构造的交换应能消");
  assert.ok(preview.scoreGain > 0);

  const room = {
    roomNo: "r1",
    status: "playing",
    version: 3,
    players: [
      { uid: "me", board: serverBoard, score: 20, combo: 1, lastGain: 10, pressure: 5 },
      { uid: "foe", board: checkerBoard(), score: 8, pressure: 2 }
    ]
  };
  const merged = mergeAuthoritativeRoom(room, room, "me", { reason: "ack", pendingCount: 1, pendingSwaps: pending });
  assert.equal(merged.rebased, true);
  assert.equal(merged.room.players[0].score, 20 + preview.scoreGain);
  assert.notDeepEqual(merged.room.players[0].board, serverBoard);

  const silent = rebasePendingPredictions({ board: serverBoard, combo: 1, lastGain: 10 }, pending, { roomNo: "r1", version: 3 });
  assert.deepEqual(silent.applied, [2]);
  assert.equal(silent.extraScore, preview.scoreGain);
});
