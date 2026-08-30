// 客户端三消引擎单元测试 —— 覆盖预测核心逻辑，作为后续重构的安全网。
// 运行：npm test （node --test）
import test from "node:test";
import assert from "node:assert/strict";
import * as E from "./match3-engine.js";

const { BOARD_ROWS: R, BOARD_COLS: C } = E;

function emptyBoard() {
  return Array.from({ length: R }, () => Array.from({ length: C }, () => null));
}
// 棋盘格花色 (i*7+j*3)%5：已验证初始无三连，作为「无匹配」干净基线
function checkerBoard() {
  return Array.from({ length: R }, (_, i) => Array.from({ length: C }, (_, j) => (i * 7 + j * 3) % 5));
}

test("常量与游戏规则一致", () => {
  assert.equal(E.BOARD_COLS, 6);
  assert.equal(E.BOARD_ROWS, 8);
  assert.equal(E.TILE_H, 10);
  assert.equal(E.TILE_V, 20);
  assert.equal(E.TILE_BOMB, 30);
});

test("clientCreateRandom 确定性：同 seed 同序列（预测可复现的基石）", () => {
  const a = E.clientCreateRandom("seed-x");
  const b = E.clientCreateRandom("seed-x");
  for (let i = 0; i < 50; i += 1) assert.equal(a(), b());
  // 不同 seed 应不同
  assert.notEqual(E.clientCreateRandom("a")(), E.clientCreateRandom("b")());
  // 输出落在 [0,1)
  const r = E.clientCreateRandom("range");
  for (let i = 0; i < 100; i += 1) {
    const v = r();
    assert.ok(v >= 0 && v < 1, `值越界: ${v}`);
  }
});

test("clientRandomTile 落在 [0,5)", () => {
  const r = E.clientCreateRandom("tiles");
  for (let i = 0; i < 200; i += 1) {
    const t = E.clientRandomTile(r);
    assert.ok(Number.isInteger(t) && t >= 0 && t < 5, `非法 tile: ${t}`);
  }
});

test("特殊块编解码：颜色与类型往返一致", () => {
  // 普通块
  assert.equal(E.clientTileColor(3), 3);
  assert.equal(E.clientIsSpecialTile(3), false);
  assert.equal(E.clientSpecialKind(3), "");
  // 三类特殊块
  for (const [kind, base] of [["horizontal", E.TILE_H], ["vertical", E.TILE_V], ["bomb", E.TILE_BOMB]]) {
    for (let color = 0; color < 5; color += 1) {
      const tile = E.clientMakeSpecialTile(color, kind);
      assert.equal(tile, base + color);
      assert.equal(E.clientTileColor(tile), color, `${kind} 色解码错`);
      assert.equal(E.clientSpecialKind(tile), kind, `${kind} 类型解码错`);
      assert.equal(E.clientIsSpecialTile(tile), true);
    }
  }
  // null/undefined 安全
  assert.equal(E.clientTileColor(null), null);
  assert.equal(E.clientTileColor(undefined), null);
});

test("clientIsSameMatchTile：同色（含特殊块）视为可消", () => {
  assert.equal(E.clientIsSameMatchTile(2, 2), true);
  assert.equal(E.clientIsSameMatchTile(2, E.clientMakeSpecialTile(2, "bomb")), true); // 特殊块同色
  assert.equal(E.clientIsSameMatchTile(2, 3), false);
  assert.equal(E.clientIsSameMatchTile(null, null), false); // null 不匹配
});

test("clientFindMatches：横/竖三连、四连检测", () => {
  // 横三连
  let b = emptyBoard();
  b[0][0] = 0; b[0][1] = 0; b[0][2] = 0;
  let m = E.clientFindMatches(b);
  assert.equal(m.size, 3);
  assert.equal(m.runs.length, 1);
  assert.equal(m.runs[0].orientation, "horizontal");
  assert.equal(m.runs[0].length, 3);

  // 竖三连
  b = emptyBoard();
  b[0][0] = 1; b[1][0] = 1; b[2][0] = 1;
  m = E.clientFindMatches(b);
  assert.equal(m.size, 3);
  assert.equal(m.runs[0].orientation, "vertical");

  // 四连
  b = emptyBoard();
  b[0][0] = 2; b[0][1] = 2; b[0][2] = 2; b[0][3] = 2;
  m = E.clientFindMatches(b);
  assert.equal(m.size, 4);
  assert.equal(m.runs[0].length, 4);

  // 无匹配
  b = emptyBoard();
  b[0][0] = 0; b[0][1] = 1; b[0][2] = 2;
  assert.equal(E.clientFindMatches(b).size, 0);
});

