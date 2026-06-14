const { query, isRetryableTransactionError } = require("../db/mysql");

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function executor(connection) {
  return connection || {
    execute: (sql, params) => query(sql, params).then((rows) => [rows])
  };
}

function getPlayerScore(player) {
  return Number(player?.score ?? player?.board?.score ?? 0) || 0;
}

function getPlayerSnapshotNickname(player) {
  return String(player?.nickname || player?.piUsername || player?.pi_username || "").trim().slice(0, 80);
}

let battleAssetColumnsEnsured = false;

async function ensureBattleAssetColumns(connection = null) {
  if (battleAssetColumnsEnsured) return;

  const columns = [
    "ADD COLUMN player_a_snapshot_nickname VARCHAR(80) NOT NULL DEFAULT '' AFTER player_a_uid",
    "ADD COLUMN player_b_snapshot_nickname VARCHAR(80) NOT NULL DEFAULT '' AFTER player_b_uid",
    "ADD COLUMN asset_type VARCHAR(20) NOT NULL DEFAULT 'PI' AFTER is_bot_room",
    "ADD COLUMN platform_fee_amount DECIMAL(20,8) NOT NULL DEFAULT 0 AFTER reward_amount",
    "ADD COLUMN asset_settlement_status VARCHAR(30) NOT NULL DEFAULT '' AFTER platform_fee_amount",
    "ADD COLUMN asset_error VARCHAR(255) NOT NULL DEFAULT '' AFTER asset_settlement_status"
  ];

  for (const columnSql of columns) {
    try {
      await executor(connection).execute(`ALTER TABLE battle_rooms ${columnSql}`);
    } catch (error) {
      if (!/Duplicate column|1060/i.test(String(error.message || ""))) {
        throw error;
      }
    }
  }

  battleAssetColumnsEnsured = true;
}

async function createBattleRoomRecord(room, meta = {}, connection = null) {
  const players = room.players || [];
  await ensureBattleAssetColumns();

  await executor(connection).execute(
    `INSERT INTO battle_rooms
       (room_no, mode, status, player_a_uid, player_a_snapshot_nickname, player_b_uid, player_b_snapshot_nickname,
        entry_fee, platform_fee_rate, reward_amount, is_bot_room, asset_type, platform_fee_amount,
        asset_settlement_status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       status = VALUES(status),
       player_a_snapshot_nickname = IF(player_a_snapshot_nickname = '', VALUES(player_a_snapshot_nickname), player_a_snapshot_nickname),
       player_b_snapshot_nickname = IF(player_b_snapshot_nickname = '', VALUES(player_b_snapshot_nickname), player_b_snapshot_nickname)`,
    [
      room.roomNo,
      room.mode || "quick_battle",
      room.status || "playing",
      players[0]?.uid || "",
      getPlayerSnapshotNickname(players[0]),
      players[1]?.uid || "",
      getPlayerSnapshotNickname(players[1]),
      meta.entryFee || 0,
      meta.platformFeeRate || 0,
      meta.rewardAmount || 0,
      players.some((player) => String(player.uid || "").startsWith("bot_")) ? 1 : 0,
      meta.assetType || "PI",
      meta.platformFeeAmount || 0,
      meta.assetType && meta.assetType !== "FREE" ? "frozen" : ""
    ]
  );
}

async function finishBattleRoomRecord(room, connection = null) {
  const winner = room.players.find((player) => player.uid === room.winnerUid);
  const loser = winner ? room.players.find((player) => player.uid !== room.winnerUid) : null;

  await executor(connection).execute(
    `UPDATE battle_rooms
     SET status = ?,
         winner_uid = ?,
         loser_uid = ?,
         player_a_score = ?,
         player_b_score = ?,
         finished_at = NOW()
     WHERE room_no = ? AND status <> 'finished'`,
    [
      "finished",
      winner?.uid || "",
      loser?.uid || "",
      getPlayerScore(room.players[0]),
      getPlayerScore(room.players[1]),
      room.roomNo
    ]
  );
}

