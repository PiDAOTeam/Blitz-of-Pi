const { getUserFromRequest } = require("./wallet.controller");
const {
  searchTransferUsers,
  transferBalance,
  bindInvite,
  getMyInviteInfo,
  claimInviteRewards,
  listAdminGrowthData
} = require("../services/growth.service");

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
    amount: Number(row.amount || 0),
    rate: Number(row.rate || 0),
    status: row.status,
    claimedAt: row.claimed_at,
    createdAt: row.created_at
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
    rewards: data.rewards.map(toRewardDto)
  };
}

module.exports = {
  searchUsersForTransfer,
  createWalletTransfer,
  bindMyInvite,
  getMyInviteDashboard,
  claimMyInviteRewards,
  getAdminGrowthOps
};
