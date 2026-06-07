const crypto = require("node:crypto");
const { transaction } = require("../db/mysql");
const { readGameConfig } = require("../repositories/game-config.repository");
const {
  decreaseBalance,
  increaseBalance,
  getWallet,
  getWalletForUpdate
} = require("../repositories/wallet.repository");
const {
  searchUsers,
  findUserByPiUsername,
  createTransferOrder,
  listTransfers,
  getTodayTransferAmount,
  getLatestTransfer,
  ensureInviteStats,
  findInviteRelationByInvitee,
  createInviteRelation,
  countFinishedBattles,
  findQualificationReward,
  createQualificationReward,
  listClaimableRewards,
  markRewardClaimed,
  findBattleCommissionReward,
  createBattleCommissionReward,
  incrementQualifiedInvite,
  incrementCommissionStats,
  incrementQualificationRewardStats,
  updateInviteLevel,
  getInviteDashboard,
  listInviteRelations,
  listInviteRewards
} = require("../repositories/growth.repository");

function createNo(prefix) {
  return `${prefix}${Date.now()}${crypto.randomBytes(5).toString("hex").toUpperCase()}`;
}

function normalizeAmount(value) {
  return Number(Number(value || 0).toFixed(8));
}

function sortByUid(rows = [], key = "uid") {
  return [...rows].sort((a, b) => String(a?.[key] || "").localeCompare(String(b?.[key] || "")));
}

function toUserLite(row) {
  if (!row) return null;
  return {
    uid: row.uid,
    piUsername: row.pi_username || "",
    nickname: row.nickname || "",
    avatarKey: row.avatar_key || "avatar_1",
    rankName: row.rank_name || "青铜"
  };
}

function getDisplayName(row, prefix = "") {
  return row?.nickname || row?.invitee_nickname || row?.pi_username || row?.invitee_pi_username || row?.piUsername || row?.uid || prefix || "好友";
}

function getEnabledInviteLevels(config) {
  const levels = Array.isArray(config.inviteRewards?.levels) ? config.inviteRewards.levels : [];
  return levels
    .filter((level) => level.enabled !== false)
    .sort((a, b) => Number(a.minBalance || 0) - Number(b.minBalance || 0) || Number(a.minDirectInvites || 0) - Number(b.minDirectInvites || 0));
}

function resolveInviteLevel(config, stats, wallet) {
  const levels = getEnabledInviteLevels(config);
  if (!levels.length) return null;

  const balance = Number(wallet?.available_balance || 0);
  const directInvites = Number(stats?.direct_invite_count || 0);
  let matched = null;

  for (const level of levels) {
    const minBalance = Number(level.minBalance || 0);
    const minDirectInvites = Number(level.minDirectInvites || 0);
    const balanceMatched = minBalance > 0 && balance >= minBalance;
    const inviteMatched = minDirectInvites > 0 && directInvites >= minDirectInvites;

    if (balanceMatched || inviteMatched) {
      matched = level;
    }
  }

  return matched;
}

async function refreshInviteLevel(uid, config, connection = null) {
  const stats = await ensureInviteStats(uid, connection);
  const wallet = connection ? await getWalletForUpdate(uid, connection) : await getWallet(uid);
  const level = resolveInviteLevel(config, stats, wallet);

  if (level && stats.level_key !== level.key) {
    await updateInviteLevel(uid, level.key, connection);
    return level;
  }

  if (!level && stats.level_key) {
    await updateInviteLevel(uid, "", connection);
  }

  return level;
}

function calcTransferFee(amount, transferConfig) {
  const feeRate = Number(transferConfig.feeRate || 0);
  const minFee = Number(transferConfig.feeMinAmount || 0);
  const rawFee = feeRate > 0 ? amount * feeRate : 0;
  return normalizeAmount(Math.max(rawFee, rawFee > 0 ? minFee : 0));
}

async function searchTransferUsers(keyword, requesterUid) {
  const rows = await searchUsers(keyword);
  return rows.filter((row) => row.uid !== requesterUid).map(toUserLite);
}

