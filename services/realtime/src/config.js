const REALTIME_PORT = Number(process.env.REALTIME_PORT || 3001);
const REALTIME_INSTANCE_ID = process.env.REALTIME_INSTANCE_ID || `realtime-${REALTIME_PORT}`;
const REDIS_HOST = process.env.REDIS_HOST || "127.0.0.1";
const REDIS_PORT = Number(process.env.REDIS_PORT || 6379);
const API_INTERNAL_BASE_URL = process.env.API_INTERNAL_BASE_URL || "http://127.0.0.1:3000";
const SETTLEMENT_HTTP_TIMEOUT_MS = Math.max(
  1000,
  Math.min(30000, Number(process.env.SETTLEMENT_HTTP_TIMEOUT_MS || 8000))
);
const REALTIME_SETTLEMENT_SECRET =
  process.env.REALTIME_SETTLEMENT_SECRET || process.env.SESSION_SECRET || "dev-session-secret-change-me";

module.exports = {
  REALTIME_PORT,
  REALTIME_INSTANCE_ID,
  REDIS_HOST,
  REDIS_PORT,
  API_INTERNAL_BASE_URL,
  SETTLEMENT_HTTP_TIMEOUT_MS,
  REALTIME_SETTLEMENT_SECRET
};
