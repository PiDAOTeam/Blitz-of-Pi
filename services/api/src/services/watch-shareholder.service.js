const assetGateway = require("./asset-gateway.service");
const { readGameConfig } = require("../repositories/game-config.repository");
const defaultAdminConfig = require("../defaults/default-admin-config.json");
const {
  allocateIntegerRewards,
  createOrReplacePeriodWithRewards,
  ensureWatchShareholderSchema,
  formatDateTime,
  getAdminOverviewStats,
  getCurrentWeekRangeFromDb,
  getLatestPeriod,
  getPointsBattleStats,
  getPreviousWeekRangeFromDb,
  getUserSummary,
  linkRewardsForUser,
  listPeriods,
  listRewards,
  listUserRewards,
  sumPointsPlatformFee
} = require("../repositories/watch-shareholder.repository");

const ESTIMATE_CACHE_TTL_MS = 3 * 60 * 60 * 1000;
let weeklyEstimateCache = null;

const DEFAULT_WATCH_SHAREHOLDER_CONFIG = {
  enabled: false,
  frontendEntryEnabled: true,
  autoSettleEnabled: true,
  shareRate: 0.5,
  subsidyEnabled: false,
  subsidyPointsPerUser: 0,
  minRewardPoints: 1,
  sourceMode: "points_battle",
  settlementText: "周一结算",
  title: "腕表节点股东分红",
  subtitle: "每周可领分红"
};
Object.assign(
  DEFAULT_WATCH_SHAREHOLDER_CONFIG,
  defaultAdminConfig.game?.operationConfig?.watchShareholder || {}
);

const LEGACY_WATCH_SHAREHOLDER_TEXT = {
  subtitle: new Set(["腕表节点用户可领每周分红"]),
  settlementText: new Set(["每周一结算上周"])
};

function normalizeShareholderConfig(config = {}) {
  const incoming = config.watchShareholder || {};
  const rate = Number(incoming.shareRate);
  const minRewardPoints = Math.floor(Number(incoming.minRewardPoints || DEFAULT_WATCH_SHAREHOLDER_CONFIG.minRewardPoints));
  const subsidyPointsPerUser = Math.floor(Number(incoming.subsidyPointsPerUser || 0));
  const title = String(incoming.title || DEFAULT_WATCH_SHAREHOLDER_CONFIG.title).trim();
  const subtitle = String(incoming.subtitle || "").trim();
  const settlementText = String(incoming.settlementText || "").trim();
  return {
    ...DEFAULT_WATCH_SHAREHOLDER_CONFIG,
    ...incoming,
    enabled: Boolean(incoming.enabled),
    frontendEntryEnabled: incoming.frontendEntryEnabled !== false,
    autoSettleEnabled: incoming.autoSettleEnabled !== false,
    shareRate: Number.isFinite(rate) && rate >= 0 && rate <= 1 ? Number(rate.toFixed(4)) : 0.5,
    subsidyEnabled: incoming.subsidyEnabled === true,
    subsidyPointsPerUser: Math.max(0, subsidyPointsPerUser || 0),
    minRewardPoints: Math.max(1, minRewardPoints || 1),
    sourceMode: "points_battle",
    title: title.slice(0, 32),
    subtitle: (!subtitle || LEGACY_WATCH_SHAREHOLDER_TEXT.subtitle.has(subtitle) ? DEFAULT_WATCH_SHAREHOLDER_CONFIG.subtitle : subtitle).slice(0, 80),
    settlementText: (!settlementText || LEGACY_WATCH_SHAREHOLDER_TEXT.settlementText.has(settlementText) ? DEFAULT_WATCH_SHAREHOLDER_CONFIG.settlementText : settlementText).slice(0, 60)
  };
}

