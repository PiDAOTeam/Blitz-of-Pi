const { API_PORT } = require("./config");
const { createServer } = require("./server");
const { startRankScheduler } = require("./services/rank-scheduler.service");
const { startPaymentScheduler } = require("./services/payment-scheduler.service");
const { startSettlementWorker } = require("./services/settlement-worker.service");
const { startRoomMaintenanceScheduler } = require("./services/room-maintenance.service");

const server = createServer();
const bindHost = process.env.BIND_HOST || "127.0.0.1";

server.listen(API_PORT, bindHost, () => {
  console.log(`[api] listening on ${bindHost}:${API_PORT}`);
  startRankScheduler();
  startPaymentScheduler();
  startSettlementWorker();
  startRoomMaintenanceScheduler();
});
