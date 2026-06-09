const { query } = require("../db/mysql");

async function readPublicStats() {
  try {
    const [userRows, battleRows, rewardRows] = await Promise.all([
      query("SELECT COUNT(*) AS total_users FROM users"),
      query(
        `SELECT COUNT(*) AS total_battles,
                SUM(CASE WHEN DATE(created_at) = CURDATE() THEN 1 ELSE 0 END) AS today_battles
         FROM battle_rooms`
      ),
      query(
        `SELECT COALESCE(NULLIF(asset_type, ''), 'PI') AS asset_type,
                COALESCE(SUM(reward_amount), 0) AS total_reward
         FROM battle_rooms
         WHERE status = 'finished'
           AND is_bot_room = 0
         GROUP BY COALESCE(NULLIF(asset_type, ''), 'PI')`
      )
    ]);
    const rewardByAsset = rewardRows.reduce(
      (next, row) => {
        const assetType = String(row.asset_type || "PI").toUpperCase();
        next[assetType] = Number(row.total_reward || 0);
        return next;
      },
      { PI: 0, POINTS: 0, POC: 0 }
    );

    return {
      totalUsers: Number(userRows[0]?.total_users || 0),
      totalBattles: Number(battleRows[0]?.total_battles || 0),
      todayBattles: Number(battleRows[0]?.today_battles || 0),
      totalRewardPi: rewardByAsset.PI,
      totalRewardPoints: Math.floor(rewardByAsset.POINTS),
      totalRewardPoc: Number(rewardByAsset.POC.toFixed(6))
    };
  } catch (error) {
    console.error("[public-stats] MySQL read failed:", error.message);
    return {
      totalUsers: 0,
      totalBattles: 0,
      todayBattles: 0,
      totalRewardPi: 0,
      totalRewardPoints: 0,
      totalRewardPoc: 0
    };
  }
}

module.exports = {
  readPublicStats
};
