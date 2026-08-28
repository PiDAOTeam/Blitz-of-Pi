const { query } = require("../db/mysql");
const { readGameConfig } = require("./game-config.repository");

async function ensureUserRank(uid) {
  await query(
    `INSERT INTO user_ranks (uid, rank_score, rank_name, rank_key, stars, win_count, lose_count, win_streak)
     VALUES (?, 1000, '青铜', 'bronze', 0, 0, 0, 0)
     ON DUPLICATE KEY UPDATE uid = VALUES(uid)`,
    [uid]
  );
}

async function findUserByPiUserId(piUserId) {
  const rows = await query(
    `SELECT u.*, COALESCE(r.rank_name, u.rank_name) AS rank_name, COALESCE(r.rank_score, 1000) AS rank_score
     FROM users u
     LEFT JOIN user_ranks r ON r.uid = u.uid
     WHERE u.pi_user_id = ?
     LIMIT 1`,
    [piUserId]
  );
  return rows[0] || null;
}

async function findUserByPiUsername(piUsername) {
  const safePiUsername = String(piUsername || "").trim();
  if (!safePiUsername) return null;

  const rows = await query(
    `SELECT u.*, COALESCE(r.rank_name, u.rank_name) AS rank_name, COALESCE(r.rank_score, 1000) AS rank_score
     FROM users u
     LEFT JOIN user_ranks r ON r.uid = u.uid
     WHERE u.pi_username <> '' AND LOWER(u.pi_username) = LOWER(?)
     ORDER BY
       CASE WHEN u.profile_completed = 1 THEN 0 ELSE 1 END,
       CASE WHEN u.uid LIKE 'pi_%' THEN 0 ELSE 1 END,
       u.created_at ASC,
       u.id ASC
     LIMIT 1`,
    [safePiUsername]
  );
  return rows[0] || null;
}

async function findUserByUid(uid) {
  const rows = await query(
    `SELECT u.*, COALESCE(r.rank_name, u.rank_name) AS rank_name, COALESCE(r.rank_score, 1000) AS rank_score
     FROM users u
     LEFT JOIN user_ranks r ON r.uid = u.uid
     WHERE u.uid = ?
     LIMIT 1`,
    [uid]
  );
  return rows[0] || null;
}

async function findUserByHashPiUserId(hashpiUserId) {
  const rows = await query(
    `SELECT u.*, COALESCE(r.rank_name, u.rank_name) AS rank_name, COALESCE(r.rank_score, 1000) AS rank_score
     FROM users u
     LEFT JOIN user_ranks r ON r.uid = u.uid
     WHERE u.uid = ?
     LIMIT 1`,
    [`hashpi_${hashpiUserId}`]
  );
  return rows[0] || null;
}

async function ensureUserBridgeLinksTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS user_bridge_links (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      blitz_uid VARCHAR(64) NOT NULL,
      hashpi_user_id BIGINT UNSIGNED NOT NULL,
      hashpi_pi_uid VARCHAR(128) NOT NULL DEFAULT '',
      blitz_pi_uid VARCHAR(128) NOT NULL DEFAULT '',
      pi_username VARCHAR(64) NOT NULL DEFAULT '',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uk_hashpi_user_id (hashpi_user_id),
      KEY idx_blitz_uid (blitz_uid),
      KEY idx_pi_username (pi_username)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
}

async function findUserByBridgeHashPiUserId(hashpiUserId) {
  const safeId = Number(hashpiUserId || 0);
  if (!safeId) return null;
  await ensureUserBridgeLinksTable();
  const rows = await query(
    `SELECT u.*, COALESCE(r.rank_name, u.rank_name) AS rank_name, COALESCE(r.rank_score, 1000) AS rank_score
     FROM user_bridge_links l
     INNER JOIN users u ON u.uid = l.blitz_uid
     LEFT JOIN user_ranks r ON r.uid = u.uid
     WHERE l.hashpi_user_id = ?
     LIMIT 1`,
    [safeId]
  );
  return rows[0] || null;
}

async function saveUserBridgeLink({ blitzUid, hashpiUserId, hashpiPiUid, blitzPiUid, piUsername }) {
  const safeBlitzUid = String(blitzUid || "").trim();
  const safeHashPiUserId = Number(hashpiUserId || 0);
  if (!safeBlitzUid || !safeHashPiUserId) return;
  await ensureUserBridgeLinksTable();
  await query(
    `INSERT INTO user_bridge_links
       (blitz_uid, hashpi_user_id, hashpi_pi_uid, blitz_pi_uid, pi_username)
     VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       blitz_uid = VALUES(blitz_uid),
       hashpi_pi_uid = CASE WHEN VALUES(hashpi_pi_uid) <> '' THEN VALUES(hashpi_pi_uid) ELSE hashpi_pi_uid END,
       blitz_pi_uid = CASE WHEN VALUES(blitz_pi_uid) <> '' THEN VALUES(blitz_pi_uid) ELSE blitz_pi_uid END,
       pi_username = CASE WHEN VALUES(pi_username) <> '' THEN VALUES(pi_username) ELSE pi_username END,
       updated_at = NOW()`,
    [
      safeBlitzUid,
      safeHashPiUserId,
      String(hashpiPiUid || "").trim(),
      String(blitzPiUid || "").trim(),
      String(piUsername || "").trim()
    ]
  );
}

