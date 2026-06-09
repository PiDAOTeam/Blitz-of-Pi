const { query } = require("../db/mysql");
const { redisGet, redisScan } = require("../db/redis");
const { getActiveSessionStats } = require("./session.repository");
const { readBattleObserverSnapshot } = require("../services/battle-observer.service");

function toNumber(value) {
  return Number(value || 0);
}

function getBattleAssetUnit(assetType = "") {
  const normalized = String(assetType || "PI").toUpperCase();
  if (normalized === "POINTS") return "积分";
  if (normalized === "POC") return "POC";
  return "Pi";
}

function buildBattleRevenueSummary(rows = []) {
  const orderedAssetTypes = ["PI", "POINTS", "POC"];
  const byAssetType = new Map(
    orderedAssetTypes.map((assetType) => [
      assetType,
      {
        assetType,
        assetUnit: getBattleAssetUnit(assetType),
        platformRevenue: 0,
        finishedRooms: 0
      }
    ])
  );

  for (const row of rows) {
    const assetType = String(row.asset_type || "PI").toUpperCase();
    if (!byAssetType.has(assetType)) continue;

    byAssetType.set(assetType, {
      assetType,
      assetUnit: getBattleAssetUnit(assetType),
      platformRevenue: toNumber(row.platform_revenue),
      finishedRooms: toNumber(row.finished_rooms)
    });
  }

  return orderedAssetTypes.map((assetType) => byAssetType.get(assetType));
}

function buildBattleRewardSummary(rows = []) {
  const orderedAssetTypes = ["PI", "POINTS", "POC"];
  const byAssetType = new Map(
    orderedAssetTypes.map((assetType) => [
      assetType,
      {
        assetType,
        assetUnit: getBattleAssetUnit(assetType),
        totalReward: 0,
        finishedRooms: 0
      }
    ])
  );

  for (const row of rows) {
    const assetType = String(row.asset_type || "PI").toUpperCase();
    if (!byAssetType.has(assetType)) continue;

    const totalReward = assetType === "POINTS"
      ? Math.floor(toNumber(row.total_reward))
      : toNumber(row.total_reward);
    byAssetType.set(assetType, {
      assetType,
      assetUnit: getBattleAssetUnit(assetType),
      totalReward,
      finishedRooms: toNumber(row.finished_rooms)
    });
  }

  return orderedAssetTypes.map((assetType) => byAssetType.get(assetType));
}

async function readRealtimeStats() {
  const keys = await redisScan("blitz:realtime:stats:*", 50);
  const rows = [];

  for (const key of keys) {
    const raw = await redisGet(key);
    if (!raw) continue;

    try {
      const item = JSON.parse(raw);
      if (Date.now() - Number(item.updatedAt || 0) <= 45_000) {
        rows.push(item);
      }
    } catch {
      // Ignore malformed transient stats.
    }
  }

  return rows.reduce(
    (acc, item) => {
      acc.connections += Number(item.connections || 0);
      acc.joinedConnections += Number(item.joinedConnections || 0);
      acc.uniqueUsers += Number(item.uniqueUsers || 0);
      acc.rooms += Number(item.rooms || 0);
      acc.lastRoomTickCostMs = Math.max(acc.lastRoomTickCostMs, Number(item.lastRoomTickCostMs || 0));
      acc.lastBroadcastCostMs = Math.max(acc.lastBroadcastCostMs, Number(item.lastBroadcastCostMs || 0));
      acc.tickSlowCount += Number(item.tickSlowCount || 0);
      acc.broadcastSlowCount += Number(item.broadcastSlowCount || 0);
      acc.instances += 1;
      return acc;
    },
    {
      connections: 0,
      joinedConnections: 0,
      uniqueUsers: 0,
      rooms: 0,
      instances: 0,
      lastRoomTickCostMs: 0,
      lastBroadcastCostMs: 0,
      tickSlowCount: 0,
      broadcastSlowCount: 0
    }
  );
}

