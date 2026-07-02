const { query, transaction } = require("../db/mysql");
const { readGameConfig } = require("./game-config.repository");
const { increaseBalance } = require("./wallet.repository");
const { enqueueAssetRewardJobs, ensureEngagementRewardJobSchema } = require("./engagement.repository");

const RANKED_MODE_DEFAULTS = ["points_battle", "poc_battle", "pi_battle"];
const RANK_SUPPORTED_MODES = ["quick_battle", "points_battle", "poc_battle", "pi_battle", "ticket_battle", "rich_battle"];

let schemaReady = false;

function executor(connection) {
  return connection || {
    execute: (sql, params) => query(sql, params).then((rows) => [rows])
  };
}

async function ignoreDuplicateColumn(sql) {
  try {
    await query(sql);
  } catch (error) {
    if (error.code !== "ER_DUP_FIELDNAME") throw error;
  }
}

async function ensureRankSchema() {
  if (schemaReady) return;

  await ignoreDuplicateColumn("ALTER TABLE user_ranks ADD COLUMN rank_key VARCHAR(32) NOT NULL DEFAULT 'bronze'");
  await ignoreDuplicateColumn("ALTER TABLE user_ranks ADD COLUMN stars INT NOT NULL DEFAULT 0");
  await ignoreDuplicateColumn("ALTER TABLE user_ranks ADD COLUMN win_streak INT NOT NULL DEFAULT 0");
  await ignoreDuplicateColumn("ALTER TABLE user_ranks ADD COLUMN season_no VARCHAR(32) NOT NULL DEFAULT 'S1'");
  await ignoreDuplicateColumn("ALTER TABLE user_ranks ADD COLUMN best_rank_key VARCHAR(32) NOT NULL DEFAULT 'bronze'");
  await ignoreDuplicateColumn("ALTER TABLE user_ranks ADD COLUMN best_stars INT NOT NULL DEFAULT 0");
  await ignoreDuplicateColumn("ALTER TABLE user_ranks ADD COLUMN best_rank_score INT NOT NULL DEFAULT 1000");
  await ignoreDuplicateColumn("ALTER TABLE user_ranks ADD COLUMN last_ranked_at DATETIME DEFAULT NULL");
  await query(
    `CREATE TABLE IF NOT EXISTS rank_star_records (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      room_no VARCHAR(64) NOT NULL,
      uid VARCHAR(64) NOT NULL,
      mode VARCHAR(32) NOT NULL DEFAULT 'quick_battle',
      result VARCHAR(16) NOT NULL,
      rank_key_before VARCHAR(32) NOT NULL,
      rank_key_after VARCHAR(32) NOT NULL,
      stars_before INT NOT NULL DEFAULT 0,
      stars_after INT NOT NULL DEFAULT 0,
      star_delta INT NOT NULL DEFAULT 0,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uk_rank_star_room_uid (room_no, uid),
      KEY idx_rank_star_uid_id (uid, id)
    )`
  );
  await query(
    `CREATE TABLE IF NOT EXISTS rank_daily_chests (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      uid VARCHAR(64) NOT NULL,
      claim_date DATE NOT NULL,
      rank_key VARCHAR(32) NOT NULL,
      reward_amount DECIMAL(18, 8) NOT NULL DEFAULT 0,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uk_rank_chest_uid_date (uid, claim_date),
      KEY idx_rank_chest_uid_id (uid, id)
    )`
  );
  await query(
    `CREATE TABLE IF NOT EXISTS rank_weekly_settlements (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      season_no VARCHAR(32) NOT NULL,
      uid VARCHAR(64) NOT NULL,
      rank_no INT NOT NULL,
      rank_key VARCHAR(32) NOT NULL,
      stars INT NOT NULL DEFAULT 0,
      reward_amount DECIMAL(18, 8) NOT NULL DEFAULT 0,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uk_rank_weekly_season_uid (season_no, uid),
      KEY idx_rank_weekly_season_rank (season_no, rank_no)
    )`
  );
  await query(
    `CREATE TABLE IF NOT EXISTS rank_weekly_settlement_runs (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      season_no VARCHAR(32) NOT NULL,
      reward_count INT NOT NULL DEFAULT 0,
      total_reward_amount DECIMAL(18, 8) NOT NULL DEFAULT 0,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uk_rank_weekly_run_season (season_no)
    )`
  );
  await query(
    `CREATE TABLE IF NOT EXISTS rank_monthly_season_settlements (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      season_no VARCHAR(32) NOT NULL,
      uid VARCHAR(64) NOT NULL,
      rank_no INT NOT NULL,
      rank_key VARCHAR(32) NOT NULL,
      rank_name VARCHAR(32) NOT NULL,
      stars INT NOT NULL DEFAULT 0,
      win_count INT NOT NULL DEFAULT 0,
      lose_count INT NOT NULL DEFAULT 0,
      reward_points INT NOT NULL DEFAULT 0,
      reset_rank_key VARCHAR(32) NOT NULL DEFAULT 'bronze',
      reset_rank_name VARCHAR(32) NOT NULL DEFAULT '青铜',
      reset_stars INT NOT NULL DEFAULT 0,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uk_rank_monthly_season_uid (season_no, uid),
      KEY idx_rank_monthly_season_rank (season_no, rank_no)
    )`
  );
  await query(
    `CREATE TABLE IF NOT EXISTS rank_monthly_season_runs (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      season_no VARCHAR(32) NOT NULL,
      reward_count INT NOT NULL DEFAULT 0,
      total_reward_points INT NOT NULL DEFAULT 0,
      reset_count INT NOT NULL DEFAULT 0,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uk_rank_monthly_run_season (season_no)
    )`
  );

  schemaReady = true;
}

function getRanks(config) {
  return (config.operation?.ranks || []).filter((rank) => rank.enabled !== false);
}

function getRankIndex(config, rankKeyOrName = "bronze") {
  const ranks = getRanks(config);
  const index = ranks.findIndex((rank) => rank.key === rankKeyOrName || rank.name === rankKeyOrName);
  return index >= 0 ? index : 0;
}

