const {
  joinQueue,
  cancelQueue,
  getMatchStatus,
  getRoomForUser,
  getBattleResult,
  getRoomsSnapshot
} = require("../services/match.service");
const { getActiveUserFromToken } = require("../services/auth.service");
const { enqueueRealtimeSettlement } = require("../services/settlement-worker.service");
const { REALTIME_SETTLEMENT_SECRET } = require("../config");
const { countUserBattleRooms, listUserBattleRooms } = require("../repositories/battle.repository");

async function getRequestUser(req) {
  const token = req?.headers?.authorization?.replace("Bearer ", "") || "";
  return getActiveUserFromToken(token);
}

async function joinMatchQueue(req, payload = {}) {
  return joinQueue(await getRequestUser(req), payload);
}

async function cancelMatchQueue(req) {
  return cancelQueue(await getRequestUser(req));
}

async function getCurrentMatchStatus(req) {
  return getMatchStatus(await getRequestUser(req));
}

async function getBattleRoom(req, roomNo) {
  return getRoomForUser(roomNo, (await getRequestUser(req)).uid);
}

async function submitBattleAction(req, roomNo, action) {
  throw new Error("旧版对战操作接口已停用，请使用实时对战通道");
}

async function getBattleSummaryForRequest(req, roomNo) {
  return getBattleResult(roomNo, (await getRequestUser(req)).uid);
}

function getBattleHistoryResult(row, uid) {
  if (row.status === "finished") {
    if (row.winner_uid === uid) return "win";
    if (row.loser_uid === uid) return "lose";
    return "draw";
  }

  if (row.status === "manual_review") return "review";
  if (row.status === "expired" || row.status === "cancelled") return "expired";
  return "unfinished";
}

function getBattleHistoryOpponent(row, uid) {
  const isPlayerA = row.player_a_uid === uid;
  const opponentUid = isPlayerA ? row.player_b_uid : row.player_a_uid;
  const opponentPiUsername = isPlayerA ? row.player_b_pi_username : row.player_a_pi_username;
  const opponentNickname = isPlayerA ? row.player_b_nickname : row.player_a_nickname;

  if (String(opponentUid || "").startsWith("bot_")) {
    return {
      uid: opponentUid,
      piUsername: "",
      nickname: "闪战Bot"
    };
  }

  return {
    uid: opponentUid,
    piUsername: opponentPiUsername || "",
    nickname: opponentNickname || opponentPiUsername || `玩家${String(opponentUid || "").slice(-4)}`
  };
}

function parsePositiveInt(value, fallback) {
  const parsed = Number.parseInt(String(value || ""), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parseHistoryMode(value = "") {
  return ["quick_battle", "points_battle", "poc_battle", "pi_battle", "ticket_battle", "rich_battle"].includes(value)
    ? value
    : "";
}

async function getMyBattleHistory(req, query = {}) {
  const user = await getRequestUser(req);
  const pageSize = Math.min(15, parsePositiveInt(query.pageSize, 15));
  const page = parsePositiveInt(query.page, 1);
  const mode = parseHistoryMode(query.mode);
  const [total, rows] = await Promise.all([
    countUserBattleRooms(user.uid, mode),
    listUserBattleRooms(user.uid, { page, pageSize, mode })
  ]);

  const items = rows.map((row) => {
    const isPlayerA = row.player_a_uid === user.uid;
    const opponent = getBattleHistoryOpponent(row, user.uid);

    return {
      roomNo: row.room_no,
      mode: row.mode,
      status: row.status,
      result: getBattleHistoryResult(row, user.uid),
      opponent,
      myScore: Number(isPlayerA ? row.player_a_score : row.player_b_score) || 0,
      opponentScore: Number(isPlayerA ? row.player_b_score : row.player_a_score) || 0,
      entryFee: Number(row.entry_fee) || 0,
      rewardAmount: row.winner_uid === user.uid ? Number(row.reward_amount) || 0 : 0,
      roomRewardAmount: Number(row.reward_amount) || 0,
      isBotRoom: Boolean(row.is_bot_room),
      createdAt: row.created_at,
      finishedAt: row.finished_at
    };
  });

  return {
    items,
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize))
  };
}

async function settleRealtimeBattle(payload) {
  const remoteAddress = payload?.remoteAddress || "";
  if (remoteAddress && !["127.0.0.1", "::1", "::ffff:127.0.0.1"].includes(remoteAddress)) {
    throw new Error("非法结算来源");
  }

  if (payload.secret !== REALTIME_SETTLEMENT_SECRET) {
    throw new Error("结算密钥错误");
  }

  return enqueueRealtimeSettlement(payload.room);
}

async function getAdminRooms() {
  return getRoomsSnapshot();
}

module.exports = {
  joinMatchQueue,
  cancelMatchQueue,
  getCurrentMatchStatus,
  getBattleRoom,
  submitBattleAction,
  getBattleSummaryForRequest,
  getMyBattleHistory,
  settleRealtimeBattle,
  getAdminRooms
};
