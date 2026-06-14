const BOARD_COLUMNS = 6;
const BOARD_ROWS = 8;
const COLOR_COUNT = 5;
const SPECIAL_HORIZONTAL_OFFSET = 10;
const SPECIAL_VERTICAL_OFFSET = 20;
const SPECIAL_BOMB_OFFSET = 30;
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
const READY_SECONDS = DEFAULT_TIMING.vsIntroSeconds + DEFAULT_TIMING.readyCountdownSeconds;
const WAITING_READY_TIMEOUT_SECONDS = DEFAULT_TIMING.waitingReadyTimeoutSeconds;
const WAITING_READY_STALE_GRACE_MS = 10000;
const PRESSURE_LIMIT = 30;
const SCORE_PER_TILE = 10;
const CHAIN_BONUS = 8;
const MAX_CHAIN_BONUS_LEVEL = 3;
const MAX_RESOLVE_CHAINS = 4;
const MAX_CREDITED_CLEARED = 18;
const MAX_ATTACK_PER_MOVE = 4;

function createRandom(seed) {
  let value = seed % 2147483647;
  if (value <= 0) value += 2147483646;

  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
}

function randomTile(random) {
  return Math.floor(random() * COLOR_COUNT);
}

function getTileColor(tile) {
  if (tile === null || tile === undefined) return null;
  if (tile >= SPECIAL_BOMB_OFFSET) return tile - SPECIAL_BOMB_OFFSET;
  if (tile >= SPECIAL_VERTICAL_OFFSET) return tile - SPECIAL_VERTICAL_OFFSET;
  if (tile >= SPECIAL_HORIZONTAL_OFFSET) return tile - SPECIAL_HORIZONTAL_OFFSET;
  return tile;
}

function isSpecialTile(tile) {
  return Number.isInteger(tile) && tile >= SPECIAL_HORIZONTAL_OFFSET;
}

function getSpecialKind(tile) {
  if (tile >= SPECIAL_BOMB_OFFSET) return "bomb";
  if (tile >= SPECIAL_VERTICAL_OFFSET) return "vertical";
  if (tile >= SPECIAL_HORIZONTAL_OFFSET) return "horizontal";
  return "";
}

function makeSpecialTile(color, kind) {
  if (kind === "bomb") return SPECIAL_BOMB_OFFSET + color;
  if (kind === "vertical") return SPECIAL_VERTICAL_OFFSET + color;
  return SPECIAL_HORIZONTAL_OFFSET + color;
}

function isSameMatchTile(a, b) {
  const colorA = getTileColor(a);
  const colorB = getTileColor(b);
  return colorA !== null && colorA === colorB;
}

function wouldCreateMatchAt(board, row, col, tile) {
  return (
    (col >= 2 && isSameMatchTile(board[row][col - 1], tile) && isSameMatchTile(board[row][col - 2], tile)) ||
    (col + 2 < BOARD_COLUMNS && isSameMatchTile(board[row][col + 1], tile) && isSameMatchTile(board[row][col + 2], tile)) ||
    (row >= 2 && isSameMatchTile(board[row - 1][col], tile) && isSameMatchTile(board[row - 2][col], tile)) ||
    (row + 2 < BOARD_ROWS && isSameMatchTile(board[row + 1][col], tile) && isSameMatchTile(board[row + 2][col], tile))
  );
}

function safeRandomTile(board, row, col, random) {
  for (let attempt = 0; attempt < COLOR_COUNT * 3; attempt += 1) {
    const tile = randomTile(random);
    if (!wouldCreateMatchAt(board, row, col, tile)) {
      return tile;
    }
  }

  for (let tile = 0; tile < COLOR_COUNT; tile += 1) {
    if (!wouldCreateMatchAt(board, row, col, tile)) {
      return tile;
    }
  }

  return randomTile(random);
}

