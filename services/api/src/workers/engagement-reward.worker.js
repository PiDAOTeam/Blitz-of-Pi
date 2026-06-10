const { processEngagementRewardOnce } = require("../services/engagement-reward-queue.service");

const intervalMs = Math.max(5000, Number(process.env.ENGAGEMENT_REWARD_INTERVAL_MS || 15000));
const batchSize = Math.min(50, Math.max(1, Number(process.env.ENGAGEMENT_REWARD_BATCH_SIZE || 20)));

let running = false;

async function tick() {
  if (running) return;
  running = true;

  try {
    const result = await processEngagementRewardOnce(batchSize);
    if (result.processed > 0 || result.resetCount > 0) {
      console.log("[engagement-reward] processed", JSON.stringify(result));
    }
  } catch (error) {
    console.error("[engagement-reward] tick failed:", error.message || error);
  } finally {
    running = false;
  }
}

console.log("[engagement-reward] worker started", {
  intervalMs,
  batchSize
});

tick();
setInterval(tick, intervalMs);