async function transferBalance(fromUser, payload) {
  const config = await readGameConfig();
  const transferConfig = config.transfer || {};

  if (transferConfig.enabled === false) {
    throw new Error("平台转账暂未开启");
  }

  const amount = normalizeAmount(payload.amount);
  const toKeyword = String(payload.toPiUsername || payload.toUid || "").trim();

  if (!toKeyword) {
    throw new Error("请填写收款用户 Pi 用户名");
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("转账金额不正确");
  }

  if (amount < Number(transferConfig.minAmount || 0)) {
    throw new Error(`单笔转账至少 ${transferConfig.minAmount} Pi`);
  }

  if (Number(transferConfig.maxAmount || 0) > 0 && amount > Number(transferConfig.maxAmount)) {
    throw new Error(`单笔转账最多 ${transferConfig.maxAmount} Pi`);
  }

  return transaction(async (connection) => {
    const receiver = await findUserByPiUsername(toKeyword, connection);

    if (!receiver || Number(receiver.status) === 0) {
      throw new Error("收款用户不存在或已被限制");
    }

    if (receiver.uid === fromUser.uid) {
      throw new Error("不能转账给自己");
    }

    const todayAmount = await getTodayTransferAmount(fromUser.uid, connection);
    const latestTransfer = await getLatestTransfer(fromUser.uid, connection);
    const cooldownSeconds = Math.max(0, Number(transferConfig.cooldownSeconds || 0));
    const feeAmount = calcTransferFee(amount, transferConfig);
    const totalCost = normalizeAmount(amount + feeAmount);

    if (Number(transferConfig.dailyLimitAmount || 0) > 0 && todayAmount + totalCost > Number(transferConfig.dailyLimitAmount)) {
      throw new Error("今日转账额度已达上限");
    }

    if (latestTransfer?.created_at && cooldownSeconds > 0) {
      const latestAt = new Date(latestTransfer.created_at).getTime();
      const remainSeconds = Math.ceil((cooldownSeconds * 1000 - (Date.now() - latestAt)) / 1000);
      if (remainSeconds > 0) {
        throw new Error(`转账太频繁，请 ${remainSeconds} 秒后再试`);
      }
    }

    const transferNo = createNo("TR");

    await decreaseBalance(
      fromUser.uid,
      totalCost,
      {
        type: "transfer_out",
        relatedType: "wallet_transfer_out",
        relatedId: transferNo,
        remark: `转账给 ${receiver.pi_username || receiver.nickname}`
      },
      connection
    );

    await increaseBalance(
      receiver.uid,
      amount,
      {
        type: "transfer_in",
        relatedType: "wallet_transfer_in",
        relatedId: transferNo,
        remark: `收到 ${fromUser.pi_username || fromUser.nickname} 转账`
      },
      connection
    );

    if (feeAmount > 0) {
      await increaseBalance(
        "__platform__",
        feeAmount,
        {
          type: "transfer_fee",
          relatedType: "wallet_transfer_fee",
          relatedId: transferNo,
          remark: "平台转账手续费"
        },
        connection
      );
    }

    await createTransferOrder(
      {
        transferNo,
        fromUid: fromUser.uid,
        toUid: receiver.uid,
        amount,
        feeAmount,
        remark: payload.remark || ""
      },
      connection
    );

    await refreshInviteLevel(fromUser.uid, config, connection);

    return {
      transferNo,
      amount,
      feeAmount,
      receiver: toUserLite(receiver)
    };
  });
}

async function bindInvite(invitee, payload) {
  const config = await readGameConfig();
  const inviteConfig = config.inviteRewards || {};

  if (inviteConfig.enabled === false || inviteConfig.bindEnabled === false) {
    throw new Error("邀请绑定暂未开启");
  }

  const keyword = String(payload.inviterPiUsername || payload.piUsername || "").trim();
  if (!keyword) {
    throw new Error("请填写邀请人 Pi 用户名");
  }

  return transaction(async (connection) => {
    const existed = await findInviteRelationByInvitee(invitee.uid, connection);
    if (existed) {
      throw new Error("你已经绑定过邀请人");
    }

    const inviter = await findUserByPiUsername(keyword, connection);

    if (!inviter || Number(inviter.status) === 0) {
      throw new Error("邀请人不存在或已被限制");
    }

    if (inviter.uid === invitee.uid) {
      throw new Error("不能绑定自己");
    }

    const relation = await createInviteRelation(inviter.uid, invitee.uid, connection);
    await refreshInviteLevel(inviter.uid, config, connection);

    return {
      inviter: toUserLite(inviter),
      boundAt: relation.bound_at
    };
  });
}

