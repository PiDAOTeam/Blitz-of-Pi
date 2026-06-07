const Redis = require("ioredis");
const { REDIS_HOST, REDIS_PORT } = require("./config");

let client;
const REDIS_READY_TIMEOUT_MS = 1200;
const REDIS_COMMAND_RETRIES = 1;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function createRedisClient() {
  const redis = new Redis({
    host: REDIS_HOST,
    port: REDIS_PORT,
    maxRetriesPerRequest: 1,
    lazyConnect: true,
    enableOfflineQueue: false,
    retryStrategy(times) {
      return Math.min(2000, 200 + times * 100);
    }
  });

  redis.on("error", (error) => {
    console.error("[realtime:redis] error:", error.message);
  });

  redis.on("end", () => {
    if (client === redis) {
      client = null;
      console.warn("[realtime:redis] connection ended, will reconnect on next command");
    }
  });

  return redis;
}

function getRedis() {
  if (!client) {
    client = createRedisClient();
  }

  return client;
}

function resetRedis(redis) {
  if (client === redis) {
    client = null;
  }

  try {
    redis.disconnect();
  } catch {
    // ignore disconnect errors; the next command will create a fresh client
  }
}

function waitForRedisReady(redis, timeoutMs = REDIS_READY_TIMEOUT_MS) {
  if (redis.status === "ready") {
    return Promise.resolve(redis);
  }

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => cleanup(new Error("redis ready timeout")), timeoutMs);

    const cleanup = (error) => {
      clearTimeout(timer);
      redis.off("ready", onReady);
      redis.off("error", onError);
      redis.off("end", onEnd);
      redis.off("close", onEnd);
      if (error) {
        reject(error);
      } else {
        resolve(redis);
      }
    };
    const onReady = () => cleanup();
    const onError = (error) => cleanup(error);
    const onEnd = () => cleanup(new Error("redis connection ended"));

    redis.once("ready", onReady);
    redis.once("error", onError);
    redis.once("end", onEnd);
    redis.once("close", onEnd);
  });
}

async function ensureConnected(redis) {
  if (redis.status === "end" || redis.status === "close") {
    resetRedis(redis);
    redis = getRedis();
  }

  if (redis.status === "wait") {
    await redis.connect();
  }

  if (redis.status !== "ready") {
    await waitForRedisReady(redis);
  }

  return redis;
}

async function runRedisCommand(label, fallback, handler) {
  let lastError = null;

  for (let attempt = 0; attempt <= REDIS_COMMAND_RETRIES; attempt += 1) {
    const redis = getRedis();
    let connected = null;

    try {
      connected = await ensureConnected(redis);
      return await handler(connected);
    } catch (error) {
      lastError = error;
      console.error(`[realtime:redis] ${label} failed:`, error.message);
      resetRedis(connected || redis);
      if (attempt < REDIS_COMMAND_RETRIES) {
        await sleep(80 + Math.floor(Math.random() * 120));
      }
    }
  }

  return typeof fallback === "function" ? fallback(lastError) : fallback;
}

async function redisGetJson(key) {
  return runRedisCommand("get json", null, async (redis) => {
    const raw = await redis.get(key);
    return raw ? JSON.parse(raw) : null;
  });
}

async function redisGet(key) {
  return runRedisCommand("get", null, (redis) => redis.get(key));
}

async function redisSet(key, value, seconds = 3600) {
  return runRedisCommand("set", false, async (redis) => {
    await redis.set(key, value, "EX", seconds);
    return true;
  });
}

async function redisSetJson(key, value, seconds = 7200) {
  return runRedisCommand("set json", false, async (redis) => {
    await redis.set(key, JSON.stringify(value), "EX", seconds);
    return true;
  });
}

async function redisDel(key) {
  return runRedisCommand("del", false, async (redis) => {
    await redis.del(key);
    return true;
  });
}

async function redisPushJsonList(key, value, { maxLength = 120, seconds = 86400 } = {}) {
  return runRedisCommand("list push", false, async (redis) => {
    const pipeline = redis.pipeline();
    pipeline.lpush(key, JSON.stringify(value));
    pipeline.ltrim(key, 0, Math.max(0, maxLength - 1));
    pipeline.expire(key, seconds);
    await pipeline.exec();
    return true;
  });
}

module.exports = {
  redisGet,
  redisSet,
  redisGetJson,
  redisSetJson,
  redisDel,
  redisPushJsonList
};
