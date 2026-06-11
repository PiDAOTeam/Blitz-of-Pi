const { readGameConfig } = require("../repositories/game-config.repository");
const { writeGameConfig } = require("../repositories/game-config.repository");

async function getAdminGameConfig() {
  return readGameConfig();
}

async function getPublicGameConfig() {
  const config = await readGameConfig();
  const exposeMode = (modeConfig = {}) => ({
    key: modeConfig.key || "",
    name: modeConfig.name || "",
    assetType: modeConfig.assetType || "PI",
    enabled: modeConfig.enabled,
    entryFee: Number(modeConfig.entryFee || 0),
    platformFeeRate: Number(modeConfig.platformFeeRate || 0),
    rewardRate: Number(modeConfig.rewardRate || 0),
    botMatchEnabled: Boolean(modeConfig.botMatchEnabled),
    botRewardsEnabled: Boolean(modeConfig.botRewardsEnabled)
  });

  return {
    quickBattle: exposeMode(config.quickBattle),
    ticketBattle: { ...exposeMode(config.piBattle), key: "ticket_battle", name: "超级富豪（Pi）" },
    richBattle: { ...exposeMode(config.piBattle), key: "rich_battle", name: "超级富豪（Pi）" },
    pointsBattle: exposeMode(config.pointsBattle),
    pocBattle: exposeMode(config.pocBattle),
    piBattle: exposeMode(config.piBattle),
    battleModes: [
      exposeMode(config.quickBattle),
      exposeMode(config.pointsBattle),
      exposeMode(config.pocBattle),
      exposeMode(config.piBattle)
    ],
    assetGateway: {
      enabled: Boolean(config.assetGateway?.enabled),
      summaryEnabled: config.assetGateway?.summaryEnabled !== false,
      pointsEnabled: Boolean(config.assetGateway?.pointsEnabled),
      pocEnabled: Boolean(config.assetGateway?.pocEnabled)
    },
    timing: config.timing || {},
    capacity: config.capacity || {},
    extremeRealtime: {
      enabled: true,
      rollbackToLegacy: false,
      enabledModes: ["quick_battle", "points_battle", "poc_battle", "pi_battle"],
      grayPercent: 100,
      grayUserPiUids: [],
      grayUserPiUsernames: [],
      maxPendingSwaps: Number(config.extremeRealtime?.maxPendingSwaps || 3),
      snapshotIntervalMs: Number(config.extremeRealtime?.snapshotIntervalMs || 2000),
      swapMinIntervalMs: Number(config.extremeRealtime?.swapMinIntervalMs || 120),
      metricsSampleRate: Number(config.extremeRealtime?.metricsSampleRate ?? 0.05)
    },
    withdrawRisk: {
      minAmount: Number(config.withdrawRisk?.minAmount || 0),
      dailyLimitAmount: Number(config.withdrawRisk?.dailyLimitAmount || 0),
      feeRate: Number(config.withdrawRisk?.feeRate || 0),
      walletValidationRequired: config.withdrawRisk?.walletValidationRequired !== false
    },
    rechargeBonus: {
      enabled: Boolean(config.rechargeBonus?.enabled),
      bonusRate: Number(config.rechargeBonus?.bonusRate || 0),
      maxBonusAmount: Number(config.rechargeBonus?.maxBonusAmount || 0),
      presets: (config.rechargeBonus?.presets || [])
        .filter((preset) => preset.enabled !== false && Number(preset.amount || 0) > 0)
        .map((preset) => ({
          amount: Number(preset.amount || 0),
          bonusAmount: Number(preset.bonusAmount || 0),
          label: preset.label || `${Number(preset.amount || 0)} Pi`
        }))
    },
    transfer: {
      enabled: config.transfer?.enabled !== false,
      minAmount: Number(config.transfer?.minAmount || 0),
      maxAmount: Number(config.transfer?.maxAmount || 0),
      dailyLimitAmount: Number(config.transfer?.dailyLimitAmount || 0),
      feeRate: Number(config.transfer?.feeRate || 0),
      feeMinAmount: Number(config.transfer?.feeMinAmount || 0),
      cooldownSeconds: Number(config.transfer?.cooldownSeconds || 0)
    },
    inviteRewards: {
      enabled: config.inviteRewards?.enabled !== false,
      bindEnabled: config.inviteRewards?.bindEnabled !== false,
      bindRequiredEnabled: config.inviteRewards?.bindRequiredEnabled !== false,
      bindRequiredAfterBattles: Number(config.inviteRewards?.bindRequiredAfterBattles || 5),
      bindRequiredModes: Array.isArray(config.inviteRewards?.bindRequiredModes)
        ? config.inviteRewards.bindRequiredModes
        : ["quick_battle", "points_battle", "poc_battle", "pi_battle"],
      officialInviterPiUsername: config.inviteRewards?.officialInviterPiUsername || "",
      bindRequiredMessage: config.inviteRewards?.bindRequiredMessage || "请先绑定邀请人，再继续对战。",
      qualificationEnabled: config.inviteRewards?.qualificationEnabled !== false,
      qualificationRequiredBattles: Number(config.inviteRewards?.qualificationRequiredBattles || 2),
      qualificationRewardAmount: Number(config.inviteRewards?.qualificationRewardAmount || 0),
      battleCommissionEnabled: config.inviteRewards?.battleCommissionEnabled !== false,
      commissionBase: config.inviteRewards?.commissionBase || "entry_fee",
      maxCommissionRate: Number(config.inviteRewards?.maxCommissionRate || 0),
      levels: (config.inviteRewards?.levels || []).map((level) => ({
        key: level.key,
        name: level.name,
        commissionRate: Number(level.commissionRate || 0),
        minBalance: Number(level.minBalance || 0),
        minDirectInvites: Number(level.minDirectInvites || 0)
      }))
    },
    engagement: {
      enabled: config.engagement?.enabled !== false,
      dailySignIn: {
        enabled: config.engagement?.dailySignIn?.enabled !== false,
        title: config.engagement?.dailySignIn?.title || "每日签到",
        piRewardEnabled: config.engagement?.dailySignIn?.piRewardEnabled !== false,
        rewardAmount: Number(config.engagement?.dailySignIn?.rewardAmount || 0),
        pointsRewardEnabled: Boolean(config.engagement?.dailySignIn?.pointsRewardEnabled),
        pointsRewardAmount: Number(config.engagement?.dailySignIn?.pointsRewardAmount || 0),
        pocRewardEnabled: Boolean(config.engagement?.dailySignIn?.pocRewardEnabled),
        pocRewardAmount: Number(config.engagement?.dailySignIn?.pocRewardAmount || 0)
      },
      tasks: (config.engagement?.tasks || [])
        .filter((task) => task.enabled !== false)
        .map((task) => ({
          key: task.key,
          title: task.title,
          condition: task.condition,
          modes: Array.isArray(task.modes) ? task.modes : [],
          requiredCount: Number(task.requiredCount || 1),
          rewardAmount: Number(task.rewardAmount || 0)
        }))
    },
    visualEffects: {
      defaultMode: config.visualEffects?.defaultMode || "balanced",
      piBrowserDefaultMode: config.visualEffects?.piBrowserDefaultMode || "balanced",
      allowUserChoice: config.visualEffects?.allowUserChoice !== false,
      allowHighMode: true,
      autoDowngradeEnabled: config.visualEffects?.autoDowngradeEnabled !== false,
      dragTrailEnabled: config.visualEffects?.dragTrailEnabled !== false,
      hapticEnabled: config.visualEffects?.hapticEnabled !== false,
      attackWarningEnabled: config.visualEffects?.attackWarningEnabled !== false,
      attackWarningText: config.visualEffects?.attackWarningText || "被攻击 压力+{attack}",
      animationDurations: config.visualEffects?.animationDurations || {}
    },
    operation: {
      maintenanceEnabled: Boolean(config.operation?.maintenanceEnabled),
      maintenanceNotice: config.operation?.maintenanceNotice || "",
      localizedContent: config.operation?.localizedContent || {},
      ranks: (config.operation?.ranks || [])
        .filter((rank) => rank.enabled !== false)
        .map((rank) => ({
          key: rank.key,
          name: rank.name,
          icon: rank.icon,
          color: rank.color
        })),
      tileTheme: config.operation?.tileTheme || {},
      rankRules: config.operation?.rankRules || {}
    }
  };
}

async function saveAdminGameConfig(payload) {
  return writeGameConfig(payload || {});
}

module.exports = {
  getPublicGameConfig,
  getAdminGameConfig,
  saveAdminGameConfig
};
