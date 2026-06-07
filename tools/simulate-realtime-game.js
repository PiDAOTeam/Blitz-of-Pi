const {
  BOARD_COLUMNS,
  BOARD_ROWS,
  createRealtimeRoom,
  applySwap,
  toPublicRoom,
  findMatches,
  hasValidMove
} = require("../services/realtime/src/game-engine");

function createBaseRoom(index) {
  return {
    roomNo: `sim_room_${Date.now()}_${index}`,
    mode: "quick_battle",
    players: [
      { uid: `sim_a_${index}`, nickname: "玩家A" },
      { uid: `sim_b_${index}`, nickname: "玩家B" }
    ]
  };
}

function listValidMoves(board) {
  const moves = [];

  for (let row = 0; row < BOARD_ROWS; row += 1) {
    for (let col = 0; col < BOARD_COLUMNS; col += 1) {
      const from = { row, col };
      const candidates = [
        { row, col: col + 1 },
        { row: row + 1, col }
      ];

      for (const to of candidates) {
        if (to.row >= BOARD_ROWS || to.col >= BOARD_COLUMNS) continue;
        const next = board.map((line) => [...line]);
        const value = next[from.row][from.col];
        next[from.row][from.col] = next[to.row][to.col];
        next[to.row][to.col] = value;
        if (findMatches(next).size > 0) {
          moves.push({ from, to });
        }
      }
    }
  }

  return moves;
}

function runSimulation(roomCount = 200, maxMovesPerRoom = 60) {
  const stats = {
    rooms: roomCount,
    moves: 0,
    maxGain: 0,
    maxCleared: 0,
    maxChain: 0,
    maxAttack: 0,
    noMoveBoards: 0,
    invalidInitialBoards: 0
  };

  for (let index = 0; index < roomCount; index += 1) {
    const room = createRealtimeRoom(createBaseRoom(index));
    room.readyEndsAt = Date.now() - 1;
    room.endsAt = Date.now() + 90_000;

    for (const player of room.players) {
      if (findMatches(player.board).size > 0) {
        stats.invalidInitialBoards += 1;
      }
      if (!hasValidMove(player.board)) {
        stats.noMoveBoards += 1;
      }
    }

    for (let move = 0; move < maxMovesPerRoom && room.status === "playing"; move += 1) {
      const player = room.players[move % 2];
      let moves = listValidMoves(player.board);

      if (moves.length === 0) {
        stats.noMoveBoards += 1;
        break;
      }

      const selected = moves[(index * 17 + move * 7) % moves.length];
      const result = applySwap(room, player.uid, selected.from, selected.to);

      if (!result.ok) {
        throw new Error(`valid move rejected at room ${index}, move ${move}: ${result.message}`);
      }

      const event = room.events[0];
      if (!event || event.uid !== player.uid || event.at <= 0) {
        throw new Error(`missing event at room ${index}, move ${move}`);
      }

      stats.moves += 1;
      stats.maxGain = Math.max(stats.maxGain, event.scoreGain);
      stats.maxCleared = Math.max(stats.maxCleared, event.cleared);
      stats.maxChain = Math.max(stats.maxChain, event.chain);
      stats.maxAttack = Math.max(stats.maxAttack, event.attack);

      const publicRoom = toPublicRoom(room);
      const self = publicRoom.players.find((item) => item.uid === player.uid);
      if (!self || self.score < 0 || self.pressure < 0) {
        throw new Error(`invalid public state at room ${index}, move ${move}`);
      }
    }
  }

  return stats;
}

const stats = runSimulation(Number(process.argv[2] || 200), Number(process.argv[3] || 60));
console.log(JSON.stringify(stats, null, 2));

if (stats.invalidInitialBoards > 0) {
  throw new Error(`初始棋盘存在自然三连：${stats.invalidInitialBoards}`);
}

if (stats.maxGain > 260) {
  throw new Error(`单步得分过高：${stats.maxGain}`);
}

if (stats.maxAttack > 4) {
  throw new Error(`单步攻击过高：${stats.maxAttack}`);
}
