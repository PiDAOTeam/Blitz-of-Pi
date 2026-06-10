const { getActiveUserFromToken } = require("../services/auth.service");
const {
  getRankStatus,
  claimDailyRankChest,
  listAdminRankStarRecords,
  listAdminRankDailyChests,
  listAdminRankWeeklySettlements,
  listRankLeaderboard,
  listWeeklyRankLeaderboard,
  getWeekSeasonNo,
  getWeeklyRewardTiers,
  getWeeklyReward,
  getPreviousWeekSeasonNo,
  settleWeeklyLeaderboard
} = require("../repositories/rank.repository");
const { readGameConfig } = require("../repositories/game-config.repository");

async function getRequestUser(req) {
  const token = req?.headers?.authorization?.replace("Bearer ", "") || "";
  return getActiveUserFromToken(token);
}

async function getMyRankStatus(req) {
  const user = await getRequestUser(req);
  return getRankStatus(user.uid);
}

async function claimMyDailyRankChest(req) {
  const user = await getRequestUser(req);
  return claimDailyRankChest(user.uid);
}

async function getAdminRankStarRecords() {
  const rows = await listAdminRankStarRecords();

  return rows.map((row) => ({
    id: row.id,
    roomNo: row.room_no,
    uid: row.uid,
    piUsername: row.pi_username || "",
    nickname: row.nickname || "",
    avatarKey: row.avatar_key || "avatar_1",
    mode: row.mode,
    result: row.result,
    rankKeyBefore: row.rank_key_before,
    rankKeyAfter: row.rank_key_after,
    starsBefore: Number(row.stars_before || 0),
    starsAfter: Number(row.stars_after || 0),
    starDelta: Number(row.star_delta || 0),
    createdAt: row.created_at
  }));
}

async function getAdminRankDailyChests() {
  const rows = await listAdminRankDailyChests();

  return rows.map((row) => ({
    id: row.id,
    uid: row.uid,
    piUsername: row.pi_username || "",
    nickname: row.nickname || "",
    avatarKey: row.avatar_key || "avatar_1",
    claimDate: row.claim_date,
    rankKey: row.rank_key,
    rewardAmount: Number(row.reward_amount || 0),
    createdAt: row.created_at
  }));
}

async function getAdminRankWeeklySettlements() {
  const rows = await listAdminRankWeeklySettlements();

  return rows.map((row) => ({
    id: row.id,
    seasonNo: row.season_no,
    uid: row.uid,
    piUsername: row.pi_username || "",
    nickname: row.nickname || "",
    avatarKey: row.avatar_key || "avatar_1",
    rankNo: Number(row.rank_no || 0),
    rankKey: row.rank_key,
    stars: Number(row.stars || 0),
    rewardAmount: Number(row.reward_amount || 0),
    createdAt: row.created_at
  }));
}

function normalizePageParams(params = {}) {
  const page = Math.max(1, Number.parseInt(String(params.page || 1), 10) || 1);
  const pageSize = Math.min(30, Math.max(5, Number.parseInt(String(params.pageSize || 15), 10) || 15));

  return {
    page,
    pageSize
  };
}

async function getRankLeaderboard(req, params = {}) {
  const user = await getRequestUser(req);
  const config = await readGameConfig();
  const { page, pageSize } = normalizePageParams(params);
  const type = params.type === "total" ? "total" : "weekly";
  const seasonNo = getWeekSeasonNo();
  const weeklyRewardTiers = getWeeklyRewardTiers(config.operation?.rankRules || {});
  const leaderboard =
    type === "total"
      ? await listRankLeaderboard(10000)
      : await listWeeklyRankLeaderboard(seasonNo, 10000, null, config);
  const total = leaderboard.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const withRewards = leaderboard.map((item) => ({
    ...item,
    rewardAmount: Number(getWeeklyReward(item.rankNo, weeklyRewardTiers).toFixed(8))
  }));
  const myRank = withRewards.find((item) => item.uid === user.uid) || null;

  return {
    type,
    seasonNo,
    page: safePage,
    pageSize,
    total,
    totalPages,
    items: withRewards.slice(start, start + pageSize),
    myRank,
    rewardTiers: weeklyRewardTiers,
    weeklyModes: config.operation?.rankRules?.weeklyLeaderboardModes || ["points_battle", "poc_battle", "pi_battle"]
  };
}

async function getAdminRankLeaderboard() {
  return listRankLeaderboard(100);
}

async function settleAdminWeeklyRank() {
  return settleWeeklyLeaderboard({
    seasonNo: getPreviousWeekSeasonNo(),
    silentIfSettled: true
  });
}

module.exports = {
  getMyRankStatus,
  claimMyDailyRankChest,
  getAdminRankStarRecords,
  getAdminRankDailyChests,
  getAdminRankWeeklySettlements,
  getRankLeaderboard,
  getAdminRankLeaderboard,
  settleAdminWeeklyRank
};
