const { ensureRank } = require("../repositories/rank.repository");
const { listRecentValidPointsScores } = require("../repositories/battle.repository");

const FIXED_DIFFICULTIES = ["easy", "normal", "hard", "expert"];
const RANK_BASE_DIFFICULTY = {
  bronze: "easy",
  silver: "normal",
  gold: "hard",
  platinum: "hard",
  diamond: "expert",
  starlight: "expert",
  king: "expert"
};
const RANK_SMART = {
  bronze: { minRatio: 0.81, maxRatio: 0.95, overTarget: 130, idleMin: 1550, idleMax: 2150 },
  silver: { minRatio: 0.86, maxRatio: 1, overTarget: 160, idleMin: 2200, idleMax: 2900 },
  gold: { minRatio: 0.86, maxRatio: 1, overTarget: 165, idleMin: 2700, idleMax: 3400 },
  platinum: { minRatio: 0.88, maxRatio: 1.02, overTarget: 180, idleMin: 3100, idleMax: 3900 },
  diamond: { minRatio: 0.86, maxRatio: 1, overTarget: 180, idleMin: 3400, idleMax: 4200 },
  starlight: { minRatio: 0.9, maxRatio: 1.04, overTarget: 175, idleMin: 3600, idleMax: 4400 },
  king: { minRatio: 0.9, maxRatio: 1.04, overTarget: 180, idleMin: 3900, idleMax: 4700 }
};
const RANK_SMART_SOFT = {
  bronze: { below: 2500, minRatio: 0.76, maxRatio: 0.9, overTarget: 115 },
  starlight: { below: 3900, minRatio: 0.86, maxRatio: 1, overTarget: 165 }
};
const FALLBACK_RANGES = {
  easy: { minScore: 1800, maxScore: 2600, moveIntervalSeconds: 1.5 },
  normal: { minScore: 2600, maxScore: 3600, moveIntervalSeconds: 1.2 },
  hard: { minScore: 3600, maxScore: 4600, moveIntervalSeconds: 1 },
  expert: { minScore: 4600, maxScore: 5600, moveIntervalSeconds: 0.85 }
};
const SMART_MIN_HISTORY = 1;
const SMART_SCORE_FLOOR = 1200;
const SMART_SCORE_CEILING = 7200;
const SMART_RANGE_SPAN = 200;

function clampScore(value, min, max) {
  return Math.max(min, Math.min(max, Math.round(Number(value) || 0)));
}

function medianScore(scores = []) {
  const sorted = scores.map((score) => Math.round(Number(score) || 0)).filter((score) => score > 0).sort((a, b) => a - b);
  if (!sorted.length) return 0;
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

function normalizeDifficulty(value, fallback = "normal") {
  return FIXED_DIFFICULTIES.includes(String(value)) ? String(value) : fallback;
}

function getRankSmart(rankKey = "bronze", recentMedian = 0) {
  const key = String(rankKey || "bronze");
  const base = RANK_SMART[key] || RANK_SMART.bronze;
  const soft = RANK_SMART_SOFT[key];
  const median = Number(recentMedian || 0);
  if (soft && median > 0 && median < soft.below) {
    return {
      ...base,
      minRatio: soft.minRatio,
      maxRatio: soft.maxRatio,
      overTarget: soft.overTarget
    };
  }
  return base;
}

function getRangeForDifficulty(modeConfig = {}, difficulty = "normal") {
  const key = normalizeDifficulty(difficulty);
  const fallback = FALLBACK_RANGES[key];
  const range = modeConfig.botDifficultyRanges?.[key] || fallback;
  return {
    difficulty: key,
    minScore: clampScore(range.minScore || fallback.minScore, 0, 20000),
    maxScore: Math.max(
      clampScore(range.minScore || fallback.minScore, 0, 20000),
      clampScore(range.maxScore || fallback.maxScore, 0, 20000)
    ),
    moveIntervalSeconds: Math.max(0.5, Math.min(10, Number(range.moveIntervalSeconds || fallback.moveIntervalSeconds)))
  };
}

function getFixedPointsBotRange(modeConfig = {}) {
  const range = getRangeForDifficulty(modeConfig, modeConfig.botDifficulty);
  return {
    ...range,
    matchMode: "fixed",
    rankKey: "",
    recentMedian: 0,
    overTargetAllowance: 0
  };
}

function getRankBaseDifficulty(rankKey = "bronze") {
  return RANK_BASE_DIFFICULTY[String(rankKey || "bronze")] || "normal";
}

function getEffectiveSmartRank(rankKey = "bronze", recentMedian = 0) {
  const key = String(rankKey || "bronze");
  const median = Number(recentMedian || 0);
  if (key === "bronze" && median >= 4200) return "gold";
  if (key === "bronze" && median >= 3600) return "silver";
  return key;
}

function resolveSmartPointsBotRange({ rankKey = "bronze", recentScores = [], modeConfig = {} } = {}) {
  const key = String(rankKey || "bronze");
  const validScores = (recentScores || []).map((score) => Math.round(Number(score) || 0)).filter((score) => score >= 400);
  const recentMedian = validScores.length >= SMART_MIN_HISTORY ? medianScore(validScores) : 0;
  const smartKey = getEffectiveSmartRank(key, recentMedian);
  const smart = getRankSmart(smartKey, recentMedian);
  const difficulty = getRankBaseDifficulty(smartKey);
  const range = getRangeForDifficulty(modeConfig, difficulty);

  if (recentMedian <= 0) {
    return {
      difficulty,
      minScore: smart.idleMin,
      maxScore: smart.idleMax,
      moveIntervalSeconds: range.moveIntervalSeconds,
      overTargetAllowance: smart.overTarget,
      matchMode: "smart",
      rankKey: key,
      recentMedian: 0
    };
  }

  const targetMin = clampScore(recentMedian * smart.minRatio, SMART_SCORE_FLOOR, SMART_SCORE_CEILING - SMART_RANGE_SPAN);
  const targetMax = Math.max(
    targetMin + SMART_RANGE_SPAN,
    clampScore(recentMedian * smart.maxRatio, targetMin + SMART_RANGE_SPAN, SMART_SCORE_CEILING)
  );

  return {
    difficulty,
    minScore: targetMin,
    maxScore: targetMax,
    moveIntervalSeconds: range.moveIntervalSeconds,
    overTargetAllowance: smart.overTarget,
    matchMode: "smart",
    rankKey: key,
    recentMedian
  };
}

async function resolvePointsBotRange(modeConfig = {}, humanUid = "") {
  if (String(modeConfig.botDifficulty || "") !== "smart") {
    return getFixedPointsBotRange(modeConfig);
  }

  const uid = String(humanUid || "");
  if (!uid || uid.startsWith("bot_")) {
    return resolveSmartPointsBotRange({ rankKey: "bronze", recentScores: [], modeConfig });
  }

  try {
    const [rank, recentScores] = await Promise.all([
      ensureRank(uid),
      listRecentValidPointsScores(uid, 8)
    ]);
    return resolveSmartPointsBotRange({
      rankKey: rank?.rank_key || "bronze",
      recentScores,
      modeConfig
    });
  } catch (error) {
    console.warn(`[points-bot] smart resolve failed uid=${uid}: ${error.message}`);
    return resolveSmartPointsBotRange({ rankKey: "bronze", recentScores: [], modeConfig });
  }
}

module.exports = {
  FIXED_DIFFICULTIES,
  RANK_BASE_DIFFICULTY,
  RANK_SMART,
  getFixedPointsBotRange,
  getRankBaseDifficulty,
  resolvePointsBotRange,
  resolveSmartPointsBotRange
};
