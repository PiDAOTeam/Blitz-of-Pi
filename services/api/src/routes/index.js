const {
  loginUser,
  loginHashPiBridge,
  loginAdmin,
  updateAdminPassword,
  getSessionProfile
} = require("../controllers/auth.controller");
const { getAdminDashboard } = require("../controllers/dashboard.controller");
const { getAdminReconciliationReport } = require("../controllers/reconciliation.controller");
const { getAdminRiskAuditReport } = require("../controllers/risk-audit.controller");
const { getAdminHomeConfig, saveAdminHomeConfig } = require("../controllers/admin-home.controller");
const {
  getPublicGameConfig,
  getAdminGameConfig,
  saveAdminGameConfig
} = require("../controllers/game-config.controller");
const {
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
} = require("../controllers/admin-ops.controller");
const { getHealth } = require("../controllers/health.controller");
const { getHomeIndex } = require("../controllers/home.controller");
const { getProfileOptions, updateMyProfile } = require("../controllers/profile.controller");
const {
  getMyRankStatus,
  claimMyDailyRankChest,
  getAdminRankStarRecords,
  getAdminRankDailyChests,
  getAdminRankWeeklySettlements,
  getRankLeaderboard,
  getAdminRankLeaderboard,
  settleAdminWeeklyRank
} = require("../controllers/rank.controller");
const {
  getPiRuntimeConfig,
  getAdminPiRuntimeConfig,
  saveAdminPiRuntimeConfig
} = require("../controllers/pi.controller");
const {
  joinMatchQueue,
  cancelMatchQueue,
  getCurrentMatchStatus,
  getBattleRoom,
  submitBattleAction,
  getBattleSummaryForRequest,
  getMyBattleHistory,
  settleRealtimeBattle,
  getAdminRooms
} = require("../controllers/match.controller");
const { getMyWallet } = require("../controllers/wallet.controller");
const {
  searchUsersForTransfer,
  createWalletTransfer,
  bindMyInvite,
  getMyInviteDashboard,
  claimMyInviteRewards,
  getAdminGrowthOps,
  processAdminInviteCommissionRewardJobs,
  retryAdminInviteCommissionRewardJob
} = require("../controllers/growth.controller");
const {
  claimMyDailySignIn,
  claimMyDailyTask,
  getAdminEngagementClaims,
  getAdminEngagementRewardJobs,
  getMyEngagementStatus,
  processAdminEngagementRewardJobs,
  retryAdminEngagementRewardJob
} = require("../controllers/engagement.controller");
const {
  claimMyWatchShareholder,
  getAdminWatchShareholderOverview,
  getMyWatchShareholder,
  processAdminWatchShareholderRewards,
  retryAdminWatchShareholderReward,
  settleAdminWatchShareholderPreviousWeek,
  syncAdminWatchNodeSnapshot
} = require("../controllers/watch-shareholder.controller");
const {
  createRechargeOrder,
  approveRechargePayment,
  completeRechargePayment,
  cancelRechargePayment,
  syncIncompletePayment,
  getAdminPaymentOrders
} = require("../controllers/payment.controller");
const {
  createWithdrawRequest,
  getMyWithdrawWallets,
  getAdminWithdrawOrders,
  getAdminWithdrawOps,
  approveWithdrawOrder,
  rejectWithdrawOrder,
  markWithdrawPaid
} = require("../controllers/withdraw.controller");
const { processAutoPayoutImmediately } = require("../services/auto-payout.service");
const { observeBattleStage } = require("../services/battle-observer.service");
const { inspectWithdrawWalletAddress } = require("../utils/withdraw-wallet");
const { readJsonBody } = require("../utils/body");
const { ok, fail, notFound } = require("../utils/response");
const { checkRateLimit } = require("../utils/rate-limit");