async function refreshQualificationReward(uid, config, connection = null) {
  const inviteConfig = config.inviteRewards || {};

  if (inviteConfig.enabled === false || inviteConfig.qualificationEnabled === false) {
    return null;
  }

  const relation = await findInviteRelationByInvitee(uid, connection);
  if (!relation) return null;

  const existed = await findQualificationReward(uid, connection);
  if (existed) return existed;

  const finishedBattles = await countFinishedBattles(uid, connection);
  const required = Math.max(1, Number(inviteConfig.qualificationRequiredBattles || 2));
  const amount = normalizeAmount(inviteConfig.qualificationRewardAmount || 0);

  if (finishedBattles < required || amount <= 0) {
    return null;
  }

  const reward = await createQualificationReward(
    {
      inviterUid: relation.inviter_uid,
      inviteeUid: uid,
      amount
    },
    connection
  );

  if (reward) {
    await incrementQualifiedInvite(relation.inviter_uid, connection);
    await refreshInviteLevel(relation.inviter_uid, config, connection);
  }

  return reward;
}

async function getMyInviteInfo(uid) {
  const config = await readGameConfig();
  const dashboard = await getInviteDashboard(uid);
  const level = await refreshInviteLevel(uid, config);
  await refreshQualificationReward(uid, config);
  for (const row of dashboard.invitedRows || []) {
    if (row.invitee_uid) {
      await refreshQualificationReward(row.invitee_uid, config);
    }
  }
  const refreshed = await getInviteDashboard(uid);

  return {
    config: {
      enabled: config.inviteRewards?.enabled !== false,
      qualificationRequiredBattles: Number(config.inviteRewards?.qualificationRequiredBattles || 2),
      qualificationRewardAmount: Number(config.inviteRewards?.qualificationRewardAmount || 0),
      levels: getEnabledInviteLevels(config).map((item) => ({
        key: item.key,
        name: item.name,
        commissionRate: Number(item.commissionRate || 0),
        minBalance: Number(item.minBalance || 0),
        minDirectInvites: Number(item.minDirectInvites || 0)
      }))
    },
    stats: {
      levelKey: refreshed.stats?.level_key || level?.key || "",
      levelName: level?.name || "",
      directInviteCount: Number(refreshed.stats?.direct_invite_count || 0),
      qualifiedInviteCount: Number(refreshed.stats?.qualified_invite_count || 0),
      paidBattleCount: Number(refreshed.stats?.paid_battle_count || 0),
      totalCommission: Number(refreshed.stats?.total_commission || 0),
      totalQualificationReward: Number(refreshed.stats?.total_qualification_reward || 0)
    },
    inviter: refreshed.relation
      ? {
          uid: refreshed.relation.inviter_uid,
          piUsername: refreshed.relation.inviter_pi_username || "",
          nickname: refreshed.relation.inviter_nickname || "",
          avatarKey: refreshed.relation.inviter_avatar_key || "avatar_1",
          boundAt: refreshed.relation.bound_at
        }
      : null,
    claimableRewards: refreshed.rewards.map((reward) => ({
      rewardNo: reward.reward_no,
      rewardType: reward.reward_type,
      amount: Number(reward.amount || 0),
      inviteeUid: reward.invitee_uid || "",
      inviteePiUsername: reward.invitee_pi_username || "",
      inviteeNickname: reward.invitee_nickname || "",
      createdAt: reward.created_at
    })),
    rewardHistory: (refreshed.rewardRows || []).map((reward) => ({
      rewardNo: reward.reward_no,
      rewardType: reward.reward_type,
      amount: Number(reward.amount || 0),
      rate: Number(reward.rate || 0),
      status: reward.status || "",
      battleRoomNo: reward.battle_room_no || "",
      levelKey: reward.level_key || "",
      inviteeUid: reward.invitee_uid || "",
      inviteePiUsername: reward.invitee_pi_username || "",
      inviteeNickname: reward.invitee_nickname || "",
      createdAt: reward.created_at,
      claimedAt: reward.claimed_at
    })),
    invitedUsers: refreshed.invitedRows.map((row) => ({
      uid: row.invitee_uid,
      piUsername: row.pi_username || "",
      nickname: row.nickname || "",
      avatarKey: row.avatar_key || "avatar_1",
      boundAt: row.bound_at,
      rewardStatus: row.reward_status || "",
      rewardAmount: Number(row.reward_amount || 0)
    }))
  };
}