async function findBattleRoom(roomNo, connection = null) {
  await ensureBattleAssetColumns();
  const [rows] = await executor(connection).execute(
    "SELECT * FROM battle_rooms WHERE room_no = ? LIMIT 1",
    [roomNo]
  );

  return rows[0] || null;
}

async function findBattleRoomForUpdate(roomNo, connection) {
  await ensureBattleAssetColumns();
  const [rows] = await executor(connection).execute(
    "SELECT * FROM battle_rooms WHERE room_no = ? LIMIT 1 FOR UPDATE",
    [roomNo]
  );

  return rows[0] || null;
}

async function listBattleRooms(limit = 50) {
  const safeLimit = Math.min(200, Math.max(1, Number.parseInt(String(limit), 10) || 50));
  await ensureBattleAssetColumns();

  return query(
    `SELECT b.room_no, b.mode, b.status,
            b.player_a_uid, ua.pi_username AS player_a_pi_username,
            COALESCE(NULLIF(b.player_a_snapshot_nickname, ''), ua.nickname) AS player_a_nickname,
            b.player_b_uid, ub.pi_username AS player_b_pi_username,
            COALESCE(NULLIF(b.player_b_snapshot_nickname, ''), ub.nickname) AS player_b_nickname,
            b.winner_uid, uw.pi_username AS winner_pi_username, uw.nickname AS winner_nickname,
            b.loser_uid, ul.pi_username AS loser_pi_username, ul.nickname AS loser_nickname,
            b.entry_fee, b.reward_amount, b.platform_fee_rate, b.is_bot_room,
            b.asset_type, b.platform_fee_amount, b.asset_settlement_status, b.asset_error,
            b.created_at, b.finished_at
     FROM battle_rooms b
     LEFT JOIN users ua ON ua.uid = b.player_a_uid
     LEFT JOIN users ub ON ub.uid = b.player_b_uid
     LEFT JOIN users uw ON uw.uid = b.winner_uid
     LEFT JOIN users ul ON ul.uid = b.loser_uid
     ORDER BY b.id DESC
     LIMIT ${safeLimit}`
  );
}

async function countActiveBattleRooms() {
  const rows = await query(
    `SELECT COUNT(*) AS total
     FROM battle_rooms
     WHERE status = 'playing'
       AND created_at >= DATE_SUB(NOW(), INTERVAL 1 DAY)`
  );

  return Number(rows[0]?.total || 0);
}

function normalizeHistoryMode(mode = "") {
  return ["quick_battle", "points_battle", "poc_battle", "pi_battle", "ticket_battle", "rich_battle"].includes(mode)
    ? mode
    : "";
}

async function countUserBattleRooms(uid, mode = "") {
  const safeMode = normalizeHistoryMode(mode);
  const params = [uid, uid];
  let modeClause = "";

  if (safeMode) {
    modeClause = " AND mode = ?";
    params.push(safeMode);
  }

  const rows = await query(
    `SELECT COUNT(*) AS total
     FROM battle_rooms
     WHERE (player_a_uid = ? OR player_b_uid = ?)
       AND status IN ('finished', 'manual_review')${modeClause}`,
    params
  );

  return Number(rows[0]?.total || 0);
}

async function listUserBattleRooms(uid, { page = 1, pageSize = 15, mode = "" } = {}) {
  const safePageSize = Math.min(15, Math.max(1, Number.parseInt(String(pageSize), 10) || 15));
  const safePage = Math.max(1, Number.parseInt(String(page), 10) || 1);
  const safeMode = normalizeHistoryMode(mode);
  const offset = (safePage - 1) * safePageSize;
  const params = [uid, uid];
  let modeClause = "";
  await ensureBattleAssetColumns();

  if (safeMode) {
    modeClause = " AND b.mode = ?";
    params.push(safeMode);
  }

  return query(
    `SELECT b.room_no, b.mode, b.status,
            b.player_a_uid, ua.pi_username AS player_a_pi_username,
            COALESCE(NULLIF(b.player_a_snapshot_nickname, ''), ua.nickname) AS player_a_nickname,
            b.player_b_uid, ub.pi_username AS player_b_pi_username,
            COALESCE(NULLIF(b.player_b_snapshot_nickname, ''), ub.nickname) AS player_b_nickname,
            b.winner_uid, b.loser_uid,
            b.player_a_score, b.player_b_score,
            b.entry_fee, b.reward_amount, b.is_bot_room, b.asset_type, b.platform_fee_amount,
            b.created_at, b.finished_at
     FROM battle_rooms b
     LEFT JOIN users ua ON ua.uid = b.player_a_uid
     LEFT JOIN users ub ON ub.uid = b.player_b_uid
     WHERE (b.player_a_uid = ? OR b.player_b_uid = ?)
       AND b.status IN ('finished', 'manual_review')${modeClause}
     ORDER BY b.id DESC
     LIMIT ${safePageSize} OFFSET ${offset}`,
    params
  );
}

