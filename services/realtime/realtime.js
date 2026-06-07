const { WebSocketServer } = require("ws");
const { API_INTERNAL_BASE_URL, REALTIME_INSTANCE_ID, REALTIME_SETTLEMENT_SECRET } = require("./config");
const { redisGetJson, redisSetJson, redisDel } = require("./redis");
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

const REDIS_ROOM_PREFIX = "blitz:room:";
const REDIS_REALTIME_ROOM_PREFIX = "blitz:realtime-room:";
const REDIS_USER_ROOM_PREFIX = "blitz:user-room:";
const FINISHED_ROOM_GRACE_SECONDS = 600;

const rooms = new Map();
const roomClients = new Map();
const settledRooms = new Set();
const swapBuckets = new Map();
const botMoveAt = new Map();
const settlementQueue = [];
const settlementQueuedRooms = new Set();

const SWAP_MIN_INTERVAL_MS = 240;
const SWAP_MAX_PER_WINDOW = 28;
const SWAP_WINDOW_MS = 10_000;
const ROOM_TICK_MS = 1000;
const AUTH_VERIFY_TIMEOUT_MS = 3500;
const SETTLEMENT_CONCURRENCY = Number(process.env.SETTLEMENT_CONCURRENCY || 4);
const SETTLEMENT_RETRY_BASE_MS = 800;
let activeSettlements = 0;

function getBotMoveIntervalMs(room) {
  const seconds = Number(room?.timing?.botMoveIntervalSeconds || 2.6);
  return Math.max(1000, Math.min(10000, Math.round(seconds * 1000)));
}

function send(socket, payload) {
  if (socket.readyState === 1) {
    socket.send(JSON.stringify(payload));
  }
}

function sendError(socket, message) {
  send(socket, {
    type: "error",
    message
  });
}

function getClientSet(roomNo) {
  if (!roomClients.has(roomNo)) {
    roomClients.set(roomNo, new Set());
  }

  return roomClients.get(roomNo);
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

  const payload = {
    type: "room_state",
    room: toPublicRoom(room),
    ...extra
  };

  for (const client of getClientSet(roomNo)) {
    send(client, payload);
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

async function settleRoomIfNeeded(room) {
  if (!room || room.status !== "finished" || settledRooms.has(room.roomNo)) {
    return;
  }

  if (settlementQueuedRooms.has(room.roomNo)) {
    return;
  }

  settlementQueuedRooms.add(room.roomNo);
  settlementQueue.push({ room, attempt: 0, runAt: Date.now() });
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

  try {
    const response = await fetch(`${API_INTERNAL_BASE_URL}/internal/realtime/settle`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        secret: REALTIME_SETTLEMENT_SECRET,
        room
      })
    });
    const result = await response.json();

    if (!response.ok || result.code !== 0) {
      retrySettlement(item, result.message || response.statusText);
      return;
    }

    await releaseFinishedRoom(room);
    settlementQueuedRooms.delete(room.roomNo);
  } catch (error) {
    retrySettlement(item, error.message);
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

    if (!roomNo || !uid) {
      sendError(socket, "缺少房间号或玩家信息");
      return;
    }

    if (!(await verifySession(token, uid))) {
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
    getClientSet(roomNo).add(socket);
    markPlayerJoined(room, uid);
    await saveRoom(room);
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
  broadcastRoom(roomNo, {
    message: room.status === "playing" ? "双方已准备，倒计时开始" : "已确认准备，等待对手"
  });
}

async function handleSwap(socket, payload) {
  const roomNo = socket.roomNo;
  const uid = socket.uid;

  if (!roomNo || !uid) {
    sendError(socket, "请先进入房间");
    return;
  }

  const now = Date.now();
  const bucketKey = `${roomNo}:${uid}`;
  const bucket = swapBuckets.get(bucketKey) || {
    count: 0,
    resetAt: now + SWAP_WINDOW_MS,
    lastAt: 0
  };

  if (bucket.resetAt <= now) {
    bucket.count = 0;
    bucket.resetAt = now + SWAP_WINDOW_MS;
  }

  if (now - bucket.lastAt < SWAP_MIN_INTERVAL_MS || bucket.count >= SWAP_MAX_PER_WINDOW) {
    sendError(socket, "操作过快，请稍后再试");
    swapBuckets.set(bucketKey, bucket);
    return;
  }

  bucket.count += 1;
  bucket.lastAt = now;
  swapBuckets.set(bucketKey, bucket);

  const room = await loadRoom(roomNo);
  if (!room) {
    sendError(socket, "房间不存在或已过期");
    return;
  }

  const result = applySwap(room, uid, payload.from, payload.to);
  await saveRoom(room);

  if (room.status === "finished") {
    await settleRoomIfNeeded(room);
  }

  if (!result.ok) {
    sendError(socket, result.message);
  }

  broadcastRoom(roomNo, {
    message: result.message
  });
}

async function cleanup(socket) {
  if (!socket.roomNo) return;

  const clients = roomClients.get(socket.roomNo);
  if (socket.uid) {
    const room = await loadRoom(socket.roomNo);
    if (room && markPlayerDisconnected(room, socket.uid)) {
      await saveRoom(room);
      broadcastRoom(socket.roomNo);
    }
  }

  if (!clients) return;

  clients.delete(socket);
  if (clients.size === 0) {
    roomClients.delete(socket.roomNo);
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

async function processRoomTick(roomNo, room) {
  if (await pruneReleasedRoom(roomNo, room)) {
    return;
  }

  tickRoom(room);

  if (room.status === "finished") {
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

    await saveRoom(room);
    if (room.status === "finished") {
      await settleRoomIfNeeded(room);
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

  wss.on("connection", (socket) => {
    send(socket, {
      type: "connected",
      message: "实时服务已连接",
      instanceId: REALTIME_INSTANCE_ID
    });

    socket.on("message", async (raw) => {
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

        if (payload.type === "swap_tiles") {
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

  setInterval(async () => {
    for (const [roomNo, room] of rooms.entries()) {
      await processRoomTick(roomNo, room);
    }
  }, ROOM_TICK_MS);

  return wss;
}

module.exports = {
  attachRealtime
};
