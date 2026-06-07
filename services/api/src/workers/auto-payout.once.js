const { processAutoPayoutOnce, getPayoutRuntimeStatus } = require("../services/auto-payout.service");
const { AUTO_PAYOUT_BATCH_SIZE } = require("../config");

async function main() {
  const batchSize = Math.min(50, Math.max(1, Number(AUTO_PAYOUT_BATCH_SIZE || 10)));
  const { sourcePublic, ...runtime } = getPayoutRuntimeStatus();
  console.log("[auto-payout-once] started", {
    batchSize,
    runtime
  });

  const result = await processAutoPayoutOnce(batchSize);
  console.log("[auto-payout-once] finished", JSON.stringify(result));
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("[auto-payout-once] failed:", error.message || error);
    process.exit(1);
  });
