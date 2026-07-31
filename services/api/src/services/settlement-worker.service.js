const {
  ensureSettlementTaskSchema,
  enqueueSettlementTask,
  claimDueSettlementTask,
  markSettlementTaskSkipped,
  markSettlementTaskSucceeded,
  markSettlementTaskFailed,
  getSettlementTaskStats
} = require("../repositories/settlement-task.repository");
const { findBattleRoom } = require("../repositories/battle.repository");
const { settleFinishedRoom } = require("./match.service");

const WORKER_ID = `${process.pid}:${Date.now()}`;
const CHECK_INTERVAL_MS = 1000;
const SETTLEMENT_WORKER_CONCURRENCY = Math.max(
  1,
  Math.min(4, Number(process.env.API_SETTLEMENT_CONCURRENCY || 1))
);

let workerStarted = false;
let activeWorkers = 0;
let drainScheduled = false;

function parseRoomPayload(payload) {
  if (!payload) return null;
  if (typeof payload === "string") return JSON.parse(payload);
  return payload;
}

function getRetryDelaySeconds(attempts = 0) {
  return Math.min(180, 3 * 2 ** Math.min(Number(attempts || 0), 6));
}

function isReleasedTerminalBattle(battle) {
  return (
    ["expired", "cancelled"].includes(String(battle?.status || "")) &&
    String(battle?.asset_settlement_status || "") === "released"
  );
}

async function enqueueRealtimeSettlement(room) {
  const task = await enqueueSettlementTask(room);
  scheduleDrain();

  return {
    queued: true,
    roomNo: task?.room_no || room?.roomNo || "",
    status: task?.status || "pending"
  };
}

function scheduleDrain() {
  if (drainScheduled) return;
  drainScheduled = true;

  setImmediate(() => {
    drainScheduled = false;
    drainSettlementTasks().catch((error) => {
      console.error("[settlement-worker] drain failed:", error.message);
    });
  });
}

async function drainSettlementTasks() {
  while (activeWorkers < SETTLEMENT_WORKER_CONCURRENCY) {
    const task = await claimDueSettlementTask(WORKER_ID);
    if (!task) return;

    activeWorkers += 1;
    processSettlementTask(task)
      .catch((error) => {
        console.error("[settlement-worker] task crashed:", error.message);
      })
      .finally(() => {
        activeWorkers -= 1;
        scheduleDrain();
      });
  }
}

async function processSettlementTask(task) {
  try {
    const room = parseRoomPayload(task.room_payload);
    if (!room?.roomNo) {
      throw new Error("结算任务缺少房间快照");
    }

    const battle = await findBattleRoom(room.roomNo);
    if (isReleasedTerminalBattle(battle)) {
      await markSettlementTaskSkipped(task.id, "房间已过期且资产已释放，无需再次结算");
      console.log(`[settlement-worker] task skipped ${task.room_no}: released terminal room`);
      return;
    }

    await settleFinishedRoom(room);
    await markSettlementTaskSucceeded(task.id);
  } catch (error) {
    const latestBattle = await findBattleRoom(task.room_no).catch(() => null);
    if (isReleasedTerminalBattle(latestBattle)) {
      await markSettlementTaskSkipped(task.id, "房间已过期且资产已释放，无需再次结算");
      console.log(`[settlement-worker] task skipped ${task.room_no}: released after retry`);
      return;
    }

    const delaySeconds = getRetryDelaySeconds(task.attempts);
    const nextAttempt = Number(task.attempts || 0) + 1;
    const updatedTask = await markSettlementTaskFailed(task.id, error, delaySeconds);
    if (updatedTask?.status === "manual_review") {
      console.warn(
        `[settlement-worker] task manual review ${task.room_no}: ${error.message}; attempts=${nextAttempt}`
      );
    } else {
      console.log(
        `[settlement-worker] task retry ${task.room_no}: ${error.message}; attempt=${nextAttempt}; next=${delaySeconds}s`
      );
    }
  }
}

function startSettlementWorker() {
  if (workerStarted) return;
  workerStarted = true;

  ensureSettlementTaskSchema()
    .then(() => {
      scheduleDrain();
      setInterval(scheduleDrain, CHECK_INTERVAL_MS).unref?.();
      console.log(
        `[settlement-worker] started concurrency=${SETTLEMENT_WORKER_CONCURRENCY}`
      );
    })
    .catch((error) => {
      console.error("[settlement-worker] start failed:", error.message);
    });
}

module.exports = {
  enqueueRealtimeSettlement,
  startSettlementWorker,
  drainSettlementTasks,
  getSettlementTaskStats,
  getRetryDelaySeconds,
  isReleasedTerminalBattle
};
