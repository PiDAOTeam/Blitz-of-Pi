const { processAutoPayoutOnce, getPayoutRuntimeStatus } = require("../services/auto-payout.service");
const { AUTO_PAYOUT_BATCH_SIZE } = require("../config");

const intervalMs = Math.max(5000, Number(process.env.AUTO_PAYOUT_INTERVAL_MS || 15000));
const batchSize = Math.min(50, Math.max(1, Number(AUTO_PAYOUT_BATCH_SIZE || 10)));

let running = false;

async function tick() {
  if (running) return;
  running = true;

  try {
    const result = await processAutoPayoutOnce(batchSize);
    if (result.processed > 0) {
      console.log("[auto-payout] processed", JSON.stringify(result));
    }
  } catch (error) {
    console.error("[auto-payout] tick failed:", error.message || error);
  } finally {
    running = false;
  }
}

const { sourcePublic, ...runtime } = getPayoutRuntimeStatus();

console.log("[auto-payout] worker started", {
  intervalMs,
  batchSize,
  runtime
});

tick();
setInterval(tick, intervalMs);