const DEFAULT_AVATAR_KEY = "avatar_1";
const DEFAULT_PROFILE_AVATARS = [
  { key: "avatar_1", name: "闪电红" },
  { key: "avatar_2", name: "金币橙" },
  { key: "avatar_3", name: "翡翠绿" },
  { key: "avatar_4", name: "海浪蓝" },
  { key: "avatar_5", name: "星夜灰" },
  { key: "avatar_6", name: "冠军金" }
];
const PROFILE_AVATARS = DEFAULT_PROFILE_AVATARS;

async function getProfileAvatars() {
  const config = await readGameConfig();
  const avatars = config.operation?.avatars || DEFAULT_PROFILE_AVATARS;
  const enabledAvatars = avatars
    .filter((avatar) => avatar.enabled !== false)
    .map((avatar) => ({
      key: avatar.key,
      name: avatar.name
    }));

  return enabledAvatars.length ? enabledAvatars : DEFAULT_PROFILE_AVATARS;
}

async function isValidAvatarKey(avatarKey) {
  const avatars = await getProfileAvatars();
  return avatars.some((avatar) => avatar.key === avatarKey);
}

async function normalizeNickname(nickname) {
  const config = await readGameConfig();
  const operation = config.operation || {};
  const minLength = Number(operation.nicknameMinLength || 2);
  const maxLength = Number(operation.nicknameMaxLength || 12);
  const bannedWords = Array.isArray(operation.bannedWords) ? operation.bannedWords : [];
  const value = String(nickname || "").trim();

  if (!value) return "Pi玩家";
  if (value.length < minLength) {
    throw new Error(`昵称至少需要 ${minLength} 个字符`);
  }

  if (!/^[\u4e00-\u9fa5a-zA-Z0-9_\-\s]+$/.test(value)) {
    throw new Error("昵称只能包含中文、英文、数字、空格、横线或下划线");
  }

  const lowerValue = value.toLowerCase();
  if (bannedWords.some((word) => word && lowerValue.includes(String(word).toLowerCase()))) {
    throw new Error("昵称包含平台禁用词，请重新设置");
  }

  if (value.length > maxLength) return value.slice(0, maxLength);

  return value;
}