function findMatches(board) {
  const matched = new Set();
  const runs = [];

  for (let row = 0; row < BOARD_ROWS; row += 1) {
    let runStart = 0;
    let previousColor = getTileColor(board[row][0]);
    for (let col = 1; col <= BOARD_COLUMNS; col += 1) {
      const currentColor = col < BOARD_COLUMNS ? getTileColor(board[row][col]) : null;

      if (currentColor !== previousColor || previousColor === null) {
        const length = col - runStart;
        if (previousColor !== null && length >= 3) {
          const cells = [];
          for (let next = runStart; next < col; next += 1) {
            matched.add(`${row}:${next}`);
            cells.push({ row, col: next });
          }
          runs.push({ orientation: "horizontal", length, color: previousColor, cells });
        }
        runStart = col;
        previousColor = currentColor;
      }
    }
  }

  for (let col = 0; col < BOARD_COLUMNS; col += 1) {
    let runStart = 0;
    let previousColor = getTileColor(board[0][col]);
    for (let row = 1; row <= BOARD_ROWS; row += 1) {
      const currentColor = row < BOARD_ROWS ? getTileColor(board[row][col]) : null;

      if (currentColor !== previousColor || previousColor === null) {
        const length = row - runStart;
        if (previousColor !== null && length >= 3) {
          const cells = [];
          for (let next = runStart; next < row; next += 1) {
            matched.add(`${next}:${col}`);
            cells.push({ row: next, col });
          }
          runs.push({ orientation: "vertical", length, color: previousColor, cells });
        }
        runStart = row;
        previousColor = currentColor;
      }
    }
  }

  matched.runs = runs;
  return matched;
}

function collapseBoard(board, random) {
  for (let col = 0; col < BOARD_COLUMNS; col += 1) {
    const remaining = [];

    for (let row = BOARD_ROWS - 1; row >= 0; row -= 1) {
      if (board[row][col] !== null) {
        remaining.push(board[row][col]);
      }
    }

    for (let row = BOARD_ROWS - 1; row >= 0; row -= 1) {
      board[row][col] =
        remaining[BOARD_ROWS - 1 - row] ?? safeRandomTile(board, row, col, random);
    }
  }
}

function createCandidateBoard(random) {
  const board = Array.from({ length: BOARD_ROWS }, () => Array.from({ length: BOARD_COLUMNS }, () => null));

  for (let row = 0; row < BOARD_ROWS; row += 1) {
    for (let col = 0; col < BOARD_COLUMNS; col += 1) {
      board[row][col] = safeRandomTile(board, row, col, random);
    }
  }

  let guard = 0;
  while (findMatches(board).size > 0 && guard < 20) {
    const matches = findMatches(board);
    for (const key of matches) {
      const [row, col] = key.split(":").map(Number);
      board[row][col] = safeRandomTile(board, row, col, random);
    }
    guard += 1;
  }

  return board;
}

function cloneBoard(board) {
  return board.map((row) => [...row]);
}

function hasValidMove(board) {
  for (let row = 0; row < BOARD_ROWS; row += 1) {
    for (let col = 0; col < BOARD_COLUMNS; col += 1) {
      const candidates = [
        { row, col: col + 1 },
        { row: row + 1, col }
      ];

      for (const to of candidates) {
        if (to.row >= BOARD_ROWS || to.col >= BOARD_COLUMNS) continue;
        const next = cloneBoard(board);
        swap(next, { row, col }, to);
        if (isSpecialTile(next[row][col]) || isSpecialTile(next[to.row][to.col]) || findMatches(next).size > 0) {
          return true;
        }
      }
    }
  }

  return false;
}

function createBoard(seed) {
  const random = createRandom(seed);
  let board = createCandidateBoard(random);

  for (let attempt = 0; attempt < 30 && !hasValidMove(board); attempt += 1) {
    board = createCandidateBoard(random);
  }

  return board;
}

function refillBoardIfStuck(board, room) {
  if (hasValidMove(board)) return;

  const random = createRandom(Number(room.randomSeed || room.createdAt || Date.now()) + room.randomNonce * 104729);
  const next = createCandidateBoard(random);

  for (let row = 0; row < BOARD_ROWS; row += 1) {
    for (let col = 0; col < BOARD_COLUMNS; col += 1) {
      board[row][col] = next[row][col];
    }
  }
}

function createPlayerState(player, seed) {
  const isBot = String(player.uid).startsWith("bot_");
  const now = Date.now();
  const random = createRandom(seed);
  const botReadyDelayMs = 800 + Math.floor(random() * 1800);

  return {
    uid: player.uid,
    nickname: player.nickname,
    piUsername: player.piUsername || player.pi_username || "",
    avatarUrl: player.avatarUrl || player.avatar_url || "",
    avatarKey: player.avatarKey || player.avatar_key || "avatar_1",
    isBot,
    joinedAt: isBot ? now : 0,
    readyAt: 0,
    botAutoReadyAt: isBot ? now + botReadyDelayMs : 0,
    disconnectedAt: 0,
    validMoveCount: 0,
    board: createBoard(seed),
    score: 0,
    pressure: 0,
    combo: 0,
    lastGain: 0
  };
}

