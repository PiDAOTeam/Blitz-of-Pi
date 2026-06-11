const { WebSocketServer } = require("ws");
const {
  API_INTERNAL_BASE_URL,
  REALTIME_INSTANCE_ID,
  REALTIME_SETTLEMENT_SECRET,
  SETTLEMENT_HTTP_TIMEOUT_MS
} = require("./config");
const { redisGet, redisGetJson, redisSetJson, redisDel } = require("./redis");
const {
  createRealtimeRoom,
  markPlayerJoined,
  markPlayerReady,
  markPlayerDisconnected,
  applySwap,
  applyBotMove,
  tickRoom,
  toPublicRoom
} = require("./game-engine");
const { observeBattleStage } = require("./battle-observer");

const REDIS_ROOM_PREFIX = "blitz:room:";
const REDIS_REALTIME_ROOM_PREFIX = "blitz:realtime-room:";
const REDIS_USER_ROOM_PREFIX = "blitz:user-room:";
const REDIS_ROOM_JOIN_TOKEN_PREFIX = "blitz:room-join-token:";
const REDIS_REALTIME_CONFIG_KEY = "blitz:realtime:config";
const REDIS_REALTIME_STATS_PREFIX = "blitz:realtime:stats:";
const FINISHED_ROOM_GRACE_SECONDS = 600;

const rooms = new Map();
const roomClients = new Map();
const matchWatchers = new Map();
const settledRooms = new Set();
const swapBuckets = new Map();
const botMoveAt = new Map();
const settlementQueue = [];
const settlementQueuedRooms = new Set();

const SWAP_MIN_INTERVAL_MS = 240;
const SWAP_MAX_PER_WINDOW = 28;
const SWAP_WINDOW_MS = 10_000;
const ROOM_TICK_MS = 1000;
const MATCH_WATCH_TICK_MS = Number(process.env.MATCH_WATCH_TICK_MS || 600);
const MATCH_WATCH_MAX_FAILED_COUNT = Number(process.env.MATCH_WATCH_MAX_FAILED_COUNT || 8);
const ROOM_TICK_BATCH_SIZE = Number(process.env.ROOM_TICK_BATCH_SIZE || 80);
const ROOM_TICK_WARN_MS = Number(process.env.ROOM_TICK_WARN_MS || 700);
const BROADCAST_WARN_MS = Number(process.env.BROADCAST_WARN_MS || 120);
const AUTH_VERIFY_TIMEOUT_MS = 3500;
const SETTLEMENT_CONCURRENCY = Number(process.env.SETTLEMENT_CONCURRENCY || 2);
const SETTLEMENT_RETRY_BASE_MS = 800;
const DEFAULT_REALTIME_LIMITS = {
  maxConnectionsPerInstance: 1200,
  maxConnectionsPerUser: 2,
  heartbeatSeconds: 25,
  idleTimeoutSeconds: 90,
  maxPayloadBytes: 2048
};
const DEFAULT_EXTREME_REALTIME = {
  enabled: false,
  rollbackToLegacy: false,
  enabledModes: ["quick_battle", "points_battle", "poc_battle", "pi_battle"],
  grayPercent: 0,
  grayUserPiUids: [],
  grayUserPiUsernames: [],
  maxPendingSwaps: 3,
  snapshotIntervalMs: 2000,
  swapMinIntervalMs: 120,
  metricsSampleRate: 0.05
};
let realtimeLimits = { ...DEFAULT_REALTIME_LIMITS };
let extremeRealtime = { ...DEFAULT_EXTREME_REALTIME };
let activeSettlements = 0;
let roomTickRunning = false;
let lastRoomTickWarnAt = 0;
let lastHeartbeatAt = 0;
let lastRoomTickCostMs = 0;
let lastBroadcastCostMs = 0;
let tickSlowCount = 0;
let broadcastSlowCount = 0;

function observeRealtimeStage(stage, detail = {}) {
  observeBattleStage(stage, detail).catch((error) => {
    console.error("[realtime:observer] write failed:", error.message);
  });
}

function getBotMoveIntervalMs(room) {
  const seconds = Number(room?.timing?.botMoveIntervalSeconds || 2.6);
  return Math.max(1000, Math.min(10000, Math.round(seconds * 1000)));
}

function send(socket, payload) {
  if (socket.readyState === 1) {
    socket.send(JSON.stringify(payload));
  }
}

function sendError(socket, message, extra = {}) {
  send(socket, {
    type: "error",
    message,
    ...extra
  });
}

function normalizeLimit(value, fallback, min, max) {
  const next = Number(value);
  return Number.isFinite(next) && next >= min && next <= max ? Math.round(next) : fallback;
}

function normalizeRate(value, fallback, min = 0, max = 1) {
  const next = Number(value);
  return Number.isFinite(next) && next >= min && next <= max ? next : fallback;
}

