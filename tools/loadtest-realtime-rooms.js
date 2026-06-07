#!/usr/bin/env node
const fs = require("node:fs");
const path = require("node:path");
const { performance } = require("node:perf_hooks");
const WebSocket = require("ws");
const Redis = require("ioredis");
const mysql = require("mysql2/promise");

const {
  MYSQL_HOST,
  MYSQL_PORT,
  MYSQL_USER,
  MYSQL_PASSWORD,
  MYSQL_DATABASE,
  REDIS_HOST,
  REDIS_PORT
} = require("../services/api/src/config");
const { signToken } = require("../services/api/src/utils/auth-token");

const BOARD_COLUMNS = 6;
const BOARD_ROWS = 8;
const REDIS_ROOM_PREFIX = "blitz:room:";
const REDIS_REALTIME_ROOM_PREFIX = "blitz:realtime-room:";
const REDIS_USER_ROOM_PREFIX = "blitz:user-room:";

function parseArgs(argv) {
  const result = {};
  for (let index = 2; index < argv.length; index += 1) {
    const item = argv[index];
    if (!item.startsWith("--")) continue;
    const key = item.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith("--")) {
      result[key] = true;
      continue;
    }
    result[key] = next;
    index += 1;
  }
  return result;
}

function numberArg(args, key, fallback, min = 0, max = Number.MAX_SAFE_INTEGER) {
  const value = Number(args[key]);
  if (!Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, value));
}

