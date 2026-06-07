const Redis = require("ioredis");
const { REDIS_HOST, REDIS_PORT } = require("../config");

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
    console.error("[redis] error:", error.message);
  });

  redis.on("end", () => {
    if (client === redis) {
      client = null;
      console.warn("[redis] connection ended, will reconnect on next command");
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

async function getConnectedRedis() {
  let redis = getRedis();

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
      connected = await getConnectedRedis();
      return await handler(connected);
    } catch (error) {
      lastError = error;
      console.error(`[redis] ${label} failed:`, error.message);
      resetRedis(connected || redis);
      if (attempt < REDIS_COMMAND_RETRIES) {
        await sleep(80 + Math.floor(Math.random() * 120));
      }
    }
  }

  return typeof fallback === "function" ? fallback(lastError) : fallback;
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

async function redisSetNx(key, value, seconds = 30) {
  return runRedisCommand("setnx", false, async (redis) => {
    const result = await redis.set(key, value, "NX", "EX", seconds);
    return result === "OK";
  });
}

async function redisDel(key) {
  return runRedisCommand("del", false, async (redis) => {
    await redis.del(key);
    return true;
  });
}

async function redisScan(pattern, count = 100) {
  return runRedisCommand("scan", [], async (redis) => {
    let cursor = "0";
    const keys = [];

    do {
      const result = await redis.scan(cursor, "MATCH", pattern, "COUNT", count);
      cursor = result[0];
      keys.push(...result[1]);
    } while (cursor !== "0");

    return keys;
  });
}

async function redisIncrWithExpire(key, seconds = 60) {
  return runRedisCommand("incr", null, async (redis) => {
    const pipeline = redis.pipeline();
    pipeline.incr(key);
    pipeline.ttl(key);
    const results = await pipeline.exec();
    const count = Number(results?.[0]?.[1] || 0);
    const ttl = Number(results?.[1]?.[1] || 0);

    if (ttl < 0) {
      await redis.expire(key, seconds);
    }

    return {
      count,
      ttl: ttl > 0 ? ttl : seconds
    };
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

async function redisReadJsonList(key, limit = 50) {
  return runRedisCommand("list read", [], async (redis) => {
    const rows = await redis.lrange(key, 0, Math.max(0, limit - 1));
    return rows
      .map((raw) => {
        try {
          return JSON.parse(raw);
        } catch {
          return null;
        }
      })
      .filter(Boolean);
  });
}

module.exports = {
  redisGet,
  redisSet,
  redisSetNx,
  redisDel,
  redisScan,
  redisIncrWithExpire,
  redisPushJsonList,
  redisReadJsonList
};
