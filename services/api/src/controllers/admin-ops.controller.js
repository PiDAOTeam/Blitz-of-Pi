const {
  listUsers,
  listWallets,
  listRecentLedgers,
  updateUserByAdmin,
  findAdminUserDetail,
  listUserLedgers
} = require("../repositories/admin-ops.repository");
const {
  listBattleRooms,
  expireStaleFreeBotRooms,
  findBattleRoom,
  updateBattleRoomStatus
} = require("../repositories/battle.repository");
const { addAdminAuditLog, listAdminAuditLogs } = require("../repositories/admin-audit.repository");
const {
  adminSetUserStatus,
  adminResetProfileOnboarding
} = require("../repositories/user.repository");

function toAdminUserDto(row) {
  return {
    uid: row.uid,
    piUserId: row.pi_user_id || "",
    piUsername: row.pi_username || "",
    nickname: row.nickname,
    avatarUrl: row.avatar_url || "",
    avatarKey: row.avatar_key || "avatar_1",
    profileCompleted: Number(row.profile_completed) === 1,
    rankName: row.rank_name,
    rankKey: row.rank_key || "bronze",
    stars: Number(row.stars || 0),
    winStreak: Number(row.win_streak || 0),
    status: row.status,
    lastLoginAt: row.last_login_at,
    createdAt: row.created_at,
    wallet: {
      availableBalance: Number(row.available_balance),
      lockedBalance: Number(row.locked_balance),
      totalRecharge: Number(row.total_recharge),
      totalWithdraw: Number(row.total_withdraw),
      totalReward: Number(row.total_reward)
    }
  };
}

async function getAdminUsers() {
  const rows = await listUsers(200);

  return rows.map(toAdminUserDto);
}

async function getAdminWallets() {
  const rows = await listWallets(200);

  return rows.map((row) => ({
    uid: row.uid,
    piUsername: row.pi_username || "",
    nickname: row.nickname || "",
    avatarKey: row.avatar_key || "avatar_1",
    availableBalance: Number(row.available_balance),
    lockedBalance: Number(row.locked_balance),
    totalRecharge: Number(row.total_recharge),
    totalWithdraw: Number(row.total_withdraw),
    totalReward: Number(row.total_reward),
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }));
}

async function getAdminLedgers() {
  const rows = await listRecentLedgers();

  return rows.map((row) => ({
    id: row.id,
    uid: row.uid,
    piUsername: row.pi_username || "",
    nickname: row.nickname || "",
    avatarKey: row.avatar_key || "avatar_1",
    type: row.type,
    direction: row.direction,
    amount: Number(row.amount),
    balanceAfter: Number(row.balance_after),
    relatedType: row.related_type || "",
    relatedId: row.related_id || "",
    remark: row.remark || "",
    createdAt: row.created_at
  }));
}

async function updateAdminUser(req, uid, payload) {
  const row = await updateUserByAdmin(uid, payload);

  if (!row) {
    throw new Error("用户不存在");
  }

  await addAdminAuditLog({
    adminUsername: req.admin?.username,
    action: "user_profile_update",
    targetType: "user",
    targetId: uid,
    detail: {
      nickname: payload.nickname,
      avatarKey: payload.avatarKey || payload.avatar_key,
      status: payload.status
    }
  });

  return {
    uid: row.uid,
    piUserId: row.pi_user_id || "",
    piUsername: row.pi_username || "",
    nickname: row.nickname,
    avatarUrl: row.avatar_url || "",
    avatarKey: row.avatar_key || "avatar_1",
    rankName: row.rank_name,
    rankKey: row.rank_key || "bronze",
    stars: Number(row.stars || 0),
    winStreak: Number(row.win_streak || 0),
    status: row.status,
    lastLoginAt: row.last_login_at,
    createdAt: row.created_at
  };
}

async function getAdminUserDetail(uid) {
  const row = await findAdminUserDetail(uid);

  if (!row) {
    throw new Error("用户不存在");
  }

  const ledgers = await listUserLedgers(uid);

  return {
    user: toAdminUserDto(row),
    ledgers: ledgers.map((ledger) => ({
      id: ledger.id,
      uid: ledger.uid,
      type: ledger.type,
      direction: ledger.direction,
      amount: Number(ledger.amount),
      balanceAfter: Number(ledger.balance_after),
      relatedType: ledger.related_type || "",
      relatedId: ledger.related_id || "",
      remark: ledger.remark || "",
      createdAt: ledger.created_at
    }))
  };
}