async function readMatchQueueCount() {
  const keys = await redisScan("blitz:match:queue:*", 20);
  let total = 0;

  for (const key of keys) {
    const raw = await redisGet(key);
    if (!raw) continue;

    try {
      const queue = JSON.parse(raw);
      if (Array.isArray(queue)) {
        total += queue.length;
      }
    } catch {
      // Ignore malformed transient queue snapshots.
    }
  }

  const legacyRaw = await redisGet("blitz:match:queue");
  if (legacyRaw) {
    try {
      const queue = JSON.parse(legacyRaw);
      if (Array.isArray(queue)) {
        total += queue.length;
      }
    } catch {
      // Ignore old malformed queue snapshots.
    }
  }

  return total;
}

async function readDashboard() {
  const [
    totalUsersRows,
    todayNewUsersRows,
    todayActiveUsersRows,
    completedProfileRows,
    bannedUsersRows,
    walletRows,
    paymentRows,
    pendingPaymentRows,
    battleRows,
    paidBattleRows,
    finishedBattleRows,
    withdrawRows,
    pendingWithdrawRows,
    playingRows,
    todayFeeRows,
    totalFeeRows,
    totalRewardRows
  ] = await Promise.all([
    query("SELECT COUNT(*) AS count FROM users"),
    query("SELECT COUNT(*) AS count FROM users WHERE DATE(created_at) = CURDATE()"),
    query("SELECT COUNT(*) AS count FROM users WHERE DATE(last_login_at) = CURDATE()"),
    query(
      "SELECT COUNT(*) AS count FROM users WHERE profile_completed = 1"
    ),
    query("SELECT COUNT(*) AS count FROM users WHERE status = 0"),
    query(
      `SELECT COALESCE(SUM(available_balance), 0) AS available_total,
              COALESCE(SUM(locked_balance), 0) AS locked_total,
              COALESCE(SUM(total_recharge), 0) AS recharge_total,
              COALESCE(SUM(total_withdraw), 0) AS withdraw_total,
              COALESCE(SUM(total_reward), 0) AS reward_total
       FROM wallets`
    ),
    query(
      `SELECT COUNT(*) AS completed_count,
              COALESCE(SUM(amount), 0) AS completed_amount
       FROM payment_orders
       WHERE status = 'completed'`
    ),
    query("SELECT COUNT(*) AS count FROM payment_orders WHERE status IN ('pending', 'approved')"),
    query("SELECT COUNT(*) AS count FROM battle_rooms WHERE DATE(created_at) = CURDATE()"),
    query(
      `SELECT COUNT(*) AS count
       FROM battle_rooms
       WHERE entry_fee > 0
         AND DATE(created_at) = CURDATE()`
    ),
    query("SELECT COUNT(*) AS count FROM battle_rooms WHERE status = 'finished' AND DATE(finished_at) = CURDATE()"),
    query("SELECT COUNT(*) AS count FROM withdraw_orders WHERE DATE(created_at) = CURDATE()"),
    query("SELECT COUNT(*) AS count FROM withdraw_orders WHERE status IN ('pending', 'approved')"),
    query("SELECT COUNT(*) AS count FROM battle_rooms WHERE status = 'playing'"),
    query(
      `SELECT
         COALESCE(NULLIF(asset_type, ''), 'PI') AS asset_type,
         COUNT(*) AS finished_rooms,
         COALESCE(SUM(entry_fee * 2 - reward_amount), 0) AS platform_revenue
       FROM battle_rooms
       WHERE status = 'finished'
         AND entry_fee > 0
         AND DATE(finished_at) = CURDATE()
       GROUP BY COALESCE(NULLIF(asset_type, ''), 'PI')`
    ),
    query(
      `SELECT
         COALESCE(NULLIF(asset_type, ''), 'PI') AS asset_type,
         COUNT(*) AS finished_rooms,
         COALESCE(SUM(entry_fee * 2 - reward_amount), 0) AS platform_revenue
       FROM battle_rooms
       WHERE status = 'finished'
         AND entry_fee > 0
       GROUP BY COALESCE(NULLIF(asset_type, ''), 'PI')`
    ),
    query(
      `SELECT
         COALESCE(NULLIF(asset_type, ''), 'PI') AS asset_type,
         COUNT(*) AS finished_rooms,
         COALESCE(SUM(reward_amount), 0) AS total_reward
       FROM battle_rooms
       WHERE status = 'finished'
         AND is_bot_room = 0
       GROUP BY COALESCE(NULLIF(asset_type, ''), 'PI')`
    )
  ]);

  const matchingUsers = await readMatchQueueCount();
  const sessionStats = getActiveSessionStats();
  const [realtimeStats, battleObserver] = await Promise.all([
    readRealtimeStats(),
    readBattleObserverSnapshot()
  ]);
  const totalUsers = Number(totalUsersRows[0]?.count || 0);
  const todayActiveUsers = Number(todayActiveUsersRows[0]?.count || 0);
  const todayBattleCount = Number(battleRows[0]?.count || 0);
  const todayPaidBattleCount = Number(paidBattleRows[0]?.count || 0);
  const todayBattleRevenueAssets = buildBattleRevenueSummary(todayFeeRows);
  const totalBattleRevenueAssets = buildBattleRevenueSummary(totalFeeRows);
  const totalBattleRewardAssets = buildBattleRewardSummary(totalRewardRows);
  const todayPiBattleRevenue = todayBattleRevenueAssets.find((item) => item.assetType === "PI")?.platformRevenue || 0;

  return {
    totalUsers,
    todayNewUsers: Number(todayNewUsersRows[0]?.count || 0),
    todayActiveUsers,
    profileCompletedUsers: Number(completedProfileRows[0]?.count || 0),
    bannedUsers: Number(bannedUsersRows[0]?.count || 0),
    onlineUsers: realtimeStats.uniqueUsers || sessionStats.userCount,
    realtimeConnections: realtimeStats.connections,
    realtimeJoinedConnections: realtimeStats.joinedConnections,
    realtimeInstances: realtimeStats.instances,
    realtimeLastRoomTickCostMs: realtimeStats.lastRoomTickCostMs,
    realtimeLastBroadcastCostMs: realtimeStats.lastBroadcastCostMs,
    realtimeTickSlowCount: realtimeStats.tickSlowCount,
    realtimeBroadcastSlowCount: realtimeStats.broadcastSlowCount,
    matchingUsers,
    roomsInBattle: Number(playingRows[0]?.count || 0),
    todayRevenuePi: Number(todayPiBattleRevenue || 0),
    todayBattleRevenueAssets,
    totalBattleRevenueAssets,
    totalBattleRewardAssets,
    todayBattleCount,
    todayPaidBattleCount,
    todayFinishedBattleCount: Number(finishedBattleRows[0]?.count || 0),
    todayWithdrawCount: Number(withdrawRows[0]?.count || 0),
    pendingWithdrawCount: Number(pendingWithdrawRows[0]?.count || 0),
    totalRechargePi: Number(walletRows[0]?.recharge_total || 0),
    totalWithdrawPi: Number(walletRows[0]?.withdraw_total || 0),
    totalRewardPi: Number(walletRows[0]?.reward_total || 0),
    walletAvailablePi: Number(walletRows[0]?.available_total || 0),
    walletLockedPi: Number(walletRows[0]?.locked_total || 0),
    completedPaymentCount: Number(paymentRows[0]?.completed_count || 0),
    completedPaymentPi: Number(paymentRows[0]?.completed_amount || 0),
    pendingPaymentCount: Number(pendingPaymentRows[0]?.count || 0),
    todayActiveRate: totalUsers ? Number(((todayActiveUsers / totalUsers) * 100).toFixed(2)) : 0,
    todayPaidBattleRate: todayBattleCount ? Number(((todayPaidBattleCount / todayBattleCount) * 100).toFixed(2)) : 0,
    battleObserver
  };
}

module.exports = {
  readDashboard
};
