const { readGameConfig } = require("../repositories/game-config.repository");
const {
  getPreviousWeekSeasonNo,
  settleWeeklyLeaderboard
} = require("../repositories/rank.repository");

const CHECK_INTERVAL_MS = 30 * 60 * 1000;
let schedulerStarted = false;
let settlementRunning = false;

function shouldCheckWeeklySettlement(now = new Date()) {
  const day = now.getDay();
  const minutesOfDay = now.getHours() * 60 + now.getMinutes();

  return day === 1 && minutesOfDay >= 5;
}

async function runAutoWeeklySettlementCheck(now = new Date()) {
  if (settlementRunning || !shouldCheckWeeklySettlement(now)) {
    return null;
  }

  if (String(process.env.RANK_AUTO_SETTLE_ENABLED || "true").toLowerCase() === "false") {
    return null;
  }

  const config = await readGameConfig();
  if (config.operation?.rankRules?.weeklyAutoSettleEnabled === false) {
    return null;
  }

  settlementRunning = true;
  try {
    const seasonNo = getPreviousWeekSeasonNo(now);
    const result = await settleWeeklyLeaderboard({
      seasonNo,
      silentIfSettled: true
    });

    if (result?.alreadySettled) {
      console.log(`[rank-scheduler] weekly reward already settled: ${seasonNo}`);
    } else {
      console.log(`[rank-scheduler] weekly reward settled: ${seasonNo}, rewards=${result.rewards.length}`);
    }

    return result;
  } catch (error) {
    console.error("[rank-scheduler] weekly settlement failed:", error.message);
    return null;
  } finally {
    settlementRunning = false;
  }
}

function startRankScheduler() {
  if (schedulerStarted) return;
  schedulerStarted = true;

  setTimeout(() => {
    runAutoWeeklySettlementCheck();
  }, 10 * 1000).unref?.();

  setInterval(() => {
    runAutoWeeklySettlementCheck();
  }, CHECK_INTERVAL_MS).unref?.();

  console.log("[rank-scheduler] weekly rank reward scheduler started");
}

module.exports = {
  startRankScheduler,
  runAutoWeeklySettlementCheck,
  shouldCheckWeeklySettlement
};
