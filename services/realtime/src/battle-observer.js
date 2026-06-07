const { REALTIME_INSTANCE_ID } = require("./config");
const { redisGet, redisSet, redisPushJsonList } = require("./redis");

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

async function observeBattleStage(stage, detail = {}) {
  const event = {
    stage: cleanValue(stage, 40),
    at: Date.now(),
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
    instanceId: cleanValue(detail.instanceId || REALTIME_INSTANCE_ID, 32),
    source: "realtime"
  };

  await redisPushJsonList(RECENT_EVENTS_KEY, event, {
    maxLength: RECENT_EVENT_LIMIT,
    seconds: RECENT_EVENT_TTL_SECONDS
  });

  const dayKey = `${DAILY_COUNTER_PREFIX}${getDayKey()}:${event.stage}`;
  const current = Number((await redisGet(dayKey)) || 0);
  await redisSet(dayKey, String(current + 1), DAILY_COUNTER_TTL_SECONDS);
  return event;
}

module.exports = {
  observeBattleStage
};