async function claimInviteRewards(user) {
  const rewards = await listClaimableRewards(user.uid);

  if (!rewards.length) {
    throw new Error("暂无可领取邀请奖励");
  }

  const config = await readGameConfig();

  return transaction(async (connection) => {
    let totalAmount = 0;
    const claimed = [];

    for (const reward of rewards) {
      const amount = normalizeAmount(reward.amount);
      const next = await markRewardClaimed(reward.reward_no, connection);
      if (!next || next.status !== "claimed" || amount <= 0) continue;

      await increaseBalance(
        user.uid,
        amount,
        {
          type: "invite_reward",
          relatedType: "invite_qualification_reward",
          relatedId: reward.reward_no,
          remark: `邀请好友${getDisplayName(reward, "好友")}完成对局奖励`
        },
        connection
      );

      await incrementQualificationRewardStats(user.uid, amount, connection);
      totalAmount = normalizeAmount(totalAmount + amount);
      claimed.push(reward.reward_no);
    }

    await refreshInviteLevel(user.uid, config, connection);

    return {
      claimedCount: claimed.length,
      amount: totalAmount
    };
  });
}

async function settleBattleInviteCommission(room, battle, connection) {
  const config = await readGameConfig();
  const inviteConfig = config.inviteRewards || {};

  if (inviteConfig.enabled === false || inviteConfig.battleCommissionEnabled === false) {
    return [];
  }

  const entryFee = Number(battle.entry_fee || 0);
  if (entryFee <= 0 || Number(battle.is_bot_room || 0) === 1) {
    return [];
  }

  const platformFeeAmount = normalizeAmount(entryFee * 2 * Number(battle.platform_fee_rate || 0));
  const maxCommissionRate = Number(inviteConfig.maxCommissionRate || 0.2);
  const commissionBase =
    inviteConfig.commissionBase === "platform_fee" ? platformFeeAmount : entryFee;
  const settled = [];
  let remainingCommissionBudget = platformFeeAmount;
  const candidates = [];

  for (const player of room.players || []) {
    if (!player?.uid || String(player.uid).startsWith("bot_")) continue;

    await refreshQualificationReward(player.uid, config, connection);
    const relation = await findInviteRelationByInvitee(player.uid, connection);
    if (!relation?.inviter_uid) continue;

    candidates.push({
      player,
      inviterUid: relation.inviter_uid
    });
  }

  for (const item of sortByUid(candidates, "inviterUid")) {
    if (remainingCommissionBudget <= 0) break;

    const player = item.player;
    const inviterUid = item.inviterUid;
    const existed = await findBattleCommissionReward(room.roomNo, inviterUid, player.uid, connection);
    if (existed) continue;

    const level = await refreshInviteLevel(inviterUid, config, connection);
    const safeRate = Math.min(Number(level?.commissionRate || 0), maxCommissionRate);
    const rawAmount = normalizeAmount(commissionBase * safeRate);
    const amount = normalizeAmount(Math.min(rawAmount, remainingCommissionBudget));

    if (amount <= 0) continue;

    const reward = await createBattleCommissionReward(
      {
        inviterUid,
        inviteeUid: player.uid,
        roomNo: room.roomNo,
        levelKey: level?.key || "",
        amount,
        rate: safeRate
      },
      connection
    );

    if (!reward) continue;

    await increaseBalance(
      inviterUid,
      amount,
      {
        type: "invite_commission",
        relatedType: "invite_battle_commission",
        relatedId: reward.reward_no,
        remark: `邀请好友${getDisplayName(player, "好友")}付费对战奖励 · 房间${room.roomNo}`
      },
      connection
    );

    await incrementCommissionStats(inviterUid, amount, connection);
    remainingCommissionBudget = normalizeAmount(remainingCommissionBudget - amount);
    settled.push(reward);
  }

  return settled;
}

async function listAdminGrowthData() {
  const [transfers, relations, rewards] = await Promise.all([
    listTransfers("", 200),
    listInviteRelations(200),
    listInviteRewards(200)
  ]);

  return {
    transfers,
    relations,
    rewards
  };
}

module.exports = {
  searchTransferUsers,
  transferBalance,
  bindInvite,
  getMyInviteInfo,
  claimInviteRewards,
  settleBattleInviteCommission,
  listAdminGrowthData
};
