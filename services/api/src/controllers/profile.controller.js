const {
  getProfileAvatars,
  updateUserProfile,
  toUserProfile
} = require("../repositories/user.repository");
const { readGameConfig } = require("../repositories/game-config.repository");
const { getUserFromRequest } = require("./wallet.controller");

async function getProfileOptions() {
  const config = await readGameConfig();

  return {
    avatars: await getProfileAvatars(),
    nicknameRules: {
      minLength: config.operation?.nicknameMinLength || 2,
      maxLength: config.operation?.nicknameMaxLength || 12,
      pattern: config.operation?.nicknamePattern || "中文、英文、数字均可，禁止特殊符号和敏感词"
    }
  };
}

async function updateMyProfile(req, payload) {
  const user = await getUserFromRequest(req);
  const row = await updateUserProfile(user.uid, {
    nickname: payload.nickname,
    avatarKey: payload.avatarKey || payload.avatar_key
  });

  return toUserProfile(row);
}

module.exports = {
  getProfileOptions,
  updateMyProfile
};