function normalizeRealtimeLimits(config = {}) {
  return {
    maxConnectionsPerInstance: normalizeLimit(
      config.maxConnectionsPerInstance,
      DEFAULT_REALTIME_LIMITS.maxConnectionsPerInstance,
      100,
      20000
    ),
    maxConnectionsPerUser: normalizeLimit(
      config.maxConnectionsPerUser,
      DEFAULT_REALTIME_LIMITS.maxConnectionsPerUser,
      1,
      10
    ),
    heartbeatSeconds: normalizeLimit(config.heartbeatSeconds, DEFAULT_REALTIME_LIMITS.heartbeatSeconds, 10, 60),
    idleTimeoutSeconds: normalizeLimit(
      config.idleTimeoutSeconds,
      DEFAULT_REALTIME_LIMITS.idleTimeoutSeconds,
      30,
      300
    ),
    maxPayloadBytes: normalizeLimit(config.maxPayloadBytes, DEFAULT_REALTIME_LIMITS.maxPayloadBytes, 512, 16384)
  };
}

function normalizeList(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || "").trim()).filter(Boolean).slice(0, 100);
  }
  return String(value || "")
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 100);
}

function normalizeExtremeRealtimeConfig(config = {}) {
  const source = config.extremeRealtime || config || {};
  const enabledModes = normalizeList(source.enabledModes).filter((mode) =>
    DEFAULT_EXTREME_REALTIME.enabledModes.includes(mode)
  );

  return {
    enabled: Boolean(source.enabled),
    rollbackToLegacy: Boolean(source.rollbackToLegacy),
    enabledModes: enabledModes.length ? enabledModes : DEFAULT_EXTREME_REALTIME.enabledModes,
    grayPercent: normalizeLimit(source.grayPercent, DEFAULT_EXTREME_REALTIME.grayPercent, 0, 100),
    grayUserPiUids: normalizeList(source.grayUserPiUids || source.gray_user_pi_uids),
    grayUserPiUsernames: normalizeList(source.grayUserPiUsernames || source.gray_user_pi_usernames).map((item) =>
      item.toLowerCase()
    ),
    maxPendingSwaps: normalizeLimit(source.maxPendingSwaps, DEFAULT_EXTREME_REALTIME.maxPendingSwaps, 1, 6),
    snapshotIntervalMs: normalizeLimit(
      source.snapshotIntervalMs,
      DEFAULT_EXTREME_REALTIME.snapshotIntervalMs,
      500,
      10000
    ),
    swapMinIntervalMs: normalizeLimit(
      source.swapMinIntervalMs,
      DEFAULT_EXTREME_REALTIME.swapMinIntervalMs,
      60,
      500
    ),
    metricsSampleRate: normalizeRate(source.metricsSampleRate, DEFAULT_EXTREME_REALTIME.metricsSampleRate)
  };
}

async function refreshRealtimeLimits() {
  const next = await redisGetJson(REDIS_REALTIME_CONFIG_KEY);
  if (next) {
    realtimeLimits = normalizeRealtimeLimits(next);
    extremeRealtime = normalizeExtremeRealtimeConfig(next.extremeRealtime || {});
  }
}

async function publishRealtimeStats(wss) {
  const users = new Set();
  let joinedConnections = 0;

  for (const socket of wss.clients) {
    if (socket.uid) {
      joinedConnections += 1;
      users.add(socket.uid);
    }
  }

  await redisSetJson(
    `${REDIS_REALTIME_STATS_PREFIX}${REALTIME_INSTANCE_ID}`,
    {
      instanceId: REALTIME_INSTANCE_ID,
      connections: wss.clients.size,
      joinedConnections,
      uniqueUsers: users.size,
      rooms: rooms.size,
      lastRoomTickCostMs,
      lastBroadcastCostMs,
      tickSlowCount,
      broadcastSlowCount,
      updatedAt: Date.now()
    },
    30
  );
}

function countUserConnections(uid) {
  if (!uid) return 0;
  let count = 0;
  for (const clients of roomClients.values()) {
    for (const client of clients) {
      if (client.uid === uid && client.readyState === 1) {
        count += 1;
      }
    }
  }
  return count;
}

function hasJoinedClient(roomNo, uid) {
  if (!roomNo || !uid) return false;
  const clients = roomClients.get(roomNo);
  if (!clients) return false;

  for (const client of clients) {
    if (client.uid === uid && client.readyState === 1) {
      return true;
    }
  }

  return false;
}

function getClientSet(roomNo) {
  if (!roomClients.has(roomNo)) {
    roomClients.set(roomNo, new Set());
  }

  return roomClients.get(roomNo);
}

function hashToPercent(value = "") {
  let hash = 0;
  const text = String(value || "");
  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 31 + text.charCodeAt(index)) >>> 0;
  }
  return hash % 100;
}

function getRoomPlayer(room, uid) {
  return room?.players?.find((player) => player.uid === uid) || null;
}

function isExtremeRealtimeEnabled(room, uid = "") {
  if (!room || !uid || !extremeRealtime.enabled || extremeRealtime.rollbackToLegacy) return false;
  if (!extremeRealtime.enabledModes.includes(room.mode)) return false;

  const player = getRoomPlayer(room, uid);
  const username = String(player?.piUsername || player?.pi_username || "").trim().toLowerCase();
  if (extremeRealtime.grayUserPiUids.includes(uid)) return true;
  if (username && extremeRealtime.grayUserPiUsernames.includes(username)) return true;
  if (extremeRealtime.grayPercent >= 100) return true;
  if (extremeRealtime.grayPercent <= 0) return false;

  return hashToPercent(`${room.roomNo}:${uid}`) < extremeRealtime.grayPercent;
}