function getRankMeta(config, rankKey = "bronze") {
  const ranks = getRanks(config);
  return ranks.find((rank) => rank.key === rankKey || rank.name === rankKey) || ranks[0] || { key: "bronze", name: "青铜" };
}

function scoreFromRank(config, rankKey, stars) {
  return 1000 + getRankIndex(config, rankKey) * 200 + Number(stars || 0) * 20;
}

function getWinRate(winCount = 0, loseCount = 0) {
  const wins = Number(winCount || 0);
  const total = wins + Number(loseCount || 0);
  return total > 0 ? wins / total : 0;
}

function getRankSortValue(config, item = {}) {
  return getRankIndex(config, item.rankKey || item.rank_key || item.rankName || item.rank_name) * 100000 + Number(item.stars || 0);
}

function sortRankItems(config, a, b) {
  const rankDiff = getRankIndex(config, b.rankKey) - getRankIndex(config, a.rankKey);
  if (rankDiff) return rankDiff;
  if (Number(b.stars || 0) !== Number(a.stars || 0)) return Number(b.stars || 0) - Number(a.stars || 0);
  if (Number(b.winCount || 0) !== Number(a.winCount || 0)) return Number(b.winCount || 0) - Number(a.winCount || 0);
  const winRateDiff = getWinRate(b.winCount, b.loseCount) - getWinRate(a.winCount, a.loseCount);
  if (Math.abs(winRateDiff) > 0.000001) return winRateDiff > 0 ? 1 : -1;
  const bActive = new Date(b.lastRankedAt || b.updatedAt || b.createdAt || 0).getTime() || 0;
  const aActive = new Date(a.lastRankedAt || a.updatedAt || a.createdAt || 0).getTime() || 0;
  if (bActive !== aActive) return bActive - aActive;
  return Number(b.rankScore || 1000) - Number(a.rankScore || 1000);
}

function getKingTitle(config, rankKey, stars = 0) {
  const ranks = getRanks(config);
  const kingKey = ranks[ranks.length - 1]?.key || "king";
  if (rankKey !== kingKey) return getRankMeta(config, rankKey).name;

  const titles = (config.operation?.rankRules?.kingTitles || [])
    .map((item) => ({ minStars: Number(item.minStars || 0), title: String(item.title || "").trim() }))
    .filter((item) => item.title)
    .sort((a, b) => a.minStars - b.minStars);
  let matched = titles[0]?.title || "王者";
  for (const title of titles) {
    if (Number(stars || 0) >= title.minStars) matched = title.title;
  }
  return matched;
}

function getModeMaxRankKey(mode, rules = {}) {
  if (mode === "quick_battle") {
    return rules.quickBattleMaxRankKey || "silver";
  }
  if (mode === "ticket_battle" || mode === "points_battle") {
    return rules.ticketBattleMaxRankKey || "platinum";
  }
  return "";
}

async function ensureRank(uid, connection = null) {
  await ensureRankSchema();
  await executor(connection).execute(
    `INSERT INTO user_ranks (uid, rank_score, rank_name, rank_key, stars, win_count, lose_count, win_streak)
     VALUES (?, 1000, '青铜', 'bronze', 0, 0, 0, 0)
     ON DUPLICATE KEY UPDATE uid = VALUES(uid), best_rank_score = GREATEST(best_rank_score, rank_score)`,
    [uid]
  );

  const [rows] = await executor(connection).execute("SELECT * FROM user_ranks WHERE uid = ? LIMIT 1", [uid]);
  return rows[0];
}

async function ensureRanksForUpdate(uids, connection) {
  await ensureRankSchema();
  const uniqueUids = [...new Set((uids || []).filter(Boolean).map(String))].sort();

  for (const uid of uniqueUids) {
    await executor(connection).execute(
      `INSERT INTO user_ranks (uid, rank_score, rank_name, rank_key, stars, win_count, lose_count, win_streak)
       VALUES (?, 1000, '青铜', 'bronze', 0, 0, 0, 0)
       ON DUPLICATE KEY UPDATE uid = VALUES(uid), best_rank_score = GREATEST(best_rank_score, rank_score)`,
      [uid]
    );
  }

  const ranks = {};
  for (const uid of uniqueUids) {
    const [rows] = await executor(connection).execute("SELECT * FROM user_ranks WHERE uid = ? LIMIT 1 FOR UPDATE", [uid]);
    if (rows[0]) ranks[uid] = rows[0];
  }

  return ranks;
}

function applyRankResult(rank, config, result, mode = "quick_battle") {
  const rules = config.operation?.rankRules || {};
  const ranks = getRanks(config);
  const starsPerRank = Number(rules.starsPerRank || 5);
  const beforeKey =
    rank.rank_key && rank.rank_key !== "bronze"
      ? rank.rank_key
      : getRankMeta(config, rank.rank_name || rank.rank_key).key || "bronze";
  let rankIndex = getRankIndex(config, beforeKey);
  let stars = Number(rank.stars || 0);
  let winStreak = Number(rank.win_streak || 0);
  const starsBefore = stars;
  const rankKeyBefore = ranks[rankIndex]?.key || "bronze";
  const rankIndexBefore = rankIndex;

  if (result === "win") {
    winStreak += 1;
    stars += Number(rules.winStars || 1);
    if (
      rules.winStreakBonusEnabled !== false &&
      Number(rules.winStreakRequired || 3) > 0 &&
      winStreak % Number(rules.winStreakRequired || 3) === 0
    ) {
      stars += Number(rules.winStreakBonusStars || 1);
    }
  } else {
    winStreak = 0;
    const protectedBronze = rankKeyBefore === "bronze" && rules.bronzeProtection !== false;
    if (!protectedBronze) {
      stars -= Number(rules.loseStars || 1);
    }
  }

  while (stars >= starsPerRank && rankIndex < ranks.length - 1) {
    stars -= starsPerRank;
    rankIndex += 1;
  }

  while (stars < 0 && rankIndex > 0) {
    rankIndex -= 1;
    stars = starsPerRank + stars;
  }

  const modeMaxRankKey = getModeMaxRankKey(mode, rules);

  if (modeMaxRankKey && result === "win") {
    const capRankKey = modeMaxRankKey;
    const capIndex = getRankIndex(config, capRankKey);
    const capIsFinalRank = capIndex >= ranks.length - 1;
    if (rankIndexBefore > capIndex) {
      rankIndex = rankIndexBefore;
      stars = starsBefore;
    } else if (rankIndex > capIndex) {
      rankIndex = capIndex;
      stars = capIsFinalRank ? stars : starsPerRank;
    } else if (rankIndex === capIndex && !capIsFinalRank) {
      stars = Math.min(stars, starsPerRank);
    }
  }

  if (rankIndex === ranks.length - 1) {
    stars = Math.max(0, stars);
  }

  stars = Math.max(0, stars);
  const nextRank = ranks[rankIndex] || ranks[0] || { key: "bronze", name: "青铜" };

  return {
    rankKeyBefore,
    starsBefore,
    rankKey: nextRank.key,
    rankName: nextRank.name,
    stars,
    winStreak,
    score: scoreFromRank(config, nextRank.key, stars),
    starDelta: stars - starsBefore + (rankIndex - getRankIndex(config, rankKeyBefore)) * starsPerRank
  };
}