function normalizeTiming(timing = {}) {
  return {
    ...DEFAULT_TIMING,
    ...(timing || {})
  };
}

function getRoomTiming(room = {}) {
  return normalizeTiming(room.timing);
}

function getReadyTotalSeconds(room = {}) {
  const timing = getRoomTiming(room);
  return Number(timing.vsIntroSeconds || 0) + Number(timing.readyCountdownSeconds || 0);
}

function getRoundSeconds(mode, timing = DEFAULT_TIMING) {
  return mode === "quick_battle"
    ? Number(timing.quickRoundSeconds || DEFAULT_TIMING.quickRoundSeconds)
    : Number(timing.paidRoundSeconds || DEFAULT_TIMING.paidRoundSeconds);
}

function getRoomRoundSeconds(room = {}) {
  return Number(room.roundSeconds || getRoundSeconds(room.mode, getRoomTiming(room)));
}

function createRealtimeRoom(baseRoom) {
  const createdAt = Date.now();
  const seed = createdAt + baseRoom.roomNo.length * 131;
  const mode = baseRoom.mode || "quick_battle";
  const timing = normalizeTiming(baseRoom.timing);
  const roundSeconds = getRoundSeconds(mode, timing);

  return {
    roomNo: baseRoom.roomNo,
    mode,
    timing,
    botConfig: baseRoom.botConfig || {},
    status: "waiting_ready",
    createdAt,
    waitingReadyEndsAt: createdAt + Number(timing.waitingReadyTimeoutSeconds || WAITING_READY_TIMEOUT_SECONDS) * 1000,
    randomSeed: seed,
    randomNonce: 0,
    readyEndsAt: 0,
    endsAt: 0,
    roundSeconds,
    winnerUid: "",
    players: baseRoom.players.map((player, index) =>
      createPlayerState(player, Date.now() + index * 997 + player.uid.length)
    ),
    version: 1,
    events: []
  };
}

function nextRoomRandom(room) {
  room.randomNonce = Number(room.randomNonce || 0) + 1;
  return createRandom(Number(room.randomSeed || room.createdAt || Date.now()) + room.randomNonce * 7919)();
}

function getRemainSeconds(room) {
  if (room.status === "waiting_ready") {
    return Math.max(0, Math.ceil(((room.waitingReadyEndsAt || room.createdAt || Date.now()) - Date.now()) / 1000));
  }

  if (getReadySeconds(room) > 0) {
    return getRoomRoundSeconds(room);
  }

  return Math.max(0, Math.ceil((room.endsAt - Date.now()) / 1000));
}

function getReadySeconds(room) {
  if (room.status !== "playing" || !room.readyEndsAt) return 0;
  return Math.max(0, Math.ceil(((room.readyEndsAt || room.createdAt || Date.now()) - Date.now()) / 1000));
}

function normalizeRoomLifecycle(room) {
  if (!room || !Array.isArray(room.players)) return room;

  for (const player of room.players) {
    player.joinedAt = Number(player.joinedAt || 0);
    player.readyAt = Number(player.readyAt || 0);
    player.disconnectedAt = Number(player.disconnectedAt || 0);
    player.validMoveCount = Number(player.validMoveCount || 0);

    if (player.isBot) {
      const botJoinedAt = player.joinedAt || room.createdAt || Date.now();
      player.joinedAt = player.joinedAt || botJoinedAt;
      player.botAutoReadyAt = Number(player.botAutoReadyAt || botJoinedAt + 1200);
      if (room.status === "waiting_ready" && !player.readyAt && Date.now() >= player.botAutoReadyAt) {
        player.readyAt = player.botAutoReadyAt;
      }
    }
  }

  if (!room.status) {
    room.status = room.readyEndsAt ? "playing" : "waiting_ready";
  }

  if (room.status === "waiting_ready" && !room.waitingReadyEndsAt) {
    const timing = getRoomTiming(room);
    room.waitingReadyEndsAt =
      Number(room.createdAt || Date.now()) + Number(timing.waitingReadyTimeoutSeconds || WAITING_READY_TIMEOUT_SECONDS) * 1000;
  }

  room.timing = getRoomTiming(room);

  return room;
}