function getRoomDelta(room) {
  return {
    roomNo: room.roomNo,
    mode: room.mode,
    version: Number(room.version || 1),
    status: room.status,
    remainSeconds: toPublicRoom(room, "").remainSeconds,
    serverNow: Date.now(),
    winnerUid: room.winnerUid || "",
    finishReason: room.finishReason || "",
    players: (room.players || []).map((player) => ({
      uid: player.uid,
      score: Number(player.score || 0),
      pressure: Number(player.pressure || 0),
      combo: Number(player.combo || 0),
      lastGain: Number(player.lastGain || 0),
      validMoveCount: Number(player.validMoveCount || 0)
    })),
    events: Array.isArray(room.events) ? room.events.slice(0, 2) : []
  };
}

function sendRoomSnapshot(socket, room, message = "") {
  send(socket, {
    type: "room_snapshot",
    room: toPublicRoom(room, socket.uid || ""),
    version: Number(room.version || 1),
    message
  });
}

function broadcastRoomSnapshot(roomNo, message = "") {
  const room = rooms.get(roomNo);
  if (!room) return;
  for (const client of getClientSet(roomNo)) {
    sendRoomSnapshot(client, room, message);
  }
  room.lastSnapshotAt = Date.now();
}

function broadcastRoomDelta(roomNo, extra = {}) {
  const room = rooms.get(roomNo);
  if (!room) return;
  const delta = getRoomDelta(room);
  for (const client of getClientSet(roomNo)) {
    send(client, {
      type: "room_delta",
      delta,
      ...extra
    });
  }
}

function getMatchWatchKey(uid, sessionId = "") {
  return `${uid}:${sessionId || "default"}`;
}

function removeMatchWatcher(socket) {
  if (!socket.matchWatchKey) return;
  matchWatchers.delete(socket.matchWatchKey);
  socket.matchWatchKey = "";
}

