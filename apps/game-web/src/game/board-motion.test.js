import test from "node:test";
import assert from "node:assert/strict";
import { easeOutQuad, boardMotionTimings, buildBoardMotion, boardMotionPhase, boardMotionActive, pickMotionBoard, motionCellEffect } from "./board-motion.js";

test("boardMotion 按时长切 swap / clear / fall / done", () => {
  const motion = buildBoardMotion({
    from: { row: 0, col: 0 },
    to: { row: 0, col: 1 },
    startBoard: [[1]],
    swappedBoard: [[2]],
    afterFirstCollapse: [[3]],
    endBoard: [[4]],
    clearCells: [{ row: 1, col: 1 }],
    falls: [{ col: 0, fromRow: 0, toRow: 2, tile: 1 }],
    lite: true,
    now: 1000
  });
  assert.equal(motion.swapMs, 90);
  assert.equal(boardMotionPhase(motion, 1000).name, "swap");
  assert.equal(boardMotionPhase(motion, 1000 + motion.swapMs + 1).name, "clear");
  assert.equal(boardMotionPhase(motion, 1000 + motion.swapMs + motion.clearMs + 1).name, "fall");
  assert.equal(boardMotionPhase(motion, 1000 + motion.totalMs).name, "done");
  assert.equal(boardMotionActive(motion, 1000 + 10), true);
  assert.equal(boardMotionActive(motion, 1000 + motion.totalMs), false);
  assert.deepEqual(pickMotionBoard(motion, [[9]], 1000), [[1]]);
  assert.deepEqual(pickMotionBoard(motion, [[9]], 1000 + motion.totalMs), [[9]]);
});

test("下落位移从 fromRow 插值到 toRow，消除格会淡出", () => {
  assert.ok(easeOutQuad(0.5) > 0.5);
  const timings = boardMotionTimings(false, { localSwapSeconds: 0.1, tileFallSeconds: 0.2 });
  const motion = buildBoardMotion({
    lite: false,
    seconds: { localSwapSeconds: 0.1, tileFallSeconds: 0.2 },
    clearCells: [{ row: 2, col: 1 }],
    falls: [{ col: 1, fromRow: 0, toRow: 2, tile: 3 }],
    now: 0
  });
  assert.equal(timings.swapMs, 100);
  const clearFx = motionCellEffect(motion, 2, 1, 40, 40, 4, motion.swapMs + 1);
  assert.ok(clearFx.alpha < 1);
  const fallStart = motionCellEffect(motion, 2, 1, 40, 40, 4, motion.swapMs + motion.clearMs);
  assert.ok(fallStart.dy < 0);
  const fallEnd = motionCellEffect(motion, 2, 1, 40, 40, 4, motion.totalMs - 1);
  assert.ok(Math.abs(fallEnd.dy) < Math.abs(fallStart.dy));
});
