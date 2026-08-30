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

// 特殊块颜色阈值（与引擎 TILE_H / TILE_V / TILE_BOMB 同值）
const wa = 10;
const ya = 20;
const ka = 30;

export function drawCanvasSpecialMark(e, t, o, lite = false) {
  if (t == null || t < wa) return;
  const s = Math.min(o.w, o.h), l = o.cx, c = o.cy;
  const bomb = t >= ka, vertical = !bomb && t >= ya;
  e.save();
  e.lineCap = "round";
  e.lineJoin = "round";
  if (bomb) {
    e.translate(l, c);
    e.shadowColor = "rgba(255, 210, 82, .55)";
    e.shadowBlur = lite ? 0 : s * 0.12;
    e.strokeStyle = "rgba(255, 236, 150, .92)";
    e.lineWidth = Math.max(1.6, s * (lite ? 0.04 : 0.045));
    e.beginPath();
    e.arc(0, 0, s * 0.2, 0, Math.PI * 2);
    e.stroke();
    e.shadowBlur = 0;
    e.fillStyle = "rgba(255, 248, 210, .96)";
    e.beginPath();
    for (let i = 0; i < 6; i += 1) {
      const a = (Math.PI / 3) * i - Math.PI / 6, r = s * 0.145;
      const x = Math.cos(a) * r, y = Math.sin(a) * r;
      if (i === 0) e.moveTo(x, y);
      else e.lineTo(x, y);
    }
    e.closePath();
    e.fill();
    e.strokeStyle = "rgba(120, 58, 10, .32)";
    e.lineWidth = 1;
    e.stroke();
    e.fillStyle = "rgba(255,255,255,.92)";
    e.beginPath();
    e.arc(-s * 0.04, -s * 0.04, Math.max(1.2, s * 0.032), 0, Math.PI * 2);
    e.fill();
    e.strokeStyle = "rgba(255, 230, 120, .88)";
    e.lineWidth = Math.max(1.2, s * 0.028);
    for (let i = 0; i < 4; i += 1) {
      const a = (Math.PI / 2) * i + Math.PI / 4;
      e.beginPath();
      e.moveTo(Math.cos(a) * s * 0.17, Math.sin(a) * s * 0.17);
      e.lineTo(Math.cos(a) * s * 0.26, Math.sin(a) * s * 0.26);
      e.stroke();
    }
    e.restore();
    return;
  }
  e.translate(l, c);
  if (vertical) e.rotate(Math.PI / 2);
  const half = s * 0.34, thick = s * 0.085;
  const u = e.createLinearGradient(-half, 0, half, 0);
  if (vertical) {
    u.addColorStop(0, "rgba(255,248,180,.12)");
    u.addColorStop(0.18, "rgba(130,236,255,.92)");
    u.addColorStop(0.5, "rgba(255,255,255,1)");
    u.addColorStop(0.82, "rgba(70,190,255,.88)");
    u.addColorStop(1, "rgba(255,248,180,.12)");
    e.shadowColor = "rgba(90,220,255,.7)";
  } else {
    u.addColorStop(0, "rgba(255,248,180,.12)");
    u.addColorStop(0.18, "rgba(255,236,120,.94)");
    u.addColorStop(0.5, "rgba(255,255,255,1)");
    u.addColorStop(0.82, "rgba(255,196,70,.88)");
    u.addColorStop(1, "rgba(255,248,180,.12)");
    e.shadowColor = "rgba(255,220,80,.7)";
  }
  e.shadowBlur = lite ? 0 : s * 0.12;
  e.fillStyle = u;
  e.beginPath();
  e.moveTo(-half, 0);
  e.lineTo(-half + s * 0.1, -thick);
  e.lineTo(half - s * 0.1, -thick);
  e.lineTo(half, 0);
  e.lineTo(half - s * 0.1, thick);
  e.lineTo(-half + s * 0.1, thick);
  e.closePath();
  e.fill();
  e.shadowBlur = 0;
  e.fillStyle = "rgba(255,255,255,.94)";
  e.beginPath();
  e.moveTo(-half - s * 0.015, 0);
  e.lineTo(-half + s * 0.11, -s * 0.105);
  e.lineTo(-half + s * 0.11, s * 0.105);
  e.closePath();
  e.fill();
  e.beginPath();
  e.moveTo(half + s * 0.015, 0);
  e.lineTo(half - s * 0.11, -s * 0.105);
  e.lineTo(half - s * 0.11, s * 0.105);
  e.closePath();
  e.fill();
  e.strokeStyle = "rgba(255,255,255,.68)";
  e.lineWidth = Math.max(1.1, s * 0.018);
  e.beginPath();
  e.moveTo(-half + s * 0.14, 0);
  e.lineTo(half - s * 0.14, 0);
  e.stroke();
  e.restore();
}

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