async function updateRank(uid, next, result, connection) {
  await executor(connection).execute(
    `UPDATE user_ranks
     SET rank_score = ?,
         rank_name = ?,
         rank_key = ?,
         stars = ?,
         win_streak = ?,
         best_rank_key = IF(? > best_rank_score, ?, best_rank_key),
         best_stars = IF(? > best_rank_score, ?, best_stars),
         best_rank_score = GREATEST(best_rank_score, ?),
         last_ranked_at = NOW(),
         win_count = win_count + ?,
         lose_count = lose_count + ?
     WHERE uid = ?`,
    [
      next.score,
      next.rankName,
      next.rankKey,
      next.stars,
      next.winStreak,
      next.score,
      next.rankKey,
      next.score,
      next.stars,
      next.score,
      result === "win" ? 1 : 0,
      result === "lose" ? 1 : 0,
      uid
    ]
  );
  await executor(connection).execute("UPDATE users SET rank_name = ? WHERE uid = ?", [next.rankName, uid]);
}

async function insertStarRecord({ roomNo, uid, mode, result, next }, connection) {
  await executor(connection).execute(
    `INSERT INTO rank_star_records
       (room_no, uid, mode, result, rank_key_before, rank_key_after, stars_before, stars_after, star_delta)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE uid = VALUES(uid)`,
    [
      roomNo,
      uid,
      mode,
      result,
      next.rankKeyBefore,
      next.rankKey,
      next.starsBefore,
      next.stars,
      next.starDelta
    ]
  );
}

async function settleRankMatch(
  { roomNo, winnerUid, loserUid, mode = "quick_battle", entryFee = 0, rewardAmount = 0 },
  connection = null
) {
  const config = await readGameConfig();
  const rankedModes = config.operation?.rankRules?.rankedModes || RANKED_MODE_DEFAULTS;

  if (!rankedModes.includes(mode)) {
    return {
      ranked: false
    };
  }

  const lockedRanks = await ensureRanksForUpdate([winnerUid, loserUid], connection);
  const winner = lockedRanks[winnerUid];
  const loser = lockedRanks[loserUid];

  if (!winner || !loser) {
    throw new Error("段位数据锁定失败，请稍后重试");
  }

  const winnerNext = applyRankResult(winner, config, "win", mode);
  const loserNext = applyRankResult(loser, config, "lose", mode);

  const updates = [
    { uid: winnerUid, next: winnerNext, result: "win" },
    { uid: loserUid, next: loserNext, result: "lose" }
  ].sort((a, b) => String(a.uid).localeCompare(String(b.uid)));

  for (const item of updates) {
    await updateRank(item.uid, item.next, item.result, connection);
  }

  await insertStarRecord({ roomNo, uid: winnerUid, mode, result: "win", next: winnerNext }, connection);
  await insertStarRecord({ roomNo, uid: loserUid, mode, result: "lose", next: loserNext }, connection);

  await executor(connection).execute(
    `INSERT INTO rank_match_records
       (room_no, winner_uid, loser_uid, entry_fee, reward_amount, winner_score_delta, loser_score_delta)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE winner_uid = VALUES(winner_uid)`,
    [roomNo, winnerUid, loserUid, entryFee, rewardAmount, winnerNext.score - Number(winner.rank_score), loserNext.score - Number(loser.rank_score)]
  );

  return {
    ranked: true,
    winner: {
      ...winner,
      rank_score: winnerNext.score,
      rank_name: winnerNext.rankName,
      rank_key: winnerNext.rankKey,
      stars: winnerNext.stars,
      win_streak: winnerNext.winStreak
    },
    loser: {
      ...loser,
      rank_score: loserNext.score,
      rank_name: loserNext.rankName,
      rank_key: loserNext.rankKey,
      stars: loserNext.stars,
      win_streak: loserNext.winStreak
    }
  };
}

async function settleRankBotMatch(
  { roomNo, userUid, userResult, botUid = "bot", mode = "points_battle", entryFee = 0, rewardAmount = 0 },
  connection = null
) {
  const config = await readGameConfig();
  const rankedModes = config.operation?.rankRules?.rankedModes || RANKED_MODE_DEFAULTS;

  if (!rankedModes.includes(mode)) {
    return {
      ranked: false
    };
  }

  const lockedRanks = await ensureRanksForUpdate([userUid], connection);
  const rank = lockedRanks[userUid];

  if (!rank) {
    throw new Error("段位数据锁定失败，请稍后重试");
  }

  const result = userResult === "win" ? "win" : "lose";
  const next = applyRankResult(rank, config, result, mode);
  await updateRank(userUid, next, result, connection);
  await insertStarRecord({ roomNo, uid: userUid, mode, result, next }, connection);

  await executor(connection).execute(
    `INSERT INTO rank_match_records
       (room_no, winner_uid, loser_uid, entry_fee, reward_amount, winner_score_delta, loser_score_delta)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE winner_uid = VALUES(winner_uid)`,
    [
      roomNo,
      result === "win" ? userUid : botUid,
      result === "win" ? botUid : userUid,
      entryFee,
      rewardAmount,
      result === "win" ? next.score - Number(rank.rank_score) : 0,
      result === "lose" ? next.score - Number(rank.rank_score) : 0
    ]
  );

  return {
    ranked: true,
    user: {
      ...rank,
      rank_score: next.score,
      rank_name: next.rankName,
      rank_key: next.rankKey,
      stars: next.stars,
      win_streak: next.winStreak
    }
  };
}

