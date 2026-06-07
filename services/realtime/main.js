const { REALTIME_INSTANCE_ID, REALTIME_PORT } = require("./config");
const { createServer } = require("./server");

const server = createServer();

server.listen(REALTIME_PORT, "0.0.0.0", () => {
  console.log(`[realtime] ${REALTIME_INSTANCE_ID} listening on ${REALTIME_PORT}`);
});
