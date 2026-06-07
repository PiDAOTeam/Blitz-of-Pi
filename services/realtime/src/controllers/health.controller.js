const { REALTIME_INSTANCE_ID, REALTIME_PORT } = require("../config");

function getHealth() {
  return {
    service: "realtime",
    project: "Blitz of Pi",
    status: "ok",
    instanceId: REALTIME_INSTANCE_ID,
    port: REALTIME_PORT
  };
}

module.exports = {
  getHealth
};
