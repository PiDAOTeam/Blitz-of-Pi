// 从未连上 realtime 的付费房判定。只决定「能不能退票」，不碰结算入账。

const DEFAULT_WAITING_READY_TIMEOUT_MS = 30_000;
const DEFAULT_JOIN_GRACE_MS = 15_000;

function parseTimeMs(value) {
  if (value instanceof Date) {
    const ms = value.getTime();
    return Number.isFinite(ms) ? ms : 0;
  }
  if (typeof value === "number") {
    return Number.isFinite(value) && value > 0 ? value : 0;
  }
  const raw = String(value || "").trim();
  if (!raw) return 0;
  const asNumber = Number(raw);
  if (Number.isFinite(asNumber) && asNumber > 1e11) return asNumber;
  const parsed = Date.parse(raw);
  return Number.isFinite(parsed) ? parsed : 0;
}

function isPaidBattle(battleOrRoom = {}) {
  if (Number(battleOrRoom.entry_fee || battleOrRoom.entryFee || 0) > 0) return true;
  const mode = String(battleOrRoom.mode || "");
  return Boolean(mode) && mode !== "quick_battle";
}

function isRealtimeMatchStarted(room) {
  if (!room) return false;
  if (room.status === "finished") return true;
  if (room.startedAt || room.readyEndsAt || room.endsAt) return true;
  if (room.status === "playing" && (room.players || []).some((player) => Number(player.readyAt || 0) > 0)) {
    return true;
  }
  return false;
}

function getWaitingReadyDeadlineMs(room, timeoutMs = DEFAULT_WAITING_READY_TIMEOUT_MS) {
  const stamped = Number(room?.waitingReadyEndsAt || 0);
  if (stamped > 0) return stamped;
  const created = parseTimeMs(room?.createdAt || room?.created_at);
  return created > 0 ? created + timeoutMs : 0;
}

function isWaitingReadyLifecycleTimedOut(room, now = Date.now()) {
  if (!room) return false;
  if (room.status === "waiting_ready") {
    const deadline = Number(room.waitingReadyEndsAt || 0);
    return deadline > 0 && now >= deadline;
  }
  if (room.status === "playing" && isPaidBattle(room) && !isRealtimeMatchStarted(room)) {
    const deadline = getWaitingReadyDeadlineMs(room);
    return deadline > 0 && now >= deadline;
  }
  return false;
}

function shouldReconcileUnjoinedPaidRoom({
  battle,
  baseRoom,
  realtimeRoom,
  now = Date.now(),
  joinGraceMs = DEFAULT_JOIN_GRACE_MS
} = {}) {
  if (!battle || Number(battle.entry_fee || 0) <= 0) return false;
  if (String(battle.status || "") !== "playing") return false;
  if (String(battle.asset_settlement_status || "") !== "frozen") return false;
  if (isRealtimeMatchStarted(realtimeRoom)) return false;

  if (realtimeRoom?.status === "waiting_ready") {
    const deadline = Number(realtimeRoom.waitingReadyEndsAt || 0);
    return deadline > 0 && now >= deadline + Math.min(joinGraceMs, 5_000);
  }

  const source = baseRoom || battle;
  const deadline = getWaitingReadyDeadlineMs(source);
  if (!deadline) return false;
  return now >= deadline + joinGraceMs;
}

module.exports = {
  DEFAULT_WAITING_READY_TIMEOUT_MS,
  DEFAULT_JOIN_GRACE_MS,
  parseTimeMs,
  isPaidBattle,
  isRealtimeMatchStarted,
  getWaitingReadyDeadlineMs,
  isWaitingReadyLifecycleTimedOut,
  shouldReconcileUnjoinedPaidRoom
};