async function countTodayRankedBattles(uid, config) {
  const modes = config.operation?.rankRules?.rankedModes || RANKED_MODE_DEFAULTS;
  const placeholders = modes.map(() => "?").join(",");
  const rows = await query(
    `SELECT COUNT(*) AS count
     FROM battle_rooms
     WHERE status = 'finished'
       AND DATE(finished_at) = CURDATE()
       AND (player_a_uid = ? OR player_b_uid = ?)
       AND mode IN (${placeholders})`,
    [uid, uid, ...modes]
  );

  return Number(rows[0]?.count || 0);
}

async function findTodayChest(uid) {
  await ensureRankSchema();
  const rows = await query("SELECT * FROM rank_daily_chests WHERE uid = ? AND claim_date = CURDATE() LIMIT 1", [uid]);
  return rows[0] || null;
}

async function getRankStatus(uid) {
  const config = await readGameConfig();
  const rank = await ensureRank(uid);
  const todayRankedBattles = await countTodayRankedBattles(uid, config);
  const claimed = await findTodayChest(uid);
  const rules = config.operation?.rankRules || {};
  const current = getRankMeta(config, rank.rank_key && rank.rank_key !== "bronze" ? rank.rank_key : rank.rank_name);
  const required = Number(rules.dailyChestRequiredBattles || 3);
  const rewardAmount = Number(rules.chestRewards?.[current.key] || 0);

  return {
    rankKey: current.key,
    rankName: current.name,
    rankTitle: getKingTitle(config, current.key, Number(rank.stars || 0)),
    stars: Number(rank.stars || 0),
    starsPerRank: Number(rules.starsPerRank || 5),
    winStreak: Number(rank.win_streak || 0),
    rankScore: Number(rank.rank_score || 1000),
    bestRankKey: rank.best_rank_key || current.key,
    bestRankName: getRankMeta(config, rank.best_rank_key || current.key).name,
    bestStars: Number(rank.best_stars || 0),
    bestRankTitle: getKingTitle(config, rank.best_rank_key || current.key, Number(rank.best_stars || 0)),
    season: getSeasonTimeInfo(),
    seasonRewards: getSeasonRewardTiers(rules),
    kingTitles: rules.kingTitles || [],
    todayRankedBattles,
    dailyChestRequiredBattles: required,
    dailyChestClaimed: Boolean(claimed),
    dailyChestEligible: todayRankedBattles >= required && !claimed,
    dailyChestRewardAmount: rewardAmount
  };
}

async function claimDailyRankChest(uid) {
  return transaction(async (connection) => {
    const status = await getRankStatus(uid);

    if (status.dailyChestClaimed) {
      return {
        ...status,
        dailyChestClaimed: true,
        dailyChestEligible: false,
        alreadyClaimed: true
      };
    }

    if (!status.dailyChestEligible) {
      throw new Error(`今日还需完成 ${status.dailyChestRequiredBattles} 场有效段位对局才能领取`);
    }

    const [insertResult] = await executor(connection).execute(
      `INSERT IGNORE INTO rank_daily_chests (uid, claim_date, rank_key, reward_amount)
       VALUES (?, CURDATE(), ?, ?)`,
      [uid, status.rankKey, status.dailyChestRewardAmount]
    );

    if (Number(insertResult?.affectedRows || 0) === 0) {
      return {
        ...status,
        dailyChestClaimed: true,
        dailyChestEligible: false,
        alreadyClaimed: true
      };
    }

    if (status.dailyChestRewardAmount > 0) {
      await increaseBalance(
        uid,
        status.dailyChestRewardAmount,
        {
          type: "reward",
          relatedType: "rank_daily_chest",
          relatedId: `${uid}:${new Date().toISOString().slice(0, 10)}`,
          remark: "Pi闪电战每日段位宝箱"
        },
        connection
      );
    }

    return {
      ...status,
      dailyChestClaimed: true,
      dailyChestEligible: false
    };
  });
}

async function listAdminRankStarRecords(limit = 200) {
  await ensureRankSchema();
  const safeLimit = Math.min(300, Math.max(1, Number.parseInt(String(limit), 10) || 200));

  return query(
    `SELECT r.id, r.room_no, r.uid, u.pi_username, u.nickname, u.avatar_key,
            r.mode, r.result, r.rank_key_before, r.rank_key_after,
            r.stars_before, r.stars_after, r.star_delta, r.created_at
     FROM rank_star_records r
     LEFT JOIN users u ON u.uid = r.uid
     ORDER BY r.id DESC
     LIMIT ${safeLimit}`
  );
}

async function listAdminRankDailyChests(limit = 200) {
  await ensureRankSchema();
  const safeLimit = Math.min(300, Math.max(1, Number.parseInt(String(limit), 10) || 200));

  return query(
    `SELECT c.id, c.uid, u.pi_username, u.nickname, u.avatar_key,
            c.claim_date, c.rank_key, c.reward_amount, c.created_at
     FROM rank_daily_chests c
     LEFT JOIN users u ON u.uid = c.uid
     ORDER BY c.id DESC
     LIMIT ${safeLimit}`
  );
}

async function listAdminRankWeeklySettlements(limit = 200) {
  await ensureRankSchema();
  const safeLimit = Math.min(300, Math.max(1, Number.parseInt(String(limit), 10) || 200));

  return query(
    `SELECT s.id, s.season_no, s.uid, u.pi_username, u.nickname, u.avatar_key,
            s.rank_no, s.rank_key, s.stars, s.reward_amount, s.created_at
     FROM rank_weekly_settlements s
     LEFT JOIN users u ON u.uid = s.uid
     ORDER BY s.id DESC
     LIMIT ${safeLimit}`
  );
}

