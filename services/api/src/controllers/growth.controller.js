const { getUserFromRequest } = require("./wallet.controller");
const {
  searchTransferUsers,
  transferBalance,
  bindInvite,
  getMyInviteInfo,
  claimInviteRewards,
  listAdminGrowthData
} = require("../services/growth.service");
const {
  retryInviteCommissionRewardJob
} = require("../repositories/growth.repository");
const {
  processInviteCommissionRewardsOnce
} = require("../services/invite-commission-queue.service");

function toTransferDto(row) {
  return {
    transferNo: row.transfer_no,
    fromUid: row.from_uid,
    fromPiUsername: row.from_pi_username || "",
    fromNickname: row.from_nickname || "",
    fromAvatarKey: row.from_avatar_key || "avatar_1",
    toUid: row.to_uid,
    toPiUsername: row.to_pi_username || "",
    toNickname: row.to_nickname || "",
    toAvatarKey: row.to_avatar_key || "avatar_1",
    amount: Number(row.amount || 0),
    feeAmount: Number(row.fee_amount || 0),
    status: row.status,
    remark: row.remark || "",
    createdAt: row.created_at
  };
}

function toRelationDto(row) {
  return {
    inviterUid: row.inviter_uid,
    inviterPiUsername: row.inviter_pi_username || "",
    inviterNickname: row.inviter_nickname || "",
    inviterAvatarKey: row.inviter_avatar_key || "avatar_1",
    inviteeUid: row.invitee_uid,
    inviteePiUsername: row.invitee_pi_username || "",
    inviteeNickname: row.invitee_nickname || "",
    inviteeAvatarKey: row.invitee_avatar_key || "avatar_1",
    status: row.status,
    boundAt: row.bound_at
  };
}

function toRewardDto(row) {
  return {
    rewardNo: row.reward_no,
    inviterUid: row.inviter_uid,
    inviterPiUsername: row.inviter_pi_username || "",
    inviterNickname: row.inviter_nickname || "",
    inviterAvatarKey: row.inviter_avatar_key || "avatar_1",
    inviteeUid: row.invitee_uid || "",
    inviteePiUsername: row.invitee_pi_username || "",
    inviteeNickname: row.invitee_nickname || "",
    inviteeAvatarKey: row.invitee_avatar_key || "avatar_1",
    battleRoomNo: row.battle_room_no || "",
    rewardType: row.reward_type,
    levelKey: row.level_key || "",
    assetType: row.asset_type || "PI",
    amount: Number(row.amount || 0),
    rate: Number(row.rate || 0),
    status: row.status,
    claimedAt: row.claimed_at,
    createdAt: row.created_at
  };
}

function toInviteCommissionJobDto(row) {
  return {
    id: row.id,
    rewardNo: row.reward_no,
    inviterUid: row.inviter_uid,
    inviterPiUsername: row.inviter_pi_username || "",
    inviterNickname: row.inviter_nickname || "",
    inviteeUid: row.invitee_uid || "",
    inviteePiUsername: row.invitee_pi_username || "",
    inviteeNickname: row.invitee_nickname || "",
    battleRoomNo: row.battle_room_no || "",
    assetType: row.asset_type || "",
    amount: Number(row.amount || 0),
    status: row.status,
    attempts: Number(row.attempts || 0),
    maxAttempts: Number(row.max_attempts || 0),
    nextRetryAt: row.next_retry_at,
    lastError: row.last_error || "",
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

async function searchUsersForTransfer(req, query) {
  const user = await getUserFromRequest(req);
  return searchTransferUsers(query.keyword || query.q || "", user.uid);
}

async function createWalletTransfer(req, payload) {
  const user = await getUserFromRequest(req);
  return transferBalance(user, payload || {});
}

async function bindMyInvite(req, payload) {
  const user = await getUserFromRequest(req);
  return bindInvite(user, payload || {});
}

async function getMyInviteDashboard(req) {
  const user = await getUserFromRequest(req);
  return getMyInviteInfo(user.uid);
}

async function claimMyInviteRewards(req) {
  const user = await getUserFromRequest(req);
  return claimInviteRewards(user);
}

async function getAdminGrowthOps() {
  const data = await listAdminGrowthData();

  return {
    transfers: data.transfers.map(toTransferDto),
    relations: data.relations.map(toRelationDto),
    rewards: data.rewards.map(toRewardDto),
    inviteCommissionJobs: (data.inviteCommissionJobs || []).map(toInviteCommissionJobDto),
    inviteCommissionQueueStats: data.inviteCommissionQueueStats || {}
  };
}

async function processAdminInviteCommissionRewardJobs() {
  return processInviteCommissionRewardsOnce(20);
}

async function retryAdminInviteCommissionRewardJob(id) {
  const ok = await retryInviteCommissionRewardJob(id);
  if (!ok) {
    throw new Error("任务不存在或当前状态不能重试");
  }
  return { id: Number(id), queued: true };
}

module.exports = {
  searchUsersForTransfer,
  createWalletTransfer,
  bindMyInvite,
  getMyInviteDashboard,
  claimMyInviteRewards,
  getAdminGrowthOps,
  processAdminInviteCommissionRewardJobs,
  retryAdminInviteCommissionRewardJob
};
