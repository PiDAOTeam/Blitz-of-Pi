const { getDashboardOverview } = require("../services/dashboard.service");

async function getAdminDashboard() {
  return getDashboardOverview();
}

module.exports = {
  getAdminDashboard
};
