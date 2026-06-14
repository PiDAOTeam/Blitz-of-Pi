const { redisGet, redisPushJsonList, redisReadJsonList, redisSet } = require("../db/redis");

const HEALTH_KEY_PREFIX = "blitz:external-health:";
const HEALTH_RECENT_KEY = "blitz:external-health:recent";
const HEALTH_TTL_SECONDS = 86400 * 3;

function nowIso() {
  return new Date().toISOString();
}

function toKey(provider, action) {
  return `${HEALTH_KEY_PREFIX}${String(provider || "unknown")}:${String(action || "default")}`;
}

function normalizeError(error) {
  const message = error?.message || error?.name || String(error || "");
  return String(message || "unknown").slice(0, 180);
}

async function readHealthEntry(provider, action) {
  const raw = await redisGet(toKey(provider, action));
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function recordExternalDependencyResult({
  provider,
  action = "default",
  ok,
  startedAt = Date.now(),
  error = null,
  detail = {}
}) {
  const normalizedProvider = String(provider || "unknown");
  const normalizedAction = String(action || "default");
  const latencyMs = Math.max(0, Date.now() - Number(startedAt || Date.now()));
  const previous = await readHealthEntry(normalizedProvider, normalizedAction);
  const at = nowIso();
  const next = {
    provider: normalizedProvider,
    action: normalizedAction,
    status: ok ? "ok" : "error",
    totalCount: Number(previous?.totalCount || 0) + 1,
    successCount: Number(previous?.successCount || 0) + (ok ? 1 : 0),
    failureCount: Number(previous?.failureCount || 0) + (ok ? 0 : 1),
    consecutiveFailures: ok ? 0 : Number(previous?.consecutiveFailures || 0) + 1,
    lastLatencyMs: latencyMs,
    lastCheckedAt: at,
    lastSuccessAt: ok ? at : previous?.lastSuccessAt || "",
    lastFailureAt: ok ? previous?.lastFailureAt || "" : at,
    lastError: ok ? "" : normalizeError(error),
    detail: detail || {}
  };

  await redisSet(toKey(normalizedProvider, normalizedAction), JSON.stringify(next), HEALTH_TTL_SECONDS);
  if (!ok) {
    await redisPushJsonList(
      HEALTH_RECENT_KEY,
      {
        provider: normalizedProvider,
        action: normalizedAction,
        at,
        latencyMs,
        error: next.lastError
      },
      { maxLength: 80, seconds: HEALTH_TTL_SECONDS }
    );
  }
}

async function readExternalDependencyHealth() {
  const targets = [
    ["pi-platform", "request"],
    ["asset-gateway", "summary"],
    ["asset-gateway", "freeze"],
    ["asset-gateway", "settle"],
    ["asset-gateway", "botsettle"],
    ["asset-gateway", "release"],
    ["asset-gateway", "reward"],
    ["asset-gateway", "watchnodesnapshot"]
  ];

  const entries = await Promise.all(
    targets.map(async ([provider, action]) => {
      const item = await readHealthEntry(provider, action);
      return (
        item || {
          provider,
          action,
          status: "unknown",
          totalCount: 0,
          successCount: 0,
          failureCount: 0,
          consecutiveFailures: 0,
          lastLatencyMs: 0,
          lastCheckedAt: "",
          lastSuccessAt: "",
          lastFailureAt: "",
          lastError: ""
        }
      );
    })
  );

  const recentFailures = await redisReadJsonList(HEALTH_RECENT_KEY, 20);

  return {
    checkedAt: nowIso(),
    items: entries,
    recentFailures
  };
}

module.exports = {
  readExternalDependencyHealth,
  recordExternalDependencyResult
};