function isPaidMode(mode) {
  return mode !== "quick_battle";
}

function resolveWaitingReadyTimeout(room) {
  normalizeRoomLifecycle(room);
  if (room.status !== "waiting_ready") return false;

  const timeoutAt = Number(room.waitingReadyEndsAt || 0);
  const now = Date.now();
  if (!timeoutAt || now < timeoutAt) return false;

  if (!isPaidMode(room.mode)) {
    if (now - timeoutAt > WAITING_READY_STALE_GRACE_MS) {
      room.status = "finished";
      room.winnerUid = "";
      room.finishReason = "ready_timeout";
      room.endsAt = now;
      return true;
    }

    for (const player of room.players) {
      player.joinedAt = player.joinedAt || now;
      player.readyAt = player.readyAt || now;
      player.disconnectedAt = 0;
    }
    startRoomIfReady(room);
    room.autoReadyAt = now;
    room.finishReason = "";
    return true;
  }

  room.status = "finished";
  room.winnerUid = "";
  room.finishReason = "ready_timeout";
  room.endsAt = Date.now();
  return true;
}

function arePlayersReady(room) {
  normalizeRoomLifecycle(room);
  return room.players.length >= 2 && room.players.every((player) => Number(player.readyAt || 0) > 0);
}

function startRoomIfReady(room) {
  normalizeRoomLifecycle(room);
  if (room.status !== "waiting_ready" || !arePlayersReady(room)) return false;

  const now = Date.now();
  room.status = "playing";
  room.readyEndsAt = now + getReadyTotalSeconds(room) * 1000;
  room.endsAt = room.readyEndsAt + Number(room.roundSeconds || getRoundSeconds(room.mode, getRoomTiming(room))) * 1000;
  room.startedAt = now;
  return true;
}

function markPlayerJoined(room, uid) {
  normalizeRoomLifecycle(room);
  resolveWaitingReadyTimeout(room);
  const player = room.players.find((item) => item.uid === uid);
  if (!player) return false;

  player.joinedAt = player.joinedAt || Date.now();
  player.disconnectedAt = 0;
  return true;
}

function markPlayerReady(room, uid) {
  normalizeRoomLifecycle(room);
  resolveWaitingReadyTimeout(room);
  if (room.status === "finished") return false;
  const player = room.players.find((item) => item.uid === uid);
  if (!player) return false;

  player.joinedAt = player.joinedAt || Date.now();
  player.readyAt = player.readyAt || Date.now();
  player.disconnectedAt = 0;
  startRoomIfReady(room);
  return true;
}

function markPlayerDisconnected(room, uid) {
  normalizeRoomLifecycle(room);
  const player = room.players.find((item) => item.uid === uid);
  if (!player || player.isBot || room.status === "finished") return false;

  player.disconnectedAt = Date.now();
  return true;
}

function isAdjacent(from, to) {
  const distance = Math.abs(from.row - to.row) + Math.abs(from.col - to.col);
  return distance === 1;
}

function isInside(position) {
  return (
    Number.isInteger(position?.row) &&
    Number.isInteger(position?.col) &&
    position.row >= 0 &&
    position.row < BOARD_ROWS &&
    position.col >= 0 &&
    position.col < BOARD_COLUMNS
  );
}

function swap(board, from, to) {
  const next = board[from.row][from.col];
  board[from.row][from.col] = board[to.row][to.col];
  board[to.row][to.col] = next;
}

function addSpecialClearTargets(board, matches) {
  const extra = new Set();

  for (const key of matches) {
    const [row, col] = key.split(":").map(Number);
    const tile = board[row]?.[col];
    if (!isSpecialTile(tile)) continue;

    const kind = getSpecialKind(tile);
    if (kind === "horizontal") {
      for (let nextCol = 0; nextCol < BOARD_COLUMNS; nextCol += 1) {
        extra.add(`${row}:${nextCol}`);
      }
    } else if (kind === "vertical") {
      for (let nextRow = 0; nextRow < BOARD_ROWS; nextRow += 1) {
        extra.add(`${nextRow}:${col}`);
      }
    } else if (kind === "bomb") {
      for (let nextRow = row - 1; nextRow <= row + 1; nextRow += 1) {
        for (let nextCol = col - 1; nextCol <= col + 1; nextCol += 1) {
          if (nextRow >= 0 && nextRow < BOARD_ROWS && nextCol >= 0 && nextCol < BOARD_COLUMNS) {
            extra.add(`${nextRow}:${nextCol}`);
          }
        }
      }
    }
  }

  for (const key of extra) {
    matches.add(key);
  }

  return extra.size;
}

