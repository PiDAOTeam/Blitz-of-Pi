const { ALLOWED_ORIGINS } = require("../config");

const allowedOrigins = new Set(
  ALLOWED_ORIGINS.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)
);

function applyCors(req, res) {
  const origin = req.headers.origin || "";
  const allowedOrigin = allowedOrigins.has(origin) ? origin : "https://blitz.hashpi.app";

  res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

module.exports = {
  applyCors
};
