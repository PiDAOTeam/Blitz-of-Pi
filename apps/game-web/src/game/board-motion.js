// 本地交换表现：交换位移 → 消除闪 → 下落。只服务绘制，不参与胜负。

export function easeOutQuad(t) {
  const x = Math.min(1, Math.max(0, Number(t) || 0));
  return x * (2 - x);
}

export function boardMotionTimings(lite = false, seconds = {}) {
  const swapMs = lite ? 90 : Math.max(80, Math.round(Number(seconds.localSwapSeconds || 0.15) * 1000));
  const clearMs = lite ? 70 : 110;
  const fallMs = lite ? 120 : Math.max(80, Math.round(Number(seconds.tileFallSeconds || 0.22) * 1000));
  return { swapMs, clearMs, fallMs, totalMs: swapMs + clearMs + fallMs };
}

export function buildBoardMotion({
  from,
  to,
  startBoard,
  swappedBoard,
  afterFirstCollapse,
  endBoard,
  clearCells,
  falls,
  lite = false,
  seconds = {},
  now = Date.now()
} = {}) {
  const timings = boardMotionTimings(lite, seconds);
  return {
    at: now,
    from: from || null,
    to: to || null,
    startBoard: startBoard || null,
    swappedBoard: swappedBoard || startBoard || null,
    afterFirstCollapse: afterFirstCollapse || endBoard || null,
    endBoard: endBoard || afterFirstCollapse || null,
    clearCells: Array.isArray(clearCells) ? clearCells : [],
    falls: Array.isArray(falls) ? falls : [],
    ...timings
  };
}

export function boardMotionPhase(motion, now = Date.now()) {
  if (!motion) return { name: "done", t: 1, elapsed: 0 };
  const elapsed = Math.max(0, now - Number(motion.at || 0));
  const swapMs = Math.max(1, Number(motion.swapMs || 0));
  const clearMs = Math.max(1, Number(motion.clearMs || 0));
  const totalMs = Math.max(1, Number(motion.totalMs || swapMs + clearMs + Number(motion.fallMs || 0)));
  if (elapsed < swapMs) return { name: "swap", t: elapsed / swapMs, elapsed };
  if (elapsed < swapMs + clearMs) return { name: "clear", t: (elapsed - swapMs) / clearMs, elapsed };
  if (elapsed < totalMs) return { name: "fall", t: (elapsed - swapMs - clearMs) / Math.max(1, Number(motion.fallMs || 1)), elapsed };
  return { name: "done", t: 1, elapsed };
}

export function boardMotionActive(motion, now = Date.now()) {
  return !!(motion && now - Number(motion.at || 0) < Number(motion.totalMs || 0));
}

export function pickMotionBoard(motion, logicalBoard, now = Date.now()) {
  const phase = boardMotionPhase(motion, now);
  if (phase.name === "swap") return motion.startBoard || logicalBoard;
  if (phase.name === "clear") return motion.swappedBoard || logicalBoard;
  if (phase.name === "fall") return motion.afterFirstCollapse || logicalBoard;
  return logicalBoard;
}

export function motionCellEffect(motion, row, col, tileWidth, tileHeight, gap, now = Date.now()) {
  const out = { dx: 0, dy: 0, scale: 1, alpha: 1 };
  if (!motion) return out;
  const phase = boardMotionPhase(motion, now);
  if (phase.name === "clear" && (motion.clearCells || []).some((cell) => cell.row === row && cell.col === col)) {
    out.scale = 1 - phase.t * 0.38;
    out.alpha = 1 - phase.t;
    return out;
  }
  if (phase.name === "fall") {
    const fall = (motion.falls || []).find((item) => item.toRow === row && item.col === col);
    if (fall) {
      const eased = easeOutQuad(phase.t);
      out.dy = (Number(fall.fromRow) - Number(fall.toRow)) * (Number(tileHeight) + Number(gap || 0)) * (1 - eased);
    }
  }
  return out;
}