async function listUserAssetBattleLedgerRows(uid, limit = 60) {
  const safeLimit = Math.min(100, Math.max(1, Number.parseInt(String(limit), 10) || 60));
  await ensureBattleAssetColumns();

  return query(
    `SELECT room_no, mode, status, player_a_uid, player_b_uid, winner_uid, loser_uid,
            entry_fee, reward_amount, asset_type, asset_settlement_status, asset_error,
            created_at, finished_at
     FROM battle_rooms
     WHERE (player_a_uid = ? OR player_b_uid = ?)
       AND COALESCE(asset_type, '') IN ('POINTS', 'POC')
       AND status IN ('finished', 'manual_review')
     ORDER BY id DESC
     LIMIT ${safeLimit}`,
    [uid, uid]
  );
}

async function expireStaleFreeBotRooms(minutes = 5) {
  const safeMinutes = Math.min(60, Math.max(2, Number.parseInt(String(minutes), 10) || 5));
  await ensureBattleAssetColumns();

  let attempt = 0;
  while (true) {
    attempt += 1;
    try {
      const result = await query(
        `UPDATE battle_rooms
         SET status = 'expired',
             finished_at = COALESCE(finished_at, NOW()),
             asset_error = CASE
               WHEN COALESCE(asset_error, '') = '' THEN 'free stale room auto expired'
               ELSE asset_error
             END
         WHERE status = 'playing'
           AND entry_fee = 0
           AND COALESCE(asset_type, 'FREE') = 'FREE'
           AND created_at < DATE_SUB(NOW(), INTERVAL ${safeMinutes} MINUTE)`
      );

      return Number(result?.affectedRows || 0);
    } catch (error) {
      if (attempt >= 4 || !isRetryableTransactionError(error)) {
        throw error;
      }
      const delayMs = 120 * attempt + Math.floor(Math.random() * 160);
      console.warn(`[room-maintenance] stale room cleanup retry after ${error.code || error.errno || "lock"} (${attempt}/3)`);
      await wait(delayMs);
    }
  }
}

async function updateBattleRoomStatus(roomNo, status, connection = null) {
  await executor(connection).execute(
    `UPDATE battle_rooms
     SET status = ?,
         finished_at = CASE WHEN ? IN ('expired', 'cancelled', 'manual_review') THEN COALESCE(finished_at, NOW()) ELSE finished_at END
     WHERE room_no = ?`,
    [status, status, roomNo]
  );
}

async function updateBattleAssetStatus(roomNo, status, error = "", connection = null) {
  await ensureBattleAssetColumns();
  await executor(connection).execute(
    `UPDATE battle_rooms
     SET asset_settlement_status = ?,
         asset_error = ?
     WHERE room_no = ?`,
    [status || "", String(error || "").slice(0, 255), roomNo]
  );
}

module.exports = {
  createBattleRoomRecord,
  finishBattleRoomRecord,
  findBattleRoom,
  findBattleRoomForUpdate,
  listBattleRooms,
  countActiveBattleRooms,
  countUserBattleRooms,
  listUserBattleRooms,
  listUserAssetBattleLedgerRows,
  expireStaleFreeBotRooms,
  updateBattleRoomStatus,
  updateBattleAssetStatus
};
