const { readDashboard } = require("../repositories/dashboard.repository");

async function getDashboardOverview() {
  return readDashboard();
}

module.exports = {
  getDashboardOverview
};
