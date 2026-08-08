const test = require("node:test");
const assert = require("node:assert/strict");
const {
  applyRankResult,
  getKingTitle,
  getWeeklyReward,
  getWeeklyRewardTiers,
  getSeasonReward,
  getSeasonRewardTiers,
  buildRankDailyChestRelatedId
} = require("./rank.repository");

function rankConfig(overrides = {}) {
  return {
    operation: {
      ranks: [
        { key: "bronze", name: "青铜", enabled: true },
        { key: "silver", name: "白银", enabled: true },
        { key: "gold", name: "黄金", enabled: true },
        { key: "platinum", name: "铂金", enabled: true },
        { key: "diamond", name: "钻石", enabled: true },
        { key: "starlight", name: "星耀", enabled: true },
        { key: "king", name: "王者", enabled: true }
      ],
      rankRules: {
        starsPerRank: 5,
        winStars: 1,
        loseStars: 1,
        winStreakBonusEnabled: false,
        quickBattleMaxRankKey: "silver",
        ticketBattleMaxRankKey: "king",
        kingTitles: [
          { minStars: 0, title: "王者" },
          { minStars: 10, title: "荣耀王者" },
          { minStars: 25, title: "传奇王者" },
          { minStars: 50, title: "无双王者" },
          { minStars: 100, title: "巅峰王者" }
        ],
        weeklyRewardTiers: [
          { fromRank: 1, toRank: 1, amount: 5 },
          { fromRank: 2, toRank: 2, amount: 3 },
          { fromRank: 3, toRank: 3, amount: 3 },
          { fromRank: 4, toRank: 10, amount: 1 },
          { fromRank: 11, toRank: 100, amount: 0.4 }
        ],
        seasonRewardTiers: [
          { fromRank: 1, toRank: 1, points: 300 },
          { fromRank: 2, toRank: 3, points: 200 },
          { fromRank: 4, toRank: 10, points: 100 },
          { fromRank: 11, toRank: 100, points: 50 }
        ],
        ...overrides
      }
    }
  };
}

test("king rank keeps gaining stars after reaching the configured mode cap", () => {
  const config = rankConfig();
  const next = applyRankResult(
    { rank_key: "king", rank_name: "王者", stars: 5, win_streak: 0 },
    config,
    "win",
    "points_battle"
  );

  assert.equal(next.rankKey, "king");
  assert.equal(next.stars, 6);
  assert.equal(next.starDelta, 1);
});

test("non-final configured cap still prevents growth past the cap", () => {
  const config = rankConfig({ ticketBattleMaxRankKey: "platinum" });
  const next = applyRankResult(
    { rank_key: "platinum", rank_name: "铂金", stars: 5, win_streak: 0 },
    config,
    "win",
    "points_battle"
  );

  assert.equal(next.rankKey, "platinum");
  assert.equal(next.stars, 5);
  assert.equal(next.starDelta, 0);
});

test("king titles follow configured star thresholds", () => {
  const config = rankConfig();

  assert.equal(getKingTitle(config, "king", 9), "王者");
  assert.equal(getKingTitle(config, "king", 10), "荣耀王者");
  assert.equal(getKingTitle(config, "king", 25), "传奇王者");
  assert.equal(getKingTitle(config, "king", 50), "无双王者");
  assert.equal(getKingTitle(config, "king", 100), "巅峰王者");
});

test("weekly rewards stay in Pi tier amounts", () => {
  const tiers = getWeeklyRewardTiers(rankConfig().operation.rankRules);

  assert.equal(getWeeklyReward(1, tiers), 5);
  assert.equal(getWeeklyReward(2, tiers), 3);
  assert.equal(getWeeklyReward(3, tiers), 3);
  assert.equal(getWeeklyReward(10, tiers), 1);
  assert.equal(getWeeklyReward(11, tiers), 0.4);
  assert.equal(getWeeklyReward(101, tiers), 0);
});

test("monthly season rewards stay integer POINTS tiers", () => {
  const tiers = getSeasonRewardTiers(rankConfig().operation.rankRules);

  assert.equal(getSeasonReward(1, tiers), 300);
  assert.equal(getSeasonReward(2, tiers), 200);
  assert.equal(getSeasonReward(3, tiers), 200);
  assert.equal(getSeasonReward(10, tiers), 100);
  assert.equal(getSeasonReward(11, tiers), 50);
  assert.equal(getSeasonReward(101, tiers), 0);
  assert.ok(tiers.every((tier) => Number.isInteger(tier.points)));
});

test("daily chest ledger id uses the database business date", () => {
  assert.equal(
    buildRankDailyChestRelatedId("pi-user-1", "2026-08-08"),
    "pi-user-1:2026-08-08"
  );
});
