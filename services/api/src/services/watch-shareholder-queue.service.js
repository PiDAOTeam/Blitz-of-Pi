const assetGateway = require("./asset-gateway.service");
const { query } = require("../db/mysql");
const {
  listRewardCandidates,
  markRewardFailed,
  markRewardPaid,
  markRewardProcessing,
  resetStaleProcessing
} = require("../repositories/watch-shareholder.repository");

const DEFAULT_BATCH_SIZE = 20;
const DEFAULT_STALE_MINUTES = 10;

function toGatewayUser(row = {}) {
  return {
    uid: row.uid,
    piUserId: row.pi_uid || row.pi_user_id || "",
    piUsername: row.pi_username || row.local_pi_username || "",
    nickname: row.nickname || ""
  };
}

function getNextRetrySeconds(attempts) {
  const attempt = Math.max(1, Number(attempts || 1));
  return Math.min(1800, 30 * 2 ** Math.min(5, attempt - 1));
}

async function withShareholderRewardRunLock(callback) {
  const rows = await query("SELECT GET_LOCK(?, 0) AS locked", ["blitz_watch_shareholder_reward_queue"]);
  const locked = Number(rows[0]?.locked || 0) === 1;

  if (!locked) {
    return {
      locked: false,
      processed: 0,
      message: "已有股东分红发放任务运行，本次跳过"
    };
  }

  try {
    return {
      locked: true,
      ...(await callback())
    };
  } finally {
    await query("SELECT RELEASE_LOCK(?) AS released", ["blitz_watch_shareholder_reward_queue"]);
  }
}

async function processShareholderRewardJob(id) {
  const job = await markRewardProcessing(id);
  if (!job || job.status !== "processing") {
    return {
      id,
      status: "skipped",
      message: "任务不在待处理队列"
    };
  }

  try {
    await assetGateway.reward({
      assetType: "POINTS",
      user: toGatewayUser(job),
      orderNo: job.external_order_no,
      amount: Math.floor(Number(job.reward_points || 0)),
      idempotencyKey: job.idempotency_key,
      remark: `Pi闪电战腕表节点股东分红 ${job.season_no}`
    });
    await markRewardPaid(job.id);

    return {
      id: job.id,
      status: "paid",
      amount: Number(job.reward_points || 0)
    };
  } catch (error) {
    const attempts = Number(job.attempts || 1);
    const manualReview = attempts >= Number(job.max_attempts || 5);
    await markRewardFailed(job.id, error.message || "发放失败", {
      manualReview,
      nextRetrySeconds: getNextRetrySeconds(attempts)
    });

    return {
      id: job.id,
      status: manualReview ? "manual_review" : "failed",
      error: error.message || "发放失败"
    };
  }
}

async function processShareholderRewardsOnce(limit = DEFAULT_BATCH_SIZE) {
  const batchSize = Math.min(50, Math.max(1, Number(limit || DEFAULT_BATCH_SIZE)));

  return withShareholderRewardRunLock(async () => {
    const resetCount = await resetStaleProcessing(DEFAULT_STALE_MINUTES);
    const candidates = await listRewardCandidates(batchSize);
    const results = [];

    for (const job of candidates) {
      results.push(await processShareholderRewardJob(job.id));
    }

    return {
      resetCount,
      processed: results.filter((result) => result.status !== "skipped").length,
      results
    };
  });
}

module.exports = {
  processShareholderRewardJob,
  processShareholderRewardsOnce
};