async function fetchMatchStatus(token) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), AUTH_VERIFY_TIMEOUT_MS);

  try {
    const response = await fetch(`${API_INTERNAL_BASE_URL}/api/match/status`, {
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    const result = await response.json();
    if (!response.ok || result.code !== 0) {
      throw new Error(result.message || "match status failed");
    }
    return result.data;
  } finally {
    clearTimeout(timer);
  }
}

async function handleWatchMatch(socket, payload) {
  const uid = String(payload.uid || "");
  const token = String(payload.token || "");
  const sessionId = String(payload.sessionId || "");

  if (!uid || !token) {
    sendError(socket, "缺少匹配监听身份");
    return;
  }

  const verified = await verifySession(token, uid);
  if (!verified) {
    sendError(socket, "匹配监听身份校验失败，请重新登录");
    return;
  }

  removeMatchWatcher(socket);
  socket.uid = uid;
  socket.matchToken = token;
  socket.matchSessionId = sessionId;
  socket.matchWatchFailedCount = 0;
  socket.matchWatchKey = getMatchWatchKey(uid, sessionId);
  matchWatchers.set(socket.matchWatchKey, socket);

  send(socket, {
    type: "match_watch_ready",
    sessionId,
    message: "匹配推送已连接"
  });
  observeRealtimeStage("match_watch_join", {
    uid,
    status: "watching",
    result: sessionId
  });
}

async function processMatchWatchers() {
  if (!matchWatchers.size) return;

  const watchers = [...matchWatchers.values()];
  await Promise.allSettled(
    watchers.map(async (socket) => {
      if (socket.readyState !== 1 || !socket.matchToken || !socket.uid) {
        removeMatchWatcher(socket);
        return;
      }

      try {
        const status = await fetchMatchStatus(socket.matchToken);
        socket.matchWatchFailedCount = 0;
        send(socket, {
          type: "match_state",
          sessionId: socket.matchSessionId || "",
          status
        });

        if (status?.status === "matched" && status.roomNo) {
          removeMatchWatcher(socket);
        }
      } catch (error) {
        socket.matchWatchFailedCount = Number(socket.matchWatchFailedCount || 0) + 1;
        if (socket.matchWatchFailedCount >= MATCH_WATCH_MAX_FAILED_COUNT) {
          sendError(socket, "匹配推送暂不可用，已切换轮询兜底");
          observeRealtimeStage("match_watch_failed", {
            uid: socket.uid,
            status: "fallback",
            message: error.message,
            result: String(socket.matchWatchFailedCount)
          });
          removeMatchWatcher(socket);
        }
      }
    })
  );
}

async function saveRoom(room) {
  await redisSetJson(`${REDIS_REALTIME_ROOM_PREFIX}${room.roomNo}`, room, 7200);
}

async function loadRoom(roomNo) {
  if (rooms.has(roomNo)) {
    return rooms.get(roomNo);
  }

  const realtimeRoom = await redisGetJson(`${REDIS_REALTIME_ROOM_PREFIX}${roomNo}`);
  if (realtimeRoom) {
    rooms.set(roomNo, realtimeRoom);
    return realtimeRoom;
  }

  if (rooms.has(roomNo)) {
    return rooms.get(roomNo);
  }

  const baseRoom = await redisGetJson(`${REDIS_ROOM_PREFIX}${roomNo}`);
  if (!baseRoom) return null;

  const room = createRealtimeRoom(baseRoom);
  rooms.set(roomNo, room);
  await saveRoom(room);
  return room;
}

function broadcastRoom(roomNo, extra = {}) {
  const room = rooms.get(roomNo);
  if (!room) return;

  const startedAt = Date.now();
  const payloadCache = new Map();
  let sentCount = 0;
  for (const client of getClientSet(roomNo)) {
    const cacheKey = client.uid || "";
    let payload = payloadCache.get(cacheKey);
    if (!payload) {
      payload = {
        type: "room_state",
        room: toPublicRoom(room, cacheKey),
        ...extra
      };
      payloadCache.set(cacheKey, payload);
    }
    send(client, payload);
    sentCount += 1;
  }

  const cost = Date.now() - startedAt;
  lastBroadcastCostMs = cost;
  if (cost > BROADCAST_WARN_MS) {
    broadcastSlowCount += 1;
    observeRealtimeStage("realtime_broadcast_slow", {
      roomNo,
      mode: room.mode,
      status: room.status,
      costMs: cost,
      queueLength: sentCount,
      result: String(payloadCache.size)
    });
  }
}

async function verifySession(token, uid) {
  if (!token || !uid) {
    return false;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), AUTH_VERIFY_TIMEOUT_MS);

  try {
    const response = await fetch(`${API_INTERNAL_BASE_URL}/api/auth/profile`, {
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    const result = await response.json();

    return response.ok && result.code === 0 && result.data?.uid === uid;
  } catch (error) {
    console.error("[realtime] auth verify failed:", error.message);
    return false;
  } finally {
    clearTimeout(timer);
  }
}

function getRoomJoinTokenKey(roomNo, uid) {
  return `${REDIS_ROOM_JOIN_TOKEN_PREFIX}${roomNo}:${uid}`;
}

async function verifyRoomJoinToken(roomNo, uid, roomJoinToken) {
  if (!roomNo || !uid || !roomJoinToken) {
    return false;
  }

  const key = getRoomJoinTokenKey(roomNo, uid);
  const storedToken = await redisGet(key);

  if (storedToken && storedToken === roomJoinToken) {
    await redisDel(key);
    return true;
  }

  return false;
}

async function settleRoomIfNeeded(room) {
  if (!room || room.status !== "finished" || settledRooms.has(room.roomNo)) {
    return;
  }

  if (settlementQueuedRooms.has(room.roomNo)) {
    return;
  }

  settlementQueuedRooms.add(room.roomNo);
  settlementQueue.push({ room, attempt: 0, runAt: Date.now() });
  observeRealtimeStage("settlement_queued", {
    roomNo: room.roomNo,
    mode: room.mode,
    status: room.status,
    result: room.finishReason || "finished"
  });
  drainSettlementQueue();
}

function drainSettlementQueue() {
  while (activeSettlements < SETTLEMENT_CONCURRENCY) {
    const now = Date.now();
    const index = settlementQueue.findIndex((item) => item.runAt <= now);
    if (index < 0) break;

    const [item] = settlementQueue.splice(index, 1);
    activeSettlements += 1;
    processSettlementItem(item)
      .catch((error) => console.error("[realtime] settlement worker failed:", error.message))
      .finally(() => {
        activeSettlements -= 1;
        drainSettlementQueue();
      });
  }
}

function retrySettlement(item, message) {
  settledRooms.delete(item.room.roomNo);
  item.attempt += 1;
  const delayMs = Math.min(30_000, SETTLEMENT_RETRY_BASE_MS * 2 ** Math.min(item.attempt, 5));
  item.runAt = Date.now() + delayMs + Math.floor(Math.random() * 500);
  settlementQueue.push(item);
  observeRealtimeStage("settlement_retry", {
    roomNo: item.room.roomNo,
    mode: item.room.mode,
    status: item.room.status,
    message,
    costMs: delayMs
  });
  console.error(`[realtime] settle retry ${item.room.roomNo} #${item.attempt}: ${message}`);
  setTimeout(drainSettlementQueue, delayMs).unref?.();
}

async function processSettlementItem(item) {
  const room = item.room;

  if (!room || room.status !== "finished" || settledRooms.has(room.roomNo)) {
    settlementQueuedRooms.delete(room?.roomNo);
    return;
  }

  settledRooms.add(room.roomNo);
  const startedAt = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SETTLEMENT_HTTP_TIMEOUT_MS);

  try {
    const response = await fetch(`${API_INTERNAL_BASE_URL}/internal/realtime/settle`, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        secret: REALTIME_SETTLEMENT_SECRET,
        room
      })
    });
    const text = await response.text();
    let result = null;

    try {
      result = text ? JSON.parse(text) : null;
    } catch {
      result = null;
    }

    if (!response.ok || result?.code !== 0) {
      const message = result?.message || text.slice(0, 120) || response.statusText;
      retrySettlement(item, `${message} status=${response.status} cost=${Date.now() - startedAt}ms`);
      return;
    }

    await releaseFinishedRoom(room);
    settlementQueuedRooms.delete(room.roomNo);
    observeRealtimeStage("settlement_done", {
      roomNo: room.roomNo,
      mode: room.mode,
      status: room.status,
      result: room.finishReason || "finished",
      costMs: Date.now() - startedAt
    });
  } catch (error) {
    const reason = error?.name === "AbortError" ? `timeout ${SETTLEMENT_HTTP_TIMEOUT_MS}ms` : error.message;
    retrySettlement(
      item,
      `${reason} base=${API_INTERNAL_BASE_URL} attempt=${item.attempt} cost=${Date.now() - startedAt}ms`
    );
  } finally {
    clearTimeout(timer);
  }
}