async function listRankLeaderboard(limit = 50) {
  await ensureRankSchema();
  const config = await readGameConfig();
  const safeLimit = Math.min(500, Math.max(1, Number.parseInt(String(limit), 10) || 50));
  const rows = await query(
    `SELECT r.uid, u.pi_username, u.nickname, u.avatar_key,
            r.rank_key, r.rank_name, r.stars, r.win_count, r.lose_count, r.win_streak, r.rank_score
     FROM user_ranks r
     LEFT JOIN users u ON u.uid = r.uid`
  );

  return rows
    .map((row) => ({
      uid: row.uid,
      piUsername: row.pi_username || "",
      nickname: row.nickname || "",
      avatarKey: row.avatar_key || "avatar_1",
      rankKey: row.rank_key || getRankMeta(config, row.rank_name).key,
      rankName: row.rank_name || getRankMeta(config, row.rank_key).name,
      stars: Number(row.stars || 0),
      winCount: Number(row.win_count || 0),
      loseCount: Number(row.lose_count || 0),
      winStreak: Number(row.win_streak || 0),
      rankScore: Number(row.rank_score || 1000),
      lastRankedAt: row.last_ranked_at || "",
      updatedAt: row.updated_at || "",
      rankTitle: getKingTitle(config, row.rank_key || getRankMeta(config, row.rank_name).key, Number(row.stars || 0))
    }))
    .sort((a, b) => sortRankItems(config, a, b))
    .slice(0, safeLimit)
    .map((item, index) => ({
      ...item,
      rankNo: index + 1
    }));
}

function getWeekSeasonNo(date = new Date()) {
  const target = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = target.getUTCDay() || 7;

  target.setUTCDate(target.getUTCDate() + 4 - day);

  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((target.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);

  return `${target.getUTCFullYear()}W${String(week).padStart(2, "0")}`;
}

function formatDateOnly(date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
}

function normalizeWeekSeasonNo(seasonNo = "") {
  const matched = /^(\d{4})W(\d{1,2})$/.exec(String(seasonNo).trim());
  if (!matched) {
    throw new Error("周赛季编号格式错误，应为 2026W22");
  }

  const year = Number(matched[1]);
  const week = Number(matched[2]);
  if (week < 1 || week > 53) {
    throw new Error("周赛季编号周数无效");
  }

  return {
    year,
    week,
    seasonNo: `${year}W${String(week).padStart(2, "0")}`
  };
}

function getWeekRangeFromSeasonNo(seasonNo) {
  const normalized = normalizeWeekSeasonNo(seasonNo);
  const jan4 = new Date(Date.UTC(normalized.year, 0, 4));
  const jan4Day = jan4.getUTCDay() || 7;
  const weekOneMonday = new Date(jan4);
  weekOneMonday.setUTCDate(jan4.getUTCDate() - jan4Day + 1);

  const start = new Date(weekOneMonday);
  start.setUTCDate(weekOneMonday.getUTCDate() + (normalized.week - 1) * 7);

  if (getWeekSeasonNo(start) !== normalized.seasonNo) {
    throw new Error("周赛季编号不存在");
  }

  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 7);

  return {
    seasonNo: normalized.seasonNo,
    startAt: `${formatDateOnly(start)} 00:00:00`,
    endAt: `${formatDateOnly(end)} 00:00:00`
  };
}

function getPreviousWeekSeasonNo(referenceDate = new Date()) {
  const previousWeek = new Date(referenceDate);
  previousWeek.setDate(previousWeek.getDate() - 7);
  return getWeekSeasonNo(previousWeek);
}

function getMonthSeasonNo(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function getPreviousMonthSeasonNo(referenceDate = new Date()) {
  return getMonthSeasonNo(new Date(referenceDate.getFullYear(), referenceDate.getMonth() - 1, 1));
}

function getMonthRangeFromSeasonNo(seasonNo = "") {
  const matched = /^(\d{4})-(\d{2})$/.exec(String(seasonNo).trim());
  if (!matched) {
    throw new Error("月赛季编号格式错误，应为 2026-06");
  }
  const year = Number(matched[1]);
  const month = Number(matched[2]);
  if (month < 1 || month > 12) {
    throw new Error("月赛季编号月份无效");
  }
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);
  return {
    seasonNo: `${year}-${String(month).padStart(2, "0")}`,
    startAt: `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}-01 00:00:00`,
    endAt: `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, "0")}-01 00:00:00`
  };
}

function getSeasonTimeInfo(date = new Date()) {
  const currentSeasonNo = getMonthSeasonNo(date);
  const range = getMonthRangeFromSeasonNo(currentSeasonNo);
  const end = new Date(range.endAt.replace(" ", "T"));
  const remainDays = Math.max(0, Math.ceil((end.getTime() - date.getTime()) / 86400000));
  return {
    currentSeasonNo,
    seasonTitle: `S${currentSeasonNo.replace("-", ".")} 赛季`,
    seasonStartAt: range.startAt,
    seasonEndAt: range.endAt,
    seasonRemainDays: remainDays,
    previousSeasonNo: getPreviousMonthSeasonNo(date)
  };
}

function getSeasonRewardTiers(rankRules = {}) {
  return (Array.isArray(rankRules.seasonRewardTiers) ? rankRules.seasonRewardTiers : [])
    .map((tier) => ({
      fromRank: Math.max(1, Number.parseInt(String(tier.fromRank), 10) || 1),
      toRank: Math.max(1, Number.parseInt(String(tier.toRank), 10) || 1),
      points: Math.max(0, Math.round(Number(tier.points || 0)))
    }))
    .filter((tier) => tier.points > 0)
    .sort((a, b) => a.fromRank - b.fromRank || a.toRank - b.toRank);
}

function getSeasonReward(rankNo, rewardTiers = []) {
  const matched = rewardTiers.find((tier) => rankNo >= tier.fromRank && rankNo <= tier.toRank);
  return matched ? Math.round(Number(matched.points || 0)) : 0;
}

