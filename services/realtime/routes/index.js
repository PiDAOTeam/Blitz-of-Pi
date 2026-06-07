const { getHealth } = require("../controllers/health.controller");
const { ok, notFound } = require("../utils/response");

function handleRoutes(req, res) {
  const pathname = new URL(req.url || "/", "http://127.0.0.1").pathname;

  if (pathname === "/health" && req.method === "GET") {
    ok(res, getHealth(), "ok");
    return;
  }

  notFound(res);
}

module.exports = {
  handleRoutes
};