async function releaseFinishedRoom(room) {
  if (!room?.players) return;

  room.releasedAt = Date.now();

  for (const player of room.players) {
    await redisDel(`${REDIS_USER_ROOM_PREFIX}${player.uid}`);
  }

  await redisDel(`${REDIS_ROOM_PREFIX}${room.roomNo}`);
  await redisSetJson(`${REDIS_REALTIME_ROOM_PREFIX}${room.roomNo}`, room, FINISHED_ROOM_GRACE_SECONDS);
  rooms.set(room.roomNo, room);
}

async function pruneReleasedRoom(roomNo, room) {
  if (room?.status !== "finished" || !room.releasedAt) return false;
  if (Date.now() - room.releasedAt < FINISHED_ROOM_GRACE_SECONDS * 1000) return false;

  await redisDel(`${REDIS_REALTIME_ROOM_PREFIX}${roomNo}`);
  rooms.delete(roomNo);
  roomClients.delete(roomNo);
  botMoveAt.delete(roomNo);
  return true;
}

async function handleJoin(socket, payload) {
  try {
    const roomNo = String(payload.roomNo || "");
    const uid = String(payload.uid || "");
    const token = String(payload.token || "");
    const roomJoinToken = String(payload.roomJoinToken || "");

    if (!roomNo || !uid) {
      sendError(socket, "缺少房间号或玩家信息");
      return;
    }

    if (countUserConnections(uid) >= realtimeLimits.maxConnectionsPerUser) {
      sendError(socket, "实时连接过多，请关闭重复页面后重试");
      socket.close();
      return;
    }

    if (!(await verifyRoomJoinToken(roomNo, uid, roomJoinToken)) && !(await verifySession(token, uid))) {
      sendError(socket, "实时连接身份校验失败，请重新登录");
      socket.close();
      return;
    }

    const room = await loadRoom(roomNo);
    if (!room) {
      sendError(socket, "房间不存在或已过期");
      return;
    }

    const player = room.players.find((item) => item.uid === uid);
    if (!player) {
      sendError(socket, "玩家不属于该房间");
      return;
    }

    socket.roomNo = roomNo;
    socket.uid = uid;
    socket.lastMessageAt = Date.now();
    getClientSet(roomNo).add(socket);
    markPlayerJoined(room, uid);
    await saveRoom(room);
    observeRealtimeStage("realtime_join", {
      roomNo,
      uid,
      mode: room.mode,
      status: room.status
    });
    broadcastRoom(roomNo, {
      message: "已进入实时房间"
    });
  } catch (error) {
    console.error("[realtime] join failed:", error.message);
    sendError(socket, "实时房间连接失败，请稍后重试");
  }
}

async function handleReady(socket) {
  const roomNo = socket.roomNo;
  const uid = socket.uid;

  if (!roomNo || !uid) {
    sendError(socket, "请先进入房间");
    return;
  }

  const room = await loadRoom(roomNo);
  if (!room) {
    sendError(socket, "房间不存在或已过期");
    return;
  }

  if (room.status === "finished") {
    sendError(socket, "对局已结束");
    return;
  }

  const ok = markPlayerReady(room, uid);
  if (!ok) {
    sendError(socket, "玩家不属于该房间");
    return;
  }

  await saveRoom(room);
  observeRealtimeStage("realtime_ready", {
    roomNo,
    uid,
    mode: room.mode,
    status: room.status
  });
  if (room.status === "playing" && !room.observedStartedAt) {
    room.observedStartedAt = Date.now();
    await saveRoom(room);
    observeRealtimeStage("realtime_started", {
      roomNo,
      uid,
      mode: room.mode,
      status: room.status
    });
  }
  broadcastRoom(roomNo, {
    message: room.status === "playing" ? "双方已准备，倒计时开始" : "已确认准备，等待对手"
  });
}