const EXPECTED_BUSINESS_ERROR_MESSAGES = new Set([
  "匹配处理中，请稍后重试",
  "已匹配成功，不能取消本局",
  "昵称只能包含中文、英文、数字、空格、横线或下划线",
  "昵称包含平台禁用词，请重新设置",
  "今日已签到",
  "每日签到暂未开启",
  "该任务今日已领取",
  "任务不存在或已关闭",
  "任务还未完成",
  "每日任务暂未开启",
  "腕表股东分红未开启",
  "暂无可领取腕表分红",
  "本期已有用户领取，不能重新生成",
  "今日段位宝箱已领取",
  "Pi UID/用户名未绑定 HashPi 用户",
  "资产网关暂时不可用，请稍后重试",
  "资产网络繁忙，请稍后重试",
  "Pi网络繁忙，请稍后重试",
  "Pi 平台 API 连接超时",
  "积分余额不足",
  "POC余额不足",
  "Pi余额不足",
  "钱包余额不足",
  "冻结余额不足",
  "匹配队列异常，请重新匹配",
  "实时房间创建失败，请重新匹配",
  "积分/POC 资产同步未开启，暂未开放",
  "小富豪积分场暂未开放",
  "大富豪 POC 场暂未开放",
  "该资产场当前仅对指定用户开放",
  "无权查看该房间",
  "旧版对战操作接口已停用，请使用实时对战通道",
  "平台转账暂未开启",
  "请填写收款用户 Pi 用户名",
  "转账金额不正确",
  "收款用户不存在或已被限制",
  "不能转账给自己",
  "今日转账额度已达上限",
  "邀请绑定暂未开启",
  "请填写邀请人 Pi 用户名",
  "你已经绑定过邀请人",
  "邀请人不存在或已被限制",
  "不能绑定自己",
  "暂无可领取邀请奖励",
  "请先登录",
  "缺少 HashPi 登录票据",
  "HashPi APP 接入暂未开启",
  "HashPi APP 暂不支持该场次",
  "HashPi 登录票据校验失败",
  "HashPi 登录校验超时，请重试",
  "请先登录后台",
  "后台账号不存在或已禁用",
  "后台账号或密码错误",
  "当前密码错误",
  "账号不可用，请联系平台",
  "用户不存在",
  "对局不存在",
  "请填写链上 TXID 后再标记打款",
  "TXID 格式不正确，请核对后再提交",
  "提现金额不正确",
  "提现金额扣除手续费后不足以打款",
  "提现订单不存在",
  "只有待审核订单可以通过",
  "只有待审核订单可以拒绝",
  "只有已审核订单可以标记打款",
  "该 TXID 已被其他提现订单使用"
]);

const EXPECTED_BUSINESS_ERROR_PATTERNS = [
  /^刚刚取消过匹配，请 \d+ 秒后再试$/,
  /^匹配开始 \d+ 秒后才能取消，请再等 \d+ 秒$/,
  /^你已有未完成的.+，请先完成后再进入其他模式$/,
  /^.+需达到.+段位后进入$/,
  /^.+暂未开放$/,
  /^.+只允许真人匹配，不能创建机器人房间$/,
  /^昵称至少需要 \d+ 个字符$/,
  /^单笔转账至少 [\d.]+ Pi$/,
  /^单笔转账最多 [\d.]+ Pi$/,
  /^转账太频繁，请 \d+ 秒后再试$/,
  /^单笔提现不能低于 [\d.]+ Pi$/,
  /^今日提现额度不足，单日最多 [\d.]+ Pi$/,
  /^今日还需完成 \d+ 场有效段位对局才能领取$/,
  /^Pi 支付状态不可完成：.+$/
];

function isExpectedBusinessError(message) {
  return (
    EXPECTED_BUSINESS_ERROR_MESSAGES.has(message) ||
    EXPECTED_BUSINESS_ERROR_PATTERNS.some((pattern) => pattern.test(message))
  );
}

function logRouteError(error, message, req) {
  const isExpected = error.expectedBusinessError || isExpectedBusinessError(message);
  if (isExpected) {
    if (error.businessCode === 1701) return;
    console.log("[api] business rejected:", {
      method: req.method,
      url: req.url,
      message,
      code: error.businessCode || 1000
    });
    return;
  }
  console.error("[api] route failed:", error);
}

