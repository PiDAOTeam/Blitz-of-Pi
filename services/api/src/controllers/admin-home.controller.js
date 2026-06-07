const {
  getHomeConfig,
  updateHomeConfig
} = require("../services/home-config.service");

async function getAdminHomeConfig() {
  return getHomeConfig();
}

async function saveAdminHomeConfig(payload) {
  return updateHomeConfig(payload);
}

module.exports = {
  getAdminHomeConfig,
  saveAdminHomeConfig
};
