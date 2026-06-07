const http = require("node:http");
const { handleRoutes } = require("./routes");
const { attachRealtime } = require("./realtime");

function createServer() {
  const server = http.createServer((req, res) => {
    handleRoutes(req, res);
  });

  attachRealtime(server);
  return server;
}

module.exports = {
  createServer
};
