// 预测同步：ack / 1Hz room_state 有未确认步时，保留或叠回本地己方棋盘。
// 不改结算权威：拒步、快照、终局一律用服务器房间。

import {
  clientCloneBoard,
  clientIsInside,
  clientSwap,
  clientCreateRandom,
  clientResolveBoard,
  clientSettleRemainingMatches,
  clientRefillBoardIfStuck
} from "./match3-engine.js";

export function shouldPreservePredictedSelf({ reason, pendingCount, status } = {}) {
  return (reason === "ack" || reason === "state") && Number(pendingCount || 0) > 0 && status === "playing";
}

export function shouldClearAllPending(reason, status) {
  return reason === "reject" || reason === "snapshot" || status === "finished";
}

export function isPendingFullyResolved({ pendingSeqs = [], latestEventSeq = 0, finished = false } = {}) {
  if (finished) return true;
  const lastPending = (pendingSeqs || []).reduce((max, seq) => Math.max(max, Number(seq || 0)), 0);
  if (!lastPending) return false;
  return Number(latestEventSeq || 0) >= lastPending;
}

export function isBenignSwapReject(payload = {}) {
  const code = String(payload.reasonCode || payload.reason || "");
  return code === "duplicate_seq" || code === "rate_limited" || payload.reason === "duplicate_seq";
}

export function previewSwapOnBoard(board, from, to, seq, meta = {}) {
  if (!board || !clientIsInside(board, from) || !clientIsInside(board, to)) return null;
  const next = clientCloneBoard(board);
  clientSwap(next, from, to);
  const rng = clientCreateRandom(`${meta.roomNo || ""}:${meta.version || 0}:${seq}`);
  const resolved = clientResolveBoard(next, rng, { from, to });
  if (!resolved.totalCleared) return null;
  clientSettleRemainingMatches(next, rng);
  clientRefillBoardIfStuck(next, { roomNo: meta.roomNo || "", version: meta.version || 0 });
  const attack = Math.min(4, Math.max(0, resolved.chain - 1) + Math.floor(Math.min(resolved.totalCleared, 16) / 8) + Math.min(1, Number(resolved.specialTriggered || 0)));
  return {
    board: next,
    cleared: resolved.totalCleared,
    chain: resolved.chain,
    scoreGain: resolved.scoreGain,
    attack,
    specialTriggered: Number(resolved.specialTriggered || 0),
    specialCreated: Number(resolved.specialCreated || 0),
    specialFx: resolved.specialFx || [],
    specialBirths: resolved.specialBirths || [],
    firstClears: resolved.firstClears || [],
    firstFalls: resolved.firstFalls || [],
    afterFirstCollapse: resolved.afterFirstCollapse || next
  };
}

export function rebasePendingPredictions(basePlayer, pendingSwaps = [], meta = {}) {
  let board = clientCloneBoard(basePlayer?.board || []);
  let extraScore = 0;
  let extraAttack = 0;
  let lastCombo = Number(basePlayer?.combo || 0);
  let lastGain = Number(basePlayer?.lastGain || 0);
  const applied = [];
  for (const swap of pendingSwaps) {
    const from = swap.from || swap.positions?.[0];
    const to = swap.to || swap.positions?.[1];
    const preview = previewSwapOnBoard(board, from, to, swap.seq, meta);
    if (!preview) continue;
    board = preview.board;
    extraScore += Number(preview.scoreGain || 0);
    extraAttack += Number(preview.attack || 0);
    lastCombo = preview.chain;
    lastGain = preview.scoreGain;
    applied.push(Number(swap.seq || 0));
  }
  return { board, extraScore, extraAttack, lastCombo, lastGain, applied };
}

export function mergeAuthoritativeRoom(currentRoom, incomingRoom, uid, { reason, pendingCount, pendingSwaps } = {}) {
  if (!incomingRoom) return { room: incomingRoom, preserved: false, rebased: false };
  const incomingSelf = incomingRoom.players?.find((player) => player.uid === uid);
  const swaps = Array.isArray(pendingSwaps) ? pendingSwaps : [];
  if (reason === "ack" && incomingRoom.status === "playing" && incomingSelf?.board && swaps.length) {
    const rebased = rebasePendingPredictions(incomingSelf, swaps, {
      roomNo: incomingRoom.roomNo,
      version: incomingRoom.version
    });
    const incomingFoe = incomingRoom.players?.find((player) => player.uid !== uid);
    return {
      room: {
        ...incomingRoom,
        players: (incomingRoom.players || []).map((player) => {
          if (player.uid === uid) {
            return {
              ...player,
              board: rebased.board,
              score: Number(incomingSelf.score || 0) + rebased.extraScore,
              combo: rebased.lastCombo,
              lastGain: rebased.lastGain,
              pressure: Math.max(0, Number(incomingSelf.pressure || 0) - rebased.applied.length)
            };
          }
          if (incomingFoe && player.uid === incomingFoe.uid) {
            return { ...player, pressure: Number(player.pressure || 0) + rebased.extraAttack };
          }
          return player;
        })
      },
      preserved: true,
      rebased: true
    };
  }
  if (!shouldPreservePredictedSelf({ reason, pendingCount, status: incomingRoom.status })) {
    return { room: incomingRoom, preserved: false, rebased: false };
  }
  const self = currentRoom?.players?.find((player) => player.uid === uid);
  if (!self?.board) return { room: incomingRoom, preserved: false, rebased: false };
  return {
    room: {
      ...incomingRoom,
      players: (incomingRoom.players || []).map((player) => player.uid !== uid ? player : {
        ...player,
        board: clientCloneBoard(self.board),
        score: self.score,
        combo: self.combo,
        lastGain: self.lastGain,
        pressure: self.pressure
      })
    },
    preserved: true,
    rebased: false
  };
}
