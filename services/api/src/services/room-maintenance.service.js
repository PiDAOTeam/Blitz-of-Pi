const { expireStaleFreeBotRooms } = require("./match.service");

const CHECK_INTERVAL_MS = Math.max(30_000, Number(process.env.ROOM_MAINTENANCE_INTERVAL_MS || 60_000));
const STALE_FREE_ROOM_MINUTES = Math.min(
  60,
  Math.max(
    2,
    Number.parseInt(
      String(process.env.STALE_FREE_ROOM_MINUTES || process.env.STALE_FREE_BOT_ROOM_MINUTES || 5),
      10
    ) || 5
  )
);

let schedulerStarted = false;
let schedulerRunning = false;

async function runRoomMaintenance() {
  if (schedulerRunning) return null;

  schedulerRunning = true;
  try {
    const expiredFreeRooms = await expireStaleFreeBotRooms(STALE_FREE_ROOM_MINUTES);

    if (expiredFreeRooms > 0) {
      console.log(`[room-maintenance] expired stale free rooms: ${expiredFreeRooms}`);
    }

    return {
      expiredFreeRooms
    };
  } catch (error) {
    console.error("[room-maintenance] failed:", error.message);
    return null;
  } finally {
    schedulerRunning = false;
  }
}

function startRoomMaintenanceScheduler() {
  if (schedulerStarted) return;
  if (String(process.env.ROOM_MAINTENANCE_ENABLED || "true").toLowerCase() === "false") {
    return;
  }

  schedulerStarted = true;

  setTimeout(() => {
    runRoomMaintenance();
  }, 20 * 1000).unref?.();

  setInterval(() => {
    runRoomMaintenance();
  }, CHECK_INTERVAL_MS).unref?.();

  console.log(
    `[room-maintenance] scheduler started interval=${CHECK_INTERVAL_MS}ms staleFreeRoomMinutes=${STALE_FREE_ROOM_MINUTES}`
  );
}

module.exports = {
  startRoomMaintenanceScheduler,
  runRoomMaintenance
};