async function resetAdminUserProfile(req, uid) {
  const row = await adminResetProfileOnboarding(uid);

  if (!row) {
    throw new Error("用户不存在");
  }

  await addAdminAuditLog({
    adminUsername: req.admin?.username,
    action: "user_profile_reset",
    targetType: "user",
    targetId: uid,
    detail: {
      uid
    }
  });

  return {
    reset: true
  };
}

async function setAdminUserStatus(req, uid, payload) {
  const row = await adminSetUserStatus(uid, payload.status);

  if (!row) {
    throw new Error("用户不存在");
  }

  await addAdminAuditLog({
    adminUsername: req.admin?.username,
    action: Number(payload.status) === 0 ? "user_disable" : "user_enable",
    targetType: "user",
    targetId: uid,
    detail: {
      status: Number(payload.status) === 0 ? 0 : 1
    }
  });

  return {
    uid: row.uid,
    status: row.status
  };
}

async function getAdminBattleRooms() {
  await expireStaleFreeBotRooms();
  const rows = await listBattleRooms(200);

  return rows.map((row) => ({
    roomNo: row.room_no,
    mode: row.mode,
    status: row.status,
    playerAUid: row.player_a_uid,
    playerAPiUsername: row.player_a_pi_username || "",
    playerANickname: row.player_a_nickname || "",
    playerBUid: row.player_b_uid,
    playerBPiUsername: row.player_b_pi_username || "",
    playerBNickname: row.player_b_nickname || "",
    winnerUid: row.winner_uid || "",
    winnerPiUsername: row.winner_pi_username || "",
    winnerNickname: row.winner_nickname || "",
    loserUid: row.loser_uid || "",
    loserPiUsername: row.loser_pi_username || "",
    loserNickname: row.loser_nickname || "",
    entryFee: Number(row.entry_fee),
    rewardAmount: Number(row.reward_amount),
    platformFeeRate: Number(row.platform_fee_rate),
    platformFeeAmount: Number(row.platform_fee_amount || 0),
    assetType: row.asset_type || "PI",
    assetSettlementStatus: row.asset_settlement_status || "",
    assetError: row.asset_error || "",
    isBotRoom: Boolean(row.is_bot_room),
    createdAt: row.created_at,
    finishedAt: row.finished_at
  }));
}

async function handleAdminBattleRoom(req, roomNo, payload = {}) {
  const action = String(payload.action || "");
  const remark = String(payload.remark || "").trim();
  const battle = await findBattleRoom(roomNo);

  if (!battle) {
    throw new Error("对局不存在");
  }

  const entryFee = Number(battle.entry_fee || 0);
  const isBotRoom = Number(battle.is_bot_room || 0) === 1;

  if (action === "expire_free_bot") {
    if (!(entryFee === 0 && isBotRoom)) {
      throw new Error("只能作废免费机器人异常局，付费局请转人工复核");
    }
    if (battle.status === "finished") {
      throw new Error("已正常结束的对局不能作废");
    }

    await updateBattleRoomStatus(roomNo, "expired");
    await addAdminAuditLog({
      adminUsername: req.admin?.username,
      action: "battle_expire_free_bot",
      targetType: "battle_room",
      targetId: roomNo,
      detail: {
        beforeStatus: battle.status,
        remark: remark || "后台作废免费机器人异常局"
      },
      ip: req.socket?.remoteAddress || ""
    });

    return {
      roomNo,
      status: "expired"
    };
  }

  if (action === "manual_review") {
    if (battle.status === "finished") {
      throw new Error("已结束对局无需转人工复核");
    }

    await updateBattleRoomStatus(roomNo, "manual_review");
    await addAdminAuditLog({
      adminUsername: req.admin?.username,
      action: "battle_manual_review",
      targetType: "battle_room",
      targetId: roomNo,
      detail: {
        beforeStatus: battle.status,
        entryFee,
        isBotRoom,
        remark: remark || "后台标记对局需人工复核"
      },
      ip: req.socket?.remoteAddress || ""
    });

    return {
      roomNo,
      status: "manual_review"
    };
  }

  throw new Error("不支持的对局处理动作");
}

async function getAdminAuditLogs() {
  const rows = await listAdminAuditLogs(200);

  return rows.map((row) => ({
    id: row.id,
    adminUsername: row.admin_username,
    action: row.action,
    targetType: row.target_type,
    targetId: row.target_id,
    detail: typeof row.detail === "string" ? JSON.parse(row.detail || "{}") : row.detail || {},
    ip: row.ip || "",
    createdAt: row.created_at
  }));
}

module.exports = {
  getAdminUsers,
  getAdminWallets,
  getAdminLedgers,
  getAdminBattleRooms,
  handleAdminBattleRoom,
  getAdminAuditLogs,
  updateAdminUser,
  getAdminUserDetail,
  resetAdminUserProfile,
  setAdminUserStatus
};
