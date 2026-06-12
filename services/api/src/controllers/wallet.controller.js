const { getActiveUserFromToken } = require("../services/auth.service");
const { getWallet, listLedgers } = require("../repositories/wallet.repository");
const { listUserAssetBattleLedgerRows } = require("../repositories/battle.repository");
const { listUserEngagementAssetRewardRows } = require("../repositories/engagement.repository");
const { listUserRewards: listUserWatchShareholderRewards } = require("../repositories/watch-shareholder.repository");
const { readGameConfig } = require("../repositories/game-config.repository");
const assetGateway = require("../services/asset-gateway.service");

async function getUserFromRequest(req) {
  const token = req.headers.authorization?.replace("Bearer ", "") || "";
  return getActiveUserFromToken(token);
}

function getAssetModeName(mode = "", assetType = "") {
  if (mode === "points_battle" || assetType === "POINTS") return "小富豪";
  if (mode === "poc_battle" || assetType === "POC") return "大富豪";
  return "对战";
}

function toPiLedgerDto(ledger) {
  return {
    ...ledger,
    asset_type: "PI",
    synthetic: false
  };
}

function buildAssetBattleLedgers(rows, uid) {
  const ledgers = [];

  for (const row of rows) {
    const assetType = String(row.asset_type || "").toUpperCase();
    const modeName = getAssetModeName(row.mode, assetType);
    const entryFee = Number(row.entry_fee || 0);
    const rewardAmount = Number(row.reward_amount || 0);
    const isWinner = row.winner_uid === uid;
    const isDraw = !row.winner_uid;
    const isLoser = row.loser_uid === uid;
    const entryFeeRefunded = String(row.asset_error || "").includes("已补回入场费");
    const settled = row.asset_settlement_status === "settled";
    const released = row.asset_settlement_status === "released";
    const createdAt = row.created_at;
    const finishedAt = row.finished_at || row.created_at;

    if (entryFee > 0) {
      ledgers.push({
        id: `asset:${row.room_no}:${uid}:entry`,
        uid,
        type: "battle_entry",
        direction: "out",
        amount: entryFee,
        balance_after: null,
        related_type: "asset_battle_entry",
        related_id: `${row.room_no}:${uid}`,
        remark: `${modeName}入场费`,
        created_at: createdAt,
        asset_type: assetType,
        mode: row.mode,
        settlement_status: row.asset_settlement_status || "",
        synthetic: true
      });
    }

    if (isWinner && rewardAmount > 0 && settled) {
      ledgers.push({
        id: `asset:${row.room_no}:${uid}:reward`,
        uid,
        type: "reward",
        direction: "in",
        amount: rewardAmount,
        balance_after: null,
        related_type: "asset_battle_reward",
        related_id: row.room_no,
        remark: `${modeName}获胜奖励`,
        created_at: finishedAt,
        asset_type: assetType,
        mode: row.mode,
        settlement_status: row.asset_settlement_status || "",
        synthetic: true
      });
    }

    if (isDraw && entryFee > 0 && released) {
      ledgers.push({
        id: `asset:${row.room_no}:${uid}:refund`,
        uid,
        type: "battle_refund",
        direction: "in",
        amount: entryFee,
        balance_after: null,
        related_type: "asset_battle_refund",
        related_id: `${row.room_no}:${uid}`,
        remark: `${modeName}平局退回`,
        created_at: finishedAt,
        asset_type: assetType,
        mode: row.mode,
        settlement_status: row.asset_settlement_status || "",
        synthetic: true
      });
    }

    if (isLoser && entryFee > 0 && entryFeeRefunded) {
      ledgers.push({
        id: `asset:${row.room_no}:${uid}:entry-refund`,
        uid,
        type: "battle_entry_refund",
        direction: "in",
        amount: entryFee,
        balance_after: null,
        related_type: "asset_battle_entry_refund",
        related_id: `${row.room_no}:${uid}`,
        remark: `${modeName}入场费补回`,
        created_at: finishedAt,
        asset_type: assetType,
        mode: row.mode,
        settlement_status: row.asset_settlement_status || "",
        synthetic: true
      });
    }
  }

  return ledgers;
}

function getEngagementRewardRemark(row, assetType) {
  const assetName = assetType === "POINTS" ? "积分" : "POC";
  if (row.claim_type === "task") {
    return `每日任务奖励：${row.title || "任务"}（${assetName}）`;
  }
  return `每日签到奖励（${assetName}）`;
}

function buildEngagementAssetLedgers(rows, uid) {
  const ledgers = [];

  for (const row of rows) {
    let rewards = [];
    try {
      rewards = JSON.parse(row.reward_json || "[]");
    } catch (error) {
      rewards = [];
    }

    for (const reward of rewards) {
      const assetType = String(reward.assetType || reward.asset_type || "").toUpperCase();
      const amount = Number(reward.amount || 0);
      if (!["POINTS", "POC"].includes(assetType) || amount <= 0) continue;

      ledgers.push({
        id: `engagement:${row.id}:${assetType}`,
        uid,
        type: row.claim_type === "task" ? "daily_task_reward" : "daily_signin_reward",
        direction: "in",
        amount,
        balance_after: null,
        related_type: row.claim_type === "task" ? "engagement_task_asset" : "engagement_sign_in_asset",
        related_id: `${row.id}:${assetType}`,
        remark: getEngagementRewardRemark(row, assetType),
        created_at: row.created_at,
        asset_type: assetType,
        synthetic: true
      });
    }
  }

  return ledgers;
}

function buildWatchShareholderLedgers(rows, uid) {
  return (Array.isArray(rows) ? rows : [])
    .filter((row) => row.status === "paid" && Number(row.reward_points || 0) > 0)
    .map((row) => ({
      id: `watch_shareholder:${row.id}`,
      uid,
      type: "watch_shareholder_reward",
      direction: "in",
      amount: Math.floor(Number(row.reward_points || 0)),
      balance_after: null,
      related_type: "watch_shareholder_reward",
      related_id: `${row.season_no}:${row.pi_uid}`,
      remark: `腕表节点股东分红 ${row.season_no}`,
      created_at: row.processed_at || row.claimed_at || row.updated_at || row.created_at,
      asset_type: "POINTS",
      synthetic: true
    }));
}

function sortLedgersByTime(ledgers) {
  return [...ledgers].sort((a, b) => {
    const left = new Date(a.created_at || 0).getTime();
    const right = new Date(b.created_at || 0).getTime();
    return right - left;
  });
}

async function getMyWallet(req) {
  const user = await getUserFromRequest(req);
  const wallet = await getWallet(user.uid);
  const ledgers = (await listLedgers(user.uid)).map(toPiLedgerDto);
  const battleAssetLedgers = buildAssetBattleLedgers(await listUserAssetBattleLedgerRows(user.uid), user.uid);
  const engagementAssetLedgers = buildEngagementAssetLedgers(
    await listUserEngagementAssetRewardRows(user.uid),
    user.uid
  );
  const watchShareholderLedgers = buildWatchShareholderLedgers(
    await listUserWatchShareholderRewards(user.uid, 80),
    user.uid
  );
  const assetLedgers = sortLedgersByTime([...battleAssetLedgers, ...engagementAssetLedgers, ...watchShareholderLedgers]);
  const allLedgers = sortLedgersByTime([...ledgers, ...assetLedgers]).slice(0, 120);
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
    ledgers,
    assetLedgers,
    allLedgers
  };
}

module.exports = {
  getMyWallet,
  getUserFromRequest
};
