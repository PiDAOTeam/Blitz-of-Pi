const crypto = require("node:crypto");
const { redisGet, redisSet, redisSetNx, redisDel } = require("../db/redis");
const { transaction } = require("../db/mysql");
const { readGameConfig } = require("../repositories/game-config.repository");
const {
  consumeLockedBalance,
  getWallet,
  increaseBalance,
  lockBalance,
  unlockBalance
} = require("../repositories/wallet.repository");
const assetGateway = require("./asset-gateway.service");
const {
  createBattleRoomRecord,
  finishBattleRoomRecord,
  findBattleRoomForUpdate,
  updateBattleRoomStatus,
  updateBattleAssetStatus,
  countActiveBattleRooms,
  expireStaleFreeBotRooms
} = require("../repositories/battle.repository");
const { settleRankMatch } = require("../repositories/rank.repository");
const { settleBattleInviteCommission } = require("./growth.service");
const { observeBattleStage } = require("./battle-observer.service");
const { findUserByUid } = require("../repositories/user.repository");
const {
  countFinishedBattlesForInviteTrial,
  findInviteRelationByInvitee
} = require("../repositories/growth.repository");

const matchState = {
  rooms: new Map(),
  userRoomMap: new Map()
};

const REDIS_QUEUE_PREFIX = "blitz:match:queue:";
const REDIS_USER_ROOM_PREFIX = "blitz:user-room:";
const REDIS_ROOM_PREFIX = "blitz:room:";
const REDIS_REALTIME_ROOM_PREFIX = "blitz:realtime-room:";
const REDIS_CANCEL_COOLDOWN_PREFIX = "blitz:match:cancel-cooldown:";
const REDIS_MATCH_LOCK_PREFIX = "blitz:match:lock:";
const REDIS_ROOM_JOIN_TOKEN_PREFIX = "blitz:room-join-token:";
const ROOM_JOIN_TOKEN_TTL_SECONDS = 300;

const BATTLE_MODES = {
  quick_battle: {
    configKey: "quickBattle",
    name: "快速开战",
    assetType: "FREE"
  },
  points_battle: {
    configKey: "pointsBattle",
    name: "小富豪",
    assetType: "POINTS"
  },
  poc_battle: {
    configKey: "pocBattle",
    name: "大富豪",
    assetType: "POC"
  },
  pi_battle: {
    configKey: "piBattle",
    name: "超级富豪",
    assetType: "PI"
  },
  ticket_battle: {
    configKey: "ticketBattle",
    name: "小富豪场",
    assetType: "PI"
  },
  rich_battle: {
    configKey: "richBattle",
    name: "大富豪场",
    assetType: "PI"
  }
};

const DEFAULT_TIMING = {
  quickBotFallbackSeconds: 30,
  matchCancelWaitSeconds: 20,
  matchCancelCooldownSeconds: 10,
  waitingReadyTimeoutSeconds: 30,
  vsIntroSeconds: 5,
  readyCountdownSeconds: 6,
  quickRoundSeconds: 75,
  paidRoundSeconds: 90,
  botMoveIntervalSeconds: 2.6
};
const MATCH_LOCK_WAIT_MS = 2500;
const MATCH_LOCK_RETRY_BASE_MS = 25;

