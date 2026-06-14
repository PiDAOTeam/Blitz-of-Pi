const crypto = require("node:crypto");
const {
  ASSET_GATEWAY_APP_KEY,
  ASSET_GATEWAY_APP_SECRET,
  ASSET_GATEWAY_BASE_URL,
  ASSET_GATEWAY_ENABLED,
  ASSET_GATEWAY_TIMEOUT_MS
} = require("../config");
const { recordExternalDependencyResult } = require("./external-health.service");

const SUPPORTED_REMOTE_ASSETS = new Set(["POINTS", "POC"]);
const SUMMARY_CACHE_TTL_MS = 15_000;
const TRANSIENT_RETRY_LOG_INTERVAL_MS = 60_000;
const summaryCache = new Map();
const transientRetryLogState = new Map();

function normalizeAssetType(assetType = "") {
  return String(assetType || "").trim().toUpperCase();
}

function normalizeAmount(assetType, amount) {
  const normalizedAssetType = normalizeAssetType(assetType);
  const value = Number(amount);

  if (!Number.isFinite(value) || value < 0) {
    throw new Error("资产金额无效");
  }

  if (normalizedAssetType === "POINTS") {
    if (!Number.isInteger(value)) {
      throw new Error("积分场门票必须是整数，不能填写小数");
    }
    return value;
  }

  return Number(value.toFixed(6));
}

function getGatewayUrl(action) {
  const base = String(ASSET_GATEWAY_BASE_URL || "").replace(/\/$/, "");
  if (!base) {
    throw new Error("资产网关地址未配置");
  }
  return `${base}/${encodeURIComponent(action)}`;
}

function isTransientGatewayError(error) {
  const name = String(error?.name || "");
  const message = String(error?.message || "");
  return (
    name === "AbortError" ||
    /fetch failed|network|timeout|aborted|ECONNRESET|ETIMEDOUT|EAI_AGAIN/i.test(message)
  );
}