function getSpecialCreation(matches, moveContext) {
  const runs = Array.isArray(matches.runs) ? matches.runs : [];
  const candidates = runs
    .filter((run) => run.length >= 4)
    .sort((a, b) => b.length - a.length);

  if (candidates.length === 0) return null;

  const run = candidates[0];
  const preferred = [moveContext?.to, moveContext?.from].find((position) =>
    position && run.cells.some((cell) => cell.row === position.row && cell.col === position.col)
  );
  const position = preferred || run.cells[Math.floor(run.cells.length / 2)];
  const kind = run.length >= 5 ? "bomb" : run.orientation === "horizontal" ? "horizontal" : "vertical";

  return {
    position,
    tile: makeSpecialTile(run.color, kind),
    kind
  };
}

function clearDirectSpecial(board, from, to) {
  const matched = new Set();
  const specials = [from, to].filter((position) => isInside(position) && isSpecialTile(board[position.row][position.col]));
  if (specials.length === 0) return matched;

  for (const position of specials) {
    matched.add(`${position.row}:${position.col}`);
  }
  addSpecialClearTargets(board, matched);
  return matched;
}

function resolveBoard(board, random = createRandom(Date.now()), moveContext = null) {
  let chain = 0;
  let totalCleared = 0;
  let scoreGain = 0;
  let specialTriggered = 0;
  let specialCreated = 0;
  let pendingMatches = moveContext ? clearDirectSpecial(board, moveContext.from, moveContext.to) : new Set();

  while (chain < MAX_RESOLVE_CHAINS) {
    const matches = pendingMatches.size > 0 ? pendingMatches : findMatches(board);
    pendingMatches = new Set();
    if (matches.size === 0) break;

    chain += 1;
    const extraCleared = addSpecialClearTargets(board, matches);
    specialTriggered += extraCleared > 0 ? 1 : 0;
    const specialCreation = getSpecialCreation(matches, chain === 1 ? moveContext : null);
    const creditedSize = Math.min(matches.size, MAX_CREDITED_CLEARED);
    const creditedCleared = Math.min(creditedSize, Math.max(0, MAX_CREDITED_CLEARED - totalCleared));
    totalCleared += creditedCleared;
    scoreGain += creditedCleared * SCORE_PER_TILE + Math.min(chain - 1, MAX_CHAIN_BONUS_LEVEL) * CHAIN_BONUS + specialTriggered * 8;

    for (const key of matches) {
      const [row, col] = key.split(":").map(Number);
      board[row][col] = null;
    }

    if (specialCreation && board[specialCreation.position.row]?.[specialCreation.position.col] === null) {
      board[specialCreation.position.row][specialCreation.position.col] = specialCreation.tile;
      specialCreated += 1;
    }

    collapseBoard(board, random);

    if (totalCleared >= MAX_CREDITED_CLEARED) {
      break;
    }
  }

  return {
    chain,
    totalCleared,
    scoreGain,
    specialTriggered,
    specialCreated
  };
}

function settleRemainingMatches(board, random = createRandom(Date.now())) {
  let guard = 0;

  while (findMatches(board).size > 0 && guard < 8) {
    for (const key of findMatches(board)) {
      const [row, col] = key.split(":").map(Number);
      board[row][col] = null;
    }
    collapseBoard(board, random);
    guard += 1;
  }
}

function finishIfNeeded(room) {
  normalizeRoomLifecycle(room);
  if (room.status === "finished") return;
  if (resolveWaitingReadyTimeout(room)) {
    if (room.status !== "playing") return;
  }
  if (room.status !== "playing") return;
  if (getReadySeconds(room) > 0) return;

  const remainSeconds = getRemainSeconds(room);
  const pressureWinner = room.players.find((player) => player.pressure >= PRESSURE_LIMIT);

  if (pressureWinner) {
    const opponent = room.players.find((player) => player.uid !== pressureWinner.uid);
    room.status = "finished";
    room.winnerUid = opponent?.uid || pressureWinner.uid;
    room.finishReason = "pressure";
    return;
  }

  if (remainSeconds > 0) return;

  const [playerA, playerB] = room.players;
  room.status = "finished";
  if (playerA.score > playerB.score) {
    room.winnerUid = playerA.uid;
  } else if (playerB.score > playerA.score) {
    room.winnerUid = playerB.uid;
  } else if (playerA.pressure < playerB.pressure) {
    room.winnerUid = playerA.uid;
  } else if (playerB.pressure < playerA.pressure) {
    room.winnerUid = playerB.uid;
  } else {
    room.winnerUid = "";
  }
  room.finishReason = "timeout";
}

