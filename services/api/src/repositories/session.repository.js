const { parseToken } = require("../utils/auth-token");
const { findUserByUid, toUserProfile } = require("./user.repository");
const { findAdminByUsername, toAdminProfile } = require("./admin-user.repository");
const { redisGet, redisSet } = require("../db/redis");

const sessions = new Map();
const revokedSubjects = new Map();
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const REVOKE_KEY_PREFIX = "blitz:session:revoked:";

function revokeKey(scope, subject) {
  return `${REVOKE_KEY_PREFIX}${scope}:${subject}`;
}

function saveSession(token, payload) {
  const session = {
    ...payload,
    expiresAt: Date.now() + SESSION_TTL_MS
  };

  sessions.set(token, session);
  return session;
}

async function findSession(token) {
  const parsed = parseToken(token);

  if (!parsed) {
    return null;
  }

  if (await isTokenRevoked(parsed)) {
    sessions.delete(token);
    return null;
  }

  const session = sessions.get(token);

  if (!session) {
    return restoreSessionFromToken(parsed);
  }

  if (session.expiresAt && session.expiresAt < Date.now()) {
    sessions.delete(token);
    return null;
  }

  return session;
}

async function isTokenRevoked(parsed) {
  const subjectKey = `${parsed.scope}:${parsed.subject}`;
  const localRevokedAt = revokedSubjects.get(subjectKey) || 0;
  let revokedAt = localRevokedAt;

  const redisRevokedAt = await redisGet(revokeKey(parsed.scope, parsed.subject));
  if (redisRevokedAt) {
    revokedAt = Math.max(revokedAt, Number(redisRevokedAt) || 0);
    revokedSubjects.set(subjectKey, revokedAt);
  }

  return revokedAt > 0 && Number(parsed.issuedAt || 0) <= revokedAt;
}

async function revokeSubjectSessions(scope, subject) {
  const subjectKey = `${scope}:${subject}`;
  const revokedAt = Date.now();

  revokedSubjects.set(subjectKey, revokedAt);

  for (const [token, session] of sessions.entries()) {
    const parsed = parseToken(token);
    if (parsed?.scope === scope && parsed.subject === subject) {
      sessions.delete(token);
      continue;
    }

    if (session.scope === scope && (session.user?.uid === subject || session.admin?.username === subject)) {
      sessions.delete(token);
    }
  }

  await redisSet(revokeKey(scope, subject), String(revokedAt), Math.ceil(SESSION_TTL_MS / 1000));
  return revokedAt;
}

async function restoreSessionFromToken(parsed) {
  if (Date.now() - parsed.issuedAt > SESSION_TTL_MS) {
    return null;
  }

  if (parsed.scope === "user") {
    const row = await findUserByUid(parsed.subject);
    if (!row) return null;

    return {
      accessToken: "",
      user: toUserProfile(row),
      scope: "user",
      expiresAt: parsed.issuedAt + SESSION_TTL_MS
    };
  }

  if (parsed.scope === "admin") {
    const row = await findAdminByUsername(parsed.subject);
    if (!row) return null;

    return {
      accessToken: "",
      admin: toAdminProfile(row),
      scope: "admin",
      expiresAt: parsed.issuedAt + SESSION_TTL_MS
    };
  }

  return null;
}

function getActiveSessionStats() {
  const now = Date.now();
  let userCount = 0;
  let adminCount = 0;

  for (const [token, session] of sessions.entries()) {
    if (session.expiresAt && session.expiresAt < now) {
      sessions.delete(token);
      continue;
    }

    if (session.scope === "user") {
      userCount += 1;
    }

    if (session.scope === "admin") {
      adminCount += 1;
    }
  }

  return {
    userCount,
    adminCount
  };
}

module.exports = {
  saveSession,
  findSession,
  revokeSubjectSessions,
  getActiveSessionStats
};
