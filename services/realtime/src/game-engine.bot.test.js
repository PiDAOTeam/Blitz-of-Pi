const test = require("node:test");
const assert = require("node:assert/strict");
const { applyBotMove, getBotDifficultyProfile } = require("./game-engine");

function makeRoom({ remainSeconds = 60, humanScore = 7000, botScore = 4000, target = 4400 } = {}) {
  const now = Date.now();
  return {
    roomNo: "bot-style-test",
    mode: "points_battle",
    status: "playing",
    timing: { vsIntroSeconds: 0, readyCountdownSeconds: 0, paidRoundSeconds: 90 },
    botConfig: {
      difficulty: "expert",
      targetScoreMin: target,
      targetScoreMax: target,
      moveIntervalSeconds: 0.85
    },
    createdAt: now - 30000,
    readyEndsAt: now - 1000,
    endsAt: now + remainSeconds * 1000,
    roundSeconds: 90,
    randomSeed: 17,
    randomNonce: 0,
    version: 1,
    events: [],
    players: [
      { uid: "human_1", isBot: false, score: humanScore, pressure: 0, combo: 1, lastGain: 0, validMoveCount: 8 },
      { uid: "bot_1", isBot: true, score: botScore, pressure: 0, combo: 1, lastGain: 0, validMoveCount: 8 }
    ]
  };
}

test("expert hard cap still holds when the human is far ahead", () => {
  const profile = getBotDifficultyProfile("expert");
  const room = makeRoom({ remainSeconds: 50, humanScore: 9000, botScore: 4000, target: 4400 });
  for (let i = 0; i < 80; i += 1) {
    applyBotMove(room);
  }
  const bot = room.players.find((player) => player.isBot);
  assert.ok(bot.score <= 4400 + profile.overTargetAllowance);
  assert.ok(bot.score < 5800);
});

test("last 15 seconds do not chase a runaway human score", () => {
  const profile = getBotDifficultyProfile("expert");
  const room = makeRoom({ remainSeconds: 12, humanScore: 8600, botScore: 5000, target: 5200 });
  room.players[1].botTargetScore = 5200;
  for (let i = 0; i < 40; i += 1) {
    applyBotMove(room);
  }
  const bot = room.players.find((player) => player.isBot);
  assert.ok(bot.score <= 5200 + profile.overTargetAllowance);
  assert.ok(bot.score < 7000);
});

test("bot late-game ticks are no longer stuck at 14/28", () => {
  const room = makeRoom({ remainSeconds: 40, humanScore: 4800, botScore: 2100, target: 5000 });
  const gains = [];
  for (let i = 0; i < 30; i += 1) {
    const before = room.players[1].score;
    applyBotMove(room);
    const gain = room.players[1].score - before;
    if (gain > 0) gains.push(gain);
  }
  assert.ok(gains.length > 0);
  assert.equal(gains.filter((gain) => gain === 14 || gain === 28).length, 0);
  assert.ok(gains.some((gain) => gain >= 30));
});