test("clientSpecialCreation：四连生成横/竖特殊块，五连生成炸弹", () => {
  // 四连横 → horizontal 特殊块
  let b = emptyBoard();
  b[0][0] = 1; b[0][1] = 1; b[0][2] = 1; b[0][3] = 1;
  let m = E.clientFindMatches(b);
  let sp = E.clientSpecialCreation(m, null);
  assert.ok(sp);
  assert.equal(sp.kind, "horizontal");
  assert.equal(E.clientTileColor(sp.tile), 1);

  // 五连 → bomb
  b = emptyBoard();
  for (let j = 0; j < 5; j += 1) b[0][j] = 2;
  m = E.clientFindMatches(b);
  sp = E.clientSpecialCreation(m, null);
  assert.equal(sp.kind, "bomb");

  // 仅三连 → 不生成
  b = emptyBoard();
  b[0][0] = 0; b[0][1] = 0; b[0][2] = 0;
  assert.equal(E.clientSpecialCreation(E.clientFindMatches(b), null), null);
});

test("clientResolveBoard：横三连产生消除、连击与得分（确定性）", () => {
  const b = checkerBoard();
  b[R - 1][0] = 0; b[R - 1][1] = 0; b[R - 1][2] = 0; // 底行造同色三连
  const res = E.clientResolveBoard(E.clientCloneBoard(b), E.clientCreateRandom("resolve-1"), null);
  assert.ok(res.totalCleared >= 3, `清除数应≥3，实际 ${res.totalCleared}`);
  assert.ok(res.chain >= 1);
  assert.ok(res.scoreGain > 0, "得分应为正");
  // 结果结构完整
  assert.ok(Array.isArray(res.specialFx));
  assert.ok(Array.isArray(res.specialBirths));

  // 干净棋盘无消除
  const clean = E.clientResolveBoard(checkerBoard(), E.clientCreateRandom("clean"), null);
  assert.equal(clean.totalCleared, 0);
  assert.equal(clean.scoreGain, 0);
});

test("clientResolveBoard：确定性可复现（同棋盘+同seed → 同结果）", () => {
  const make = () => { const b = checkerBoard(); b[R - 1][0] = 0; b[R - 1][1] = 0; b[R - 1][2] = 0; return b; };
  const r1 = E.clientResolveBoard(make(), E.clientCreateRandom("same"), null);
  const r2 = E.clientResolveBoard(make(), E.clientCreateRandom("same"), null);
  assert.deepEqual(
    { c: r1.totalCleared, ch: r1.chain, s: r1.scoreGain },
    { c: r2.totalCleared, ch: r2.chain, s: r2.scoreGain }
  );
});

test("clientCollapseBoard：重力下落，空位由顶部填充", () => {
  const b = emptyBoard();
  b[0][0] = 4; // 仅顶部一个块
  E.clientCollapseBoard(b, E.clientCreateRandom("collapse"));
  // 列被填满（无 null）
  for (let row = 0; row < R; row += 1) assert.notEqual(b[row][0], null, `行 ${row} 仍空`);
});

test("clientCollapseBoard 轨迹不改变落子结果", () => {
  const make = () => {
    const b = emptyBoard();
    b[2][1] = 3;
    b[5][1] = 4;
    return b;
  };
  const a = make(), c = make(), motions = [];
  E.clientCollapseBoard(a, E.clientCreateRandom("trace-a"));
  E.clientCollapseBoard(c, E.clientCreateRandom("trace-a"), motions);
  assert.deepEqual(a, c);
  assert.ok(motions.length > 0);
  assert.ok(motions.some((item) => item.col === 1 && item.toRow === R - 1 && item.tile === 4));
});