function boolArg(args, key, fallback = false) {
  if (!(key in args)) return fallback;
  return !["0", "false", "no", "off"].includes(String(args[key]).toLowerCase());
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function nowIso() {
  return new Date().toISOString();
}

function createRunId() {
  const stamp = new Date().toISOString().replace(/\D/g, "").slice(0, 14);
  return `lt_${stamp}_${Math.random().toString(16).slice(2, 8)}`;
}

function cloneBoard(board) {
  return board.map((row) => [...row]);
}

function swap(board, from, to) {
  const current = board[from.row][from.col];
  board[from.row][from.col] = board[to.row][to.col];
  board[to.row][to.col] = current;
}

function findMatches(board) {
  const matched = new Set();

  for (let row = 0; row < BOARD_ROWS; row += 1) {
    let runStart = 0;
    for (let col = 1; col <= BOARD_COLUMNS; col += 1) {
      const current = col < BOARD_COLUMNS ? board[row][col] : null;
      const previous = board[row][col - 1];
      if (current !== previous || previous === null) {
        const length = col - runStart;
        if (previous !== null && length >= 3) {
          for (let next = runStart; next < col; next += 1) {
            matched.add(`${row}:${next}`);
          }
        }
        runStart = col;
      }
    }
  }

  for (let col = 0; col < BOARD_COLUMNS; col += 1) {
    let runStart = 0;
    for (let row = 1; row <= BOARD_ROWS; row += 1) {
      const current = row < BOARD_ROWS ? board[row][col] : null;
      const previous = board[row - 1][col];
      if (current !== previous || previous === null) {
        const length = row - runStart;
        if (previous !== null && length >= 3) {
          for (let next = runStart; next < row; next += 1) {
            matched.add(`${next}:${col}`);
          }
        }
        runStart = row;
      }
    }
  }

  return matched;
}

function listValidMoves(board) {
  const moves = [];
  for (let row = 0; row < BOARD_ROWS; row += 1) {
    for (let col = 0; col < BOARD_COLUMNS; col += 1) {
      const candidates = [
        { row, col: col + 1 },
        { row: row + 1, col }
      ];

      for (const to of candidates) {
        if (to.row >= BOARD_ROWS || to.col >= BOARD_COLUMNS) continue;
        const next = cloneBoard(board);
        const from = { row, col };
        swap(next, from, to);
        if (findMatches(next).size > 0) {
          moves.push({ from, to });
        }
      }
    }
  }
  return moves;
}

function makePlayer(runId, index) {
  const uid = `pi_${runId}_${String(index).padStart(5, "0")}`;
  return {
    uid,
    piUserId: `${runId}_${index}`,
    piUsername: `lt_${index}`,
    nickname: `压测${index}`,
    avatarUrl: "",
    avatarKey: `avatar_${(index % 6) + 1}`,
    rankName: "青铜"
  };
}

function makeRoom(runId, index, playerA, playerB, roundSeconds) {
  const roomNo = `${runId}_room_${String(index).padStart(5, "0")}`;
  return {
    roomNo,
    mode: "quick_battle",
    status: "playing",
    createdAt: new Date().toISOString(),
    timing: {
      quickBotFallbackSeconds: 30,
      matchCancelWaitSeconds: 20,
      matchCancelCooldownSeconds: 10,
      waitingReadyTimeoutSeconds: 30,
      vsIntroSeconds: 0,
      readyCountdownSeconds: 0,
      quickRoundSeconds: roundSeconds,
      paidRoundSeconds: roundSeconds,
      botMoveIntervalSeconds: 2.6
    },
    players: [
      {
        uid: playerA.uid,
        piUsername: playerA.piUsername,
        nickname: playerA.nickname,
        avatarUrl: "",
        avatarKey: playerA.avatarKey,
        board: { seed: index * 1000 + 1, columns: 6, rows: 8, colors: 5, score: 0, pressure: 0, combo: 0, remainSeconds: roundSeconds }
      },
      {
        uid: playerB.uid,
        piUsername: playerB.piUsername,
        nickname: playerB.nickname,
        avatarUrl: "",
        avatarKey: playerB.avatarKey,
        board: { seed: index * 1000 + 2, columns: 6, rows: 8, colors: 5, score: 0, pressure: 0, combo: 0, remainSeconds: roundSeconds }
      }
    ],
    winnerUid: "",
    battleLog: []
  };
}

function createCounters() {
  return {
    roomsPlanned: 0,
    roomsPrepared: 0,
    socketsPlanned: 0,
    socketsConnected: 0,
    socketsJoined: 0,
    readySent: 0,
    playingRooms: 0,
    finishedRooms: 0,
    settledRooms: 0,
    swapSent: 0,
    swapAccepted: 0,
    swapRejected: 0,
    lateSwapAfterFinish: 0,
    authErrors: 0,
    wsErrors: 0,
    closedUnexpected: 0,
    roomErrors: 0,
    roomStateMessages: 0,
    apiHealthOk: 0,
    apiHealthFailed: 0
  };
}

class LoadTest {
  constructor(options) {
    this.options = options;
    this.runId = options.runId || createRunId();
    this.pool = null;
    this.redis = null;
    this.counters = createCounters();
    this.rooms = [];
    this.roomStates = new Map();
    this.sockets = new Set();
    this.samples = [];
    this.firstRoomStateCosts = [];
    this.roomStateIntervals = [];
    this.errors = [];
    this.startedAt = Date.now();
    this.stopped = false;
    this.reportPath = "";
  }

  log(message) {
    console.log(`[${nowIso()}] ${message}`);
  }

  addError(kind, message) {
    this.errors.push({ at: nowIso(), kind, message: String(message || "").slice(0, 300) });
    if (this.errors.length > 300) {
      this.errors.shift();
    }
  }

  async init() {
    this.pool = mysql.createPool({
      host: MYSQL_HOST,
      port: MYSQL_PORT,
      user: MYSQL_USER,
      password: MYSQL_PASSWORD,
      database: MYSQL_DATABASE,
      waitForConnections: true,
      connectionLimit: this.options.mysqlConnections,
      queueLimit: 0,
      charset: "utf8mb4"
    });
    this.redis = new Redis({
      host: REDIS_HOST,
      port: REDIS_PORT,
      maxRetriesPerRequest: 2,
      enableOfflineQueue: false,
      lazyConnect: true
    });
    await this.redis.connect();
    await this.redis.ping();
  }

  async query(sql, params = []) {
    const [rows] = await this.pool.execute(sql, params);
    return rows;
  }

  async prepareUsersAndRooms() {
    this.counters.roomsPlanned = this.options.rooms;
    this.counters.socketsPlanned = this.options.rooms * 2;
    this.log(`准备 ${this.options.rooms} 个快速场房间、${this.options.rooms * 2} 个模拟用户，runId=${this.runId}`);

    const started = performance.now();
    for (let index = 0; index < this.options.rooms; index += 1) {
      const playerA = makePlayer(this.runId, index * 2 + 1);
      const playerB = makePlayer(this.runId, index * 2 + 2);
      const room = makeRoom(this.runId, index + 1, playerA, playerB, this.options.roundSeconds);
      this.rooms.push({ index, room, players: [playerA, playerB] });
    }

    for (let offset = 0; offset < this.rooms.length; offset += this.options.prepareBatch) {
      const slice = this.rooms.slice(offset, offset + this.options.prepareBatch);
      await Promise.all(slice.map((item) => this.prepareRoom(item)));
      this.counters.roomsPrepared += slice.length;
      if (this.counters.roomsPrepared % Math.max(this.options.prepareBatch, 100) === 0 || this.counters.roomsPrepared === this.options.rooms) {
        this.log(`房间准备进度 ${this.counters.roomsPrepared}/${this.options.rooms}`);
      }
    }

    this.log(`房间与用户准备完成，用时 ${Math.round(performance.now() - started)}ms`);
  }

  async prepareRoom(item) {
    const [playerA, playerB] = item.players;
    const room = item.room;

    await this.query(
      `INSERT INTO users
        (uid, pi_user_id, pi_username, nickname, avatar_url, avatar_key, profile_completed, rank_name, status, last_login_at)
       VALUES (?, ?, ?, ?, '', ?, 1, '青铜', 1, NOW())
       ON DUPLICATE KEY UPDATE nickname = VALUES(nickname), status = 1, last_login_at = NOW()`,
      [playerA.uid, playerA.piUserId, playerA.piUsername, playerA.nickname, playerA.avatarKey]
    );
    await this.query(
      `INSERT INTO users
        (uid, pi_user_id, pi_username, nickname, avatar_url, avatar_key, profile_completed, rank_name, status, last_login_at)
       VALUES (?, ?, ?, ?, '', ?, 1, '青铜', 1, NOW())
       ON DUPLICATE KEY UPDATE nickname = VALUES(nickname), status = 1, last_login_at = NOW()`,
      [playerB.uid, playerB.piUserId, playerB.piUsername, playerB.nickname, playerB.avatarKey]
    );
    await this.query(
      `INSERT INTO user_ranks (uid, rank_score, rank_name, rank_key, stars, win_count, lose_count, win_streak)
       VALUES (?, 1000, '青铜', 'bronze', 0, 0, 0, 0)
       ON DUPLICATE KEY UPDATE uid = VALUES(uid)`,
      [playerA.uid]
    ).catch(async () => {
      await this.query(
        `INSERT INTO user_ranks (uid, rank_score, rank_name, win_count, lose_count)
         VALUES (?, 1000, '青铜', 0, 0)
         ON DUPLICATE KEY UPDATE uid = VALUES(uid)`,
        [playerA.uid]
      );
    });
    await this.query(
      `INSERT INTO user_ranks (uid, rank_score, rank_name, rank_key, stars, win_count, lose_count, win_streak)
       VALUES (?, 1000, '青铜', 'bronze', 0, 0, 0, 0)
       ON DUPLICATE KEY UPDATE uid = VALUES(uid)`,
      [playerB.uid]
    ).catch(async () => {
      await this.query(
        `INSERT INTO user_ranks (uid, rank_score, rank_name, win_count, lose_count)
         VALUES (?, 1000, '青铜', 0, 0)
         ON DUPLICATE KEY UPDATE uid = VALUES(uid)`,
        [playerB.uid]
      );
    });
    await this.query(
      `INSERT INTO wallets (uid, available_balance, locked_balance, total_recharge, total_withdraw, total_reward)
       VALUES (?, 0, 0, 0, 0, 0)
       ON DUPLICATE KEY UPDATE uid = VALUES(uid)`,
      [playerA.uid]
    );
    await this.query(
      `INSERT INTO wallets (uid, available_balance, locked_balance, total_recharge, total_withdraw, total_reward)
       VALUES (?, 0, 0, 0, 0, 0)
       ON DUPLICATE KEY UPDATE uid = VALUES(uid)`,
      [playerB.uid]
    );
    await this.query(
      `INSERT INTO battle_rooms
        (room_no, mode, status, player_a_uid, player_b_uid, entry_fee, platform_fee_rate, reward_amount, is_bot_room)
       VALUES (?, 'quick_battle', 'playing', ?, ?, 0, 0, 0, 0)
       ON DUPLICATE KEY UPDATE status = VALUES(status), player_a_uid = VALUES(player_a_uid), player_b_uid = VALUES(player_b_uid)`,
      [room.roomNo, playerA.uid, playerB.uid]
    );

    const pipeline = this.redis.pipeline();
    pipeline.set(`${REDIS_ROOM_PREFIX}${room.roomNo}`, JSON.stringify(room), "EX", 7200);
    pipeline.set(`${REDIS_USER_ROOM_PREFIX}${playerA.uid}`, room.roomNo, "EX", 7200);
    pipeline.set(`${REDIS_USER_ROOM_PREFIX}${playerB.uid}`, room.roomNo, "EX", 7200);
    await pipeline.exec();
  }

  async runSockets() {
    this.log(`开始建立 WebSocket，端口=${this.options.ports.join(",")}，ramp=${this.options.rampMs}ms`);
    const started = Date.now();
    const launchPromises = [];
    for (const item of this.rooms) {
      const delayMs = Math.floor((item.index / Math.max(1, this.options.rooms)) * this.options.rampMs);
      launchPromises.push(
        sleep(delayMs).then(() => {
          if (!this.stopped) this.startRoomSockets(item);
        })
      );
    }
    await Promise.all(launchPromises);
    this.log(`所有房间连接任务已发起，用时 ${Date.now() - started}ms`);
  }

  startRoomSockets(item) {
    const port = this.options.ports[item.index % this.options.ports.length];
    const url = `ws://127.0.0.1:${port}`;
    const state = {
      roomNo: item.room.roomNo,
      latestRoom: null,
      joined: new Set(),
      readySent: new Set(),
      playingMarked: false,
      finishedMarked: false,
      lastMoveAt: 0,
      moveTimer: null
    };
    this.roomStates.set(item.room.roomNo, state);

    for (const player of item.players) {
      const token = signToken("user", player.uid);
      const socket = new WebSocket(url, {
        handshakeTimeout: this.options.wsTimeoutMs
      });
      socket.__roomNo = item.room.roomNo;
      socket.__uid = player.uid;
      socket.__expectedClose = false;
      socket.__openedAt = 0;
      socket.__firstRoomStateAt = 0;
      socket.__lastRoomStateAt = 0;
      this.sockets.add(socket);

      socket.on("open", () => {
        socket.__openedAt = performance.now();
        this.counters.socketsConnected += 1;
      });

      socket.on("message", (raw) => {
        this.handleSocketMessage(socket, raw, item.room.roomNo, player.uid, token);
      });

      socket.on("error", (error) => {
        this.counters.wsErrors += 1;
        this.addError("ws_error", `${item.room.roomNo}/${player.uid}: ${error.message}`);
      });

      socket.on("close", () => {
        this.sockets.delete(socket);
        if (!socket.__expectedClose && !this.stopped) {
          this.counters.closedUnexpected += 1;
        }
      });
    }
  }

  handleSocketMessage(socket, raw, roomNo, uid, token) {
    let payload = null;
    try {
      payload = JSON.parse(raw.toString());
    } catch (error) {
      this.addError("bad_message", error.message);
      return;
    }

    const state = this.roomStates.get(roomNo);
    if (!state) return;

    if (payload.type === "connected") {
      socket.send(JSON.stringify({ type: "join_room", roomNo, uid, token }));
      return;
    }

    if (payload.type === "error") {
      const message = payload.message || "";
      if (message.includes("身份校验")) this.counters.authErrors += 1;
      if (message.includes("对局已结束")) {
        this.counters.lateSwapAfterFinish += 1;
      } else if (message.includes("操作过快") || message.includes("没有形成三消")) {
        this.counters.swapRejected += 1;
      } else {
        this.counters.roomErrors += 1;
        this.addError("server_error", `${roomNo}/${uid}: ${message}`);
      }
      return;
    }

    if (payload.type !== "room_state" || !payload.room) return;

    const receivedAt = performance.now();
    this.counters.roomStateMessages += 1;
    if (!socket.__firstRoomStateAt) {
      socket.__firstRoomStateAt = receivedAt;
      if (socket.__openedAt) {
        this.pushMetric(this.firstRoomStateCosts, receivedAt - socket.__openedAt);
      }
    }
    if (socket.__lastRoomStateAt) {
      this.pushMetric(this.roomStateIntervals, receivedAt - socket.__lastRoomStateAt);
    }
    socket.__lastRoomStateAt = receivedAt;

    state.latestRoom = payload.room;
    if (!state.joined.has(uid)) {
      state.joined.add(uid);
      this.counters.socketsJoined += 1;
    }

    if (!state.readySent.has(uid)) {
      state.readySent.add(uid);
      this.counters.readySent += 1;
      socket.send(JSON.stringify({ type: "player_ready" }));
    }

    if (payload.message && (payload.message.includes("消除得分") || payload.message.includes("连锁攻击"))) {
      this.counters.swapAccepted += 1;
    }

    if (payload.room.status === "playing" && !state.playingMarked) {
      state.playingMarked = true;
      this.counters.playingRooms += 1;
      this.ensureMoveLoop(roomNo);
    }

    if (payload.room.status === "finished" && !state.finishedMarked) {
      state.finishedMarked = true;
      this.counters.finishedRooms += 1;
      this.stopMoveLoop(roomNo);
    }
  }

  pushMetric(list, value) {
    const next = Number(value || 0);
    if (!Number.isFinite(next) || next < 0) return;
    list.push(next);
    if (list.length > 10000) list.shift();
  }

  percentile(values, percentile) {
    if (!values.length) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil((percentile / 100) * sorted.length) - 1));
    return Number(sorted[index].toFixed(2));
  }

  ensureMoveLoop(roomNo) {
    const state = this.roomStates.get(roomNo);
    if (!state || state.moveTimer) return;
    state.moveTimer = setInterval(() => this.sendRoomMove(roomNo), this.options.moveIntervalMs);
    state.moveTimer.unref?.();
  }

  stopMoveLoop(roomNo) {
    const state = this.roomStates.get(roomNo);
    if (!state?.moveTimer) return;
    clearInterval(state.moveTimer);
    state.moveTimer = null;
  }

  sendRoomMove(roomNo) {
    const state = this.roomStates.get(roomNo);
    const room = state?.latestRoom;
    if (!room || room.status !== "playing" || Number(room.readySeconds || 0) > 0) return;

    const players = room.players || [];
    const player = players[Math.floor(Math.random() * players.length)];
    if (!player?.board) return;

    const moves = listValidMoves(player.board);
    if (!moves.length) return;

    const socket = [...this.sockets].find((candidate) => candidate.__roomNo === roomNo && candidate.__uid === player.uid && candidate.readyState === WebSocket.OPEN);
    if (!socket) return;

    const move = moves[Math.floor(Math.random() * moves.length)];
    socket.send(JSON.stringify({ type: "swap_tiles", from: move.from, to: move.to }));
    this.counters.swapSent += 1;
  }

  async monitorLoop() {
    const endAt = Date.now() + this.options.durationSeconds * 1000;
    while (!this.stopped && Date.now() < endAt) {
      await sleep(this.options.sampleSeconds * 1000);
      await this.collectSample();
      this.printProgress();
    }
  }

  async collectSample() {
    const elapsedSeconds = Math.round((Date.now() - this.startedAt) / 1000);
    let redisInfo = "";
    let keyCount = 0;
    let realtimeStats = [];
    let dbStats = {};
    try {
      redisInfo = await this.redis.info();
      keyCount = await this.countRunRedisKeys();
      realtimeStats = await this.readRealtimeStats();
    } catch (error) {
      this.addError("redis_sample", error.message);
    }

    try {
      const roomRows = await this.query(
        `SELECT status, COUNT(*) AS total
         FROM battle_rooms
         WHERE room_no LIKE ?
         GROUP BY status`,
        [`${this.runId}_room_%`]
      );
      dbStats = roomRows.reduce((acc, row) => {
        acc[row.status] = Number(row.total || 0);
        return acc;
      }, {});
      this.counters.settledRooms = Number(dbStats.finished || 0);
    } catch (error) {
      this.addError("mysql_sample", error.message);
    }

    const memoryLine = redisInfo.split(/\r?\n/).find((line) => line.startsWith("used_memory_human:")) || "";
    const clientsLine = redisInfo.split(/\r?\n/).find((line) => line.startsWith("connected_clients:")) || "";
    const sample = {
      at: nowIso(),
      elapsedSeconds,
      socketsOpen: this.sockets.size,
      counters: { ...this.counters },
      dbStats,
      redis: {
        runKeys: keyCount,
        usedMemory: memoryLine.split(":")[1] || "",
        connectedClients: Number((clientsLine.split(":")[1] || "0").trim())
      },
      realtimeStats,
      smoothness: this.buildSmoothnessSummary()
    };
    this.samples.push(sample);
  }

  async readRealtimeStats() {
    const stats = [];
    let cursor = "0";
    do {
      const [nextCursor, keys] = await this.redis.scan(cursor, "MATCH", "blitz:realtime:stats:*", "COUNT", 100);
      cursor = nextCursor;
      for (const key of keys) {
        const raw = await this.redis.get(key);
        if (!raw) continue;
        try {
          stats.push(JSON.parse(raw));
        } catch {
          // Ignore transient malformed stats.
        }
      }
    } while (cursor !== "0");
    return stats;
  }

  async countRunRedisKeys() {
    const patterns = [
      `${REDIS_ROOM_PREFIX}${this.runId}_room_*`,
      `${REDIS_REALTIME_ROOM_PREFIX}${this.runId}_room_*`,
      `${REDIS_USER_ROOM_PREFIX}pi_${this.runId}_*`
    ];
    let total = 0;
    for (const pattern of patterns) {
      let cursor = "0";
      do {
        const [nextCursor, keys] = await this.redis.scan(cursor, "MATCH", pattern, "COUNT", 1000);
        cursor = nextCursor;
        total += keys.length;
      } while (cursor !== "0");
    }
    return total;
  }

  printProgress() {
    const elapsedSeconds = Math.round((Date.now() - this.startedAt) / 1000);
    this.log(
      `进度 ${elapsedSeconds}s/${this.options.durationSeconds}s ` +
        `连接 ${this.counters.socketsConnected}/${this.counters.socketsPlanned} ` +
        `入房 ${this.counters.socketsJoined} 准备 ${this.counters.readySent} ` +
        `开局 ${this.counters.playingRooms}/${this.options.rooms} ` +
        `完成 ${this.counters.finishedRooms} 结算 ${this.counters.settledRooms} ` +
        `交换 ${this.counters.swapSent} 首包P95 ${this.percentile(this.firstRoomStateCosts, 95)}ms ` +
        `包间隔P95 ${this.percentile(this.roomStateIntervals, 95)}ms 错误 ${this.errors.length}`
    );
  }

  async waitForSettlements() {
    const deadline = Date.now() + this.options.settleWaitSeconds * 1000;
    while (Date.now() < deadline) {
      await this.collectSample();
      if (this.counters.settledRooms >= this.options.rooms) return;
      await sleep(3000);
    }
  }

  async cleanup() {
    this.log("开始清理压测 WebSocket、Redis 与 MySQL 模拟数据");
    this.stopped = true;
    for (const state of this.roomStates.values()) {
      if (state.moveTimer) clearInterval(state.moveTimer);
    }
    for (const socket of this.sockets) {
      socket.__expectedClose = true;
      try {
        socket.close();
      } catch {
        // ignore close errors
      }
    }

    if (this.redis?.status !== "ready") {
      try {
        await this.redis?.connect();
      } catch {
        // MySQL cleanup can still run even if Redis is unavailable.
      }
    }

    if (this.redis?.status === "ready") {
      await this.deleteRedisByPattern(`${REDIS_ROOM_PREFIX}${this.runId}_room_*`);
      await this.deleteRedisByPattern(`${REDIS_REALTIME_ROOM_PREFIX}${this.runId}_room_*`);
      await this.deleteRedisByPattern(`${REDIS_USER_ROOM_PREFIX}pi_${this.runId}_*`);
      await this.deleteRedisByPattern(`blitz:match:queue:*${this.runId}*`);
      await this.deleteRedisByPattern(`blitz:match:cancel-cooldown:pi_${this.runId}_*`);
    }

    const likeRoom = `${this.runId}_room_%`;
    const likeUid = `pi_${this.runId}_%`;
    await this.query("DELETE FROM rank_match_records WHERE room_no LIKE ?", [likeRoom]).catch(() => {});
    await this.query("DELETE FROM wallet_ledgers WHERE uid LIKE ?", [likeUid]).catch(() => {});
    await this.query("DELETE FROM battle_rooms WHERE room_no LIKE ?", [likeRoom]).catch(() => {});
    await this.query("DELETE FROM wallets WHERE uid LIKE ?", [likeUid]).catch(() => {});
    await this.query("DELETE FROM user_ranks WHERE uid LIKE ?", [likeUid]).catch(() => {});
    await this.query("DELETE FROM users WHERE uid LIKE ? OR pi_user_id LIKE ?", [likeUid, `${this.runId}_%`]).catch(() => {});
    this.log("清理完成");
  }

  async deleteRedisByPattern(pattern) {
    let cursor = "0";
    do {
      const [nextCursor, keys] = await this.redis.scan(cursor, "MATCH", pattern, "COUNT", 1000);
      cursor = nextCursor;
      if (keys.length) {
        await this.redis.del(...keys);
      }
    } while (cursor !== "0");
  }

  async writeReport() {
    const reportDir = path.resolve(process.cwd(), "logs", "loadtest");
    fs.mkdirSync(reportDir, { recursive: true });
    this.reportPath = path.join(reportDir, `${this.runId}.json`);
    const report = {
      runId: this.runId,
      startedAt: new Date(this.startedAt).toISOString(),
      finishedAt: nowIso(),
      options: this.options,
      counters: this.counters,
      errors: this.errors,
      samples: this.samples,
      smoothness: this.buildSmoothnessSummary(),
      summary: this.buildSummary()
    };
    fs.writeFileSync(this.reportPath, JSON.stringify(report, null, 2));
    this.log(`报告已写入 ${this.reportPath}`);
  }

  buildSummary() {
    return {
      roomsPreparedRate: this.percent(this.counters.roomsPrepared, this.options.rooms),
      socketConnectedRate: this.percent(this.counters.socketsConnected, this.options.rooms * 2),
      socketJoinedRate: this.percent(this.counters.socketsJoined, this.options.rooms * 2),
      playingRate: this.percent(this.counters.playingRooms, this.options.rooms),
      finishedRate: this.percent(this.counters.finishedRooms, this.options.rooms),
      settledRate: this.percent(this.counters.settledRooms, this.options.rooms),
      swapErrorRate: this.percent(this.counters.swapRejected, Math.max(1, this.counters.swapSent)),
      firstStateP95Ms: this.percentile(this.firstRoomStateCosts, 95),
      roomStateIntervalP95Ms: this.percentile(this.roomStateIntervals, 95),
      totalErrors: this.errors.length
    };
  }

  buildSmoothnessSummary() {
    return {
      firstStateCount: this.firstRoomStateCosts.length,
      firstStateP50Ms: this.percentile(this.firstRoomStateCosts, 50),
      firstStateP95Ms: this.percentile(this.firstRoomStateCosts, 95),
      firstStateMaxMs: this.percentile(this.firstRoomStateCosts, 100),
      roomStateIntervalCount: this.roomStateIntervals.length,
      roomStateIntervalP50Ms: this.percentile(this.roomStateIntervals, 50),
      roomStateIntervalP95Ms: this.percentile(this.roomStateIntervals, 95),
      roomStateIntervalMaxMs: this.percentile(this.roomStateIntervals, 100)
    };
  }

  percent(value, total) {
    return Number(((Number(value || 0) / Math.max(1, Number(total || 0))) * 100).toFixed(2));
  }

  async close() {
    if (this.redis) this.redis.disconnect();
    if (this.pool) await this.pool.end();
  }
}

