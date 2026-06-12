const { readGameConfig } = require("../repositories/game-config.repository");
const { findPeriodBySeasonNo, getPreviousWeekRangeFromDb } = require("../repositories/watch-shareholder.repository");
const { normalizeShareholderConfig, settlePreviousWeek } = require("./watch-shareholder.service");

const CHECK_INTERVAL_MS = 60 * 60 * 1000;
let timer = null;
let running = false;

async function runAutoWatchShareholderSettlement() {
  if (running) return;
  running = true;
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
    running = false;
  }
}

function startWatchShareholderScheduler() {
  if (timer) return;
  runAutoWatchShareholderSettlement();
  timer = setInterval(runAutoWatchShareholderSettlement, CHECK_INTERVAL_MS);
}

module.exports = {
  runAutoWatchShareholderSettlement,
  startWatchShareholderScheduler
};
