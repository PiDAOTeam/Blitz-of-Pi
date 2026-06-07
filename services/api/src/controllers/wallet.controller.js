const { getActiveUserFromToken } = require("../services/auth.service");
const { getWallet, listLedgers } = require("../repositories/wallet.repository");
const { readGameConfig } = require("../repositories/game-config.repository");
const assetGateway = require("../services/asset-gateway.service");

async function getUserFromRequest(req) {
  const token = req.headers.authorization?.replace("Bearer ", "") || "";
  return getActiveUserFromToken(token);
}

async function getMyWallet(req) {
  const user = await getUserFromRequest(req);
  const wallet = await getWallet(user.uid);
  const ledgers = await listLedgers(user.uid);
  const config = await readGameConfig();
  let remoteAssets = null;
  let remoteAssetsError = "";

  if (config.assetGateway?.enabled && config.assetGateway?.summaryEnabled !== false) {
    try {
      remoteAssets = await assetGateway.summary(user);
    } catch (error) {
      remoteAssetsError = error.message || "资产网关查询失败";
    }
  }

  return {
    uid: user.uid,
    availableBalance: Number(wallet.available_balance),
    lockedBalance: Number(wallet.locked_balance),
    totalRecharge: Number(wallet.total_recharge),
    totalWithdraw: Number(wallet.total_withdraw),
    totalReward: Number(wallet.total_reward),
    remoteAssets,
    remoteAssetsError,
    ledgers
  };
}

module.exports = {
  getMyWallet,
  getUserFromRequest
};
