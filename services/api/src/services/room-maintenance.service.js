const { expireStaleFreeBotRooms, expireStaleRemoteAssetBotRooms, expireNeverJoinedPaidRooms } = require("./match.service");

const STALE_UNJOINED_PAID_SECONDS = Math.min(
  300,
  Math.max(30, Number.parseInt(String(process.env.STALE_UNJOINED_PAID_SECONDS || 45), 10) || 45)
);

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
const STALE_ASSET_BOT_ROOM_MINUTES = Math.min(
  1440,
  Math.max(5, Number.parseInt(String(process.env.STALE_ASSET_BOT_ROOM_MINUTES || 5), 10) || 5)
);

let schedulerStarted = false;
let schedulerRunning = false;

async function runRoomMaintenance() {
  if (schedulerRunning) return null;

  schedulerRunning = true;
  try {
    const expiredFreeRooms = await expireStaleFreeBotRooms(STALE_FREE_ROOM_MINUTES);
    const assetBotResults = await expireStaleRemoteAssetBotRooms(STALE_ASSET_BOT_ROOM_MINUTES, 20);
    const unjoinedPaidResults = await expireNeverJoinedPaidRooms(STALE_UNJOINED_PAID_SECONDS, 20);
    const releasedAssetBotRooms = assetBotResults.filter((result) => result.status === "released").length;
    const failedAssetBotRooms = assetBotResults.filter((result) => result.status === "failed").length;
    const releasedUnjoinedPaidRooms = unjoinedPaidResults.filter((result) => result.status === "released").length;
    const failedUnjoinedPaidRooms = unjoinedPaidResults.filter((result) => result.status === "failed").length;

    if (expiredFreeRooms > 0) {
      console.log(`[room-maintenance] expired stale free rooms: ${expiredFreeRooms}`);
    }
    if (releasedAssetBotRooms > 0 || failedAssetBotRooms > 0) {
      console.log(
        `[room-maintenance] stale asset bot rooms released=${releasedAssetBotRooms} failed=${failedAssetBotRooms}`
      );
    }
    if (releasedUnjoinedPaidRooms > 0 || failedUnjoinedPaidRooms > 0) {
      console.log(
        `[room-maintenance] unjoined paid rooms released=${releasedUnjoinedPaidRooms} failed=${failedUnjoinedPaidRooms}`
      );
    }

    return {
      expiredFreeRooms,
      releasedAssetBotRooms,
      failedAssetBotRooms,
      releasedUnjoinedPaidRooms,
      failedUnjoinedPaidRooms
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
    `[room-maintenance] scheduler started interval=${CHECK_INTERVAL_MS}ms staleFreeRoomMinutes=${STALE_FREE_ROOM_MINUTES} staleUnjoinedPaidSeconds=${STALE_UNJOINED_PAID_SECONDS}`
  );
}

module.exports = {
  startRoomMaintenanceScheduler,
  runRoomMaintenance
};
