const { getUserFromRequest } = require("./wallet.controller");
const {
  claimDailySignIn,
  claimDailyTask,
  getEngagementStatus,
  listAdminEngagementClaims,
  listAdminEngagementRewardJobs,
  retryEngagementRewardJob
} = require("../repositories/engagement.repository");
const { processEngagementRewardOnce } = require("../services/engagement-reward-queue.service");

function toClaimDto(row) {
  let rewards = [];
  try {
    rewards = row.reward_json ? JSON.parse(row.reward_json) : [];
  } catch (error) {
    rewards = [];
  }
  return {
    id: row.id,
    uid: row.uid,
    piUsername: row.pi_username || "",
    nickname: row.nickname || "",
    avatarKey: row.avatar_key || "avatar_1",
    claimDate: row.claim_date,
    claimType: row.claim_type,
    taskKey: row.task_key || "",
    title: row.title || "",
    rewardAmount: Number(row.reward_amount || 0),
    assetSummary: row.asset_summary || "",
    rewardSummary: row.asset_summary || "",
    rewards: Array.isArray(rewards) ? rewards : [],
    status: row.status,
    createdAt: row.created_at
  };
}

function toRewardJobDto(row) {
  return {
    id: row.id,
    uid: row.uid,
    piUsername: row.pi_username || "",
    nickname: row.nickname || "",
    avatarKey: row.avatar_key || "avatar_1",
    claimId: Number(row.claim_id || 0),
    claimDate: row.claim_date,
    claimType: row.claim_type || "",
    taskKey: row.task_key || "",
    title: row.title || "",
    assetType: row.asset_type || "",
    amount: Number(row.amount || 0),
    orderNo: row.external_order_no || "",
    status: row.status || "",
    attempts: Number(row.attempts || 0),
    maxAttempts: Number(row.max_attempts || 0),
    nextRetryAt: row.next_retry_at,
    processedAt: row.processed_at,
    lastError: row.last_error || "",
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

async function getMyEngagementStatus(req) {
  const user = await getUserFromRequest(req);
  return getEngagementStatus(user.uid);
}

async function claimMyDailySignIn(req) {
  const user = await getUserFromRequest(req);
  return claimDailySignIn(user.uid);
}

async function claimMyDailyTask(req, payload = {}) {
  const user = await getUserFromRequest(req);
  return claimDailyTask(user.uid, String(payload.taskKey || payload.task_key || ""));
}

async function getAdminEngagementClaims() {
  const rows = await listAdminEngagementClaims();
  return rows.map(toClaimDto);
}

async function getAdminEngagementRewardJobs() {
  const rows = await listAdminEngagementRewardJobs();
  return rows.map(toRewardJobDto);
}

async function retryAdminEngagementRewardJob(id) {
  const changed = await retryEngagementRewardJob(Number(id || 0));
  return {
    retried: changed
  };
}

async function processAdminEngagementRewardJobs() {
  return processEngagementRewardOnce(20);
}

module.exports = {
  claimMyDailySignIn,
  claimMyDailyTask,
  getAdminEngagementClaims,
  getAdminEngagementRewardJobs,
  getMyEngagementStatus,
  processAdminEngagementRewardJobs,
  retryAdminEngagementRewardJob
};