function observeMatchStage(stage, detail = {}) {
  observeBattleStage(stage, detail).catch((error) => {
    console.error("[match:observer] write failed:", error.message);
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getTimingConfig(config = {}) {
  return {
    ...DEFAULT_TIMING,
    ...(config.timing || {})
  };
}

function getRoundSeconds(mode, timing = DEFAULT_TIMING) {
  return mode === "quick_battle"
    ? Number(timing.quickRoundSeconds || DEFAULT_TIMING.quickRoundSeconds)
    : Number(timing.paidRoundSeconds || DEFAULT_TIMING.paidRoundSeconds);
}

async function isRoomCapacityFull(config = {}) {
  const maxActiveRooms = Number(config.capacity?.maxActiveRooms || 0);
  if (!maxActiveRooms) return false;

  return (await countActiveBattleRooms()) >= maxActiveRooms;
}

function getQueueingResponse({ mode, queueLength, waitingMs, cancelWaitSeconds, capacityLimited = false }) {
  return {
    status: "queueing",
    mode,
    queueLength,
    waitingSeconds: Math.floor(Number(waitingMs || 0) / 1000),
    canCancel: Number(waitingMs || 0) >= Number(cancelWaitSeconds || 0) * 1000,
    cancelWaitSeconds: Math.max(0, Number(cancelWaitSeconds || 0) - Math.floor(Number(waitingMs || 0) / 1000)),
    capacityLimited,
    message: capacityLimited ? "当前开战人数较多，正在排队" : ""
  };
}

function createBoardState(seed, mode = "quick_battle", timing = DEFAULT_TIMING) {
  return {
    seed,
    columns: 6,
    rows: 8,
    colors: 5,
    score: 0,
    pressure: 0,
    combo: 0,
    remainSeconds: getRoundSeconds(mode, timing)
  };
}

function createBotPlayer() {
  return {
    uid: `bot_${Date.now()}`,
    nickname: "闪战Bot",
    avatarUrl: "",
    avatarKey: "bot",
    rankName: "青铜"
  };
}

function normalizeBattleMode(mode) {
  return BATTLE_MODES[mode] ? mode : "quick_battle";
}

function getRankOrder(config) {
  const ranks = config.operation?.ranks || [];
  return ranks.map((rank) => rank.key);
}

function getRankKeyByName(config, rankName = "青铜") {
  const ranks = config.operation?.ranks || [];
  return ranks.find((rank) => rank.name === rankName || rank.key === rankName)?.key || "bronze";
}

function getRankNameByKey(config, rankKey = "bronze") {
  const ranks = config.operation?.ranks || [];
  return ranks.find((rank) => rank.key === rankKey)?.name || "青铜";
}

function assertModeRankAccess(user, mode, config) {
  if (mode !== "rich_battle" && mode !== "pi_battle") return;

  const minRankKey = config.operation?.rankRules?.richBattleMinRankKey || "bronze";
  const rankOrder = getRankOrder(config);
  const minIndex = rankOrder.indexOf(minRankKey);
  const userIndex = rankOrder.indexOf(getRankKeyByName(config, user.rankName));

  if (minIndex > 0 && userIndex >= 0 && userIndex < minIndex) {
    throw new Error(`${BATTLE_MODES[mode]?.name || "高阶场"}需达到${getRankNameByKey(config, minRankKey)}段位后进入`);
  }
}

async function assertInviteBindingAccess(user, mode, config) {
  const inviteConfig = config.inviteRewards || {};
  const modes = Array.isArray(inviteConfig.bindRequiredModes) ? inviteConfig.bindRequiredModes : [];
  if (
    inviteConfig.enabled === false ||
    inviteConfig.bindEnabled === false ||
    inviteConfig.bindRequiredEnabled === false ||
    !modes.includes(normalizeBattleMode(mode))
  ) {
    return;
  }

  const allowedBattles = Math.max(0, Number(inviteConfig.bindRequiredAfterBattles ?? 5));
  const relation = await findInviteRelationByInvitee(user.uid);
  if (relation) return;

  const finishedBattles = await countFinishedBattlesForInviteTrial(user.uid);
  if (finishedBattles < allowedBattles) return;

  const message = String(inviteConfig.bindRequiredMessage || "").trim() || "请先绑定邀请人，再继续对战。";
  const error = new Error(message);
  error.expectedBusinessError = true;
  error.businessCode = 1601;
  throw error;
}

async function assertUserEntryAssetAccess(user, mode, config) {
  const battleMode = normalizeBattleMode(mode);
  const modeConfig = config[BATTLE_MODES[battleMode].configKey] || {};
  const assetType = getModeAssetType(battleMode, modeConfig);
  const entryFee = normalizeEntryAmount(assetType, modeConfig.entryFee || 0);

  if (entryFee <= 0 || isBotUid(user.uid)) return;

  if (isRemoteAssetType(assetType)) {
    const summary = await assetGateway.summary(user);
    const asset = summary?.[assetType] || {};
    const balance = Number(asset.balance || 0);

    if (!Number.isFinite(balance) || balance < entryFee) {
      throw new Error(assetType === "POINTS" ? "积分余额不足" : "POC余额不足");
    }
    return;
  }

  if (assetType === "PI") {
    const wallet = await getWallet(user.uid);
    const availableBalance = Number(wallet?.available_balance ?? wallet?.balance ?? 0);
    const lockedBalance = Number(wallet?.locked_balance ?? wallet?.locked ?? 0);
    const available = availableBalance - lockedBalance;

    if (!Number.isFinite(available) || available < entryFee) {
      throw new Error("Pi余额不足");
    }
  }
}

function getQueueKey(mode) {
  return `${REDIS_QUEUE_PREFIX}${normalizeBattleMode(mode)}`;
}

function createRoom(playerA, playerB, mode = "quick_battle", timing = DEFAULT_TIMING) {
  const roomNo = `room_${Date.now()}_${crypto.randomBytes(6).toString("hex")}`;
  const toRoomPlayer = (player, seed) => ({
    uid: player.uid,
    piUserId: player.piUserId || player.pi_user_id || "",
    piUsername: player.piUsername || player.pi_username || "",
    nickname: player.nickname,
    avatarUrl: player.avatarUrl || player.avatar_url || "",
    avatarKey: player.avatarKey || player.avatar_key || (String(player.uid).startsWith("bot_") ? "bot" : "avatar_1"),
    board: createBoardState(seed, mode, timing)
  });
  const room = {
    roomNo,
    mode: normalizeBattleMode(mode),
    status: "playing",
    createdAt: new Date().toISOString(),
    timing,
    players: [
      toRoomPlayer(playerA, 1001),
      toRoomPlayer(playerB, 2002)
    ],
    winnerUid: "",
    battleLog: []
  };

  return room;
}

async function withMatchLock(mode, callback) {
  const lockKey = `${REDIS_MATCH_LOCK_PREFIX}${normalizeBattleMode(mode)}`;
  const lockValue = `${Date.now()}:${crypto.randomBytes(6).toString("hex")}`;
  const deadline = Date.now() + MATCH_LOCK_WAIT_MS;
  let attempt = 0;
  let locked = false;

  while (!locked) {
    locked = await redisSetNx(lockKey, lockValue, 8);
    if (locked) break;

    if (Date.now() >= deadline) {
      throw new Error("匹配处理中，请稍后重试");
    }

    attempt += 1;
    await sleep(MATCH_LOCK_RETRY_BASE_MS * Math.min(attempt, 8) + Math.floor(Math.random() * 20));
  }

  try {
    return await callback();
  } finally {
    const current = await redisGet(lockKey);
    if (current === lockValue) {
      await redisDel(lockKey);
    }
  }
}

async function tryWithMatchLock(mode, callback) {
  const lockKey = `${REDIS_MATCH_LOCK_PREFIX}${normalizeBattleMode(mode)}`;
  const lockValue = `${Date.now()}:${crypto.randomBytes(6).toString("hex")}`;
  const locked = await redisSetNx(lockKey, lockValue, 8);

  if (!locked) {
    return null;
  }

  try {
    return await callback();
  } finally {
    const current = await redisGet(lockKey);
    if (current === lockValue) {
      await redisDel(lockKey);
    }
  }
}

async function readJson(key) {
  const raw = await redisGet(key);
  return raw ? JSON.parse(raw) : null;
}

async function writeJson(key, value, seconds = 3600) {
  return redisSet(key, JSON.stringify(value), seconds);
}

function getRoomJoinTokenKey(roomNo, uid) {
  return `${REDIS_ROOM_JOIN_TOKEN_PREFIX}${roomNo}:${uid}`;
}

async function issueRoomJoinToken(roomNo, uid) {
  if (!roomNo || !uid || isBotUid(uid)) {
    return "";
  }

  const token = crypto.randomBytes(24).toString("hex");
  const ok = await redisSet(getRoomJoinTokenKey(roomNo, uid), token, ROOM_JOIN_TOKEN_TTL_SECONDS);
  return ok ? token : "";
}

async function createMatchedResponse(user, roomNo, extra = {}) {
  return {
    status: "matched",
    roomNo,
    roomJoinToken: await issueRoomJoinToken(roomNo, user.uid),
    ...extra
  };
}

function isBotUid(uid) {
  return String(uid || "").startsWith("bot_");
}

function sortPlayersByUid(players = []) {
  return [...players].sort((a, b) => String(a?.uid || "").localeCompare(String(b?.uid || "")));
}

function isUserInRoom(room, uid) {
  return Boolean(room?.players?.some((player) => player.uid === uid));
}

function isPaidMode(mode) {
  return getModeAssetType(mode) !== "FREE";
}

function getModeMeta(mode) {
  return BATTLE_MODES[normalizeBattleMode(mode)] || BATTLE_MODES.quick_battle;
}

function getModeAssetType(mode, modeConfig = {}) {
  return String(modeConfig.assetType || getModeMeta(mode).assetType || "PI").toUpperCase();
}

function isRemoteAssetType(assetType) {
  return assetType === "POINTS" || assetType === "POC";
}

function normalizeEntryAmount(assetType, amount) {
  const value = Number(amount || 0);
  if (!Number.isFinite(value) || value < 0) {
    throw new Error("门票金额无效");
  }
  if (assetType === "POINTS") {
    if (!Number.isInteger(value)) {
      throw new Error("积分场门票必须是整数，不能填写小数");
    }
    return value;
  }
  if (assetType === "POC") {
    return Number(value.toFixed(6));
  }
  return Number(value.toFixed(8));
}

function getPlatformFeeAmount(entryFee, platformFeeRate, assetType, rewardAmount = null) {
  if (assetType === "POINTS") {
    if (rewardAmount !== null && rewardAmount !== undefined) {
      return Math.max(0, Math.floor(Number(entryFee || 0) * 2) - Math.floor(Number(rewardAmount || 0)));
    }
    return Math.max(0, Math.floor(Number(entryFee || 0) * 2 * Number(platformFeeRate || 0)));
  }
  const amount = Number(entryFee || 0) * 2 * Number(platformFeeRate || 0);
  return normalizeEntryAmount(assetType, amount);
}

function getRewardAmount(entryFee, rewardRate, assetType) {
  const amount = Number(entryFee || 0) * 2 * Number(rewardRate || 0);
  if (assetType === "POINTS") {
    return Math.max(0, Math.floor(amount));
  }
  return normalizeEntryAmount(assetType, amount);
}

function isAssetGatewayModeAllowed(mode, user, config) {
  const assetGatewayConfig = config.assetGateway || {};
  const modeAssetType = getModeAssetType(mode, config[getModeMeta(mode).configKey] || {});

  if (!isRemoteAssetType(modeAssetType)) {
    return true;
  }
  if (!assetGatewayConfig.enabled) {
    throw new Error("积分/POC 场正在灰度中，暂未开放");
  }
  if (modeAssetType === "POINTS" && !assetGatewayConfig.pointsEnabled) {
    throw new Error("小富豪积分场暂未开放");
  }
  if (modeAssetType === "POC" && !assetGatewayConfig.pocEnabled) {
    throw new Error("大富豪 POC 场暂未开放");
  }

  const grayUids = new Set(assetGatewayConfig.grayUserPiUids || []);
  const grayNames = new Set((assetGatewayConfig.grayUserPiUsernames || []).map((name) => String(name).toLowerCase()));
  if (grayUids.size || grayNames.size) {
    const piUid = String(user.piUserId || user.pi_user_id || "").trim();
    const piUsername = String(user.piUsername || user.pi_username || "").trim().toLowerCase();
    if (!grayUids.has(piUid) && !grayNames.has(piUsername)) {
      throw new Error("该资产场当前仅对灰度用户开放");
    }
  }

  return true;
}

function bindRoomInMemory(room) {
  matchState.rooms.set(room.roomNo, room);
  for (const player of room.players || []) {
    matchState.userRoomMap.set(player.uid, room.roomNo);
  }
}

async function persistRoomBindings(room) {
  const roomStored = await writeJson(`${REDIS_ROOM_PREFIX}${room.roomNo}`, room, 7200);
  const playerBindings = [];

  for (const player of room.players || []) {
    playerBindings.push(redisSet(`${REDIS_USER_ROOM_PREFIX}${player.uid}`, room.roomNo, 7200));
  }

  const bindingResults = await Promise.all(playerBindings);

  if (!roomStored || bindingResults.some((result) => !result)) {
    for (const player of room.players || []) {
      await clearOnlyUserRoomBinding(player.uid);
    }
    matchState.rooms.delete(room.roomNo);
    await redisDel(`${REDIS_ROOM_PREFIX}${room.roomNo}`);
    await redisDel(`${REDIS_REALTIME_ROOM_PREFIX}${room.roomNo}`);
    throw new Error("实时房间创建失败，请重新匹配");
  }

  bindRoomInMemory(room);
}

function takePairForUser(queue, uid) {
  const selfIndex = queue.findIndex((item) => item.uid === uid);
  const opponentIndex = queue.findIndex((item) => item.uid !== uid);

  if (selfIndex < 0 || opponentIndex < 0) {
    return null;
  }

  const pairIndexes = [selfIndex, opponentIndex].sort((a, b) => b - a);
  const players = [];

  for (const index of pairIndexes) {
    players.push(queue.splice(index, 1)[0]);
  }

  const self = players.find((item) => item.uid === uid);
  const opponent = players.find((item) => item.uid !== uid);

  return [self, opponent];
}

function attachFailedPlayer(error, player, assetType) {
  if (player?.uid && !error.failedPlayerUid) {
    error.failedPlayerUid = player.uid;
    error.failedAssetType = assetType;
  }
  return error;
}

function shouldKeepFailedPairPlayer(player, failedPlayerUid) {
  return player?.uid && player.uid !== failedPlayerUid && !isBotUid(player.uid);
}

async function handlePairCreateFailure({ error, queue, pair, mode, user, waitingMs, cancelWaitSeconds, queueKey }) {
  const failedPlayerUid = error.failedPlayerUid || "";

  if (!failedPlayerUid) {
    requeueHumanPlayers(queue, pair, mode);
    await writeJson(queueKey, queue, 3600);
    throw error;
  }

  const keepPlayers = pair.filter((player) => shouldKeepFailedPairPlayer(player, failedPlayerUid));
  requeueHumanPlayers(queue, keepPlayers, mode);
  await writeJson(queueKey, queue, 3600);

  if (failedPlayerUid === user.uid) {
    throw error;
  }

  observeMatchStage("match_pair_skipped_unqualified", {
    uid: user.uid,
    failedUid: failedPlayerUid,
    mode,
    message: error.message || "对手暂不满足入场条件",
    queueLength: queue.length
  });

  return getQueueingResponse({
    mode,
    queueLength: queue.length,
    waitingMs,
    cancelWaitSeconds
  });
}

async function getPersistedRoomDetail(roomNo) {
  return (
    (await readJson(`${REDIS_REALTIME_ROOM_PREFIX}${roomNo}`)) ||
    (await readJson(`${REDIS_ROOM_PREFIX}${roomNo}`)) ||
    null
  );
}

async function createRoomInStore(playerA, playerB, mode = "quick_battle") {
  const startedAt = Date.now();
  const battleMode = normalizeBattleMode(mode);
  const config = await readGameConfig();
  const timing = getTimingConfig(config);
  const modeConfig = config[BATTLE_MODES[battleMode].configKey] || {};

  if (modeConfig.enabled === false) {
    throw new Error(`${BATTLE_MODES[battleMode].name}暂未开放`);
  }
  if (!isBotUid(playerA.uid)) {
    await assertInviteBindingAccess(playerA, battleMode, config);
  }
  if (!isBotUid(playerB.uid)) {
    await assertInviteBindingAccess(playerB, battleMode, config);
  }
  isAssetGatewayModeAllowed(battleMode, playerA, config);
  isAssetGatewayModeAllowed(battleMode, playerB, config);

  if (!playerA?.uid || !playerB?.uid || playerA.uid === playerB.uid) {
    throw new Error("匹配队列异常，请重新匹配");
  }

  if (battleMode !== "quick_battle" && (isBotUid(playerA.uid) || isBotUid(playerB.uid))) {
    throw new Error(`${BATTLE_MODES[battleMode].name}只允许真人匹配，不能创建机器人房间`);
  }

  const room = createRoom(playerA, playerB, battleMode, timing);

  const assetType = getModeAssetType(battleMode, modeConfig);
  const entryFee = normalizeEntryAmount(assetType, modeConfig.entryFee || 0);
  const platformFeeRate = Number(modeConfig.platformFeeRate || 0);
  const rewardRate = Number(modeConfig.rewardRate ?? 1 - platformFeeRate);
  const isBotRoom = room.players.some((player) => isBotUid(player.uid));
  const remoteFreezes = [];

  if (entryFee > 0 && isBotRoom) {
    throw new Error(`${BATTLE_MODES[battleMode].name}只允许真人匹配，不能创建机器人房间`);
  }

  const rewardAmount =
    entryFee > 0 && (!isBotRoom || modeConfig.botRewardsEnabled) ? getRewardAmount(entryFee, rewardRate, assetType) : 0;

  await persistRoomBindings(room);

  try {
    if (entryFee > 0 && isRemoteAssetType(assetType)) {
      const payers = sortPlayersByUid(room.players.filter((player) => !isBotUid(player.uid)));

      for (const player of payers) {
        const idempotencyKey = `${room.roomNo}:${player.uid}:freeze`;
        try {
          await assetGateway.freeze({
            assetType,
            user: player,
            roomNo: room.roomNo,
            amount: entryFee,
            idempotencyKey,
            remark: `Pi闪电战${BATTLE_MODES[battleMode].name}入场费冻结`
          });
        } catch (error) {
          throw attachFailedPlayer(error, player, assetType);
        }
        remoteFreezes.push({ player, idempotencyKey });
      }
    }

    await transaction(async (connection) => {
      if (entryFee > 0 && assetType === "PI") {
        const payers = room.players.filter((player) => !isBotUid(player.uid));

        for (const player of payers) {
          try {
            await lockBalance(
              player.uid,
              entryFee,
              {
                type: "battle_entry_lock",
                relatedType: "battle_room_entry_lock",
                relatedId: `${room.roomNo}:${player.uid}`,
                remark: `Pi闪电战${BATTLE_MODES[battleMode].name}入场费冻结`
              },
              connection
            );
          } catch (error) {
            throw attachFailedPlayer(error, player, assetType);
          }
        }
      }

      await createBattleRoomRecord(
        room,
        {
          entryFee,
          platformFeeRate,
          rewardAmount,
          assetType,
          platformFeeAmount: getPlatformFeeAmount(entryFee, platformFeeRate, assetType, rewardAmount)
        },
        connection
      );
    }, { label: "match.create_room" });
  } catch (error) {
    for (const freeze of remoteFreezes.reverse()) {
      try {
        await assetGateway.release({
          assetType,
          user: freeze.player,
          roomNo: room.roomNo,
          amount: entryFee,
          idempotencyKey: `${room.roomNo}:${freeze.player.uid}:release:create_failed`,
          remark: "Pi闪电战房间创建失败，释放入场费"
        });
      } catch (releaseError) {
        console.error("[asset-gateway] release after create failed:", releaseError.message);
      }
    }
    await clearRoomBindingForUser(playerA.uid, room.roomNo);
    await clearOnlyUserRoomBinding(playerB.uid);
    throw error;
  }

  observeMatchStage("match_room_created", {
    roomNo: room.roomNo,
    uid: playerA.uid,
    mode: battleMode,
    status: room.status,
    result: isBotRoom ? "bot" : "human",
    costMs: Date.now() - startedAt
  });
  return room;
}

async function clearOnlyUserRoomBinding(uid) {
  matchState.userRoomMap.delete(uid);
  await redisDel(`${REDIS_USER_ROOM_PREFIX}${uid}`);
}

async function clearRoomBindingForUser(uid, roomNo = "") {
  matchState.userRoomMap.delete(uid);
  await redisDel(`${REDIS_USER_ROOM_PREFIX}${uid}`);

  if (roomNo) {
    const room =
      (await readJson(`${REDIS_REALTIME_ROOM_PREFIX}${roomNo}`)) ||
      (await readJson(`${REDIS_ROOM_PREFIX}${roomNo}`)) ||
      matchState.rooms.get(roomNo);

    if (room?.players) {
      for (const player of room.players) {
        matchState.userRoomMap.delete(player.uid);
        await redisDel(`${REDIS_USER_ROOM_PREFIX}${player.uid}`);
      }
    }

    matchState.rooms.delete(roomNo);
    await redisDel(`${REDIS_ROOM_PREFIX}${roomNo}`);
    await redisDel(`${REDIS_REALTIME_ROOM_PREFIX}${roomNo}`);
  }
}

function isRoomExpired(room) {
  if (!room || room.status === "finished") return true;
  if (!room.endsAt) return false;
  return Date.now() >= Number(room.endsAt);
}

function isWaitingReadyTimedOut(room) {
  return room?.status === "waiting_ready" && Number(room.waitingReadyEndsAt || 0) > 0 && Date.now() >= Number(room.waitingReadyEndsAt);
}

async function expireTimedOutWaitingReadyRoom(room, uid, roomNo) {
  if (!isWaitingReadyTimedOut(room)) return false;

  if (isPaidMode(room.mode)) {
    room.status = "finished";
    room.winnerUid = "";
    room.finishReason = "ready_timeout";
    room.endsAt = Date.now();
    await settleFinishedRoom(room);
  } else {
    await updateBattleRoomStatus(room.roomNo || roomNo, "expired");
  }

  await clearRoomBindingForUser(uid, roomNo);
  return true;
}

async function resolveActiveRoomForMode(user, roomNo, requestedMode) {
  if (!roomNo) return null;

  const existedRoom = await getPersistedRoomDetail(roomNo);

  if (await expireTimedOutWaitingReadyRoom(existedRoom, user.uid, roomNo)) {
    return null;
  }

  if (!existedRoom || isRoomExpired(existedRoom)) {
    await clearRoomBindingForUser(user.uid, roomNo);
    return null;
  }

  if (!isUserInRoom(existedRoom, user.uid)) {
    await clearOnlyUserRoomBinding(user.uid);
    return null;
  }

  if (existedRoom.mode && existedRoom.mode !== requestedMode) {
    const isFreeBotRoom =
      existedRoom.mode === "quick_battle" &&
      existedRoom.players?.some((player) => isBotUid(player.uid));

    if (isFreeBotRoom) {
      await clearRoomBindingForUser(user.uid, roomNo);
      return null;
    }

    throw new Error(`你已有未完成的${BATTLE_MODES[existedRoom.mode]?.name || "对局"}，请先完成后再进入其他模式`);
  }

  return roomNo;
}

async function resolveActiveRoomForStatus(user, roomNo) {
  if (!roomNo) return null;

  const existedRoom = await getPersistedRoomDetail(roomNo);

  if (await expireTimedOutWaitingReadyRoom(existedRoom, user.uid, roomNo)) {
    return null;
  }

  if (!existedRoom || isRoomExpired(existedRoom)) {
    await clearRoomBindingForUser(user.uid, roomNo);
    return null;
  }

  if (!isUserInRoom(existedRoom, user.uid)) {
    await clearOnlyUserRoomBinding(user.uid);
    return null;
  }

  return roomNo;
}

function sanitizeQueue(queue, mode) {
  const seen = new Set();

  return (Array.isArray(queue) ? queue : [])
    .filter((item) => {
      if (!item?.uid || seen.has(item.uid)) return false;
      if (item.mode && normalizeBattleMode(item.mode) !== mode) return false;
      if (mode !== "quick_battle" && isBotUid(item.uid)) return false;
      seen.add(item.uid);
      return true;
    })
    .map((item) => ({
      ...item,
      mode,
      queuedAt: Number(item.queuedAt || Date.now())
    }));
}

function requeueHumanPlayers(queue, players, mode) {
  const seen = new Set(queue.map((item) => item.uid));
  const now = Date.now();

  for (const player of players || []) {
    if (!player?.uid || isBotUid(player.uid) || seen.has(player.uid)) continue;
    queue.push({
      ...player,
      mode,
      queuedAt: Number(player.queuedAt || now)
    });
    seen.add(player.uid);
  }
}

async function hydrateSettlementPlayers(room) {
  const players = Array.isArray(room?.players) ? room.players : [];
  if (!players.length) return room;

  const hydratedPlayers = await Promise.all(
    players.map(async (player) => {
      if (!player?.uid || isBotUid(player.uid) || player.piUserId || player.pi_user_id) {
        return player;
      }

      const user = await findUserByUid(player.uid);
      if (!user) return player;

      return {
        ...player,
        piUserId: user.pi_user_id || player.piUserId || "",
        pi_user_id: user.pi_user_id || player.pi_user_id || "",
        piUsername: user.pi_username || player.piUsername || "",
        pi_username: user.pi_username || player.pi_username || "",
        nickname: player.nickname || user.nickname || ""
      };
    })
  );

  return {
    ...room,
    players: hydratedPlayers
  };
}

async function settleFinishedRoom(room) {
  if (!room || room.status !== "finished") {
    return null;
  }

  room = await hydrateSettlementPlayers(room);

  const winner = room.players.find((player) => player.uid === room.winnerUid);
  const loser = room.players.find((player) => player.uid !== room.winnerUid);

  if (room.winnerUid && (!winner || !loser)) {
    return null;
  }

  return transaction(async (connection) => {
    const battle = await findBattleRoomForUpdate(room.roomNo, connection);

    if (!battle || battle.status === "finished") {
      return battle;
    }

    if (!room.winnerUid) {
      const entryFee = Number(battle.entry_fee || 0);
      const assetType = String(battle.asset_type || getModeAssetType(battle.mode || room.mode)).toUpperCase();

      if (entryFee > 0) {
        const payers = sortPlayersByUid(room.players.filter((player) => !isBotUid(player.uid)));

        for (const player of payers) {
          if (isRemoteAssetType(assetType)) {
            await assetGateway.release({
              assetType,
              user: player,
              roomNo: room.roomNo,
              amount: entryFee,
              idempotencyKey: `${room.roomNo}:${player.uid}:release:draw`,
              remark: "Pi闪电战对局未分胜负，退回入场费"
            });
          } else {
            await unlockBalance(
              player.uid,
              entryFee,
              {
                type: "battle_entry_unlock",
                relatedType: "battle_draw_unlock",
                relatedId: `${room.roomNo}:${player.uid}`,
                remark: "Pi闪电战对局未分胜负，退回入场费"
              },
              connection
            );
          }
        }
      }

      await updateBattleAssetStatus(room.roomNo, entryFee > 0 ? "released" : "", "", connection);
      await finishBattleRoomRecord(room, connection);
      return {
        ...battle,
        status: "finished",
        winner_uid: "",
        loser_uid: "",
        finished_at: new Date()
      };
    }

    const hasBot = room.players.some((player) => isBotUid(player.uid));
    const isBotWinner = isBotUid(winner.uid);
    const rewardAmount = hasBot || isBotWinner ? 0 : Number(battle.reward_amount || 0);
    const entryFee = Number(battle.entry_fee || 0);
    const assetType = String(battle.asset_type || getModeAssetType(battle.mode || room.mode)).toUpperCase();

    if (entryFee > 0 && !hasBot && isRemoteAssetType(assetType)) {
      await assetGateway.settle({
        assetType,
        roomNo: room.roomNo,
        winner,
        loser,
        entryAmount: entryFee,
        rewardAmount,
        platformFeeAmount: Number(battle.platform_fee_amount || getPlatformFeeAmount(entryFee, battle.platform_fee_rate, assetType)),
        idempotencyKey: `${room.roomNo}:settle`,
        remark: "Pi闪电战付费对战结算"
      });
      await updateBattleAssetStatus(room.roomNo, "settled", "", connection);
    }

    if (entryFee > 0 && !hasBot && assetType === "PI") {
      const payers = sortPlayersByUid(room.players.filter((player) => !isBotUid(player.uid)));

      for (const player of payers) {
        await consumeLockedBalance(
          player.uid,
          entryFee,
          {
            type: "battle_entry",
            relatedType: "battle_room_entry_consume",
            relatedId: `${room.roomNo}:${player.uid}`,
            remark: "Pi闪电战付费对战入场费结算"
          },
          connection
        );
      }
      await updateBattleAssetStatus(room.roomNo, "settled", "", connection);
    }

    if (rewardAmount > 0 && assetType === "PI") {
      await increaseBalance(
        winner.uid,
        rewardAmount,
        {
          type: "reward",
          relatedType: "battle_reward",
          relatedId: room.roomNo,
          remark: "Pi闪电战胜利奖励"
        },
        connection
      );
    }

    if (!hasBot && assetType === "PI") {
      await settleBattleInviteCommission(room, battle, connection);
    }

    if (!hasBot) {
      await settleRankMatch(
        {
          roomNo: room.roomNo,
          winnerUid: winner.uid,
          loserUid: loser.uid,
          mode: battle.mode || room.mode,
          entryFee: Number(battle.entry_fee || 0),
          rewardAmount
        },
        connection
      );
    }

    await finishBattleRoomRecord(room, connection);
    return {
      ...battle,
      status: "finished",
      winner_uid: winner.uid,
      loser_uid: loser.uid,
      finished_at: new Date()
    };
  }, { label: "match.settle_finished_room" });
}

async function joinQueue(user, options = {}) {
  const mode = normalizeBattleMode(options.mode || "quick_battle");

  return withMatchLock(mode, async () => joinQueueWithLock(user, mode));
}

async function joinQueueWithLock(user, mode) {
  const requestStartedAt = Date.now();
  const config = await readGameConfig();
  const timing = getTimingConfig(config);
  assertModeRankAccess(user, mode, config);
  await assertInviteBindingAccess(user, mode, config);
  isAssetGatewayModeAllowed(mode, user, config);
  await assertUserEntryAssetAccess(user, mode, config);
  const cancelWaitSeconds = Number(timing.matchCancelWaitSeconds || 0);

  const cooldownKey = `${REDIS_CANCEL_COOLDOWN_PREFIX}${user.uid}`;
  const cooldown = await redisGet(cooldownKey);

  if (cooldown) {
    throw new Error(`刚刚取消过匹配，请 ${cooldown} 秒后再试`);
  }

  const redisRoomNo = await redisGet(`${REDIS_USER_ROOM_PREFIX}${user.uid}`);

  if (redisRoomNo) {
    const activeRoomNo = await resolveActiveRoomForMode(user, redisRoomNo, mode);
    if (activeRoomNo) {
      observeMatchStage("match_reuse_room", {
        roomNo: activeRoomNo,
        uid: user.uid,
        mode,
        costMs: Date.now() - requestStartedAt
      });
      return createMatchedResponse(user, activeRoomNo);
    }
  }

  const existedRoomNo = matchState.userRoomMap.get(user.uid);

  if (existedRoomNo) {
    const activeRoomNo = await resolveActiveRoomForMode(user, existedRoomNo, mode);
    if (activeRoomNo) {
      observeMatchStage("match_reuse_room", {
        roomNo: activeRoomNo,
        uid: user.uid,
        mode,
        costMs: Date.now() - requestStartedAt
      });
      return createMatchedResponse(user, activeRoomNo);
    }
  }

  const queueKey = getQueueKey(mode);
  const rawRedisQueue = (await readJson(queueKey)) || [];
  const redisQueue = sanitizeQueue(rawRedisQueue, mode);
  const redisQueueItem = redisQueue.find((item) => item.uid === user.uid);
  const maxQueueLength = Number(config.capacity?.maxQueueLengthPerMode || 0);

  if (!redisQueueItem && maxQueueLength > 0 && redisQueue.length >= maxQueueLength) {
    return getQueueingResponse({
      mode,
      queueLength: redisQueue.length,
      waitingMs: 0,
      cancelWaitSeconds,
      capacityLimited: true
    });
  }

  if (redisQueueItem) {
    redisQueueItem.queuedAt = Date.now();
  } else {
    redisQueue.push({
      ...user,
      mode,
      queuedAt: Date.now()
    });
  }
  observeMatchStage("match_queue_join", {
    uid: user.uid,
    mode,
    queueLength: redisQueue.length,
    costMs: Date.now() - requestStartedAt
  });

  if (redisQueue.length >= 2) {
    const waitingPlayer = redisQueue.find((item) => item.uid === user.uid) || redisQueue[0];
    const waitingMs = waitingPlayer?.queuedAt ? Date.now() - waitingPlayer.queuedAt : 0;

    if (await isRoomCapacityFull(config)) {
      await writeJson(queueKey, redisQueue, 3600);
      return getQueueingResponse({
        mode,
        queueLength: redisQueue.length,
        waitingMs,
        cancelWaitSeconds,
        capacityLimited: true
      });
    }

    const pair = takePairForUser(redisQueue, user.uid);

    if (!pair) {
      await writeJson(queueKey, redisQueue, 3600);
      return getQueueingResponse({
        mode,
        queueLength: redisQueue.length,
        waitingMs,
        cancelWaitSeconds
      });
    }

    const [playerA, playerB] = pair;
    await writeJson(queueKey, redisQueue, 3600);
    let room;

    try {
      room = await createRoomInStore(playerA, playerB, mode);
    } catch (error) {
      return handlePairCreateFailure({
        error,
        queue: redisQueue,
        pair: [playerA, playerB],
        mode,
        user,
        waitingMs,
        cancelWaitSeconds,
        queueKey
      });
    }

    return createMatchedResponse(user, room.roomNo, { room });
  }

  await writeJson(queueKey, redisQueue, 3600);

  const waitingPlayer = redisQueue[0];
  const waitingMs = waitingPlayer?.queuedAt ? Date.now() - waitingPlayer.queuedAt : 0;
  const modeConfig = config[BATTLE_MODES[mode].configKey] || {};
  const botEnabled = modeConfig.botMatchEnabled !== false;
  const fallbackBotAfterMs = mode === "quick_battle" ? Number(timing.quickBotFallbackSeconds || 0) * 1000 : 0;

  if (botEnabled && fallbackBotAfterMs > 0 && waitingPlayer?.uid === user.uid && waitingMs >= fallbackBotAfterMs) {
    if (await isRoomCapacityFull(config)) {
      return getQueueingResponse({
        mode,
        queueLength: redisQueue.length,
        waitingMs,
        cancelWaitSeconds,
        capacityLimited: true
      });
    }

    redisQueue.shift();
    await writeJson(queueKey, redisQueue, 3600);
    let room;

    try {
      room = await createRoomInStore(user, createBotPlayer(), mode);
    } catch (error) {
      requeueHumanPlayers(redisQueue, [user], mode);
      await writeJson(queueKey, redisQueue, 3600);
      throw error;
    }

    return createMatchedResponse(user, room.roomNo, { room });
  }

  return getQueueingResponse({
    mode,
    queueLength: redisQueue.length,
    waitingMs,
    cancelWaitSeconds
  });
}

async function cancelQueue(user) {
  const config = await readGameConfig();
  const timing = getTimingConfig(config);
  const cancelWaitSeconds = Number(timing.matchCancelWaitSeconds || 0);
  const cancelCooldownSeconds = Number(timing.matchCancelCooldownSeconds || 0);
  const redisRoomNo = await redisGet(`${REDIS_USER_ROOM_PREFIX}${user.uid}`);
  const memoryRoomNo = matchState.userRoomMap.get(user.uid);

  if (redisRoomNo) {
    const activeRoomNo = await resolveActiveRoomForStatus(user, redisRoomNo);
    if (activeRoomNo) {
      throw new Error("已匹配成功，不能取消本局");
    }
  }

  if (memoryRoomNo) {
    const activeRoomNo = await resolveActiveRoomForStatus(user, memoryRoomNo);
    if (activeRoomNo) {
      throw new Error("已匹配成功，不能取消本局");
    }
  }

  if (await redisGet(`${REDIS_USER_ROOM_PREFIX}${user.uid}`)) {
    throw new Error("已匹配成功，不能取消本局");
  }

  let removed = false;
  let maxWaitingMs = 0;
  const modeKeys = Object.keys(BATTLE_MODES);

  for (const mode of modeKeys) {
    const queueKey = getQueueKey(mode);
    const rawQueue = (await readJson(queueKey)) || [];
    const queue = sanitizeQueue(rawQueue, mode);
    const queueItem = queue.find((item) => item.uid === user.uid);

    if (queueItem?.queuedAt) {
      maxWaitingMs = Math.max(maxWaitingMs, Date.now() - queueItem.queuedAt);
    }

    const nextQueue = queue.filter((item) => item.uid !== user.uid);

    if (nextQueue.length !== queue.length) {
      removed = true;
      if (maxWaitingMs < cancelWaitSeconds * 1000) {
        const waitSeconds = Math.max(1, cancelWaitSeconds - Math.floor(maxWaitingMs / 1000));
        throw new Error(`匹配开始 ${cancelWaitSeconds} 秒后才能取消，请再等 ${waitSeconds} 秒`);
      }

      await writeJson(queueKey, nextQueue, 3600);
    } else if (nextQueue.length !== rawQueue.length) {
      await writeJson(queueKey, nextQueue, 3600);
    }
  }

  if (cancelCooldownSeconds > 0) {
    await redisSet(
      `${REDIS_CANCEL_COOLDOWN_PREFIX}${user.uid}`,
      String(cancelCooldownSeconds),
      cancelCooldownSeconds
    );
  }

  observeMatchStage("match_cancel", {
    uid: user.uid,
    result: removed ? "removed" : "not_found",
    waitingSeconds: Math.floor(maxWaitingMs / 1000)
  });

  return {
    cancelled: removed,
    cooldownSeconds: cancelCooldownSeconds,
    canCancel: true
  };
}

async function getMatchStatus(user) {
  return getMatchStatusWithoutLock(user);
}

async function getMatchStatusWithoutLock(user) {
  const redisRoomNo = await redisGet(`${REDIS_USER_ROOM_PREFIX}${user.uid}`);

  if (redisRoomNo) {
    const roomNo = await resolveActiveRoomForStatus(user, redisRoomNo);
    if (roomNo) {
      return createMatchedResponse(user, roomNo);
    }
  }

  const roomNo = matchState.userRoomMap.get(user.uid);

  if (roomNo && roomNo !== redisRoomNo) {
    const activeRoomNo = await resolveActiveRoomForStatus(user, roomNo);
    if (activeRoomNo) {
      return createMatchedResponse(user, activeRoomNo);
    }
  }

  const modeKeys = Object.keys(BATTLE_MODES);
  const queueEntries = [];

  for (const mode of modeKeys) {
    const rawQueue = (await readJson(getQueueKey(mode))) || [];
    const queue = sanitizeQueue(rawQueue, mode);
    if (queue.length !== rawQueue.length) {
      await writeJson(getQueueKey(mode), queue, 3600);
    }
    const item = queue.find((entry) => entry.uid === user.uid);
    if (item) {
      queueEntries.push({ mode, queue, item });
    }
  }

  const activeQueue = queueEntries[0];
  const redisQueue = activeQueue?.queue || [];
  const inRedisQueue = redisQueue.some((item) => item.uid === user.uid);

  if (inRedisQueue) {
    const mode = activeQueue.mode;
    const queueItem = activeQueue.item;
    const waitingMs = queueItem?.queuedAt ? Date.now() - queueItem.queuedAt : 0;
    const config = await readGameConfig();
    const timing = getTimingConfig(config);
    const cancelWaitSeconds = Number(timing.matchCancelWaitSeconds || 0);
    const modeConfig = config[BATTLE_MODES[mode].configKey] || {};
    const botEnabled = modeConfig.botMatchEnabled !== false;
    const fallbackBotAfterMs = mode === "quick_battle" ? Number(timing.quickBotFallbackSeconds || 0) * 1000 : 0;

    if (redisQueue.length >= 2 && !isPaidMode(mode)) {
      const lockedResult = await tryWithMatchLock(mode, async () => {
        const latestQueue = sanitizeQueue((await readJson(getQueueKey(mode))) || [], mode);
        const latestItem = latestQueue.find((item) => item.uid === user.uid);
        const latestWaitingMs = latestItem?.queuedAt ? Date.now() - latestItem.queuedAt : waitingMs;

        if (!latestItem) {
          return getMatchStatusWithoutLock(user);
        }

        if (latestQueue.length < 2 || (await isRoomCapacityFull(config))) {
          return getQueueingResponse({
            mode,
            queueLength: latestQueue.length,
            waitingMs: latestWaitingMs,
            cancelWaitSeconds,
            capacityLimited: latestQueue.length >= 2
          });
        }

        const pair = takePairForUser(latestQueue, user.uid);
        if (!pair) {
          await writeJson(getQueueKey(mode), latestQueue, 3600);
          return getQueueingResponse({
            mode,
            queueLength: latestQueue.length,
            waitingMs: latestWaitingMs,
            cancelWaitSeconds
          });
        }

        const [playerA, playerB] = pair;
        await writeJson(getQueueKey(mode), latestQueue, 3600);
        let room;

        try {
          room = await createRoomInStore(playerA, playerB, mode);
        } catch (error) {
          return handlePairCreateFailure({
            error,
            queue: latestQueue,
            pair: [playerA, playerB],
            mode,
            user,
            waitingMs: latestWaitingMs,
            cancelWaitSeconds,
            queueKey: getQueueKey(mode)
          });
        }
        observeMatchStage("match_status_room_created", {
          roomNo: room.roomNo,
          uid: user.uid,
          mode,
          result: "human",
          queueLength: latestQueue.length
        });

        return createMatchedResponse(user, room.roomNo);
      });

      if (lockedResult) {
        return lockedResult;
      }
    }

    if (botEnabled && fallbackBotAfterMs > 0 && waitingMs >= fallbackBotAfterMs) {
      const lockedResult = await tryWithMatchLock(mode, async () => {
        const latestQueue = sanitizeQueue((await readJson(getQueueKey(mode))) || [], mode);
        const latestItem = latestQueue.find((item) => item.uid === user.uid);
        const latestWaitingMs = latestItem?.queuedAt ? Date.now() - latestItem.queuedAt : 0;

        if (!latestItem) {
          return getMatchStatusWithoutLock(user);
        }

        if (latestWaitingMs < fallbackBotAfterMs) {
          return getQueueingResponse({
            mode,
            queueLength: latestQueue.length,
            waitingMs: latestWaitingMs,
            cancelWaitSeconds
          });
        }

        if (await isRoomCapacityFull(config)) {
          return getQueueingResponse({
            mode,
            queueLength: latestQueue.length,
            waitingMs: latestWaitingMs,
            cancelWaitSeconds,
            capacityLimited: true
          });
        }

        const nextQueue = latestQueue.filter((item) => item.uid !== user.uid);
        await writeJson(getQueueKey(mode), nextQueue, 3600);
        let room;

        try {
          room = await createRoomInStore(user, createBotPlayer(), mode);
        } catch (error) {
          requeueHumanPlayers(nextQueue, [user], mode);
          await writeJson(getQueueKey(mode), nextQueue, 3600);
          throw error;
        }
        observeMatchStage("match_bot_room_created", {
          roomNo: room.roomNo,
          uid: user.uid,
          mode,
          result: "bot",
          waitingSeconds: Math.floor(latestWaitingMs / 1000)
        });

        return createMatchedResponse(user, room.roomNo);
      });

      if (lockedResult) {
        return lockedResult;
      }
    }

    return getQueueingResponse({
      mode,
      queueLength: redisQueue.length,
      waitingMs,
      cancelWaitSeconds
    });
  }

  return {
    status: "idle"
  };
}

async function getRoomDetail(roomNo) {
  return (
    (await readJson(`${REDIS_REALTIME_ROOM_PREFIX}${roomNo}`)) ||
    (await readJson(`${REDIS_ROOM_PREFIX}${roomNo}`)) ||
    matchState.rooms.get(roomNo) ||
    null
  );
}

async function getRoomForUser(roomNo, uid) {
  const room = await getRoomDetail(roomNo);

  if (!room) {
    return null;
  }

  if (!room.players.some((player) => player.uid === uid)) {
    throw new Error("无权查看该房间");
  }

  return room;
}

async function applyBattleAction(roomNo, uid, action) {
  const room = (await getRoomDetail(roomNo)) || matchState.rooms.get(roomNo);

  if (!room) {
    return null;
  }

  const self = room.players.find((player) => player.uid === uid);
  const opponent = room.players.find((player) => player.uid !== uid);

  if (!self || !opponent) {
    return room;
  }

  const attackScore = action?.comboLevel ? Number(action.comboLevel) : 1;

  self.board.score += attackScore * 12;
  self.board.combo = attackScore;
  opponent.board.pressure += attackScore;
  self.board.remainSeconds = Math.max(0, self.board.remainSeconds - 3);
  opponent.board.remainSeconds = Math.max(0, opponent.board.remainSeconds - 3);

  room.battleLog.push({
    uid,
    action: action?.type || "attack",
    comboLevel: attackScore,
    at: new Date().toISOString()
  });

  if (opponent.board.pressure >= 10) {
    room.status = "finished";
    room.winnerUid = self.uid;
  } else if (self.board.remainSeconds === 0 || opponent.board.remainSeconds === 0) {
    room.status = "finished";
    room.winnerUid = self.board.score >= opponent.board.score ? self.uid : opponent.uid;
  }

  matchState.rooms.set(roomNo, room);
  await writeJson(`${REDIS_ROOM_PREFIX}${roomNo}`, room, 7200);

  if (room.status === "finished") {
    await settleFinishedRoom(room);
  }

  return room;
}

async function getBattleResult(roomNo, uid) {
  const room = await getRoomForUser(roomNo, uid);

  if (!room) {
    return null;
  }

  if (room.status !== "finished") {
    return {
      finished: false,
      room
    };
  }

  const winner = room.players.find((player) => player.uid === room.winnerUid);
  const loser = room.players.find((player) => player.uid !== room.winnerUid);

  return {
    finished: true,
    roomNo: room.roomNo,
    winner,
    loser
  };
}

async function getRoomsSnapshot() {
  return Array.from(matchState.rooms.values()).map((room) => ({
    roomNo: room.roomNo,
    status: room.status,
    players: room.players.map((player) => player.nickname),
    winnerUid: room.winnerUid
  }));
}

module.exports = {
  joinQueue,
  cancelQueue,
  getMatchStatus,
  getRoomDetail,
  getRoomForUser,
  applyBattleAction,
  getBattleResult,
  getRoomsSnapshot,
  settleFinishedRoom,
  expireStaleFreeBotRooms
};
