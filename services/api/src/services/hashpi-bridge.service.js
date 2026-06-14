const {
  HASHPI_BRIDGE_BASE_URL,
  HASHPI_BRIDGE_ENABLED,
  HASHPI_BRIDGE_TIMEOUT_MS
} = require("../config");
const { readGameConfig } = require("../repositories/game-config.repository");

function getBridgeUrl(action) {
  const base = String(HASHPI_BRIDGE_BASE_URL || "").replace(/\/$/, "");
  if (!base) {
    throw new Error("HashPi 桥接地址未配置");
  }
  return `${base}/${encodeURIComponent(action)}`;
}

function normalizeBridgeUser(payload = {}) {
  const user = payload.user || payload;
  const hashpiUserId = String(user.hashpi_user_id || user.user_id || user.id || "").trim();
  const piUserId = String(user.pi_uid || user.pi_user_id || user.openid || "").trim();
  const piUsername = String(user.pi_username || user.username || user.user_name || "").trim();
  const nickname = String(user.nickname || user.name || piUsername || `HashPi${hashpiUserId}`).trim();
  const avatarUrl = String(user.avatar || user.avatar_url || user.photo || "").trim();

  if (!hashpiUserId) {
    throw new Error("HashPi 桥接返回缺少用户ID");
  }

  return {
    hashpiUserId,
    piUserId,
    piUsername,
    nickname,
    avatarUrl
  };
}

async function verifyHashPiBridgeTicket(ticket) {
  if (!HASHPI_BRIDGE_ENABLED) {
    throw new Error("HashPi APP 接入暂未开启");
  }

  const gameConfig = await readGameConfig();
  if (gameConfig.hashPiAppBridge?.enabled === false) {
    throw new Error("HashPi APP 接入暂未开启");
  }

  const safeTicket = String(ticket || "").trim();
  if (!safeTicket) {
    throw new Error("缺少 HashPi 登录票据");
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), Math.max(1000, HASHPI_BRIDGE_TIMEOUT_MS));

  try {
    const response = await fetch(getBridgeUrl("consumeBlitzBridgeTicket"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ ticket: safeTicket }),
      signal: controller.signal
    });
    const text = await response.text();
    let data = {};

    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      throw new Error("HashPi 桥接响应异常");
    }

    if (!response.ok || Number(data.code) !== 0) {
      throw new Error(data.msg || "HashPi 登录票据校验失败");
    }

    return normalizeBridgeUser(data.data || {});
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error("HashPi 登录校验超时，请重试");
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

module.exports = {
  verifyHashPiBridgeTicket
};