function getSeasonResetTarget(config, rankKey, stars) {
  const ranks = getRanks(config);
  const starsPerRank = Number(config.operation?.rankRules?.starsPerRank || 5);
  const resetRules = config.operation?.rankRules?.seasonResetRules || {};
  const currentIndex = getRankIndex(config, rankKey);
  const kingIndex = ranks.length - 1;
  const starlight = ranks.find((rank) => rank.key === "starlight")?.key || ranks[Math.max(0, kingIndex - 1)]?.key || "diamond";
  const diamond = ranks.find((rank) => rank.key === "diamond")?.key || ranks[Math.max(0, kingIndex - 2)]?.key || "platinum";
  const platinum = ranks.find((rank) => rank.key === "platinum")?.key || ranks[Math.max(0, kingIndex - 3)]?.key || "gold";
  function ruleTarget(key, fallbackKey, fallbackStars) {
    const rule = resetRules[key] && typeof resetRules[key] === "object" ? resetRules[key] : {};
    return {
      rankKey: getRankMeta(config, rule.rankKey || fallbackKey).key,
      stars: Math.min(Math.max(0, Number.parseInt(String(rule.stars ?? fallbackStars), 10) || 0), starsPerRank)
    };
  }

  let resetKey = rankKey;
  let resetStars = Math.min(Number(stars || 0), starsPerRank);
  if (currentIndex >= kingIndex) {
    if (Number(stars || 0) >= 50) {
      const target = ruleTarget("king50Plus", starlight, 3);
      resetKey = target.rankKey;
      resetStars = target.stars;
    } else if (Number(stars || 0) >= 10) {
      const target = ruleTarget("king10To49", starlight, 1);
      resetKey = target.rankKey;
      resetStars = target.stars;
    } else {
      const target = ruleTarget("king0To9", diamond, 3);
      resetKey = target.rankKey;
      resetStars = target.stars;
    }
  } else if (rankKey === "starlight") {
    const target = ruleTarget("starlight", diamond, Math.min(resetStars, starsPerRank));
    resetKey = target.rankKey;
    resetStars = target.stars;
  } else if (rankKey === "diamond") {
    const target = ruleTarget("diamond", platinum, Math.min(resetStars, starsPerRank));
    resetKey = target.rankKey;
    resetStars = target.stars;
  } else if (currentIndex > 0) {
    const dropTiers = Math.min(Math.max(0, Number.parseInt(String(resetRules.defaultDropTiers ?? 1), 10) || 0), 3);
    resetKey = ranks[Math.max(0, currentIndex - dropTiers)]?.key || "bronze";
    resetStars = Math.min(resetStars, starsPerRank);
  }
  const rank = getRankMeta(config, resetKey);
  return {
    rankKey: rank.key,
    rankName: rank.name,
    stars: Math.max(0, resetStars),
    score: scoreFromRank(config, rank.key, Math.max(0, resetStars))
  };
}

function getWeeklyRewardTiers(rankRules = {}) {
  const tiers = Array.isArray(rankRules.weeklyRewardTiers) && rankRules.weeklyRewardTiers.length
    ? rankRules.weeklyRewardTiers
    : [
        { fromRank: 1, toRank: 1, amount: rankRules.weeklyRewards?.top1 || 0 },
        { fromRank: 2, toRank: 2, amount: rankRules.weeklyRewards?.top2 || 0 },
        { fromRank: 3, toRank: 3, amount: rankRules.weeklyRewards?.top3 || 0 },
        { fromRank: 4, toRank: 10, amount: rankRules.weeklyRewards?.top10 || 0 }
      ];

  return tiers
    .map((tier) => ({
      fromRank: Math.max(1, Number.parseInt(String(tier.fromRank), 10) || 1),
      toRank: Math.max(1, Number.parseInt(String(tier.toRank), 10) || 1),
      amount: Number(tier.amount || 0)
    }))
    .filter((tier) => tier.amount > 0)
    .sort((a, b) => a.fromRank - b.fromRank || a.toRank - b.toRank);
}

function getWeeklyReward(rankNo, weeklyRewardTiers = []) {
  const matched = weeklyRewardTiers.find((tier) => rankNo >= tier.fromRank && rankNo <= tier.toRank);
  if (matched) return Number(matched.amount || 0);
  return 0;
}

async function listWeeklyRankLeaderboard(seasonNo, limit = 50, connection = null, configOverride = null) {
  await ensureRankSchema();
  const config = configOverride || await readGameConfig();
  const safeLimit = Math.min(500, Math.max(1, Number.parseInt(String(limit), 10) || 50));
  const range = getWeekRangeFromSeasonNo(seasonNo);
  const weeklyModes = (config.operation?.rankRules?.weeklyLeaderboardModes || RANKED_MODE_DEFAULTS)
    .filter((mode) => RANK_SUPPORTED_MODES.includes(mode));

  if (!weeklyModes.length) {
    return [];
  }

  const modePlaceholders = weeklyModes.map(() => "?").join(",");
  const [rows] = await executor(connection).execute(
    `SELECT r.uid, u.pi_username, u.nickname, u.avatar_key,
            r.rank_key, r.rank_name, r.stars, r.win_count, r.lose_count, r.win_streak, r.rank_score,
            SUM(s.star_delta) AS weekly_star_gain,
            SUM(CASE WHEN s.result = 'win' THEN 1 ELSE 0 END) AS weekly_win_count,
            COUNT(DISTINCT s.room_no) AS weekly_battle_count
     FROM rank_star_records s
     INNER JOIN user_ranks r ON r.uid = s.uid
     LEFT JOIN users u ON u.uid = s.uid
     WHERE s.created_at >= ?
       AND s.created_at < ?
       AND s.result IN ('win', 'lose')
       AND s.mode IN (${modePlaceholders})
     GROUP BY r.uid, u.pi_username, u.nickname, u.avatar_key,
              r.rank_key, r.rank_name, r.stars, r.win_count, r.lose_count, r.win_streak, r.rank_score
     HAVING weekly_win_count > 0 OR weekly_star_gain > 0`,
    [range.startAt, range.endAt, ...weeklyModes]
  );

  return rows
    .map((row) => ({
      uid: row.uid,
      piUsername: row.pi_username || "",
      nickname: row.nickname || "",
      avatarKey: row.avatar_key || "avatar_1",
      rankKey: row.rank_key || getRankMeta(config, row.rank_name).key,
      rankName: row.rank_name || getRankMeta(config, row.rank_key).name,
      stars: Number(row.stars || 0),
      winCount: Number(row.win_count || 0),
      loseCount: Number(row.lose_count || 0),
      winStreak: Number(row.win_streak || 0),
      rankScore: Number(row.rank_score || 1000),
      weeklyStarGain: Number(row.weekly_star_gain || 0),
      weeklyWinCount: Number(row.weekly_win_count || 0),
      weeklyBattleCount: Number(row.weekly_battle_count || 0)
    }))
    .sort((a, b) => {
      if (b.weeklyStarGain !== a.weeklyStarGain) return b.weeklyStarGain - a.weeklyStarGain;
      if (b.weeklyWinCount !== a.weeklyWinCount) return b.weeklyWinCount - a.weeklyWinCount;
      const rankDiff = getRankIndex(config, b.rankKey) - getRankIndex(config, a.rankKey);
      if (rankDiff) return rankDiff;
      if (b.stars !== a.stars) return b.stars - a.stars;
      return b.rankScore - a.rankScore;
    })
    .slice(0, safeLimit)
    .map((item, index) => ({
      ...item,
      rankNo: index + 1
    }));
}