async function handleSwap(socket, payload) {
  const roomNo = socket.roomNo;
  const uid = socket.uid;
  const swapSeq = Number(payload?.seq || 0);
  const wantsExtremeProtocol = payload?.type === "swap_cmd";
  const clientAt = Number(payload?.clientAt || 0);
  const baseVersion = Number(payload?.baseVersion || 0);
  const swapErrorExtra = swapSeq > 0 ? { kind: "swap_rejected", seq: swapSeq } : {};

  if (!roomNo || !uid) {
    if (wantsExtremeProtocol) {
      send(socket, {
        type: "swap_reject",
        seq: swapSeq,
        reason: "请先进入房间",
        serverVersion: 0,
        clientAt
      });
    } else {
      sendError(socket, "请先进入房间", swapErrorExtra);
    }
    return;
  }

  const room = await loadRoom(roomNo);
  if (!room) {
    if (wantsExtremeProtocol) {
      send(socket, {
        type: "swap_reject",
        seq: swapSeq,
        reason: "房间不存在或已过期",
        serverVersion: 0,
        clientAt
      });
    } else {
      sendError(socket, "房间不存在或已过期", swapErrorExtra);
    }
    observeRealtimeStage("realtime_swap_error", {
      roomNo,
      uid,
      message: "room_missing"
    });
    return;
  }

  const useExtremeProtocol = wantsExtremeProtocol && isExtremeRealtimeEnabled(room, uid);
  const rejectSwap = (reason, extra = {}) => {
    if (useExtremeProtocol) {
      send(socket, {
        type: "swap_reject",
        seq: swapSeq,
        reason,
        serverVersion: Number(room.version || 1),
        clientAt,
        room: toPublicRoom(room, uid),
        ...extra
      });
    } else {
      sendError(socket, reason, swapErrorExtra);
    }
  };

  if (useExtremeProtocol && baseVersion > 0) {
    const serverVersion = Number(room.version || 1);
    const allowedLag = Math.max(1, Number(extremeRealtime.maxPendingSwaps || DEFAULT_EXTREME_REALTIME.maxPendingSwaps) + 1);
    if (baseVersion > serverVersion + 1 || serverVersion - baseVersion > allowedLag) {
      rejectSwap("棋盘已同步，请继续操作", {
        reasonCode: "version_mismatch",
        baseVersion,
        serverVersion
      });
      observeRealtimeStage("realtime_swap_reject", {
        roomNo,
        uid,
        mode: room.mode,
        status: room.status,
        message: "version_mismatch",
        seq: swapSeq,
        result: `${baseVersion}:${serverVersion}`
      });
      return;
    }
  }

  const now = Date.now();
  const bucketKey = `${roomNo}:${uid}`;
  const bucket = swapBuckets.get(bucketKey) || {
    count: 0,
    resetAt: now + SWAP_WINDOW_MS,
    lastAt: 0,
    lastSeq: 0
  };

  if (bucket.resetAt <= now) {
    bucket.count = 0;
    bucket.resetAt = now + SWAP_WINDOW_MS;
    bucket.lastSeq = 0;
  }

  if (swapSeq > 0 && bucket.lastSeq >= swapSeq) {
    if (useExtremeProtocol) {
      send(socket, {
        type: "swap_reject",
        seq: swapSeq,
        reason: "duplicate_seq",
        serverVersion: Number(room.version || 1),
        clientAt,
        room: toPublicRoom(room, uid)
      });
    } else {
      send(socket, {
        type: "room_state",
        room: toPublicRoom(room, uid),
        message: ""
      });
    }
    swapBuckets.set(bucketKey, bucket);
    observeRealtimeStage("realtime_swap_error", {
      roomNo,
      uid,
      message: "duplicate_seq",
      seq: swapSeq
    });
    if (useExtremeProtocol) {
      observeRealtimeStage("realtime_swap_reject", {
        roomNo,
        uid,
        mode: room.mode,
        status: room.status,
        message: "duplicate_seq",
        seq: swapSeq
      });
    }
    return;
  }

  const minIntervalMs = useExtremeProtocol ? extremeRealtime.swapMinIntervalMs : SWAP_MIN_INTERVAL_MS;
  if (now - bucket.lastAt < minIntervalMs || bucket.count >= SWAP_MAX_PER_WINDOW) {
    rejectSwap("操作过快，请稍后再试", { reasonCode: "rate_limited" });
    swapBuckets.set(bucketKey, bucket);
    observeRealtimeStage("realtime_swap_error", {
      roomNo,
      uid,
      message: "rate_limited"
    });
    if (useExtremeProtocol) {
      observeRealtimeStage("realtime_swap_reject", {
        roomNo,
        uid,
        mode: room.mode,
        status: room.status,
        message: "rate_limited",
        seq: swapSeq
      });
    }
    return;
  }

  bucket.count += 1;
  bucket.lastAt = now;
  if (swapSeq > 0) {
    bucket.lastSeq = swapSeq;
  }
  swapBuckets.set(bucketKey, bucket);

  const result = applySwap(room, uid, payload.from, payload.to, swapSeq);
  await saveRoom(room);
  rooms.set(roomNo, room);

  if (room.status === "finished") {
    await settleRoomIfNeeded(room);
  }

  if (!result.ok) {
    rejectSwap(result.message, { reasonCode: "rule_rejected" });
    observeRealtimeStage("realtime_swap_error", {
      roomNo,
      uid,
      mode: room.mode,
      status: room.status,
      message: result.message
    });
    if (useExtremeProtocol) {
      observeRealtimeStage("realtime_swap_reject", {
        roomNo,
        uid,
        mode: room.mode,
        status: room.status,
        message: result.message,
        seq: swapSeq
      });
    }
    if (useExtremeProtocol) {
      return;
    }
  } else {
    const latestEvent = Array.isArray(room.events) ? room.events[0] : null;
    if (
      latestEvent &&
      latestEvent.uid === uid &&
      (Number(latestEvent.attack || 0) > 0 ||
        Number(latestEvent.specialTriggered || 0) > 0 ||
        Number(latestEvent.specialCreated || 0) > 0)
    ) {
      observeRealtimeStage("realtime_swap_event", {
        roomNo,
        uid,
        mode: room.mode,
        status: room.status,
        seq: latestEvent.seq || swapSeq,
        result: `${latestEvent.type}:${latestEvent.scoreGain}:${latestEvent.attack}:${latestEvent.specialTriggered || 0}:${latestEvent.specialCreated || 0}`,
        message:
          Number(latestEvent.specialTriggered || 0) > 0
            ? "special_triggered"
            : Number(latestEvent.specialCreated || 0) > 0
              ? "special_created"
              : "attack",
        cleared: latestEvent.cleared,
        chain: latestEvent.chain,
        scoreGain: latestEvent.scoreGain,
        attack: latestEvent.attack || 0,
        specialTriggered: latestEvent.specialTriggered || 0,
        specialCreated: latestEvent.specialCreated || 0
      });
    }

    if (useExtremeProtocol) {
      const publicRoom = toPublicRoom(room, uid);
      send(socket, {
        type: "swap_ack",
        seq: swapSeq,
        version: Number(room.version || 1),
        scoreGain: Number(result.scoreGain || 0),
        attack: Number(result.attack || 0),
        event: result.event || latestEvent || null,
        boardPatch: {
          type: "full_board",
          board: result.board || publicRoom.players.find((player) => player.uid === uid)?.board || []
        },
        room: publicRoom,
        clientAt,
        serverAt: Date.now()
      });
      broadcastRoomDelta(roomNo, {
        message: "",
        sourceSeq: swapSeq
      });
      observeRealtimeStage("realtime_swap_ack", {
        roomNo,
        uid,
        mode: room.mode,
        status: room.status,
        seq: swapSeq,
        result: String(room.version || 1)
      });
      return;
    }

    if (bucket.count === 1 || bucket.count % 8 === 0 || room.status === "finished") {
      observeRealtimeStage("realtime_swap_ok", {
        roomNo,
        uid,
        mode: room.mode,
        status: room.status,
        result: String(bucket.count)
      });
    }
  }

  broadcastRoom(roomNo, {
    message: result.message
  });
}

