const { getUserFromRequest } = require("./wallet.controller");
const { addAdminAuditLog } = require("../repositories/admin-audit.repository");
const { retryReward } = require("../repositories/watch-shareholder.repository");
const {
  fetchWatchNodeSnapshot,
  getAdminShareholderOverview,
  getMyShareholderStatus,
  settlePreviousWeek
} = require("../services/watch-shareholder.service");
const {
  processShareholderRewardJob,
  processShareholderRewardsOnce
} = require("../services/watch-shareholder-queue.service");

async function getMyWatchShareholder(req) {
  const user = await getUserFromRequest(req);
  return getMyShareholderStatus(user);
}

async function claimMyWatchShareholder(req) {
  const user = await getUserFromRequest(req);
  const status = await getMyShareholderStatus(user);
  const pending = (status.rewards || []).filter(
    (reward) => ["pending", "queued", "failed"].includes(reward.status) && Number(reward.rewardPoints || 0) > 0
  );

  if (!pending.length) {
    throw new Error("暂无可领取腕表分红");
  }

  const results = [];
  for (const reward of pending.slice(0, 10)) {
    results.push(await processShareholderRewardJob(reward.id));
  }

  return {
    processed: results.filter((result) => result.status === "paid").length,
    results,
    status: await getMyShareholderStatus(user)
  };
}

async function getAdminWatchShareholderOverview() {
  return getAdminShareholderOverview();
}

async function settleAdminWatchShareholderPreviousWeek(req, payload = {}) {
  const result = await settlePreviousWeek({ force: payload.force === true });
  await addAdminAuditLog({
    adminUsername: req.admin?.username,
    action: "watch_shareholder_settle_previous_week",
    targetType: "watch_shareholder_period",
    targetId: result.period?.seasonNo || "",
    detail: result,
    ip: req.socket?.remoteAddress || ""
  });
  return result;
}

async function syncAdminWatchNodeSnapshot(req) {
  const snapshot = await fetchWatchNodeSnapshot();
  const result = {
    userCount: Number(snapshot.user_count || 0),
    nodeCount: Number(snapshot.node_count || 0),
    snapshotAt: snapshot.snapshot_at || "",
    sample: (snapshot.users || []).slice(0, 5)
  };
  await addAdminAuditLog({
    adminUsername: req.admin?.username,
    action: "watch_shareholder_sync_snapshot",
    targetType: "asset_gateway",
    targetId: "watchnodesnapshot",
    detail: result,
    ip: req.socket?.remoteAddress || ""
  });
  return result;
}

async function processAdminWatchShareholderRewards(req) {
  const result = await processShareholderRewardsOnce(30);
  await addAdminAuditLog({
    adminUsername: req.admin?.username,
    action: "watch_shareholder_process_rewards",
    targetType: "watch_shareholder_reward",
    targetId: "queue",
    detail: result,
    ip: req.socket?.remoteAddress || ""
  });
  return result;
}

async function retryAdminWatchShareholderReward(req, id) {
  const changed = await retryReward(Number(id || 0));
  await addAdminAuditLog({
    adminUsername: req.admin?.username,
    action: "watch_shareholder_retry_reward",
    targetType: "watch_shareholder_reward",
    targetId: String(id || ""),
    detail: { changed },
    ip: req.socket?.remoteAddress || ""
  });
  return {
    retried: changed
  };
}

module.exports = {
  claimMyWatchShareholder,
  getAdminWatchShareholderOverview,
  getMyWatchShareholder,
  processAdminWatchShareholderRewards,
  retryAdminWatchShareholderReward,
  settleAdminWatchShareholderPreviousWeek,
  syncAdminWatchNodeSnapshot
};
