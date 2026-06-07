const http = require("node:http");
const { handleRoutes } = require("./routes");
const { applyCors } = require("./utils/cors");

function createServer() {
  return http.createServer((req, res) => {
    applyCors(req, res);
    handleRoutes(req, res);
  });
}

module.exports = {
  createServer
};
