const assetGateway = require("./asset-gateway.service");
const { query } = require("../db/mysql");
const {
  listInviteCommissionRewardCandidates,
  markInviteCommissionRewardFailed,
  markInviteCommissionRewardPaid,
  markInviteCommissionRewardProcessing,
  resetStaleInviteCommissionRewardProcessing
} = require("../repositories/growth.repository");

const DEFAULT_BATCH_SIZE = 20;
const DEFAULT_STALE_MINUTES = 10;

function toGatewayUser(row = {}) {
  return {
    uid: row.inviter_uid || row.uid || "",
    piUserId: row.pi_user_id || row.inviter_pi_user_id || "",
    piUsername: row.pi_username || row.inviter_pi_username || "",
    nickname: row.nickname || row.inviter_nickname || ""
  };
}

function normalizeGatewayAmount(assetType, amount) {
  const value = Number(amount || 0);
  if (!Number.isFinite(value) || value <= 0) return 0;
  if (assetType === "POINTS") return Math.floor(value);
  if (assetType === "POC") return Number(value.toFixed(6));
  return 0;
}

function getNextRetrySeconds(attempts) {
  const attempt = Math.max(1, Number(attempts || 1));
  return Math.min(1800, 30 * 2 ** Math.min(5, attempt - 1));
}

async function withInviteCommissionRunLock(callback) {
  const rows = await query("SELECT GET_LOCK(?, 0) AS locked", ["blitz_invite_commission_queue"]);
  const locked = Number(rows[0]?.locked || 0) === 1;

  if (!locked) {
    return {
      locked: false,
      processed: 0,
      message: "已有邀请返佣发放任务运行，本次跳过"
    };
  }

  try {
    return {
      locked: true,
      ...(await callback())
    };
  } finally {
    await query("SELECT RELEASE_LOCK(?) AS released", ["blitz_invite_commission_queue"]);
  }
}

async function processInviteCommissionRewardJob(id) {
  const job = await markInviteCommissionRewardProcessing(id);
  if (!job || job.status !== "processing") {
    return {
      id,
      status: "skipped",
      message: "任务不在待处理队列"
    };
  }

  const assetType = String(job.asset_type || "").toUpperCase();
  const amount = normalizeGatewayAmount(assetType, job.amount);

  if (!["POINTS", "POC"].includes(assetType) || amount <= 0) {
    await markInviteCommissionRewardFailed(job.id, "返佣资产或金额无效", { manualReview: true });
    return {
      id: job.id,
      status: "manual_review",
      error: "返佣资产或金额无效"
    };
  }

  try {
    await assetGateway.reward({
      assetType,
      user: toGatewayUser(job),
      orderNo: job.external_order_no,
      amount,
      idempotencyKey: job.idempotency_key,
      remark: job.remark || "Pi闪电战邀请对战提成"
    });
    await markInviteCommissionRewardPaid(job.id);

    return {
      id: job.id,
      status: "paid",
      assetType,
      amount
    };
  } catch (error) {
    const attempts = Number(job.attempts || 1);
    const manualReview = attempts >= Number(job.max_attempts || 5);
    await markInviteCommissionRewardFailed(job.id, error.message || "发放失败", {
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

async function processInviteCommissionRewardsOnce(limit = DEFAULT_BATCH_SIZE) {
  const batchSize = Math.min(50, Math.max(1, Number(limit || DEFAULT_BATCH_SIZE)));

  return withInviteCommissionRunLock(async () => {
    const resetCount = await resetStaleInviteCommissionRewardProcessing(DEFAULT_STALE_MINUTES);
    const candidates = await listInviteCommissionRewardCandidates(batchSize);
    const results = [];

    for (const job of candidates) {
      results.push(await processInviteCommissionRewardJob(job.id));
    }

    return {
      resetCount,
      processed: results.filter((result) => result.status !== "skipped").length,
      results
    };
  });
}

module.exports = {
  processInviteCommissionRewardJob,
  processInviteCommissionRewardsOnce
};
