const { processEngagementRewardOnce } = require("../services/engagement-reward-queue.service");

async function main() {
  const batchSize = Math.min(50, Math.max(1, Number(process.env.ENGAGEMENT_REWARD_BATCH_SIZE || 20)));
  console.log("[engagement-reward-once] started", { batchSize });
  const result = await processEngagementRewardOnce(batchSize);
  console.log("[engagement-reward-once] finished", JSON.stringify(result));
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("[engagement-reward-once] failed:", error.message || error);
    process.exit(1);
  });