function toPeriodDto(row = {}) {
  if (!row) return null;
  return {
    id: Number(row.id || 0),
    seasonNo: row.season_no || "",
    startAt: row.start_at,
    endAt: row.end_at,
    status: row.status || "",
    sourceMode: row.source_mode || "points_battle",
    assetType: row.asset_type || "POINTS",
    platformFeePoints: Number(row.platform_fee_points || 0),
    shareRate: Number(row.share_rate || 0),
    subsidyPointsPerUser: Number(row.subsidy_points_per_user || 0),
    subsidyPointsTotal: Number(row.subsidy_points_total || 0),
    poolPoints: Number(row.pool_points || 0),
    allocatedPoints: Number(row.allocated_points || 0),
    paidPoints: Number(row.paid_points || 0),
    unclaimedPoints: Number(row.unclaimed_points || 0),
    zeroRewardCount: Number(row.zero_reward_count || 0),
    roundingDelta: Number(row.rounding_delta || 0),
    snapshotUserCount: Number(row.snapshot_user_count || 0),
    snapshotNodeCount: Number(row.snapshot_node_count || 0),
    snapshotAt: row.snapshot_at,
    lastError: row.last_error || "",
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function toRewardDto(row = {}) {
  return {
    id: Number(row.id || 0),
    periodId: Number(row.period_id || 0),
    seasonNo: row.season_no || "",
    hashpiUserId: Number(row.hashpi_user_id || 0),
    uid: row.uid || "",
    piUid: row.pi_uid || "",
    piUsername: row.pi_username || "",
    nickname: row.nickname || "",
    avatarKey: row.avatar_key || "avatar_1",
    nodeCount: Number(row.node_count || 0),
    rawAmount: Number(row.raw_amount || 0),
    dividendPoints: Number(row.dividend_points || 0),
    subsidyPoints: Number(row.subsidy_points || 0),
    rewardPoints: Number(row.reward_points || 0),
    status: row.status || "",
    attempts: Number(row.attempts || 0),
    maxAttempts: Number(row.max_attempts || 0),
    nextRetryAt: row.next_retry_at,
    claimedAt: row.claimed_at,
    processedAt: row.processed_at,
    lastError: row.last_error || "",
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

async function fetchWatchNodeSnapshot() {
  const data = await assetGateway.watchNodeSnapshot();
  const users = Array.isArray(data.users) ? data.users : [];
  return {
    snapshot_at: data.snapshot_at || new Date().toISOString(),
    user_count: Number(data.user_count || users.length || 0),
    node_count: Number(data.node_count || users.reduce((sum, user) => sum + Number(user.node_count || 0), 0)),
    users
  };
}

function toPublicWeeklyEstimate(bundle = {}) {
  return bundle.publicValue || null;
}

function getEstimatedRewardForUser(bundle, user = {}) {
  const piUid = String(user.piUserId || user.pi_user_id || "").trim();
  const piUsername = String(user.piUsername || user.pi_username || "").trim().toLowerCase();
  const hashpiUserId = String(user.hashpiUserId || user.hashpi_user_id || "").trim();
  const rewards = Array.isArray(bundle?.rewards) ? bundle.rewards : [];
  const reward = rewards.find((item) => {
    const itemPiUid = String(item.piUid || item.pi_uid || "").trim();
    const itemPiUsername = String(item.piUsername || item.pi_username || "").trim().toLowerCase();
    const itemHashPiUserId = String(item.hashpiUserId || item.hashpi_user_id || "").trim();
    return (piUid && itemPiUid === piUid) || (piUsername && itemPiUsername === piUsername) || (hashpiUserId && itemHashPiUserId === hashpiUserId);
  });

  if (!reward) {
    return {
      nodeCount: 0,
      dividendPoints: 0,
      subsidyPoints: 0,
      rewardPoints: 0,
      status: "zero"
    };
  }

  return {
    nodeCount: Number(reward.nodeCount || 0),
    dividendPoints: Number(reward.dividendPoints || 0),
    subsidyPoints: Number(reward.subsidyPoints || 0),
    rewardPoints: Number(reward.rewardPoints || 0),
    status: reward.status || "zero"
  };
}

async function getWeeklyEstimateBundle(config, { force = false } = {}) {
  const normalizedConfig = normalizeShareholderConfig({ watchShareholder: config });
  const gameConfig = await readGameConfig();
  const subsidyPointsPerUser = normalizedConfig.subsidyEnabled ? normalizedConfig.subsidyPointsPerUser : 0;
  const range = await getCurrentWeekRangeFromDb();
  const cacheKey = JSON.stringify({
    seasonNo: range.seasonNo,
    sourceMode: normalizedConfig.sourceMode,
    shareRate: normalizedConfig.shareRate,
    subsidyPointsPerUser,
    minRewardPoints: normalizedConfig.minRewardPoints
  });
  if (!force && weeklyEstimateCache && weeklyEstimateCache.key === cacheKey && Date.now() - weeklyEstimateCache.createdAt < ESTIMATE_CACHE_TTL_MS) {
    return weeklyEstimateCache.value;
  }

  const startAt = formatDateTime(range.start);
  const endAt = formatDateTime(range.now);
  const [stats, snapshot] = await Promise.all([
    getPointsBattleStats({
      startAt,
      endAt,
      sourceMode: normalizedConfig.sourceMode,
      includeBotRooms: gameConfig.pointsBattle?.botCountInWatchShareholder !== false
    }),
    fetchWatchNodeSnapshot()
  ]);
  const poolPoints = Math.floor(stats.platformFeePoints * normalizedConfig.shareRate);
  const allocation = allocateIntegerRewards({
    poolPoints,
    users: snapshot.users,
    minRewardPoints: normalizedConfig.minRewardPoints,
    subsidyPointsPerUser
  });
  const publicValue = {
    seasonNo: range.seasonNo,
    startAt,
    endAt,
    estimatedAt: formatDateTime(range.now),
    cacheSeconds: Math.floor(ESTIMATE_CACHE_TTL_MS / 1000),
    roomCount: stats.roomCount,
    platformFeePoints: stats.platformFeePoints,
    shareRate: normalizedConfig.shareRate,
    poolPoints,
    subsidyPointsPerUser,
    subsidyPointsTotal: allocation.subsidyPointsTotal,
    estimatedAllocatedPoints: allocation.allocatedPoints,
    estimatedDividendPoints: allocation.dividendAllocatedPoints,
    roundingDelta: allocation.roundingDelta,
    snapshotUserCount: snapshot.user_count,
    snapshotNodeCount: snapshot.node_count
  };
  const value = {
    publicValue,
    rewards: allocation.rewards || []
  };
  weeklyEstimateCache = {
    key: cacheKey,
    createdAt: Date.now(),
    value
  };
  return value;
}

async function getWeeklyEstimate(config, options = {}) {
  return toPublicWeeklyEstimate(await getWeeklyEstimateBundle(config, options));
}

async function settlePreviousWeek({ force = false } = {}) {
  await ensureWatchShareholderSchema();
  const gameConfig = await readGameConfig();
  const config = normalizeShareholderConfig(gameConfig);
  if (!config.enabled) {
    throw new Error("腕表股东分红未开启");
  }
  const range = await getPreviousWeekRangeFromDb();
  const startAt = formatDateTime(range.start);
  const endAt = formatDateTime(range.end);
  const platformFeePoints = await sumPointsPlatformFee({
    startAt,
    endAt,
    sourceMode: config.sourceMode,
    includeBotRooms: gameConfig.pointsBattle?.botCountInWatchShareholder !== false
  });
  const poolPoints = Math.floor(platformFeePoints * config.shareRate);
  const snapshot = await fetchWatchNodeSnapshot();
  const subsidyPointsPerUser = config.subsidyEnabled ? config.subsidyPointsPerUser : 0;
  const allocation = allocateIntegerRewards({
    poolPoints,
    users: snapshot.users,
    minRewardPoints: config.minRewardPoints,
    subsidyPointsPerUser
  });
  const result = await createOrReplacePeriodWithRewards({
    seasonNo: range.seasonNo,
    startAt,
    endAt,
    sourceMode: config.sourceMode,
    platformFeePoints,
    shareRate: config.shareRate,
    subsidyPointsPerUser,
    poolPoints,
    snapshot,
    allocation,
    force
  });

  return {
    created: result.created,
    alreadyExists: result.alreadyExists,
    period: toPeriodDto(result.period),
    snapshot: {
      userCount: snapshot.user_count,
      nodeCount: snapshot.node_count,
      snapshotAt: snapshot.snapshot_at
    },
    allocation: {
      allocatedPoints: allocation.allocatedPoints,
      dividendAllocatedPoints: allocation.dividendAllocatedPoints,
      subsidyPointsTotal: allocation.subsidyPointsTotal,
      zeroRewardCount: allocation.zeroRewardCount,
      roundingDelta: allocation.roundingDelta
    }
  };
}

async function getMyShareholderStatus(user) {
  await ensureWatchShareholderSchema();
  const config = normalizeShareholderConfig(await readGameConfig());
  if (!config.enabled || !config.frontendEntryEnabled) {
    return {
      enabled: config.enabled,
      frontendEntryEnabled: config.frontendEntryEnabled,
      title: config.title,
      subtitle: config.subtitle,
      isWatchNode: false,
      claimablePoints: 0,
      nodeCount: 0,
      paidPoints: 0,
      unclaimedCount: 0,
      rewards: [],
      latestPeriod: toPeriodDto(await getLatestPeriod()),
      weeklyEstimate: null
    };
  }

  await linkRewardsForUser(user);

  const [summary, rewards, latestPeriod, weeklyEstimateBundle] = await Promise.all([
    getUserSummary(user.uid),
    listUserRewards(user.uid, 60),
    getLatestPeriod(),
    getWeeklyEstimateBundle(config).catch(() => null)
  ]);
  const weeklyEstimate = toPublicWeeklyEstimate(weeklyEstimateBundle);
  const myWeeklyEstimate = getEstimatedRewardForUser(weeklyEstimateBundle, user);
  const currentNodeCount = myWeeklyEstimate.nodeCount || summary.latestNodeCount;

  return {
    enabled: config.enabled,
    frontendEntryEnabled: config.frontendEntryEnabled,
    title: config.title,
    subtitle: config.subtitle,
    settlementText: config.settlementText,
    isWatchNode: summary.periodCount > 0 || currentNodeCount > 0,
    claimablePoints: summary.claimablePoints,
    nodeCount: currentNodeCount,
    paidPoints: summary.paidPoints,
    unclaimedCount: summary.unclaimedCount,
    rewards: rewards.map(toRewardDto),
    latestPeriod: toPeriodDto(latestPeriod),
    weeklyEstimate,
    myWeeklyEstimate
  };
}

async function getAdminShareholderOverview() {
  await ensureWatchShareholderSchema();
  const config = normalizeShareholderConfig(await readGameConfig());
  const [latestPeriod, periods, rewards, stats, weeklyEstimate] = await Promise.all([
    getLatestPeriod(),
    listPeriods(30),
    listRewards({ limit: 300 }),
    getAdminOverviewStats(),
    getWeeklyEstimate(config).catch(() => null)
  ]);

  return {
    config,
    latestPeriod: toPeriodDto(latestPeriod),
    periods: periods.map(toPeriodDto),
    rewards: rewards.map(toRewardDto),
    weeklyEstimate,
    stats
  };
}

module.exports = {
  DEFAULT_WATCH_SHAREHOLDER_CONFIG,
  fetchWatchNodeSnapshot,
  getAdminShareholderOverview,
  getMyShareholderStatus,
  getWeeklyEstimate,
  getWeeklyEstimateBundle,
  normalizeShareholderConfig,
  settlePreviousWeek,
  toPeriodDto,
  toRewardDto
};
