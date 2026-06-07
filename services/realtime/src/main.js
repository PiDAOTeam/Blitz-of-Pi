const { REALTIME_INSTANCE_ID, REALTIME_PORT } = require("./config");
const { createServer } = require("./server");

const server = createServer();
const bindHost = process.env.BIND_HOST || "127.0.0.1";

server.listen(REALTIME_PORT, bindHost, () => {
  console.log(`[realtime] ${REALTIME_INSTANCE_ID} listening on ${bindHost}:${REALTIME_PORT}`);
});
