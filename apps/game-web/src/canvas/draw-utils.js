// Canvas 纯绘制工具 —— 由 main.js 抽离，逐字搬迁，无状态依赖（只用入参）。

export function canvasRoundRect(e, t, r, o, s, l) {
  e.beginPath(), e.roundRect ? e.roundRect(t, r, o, s, l) : (e.moveTo(t + l, r), e.lineTo(t + o - l, r), e.quadraticCurveTo(t + o, r, t + o, r + l), e.lineTo(t + o, r + s - l), e.quadraticCurveTo(t + o, r + s, t + o - l, r + s), e.lineTo(t + l, r + s), e.quadraticCurveTo(t, r + s, t, r + s - l), e.lineTo(t, r + l), e.quadraticCurveTo(t, r, t + l, r));
}
export function canvasHexToRgba(e, t = 1) {
  const r = String(e || "").trim();
  if (!/^#[0-9a-f]{6}$/i.test(r)) return `rgba(255, 226, 120, ${t})`;
  const o = Number.parseInt(r.slice(1, 3), 16), s = Number.parseInt(r.slice(3, 5), 16), l = Number.parseInt(r.slice(5, 7), 16);
  return `rgba(${o}, ${s}, ${l}, ${t})`;
}
export function canvasShadeColor(e, t = 0) {
  const r = String(e || "").trim();
  if (!/^#[0-9a-f]{6}$/i.test(r)) return e || "#8a35ff";
  const o = Math.max(-1, Math.min(1, Number(t) || 0));
  const s = (l) => {
    const c = Number.parseInt(r.slice(l, l + 2), 16), d = o >= 0 ? 255 : 0;
    return Math.max(0, Math.min(255, Math.round(c + (d - c) * Math.abs(o)))).toString(16).padStart(2, "0");
  };
  return `#${s(1)}${s(3)}${s(5)}`;
}
