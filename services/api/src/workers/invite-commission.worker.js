const { processInviteCommissionRewardsOnce } = require("../services/invite-commission-queue.service");

const intervalMs = Math.max(5000, Number(process.env.INVITE_COMMISSION_INTERVAL_MS || 15000));
const batchSize = Math.min(50, Math.max(1, Number(process.env.INVITE_COMMISSION_BATCH_SIZE || 20)));

let running = false;

async function tick() {
  if (running) return;
  running = true;

  try {
    const result = await processInviteCommissionRewardsOnce(batchSize);
    if (result.processed > 0 || result.resetCount > 0) {
      console.log("[invite-commission] processed", JSON.stringify(result));
    }
  } catch (error) {
    console.error("[invite-commission] tick failed:", error.message || error);
  } finally {
    running = false;
  }
}

console.log("[invite-commission] worker started", {
  intervalMs,
  batchSize
});

tick();
setInterval(tick, intervalMs);