async function main() {
  const args = parseArgs(process.argv);
  const ports = String(args.ports || "3001,3002,3003,3004")
    .split(",")
    .map((item) => Number(item.trim()))
    .filter((item) => Number.isInteger(item) && item > 0);
  const options = {
    runId: args["run-id"] ? String(args["run-id"]) : "",
    rooms: numberArg(args, "rooms", 2000, 1, 10000),
    durationSeconds: numberArg(args, "duration", 1200, 10, 7200),
    roundSeconds: numberArg(args, "round-seconds", 30, 5, 300),
    ports: ports.length ? ports : [3001],
    rampMs: numberArg(args, "ramp-ms", 180000, 0, 3600000),
    moveIntervalMs: numberArg(args, "move-interval-ms", 700, 240, 10000),
    sampleSeconds: numberArg(args, "sample-seconds", 30, 5, 300),
    settleWaitSeconds: numberArg(args, "settle-wait-seconds", 90, 0, 600),
    prepareBatch: numberArg(args, "prepare-batch", 50, 1, 500),
    mysqlConnections: numberArg(args, "mysql-connections", 20, 1, 100),
    wsTimeoutMs: numberArg(args, "ws-timeout-ms", 8000, 1000, 30000),
    cleanup: boolArg(args, "cleanup", true)
  };

  const test = new LoadTest(options);
  let exitCode = 0;

  try {
    await test.init();
    await test.prepareUsersAndRooms();
    await test.runSockets();
    await test.monitorLoop();
    await test.waitForSettlements();
  } catch (error) {
    exitCode = 1;
    test.addError("fatal", error.stack || error.message);
    console.error(error);
  } finally {
    try {
      await test.collectSample();
    } catch {
      // ignore final sample failures
    }
    if (options.cleanup) {
      await test.cleanup().catch((error) => {
        exitCode = 1;
        test.addError("cleanup", error.message);
        console.error(error);
      });
    }
    await test.writeReport().catch((error) => {
      exitCode = 1;
      console.error(error);
    });
    await test.close();
  }

  process.exit(exitCode);
}

main();
