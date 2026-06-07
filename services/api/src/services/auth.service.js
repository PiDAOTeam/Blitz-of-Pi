const { saveSession, findSession, revokeSubjectSessions } = require("../repositories/session.repository");
const {
  upsertUser,
  findUserByUid,
  toUserProfile
} = require("../repositories/user.repository");
const {
  findAdminByUsername,
  updateAdminPassword,
  toAdminProfile
} = require("../repositories/admin-user.repository");
const { verifyPiAccessToken } = require("./pi-platform.service");
const { hashPassword, verifyPassword } = require("../utils/password");
const { signToken } = require("../utils/auth-token");

async function createUserSession(payload = {}) {
  let user;
  try {
    let piProfile = null;

    if (payload.piAccessToken) {
      piProfile = await verifyPiAccessToken(payload.piAccessToken);
    }

    const piUserId = piProfile?.uid || payload.piUserId || payload.pi_user_id;

    if (!payload.piAccessToken || !piUserId) {
      throw new Error("请通过 Pi Browser 完成真实 Pi 登录");
    }

    const nickname =
      piProfile?.username ||
      payload.nickname ||
      "Pi玩家";

    const row = await upsertUser({
      piUserId,
      piUsername: piProfile?.username || payload.piUsername || payload.pi_username || payload.nickname || "",
      nickname,
      avatarUrl: payload.avatarUrl || payload.avatar_url || "",
      avatarKey: payload.avatarKey || payload.avatar_key || "avatar_1"
    });
    user = toUserProfile(row);
  } catch (error) {
    console.error("[auth] MySQL user upsert failed:", error.message);
    throw error;
  }

  const session = {
    accessToken: signToken("user", user.uid),
    user,
    scope: "user"
  };

  saveSession(session.accessToken, session);
  return session;
}

async function createAdminSession(payload = {}) {
  const username = payload.username || "admin";
  const password = payload.password || "";
  const row = await findAdminByUsername(username);

  if (!row) {
    throw new Error("后台账号不存在或已禁用");
  }

  const valid = await verifyPassword(password, row.password_hash);

  if (!valid) {
    throw new Error("后台账号或密码错误");
  }

  const admin = toAdminProfile(row);

  const session = {
    accessToken: signToken("admin", admin.username),
    admin,
    scope: "admin"
  };

  saveSession(session.accessToken, session);
  return session;
}

async function changeAdminPassword(username, oldPassword, newPassword) {
  if (!newPassword || String(newPassword).length < 8) {
    throw new Error("新密码至少需要8位");
  }

  const row = await findAdminByUsername(username);

  if (!row) {
    throw new Error("后台账号不存在或已禁用");
  }

  const valid = await verifyPassword(oldPassword, row.password_hash);

  if (!valid) {
    throw new Error("当前密码错误");
  }

  const nextHash = await hashPassword(newPassword);
  const updated = await updateAdminPassword(username, nextHash);
  await revokeSubjectSessions("admin", username);
  return toAdminProfile(updated);
}

async function getSessionByToken(token) {
  return findSession(token);
}

async function getActiveUserFromToken(token) {
  const session = token ? await getSessionByToken(token) : null;

  if (!session || session.scope !== "user" || !session.user?.uid) {
    throw new Error("请先登录");
  }

  const row = await findUserByUid(session.user.uid);

  if (!row || Number(row.status) !== 1) {
    throw new Error("账号不可用，请联系平台");
  }

  return toUserProfile(row);
}

module.exports = {
  createUserSession,
  createAdminSession,
  changeAdminPassword,
  getSessionByToken,
  getActiveUserFromToken
};
