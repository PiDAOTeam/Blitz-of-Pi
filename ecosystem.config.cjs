const fs = require("node:fs");
const path = require("node:path");

function loadProductionEnv() {
  const envPath = path.resolve(__dirname, "../..", ".env.production");

  if (!fs.existsSync(envPath)) {
    return {};
  }

  return fs
    .readFileSync(envPath, "utf8")
    .split(/\r?\n/)
    .reduce((env, line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) return env;

      const index = trimmed.indexOf("=");
      if (index <= 0) return env;

      const key = trimmed.slice(0, index).trim();
      const value = trimmed.slice(index + 1).trim();
      env[key] = value;
      return env;
    }, {});
}

const productionEnv = loadProductionEnv();

module.exports = {
  apps: [
    {
      name: "blitz-api",
      script: "./services/api/src/main.js",
      cwd: __dirname + "/../..",
      instances: 1,
      exec_mode: "fork",
      out_file: "./logs/api.out.log",
      error_file: "./logs/api.error.log",
      env: {
        ...productionEnv,
        NODE_ENV: "production",
        API_PORT: 3000,
        MYSQL_HOST: "127.0.0.1",
        MYSQL_PORT: 3306,
        MYSQL_USER: "blitzhashpi",
        MYSQL_PASSWORD: process.env.MYSQL_PASSWORD || "change_me",
        MYSQL_DATABASE: "blitzhashpi",
        REDIS_HOST: "127.0.0.1",
        REDIS_PORT: 6379,
        API_SETTLEMENT_CONCURRENCY: 1,
        API_INTERNAL_BASE_URL: "http://127.0.0.1:3000"
      }
    },
    {
      name: "blitz-realtime",
      script: "./services/realtime/src/main.js",
      cwd: __dirname + "/../..",
      instances: 1,
      exec_mode: "fork",
      out_file: "./logs/realtime.out.log",
      error_file: "./logs/realtime.error.log",
      env: {
        ...productionEnv,
        NODE_ENV: "production",
        REALTIME_PORT: 3001,
        REALTIME_INSTANCE_ID: "realtime-3001",
        SETTLEMENT_CONCURRENCY: 1,
        SETTLEMENT_HTTP_TIMEOUT_MS: 8000,
        REDIS_HOST: "127.0.0.1",
        REDIS_PORT: 6379,
        API_INTERNAL_BASE_URL: "http://127.0.0.1:3000"
      }
    },
    {
      name: "blitz-realtime-3002",
      script: "./services/realtime/src/main.js",
      cwd: __dirname + "/../..",
      instances: 1,
      exec_mode: "fork",
      out_file: "./logs/realtime-3002.out.log",
      error_file: "./logs/realtime-3002.error.log",
      env: {
        ...productionEnv,
        NODE_ENV: "production",
        REALTIME_PORT: 3002,
        REALTIME_INSTANCE_ID: "realtime-3002",
        SETTLEMENT_CONCURRENCY: 1,
        SETTLEMENT_HTTP_TIMEOUT_MS: 8000,
        REDIS_HOST: "127.0.0.1",
        REDIS_PORT: 6379,
        API_INTERNAL_BASE_URL: "http://127.0.0.1:3000"
      }
    },
    {
      name: "blitz-realtime-3003",
      script: "./services/realtime/src/main.js",
      cwd: __dirname + "/../..",
      instances: 1,
      exec_mode: "fork",
      out_file: "./logs/realtime-3003.out.log",
      error_file: "./logs/realtime-3003.error.log",
      env: {
        ...productionEnv,
        NODE_ENV: "production",
        REALTIME_PORT: 3003,
        REALTIME_INSTANCE_ID: "realtime-3003",
        SETTLEMENT_CONCURRENCY: 1,
        SETTLEMENT_HTTP_TIMEOUT_MS: 8000,
        REDIS_HOST: "127.0.0.1",
        REDIS_PORT: 6379,
        API_INTERNAL_BASE_URL: "http://127.0.0.1:3000"
      }
    },
    {
      name: "blitz-realtime-3004",
      script: "./services/realtime/src/main.js",
      cwd: __dirname + "/../..",
      instances: 1,
      exec_mode: "fork",
      out_file: "./logs/realtime-3004.out.log",
      error_file: "./logs/realtime-3004.error.log",
      env: {
        ...productionEnv,
        NODE_ENV: "production",
        REALTIME_PORT: 3004,
        REALTIME_INSTANCE_ID: "realtime-3004",
        SETTLEMENT_CONCURRENCY: 1,
        SETTLEMENT_HTTP_TIMEOUT_MS: 8000,
        REDIS_HOST: "127.0.0.1",
        REDIS_PORT: 6379,
        API_INTERNAL_BASE_URL: "http://127.0.0.1:3000"
      }
    }
  ]
};
