const test = require("node:test");
const assert = require("node:assert/strict");
const {
  getFixedPointsBotRange,
  getRankBaseDifficulty,
  resolveSmartPointsBotRange
} = require("./points-bot-difficulty");

test("rank band maps bronze to easy and king to expert", () => {
  assert.equal(getRankBaseDifficulty("bronze"), "easy");
  assert.equal(getRankBaseDifficulty("silver"), "normal");
  assert.equal(getRankBaseDifficulty("gold"), "hard");
  assert.equal(getRankBaseDifficulty("platinum"), "hard");
  assert.equal(getRankBaseDifficulty("diamond"), "expert");
  assert.equal(getRankBaseDifficulty("king"), "expert");
});

test("fixed difficulty still uses the selected band", () => {
  const range = getFixedPointsBotRange({ botDifficulty: "hard" });
  assert.equal(range.matchMode, "fixed");
  assert.equal(range.difficulty, "hard");
  assert.equal(range.minScore, 3600);
  assert.equal(range.maxScore, 4600);
});

test("smart without history uses the softer bronze band", () => {
  const range = resolveSmartPointsBotRange({ rankKey: "bronze", recentScores: [0, 120] });
  assert.equal(range.matchMode, "smart");
  assert.equal(range.difficulty, "easy");
  assert.equal(range.minScore, 1550);
  assert.equal(range.maxScore, 2150);
  assert.equal(range.overTargetAllowance, 130);
  assert.equal(range.recentMedian, 0);
});

test("smart bronze keeps typical scores on bronze instead of remapping", () => {
  const range = resolveSmartPointsBotRange({
    rankKey: "bronze",
    recentScores: [2800, 3000, 3100, 2900]
  });
  assert.equal(range.difficulty, "easy");
  assert.equal(range.recentMedian, 2950);
  assert.equal(range.minScore, 2390);
  assert.equal(range.maxScore, 2803);
  assert.equal(range.overTargetAllowance, 130);
});

test("smart bronze uses a softer window for weaker recent scores", () => {
  const range = resolveSmartPointsBotRange({
    rankKey: "bronze",
    recentScores: [2100, 2200, 2300, 2250]
  });
  assert.equal(range.difficulty, "easy");
  assert.equal(range.recentMedian, 2225);
  assert.equal(range.minScore, 1691);
  assert.equal(range.maxScore, 2003);
  assert.equal(range.overTargetAllowance, 115);
});

test("smart starlight uses a softer window for weaker recent scores", () => {
  const range = resolveSmartPointsBotRange({
    rankKey: "starlight",
    recentScores: [3600, 3700, 3800, 3750]
  });
  assert.equal(range.difficulty, "expert");
  assert.equal(range.recentMedian, 3725);
  assert.equal(range.minScore, 3204);
  assert.equal(range.maxScore, 3725);
  assert.equal(range.overTargetAllowance, 165);
});

test("smart bronze remaps only true high-score smurfs", () => {
  const range = resolveSmartPointsBotRange({
    rankKey: "bronze",
    recentScores: [4300, 4500, 4400, 4600]
  });
  assert.equal(range.difficulty, "hard");
  assert.equal(range.recentMedian, 4450);
  assert.equal(range.minScore, 3827);
  assert.equal(range.maxScore, 4450);
  assert.equal(range.overTargetAllowance, 165);
});

test("smart king targets a slightly weaker window than the player median", () => {
  const range = resolveSmartPointsBotRange({
    rankKey: "king",
    recentScores: [4500, 4800, 5000, 4700, 4900, 5100, 4600, 4850]
  });
  assert.equal(range.difficulty, "expert");
  assert.equal(range.recentMedian, 4825);
  assert.equal(range.minScore, 4343);
  assert.equal(range.maxScore, 5018);
  assert.equal(range.overTargetAllowance, 180);
});

test("smart keeps silver on the silver profile instead of promoting to expert", () => {
  const range = resolveSmartPointsBotRange({
    rankKey: "silver",
    recentScores: [3900, 4100, 4000, 4200]
  });
  assert.equal(range.difficulty, "normal");
  assert.equal(range.minScore, 3483);
  assert.equal(range.maxScore, 4050);
  assert.equal(range.overTargetAllowance, 160);
});