function createGatewayBusyError(cause = null) {
  const error = new Error("资产网络繁忙，请稍后重试");
  error.expectedBusinessError = true;
  error.businessCode = 1701;
  if (cause) {
    error.cause = cause;
  }
  return error;
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeGatewayErrorMessage(error) {
  const name = String(error?.name || "");
  const message = String(error?.message || "");
  if (name === "AbortError" || /aborted|timeout|timed out/i.test(message)) {
    return "timeout";
  }
  if (/ECONNRESET|ETIMEDOUT|EAI_AGAIN|network|fetch failed/i.test(message)) {
    return "network";
  }
  return message || name || "network";
}

function logTransientRetry(action, attempt, error) {
  const key = `${action}:${normalizeGatewayErrorMessage(error)}`;
  const now = Date.now();
  const state = transientRetryLogState.get(key) || { lastAt: 0, suppressed: 0 };

  if (now - state.lastAt >= TRANSIENT_RETRY_LOG_INTERVAL_MS) {
    const suppressedText = state.suppressed > 0 ? `, suppressed=${state.suppressed}` : "";
    console.warn(
      `[asset-gateway] ${action} transient failure, retrying (${attempt}/2): ${normalizeGatewayErrorMessage(error)}${suppressedText}`
    );
    transientRetryLogState.set(key, { lastAt: now, suppressed: 0 });
    return;
  }

  state.suppressed += 1;
  transientRetryLogState.set(key, state);
}

function assertGatewayReady(assetType) {
  const normalizedAssetType = normalizeAssetType(assetType);

  if (!SUPPORTED_REMOTE_ASSETS.has(normalizedAssetType)) {
    throw new Error(`资产类型 ${assetType} 不支持远程网关`);
  }
  if (!ASSET_GATEWAY_ENABLED) {
    throw new Error("资产网关未开启，请先在后台开启资产同步");
  }
  if (!ASSET_GATEWAY_APP_KEY || !ASSET_GATEWAY_APP_SECRET) {
    throw new Error("资产网关密钥未配置");
  }
}

async function callGateway(action, payload) {
  const rawBody = JSON.stringify(payload || {});
  const url = getGatewayUrl(action);
  const parsedUrl = new URL(url);
  const requestPath = `${parsedUrl.pathname}${parsedUrl.search || ""}`;
  const timeoutMs = Math.max(1000, Number(ASSET_GATEWAY_TIMEOUT_MS || 8000));
  let lastError = null;

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    const startedAt = Date.now();
    const timestamp = String(Math.floor(Date.now() / 1000));
    const nonce = crypto.randomBytes(12).toString("hex");
    const signing = `POST${requestPath}${timestamp}${nonce}${rawBody}`;
    const signature = crypto.createHmac("sha256", ASSET_GATEWAY_APP_SECRET).update(signing).digest("hex");
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Asset-App-Key": ASSET_GATEWAY_APP_KEY,
          "X-Asset-Timestamp": timestamp,
          "X-Asset-Nonce": nonce,
          "X-Asset-Signature": signature
        },
        body: rawBody,
        signal: controller.signal
      });
      const text = await response.text();
      let data;

      try {
        data = text ? JSON.parse(text) : {};
      } catch (error) {
        const gatewayError = new Error("资产网关暂时不可用，请稍后重试");
        gatewayError.expectedBusinessError = true;
        gatewayError.cause = error;
        gatewayError.gatewaySnippet = text.slice(0, 120);
        throw gatewayError;
      }

      if (!response.ok || Number(data.code) !== 0) {
        throw new Error(data.msg || `资产网关请求失败: HTTP ${response.status}`);
      }

      recordExternalDependencyResult({
        provider: "asset-gateway",
        action,
        ok: true,
        startedAt,
        detail: { attempt }
      }).catch(() => {});
      return data.data || {};
    } catch (error) {
      lastError = error;
      const transient = isTransientGatewayError(error);
      if (attempt >= 2 || !transient) {
        recordExternalDependencyResult({
          provider: "asset-gateway",
          action,
          ok: false,
          startedAt,
          error,
          detail: { attempt, transient }
        }).catch(() => {});
        if (transient) {
          throw createGatewayBusyError(error);
        }
        throw error;
      }
      logTransientRetry(action, attempt, error);
      await wait(300);
    } finally {
      clearTimeout(timer);
    }
  }

  throw lastError && isTransientGatewayError(lastError) ? createGatewayBusyError(lastError) : lastError || new Error("资产网关请求失败");
}

function buildIdentity(user = {}) {
  const piUid = String(user.piUserId || user.pi_user_id || "").trim();
  const piUsername = String(user.piUsername || user.pi_username || user.nickname || "").trim();

  if (!piUid && !piUsername) {
    throw new Error("当前账号缺少 Pi UID/用户名，不能进入积分/POC 场");
  }

  return {
    pi_uid: piUid,
    pi_username: piUsername
  };
}

function getSummaryCacheKey(user = {}) {
  const identity = buildIdentity(user);
  return identity.pi_uid ? `uid:${identity.pi_uid}` : `username:${identity.pi_username.toLowerCase()}`;
}

async function summary(user) {
  assertGatewayReady("POINTS");
  const cacheKey = getSummaryCacheKey(user);
  const cached = summaryCache.get(cacheKey);
  if (cached && Date.now() - cached.cachedAt <= SUMMARY_CACHE_TTL_MS) {
    return cached.data;
  }

  const data = await callGateway("summary", buildIdentity(user));
  summaryCache.set(cacheKey, {
    cachedAt: Date.now(),
    data
  });
  if (summaryCache.size > 1000) {
    const oldestKey = summaryCache.keys().next().value;
    summaryCache.delete(oldestKey);
  }
  return data;
}

async function watchNodeSnapshot() {
  assertGatewayReady("POINTS");
  return callGateway("watchnodesnapshot", {});
}

