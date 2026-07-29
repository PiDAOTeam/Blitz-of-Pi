const test = require("node:test");
const assert = require("node:assert/strict");

const { normalizeBridgeNickname } = require("./user.repository");

function validateNickname(value) {
  if (!/^[\u4e00-\u9fa5a-zA-Z0-9_\-\s]+$/.test(value) || value.includes("禁用")) {
    throw new Error("invalid nickname");
  }
  return value.slice(0, 12);
}

test("桥接昵称合法时保留 HashPi 昵称", async () => {
  const nickname = await normalizeBridgeNickname(
    { nickname: "闪电玩家", piUsername: "pi_user", hashpiUserId: "123" },
    validateNickname
  );

  assert.equal(nickname, "闪电玩家");
});

test("桥接昵称含表情时回退到 Pi 用户名", async () => {
  const nickname = await normalizeBridgeNickname(
    { nickname: "闪电玩家🎮", piUsername: "pi_user", hashpiUserId: "123" },
    validateNickname
  );

  assert.equal(nickname, "pi_user");
});

test("桥接昵称和 Pi 用户名均不可用时回退到 HashPi 用户 ID", async () => {
  const nickname = await normalizeBridgeNickname(
    { nickname: "昵称·测试", piUsername: "pi.user", hashpiUserId: "123" },
    validateNickname
  );

  assert.equal(nickname, "HashPi123");
});

test("桥接昵称命中禁用词时不会阻断登录", async () => {
  const nickname = await normalizeBridgeNickname(
    { nickname: "禁用昵称", piUsername: "safe_user", hashpiUserId: "123" },
    validateNickname
  );

  assert.equal(nickname, "safe_user");
});
