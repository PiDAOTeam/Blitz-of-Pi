const { readGameConfig } = require("../repositories/game-config.repository");
const { findPeriodBySeasonNo, getPreviousWeekRangeFromDb } = require("../repositories/watch-shareholder.repository");
const { processShareholderRewardsOnce } = require("./watch-shareholder-queue.service");
const { fetchWatchNodeSnapshot, getWeeklyEstimateBundle, normalizeShareholderConfig, settlePreviousWeek } = require("./watch-shareholder.service");

const SETTLEMENT_CHECK_INTERVAL_MS = 60 * 60 * 1000;
const AUTO_REFRESH_INTERVAL_MS = 3 * 60 * 60 * 1000;
const QUEUE_CHECK_INTERVAL_MS = 10 * 60 * 1000;
let settlementTimer = null;
let refreshTimer = null;
let queueTimer = null;
let settlementRunning = false;
let refreshRunning = false;
let queueRunning = false;

async function runAutoWatchShareholderSettlement() {
  if (settlementRunning) return;
  settlementRunning = true;
  try {
    const config = normalizeShareholderConfig(await readGameConfig());
    if (!config.enabled || !config.autoSettleEnabled) return;

    const now = new Date();
    const day = now.getDay() || 7;
    if (day !== 1) return;

    const range = await getPreviousWeekRangeFromDb();
    const exists = await findPeriodBySeasonNo(range.seasonNo);
    if (exists) return;

    const result = await settlePreviousWeek({ force: false });
    console.log("[watch-shareholder] auto settled:", result.period?.seasonNo || range.seasonNo);
  } catch (error) {
    console.error("[watch-shareholder] auto settle failed:", error.message || error);
  } finally {
    settlementRunning = false;
  }
}

async function runAutoWatchShareholderRefresh() {
  if (refreshRunning) return;
  refreshRunning = true;
  try {
    const config = normalizeShareholderConfig(await readGameConfig());
    if (!config.enabled) return;
    const [snapshot, estimate] = await Promise.all([
      fetchWatchNodeSnapshot(),
      getWeeklyEstimateBundle(config, { force: true })
    ]);
    console.log(
      "[watch-shareholder] auto refreshed:",
      `users=${Number(snapshot.user_count || 0)}`,
      `nodes=${Number(snapshot.node_count || 0)}`,
      `week=${estimate?.publicValue?.seasonNo || "-"}`
    );
  } catch (error) {
    console.error("[watch-shareholder] auto refresh failed:", error.message || error);
  } finally {
    refreshRunning = false;
  }
}

async function runAutoWatchShareholderRewardQueue() {
  if (queueRunning) return;
  queueRunning = true;
  try {
    const config = normalizeShareholderConfig(await readGameConfig());
    if (!config.enabled) return;
    const result = await processShareholderRewardsOnce(20);
    if (Number(result.processed || 0) > 0 || Number(result.resetCount || 0) > 0) {
      console.log(
        "[watch-shareholder] auto reward queue:",
        `processed=${Number(result.processed || 0)}`,
        `reset=${Number(result.resetCount || 0)}`
      );
    }
  } catch (error) {
    console.error("[watch-shareholder] auto reward queue failed:", error.message || error);
  } finally {
    queueRunning = false;
  }
}

function startWatchShareholderScheduler() {
  if (settlementTimer || refreshTimer || queueTimer) return;
  runAutoWatchShareholderSettlement();
  runAutoWatchShareholderRefresh();
  runAutoWatchShareholderRewardQueue();
  settlementTimer = setInterval(runAutoWatchShareholderSettlement, SETTLEMENT_CHECK_INTERVAL_MS);
  refreshTimer = setInterval(runAutoWatchShareholderRefresh, AUTO_REFRESH_INTERVAL_MS);
  queueTimer = setInterval(runAutoWatchShareholderRewardQueue, QUEUE_CHECK_INTERVAL_MS);
}

module.exports = {
  runAutoWatchShareholderRefresh,
  runAutoWatchShareholderRewardQueue,
  runAutoWatchShareholderSettlement,
  startWatchShareholderScheduler
};
