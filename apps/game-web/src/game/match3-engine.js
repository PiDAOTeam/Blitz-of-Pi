// 客户端三消引擎 —— 由 main.js 抽离的纯逻辑层（行 349-558，逐字搬迁）。
// 完全不依赖状态对象 a / DOM / 网络，只用入参与下方棋盘常量，可独立单元测试。

export const BOARD_COLS = 6;   // 棋盘列数（宽），原 Pe
export const BOARD_ROWS = 8;   // 棋盘行数（高），原 $e
export const TILE_H = 10;      // 横向特殊块基数，原 wa
export const TILE_V = 20;      // 纵向特殊块基数，原 ya
export const TILE_BOMB = 30;   // 炸弹特殊块基数，原 ka

// 函数体内沿用原短名，零改动搬迁：
const Pe = BOARD_COLS, $e = BOARD_ROWS, wa = TILE_H, ya = TILE_V, ka = TILE_BOMB;

function clientTileColor(e) {
  if (e === null || e === void 0) return null;
  return e >= ka ? e - ka : e >= ya ? e - ya : e >= wa ? e - wa : e;
}
function clientIsSpecialTile(e) {
  return e >= wa;
}
function clientSpecialKind(e) {
  return e >= ka ? "bomb" : e >= ya ? "vertical" : e >= wa ? "horizontal" : "";
}
function clientMakeSpecialTile(e, t) {
  return t === "bomb" ? ka + e : t === "vertical" ? ya + e : wa + e;
}
function clientIsSameMatchTile(e, t) {
  const r = clientTileColor(e), o = clientTileColor(t);
  return r !== null && r === o;
}
function clientCreateRandom(e = "") {
  let t = 0;
  const r = String(e || Date.now());
  for (let o = 0; o < r.length; o += 1) t = (t * 31 + r.charCodeAt(o)) >>> 0;
  t %= 2147483647, t <= 0 && (t += 2147483646);
  return () => (t = t * 16807 % 2147483647, (t - 1) / 2147483646);
}
function clientRandomTile(e) {
  return Math.floor(e() * 5);
}
function clientWouldCreateMatchAt(e, t, r, o) {
  return r >= 2 && clientIsSameMatchTile(e[t]?.[r - 1], o) && clientIsSameMatchTile(e[t]?.[r - 2], o) || r + 2 < Pe && clientIsSameMatchTile(e[t]?.[r + 1], o) && clientIsSameMatchTile(e[t]?.[r + 2], o) || t >= 2 && clientIsSameMatchTile(e[t - 1]?.[r], o) && clientIsSameMatchTile(e[t - 2]?.[r], o) || t + 2 < $e && clientIsSameMatchTile(e[t + 1]?.[r], o) && clientIsSameMatchTile(e[t + 2]?.[r], o);
}
function clientSafeRandomTile(e, t, r, o) {
  for (let s = 0; s < 15; s += 1) {
    const l = clientRandomTile(o);
    if (!clientWouldCreateMatchAt(e, t, r, l)) return l;
  }
  for (let s = 0; s < 5; s += 1) if (!clientWouldCreateMatchAt(e, t, r, s)) return s;
  return clientRandomTile(o);
}
function clientCloneBoard(e) {
  return Array.isArray(e) ? e.map((t) => Array.isArray(t) ? [...t] : []) : [];
}
function clientIsInside(e, t) {
  return t && t.row >= 0 && t.row < e.length && Array.isArray(e[t.row]) && t.col >= 0 && t.col < e[t.row].length;
}
function clientSwap(e, t, r) {
  const o = e[t.row][t.col];
  e[t.row][t.col] = e[r.row][r.col], e[r.row][r.col] = o;
}
function clientFindMatches(e) {
  const t = /* @__PURE__ */ new Set(), r = [];
  for (let o = 0; o < e.length; o += 1) {
    let s = 0, l = clientTileColor(e[o]?.[0]);
    for (let c = 1; c <= (e[o]?.length || 0); c += 1) {
      const d = c < e[o].length ? clientTileColor(e[o][c]) : null;
      if (d !== l || l === null) {
        const u = c - s;
        if (l !== null && u >= 3) {
          const h = [];
          for (let p = s; p < c; p += 1) t.add(`${o}:${p}`), h.push({ row: o, col: p });
          r.push({ orientation: "horizontal", length: u, color: l, cells: h });
        }
        s = c, l = d;
      }
    }
  }
  for (let o = 0; o < Pe; o += 1) {
    let s = 0, l = clientTileColor(e[0]?.[o]);
    for (let c = 1; c <= e.length; c += 1) {
      const d = c < e.length ? clientTileColor(e[c]?.[o]) : null;
      if (d !== l || l === null) {
        const u = c - s;
        if (l !== null && u >= 3) {
          const h = [];
          for (let p = s; p < c; p += 1) t.add(`${p}:${o}`), h.push({ row: p, col: o });
          r.push({ orientation: "vertical", length: u, color: l, cells: h });
        }
        s = c, l = d;
      }
    }
  }
  return t.runs = r, t;
}
function clientAddSpecialTargets(e, t, r = null) {
  const o = /* @__PURE__ */ new Set();
  for (const s of t) {
    const [l, c] = s.split(":").map(Number), d = e[l]?.[c];
    if (!clientIsSpecialTile(d)) continue;
    const u = clientSpecialKind(d);
    r && !r.some((h) => h.kind === u && h.position?.row === l && h.position?.col === c) && r.push({ kind: u, position: { row: l, col: c }, tile: d });
    if (u === "horizontal") for (let h = 0; h < Pe; h += 1) o.add(`${l}:${h}`);
    else if (u === "vertical") for (let h = 0; h < e.length; h += 1) o.add(`${h}:${c}`);
    else if (u === "bomb") for (let h = l - 1; h <= l + 1; h += 1) for (let p = c - 1; p <= c + 1; p += 1) h >= 0 && h < e.length && p >= 0 && p < Pe && o.add(`${h}:${p}`);
  }
  for (const s of o) t.add(s);
  return o.size;
}
function clientSpecialCreation(e, t) {
  const r = (Array.isArray(e.runs) ? e.runs : []).filter((o) => o.length >= 4).sort((o, s) => s.length - o.length);
  if (!r.length) return null;
  const o = r[0], s = [t?.to, t?.from].find((l) => l && o.cells.some((c) => c.row === l.row && c.col === l.col));
  const l = o.length >= 5 ? "bomb" : o.orientation === "horizontal" ? "horizontal" : "vertical";
  return { kind: l, position: s || o.cells[Math.floor(o.cells.length / 2)], tile: clientMakeSpecialTile(o.color, l) };
}
function clientDirectSpecialMatches(e, t, r, o = null) {
  const s = /* @__PURE__ */ new Set();
  [t, r].forEach((l) => {
    clientIsInside(e, l) && clientIsSpecialTile(e[l.row][l.col]) && s.add(`${l.row}:${l.col}`);
  });
  return s.size && clientAddSpecialTargets(e, s, o), s;
}
function clientCollapseBoard(e, t, motions = null) {
  for (let r = 0; r < Pe; r += 1) {
    const o = [];
    const src = [];
    for (let s = $e - 1; s >= 0; s -= 1) {
      if (e[s]?.[r] !== null && e[s]?.[r] !== void 0) {
        o.push(e[s][r]);
        src.push(s);
      }
    }
    const holes = $e - o.length;
    for (let s = $e - 1; s >= 0; s -= 1) {
      const idx = $e - 1 - s;
      if (idx < o.length) {
        const fromRow = src[idx];
        e[s][r] = o[idx];
        if (motions && fromRow !== s) motions.push({ tile: o[idx], col: r, fromRow, toRow: s, spawn: false });
      } else {
        const tile = clientSafeRandomTile(e, s, r, t);
        e[s][r] = tile;
        if (motions) motions.push({ tile, col: r, fromRow: s - holes, toRow: s, spawn: true });
      }
    }
  }
}
function clientHasValidMove(e) {
  for (let t = 0; t < $e; t += 1) for (let r = 0; r < Pe; r += 1) {
    const o = [{ row: t, col: r + 1 }, { row: t + 1, col: r }];
    for (const s of o) {
      if (!clientIsInside(e, s)) continue;
      const l = clientCloneBoard(e);
      clientSwap(l, { row: t, col: r }, s);
      if (clientIsSpecialTile(l[t]?.[r]) || clientIsSpecialTile(l[s.row]?.[s.col]) || clientFindMatches(l).size > 0) return true;
    }
  }
  return false;
}
function clientCreateCandidateBoard(e) {
  const t = Array.from({ length: $e }, () => Array.from({ length: Pe }, () => null));
  for (let r = 0; r < $e; r += 1) for (let o = 0; o < Pe; o += 1) t[r][o] = clientSafeRandomTile(t, r, o, e);
  let r = 0;
  for (; clientFindMatches(t).size > 0 && r < 20; ) {
    const o = clientFindMatches(t);
    for (const s of o) {
      const [l, c] = s.split(":").map(Number);
      t[l][c] = clientSafeRandomTile(t, l, c, e);
    }
    r += 1;
  }
  return t;
}
function clientRefillBoardIfStuck(e, t) {
  if (clientHasValidMove(e)) return;
  const r = clientCreateCandidateBoard(clientCreateRandom(`${t?.roomNo || ""}:refill:${t?.version || 0}:${Date.now()}`));
  for (let o = 0; o < $e; o += 1) for (let s = 0; s < Pe; s += 1) e[o][s] = r[o][s];
}
function clientResolveBoard(e, t, r = null) {
  const n = [], y = [];
  let o = 0, s = 0, l = 0, c = 0, d = 0, u = r ? clientDirectSpecialMatches(e, r.from, r.to, n) : /* @__PURE__ */ new Set();
  let firstClears = [], firstFalls = [], afterFirstCollapse = null;
  for (; o < 4; ) {
    const h = u.size > 0 ? u : clientFindMatches(e);
    if (u = /* @__PURE__ */ new Set(), h.size === 0) break;
    o += 1;
    const p = clientAddSpecialTargets(e, h, n);
    c += p > 0 ? 1 : 0;
    const f = clientSpecialCreation(h, o === 1 ? r : null), m = Math.min(h.size, 18), g = Math.min(m, Math.max(0, 18 - s));
    s += g, l += g * 10 + Math.min(o - 1, 3) * 8 + c * 8;
    if (o === 1) firstClears = [...h].map((P) => {
      const [C, T] = String(P).split(":").map(Number);
      return { row: C, col: T };
    });
    for (const P of h) {
      const [C, T] = P.split(":").map(Number);
      e[C][T] = null;
    }
    f && e[f.position.row]?.[f.position.col] === null && (e[f.position.row][f.position.col] = f.tile, y.push({ kind: f.kind, position: f.position, tile: f.tile }), d += 1);
    const falls = [];
    clientCollapseBoard(e, t, o === 1 ? falls : null);
    if (o === 1) {
      firstFalls = falls;
      afterFirstCollapse = clientCloneBoard(e);
    }
    if (s >= 18) break;
  }
  return { chain: o, totalCleared: s, scoreGain: l, specialTriggered: c, specialCreated: d, specialFx: n, specialBirths: y, firstClears, firstFalls, afterFirstCollapse };
}
function clientSettleRemainingMatches(e, t) {
  let r = 0;
  for (; clientFindMatches(e).size > 0 && r < 8; ) {
    for (const o of clientFindMatches(e)) {
      const [s, l] = o.split(":").map(Number);
      e[s][l] = null;
    }
    clientCollapseBoard(e, t), r += 1;
  }
}
function battleClearCount(e) {
  return Math.max(0, Number(e?.cleared ?? e?.totalCleared ?? 0));
}
function battleChainCount(e) {
  return Math.max(1, Number(e?.chain || 1));
}
function battleFeedbackPower(e) {
  const t = battleChainCount(e), r = battleClearCount(e);
  return Math.min(6, Math.max(0, t - 1) + (r >= 8 ? 3 : r >= 6 ? 2 : r >= 4 ? 1 : 0) + (e?.specialTriggered ? 2 : 0) + (e?.specialCreated ? 1 : 0) + (Number(e?.attack || 0) > 0 ? 1 : 0));
}
function battleIsMegaFeedback(e) {
  return battleChainCount(e) >= 3 || battleClearCount(e) >= 6 || !!e?.specialTriggered || Number(e?.specialCreated || 0) > 0 && battleClearCount(e) >= 5;
}
function battleBurstText(e) {
  const t = battleChainCount(e), r = battleClearCount(e), o = Number(e?.scoreGain || 0), s = Number(e?.attack || 0);
  return e?.specialTriggered && t >= 3 ? `\u8FDE\u7206x${t} +${o}` : e?.specialTriggered ? `\u95EA\u7535\u7206\u53D1 +${o}` : e?.specialCreated && r >= 5 ? `\u70B8\u5F39\u751F\u6210 +${o}` : e?.specialCreated ? `\u95EA\u7535\u751F\u6210 +${o}` : s > 0 && t >= 3 ? `\u8FDE\u51FB\u7535\u51FB +${s}` : s > 0 ? `\u7535\u51FB +${s}` : t >= 4 ? `\u6781\u9650\u8FDE\u51FBx${t}` : t >= 3 ? `\u95EA\u7535\u8FDE\u51FBx${t}` : t > 1 && r >= 6 ? `\u8FDE\u51FBx${t} \u5927\u6D88` : t > 1 ? `\u8FDE\u51FBx${t} +${o}` : r >= 8 ? `\u5168\u573A\u5927\u6D88 +${o}` : r >= 6 ? `\u5927\u6D88\u9664 +${o}` : r >= 4 ? `${r}\u6D88 +${o}` : `+${o}`;
}
function battlePraiseCue(e) {
  if (!e) return "";
  const t = battleChainCount(e), r = battleClearCount(e), o = Number(e?.specialTriggered || 0), s = Number(e?.specialCreated || 0);
  return o && t >= 4 || t >= 6 || r >= 12 ? "Wonderful" : o || t >= 5 || r >= 10 ? "Crazy" : t >= 4 || r >= 8 ? "Unbelievable" : s && r >= 5 || t >= 3 || r >= 6 ? "Excellent" : s || t >= 2 || r >= 5 ? "Amazing" : r >= 4 ? "Great" : r >= 3 ? "Good" : "";
}
function waPreviewText(e) {
  return battleBurstText(e);
}
function yaPreviewSemantic(e) {
  return e.specialTriggered ? "special_triggered" : e.specialCreated ? e.cleared >= 5 ? "special_bomb" : "special_lightning" : e.attack > 0 ? "attack" : e.chain > 1 ? "combo" : e.cleared >= 4 ? "big_clear" : "score";
}
function clientPreviewTone(e) {
  return e.specialTriggered ? "attack" : battleIsMegaFeedback(e) ? "mega" : e.specialCreated ? "combo" : e.attack > 0 ? "attack" : e.chain > 1 ? "combo" : e.cleared >= 4 ? "clear" : "score";
}

export {
  clientTileColor,
  clientIsSpecialTile,
  clientSpecialKind,
  clientMakeSpecialTile,
  clientIsSameMatchTile,
  clientCreateRandom,
  clientRandomTile,
  clientWouldCreateMatchAt,
  clientSafeRandomTile,
  clientCloneBoard,
  clientIsInside,
  clientSwap,
  clientFindMatches,
  clientAddSpecialTargets,
  clientSpecialCreation,
  clientDirectSpecialMatches,
  clientCollapseBoard,
  clientHasValidMove,
  clientCreateCandidateBoard,
  clientRefillBoardIfStuck,
  clientResolveBoard,
  clientSettleRemainingMatches,
  battleClearCount,
  battleChainCount,
  battleFeedbackPower,
  battleIsMegaFeedback,
  battleBurstText,
  battlePraiseCue,
  waPreviewText,
  yaPreviewSemantic,
  clientPreviewTone
};