async function normalizeBridgeNickname({ nickname, piUsername, hashpiUserId }, normalize = normalizeNickname) {
  const candidates = [nickname, piUsername, `HashPi${hashpiUserId}`]
    .map((value) => String(value || "").trim())
    .filter((value, index, values) => value && values.indexOf(value) === index);
  let lastError;

  for (const candidate of candidates) {
    try {
      return await normalize(candidate);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error("HashPi 昵称无法用于游戏资料");
}

function extractHashPiUserId(value = "") {
  const safeValue = String(value || "").trim();
  if (!safeValue) return "";
  return safeValue.startsWith("hashpi_") ? safeValue.slice("hashpi_".length) : "";
}

async function upsertUser({ piUserId, piUsername, nickname, avatarUrl, avatarKey }) {
  if (!piUserId) {
    throw new Error("缺少 Pi 用户ID，无法创建真实用户");
  }

  const uid = `pi_${piUserId}`;
  const safePiUsername = String(piUsername || nickname || "").trim().slice(0, 64);
  const safeNickname = await normalizeNickname(nickname || safePiUsername);
  const safeAvatarKey = (await isValidAvatarKey(avatarKey)) ? avatarKey : DEFAULT_AVATAR_KEY;
  const existingByUsername = await findUserByPiUsername(safePiUsername);

  if (existingByUsername) {
    await query(
      `UPDATE users
       SET
         pi_username = CASE
           WHEN ? <> '' THEN ?
           ELSE pi_username
         END,
         nickname = CASE
           WHEN nickname = '' OR nickname = 'Pi玩家' OR nickname = pi_username THEN ?
           ELSE nickname
         END,
         avatar_url = CASE
           WHEN ? <> '' THEN ?
           ELSE avatar_url
         END,
         avatar_key = CASE
           WHEN avatar_key = '' THEN ?
           ELSE avatar_key
         END,
         last_login_at = NOW()
       WHERE uid = ?`,
      [
        safePiUsername,
        safePiUsername,
        safeNickname,
        avatarUrl || "",
        avatarUrl || "",
        safeAvatarKey,
        existingByUsername.uid
      ]
    );
    await ensureUserRank(existingByUsername.uid);
    return findUserByUid(existingByUsername.uid);
  }

  await query(
    `INSERT INTO users
       (uid, pi_user_id, pi_username, nickname, avatar_url, avatar_key, profile_completed, rank_name, status, last_login_at)
     VALUES (?, ?, ?, ?, ?, ?, 0, '青铜', 1, NOW())
     ON DUPLICATE KEY UPDATE
       pi_username = CASE
         WHEN VALUES(pi_username) <> '' THEN VALUES(pi_username)
         ELSE pi_username
       END,
       nickname = CASE
         WHEN nickname = '' OR nickname = 'Pi玩家' OR nickname = pi_username THEN VALUES(nickname)
         ELSE nickname
       END,
       avatar_url = CASE
         WHEN VALUES(avatar_url) <> '' THEN VALUES(avatar_url)
         ELSE avatar_url
       END,
       avatar_key = CASE
         WHEN avatar_key = '' THEN VALUES(avatar_key)
         ELSE avatar_key
       END,
       last_login_at = NOW()`,
    [uid, piUserId, safePiUsername, safeNickname, avatarUrl || "", safeAvatarKey]
  );
  await ensureUserRank(uid);

  return findUserByUid(uid);
}

async function upsertHashPiBridgeUser({ hashpiUserId, piUserId, piUsername, nickname, avatarUrl, avatarKey }) {
  const safeHashPiUserId = Number(hashpiUserId || 0);
  const safePiUsername = String(piUsername || "").trim();
  const registerHint = "请先用 Pi Browser 打开 https://blitz.hashpi.app 完成首次 Pi 注册，再回到 HashPi 进入闪电战";

  await ensureUserBridgeLinksTable();

  let existing = await findUserByBridgeHashPiUserId(safeHashPiUserId);
  if (!existing && safePiUsername) {
    existing = await findUserByPiUsername(safePiUsername);
  }

  if (!existing || Number(existing.status) !== 1) {
    throw new Error(registerHint);
  }

  await saveUserBridgeLink({
    blitzUid: existing.uid,
    hashpiUserId: safeHashPiUserId,
    hashpiPiUid: piUserId,
    blitzPiUid: existing.pi_user_id,
    piUsername: existing.pi_username || safePiUsername
  });
  await query("UPDATE users SET last_login_at = NOW() WHERE uid = ?", [existing.uid]);
  return findUserByUid(existing.uid);
}

async function updateUserProfile(uid, { nickname, avatarKey }) {
  const safeNickname = await normalizeNickname(nickname);
  const safeAvatarKey = (await isValidAvatarKey(avatarKey)) ? avatarKey : DEFAULT_AVATAR_KEY;

  await query(
    `UPDATE users
     SET nickname = ?, avatar_key = ?, profile_completed = 1
     WHERE uid = ?`,
    [safeNickname, safeAvatarKey, uid]
  );

  return findUserByUid(uid);
}

async function adminUpdateUserProfile(uid, { nickname, avatarKey, status }) {
  const safeNickname = await normalizeNickname(nickname);
  const safeAvatarKey = (await isValidAvatarKey(avatarKey)) ? avatarKey : DEFAULT_AVATAR_KEY;
  const safeStatus = Number(status) === 0 ? 0 : 1;

  await query(
    `UPDATE users
     SET nickname = ?, avatar_key = ?, status = ?
     WHERE uid = ?`,
    [safeNickname, safeAvatarKey, safeStatus, uid]
  );

  return findUserByUid(uid);
}

async function adminSetUserStatus(uid, status) {
  const safeStatus = Number(status) === 0 ? 0 : 1;

  await query("UPDATE users SET status = ? WHERE uid = ?", [safeStatus, uid]);
  return findUserByUid(uid);
}

async function adminResetProfileOnboarding(uid) {
  await query("UPDATE users SET profile_completed = 0 WHERE uid = ?", [uid]);
  return findUserByUid(uid);
}

function toUserProfile(row) {
  const hashpiUserId =
    extractHashPiUserId(row.uid) ||
    extractHashPiUserId(row.pi_user_id) ||
    "";
  return {
    uid: row.uid,
    piUserId: row.pi_user_id || "",
    hashpiUserId,
    piUsername: row.pi_username || "",
    nickname: row.nickname,
    avatarUrl: row.avatar_url || "",
    avatarKey: row.avatar_key || DEFAULT_AVATAR_KEY,
    profileCompleted: Number(row.profile_completed) === 1,
    rankName: row.rank_name || "青铜",
    rankScore: Number(row.rank_score || 1000)
  };
}

module.exports = {
  PROFILE_AVATARS,
  getProfileAvatars,
  findUserByPiUserId,
  findUserByPiUsername,
  findUserByUid,
  findUserByHashPiUserId,
  findUserByBridgeHashPiUserId,
  ensureUserBridgeLinksTable,
  saveUserBridgeLink,
  upsertUser,
  upsertHashPiBridgeUser,
  updateUserProfile,
  adminUpdateUserProfile,
  adminSetUserStatus,
  adminResetProfileOnboarding,
  isValidAvatarKey,
  normalizeBridgeNickname,
  toUserProfile
};
