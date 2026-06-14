const crypto = require("node:crypto");
const { redisIncrWithExpire } = require("../db/redis");
const { parseToken } = require("./auth-token");

const buckets = new Map();

const RULES = [
  { test: (url) => url === "/admin-api/auth/login", limit: 10, windowMs: 60_000 },
  { test: (url) => url === "/api/auth/pi-login", limit: 20, windowMs: 60_000 },
  { test: (url) => url === "/api/auth/hashpi-bridge-login", limit: 30, windowMs: 60_000 },
  { test: (url) => url.startsWith("/api/payments/"), limit: 30, windowMs: 60_000 },
  { test: (url) => url.startsWith("/api/withdraw/"), limit: 10, windowMs: 60_000 },
  { test: (url) => url === "/api/match/status", limit: 180, windowMs: 60_000 },
  { test: (url) => url === "/api/match/join-queue", limit: 20, windowMs: 60_000 },
  { test: (url) => url === "/api/match/cancel-queue", limit: 30, windowMs: 60_000 },
  { test: (url) => url.startsWith("/api/match/"), limit: 40, windowMs: 60_000 }
];

function getClientIp(req) {
  return (
    String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() ||
    req.socket?.remoteAddress ||
    "unknown"
  );
}

function matchRule(url) {
  return RULES.find((rule) => rule.test(url));
}

function getTokenSubject(req) {
  const token = req.headers.authorization?.replace("Bearer ", "") || "";
  const parsed = token ? parseToken(token) : null;

  if (!parsed?.scope || !parsed.subject) {
    return "";
  }

  return `${parsed.scope}:${parsed.subject}`;
}

function getRateKey(req) {
  const subject = getTokenSubject(req);
  const identity = subject || `ip:${getClientIp(req)}`;

  return crypto
    .createHash("sha1")
    .update(`${identity}:${req.url || ""}`)
    .digest("hex");
}

function checkMemoryRateLimit(req, rule) {
  const key = getRateKey(req);
  const now = Date.now();
  const bucket = buckets.get(key) || {
    count: 0,
    resetAt: now + rule.windowMs
  };

  if (bucket.resetAt <= now) {
    bucket.count = 0;
    bucket.resetAt = now + rule.windowMs;
  }

  bucket.count += 1;
  buckets.set(key, bucket);

  return {
    limited: bucket.count > rule.limit,
    retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000)
  };
}

async function checkRateLimit(req) {
  const rule = matchRule(req.url || "");

  if (!rule) {
    return { limited: false };
  }

  const seconds = Math.max(1, Math.ceil(rule.windowMs / 1000));
  const redisBucket = await redisIncrWithExpire(`blitz:rate:${getRateKey(req)}`, seconds);

  if (!redisBucket) {
    return checkMemoryRateLimit(req, rule);
  }

  return {
    limited: redisBucket.count > rule.limit,
    retryAfterSeconds: Math.max(1, Number(redisBucket.ttl || seconds))
  };
}

setInterval(() => {
  const now = Date.now();

  for (const [key, bucket] of buckets.entries()) {
    if (bucket.resetAt <= now) {
      buckets.delete(key);
    }
  }
}, 60_000).unref();

module.exports = {
  checkRateLimit,
  getClientIp
};