async function freeze({ assetType, user, roomNo, amount, idempotencyKey, remark = "" }) {
  const normalizedAssetType = normalizeAssetType(assetType);
  assertGatewayReady(normalizedAssetType);
  const normalizedAmount = normalizeAmount(normalizedAssetType, amount);

  if (normalizedAmount <= 0) {
    throw new Error("冻结金额必须大于0");
  }

  return callGateway("freeze", {
    ...buildIdentity(user),
    asset_type: normalizedAssetType,
    external_order_no: roomNo,
    idempotency_key: idempotencyKey,
    amount: normalizedAmount,
    remark
  });
}

async function release({ assetType, user, roomNo, amount = 0, idempotencyKey, remark = "" }) {
  const normalizedAssetType = normalizeAssetType(assetType);
  assertGatewayReady(normalizedAssetType);

  return callGateway("release", {
    ...buildIdentity(user),
    asset_type: normalizedAssetType,
    external_order_no: roomNo,
    idempotency_key: idempotencyKey,
    amount: normalizeAmount(normalizedAssetType, amount),
    remark
  });
}

async function settle({
  assetType,
  roomNo,
  winner,
  loser,
  entryAmount,
  rewardAmount,
  platformFeeAmount,
  idempotencyKey,
  remark = ""
}) {
  const normalizedAssetType = normalizeAssetType(assetType);
  assertGatewayReady(normalizedAssetType);
  const winnerIdentity = buildIdentity(winner);
  const loserIdentity = buildIdentity(loser);

  return callGateway("settle", {
    asset_type: normalizedAssetType,
    external_order_no: roomNo,
    idempotency_key: idempotencyKey,
    winner_pi_uid: winnerIdentity.pi_uid,
    winner_pi_username: winnerIdentity.pi_username,
    loser_pi_uid: loserIdentity.pi_uid,
    loser_pi_username: loserIdentity.pi_username,
    entry_amount: normalizeAmount(normalizedAssetType, entryAmount),
    reward_amount: normalizeAmount(normalizedAssetType, rewardAmount),
    platform_fee_amount: normalizeAmount(normalizedAssetType, platformFeeAmount),
    remark
  });
}

async function botSettle({
  assetType,
  roomNo,
  user,
  userResult,
  entryAmount,
  rewardAmount,
  platformFeeAmount,
  idempotencyKey,
  remark = ""
}) {
  const normalizedAssetType = normalizeAssetType(assetType);
  assertGatewayReady(normalizedAssetType);
  const userIdentity = buildIdentity(user);

  return callGateway("botsettle", {
    asset_type: normalizedAssetType,
    external_order_no: roomNo,
    idempotency_key: idempotencyKey,
    user_pi_uid: userIdentity.pi_uid,
    user_pi_username: userIdentity.pi_username,
    user_result: userResult,
    entry_amount: normalizeAmount(normalizedAssetType, entryAmount),
    reward_amount: normalizeAmount(normalizedAssetType, rewardAmount),
    platform_fee_amount: normalizeAmount(normalizedAssetType, platformFeeAmount),
    remark
  });
}

async function reward({ assetType, user, orderNo, amount, idempotencyKey, remark = "" }) {
  const normalizedAssetType = normalizeAssetType(assetType);
  assertGatewayReady(normalizedAssetType);
  const normalizedAmount = normalizeAmount(normalizedAssetType, amount);

  if (normalizedAmount <= 0) {
    throw new Error("发奖金额必须大于0");
  }

  return callGateway("reward", {
    ...buildIdentity(user),
    asset_type: normalizedAssetType,
    external_order_no: orderNo,
    idempotency_key: idempotencyKey,
    amount: normalizedAmount,
    remark
  });
}

module.exports = {
  SUPPORTED_REMOTE_ASSETS,
  botSettle,
  buildIdentity,
  freeze,
  normalizeAmount,
  normalizeAssetType,
  release,
  reward,
  settle,
  summary,
  watchNodeSnapshot
};