test("clientResolveBoard 额外轨迹字段不影响分数", () => {
  const make = () => { const b = checkerBoard(); b[R - 1][0] = 0; b[R - 1][1] = 0; b[R - 1][2] = 0; return b; };
  const r = E.clientResolveBoard(make(), E.clientCreateRandom("same"), null);
  assert.ok(Array.isArray(r.firstClears));
  assert.ok(Array.isArray(r.firstFalls));
  assert.ok(r.totalCleared >= 3);
  assert.equal(typeof r.scoreGain, "number");
});

test("clientSwap / clientIsInside：交换与边界判定", () => {
  const b = emptyBoard();
  b[0][0] = 1; b[0][1] = 2;
  E.clientSwap(b, { row: 0, col: 0 }, { row: 0, col: 1 });
  assert.equal(b[0][0], 2);
  assert.equal(b[0][1], 1);

  assert.equal(E.clientIsInside(b, { row: 0, col: 0 }), true);
  assert.equal(E.clientIsInside(b, { row: -1, col: 0 }), false);
  assert.equal(E.clientIsInside(b, { row: R, col: 0 }), false);
  assert.equal(E.clientIsInside(b, { row: 0, col: C }), false);
});

test("clientHasValidMove / clientRefillBoardIfStuck：死局检测与补盘", () => {
  // 棋盘格化通常有合法移动
  const playable = checkerBoard();
  const hasMove = E.clientHasValidMove(playable);
  assert.equal(typeof hasMove, "boolean");

  // refill 后必有合法移动（candidate board 保证）
  const b = checkerBoard();
  E.clientRefillBoardIfStuck(b, { roomNo: "T", version: 1 });
  assert.equal(E.clientHasValidMove(b), true, "补盘后应存在合法移动");
});

test("反馈档位：battleChainCount / battleClearCount 归一", () => {
  assert.equal(E.battleChainCount({}), 1); // 缺省至少 1
  assert.equal(E.battleChainCount({ chain: 3 }), 3);
  assert.equal(E.battleClearCount({}), 0);
  assert.equal(E.battleClearCount({ totalCleared: 5 }), 5);
  assert.equal(E.battleClearCount({ cleared: 7 }), 7); // 兼容 cleared 字段
});

test("battleIsMegaFeedback：连击≥3 或大消除触发", () => {
  assert.equal(E.battleIsMegaFeedback({ chain: 3 }), true);
  assert.equal(E.battleIsMegaFeedback({ cleared: 6 }), true);
  assert.equal(E.battleIsMegaFeedback({ specialTriggered: 1 }), true);
  assert.equal(E.battleIsMegaFeedback({ chain: 1, cleared: 3 }), false);
});

test("battlePraiseCue：档位映射", () => {
  assert.equal(E.battlePraiseCue(null), "");
  assert.equal(E.battlePraiseCue({ cleared: 3 }), "Good");
  assert.equal(E.battlePraiseCue({ cleared: 4 }), "Great");
  assert.equal(E.battlePraiseCue({ chain: 6 }), "Wonderful");
  // 高档位优先于低档位
  assert.equal(E.battlePraiseCue({ chain: 5 }), "Crazy");
});

test("battleFeedbackPower：0~6 区间，强反馈更高", () => {
  assert.equal(E.battleFeedbackPower({ chain: 1, cleared: 0 }), 0);
  const strong = E.battleFeedbackPower({ chain: 3, cleared: 8, specialTriggered: 1 });
  assert.ok(strong > 0 && strong <= 6, `power 越界: ${strong}`);
  // 单调性：更强的局面 power 不低于更弱的
  assert.ok(
    E.battleFeedbackPower({ chain: 4, cleared: 8, specialTriggered: 1 }) >=
    E.battleFeedbackPower({ chain: 2, cleared: 4 })
  );
});

test("clientPreviewTone / yaPreviewSemantic：语义标签", () => {
  assert.equal(E.clientPreviewTone({ attack: 2, chain: 1, cleared: 3 }), "attack");
  assert.equal(E.clientPreviewTone({ chain: 2, cleared: 3 }), "combo");
  assert.equal(E.yaPreviewSemantic({ specialTriggered: 1 }), "special_triggered");
  assert.equal(E.yaPreviewSemantic({ attack: 1, chain: 1 }), "attack");
});
