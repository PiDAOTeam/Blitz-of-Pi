const {
  readHomeConfig,
  writeHomeConfig
} = require("../repositories/home-config.repository");

async function getHomeConfig() {
  const config = await readHomeConfig();

  return {
    ...config,
    heroButtons: [
      { code: "quick_battle", label: "快速开战" },
      { code: "points_battle", label: "小富豪" },
      { code: "poc_battle", label: "大富豪" },
      { code: "pi_battle", label: "超级富豪" }
    ]
  };
}

async function updateHomeConfig(payload) {
  const current = await readHomeConfig();
  const next = {
    ...current,
    ...payload
  };

  return writeHomeConfig(next);
}

module.exports = {
  getHomeConfig,
  updateHomeConfig
};
