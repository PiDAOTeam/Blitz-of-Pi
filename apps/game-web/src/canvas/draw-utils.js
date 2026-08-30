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

// 特殊块颜色阈值（与引擎 TILE_H 同值，绘制层用于判断棋子是否高亮）
const wa = 10;

export function drawCanvasTileBody(e, t, r, o, s, l, c, lite = false) {
  const d = t.color || "#8a35ff", u = Math.min(o.w, o.h);
  if (lite) {
    canvasRoundRect(e, o.x, o.y + 1, o.w, o.h, s), e.fillStyle = "rgba(0, 0, 0, .22)", e.fill();
    canvasRoundRect(e, o.x + 0.5, o.y + 0.5, o.w - 1, o.h - 1, s);
    e.shadowBlur = 0, e.fillStyle = d, e.fill();
    e.strokeStyle = r >= wa || c.glow > 0 ? "rgba(255, 245, 174, .55)" : "rgba(255, 249, 218, .22)";
    e.lineWidth = r >= wa ? 1.4 : 1, canvasRoundRect(e, o.x + 0.5, o.y + 0.5, o.w - 1, o.h - 1, s), e.stroke();
    return;
  }
  const h = canvasShadeColor(d, 0.34), p = canvasShadeColor(d, -0.36);
  canvasRoundRect(e, o.x, o.y + Math.max(2, u * 0.055), o.w, o.h, s), e.fillStyle = "rgba(0, 0, 0, .34)", e.fill();
  canvasRoundRect(e, o.x + 0.5, o.y + 0.5, o.w - 1, o.h - 1, s);
  const f = e.createLinearGradient(o.x, o.y, o.x + o.w, o.y + o.h);
  f.addColorStop(0, h), f.addColorStop(0.18, d), f.addColorStop(0.68, d), f.addColorStop(1, p);
  e.shadowColor = r >= wa || c.glow > 0 ? canvasHexToRgba(d, l ? 0.72 : 0.48) : "rgba(255, 228, 123, .18)", e.shadowBlur = l ? 16 : 9, e.fillStyle = f, e.fill(), e.shadowBlur = 0;
  const m = e.createLinearGradient(o.x, o.y, o.x, o.y + o.h);
  m.addColorStop(0, "rgba(255,255,255,.52)"), m.addColorStop(0.2, "rgba(255,255,255,.16)"), m.addColorStop(0.56, "rgba(0,0,0,.04)"), m.addColorStop(1, "rgba(0,0,0,.36)"), e.fillStyle = m, e.fill();
  canvasRoundRect(e, o.x + u * 0.08, o.y + u * 0.07, o.w * 0.72, o.h * 0.32, Math.max(4, s * 0.58)), e.fillStyle = "rgba(255,255,255,.18)", e.fill();
  e.beginPath(), e.moveTo(o.x + o.w * 0.16, o.y + o.h * 0.16), e.lineTo(o.x + o.w * 0.44, o.y + o.h * 0.08), e.strokeStyle = "rgba(255, 255, 255, .46)", e.lineWidth = Math.max(1.2, u * 0.04), e.stroke();
  e.strokeStyle = r >= wa ? "rgba(255, 245, 174, .68)" : "rgba(255, 249, 218, .28)", e.lineWidth = r >= wa ? 1.9 : 1.1, canvasRoundRect(e, o.x + 0.5, o.y + 0.5, o.w - 1, o.h - 1, s), e.stroke();
}