async function handleRoutes(req, res) {
  const { url, method } = req;
  const parsedUrl = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
  const pathname = parsedUrl.pathname;

  try {
    if (method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }

    const rateLimit = await checkRateLimit(req);
    if (rateLimit.limited) {
      fail(res, `操作太频繁，请 ${rateLimit.retryAfterSeconds} 秒后再试`, 429, 1429);
      return;
    }

    if (url.startsWith("/admin-api/") && url !== "/admin-api/auth/login") {
      const token = req.headers.authorization?.replace("Bearer ", "") || "";
      const admin = await getSessionProfile(token, "admin");

      if (!admin) {
        fail(res, "请先登录后台", 401, 1401);
        return;
      }

      req.admin = admin;
    }

    if (url === "/health" && method === "GET") {
      ok(res, getHealth(), "ok");
      return;
    }

  if (url === "/api/home/index" && method === "GET") {
      ok(res, await getHomeIndex());
      return;
    }

  if (url === "/api/game/config" && method === "GET") {
    ok(res, await getPublicGameConfig());
    return;
  }

  if (url === "/api/pi/config" && method === "GET") {
    ok(res, await getPiRuntimeConfig());
    return;
  }

  if (url === "/api/auth/pi-login" && method === "POST") {
    const payload = await readJsonBody(req);
    ok(res, await loginUser(payload));
    return;
  }

  if (url === "/api/auth/hashpi-bridge-login" && method === "POST") {
    const payload = await readJsonBody(req);
    ok(res, await loginHashPiBridge(payload));
    return;
  }

  if (url === "/api/auth/profile" && method === "GET") {
      const token = req.headers.authorization?.replace("Bearer ", "") || "";
      const profile = await getSessionProfile(token, "user");

      if (!profile) {
        fail(res, "请先登录", 401, 1401);
        return;
      }

      ok(res, profile);
      return;
    }

  if (url === "/api/client/trace" && method === "POST") {
    const payload = await readJsonBody(req);
    const token = req.headers.authorization?.replace("Bearer ", "") || String(payload.token || "");
    const profile = await getSessionProfile(token, "user");

    if (!profile) {
      ok(res, { accepted: false });
      return;
    }

    const stage = String(payload.stage || "");
    if (!stage.startsWith("client_")) {
      fail(res, "追踪节点无效", 400, 1400);
      return;
    }

    await observeBattleStage(stage, {
      ...payload,
      uid: profile.uid,
      source: "client",
      mode: payload.mode || "",
      roomNo: payload.roomNo || ""
    });
    ok(res, { accepted: true });
    return;
  }

  if (url === "/api/profile/options" && method === "GET") {
    ok(res, await getProfileOptions());
    return;
  }

  if (url === "/api/profile/update" && method === "POST") {
    const payload = await readJsonBody(req);
    ok(res, await updateMyProfile(req, payload), "资料已保存");
    return;
  }

  if (url === "/api/wallet/me" && method === "GET") {
    ok(res, await getMyWallet(req));
    return;
  }

  if (pathname === "/api/wallet/search-users" && method === "GET") {
    ok(res, await searchUsersForTransfer(req, Object.fromEntries(parsedUrl.searchParams.entries())));
    return;
  }

  if (url === "/api/wallet/transfer" && method === "POST") {
    const payload = await readJsonBody(req);
    ok(res, await createWalletTransfer(req, payload), "转账成功");
    return;
  }

  if (url === "/api/invite/me" && method === "GET") {
    ok(res, await getMyInviteDashboard(req));
    return;
  }

  if (url === "/api/invite/bind" && method === "POST") {
    const payload = await readJsonBody(req);
    ok(res, await bindMyInvite(req, payload), "邀请关系已绑定");
    return;
  }

  if (url === "/api/invite/claim" && method === "POST") {
    ok(res, await claimMyInviteRewards(req), "领取成功");
    return;
  }

  if (url === "/api/engagement/me" && method === "GET") {
    ok(res, await getMyEngagementStatus(req));
    return;
  }

  if (url === "/api/engagement/sign-in/claim" && method === "POST") {
    ok(res, await claimMyDailySignIn(req), "签到成功");
    return;
  }

  if (url === "/api/engagement/task/claim" && method === "POST") {
    const payload = await readJsonBody(req);
    ok(res, await claimMyDailyTask(req, payload), "领取成功");
    return;
  }

  if (url === "/api/watch-shareholder/me" && method === "GET") {
    ok(res, await getMyWatchShareholder(req));
    return;
  }

  if (url === "/api/watch-shareholder/claim" && method === "POST") {
    ok(res, await claimMyWatchShareholder(req), "领取成功");
    return;
  }

  if (url === "/api/rank/me" && method === "GET") {
    ok(res, await getMyRankStatus(req));
    return;
  }

  if (url === "/api/rank/daily-chest/claim" && method === "POST") {
    const result = await claimMyDailyRankChest(req);
    ok(res, result, result.alreadyClaimed ? "今日已领取" : "领取成功");
    return;
  }

  if (pathname === "/api/rank/leaderboard" && method === "GET") {
    ok(res, await getRankLeaderboard(req, Object.fromEntries(parsedUrl.searchParams.entries())));
    return;
  }

  if (url === "/api/withdraw/apply" && method === "POST") {
    const payload = await readJsonBody(req);
    let order = await createWithdrawRequest(req, payload);
    let immediatePayout = null;

    if (order.status === "approved" && order.autoPayoutEligible && order.autoPayoutStatus === "queued") {
      try {
        immediatePayout = await processAutoPayoutImmediately(order.orderNo);
        order = immediatePayout?.result?.order || order;
      } catch (error) {
        immediatePayout = {
          enabled: true,
          processed: 0,
          result: {
            status: "failed",
            error: error.message || "自动提现中，请等待"
          }
        };
      }
    }

    ok(
      res,
      {
        order,
        immediatePayout
      },
      order.status === "paid" ? "提现已自动到账" : "提现申请已提交"
    );
    return;
  }

  if (url === "/api/withdraw/check-wallet" && method === "POST") {
    const payload = await readJsonBody(req);
    ok(res, inspectWithdrawWalletAddress(payload.walletAddress || payload.wallet_address || ""));
    return;
  }

  if (url === "/api/withdraw/wallets" && method === "GET") {
    ok(res, await getMyWithdrawWallets(req));
    return;
  }

  if (url === "/api/payments/recharge-order" && method === "POST") {
    const payload = await readJsonBody(req);
    ok(res, await createRechargeOrder(req, payload), "订单已创建");
    return;
  }

  if (url === "/api/payments/approve" && method === "POST") {
    const payload = await readJsonBody(req);
    ok(res, await approveRechargePayment(req, payload), "支付已确认");
    return;
  }

  if (url === "/api/payments/complete" && method === "POST") {
    const payload = await readJsonBody(req);
    ok(res, await completeRechargePayment(req, payload), "支付已完成");
    return;
  }

  if (url === "/api/payments/cancel" && method === "POST") {
    const payload = await readJsonBody(req);
    ok(res, await cancelRechargePayment(req, payload), "支付已取消");
    return;
  }

  if (url === "/api/payments/sync-incomplete" && method === "POST") {
    const payload = await readJsonBody(req);
    ok(res, await syncIncompletePayment(req, payload), "未完成支付已同步");
    return;
  }

  if (url === "/admin-api/auth/login" && method === "POST") {
    const payload = await readJsonBody(req);
    ok(res, await loginAdmin(payload));
    return;
  }

  if (url === "/admin-api/auth/me" && method === "GET") {
    const token = req.headers.authorization?.replace("Bearer ", "") || "";
    const profile = await getSessionProfile(token, "admin");

    if (!profile) {
      fail(res, "请先登录后台", 401, 1401);
      return;
    }

    ok(res, profile);
    return;
  }

  if (url === "/admin-api/auth/change-password" && method === "POST") {
    const payload = await readJsonBody(req);
    ok(res, await updateAdminPassword(req, payload), "密码修改成功");
    return;
  }

  if (url === "/admin-api/home-config" && method === "GET") {
    ok(res, await getAdminHomeConfig());
    return;
  }

  if (url === "/admin-api/home-config" && method === "POST") {
    const payload = await readJsonBody(req);
    ok(res, await saveAdminHomeConfig(payload), "保存成功");
    return;
  }

  if (url === "/admin-api/pi-config" && method === "GET") {
    ok(res, await getAdminPiRuntimeConfig());
    return;
  }

  if (url === "/admin-api/pi-config" && method === "POST") {
    const payload = await readJsonBody(req);
    ok(res, await saveAdminPiRuntimeConfig(payload), "保存成功");
    return;
  }

  if (url === "/admin-api/game-config" && method === "GET") {
    ok(res, await getAdminGameConfig());
    return;
  }

  if (url === "/admin-api/game-config" && method === "POST") {
    const payload = await readJsonBody(req);
    ok(res, await saveAdminGameConfig(payload), "保存成功");
    return;
  }

  if (url === "/admin-api/ranks/star-records" && method === "GET") {
    ok(res, await getAdminRankStarRecords());
    return;
  }

  if (url === "/admin-api/ranks/daily-chests" && method === "GET") {
    ok(res, await getAdminRankDailyChests());
    return;
  }

  if (url === "/admin-api/ranks/weekly-settlements" && method === "GET") {
    ok(res, await getAdminRankWeeklySettlements());
    return;
  }

  if (url === "/admin-api/ranks/leaderboard" && method === "GET") {
    ok(res, await getAdminRankLeaderboard());
    return;
  }

  if (url === "/admin-api/ranks/settle-weekly" && method === "POST") {
    ok(res, await settleAdminWeeklyRank(), "周赛季结算完成");
    return;
  }

  if (url === "/api/match/join-queue" && method === "POST") {
    const payload = await readJsonBody(req);
    ok(res, await joinMatchQueue(req, payload));
    return;
  }

  if (url === "/api/match/cancel-queue" && method === "POST") {
    ok(res, await cancelMatchQueue(req), "已取消匹配");
    return;
  }

  if (url === "/api/match/status" && method === "GET") {
    ok(res, await getCurrentMatchStatus(req));
    return;
  }

  if (url.startsWith("/api/battle/room/") && method === "GET") {
    const roomNo = decodeURIComponent(url.replace("/api/battle/room/", ""));
    ok(res, await getBattleRoom(req, roomNo));
    return;
  }

  if (url.startsWith("/api/battle/action/") && method === "POST") {
    const roomNo = decodeURIComponent(url.replace("/api/battle/action/", ""));
    const payload = await readJsonBody(req);
    ok(res, await submitBattleAction(req, roomNo, payload), "操作成功");
    return;
  }

  if (url.startsWith("/api/battle/result/") && method === "GET") {
    const roomNo = decodeURIComponent(url.replace("/api/battle/result/", ""));
    ok(res, await getBattleSummaryForRequest(req, roomNo));
    return;
  }

  if (pathname === "/api/battle/history" && method === "GET") {
    ok(res, await getMyBattleHistory(req, Object.fromEntries(parsedUrl.searchParams.entries())));
    return;
  }

  if (url === "/internal/realtime/settle" && method === "POST") {
    const payload = await readJsonBody(req);
    payload.remoteAddress = req.socket?.remoteAddress || "";
    ok(res, await settleRealtimeBattle(payload), "结算已入队");
    return;
  }

  if (url === "/admin-api/dashboard/overview" && method === "GET") {
    ok(res, await getAdminDashboard());
    return;
  }

  if (url === "/admin-api/reconciliation/report" && method === "GET") {
    ok(res, await getAdminReconciliationReport());
    return;
  }

  if (url === "/admin-api/risk-audit/report" && method === "GET") {
    ok(res, await getAdminRiskAuditReport());
    return;
  }

  if (url === "/admin-api/matches/rooms" && method === "GET") {
    ok(res, await getAdminRooms());
    return;
  }

  if (url === "/admin-api/payments/orders" && method === "GET") {
    ok(res, await getAdminPaymentOrders());
    return;
  }

  if (url === "/admin-api/users" && method === "GET") {
    ok(res, await getAdminUsers());
    return;
  }

  if (url.startsWith("/admin-api/users/detail/") && method === "GET") {
    const uid = decodeURIComponent(url.replace("/admin-api/users/detail/", ""));
    ok(res, await getAdminUserDetail(uid));
    return;
  }

  if (url.startsWith("/admin-api/users/update/") && method === "POST") {
    const uid = decodeURIComponent(url.replace("/admin-api/users/update/", ""));
    const payload = await readJsonBody(req);
    ok(res, await updateAdminUser(req, uid, payload), "用户资料已保存");
    return;
  }

  if (url.startsWith("/admin-api/users/reset-profile/") && method === "POST") {
    const uid = decodeURIComponent(url.replace("/admin-api/users/reset-profile/", ""));
    ok(res, await resetAdminUserProfile(req, uid), "已重置资料引导");
    return;
  }

  if (url.startsWith("/admin-api/users/status/") && method === "POST") {
    const uid = decodeURIComponent(url.replace("/admin-api/users/status/", ""));
    const payload = await readJsonBody(req);
    ok(res, await setAdminUserStatus(req, uid, payload), "用户状态已更新");
    return;
  }

  if (url === "/admin-api/wallets" && method === "GET") {
    ok(res, await getAdminWallets());
    return;
  }

  if (url === "/admin-api/wallet-ledgers" && method === "GET") {
    ok(res, await getAdminLedgers());
    return;
  }

  if (url === "/admin-api/growth/ops" && method === "GET") {
    ok(res, await getAdminGrowthOps());
    return;
  }

  if (url === "/admin-api/growth/invite-commission/reward-jobs/process" && method === "POST") {
    ok(res, await processAdminInviteCommissionRewardJobs(), "处理完成");
    return;
  }

  if (url.startsWith("/admin-api/growth/invite-commission/reward-jobs/retry/") && method === "POST") {
    const id = decodeURIComponent(url.replace("/admin-api/growth/invite-commission/reward-jobs/retry/", ""));
    ok(res, await retryAdminInviteCommissionRewardJob(id), "已重新排队");
    return;
  }

  if (url === "/admin-api/engagement/claims" && method === "GET") {
    ok(res, await getAdminEngagementClaims());
    return;
  }

  if (url === "/admin-api/engagement/reward-jobs" && method === "GET") {
    ok(res, await getAdminEngagementRewardJobs());
    return;
  }

  if (url === "/admin-api/watch-shareholder/overview" && method === "GET") {
    ok(res, await getAdminWatchShareholderOverview());
    return;
  }

  if (url === "/admin-api/watch-shareholder/settle-previous-week" && method === "POST") {
    const payload = await readJsonBody(req);
    ok(res, await settleAdminWatchShareholderPreviousWeek(req, payload), "上周分红已生成");
    return;
  }

  if (url === "/admin-api/watch-shareholder/sync-snapshot" && method === "POST") {
    ok(res, await syncAdminWatchNodeSnapshot(req), "节点快照可用");
    return;
  }

  if (url === "/admin-api/watch-shareholder/rewards/process" && method === "POST") {
    ok(res, await processAdminWatchShareholderRewards(req), "处理完成");
    return;
  }

  if (url.startsWith("/admin-api/watch-shareholder/rewards/retry/") && method === "POST") {
    const id = decodeURIComponent(url.replace("/admin-api/watch-shareholder/rewards/retry/", ""));
    ok(res, await retryAdminWatchShareholderReward(req, id), "已重新排队");
    return;
  }

  if (url === "/admin-api/engagement/reward-jobs/process" && method === "POST") {
    ok(res, await processAdminEngagementRewardJobs(), "处理完成");
    return;
  }

  if (url.startsWith("/admin-api/engagement/reward-jobs/retry/") && method === "POST") {
    const id = decodeURIComponent(url.replace("/admin-api/engagement/reward-jobs/retry/", ""));
    ok(res, await retryAdminEngagementRewardJob(id), "已重新排队");
    return;
  }

  if (url === "/admin-api/battle-rooms" && method === "GET") {
    ok(res, await getAdminBattleRooms());
    return;
  }

  if (url.startsWith("/admin-api/battle-rooms/handle/") && method === "POST") {
    const roomNo = decodeURIComponent(url.replace("/admin-api/battle-rooms/handle/", ""));
    const payload = await readJsonBody(req);
    ok(res, await handleAdminBattleRoom(req, roomNo, payload), "对局已处理");
    return;
  }

  if (url === "/admin-api/withdraw/orders" && method === "GET") {
    ok(res, await getAdminWithdrawOrders());
    return;
  }

  if (url === "/admin-api/withdraw/ops" && method === "GET") {
    ok(res, await getAdminWithdrawOps());
    return;
  }

  if (url.startsWith("/admin-api/withdraw/approve/") && method === "POST") {
    const orderNo = decodeURIComponent(url.replace("/admin-api/withdraw/approve/", ""));
    const payload = await readJsonBody(req);
    ok(res, await approveWithdrawOrder(req, orderNo, payload), "审核通过");
    return;
  }

  if (url.startsWith("/admin-api/withdraw/reject/") && method === "POST") {
    const orderNo = decodeURIComponent(url.replace("/admin-api/withdraw/reject/", ""));
    const payload = await readJsonBody(req);
    ok(res, await rejectWithdrawOrder(req, orderNo, payload), "已拒绝并解冻");
    return;
  }

  if (url.startsWith("/admin-api/withdraw/paid/") && method === "POST") {
    const orderNo = decodeURIComponent(url.replace("/admin-api/withdraw/paid/", ""));
    const payload = await readJsonBody(req);
    ok(res, await markWithdrawPaid(req, orderNo, payload), "已标记打款");
    return;
  }

  if (url === "/admin-api/audit-logs" && method === "GET") {
    ok(res, await getAdminAuditLogs());
    return;
  }

    notFound(res);
  } catch (error) {
    const message = error.message || "服务处理失败";
    logRouteError(error, message, req);
    if (error.businessCode === 1701) {
      fail(res, message, 503, 1701, {
        retryable: true,
        retryAfterSeconds: error.retryAfterSeconds || 3,
        reason: "asset_gateway_busy"
      });
      return;
    }
    fail(res, message, 400, error.businessCode || 1000);
  }
}

module.exports = {
  handleRoutes
};
