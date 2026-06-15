const fs = require("node:fs");
const path = require("node:path");

function readEnvFile() {
  const envPath = path.resolve(__dirname, "../../..", ".env.production");

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

      env[trimmed.slice(0, index).trim()] = trimmed.slice(index + 1).trim();
      return env;
    }, {});
}

const fileEnv = readEnvFile();
const env = (key, fallback = "") => process.env[key] || fileEnv[key] || fallback;

const API_PORT = Number(process.env.API_PORT || 3000);
const MYSQL_HOST = env("MYSQL_HOST", "127.0.0.1");
const MYSQL_PORT = Number(env("MYSQL_PORT", "3306"));
const MYSQL_USER = env("MYSQL_USER", "root");
const MYSQL_PASSWORD = env("MYSQL_PASSWORD");
const MYSQL_DATABASE = env("MYSQL_DATABASE", "blitzhashpi");
const MYSQL_CONNECTION_LIMIT = Number(env("MYSQL_CONNECTION_LIMIT", "20"));
const REDIS_HOST = env("REDIS_HOST", "127.0.0.1");
const REDIS_PORT = Number(env("REDIS_PORT", "6379"));
const PI_APP_SLUG = env("PI_APP_SLUG", "blitz-of-pi");
const PI_API_KEY = env("PI_API_KEY");
const PI_SANDBOX = String(env("PI_SANDBOX", "false")) === "true";
const PI_PLATFORM_API_BASE = env("PI_PLATFORM_API_BASE", "https://api.minepi.com");
const SESSION_SECRET = env("SESSION_SECRET", "dev-session-secret-change-me");
const REALTIME_SETTLEMENT_SECRET = env("REALTIME_SETTLEMENT_SECRET", SESSION_SECRET);
const PI_PAYOUT_HORIZON_URL = env("PI_PAYOUT_HORIZON_URL", "");
const PI_PAYOUT_NETWORK_PASSPHRASE = env("PI_PAYOUT_NETWORK_PASSPHRASE", "Pi Network");
const PI_PAYOUT_SOURCE_SECRET = env("PI_PAYOUT_SOURCE_SECRET", "");
const PI_PAYOUT_SOURCE_PUBLIC = env("PI_PAYOUT_SOURCE_PUBLIC", "");
const AUTO_PAYOUT_BATCH_SIZE = Number(env("AUTO_PAYOUT_BATCH_SIZE", "10"));
const AUTO_PAYOUT_STALE_MINUTES = Number(env("AUTO_PAYOUT_STALE_MINUTES", "10"));
const ASSET_GATEWAY_ENABLED = String(env("ASSET_GATEWAY_ENABLED", "false")) === "true";
const ASSET_GATEWAY_BASE_URL = env(
  "ASSET_GATEWAY_BASE_URL",
  "https://hash.pios.co/api.php?s=plugins/index/pluginsname/assetgateway/pluginscontrol/asset/pluginsaction"
);
const ASSET_GATEWAY_APP_KEY = env("ASSET_GATEWAY_APP_KEY", "");
const ASSET_GATEWAY_APP_SECRET = env("ASSET_GATEWAY_APP_SECRET", "");
const ASSET_GATEWAY_TIMEOUT_MS = Number(env("ASSET_GATEWAY_TIMEOUT_MS", "8000"));
const HASHPI_BRIDGE_ENABLED = String(env("HASHPI_BRIDGE_ENABLED", "true")) === "true";
const HASHPI_BRIDGE_BASE_URL = env(
  "HASHPI_BRIDGE_BASE_URL",
  "https://hash.pios.co/api.php?s=plugins/index/pluginsname/piscore/pluginscontrol/user/pluginsaction"
);
const HASHPI_BRIDGE_TIMEOUT_MS = Number(env("HASHPI_BRIDGE_TIMEOUT_MS", "5000"));
const ALLOWED_ORIGINS = env(
  "ALLOWED_ORIGINS",
  "https://blitz.hashpi.app,https://hashpi.app,https://blitzadmin.hashpi.app,https://blitzapi.hashpi.app,https://sandbox.minepi.com,http://localhost:5173,http://localhost:5174"
);

module.exports = {
  API_PORT,
  MYSQL_HOST,
  MYSQL_PORT,
  MYSQL_USER,
  MYSQL_PASSWORD,
  MYSQL_DATABASE,
  MYSQL_CONNECTION_LIMIT,
  REDIS_HOST,
  REDIS_PORT,
  PI_APP_SLUG,
  PI_API_KEY,
  PI_SANDBOX,
  PI_PLATFORM_API_BASE,
  SESSION_SECRET,
  REALTIME_SETTLEMENT_SECRET,
  PI_PAYOUT_HORIZON_URL,
  PI_PAYOUT_NETWORK_PASSPHRASE,
  PI_PAYOUT_SOURCE_SECRET,
  PI_PAYOUT_SOURCE_PUBLIC,
  AUTO_PAYOUT_BATCH_SIZE,
  AUTO_PAYOUT_STALE_MINUTES,
  ASSET_GATEWAY_ENABLED,
  ASSET_GATEWAY_BASE_URL,
  ASSET_GATEWAY_APP_KEY,
  ASSET_GATEWAY_APP_SECRET,
  ASSET_GATEWAY_TIMEOUT_MS,
  HASHPI_BRIDGE_ENABLED,
  HASHPI_BRIDGE_BASE_URL,
  HASHPI_BRIDGE_TIMEOUT_MS,
  ALLOWED_ORIGINS
};
