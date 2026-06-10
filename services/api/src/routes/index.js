const { loginUser, loginAdmin, updateAdminPassword, getSessionProfile } = require("../controllers/auth.controller");
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
  getAdminGrowthOps
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
  "今日段位宝箱已领取",
  "Pi UID/用户名未绑定 HashPi 用户",
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
  "暂无可领取邀请奖励"
]);

const EXPECTED_BUSINESS_ERROR_PATTERNS = [
  /^刚刚取消过匹配，请 \d+ 秒后再试$/,
  /^匹配开始 \d+ 秒后才能取消，请再等 \d+ 秒$/,
  /^昵称至少需要 \d+ 个字符$/,
  /^单笔转账至少 [\d.]+ Pi$/,
  /^单笔转账最多 [\d.]+ Pi$/,
  /^转账太频繁，请 \d+ 秒后再试$/
];

function isExpectedBusinessError(message) {
  return (
    EXPECTED_BUSINESS_ERROR_MESSAGES.has(message) ||
    EXPECTED_BUSINESS_ERROR_PATTERNS.some((pattern) => pattern.test(message))
  );
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
    const token = req.headers.authorization?.replace("Bearer ", "") || "";
    const profile = await getSessionProfile(token, "user");

    if (!profile) {
      fail(res, "请先登录", 401, 1401);
      return;
    }

    const payload = await readJsonBody(req);
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

  if (url === "/api/rank/me" && method === "GET") {
    ok(res, await getMyRankStatus(req));
    return;
  }

  if (url === "/api/rank/daily-chest/claim" && method === "POST") {
    ok(res, await claimMyDailyRankChest(req), "领取成功");
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

  if (url === "/admin-api/engagement/claims" && method === "GET") {
    ok(res, await getAdminEngagementClaims());
    return;
  }

  if (url === "/admin-api/engagement/reward-jobs" && method === "GET") {
    ok(res, await getAdminEngagementRewardJobs());
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
    if (!error.expectedBusinessError && !isExpectedBusinessError(message)) {
      console.error("[api] route failed:", error);
    }
    fail(res, message, 400, error.businessCode || 1000);
  }
}

module.exports = {
  handleRoutes
};