async function cleanup(socket) {
  if (socket.cleanedUp) return;
  socket.cleanedUp = true;

  removeMatchWatcher(socket);

  const roomNo = socket.roomNo;
  const uid = socket.uid;
  if (!roomNo) return;

  const clients = roomClients.get(roomNo);
  if (clients) {
    clients.delete(socket);
    if (clients.size === 0) {
      roomClients.delete(roomNo);
    }
  }

  socket.roomNo = "";
  socket.uid = "";

  if (uid && !hasJoinedClient(roomNo, uid)) {
    const room = await loadRoom(roomNo);
    if (room && markPlayerDisconnected(room, uid)) {
      await saveRoom(room);
      observeRealtimeStage("realtime_disconnected", {
        roomNo,
        uid,
        mode: room.mode,
        status: room.status
      });
      broadcastRoom(roomNo);
    }
  }
}

setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of swapBuckets.entries()) {
    if (bucket.resetAt <= now) {
      swapBuckets.delete(key);
    }
  }
}, 30_000).unref();

function parsePayload(raw) {
  try {
    return JSON.parse(raw.toString());
  } catch {
    return null;
  }
}

async function processRoomsTick() {
  if (roomTickRunning) {
    const now = Date.now();
    if (now - lastRoomTickWarnAt > 10_000) {
      lastRoomTickWarnAt = now;
      console.warn(`[realtime] room tick skipped: previous tick still running rooms=${rooms.size}`);
      observeRealtimeStage("realtime_tick_skipped", {
        status: "running",
        queueLength: rooms.size,
        message: "previous_tick_running"
      });
    }
    return;
  }

  roomTickRunning = true;
  const startedAt = Date.now();
  const entries = Array.from(rooms.entries());
  const batchSize = Math.max(10, Math.min(300, ROOM_TICK_BATCH_SIZE));
  let errorCount = 0;

  try {
    for (let index = 0; index < entries.length; index += batchSize) {
      const batch = entries.slice(index, index + batchSize);
      const results = await Promise.allSettled(
        batch.map(([roomNo, room]) => processRoomTick(roomNo, room))
      );
      errorCount += results.filter((result) => result.status === "rejected").length;
    }
  } finally {
    roomTickRunning = false;
  }

  const cost = Date.now() - startedAt;
  lastRoomTickCostMs = cost;
  if (cost > ROOM_TICK_WARN_MS || errorCount > 0) {
    tickSlowCount += 1;
    console.warn(`[realtime] room tick slow rooms=${entries.length} cost=${cost}ms errors=${errorCount}`);
    observeRealtimeStage("realtime_tick_slow", {
      status: "tick",
      costMs: cost,
      queueLength: entries.length,
      result: String(errorCount),
      message: errorCount ? "tick_errors" : "tick_slow"
    });
  }
}

