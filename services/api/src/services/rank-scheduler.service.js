const { readGameConfig } = require("../repositories/game-config.repository");
const {
  getPreviousWeekSeasonNo,
  getPreviousMonthSeasonNo,
  settleWeeklyLeaderboard,
  settleMonthlySeason
} = require("../repositories/rank.repository");

const CHECK_INTERVAL_MS = 30 * 60 * 1000;
let schedulerStarted = false;
let settlementRunning = false;
let monthlySettlementRunning = false;

function shouldCheckWeeklySettlement(now = new Date()) {
  const day = now.getDay();
  const minutesOfDay = now.getHours() * 60 + now.getMinutes();

  return day === 1 && minutesOfDay >= 5;
}

function shouldCheckMonthlySettlement(now = new Date()) {
  const minutesOfDay = now.getHours() * 60 + now.getMinutes();
  return now.getDate() === 1 && minutesOfDay >= 5;
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

async function runAutoMonthlySeasonSettlementCheck(now = new Date()) {
  if (monthlySettlementRunning || !shouldCheckMonthlySettlement(now)) {
    return null;
  }

  if (String(process.env.RANK_MONTHLY_AUTO_SETTLE_ENABLED || "true").toLowerCase() === "false") {
    return null;
  }

  const config = await readGameConfig();
  if (config.operation?.rankRules?.monthlySeasonEnabled === false || config.operation?.rankRules?.monthlyAutoSettleEnabled === false) {
    return null;
  }

  monthlySettlementRunning = true;
  try {
    const seasonNo = getPreviousMonthSeasonNo(now);
    const result = await settleMonthlySeason({
      seasonNo,
      silentIfSettled: true
    });

    if (result?.alreadySettled) {
      console.log(`[rank-scheduler] monthly season already settled: ${seasonNo}`);
    } else {
      console.log(`[rank-scheduler] monthly season settled: ${seasonNo}, rewards=${result.rewards.length}`);
    }

    return result;
  } catch (error) {
    console.error("[rank-scheduler] monthly season settlement failed:", error.message);
    return null;
  } finally {
    monthlySettlementRunning = false;
  }
}

function startRankScheduler() {
  if (schedulerStarted) return;
  schedulerStarted = true;

  setTimeout(() => {
    runAutoWeeklySettlementCheck();
    runAutoMonthlySeasonSettlementCheck();
  }, 10 * 1000).unref?.();

  setInterval(() => {
    runAutoWeeklySettlementCheck();
    runAutoMonthlySeasonSettlementCheck();
  }, CHECK_INTERVAL_MS).unref?.();

  console.log("[rank-scheduler] rank reward scheduler started");
}

module.exports = {
  startRankScheduler,
  runAutoWeeklySettlementCheck,
  runAutoMonthlySeasonSettlementCheck,
  shouldCheckWeeklySettlement,
  shouldCheckMonthlySettlement
};
