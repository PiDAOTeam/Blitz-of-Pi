const { processInviteCommissionRewardsOnce } = require("../services/invite-commission-queue.service");

async function main() {
  const batchSize = Math.min(50, Math.max(1, Number(process.env.INVITE_COMMISSION_BATCH_SIZE || 20)));
  console.log("[invite-commission-once] started", { batchSize });
  const result = await processInviteCommissionRewardsOnce(batchSize);
  console.log("[invite-commission-once] finished", JSON.stringify(result));
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("[invite-commission-once] failed:", error.message || error);
    process.exit(1);
  });
