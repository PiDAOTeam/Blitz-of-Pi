const { getHomeConfig } = require("../services/home-config.service");
const { readPublicStats } = require("../repositories/public-stats.repository");

async function getHomeIndex() {
  const [config, stats] = await Promise.all([getHomeConfig(), readPublicStats()]);

  return {
    ...config,
    stats
  };
}

module.exports = {
  getHomeIndex
};
