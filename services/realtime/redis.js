const Redis = require("ioredis");
const { REDIS_HOST, REDIS_PORT } = require("./config");

let client;
let disabled = false;

function getRedis() {
  if (disabled) return null;

  if (!client) {
    client = new Redis({
      host: REDIS_HOST,
      port: REDIS_PORT,
      maxRetriesPerRequest: 1,
      lazyConnect: true
    });

    client.on("error", (error) => {
      disabled = true;
      console.error("[realtime:redis] disabled:", error.message);
    });
  }

  return client;
}

async function ensureConnected(redis) {
  if (redis.status === "wait") {
    await redis.connect();
  }
}

async function redisGetJson(key) {
  const redis = getRedis();
  if (!redis) return null;

  try {
    await ensureConnected(redis);
    const raw = await redis.get(key);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    disabled = true;
    console.error("[realtime:redis] get failed:", error.message);
    return null;
  }
}

async function redisSetJson(key, value, seconds = 7200) {
  const redis = getRedis();
  if (!redis) return false;

  try {
    await ensureConnected(redis);
    await redis.set(key, JSON.stringify(value), "EX", seconds);
    return true;
  } catch (error) {
    disabled = true;
    console.error("[realtime:redis] set failed:", error.message);
    return false;
  }
}

async function redisDel(key) {
  const redis = getRedis();
  if (!redis) return false;

  try {
    await ensureConnected(redis);
    await redis.del(key);
    return true;
  } catch (error) {
    disabled = true;
    console.error("[realtime:redis] del failed:", error.message);
    return false;
  }
}

module.exports = {
  redisGetJson,
  redisSetJson,
  redisDel
};
