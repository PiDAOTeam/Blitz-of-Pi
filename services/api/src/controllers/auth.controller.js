const {
  createUserSession,
  createHashPiBridgeSession,
  createAdminSession,
  changeAdminPassword,
  getSessionByToken,
  getActiveUserFromToken
} = require("../services/auth.service");

async function loginUser(payload) {
  return createUserSession(payload);
}

async function loginHashPiBridge(payload) {
  return createHashPiBridgeSession(payload);
}

async function getUserProfile() {
  throw new Error("请先登录");
}

async function loginAdmin(payload) {
  return createAdminSession(payload);
}

async function getAdminProfile() {
  throw new Error("请先登录后台");
}

async function updateAdminPassword(req, payload) {
  const token = req.headers.authorization?.replace("Bearer ", "") || "";
  const session = await getSessionByToken(token);

  if (!session || session.scope !== "admin" || !session.admin) {
    throw new Error("请先登录后台");
  }

  await changeAdminPassword(session.admin.username, payload.oldPassword, payload.newPassword);

  return {
    changed: true
  };
}

async function getSessionProfile(token, scope) {
  const session = await getSessionByToken(token);

  if (!session || session.scope !== scope) {
    return null;
  }

  if (scope === "admin") {
    return session.admin;
  }

  try {
    return await getActiveUserFromToken(token);
  } catch {
    return null;
  }
}

module.exports = {
  loginUser,
  loginHashPiBridge,
  getUserProfile,
  loginAdmin,
  getAdminProfile,
  updateAdminPassword,
  getSessionProfile
};
