const { redisGet, redisSet, redisPushJsonList, redisReadJsonList } = require("../db/redis");

const RECENT_EVENTS_KEY = "blitz:battle-observer:recent";
const DAILY_COUNTER_PREFIX = "blitz:battle-observer:daily:";
const RECENT_EVENT_LIMIT = 120;
const RECENT_EVENT_TTL_SECONDS = 86400;
const DAILY_COUNTER_TTL_SECONDS = 172800;

function getDayKey(date = new Date()) {
  return date.toISOString().slice(0, 10).replaceAll("-", "");
}

function cleanValue(value, maxLength = 80) {
  return String(value || "").slice(0, maxLength);
}

function buildEvent(stage, detail = {}) {
  const now = Date.now();
  return {
    stage: cleanValue(stage, 40),
    at: now,
    roomNo: cleanValue(detail.roomNo, 80),
    uid: cleanValue(detail.uid, 80),
    mode: cleanValue(detail.mode, 32),
    status: cleanValue(detail.status, 32),
    result: cleanValue(detail.result, 32),
    message: cleanValue(detail.message, 120),
    costMs: Number(detail.costMs || 0),
    latencyMs: Number(detail.latencyMs || 0),
    queueLength: Number(detail.queueLength || 0),
    waitingSeconds: Number(detail.waitingSeconds || 0),
    screen: cleanValue(detail.screen, 32),
    network: cleanValue(detail.network, 32),
    seq: Number(detail.seq || 0),
    clientAt: Number(detail.clientAt || 0),
    instanceId: cleanValue(detail.instanceId, 32),
    source: cleanValue(detail.source || "api", 16)
  };
}

async function observeBattleStage(stage, detail = {}) {
  const event = buildEvent(stage, detail);
  await redisPushJsonList(RECENT_EVENTS_KEY, event, {
    maxLength: RECENT_EVENT_LIMIT,
    seconds: RECENT_EVENT_TTL_SECONDS
  });

  const dayKey = `${DAILY_COUNTER_PREFIX}${getDayKey()}:${event.stage}`;
  const current = Number((await redisGet(dayKey)) || 0);
  await redisSet(dayKey, String(current + 1), DAILY_COUNTER_TTL_SECONDS);
  return event;
}

async function readBattleObserverSnapshot() {
  const events = await redisReadJsonList(RECENT_EVENTS_KEY, 40);
  const stages = [
    "match_queue_join",
    "match_room_created",
    "match_status_room_created",
    "match_bot_room_created",
    "match_cancel",
    "match_watch_join",
    "match_watch_failed",
    "realtime_join",
    "realtime_ready",
    "realtime_started",
    "realtime_swap_event",
    "realtime_swap_ok",
    "realtime_swap_error",
    "realtime_disconnected",
    "realtime_finished",
    "realtime_tick_slow",
    "realtime_tick_skipped",
    "realtime_broadcast_slow",
    "settlement_queued",
    "settlement_done",
    "settlement_retry",
    "client_match_start",
    "client_match_queueing",
    "client_match_ws_open",
    "client_match_ws_ready",
    "client_match_ws_error",
    "client_match_ws_closed",
    "client_match_poll_failed",
    "client_match_enter_room",
    "client_match_start_failed",
    "client_match_cancel",
    "client_match_cancel_failed",
    "client_realtime_connect_start",
    "client_realtime_open",
    "client_realtime_first_state",
    "client_realtime_connect_slow",
    "client_realtime_slow",
    "client_realtime_retry",
    "client_realtime_retry_failed",
    "client_realtime_error",
    "client_realtime_closed",
    "client_swap_send",
    "client_swap_rejected",
    "client_burst_show",
    "client_burst_suppressed",
    "client_error"
  ];
  const day = getDayKey();
  const counters = {};

  await Promise.all(
    stages.map(async (stage) => {
      counters[stage] = Number((await redisGet(`${DAILY_COUNTER_PREFIX}${day}:${stage}`)) || 0);
    })
  );

  return {
    updatedAt: Date.now(),
    counters,
    recentEvents: events
  };
}

module.exports = {
  observeBattleStage,
  readBattleObserverSnapshot
};