function tickRoom(room) {
  normalizeRoomLifecycle(room);
  if (room.status === "waiting_ready") {
    startRoomIfReady(room);
  }
  finishIfNeeded(room);
  return room;
}

function applySwap(room, uid, from, to, seq = 0) {
  normalizeRoomLifecycle(room);
  finishIfNeeded(room);
  if (room.status === "finished") {
    return {
      ok: false,
      message: "对局已结束"
    };
  }

  if (room.status === "waiting_ready") {
    return {
      ok: false,
      message: "请先确认准备，等待双方就绪后开战"
    };
  }

  if (getReadySeconds(room) > 0) {
    return {
      ok: false,
      message: "准备倒计时中，请稍后开战"
    };
  }

  if (!isInside(from) || !isInside(to) || !isAdjacent(from, to)) {
    return {
      ok: false,
      message: "只能交换相邻方块"
    };
  }

  const self = room.players.find((player) => player.uid === uid);
  const opponent = room.players.find((player) => player.uid !== uid);

  if (!self || !opponent) {
    return {
      ok: false,
      message: "玩家不在房间内"
    };
  }

  swap(self.board, from, to);
  const result = resolveBoard(self.board, () => nextRoomRandom(room), { from, to });

  if (result.totalCleared === 0) {
    swap(self.board, from, to);
    self.combo = 0;
    self.lastGain = 0;
    return {
      ok: false,
      message: "没有形成三消，已自动撤回"
    };
  }

  settleRemainingMatches(self.board, () => nextRoomRandom(room));
  refillBoardIfStuck(self.board, room);

  const attack = Math.min(
    MAX_ATTACK_PER_MOVE,
    Math.max(0, result.chain - 1) +
      Math.floor(Math.min(result.totalCleared, 16) / 8) +
      Math.min(1, Number(result.specialTriggered || 0))
  );
  self.score += result.scoreGain;
  self.combo = result.chain;
  self.lastGain = result.scoreGain;
  self.pressure = Math.max(0, self.pressure - 1);
  self.validMoveCount = Number(self.validMoveCount || 0) + 1;
  opponent.pressure += attack;
  room.version = Number(room.version || 1) + 1;
  const event = {
    uid,
    type: "swap",
    seq: Number(seq || 0),
    cleared: result.totalCleared,
    chain: result.chain,
    scoreGain: result.scoreGain,
    attack,
    specialTriggered: Number(result.specialTriggered || 0),
    specialCreated: Number(result.specialCreated || 0),
    at: Date.now()
  };
  room.events.unshift(event);
  room.events = room.events.slice(0, 12);

  finishIfNeeded(room);

  return {
    ok: true,
    message: attack > 0 ? `连锁攻击 +${attack}` : `消除得分 +${result.scoreGain}`,
    event,
    version: room.version,
    scoreGain: result.scoreGain,
    attack,
    board: cloneBoard(self.board)
  };
}

