const assetGateway = require("./asset-gateway.service");
const { withNamedLock } = require("../db/mysql");
const {
  listEngagementRewardCandidates,
  markEngagementRewardFailed,
  markEngagementRewardPaid,
  markEngagementRewardProcessing,
  markEngagementRewardWaitingIdentity,
  resetStaleEngagementRewardProcessing,
  wakeEngagementIdentityJobs
} = require("../repositories/engagement.repository");

const DEFAULT_BATCH_SIZE = 20;
const DEFAULT_STALE_MINUTES = 10;
const DEFAULT_CONCURRENCY = 4;
const DEFAULT_JOB_TIMEOUT_MS = 30_000;
const DEFAULT_IDENTITY_RETRY_SECONDS = 86_400;

function toGatewayUser(row = {}) {
  return {
    uid: row.uid,
    piUserId: row.pi_user_id || "",
    piUsername: row.pi_username || "",
    nickname: row.nickname || ""
  };
}

function getNextRetrySeconds(attempts, random = Math.random) {
  const attempt = Math.max(1, Number(attempts || 1));
  const baseSeconds = Math.min(1800, 30 * 2 ** Math.min(5, attempt - 1));
  const jitter = Math.floor(baseSeconds * 0.2 * Math.max(0, Math.min(1, Number(random()) || 0)));
  return Math.min(1800, baseSeconds + jitter);
}

function isHashPiIdentityUnboundError(error) {
  return String(error?.message || error || "").includes("未绑定 HashPi 用户");
}

async function withEngagementRewardRunLock(callback) {
  return withNamedLock("blitz_engagement_reward_queue", async () => ({
    locked: true,
    ...(await callback())
  }), {
    locked: false,
    processed: 0,
    message: "已有奖励补发任务运行，本次跳过"
  });
}

function withTimeout(promise, timeoutMs, message) {
  let timer;

  return Promise.race([
    promise,
    new Promise((resolve, reject) => {
      timer = setTimeout(() => reject(new Error(message)), timeoutMs);
    })
  ]).finally(() => clearTimeout(timer));
}

async function mapWithConcurrency(items, concurrency, callback) {
  const results = new Array(items.length);
  const workerCount = Math.min(Math.max(1, Number(concurrency || 1)), items.length || 1);
  let nextIndex = 0;

  await Promise.all(
    Array.from({ length: workerCount }, async () => {
      while (true) {
        const index = nextIndex++;
        if (index >= items.length) return;
        results[index] = await callback(items[index], index);
      }
    })
  );

  return results;
}

async function processEngagementRewardJob(id) {
  const job = await markEngagementRewardProcessing(id);
  if (!job || job.status !== "processing") {
    return {
      id,
      status: "skipped",
      message: "任务不在待处理队列"
    };
  }

  try {
    await withTimeout(assetGateway.reward({
      assetType: job.asset_type,
      user: toGatewayUser(job),
      orderNo: job.external_order_no,
      amount: Number(job.amount || 0),
      idempotencyKey: job.idempotency_key,
      remark: job.remark || "Pi闪电战每日奖励"
    }), Math.max(10_000, Number(process.env.ENGAGEMENT_REWARD_JOB_TIMEOUT_MS || DEFAULT_JOB_TIMEOUT_MS)), "资产奖励任务超时");
    await markEngagementRewardPaid(job.id);
    const awakened = await wakeEngagementIdentityJobs(job.uid).catch((error) => {
      console.warn(`[engagement-reward] wake identity jobs failed uid=${job.uid}: ${error.message}`);
      return 0;
    });

    return {
      id: job.id,
      status: "paid",
      assetType: job.asset_type,
      amount: Number(job.amount || 0),
      awakened
    };
  } catch (error) {
    if (isHashPiIdentityUnboundError(error)) {
      const identityRetrySeconds = Number(
        process.env.ENGAGEMENT_IDENTITY_RETRY_SECONDS || DEFAULT_IDENTITY_RETRY_SECONDS
      );
      await markEngagementRewardWaitingIdentity(job.id, error.message, identityRetrySeconds);
      return {
        id: job.id,
        status: "waiting_identity",
        error: error.message || "等待 HashPi 身份绑定"
      };
    }

    const attempts = Number(job.attempts || 1);
    const manualReview = attempts >= Number(job.max_attempts || 5);
    await markEngagementRewardFailed(job.id, error.message || "发放失败", {
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

async function processEngagementRewardOnce(limit = DEFAULT_BATCH_SIZE) {
  const batchSize = Math.min(50, Math.max(1, Number(limit || DEFAULT_BATCH_SIZE)));

  return withEngagementRewardRunLock(async () => {
    const resetCount = await resetStaleEngagementRewardProcessing(DEFAULT_STALE_MINUTES);
    const candidates = await listEngagementRewardCandidates(batchSize);
    const concurrency = Math.min(8, Math.max(1, Number(process.env.ENGAGEMENT_REWARD_CONCURRENCY || DEFAULT_CONCURRENCY)));
    const results = await mapWithConcurrency(candidates, concurrency, (job) => processEngagementRewardJob(job.id));

    return {
      resetCount,
      processed: results.filter((result) => result.status !== "skipped").length,
      results
    };
  });
}

module.exports = {
  getNextRetrySeconds,
  isHashPiIdentityUnboundError,
  mapWithConcurrency,
  processEngagementRewardJob,
  processEngagementRewardOnce
};
