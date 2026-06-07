const { PI_APP_SLUG, PI_API_KEY, PI_SANDBOX } = require("../config");
const { readPiConfig, writePiConfig } = require("../repositories/pi-config.repository");

async function getPiRuntimeConfig() {
  const runtimeConfig = await readPiConfig();

  return {
    appSlug: PI_APP_SLUG || "blitz-of-pi",
    sandbox: PI_SANDBOX,
    hasApiKey: Boolean(PI_API_KEY),
    runtimeMode: runtimeConfig.runtimeMode,
    frontendSandbox: runtimeConfig.frontendSandbox,
    sandboxUrl: runtimeConfig.sandboxUrl,
    productionUrl: runtimeConfig.productionUrl
  };
}

async function getAdminPiRuntimeConfig() {
  return getPiRuntimeConfig();
}

async function saveAdminPiRuntimeConfig(payload) {
  const runtimeMode = payload.runtimeMode === "sandbox" ? "sandbox" : "production";

  return writePiConfig({
    runtimeMode,
    frontendSandbox: runtimeMode === "sandbox",
    sandboxUrl: payload.sandboxUrl,
    productionUrl: payload.productionUrl
  });
}

module.exports = {
  getPiRuntimeConfig,
  getAdminPiRuntimeConfig,
  saveAdminPiRuntimeConfig
};
