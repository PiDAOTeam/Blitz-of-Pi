const { query } = require("../db/mysql");

const DEFAULT_PI_CONFIG = {
  runtimeMode: "production",
  frontendSandbox: false,
  sandboxUrl: "https://sandbox.minepi.com/app/blitz-of-pi",
  productionUrl: "https://blitz.hashpi.app"
};

async function readPiConfig() {
  try {
    const rows = await query(
      "SELECT config_value FROM system_configs WHERE config_group = ? AND config_key = ? AND status = 1 LIMIT 1",
      ["pi", "runtime_config"]
    );

    if (rows[0]?.config_value) {
      const value =
        typeof rows[0].config_value === "string"
          ? JSON.parse(rows[0].config_value)
          : rows[0].config_value;
      return {
        ...DEFAULT_PI_CONFIG,
        ...value
      };
    }
  } catch (error) {
    console.error("[pi-config] MySQL read failed:", error.message);
  }

  return DEFAULT_PI_CONFIG;
}

async function writePiConfig(payload) {
  const next = {
    ...DEFAULT_PI_CONFIG,
    ...payload,
    frontendSandbox: payload.runtimeMode === "sandbox" || Boolean(payload.frontendSandbox)
  };

  try {
    await query(
      `INSERT INTO system_configs (
        config_group,
        config_key,
        config_name,
        config_value,
        value_type,
        description,
        is_public,
        status
      ) VALUES (?, ?, ?, CAST(? AS JSON), ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        config_value = VALUES(config_value),
        updated_at = CURRENT_TIMESTAMP`,
      [
        "pi",
        "runtime_config",
        "Pi运行环境配置",
        JSON.stringify(next),
        "json",
        "控制前端 Pi SDK 沙盒/主网模式，不保存 API Key",
        1,
        1
      ]
    );
  } catch (error) {
    console.error("[pi-config] MySQL write failed:", error.message);
    throw error;
  }

  return next;
}

module.exports = {
  DEFAULT_PI_CONFIG,
  readPiConfig,
  writePiConfig
};
