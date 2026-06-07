const { getUserFromRequest } = require("./wallet.controller");
const {
  claimDailySignIn,
  claimDailyTask,
  getEngagementStatus,
  listAdminEngagementClaims
} = require("../repositories/engagement.repository");

function toClaimDto(row) {
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
    status: row.status,
    createdAt: row.created_at
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

module.exports = {
  claimMyDailySignIn,
  claimMyDailyTask,
  getAdminEngagementClaims,
  getMyEngagementStatus
};