async function listMonthlySeasonLeaderboard(seasonNo, limit = 100, connection = null, configOverride = null) {
  await ensureRankSchema();
  const config = configOverride || await readGameConfig();
  const safeLimit = Math.min(1000, Math.max(1, Number.parseInt(String(limit), 10) || 100));
  const range = getMonthRangeFromSeasonNo(seasonNo);
  const rankedModes = (config.operation?.rankRules?.rankedModes || RANKED_MODE_DEFAULTS)
    .filter((mode) => RANK_SUPPORTED_MODES.includes(mode));

  if (!rankedModes.length) return [];

  const modePlaceholders = rankedModes.map(() => "?").join(",");
  const [rows] = await executor(connection).execute(
    `SELECT r.uid, u.pi_username, u.nickname, u.avatar_key,
            r.rank_key, r.rank_name, r.stars, r.win_count, r.lose_count, r.win_streak, r.rank_score,
            r.best_rank_key, r.best_stars, r.last_ranked_at, r.updated_at,
            SUM(CASE WHEN s.result = 'win' THEN 1 ELSE 0 END) AS season_win_count,
            SUM(CASE WHEN s.result = 'lose' THEN 1 ELSE 0 END) AS season_lose_count,
            SUM(s.star_delta) AS season_star_gain,
            COUNT(DISTINCT s.room_no) AS season_battle_count
     FROM rank_star_records s
     INNER JOIN user_ranks r ON r.uid = s.uid
     LEFT JOIN users u ON u.uid = s.uid
     WHERE s.created_at >= ?
       AND s.created_at < ?
       AND s.result IN ('win', 'lose')
       AND s.mode IN (${modePlaceholders})
     GROUP BY r.uid, u.pi_username, u.nickname, u.avatar_key,
              r.rank_key, r.rank_name, r.stars, r.win_count, r.lose_count,
              r.win_streak, r.rank_score, r.best_rank_key, r.best_stars, r.last_ranked_at, r.updated_at
     HAVING season_win_count > 0 OR season_star_gain > 0`,
    [range.startAt, range.endAt, ...rankedModes]
  );

  return rows
    .map((row) => {
      const rankKey = row.rank_key || getRankMeta(config, row.rank_name).key;
      return {
        uid: row.uid,
        piUsername: row.pi_username || "",
        nickname: row.nickname || "",
        avatarKey: row.avatar_key || "avatar_1",
        rankKey,
        rankName: row.rank_name || getRankMeta(config, rankKey).name,
        rankTitle: getKingTitle(config, rankKey, Number(row.stars || 0)),
        stars: Number(row.stars || 0),
        winCount: Number(row.win_count || 0),
        loseCount: Number(row.lose_count || 0),
        winStreak: Number(row.win_streak || 0),
        rankScore: Number(row.rank_score || 1000),
        lastRankedAt: row.last_ranked_at || "",
        updatedAt: row.updated_at || "",
        seasonWinCount: Number(row.season_win_count || 0),
        seasonLoseCount: Number(row.season_lose_count || 0),
        seasonStarGain: Number(row.season_star_gain || 0),
        seasonBattleCount: Number(row.season_battle_count || 0)
      };
    })
    .sort((a, b) => sortRankItems(config, a, b))
    .slice(0, safeLimit)
    .map((item, index) => ({
      ...item,
      rankNo: index + 1
    }));
}

async function listAdminRankMonthlySettlements(limit = 200) {
  await ensureRankSchema();
  const safeLimit = Math.min(300, Math.max(1, Number.parseInt(String(limit), 10) || 200));

  return query(
    `SELECT s.id, s.season_no, s.uid, u.pi_username, u.nickname, u.avatar_key,
            s.rank_no, s.rank_key, s.rank_name, s.stars, s.win_count, s.lose_count,
            s.reward_points, s.reset_rank_key, s.reset_rank_name, s.reset_stars, s.created_at
     FROM rank_monthly_season_settlements s
     LEFT JOIN users u ON u.uid = s.uid
     ORDER BY s.id DESC
     LIMIT ${safeLimit}`
  );
}