async function processRoomTick(roomNo, room) {
  if (await pruneReleasedRoom(roomNo, room)) {
    return;
  }

  tickRoom(room);

  if (room.status === "finished") {
    if (!room.observedFinishedAt) {
      room.observedFinishedAt = Date.now();
      observeRealtimeStage("realtime_finished", {
        roomNo,
        mode: room.mode,
        status: room.status,
        result: room.finishReason || "finished"
      });
    }
    await saveRoom(room);
    await settleRoomIfNeeded(room);
    broadcastRoom(roomNo);
    return;
  }

  if (room.status === "playing") {
    const now = Date.now();
    const lastBotAt = botMoveAt.get(roomNo) || 0;
    let botMoved = null;

    if (now - lastBotAt >= getBotMoveIntervalMs(room)) {
      botMoved = applyBotMove(room);
      botMoveAt.set(roomNo, now);
    }

    if (room.status === "finished") {
      if (!room.observedFinishedAt) {
        room.observedFinishedAt = Date.now();
        observeRealtimeStage("realtime_finished", {
          roomNo,
          mode: room.mode,
          status: room.status,
          result: room.finishReason || "finished"
        });
      }
      await settleRoomIfNeeded(room);
    }
    await saveRoom(room);
    if (
      (room.players || []).some((player) => isExtremeRealtimeEnabled(room, player.uid)) &&
      now - Number(room.lastSnapshotAt || 0) >= extremeRealtime.snapshotIntervalMs
    ) {
      broadcastRoomSnapshot(roomNo);
      observeRealtimeStage("realtime_snapshot", {
        roomNo,
        mode: room.mode,
        status: room.status,
        result: String(room.version || 1)
      });
      return;
    }
    broadcastRoom(roomNo);
    return;
  }

  if (room.status === "finished" && !room.releasedAt) {
    await saveRoom(room);
    await settleRoomIfNeeded(room);
  }

  broadcastRoom(roomNo);
}

function attachRealtime(httpServer) {
  const wss = new WebSocketServer({
    server: httpServer
  });

  refreshRealtimeLimits().catch((error) => console.error("[realtime] config refresh failed:", error.message));

  wss.on("connection", (socket) => {
    if (wss.clients.size > realtimeLimits.maxConnectionsPerInstance) {
      sendError(socket, "当前在线人数较多，请稍后重试");
      socket.close();
      return;
    }

    socket.isAlive = true;
    socket.lastMessageAt = Date.now();

    send(socket, {
      type: "connected",
      message: "实时服务已连接",
      instanceId: REALTIME_INSTANCE_ID
    });

    socket.on("pong", () => {
      socket.isAlive = true;
      socket.lastMessageAt = Date.now();
    });

    socket.on("message", async (raw) => {
      socket.lastMessageAt = Date.now();

      if (raw.length > realtimeLimits.maxPayloadBytes) {
        sendError(socket, "实时消息过大");
        socket.close();
        return;
      }

      const payload = parsePayload(raw);
      if (!payload?.type) {
        sendError(socket, "消息格式错误");
        return;
      }

      try {
        if (payload.type === "join_room") {
          await handleJoin(socket, payload);
          return;
        }

        if (payload.type === "watch_match") {
          await handleWatchMatch(socket, payload);
          return;
        }

        if (payload.type === "swap_tiles" || payload.type === "swap_cmd") {
          await handleSwap(socket, payload);
          return;
        }

        if (payload.type === "player_ready") {
          await handleReady(socket);
          return;
        }

        sendError(socket, "不支持的实时消息");
      } catch (error) {
        console.error("[realtime] message failed:", error);
        sendError(socket, "实时服务处理失败");
      }
    });

    socket.on("close", () => {
      cleanup(socket).catch((error) => console.error("[realtime] cleanup failed:", error.message));
    });
    socket.on("error", () => {
      cleanup(socket).catch((error) => console.error("[realtime] cleanup failed:", error.message));
    });
  });

  setInterval(() => {
    processRoomsTick().catch((error) => console.error("[realtime] room tick failed:", error.message));
  }, ROOM_TICK_MS);

  setInterval(() => {
    processMatchWatchers().catch((error) => console.error("[realtime] match watch failed:", error.message));
  }, MATCH_WATCH_TICK_MS).unref?.();

  setInterval(() => {
    publishRealtimeStats(wss).catch((error) => console.error("[realtime] stats publish failed:", error.message));
  }, 10_000).unref?.();

  setInterval(() => {
    refreshRealtimeLimits().catch((error) => console.error("[realtime] config refresh failed:", error.message));
  }, 30_000).unref?.();

  setInterval(() => {
    const now = Date.now();
    if (now - lastHeartbeatAt < realtimeLimits.heartbeatSeconds * 1000) {
      return;
    }

    lastHeartbeatAt = now;
    const idleMs = realtimeLimits.idleTimeoutSeconds * 1000;

    for (const socket of wss.clients) {
      if (socket.isAlive === false || now - Number(socket.lastMessageAt || now) > idleMs) {
        socket.terminate();
        continue;
      }

      socket.isAlive = false;
      socket.ping();
    }
  }, 5_000).unref?.();

  return wss;
}

module.exports = {
  attachRealtime
};