function getBotDifficultyProfile(difficulty) {
  const profiles = {
    easy: {
      idleGainMin: 18,
      idleGainMax: 42,
      mistakeGainMin: 8,
      mistakeGainMax: 20,
      mistakeChance: 0.14,
      chainChance: 0.14,
      burstChance: 0.06,
      attackChance: 0.42,
      varianceMin: 0.72,
      varianceMax: 1.2,
      allowedBehindMin: 260,
      allowedBehindMax: 520,
      overTargetAllowance: 220
    },
    normal: {
      idleGainMin: 24,
      idleGainMax: 55,
      mistakeGainMin: 10,
      mistakeGainMax: 24,
      mistakeChance: 0.1,
      chainChance: 0.22,
      burstChance: 0.1,
      attackChance: 0.52,
      varianceMin: 0.78,
      varianceMax: 1.28,
      allowedBehindMin: 180,
      allowedBehindMax: 420,
      overTargetAllowance: 320
    },
    hard: {
      idleGainMin: 30,
      idleGainMax: 68,
      mistakeGainMin: 12,
      mistakeGainMax: 28,
      mistakeChance: 0.07,
      chainChance: 0.3,
      burstChance: 0.14,
      attackChance: 0.6,
      varianceMin: 0.84,
      varianceMax: 1.34,
      allowedBehindMin: 120,
      allowedBehindMax: 320,
      overTargetAllowance: 420
    },
    expert: {
      idleGainMin: 36,
      idleGainMax: 78,
      mistakeGainMin: 14,
      mistakeGainMax: 32,
      mistakeChance: 0.05,
      chainChance: 0.38,
      burstChance: 0.18,
      attackChance: 0.68,
      varianceMin: 0.88,
      varianceMax: 1.42,
      allowedBehindMin: 80,
      allowedBehindMax: 260,
      overTargetAllowance: 520
    }
  };

  return profiles[difficulty] || profiles.normal;
}

function getBotScoreCurveProgress(elapsedRatio) {
  if (elapsedRatio <= 0) return 0;
  if (elapsedRatio < 0.16) {
    return 0.08 + elapsedRatio * 0.9;
  }
  if (elapsedRatio < 0.68) {
    return 0.22 + (elapsedRatio - 0.16) * 1.03;
  }
  if (elapsedRatio < 0.9) {
    return 0.76 + (elapsedRatio - 0.68) * 0.86;
  }
  return Math.min(1, 0.95 + (elapsedRatio - 0.9) * 0.5);
}

function applyBotMove(room) {
  normalizeRoomLifecycle(room);
  const bot = room.players.find((player) => player.isBot);
  const human = room.players.find((player) => !player.isBot);

  if (!bot || !human || room.status !== "playing") return null;
  if (getReadySeconds(room) > 0) return null;

  const botConfig = room.botConfig || {};
  const difficulty = String(botConfig.difficulty || "normal");
  const profile = getBotDifficultyProfile(difficulty);
  const targetMin = Math.max(0, Number(botConfig.targetScoreMin || 0));
  const targetMax = Math.max(targetMin, Number(botConfig.targetScoreMax || 0));
  const remainSeconds = getRemainSeconds(room);
  if (!Number(room.endsAt || 0) || remainSeconds <= 0) {
    finishIfNeeded(room);
    return null;
  }
  const totalSeconds = Math.max(1, getRoomRoundSeconds(room));
  const elapsedRatio = Math.max(0, Math.min(1, (totalSeconds - remainSeconds) / totalSeconds));
  const moveIntervalSeconds = Math.max(0.5, Number(botConfig.moveIntervalSeconds || 1.2));

  if (!Number.isFinite(bot.botTargetScore)) {
    const targetRange = Math.max(0, targetMax - targetMin);
    bot.botTargetScore = targetMax > 0
      ? targetMin + Math.round(targetRange * nextRoomRandom(room))
      : 2800 + Math.round(nextRoomRandom(room) * 900);
    bot.botTempoBias = 0.92 + nextRoomRandom(room) * 0.2;
  }

  const curveTarget = Number(bot.botTargetScore || targetMax || 0) * getBotScoreCurveProgress(elapsedRatio);
  const humanScore = Number(human.score || 0);
  const botScore = Number(bot.score || 0);
  const allowedBehind = profile.allowedBehindMin +
    (profile.allowedBehindMax - profile.allowedBehindMin) * nextRoomRandom(room);
  const pressureBoost = Math.min(0.18, Math.max(0, Number(bot.pressure || 0) - 8) * 0.012);
  const humanFollowTarget = humanScore > botScore + allowedBehind
    ? humanScore - allowedBehind * (0.7 + nextRoomRandom(room) * 0.45)
    : 0;
  const targetNow = Math.max(curveTarget, humanFollowTarget);
  const movesLeft = Math.max(1, remainSeconds / moveIntervalSeconds);
  const behindTarget = targetNow - botScore;
  const catchupGain = behindTarget > 0 ? behindTarget / Math.max(1, movesLeft * 0.72) : 0;
  const idleGain = profile.idleGainMin + nextRoomRandom(room) * (profile.idleGainMax - profile.idleGainMin);
  const tempo = Number(bot.botTempoBias || 1) + pressureBoost;
  const variance = profile.varianceMin + nextRoomRandom(room) * (profile.varianceMax - profile.varianceMin);
  let gain = Math.round(Math.max(idleGain, catchupGain) * tempo * variance);
  let chain = 1;
  let cleared = 3;
  let attack = 0;

  if (nextRoomRandom(room) < profile.mistakeChance) {
    gain = Math.round(profile.mistakeGainMin + nextRoomRandom(room) * (profile.mistakeGainMax - profile.mistakeGainMin));
  } else {
    const burst = nextRoomRandom(room) < profile.burstChance;
    const chainRoll = nextRoomRandom(room);
    if (burst) {
      chain = chainRoll > 0.35 ? 3 : 2;
      gain = Math.round(gain * (chain === 3 ? 1.18 : 1.08));
      cleared = chain === 3 ? 9 : 6;
    } else if (chainRoll < profile.chainChance) {
      chain = 2;
      cleared = 6;
    }
    attack = chain > 1 && nextRoomRandom(room) < profile.attackChance
      ? Math.min(MAX_ATTACK_PER_MOVE, chain === 3 ? 2 : 1)
      : 0;
  }

  const softCap = Number(bot.botTargetScore || 0) + profile.overTargetAllowance;
  if (softCap > 0 && botScore + gain * chain > softCap && humanScore < botScore) {
    gain = Math.max(profile.mistakeGainMin, Math.round((softCap - botScore) / Math.max(1, chain)));
    attack = Math.min(attack, 1);
  }

  const scoreGain = Math.max(profile.mistakeGainMin, gain) * chain;

  bot.score += scoreGain;
  bot.combo = chain;
  bot.lastGain = scoreGain;
  bot.validMoveCount = Number(bot.validMoveCount || 0) + 1;
  bot.pressure = Math.max(0, Number(bot.pressure || 0) - 1);
  human.pressure += attack;
  room.version = Number(room.version || 1) + 1;
  room.events.unshift({
    uid: bot.uid,
    type: "bot_move",
    cleared,
    chain,
    scoreGain,
    attack,
    at: Date.now()
  });
  room.events = room.events.slice(0, 12);

  finishIfNeeded(room);
  return bot;
}