async function settleMonthlySeason(options = {}) {
  await ensureRankSchema();
  await ensureEngagementRewardJobSchema();
  const config = await readGameConfig();
  const rankRules = config.operation?.rankRules || {};
  if (rankRules.monthlySeasonEnabled === false) {
    return { seasonNo: options.seasonNo || getPreviousMonthSeasonNo(), disabled: true, rewards: [] };
  }
  const seasonNo = getMonthRangeFromSeasonNo(options.seasonNo || getPreviousMonthSeasonNo()).seasonNo;
  const silentIfSettled = Boolean(options.silentIfSettled);

  return transaction(async (connection) => {
    const [existedRun] = await executor(connection).execute(
      "SELECT id FROM rank_monthly_season_runs WHERE season_no = ? LIMIT 1",
      [seasonNo]
    );
    const [existedSettlement] = await executor(connection).execute(
      "SELECT id FROM rank_monthly_season_settlements WHERE season_no = ? LIMIT 1",
      [seasonNo]
    );

    if (existedRun[0] || existedSettlement[0]) {
      if (silentIfSettled) {
        return { seasonNo, alreadySettled: true, rewards: [] };
      }
      throw new Error("该月赛季已结算，不能重复发放");
    }

    const rewardTiers = getSeasonRewardTiers(rankRules);
    const maxRewardRank = Math.max(100, ...rewardTiers.map((tier) => tier.toRank));
    const leaderboard = await listMonthlySeasonLeaderboard(seasonNo, maxRewardRank, connection, config);
    let rewardCount = 0;
    let totalRewardPoints = 0;
    const rewards = [];

    for (const item of leaderboard) {
      const points = Math.round(getSeasonReward(item.rankNo, rewardTiers));
      const reset = getSeasonResetTarget(config, item.rankKey, item.stars);

      await executor(connection).execute(
        `INSERT INTO rank_monthly_season_settlements
           (season_no, uid, rank_no, rank_key, rank_name, stars, win_count, lose_count,
            reward_points, reset_rank_key, reset_rank_name, reset_stars)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          seasonNo,
          item.uid,
          item.rankNo,
          item.rankKey,
          item.rankName,
          item.stars,
          item.seasonWinCount,
          item.seasonLoseCount,
          points,
          reset.rankKey,
          reset.rankName,
          reset.stars
        ]
      );

      await executor(connection).execute(
        `UPDATE user_ranks
         SET rank_key = ?, rank_name = ?, stars = ?, rank_score = ?, win_streak = 0, season_no = ?
         WHERE uid = ?`,
        [reset.rankKey, reset.rankName, reset.stars, reset.score, getMonthSeasonNo(), item.uid]
      );

      if (points > 0) {
        rewardCount += 1;
        totalRewardPoints += points;
        await enqueueAssetRewardJobs({
          uid: item.uid,
          claimId: 0,
          claimType: "rank_monthly_season_reward",
          taskKey: `${seasonNo}:${item.rankNo}`,
          title: `${seasonNo}月赛季第${item.rankNo}名奖励`,
          today: seasonNo,
          orderPrefix: "rank",
          remark: `Pi闪电战${seasonNo}月赛季第${item.rankNo}名奖励`,
          rewards: [{ assetType: "POINTS", amount: points }]
        }, connection);
      }

      rewards.push({ ...item, seasonNo, rewardPoints: points, reset });
    }

    await executor(connection).execute(
      `INSERT INTO rank_monthly_season_runs (season_no, reward_count, total_reward_points, reset_count)
       VALUES (?, ?, ?, ?)`,
      [seasonNo, rewardCount, totalRewardPoints, leaderboard.length]
    );

    return { seasonNo, alreadySettled: false, rewards };
  });
}

async function settleWeeklyLeaderboard(options = {}) {
  await ensureRankSchema();
  const config = await readGameConfig();
  const seasonNo = getWeekRangeFromSeasonNo(options.seasonNo || getWeekSeasonNo()).seasonNo;
  const silentIfSettled = Boolean(options.silentIfSettled);

  return transaction(async (connection) => {
    const [existedRun] = await executor(connection).execute(
      "SELECT id FROM rank_weekly_settlement_runs WHERE season_no = ? LIMIT 1",
      [seasonNo]
    );
    const [existedSettlement] = await executor(connection).execute(
      "SELECT id FROM rank_weekly_settlements WHERE season_no = ? LIMIT 1",
      [seasonNo]
    );

    if (existedRun[0] || existedSettlement[0]) {
      if (silentIfSettled) {
        return {
          seasonNo,
          alreadySettled: true,
          rewards: []
        };
      }

      throw new Error("该周段位奖励已结算，不能重复发放");
    }

    const rankRules = config.operation?.rankRules || {};
    const weeklyRewardTiers = getWeeklyRewardTiers(rankRules);
    const maxRewardRank = Math.max(10, ...weeklyRewardTiers.map((tier) => tier.toRank));
    const leaderboard = await listWeeklyRankLeaderboard(seasonNo, maxRewardRank, connection, config);
    const rewards = [];
    let rewardCount = 0;
    let totalRewardAmount = 0;

    for (const item of leaderboard) {
      const amount = Number(getWeeklyReward(item.rankNo, weeklyRewardTiers).toFixed(8));
      await executor(connection).execute(
        `INSERT INTO rank_weekly_settlements
           (season_no, uid, rank_no, rank_key, stars, reward_amount)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [seasonNo, item.uid, item.rankNo, item.rankKey, item.stars, amount]
      );

      if (amount > 0) {
        rewardCount += 1;
        totalRewardAmount += amount;
        await increaseBalance(
          item.uid,
          amount,
          {
            type: "reward",
            relatedType: "rank_weekly_reward",
            relatedId: `${seasonNo}:${item.uid}`,
            remark: `Pi闪电战${seasonNo}周赛季第${item.rankNo}名奖励`
          },
          connection
        );
      }

      rewards.push({
        ...item,
        seasonNo,
        rewardAmount: amount
      });
    }

    await executor(connection).execute(
      `INSERT INTO rank_weekly_settlement_runs (season_no, reward_count, total_reward_amount)
       VALUES (?, ?, ?)`,
      [seasonNo, rewardCount, Number(totalRewardAmount.toFixed(8))]
    );

    return {
      seasonNo,
      alreadySettled: false,
      rewards
    };
  });
}

module.exports = {
  ensureRank,
  settleRankMatch,
  settleRankBotMatch,
  getRankStatus,
  claimDailyRankChest,
  listAdminRankStarRecords,
  listAdminRankDailyChests,
  listAdminRankWeeklySettlements,
  listAdminRankMonthlySettlements,
  listRankLeaderboard,
  listWeeklyRankLeaderboard,
  listMonthlySeasonLeaderboard,
  getWeekSeasonNo,
  getWeekRangeFromSeasonNo,
  getPreviousWeekSeasonNo,
  getMonthSeasonNo,
  getPreviousMonthSeasonNo,
  getSeasonTimeInfo,
  getWeeklyRewardTiers,
  getWeeklyReward,
  getSeasonRewardTiers,
  getSeasonReward,
  getKingTitle,
  getSeasonResetTarget,
  settleWeeklyLeaderboard,
  settleMonthlySeason
};