function toPublicRoom(room, viewerUid = "") {
  normalizeRoomLifecycle(room);
  finishIfNeeded(room);
  const remainSeconds = getRemainSeconds(room);
  const readySeconds = getReadySeconds(room);
  const serverNow = Date.now();
  const shouldIncludeBoard = (player) => !viewerUid || player.uid === viewerUid;
  const publicEvents = (room.events || []).map((event) =>
    event?.type === "bot_move" ? { ...event, type: "score" } : event
  );

  return {
    roomNo: room.roomNo,
    mode: room.mode,
    version: Number(room.version || 1),
    status: room.status,
    remainSeconds,
    readySeconds,
    readyEndsAt: room.readyEndsAt || 0,
    waitingReadyEndsAt: room.waitingReadyEndsAt || 0,
    serverNow,
    timing: getRoomTiming(room),
    winnerUid: room.winnerUid,
    finishReason: room.finishReason || "",
    players: room.players.map((player) => {
      const publicPlayer = {
        uid: player.uid,
        nickname: player.nickname,
        piUsername: player.piUsername || "",
        avatarUrl: player.avatarUrl || "",
        avatarKey: player.avatarKey || "avatar_1",
        score: player.score,
        pressure: player.pressure,
        combo: player.combo,
        lastGain: player.lastGain,
        joinedAt: Number(player.joinedAt || 0),
        readyAt: Number(player.readyAt || 0),
        disconnectedAt: Number(player.disconnectedAt || 0),
        validMoveCount: Number(player.validMoveCount || 0)
      };

      if (shouldIncludeBoard(player)) {
        publicPlayer.board = player.board;
      }

      return publicPlayer;
    }),
    events: publicEvents
  };
}

module.exports = {
  BOARD_COLUMNS,
  BOARD_ROWS,
  COLOR_COUNT,
  PRESSURE_LIMIT,
  READY_SECONDS,
  WAITING_READY_TIMEOUT_SECONDS,
  createBoard,
  findMatches,
  hasValidMove,
  resolveBoard,
  createRealtimeRoom,
  markPlayerJoined,
  markPlayerReady,
  markPlayerDisconnected,
  applySwap,
  applyBotMove,
  tickRoom,
  toPublicRoom
};
