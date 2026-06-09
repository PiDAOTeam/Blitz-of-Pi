const Ae = ["localhost", "127.0.0.1"].includes(window.location.hostname), Ee = Ae ? "http://localhost:3000" : "https://blitzapi.hashpi.app", Be = Ee, le = document.querySelector("#app");
const BRAND_LOGO_HTML = '<img class="brand-logo" src="/assets/brand/blitz-logo-128.jpg" alt="" loading="eager" decoding="async" />';
if (!le) throw new Error("\u672A\u627E\u5230\u540E\u53F0\u6302\u8F7D\u8282\u70B9");
let _ = "overview", W = null, re = "", I = "all", G = "all", te = null, battleModeFilter = "all", paymentStatusFilter = "all", userListFilter = "all", ledgerListFilter = "all", withdrawListFilter = "all", growthRewardFilter = "all", logListFilter = "all";
const V = 60, Z = {}, Te = "20260601-match-ops-v1";
function fe() {
  return localStorage.getItem("blitz_admin_token") || "";
}
function ge(e) {
  const t = e.replace(/^#/, "");
  return ["overview", "users", "funds", "withdraw", "growth", "ranks", "reconciliation", "risk", "matches", "config", "security", "logs"].includes(t) ? t : "overview";
}
async function d(e, t) {
  const a = await fetch(`${Be}${e}`, { ...t, headers: { "Content-Type": "application/json", Authorization: `Bearer ${fe()}`, ...t?.headers || {} } }), n = await a.json();
  if (!a.ok || n.code !== 0) throw new Error(n.message || "\u8BF7\u6C42\u5931\u8D25");
  return n.data;
}
function g(e) {
  if (e instanceof Error) return e.message;
  if (typeof e == "string") return e;
  try {
    return JSON.stringify(e);
  } catch {
    return "\u672A\u77E5\u9519\u8BEF";
  }
}
function Me(e) {
  return { overview: "\u6570\u636E\u603B\u89C8", users: "\u7528\u6237\u7BA1\u7406", funds: "\u8D44\u91D1\u6D41\u6C34", withdraw: "\u63D0\u73B0\u7BA1\u7406", growth: "\u589E\u957F\u8FD0\u8425", ranks: "\u6BB5\u4F4D\u8FD0\u8425", reconciliation: "\u5BF9\u8D26\u4E2D\u5FC3", risk: "\u98CE\u63A7\u5DE1\u68C0", matches: "\u5BF9\u5C40\u8BB0\u5F55", config: "\u8FD0\u8425\u914D\u7F6E", security: "\u8D26\u53F7\u5B89\u5168", logs: "\u64CD\u4F5C\u65E5\u5FD7" }[e];
}
function h(e = "") {
  return e ? e.startsWith("bot_") ? e : e.length > 16 ? `${e.slice(0, 10)}...${e.slice(-6)}` : e : "-";
}
function X(e) {
  return e.nickname || e.piUsername || h(e.uid || "");
}
function K(e) {
  return e.piUsername ? `Pi\uFF1A${e.piUsername}` : "Pi\uFF1A-";
}
function H(e = "") {
  return { playing: "\u5BF9\u5C40\u4E2D", finished: "\u5DF2\u7ED3\u675F", expired: "\u5DF2\u8FC7\u671F/\u5DF2\u4F5C\u5E9F", manual_review: "\u4EBA\u5DE5\u590D\u6838", created: "\u5DF2\u521B\u5EFA", pending: "\u5F85\u5904\u7406", approved: "\u5DF2\u901A\u8FC7", rejected: "\u5DF2\u62D2\u7EDD", paid: "\u5DF2\u6253\u6B3E", completed: "\u5DF2\u5B8C\u6210", failed: "\u5931\u8D25", cancelled: "\u5DF2\u53D6\u6D88", queueing: "\u5339\u914D\u4E2D", matched: "\u5DF2\u5339\u914D", idle: "\u7A7A\u95F2", ok: "\u6B63\u5E38", warning: "\u9700\u5173\u6CE8", danger: "\u9AD8\u98CE\u9669" }[e] || e || "-";
}
function oe(e = "") {
  return { quick_battle: "\u5FEB\u901F\u5F00\u6218", points_battle: "\u5C0F\u5BCC\u8C6A\uFF08\u79EF\u5206\uFF09", poc_battle: "\u5927\u5BCC\u8C6A\uFF08POC\uFF09", pi_battle: "\u8D85\u7EA7\u5BCC\u8C6A\uFF08Pi\uFF09", ticket_battle: "\u5C0F\u5BCC\u8C6A\u573A\uFF08\u65E7\uFF09", rich_battle: "\u5927\u5BCC\u8C6A\u573A\uFF08\u65E7\uFF09" }[e] || e || "-";
}
function qe(e = "") {
  return { recharge: "\u5145\u503C", payment: "\u5145\u503C", reward: "\u5956\u52B1", battle_entry: "\u5165\u573A\u8D39", battle_reward: "\u5BF9\u6218\u5956\u52B1", battle_refund: "\u5E73\u5C40\u9000\u8D39", withdraw_lock: "\u63D0\u73B0\u51BB\u7ED3", withdraw_reject: "\u63D0\u73B0\u9000\u56DE", withdraw_paid: "\u63D0\u73B0\u6253\u6B3E", transfer_out: "\u8F6C\u8D26\u652F\u51FA", transfer_in: "\u8F6C\u8D26\u6536\u5165", transfer_fee: "\u8F6C\u8D26\u624B\u7EED\u8D39", invite_reward: "\u9080\u8BF7\u5956\u52B1", invite_commission: "\u9080\u8BF7\u63D0\u6210", daily_signin_reward: "\u7B7E\u5230\u5956\u52B1", daily_task_reward: "\u4EFB\u52A1\u5956\u52B1" }[e] || e || "-";
}
function Le(e = "") {
  return { in: "\u6536\u5165", out: "\u652F\u51FA", lock: "\u51BB\u7ED3", unlock: "\u89E3\u51BB" }[e] || e || "-";
}
function Ce(e = "") {
  return { user_profile_update: "\u4FEE\u6539\u7528\u6237\u8D44\u6599", user_profile_reset: "\u91CD\u7F6E\u7528\u6237\u8D44\u6599", user_disable: "\u7981\u7528\u7528\u6237", user_enable: "\u542F\u7528\u7528\u6237", battle_expire_free_bot: "\u4F5C\u5E9F\u514D\u8D39\u5F02\u5E38\u5C40", battle_manual_review: "\u5BF9\u5C40\u8F6C\u4EBA\u5DE5\u590D\u6838", withdraw_approve: "\u63D0\u73B0\u5BA1\u6838\u901A\u8FC7", withdraw_reject: "\u63D0\u73B0\u5BA1\u6838\u62D2\u7EDD", withdraw_paid: "\u63D0\u73B0\u786E\u8BA4\u6253\u6B3E", auto_payout_paid: "\u81EA\u52A8\u51FA\u6B3E\u6210\u529F", auto_payout_failed: "\u81EA\u52A8\u51FA\u6B3E\u5931\u8D25" }[e] || e || "-";
}
function Ue(e = "") {
  return { manual_review: "\u4EBA\u5DE5\u5904\u7406", queued: "\u81EA\u52A8\u961F\u5217", processing: "\u51FA\u6B3E\u4E2D", failed: "\u81EA\u52A8\u5931\u8D25", paid: "\u5DF2\u5B8C\u6210" }[e] || e || "-";
}
function je(e = "") {
  return { user: "\u7528\u6237", battle_room: "\u5BF9\u5C40\u623F\u95F4", withdraw_order: "\u63D0\u73B0\u8BA2\u5355", payment_order: "\u5145\u503C\u8BA2\u5355", config: "\u8FD0\u8425\u914D\u7F6E" }[e] || e || "-";
}
function O(e) {
  if (!e) return "-";
  const t = new Date(e);
  return Number.isNaN(t.getTime()) ? e : t.toLocaleString("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}
function ce(e) {
  return e.status !== "playing" || !e.createdAt ? false : Date.now() - new Date(e.createdAt).getTime() > 300 * 1e3;
}
function Ie(e) {
  return e.status === "manual_review" || ce(e) || e.status === "playing" && e.entryFee > 0;
}
function De(e) {
  const t = re.trim().toLowerCase();
  return e.filter((a) => {
    const n = battleModeFilter === "all" || BATTLE_MODE_FILTERS.find((s) => s.key === battleModeFilter)?.modes.includes(a.mode);
    const s = I === "all" || I === "stale" && Ie(a) || a.status === I;
    return n && s ? t ? [a.roomNo, a.status, H(a.status), a.mode, oe(a.mode), a.playerAUid, a.playerAPiUsername, a.playerANickname, a.playerBUid, a.playerBPiUsername, a.playerBNickname, a.winnerUid, a.winnerPiUsername, a.winnerNickname].join(" ").toLowerCase().includes(t) : true : false;
  });
}
const BATTLE_MODE_FILTERS = [
  { key: "all", label: "全部模式", modes: [] },
  { key: "quick_battle", label: "快速开战", modes: ["quick_battle"] },
  { key: "points_battle", label: "小富豪（积分）", modes: ["points_battle"] },
  { key: "poc_battle", label: "大富豪（POC）", modes: ["poc_battle"] },
  { key: "pi_battle", label: "超级富豪（Pi）", modes: ["pi_battle", "ticket_battle", "rich_battle"] }
];
const PAYMENT_STATUS_FILTERS = [
  { key: "all", label: "全部", statuses: [] },
  { key: "open", label: "未闭环", statuses: ["created", "pending", "approved"] },
  { key: "completed", label: "已完成", statuses: ["completed"] },
  { key: "cancelled", label: "已取消", statuses: ["cancelled"] },
  { key: "failed", label: "失败", statuses: ["failed"] }
];
const USER_LIST_FILTERS = [
  { key: "all", label: "全部", match: () => true },
  { key: "normal", label: "正常", match: (e) => e.status === 1 },
  { key: "banned", label: "已封禁", match: (e) => e.status !== 1 },
  { key: "profile_missing", label: "资料未完", match: (e) => !e.profileCompleted },
  { key: "locked_balance", label: "有冻结", match: (e) => Number(e.wallet?.lockedBalance || 0) > 0 }
];
const LEDGER_LIST_FILTERS = [
  { key: "all", label: "全部", match: () => true },
  { key: "in", label: "收入", match: (e) => e.direction === "in" },
  { key: "out", label: "支出", match: (e) => e.direction === "out" },
  { key: "lock", label: "冻结", match: (e) => e.direction === "lock" },
  { key: "unlock", label: "解冻", match: (e) => e.direction === "unlock" },
  { key: "battle", label: "对战", match: (e) => String(e.type || "").startsWith("battle_") },
  { key: "withdraw", label: "提现", match: (e) => String(e.type || "").startsWith("withdraw_") },
  { key: "invite", label: "邀请", match: (e) => String(e.type || "").startsWith("invite_") }
];
const WITHDRAW_LIST_FILTERS = [
  { key: "all", label: "全部", match: () => true },
  { key: "pending", label: "待审核", match: (e) => e.status === "pending" },
  { key: "approved", label: "待打款", match: (e) => e.status === "approved" },
  { key: "paid", label: "已打款", match: (e) => e.status === "paid" },
  { key: "rejected", label: "已拒绝", match: (e) => e.status === "rejected" },
  { key: "auto_failed", label: "自动失败", match: (e) => e.autoPayoutStatus === "failed" }
];
const GROWTH_REWARD_FILTERS = [
  { key: "all", label: "全部", match: () => true },
  { key: "qualification", label: "对局奖励", match: (e) => e.rewardType === "qualification" },
  { key: "battle_commission", label: "对战提成", match: (e) => e.rewardType === "battle_commission" },
  { key: "completed", label: "已完成", match: (e) => e.status === "completed" },
  { key: "pending", label: "待处理", match: (e) => e.status === "pending" }
];
const LOG_LIST_FILTERS = [
  { key: "all", label: "全部", match: () => true },
  { key: "user", label: "用户", match: (e) => e.targetType === "user" },
  { key: "withdraw", label: "提现", match: (e) => e.targetType === "withdraw_order" },
  { key: "battle", label: "对局", match: (e) => e.targetType === "battle_room" },
  { key: "config", label: "配置", match: (e) => e.targetType === "config" },
  { key: "auto_payout", label: "自动出款", match: (e) => String(e.action || "").startsWith("auto_payout_") }
];
const ENGAGEMENT_PAID_MODES = ["points_battle", "poc_battle", "pi_battle"];
const ENGAGEMENT_BATTLE_MODES = [
  { key: "quick_battle", label: "快速开战" },
  { key: "points_battle", label: "小富豪" },
  { key: "poc_battle", label: "大富豪" },
  { key: "pi_battle", label: "超级富豪" }
];
const ENGAGEMENT_TASK_DEFAULTS = [
  { key: "play_1", title: "完成1局", condition: "battle_count", requiredCount: 1, rewardAmount: 0.01, enabled: true, modes: ENGAGEMENT_PAID_MODES },
  { key: "play_3", title: "完成3局", condition: "battle_count", requiredCount: 3, rewardAmount: 0.02, enabled: true, modes: ENGAGEMENT_PAID_MODES },
  { key: "win_1", title: "赢1局", condition: "win_count", requiredCount: 1, rewardAmount: 0.02, enabled: true, modes: ENGAGEMENT_PAID_MODES }
];
function filterPaymentOrders(e = []) {
  const t = PAYMENT_STATUS_FILTERS.find((a) => a.key === paymentStatusFilter) || PAYMENT_STATUS_FILTERS[0];
  return t.key === "all" ? e : e.filter((a) => t.statuses.includes(a.status));
}
function paymentStatusCount(e = [], t) {
  return t.key === "all" ? e.length : e.filter((a) => t.statuses.includes(a.status)).length;
}
function renderPaymentStatusFilters(e = []) {
  return `
    <div class="payment-filter-bar">
      ${PAYMENT_STATUS_FILTERS.map((t) => `<button type="button" data-payment-status-filter="${t.key}" class="${paymentStatusFilter === t.key ? "active" : ""}">${i(t.label)} <b>${paymentStatusCount(e, t)}</b></button>`).join("")}
    </div>
  `;
}
function filterList(e = [], t = [], a = "all") {
  const n = t.find((s) => s.key === a) || t[0];
  return e.filter((s) => n.match(s));
}
function filterCount(e = [], t) {
  return e.filter((a) => t.match(a)).length;
}
function renderListFilters(e = [], t = [], a = "all", n = "") {
  return `
    <div class="payment-filter-bar">
      ${t.map((s) => `<button type="button" data-list-filter-group="${n}" data-list-filter-value="${s.key}" class="${a === s.key ? "active" : ""}">${i(s.label)} <b>${filterCount(e, s)}</b></button>`).join("")}
    </div>
  `;
}
function ye(e) {
  return `avatar-token ${/^avatar_[1-6]$/.test(e || "") ? e : "avatar_1"}`;
}
function Fe(e) {
  const t = e.nickname || e.piUsername || "P";
  return i(t.trim().slice(0, 1).toUpperCase() || "P");
}
function Y(e) {
  return `<span class="${ye(e.avatarKey)}">${Fe(e)}</span>`;
}
function i(e) {
  return String(e || "").replace(/[&<>"']/g, (t) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[t] || t);
}
function E(e) {
  return i(e);
}
function me(e) {
  return i((e || []).join(`
`));
}
function we(e, t) {
  const a = Math.max(1, Math.ceil(t / V)), n = Z[e] || 1;
  return Math.min(Math.max(1, n), a);
}
function N(e, t) {
  const a = we(e, t.length), n = (a - 1) * V;
  return { page: a, totalPages: Math.max(1, Math.ceil(t.length / V)), total: t.length, items: t.slice(n, n + V) };
}
function P(e, t) {
  if (t <= V) return `<p class="pager-hint">\u5171 ${t} \u6761</p>`;
  const a = we(e, t), n = Math.max(1, Math.ceil(t / V));
  return `
    <div class="pager" data-pager="${e}">
      <span>\u5171 ${t} \u6761 \xB7 \u6BCF\u9875 ${V} \u6761 \xB7 \u7B2C ${a}/${n} \u9875</span>
      <button type="button" data-page-key="${e}" data-page-target="${a - 1}" ${a <= 1 ? "disabled" : ""}>\u4E0A\u4E00\u9875</button>
      <button type="button" data-page-key="${e}" data-page-target="${a + 1}" ${a >= n ? "disabled" : ""}>\u4E0B\u4E00\u9875</button>
    </div>
  `;
}
function Oe(e) {
  return (e.operation?.avatars?.length ? e.operation.avatars : [1, 2, 3, 4, 5, 6].map((a) => ({ key: `avatar_${a}`, name: `\u5934\u50CF${a}`, enabled: true }))).map((a, n) => `
        <div class="avatar-config-row">
          <span class="${ye(a.key)}">P</span>
          <input name="avatarName${n + 1}" maxlength="12" value="${i(a.name)}" />
          <select name="avatarEnabled${n + 1}">
            <option value="true" ${a.enabled !== false ? "selected" : ""}>\u542F\u7528</option>
            <option value="false" ${a.enabled === false ? "selected" : ""}>\u505C\u7528</option>
          </select>
        </div>
      `).join("");
}
const D = { enabled: false, normalTiles: [{ key: "ruby", name: "\u7EA2\u5B9D\u77F3", label: "", color: "#d3231b", textColor: "#fff6bd", imageUrl: "" }, { key: "amber", name: "\u91D1\u5E01", label: "", color: "#f08a12", textColor: "#fff6bd", imageUrl: "" }, { key: "jade", name: "\u7FE1\u7FE0", label: "", color: "#169950", textColor: "#fff6bd", imageUrl: "" }, { key: "aqua", name: "\u6D77\u6D6A", label: "", color: "#177ed0", textColor: "#fff6bd", imageUrl: "" }, { key: "slate", name: "\u7D2B\u6676", label: "", color: "#8a35ff", textColor: "#fff6bd", imageUrl: "" }, { key: "gold", name: "\u51A0\u519B\u91D1", label: "", color: "#c8a21f", textColor: "#fff6bd", imageUrl: "" }], specialTiles: { horizontal: { name: "\u6A2A\u5411\u95EA\u7535", label: "\u6A2A", color: "#ffe56d", textColor: "#ffe56d", imageUrl: "" }, vertical: { name: "\u7EB5\u5411\u95EA\u7535", label: "\u7EB5", color: "#ffe56d", textColor: "#ffe56d", imageUrl: "" }, bomb: { name: "\u7206\u70B8\u65B9\u5757", label: "\u7206", color: "#ffe56d", textColor: "#ffe56d", imageUrl: "" } } };
function ze(e) {
  const t = e.operation?.tileTheme || D;
  return { enabled: t.enabled !== false, normalTiles: D.normalTiles.map((a, n) => {
    const s = (t.normalTiles || []).find((r) => r.key === a.key) || (t.normalTiles || [])[n] || {};
    return { ...a, ...s, key: a.key };
  }), specialTiles: { horizontal: { ...D.specialTiles.horizontal, ...t.specialTiles?.horizontal || {} }, vertical: { ...D.specialTiles.vertical, ...t.specialTiles?.vertical || {} }, bomb: { ...D.specialTiles.bomb, ...t.specialTiles?.bomb || {} } } };
}
function We(e) {
  const t = ze(e), a = t.normalTiles.map((s, r) => `
        <div class="tile-config-row">
          <span class="tile-preview" style="--tile-color: ${i(s.color)}; --tile-text-color: ${i(s.textColor)}">${i(s.label || String(r + 1))}</span>
          <input name="tileName${r}" maxlength="12" value="${i(s.name)}" />
          <input name="tileLabel${r}" maxlength="2" value="${i(s.label)}" placeholder="\u53EF\u7A7A" />
          <input name="tileColor${r}" type="color" value="${i(s.color)}" />
          <input name="tileTextColor${r}" type="color" value="${i(s.textColor)}" />
          <input name="tileImageUrl${r}" value="${i(s.imageUrl || "")}" placeholder="\u8D34\u56FEURL\uFF0C\u53EF\u7A7A" />
        </div>
      `).join(""), n = [{ key: "horizontal", tile: t.specialTiles.horizontal }, { key: "vertical", tile: t.specialTiles.vertical }, { key: "bomb", tile: t.specialTiles.bomb }].map(({ key: s, tile: r }) => `
        <div class="tile-config-row special">
          <span class="tile-preview special" style="--tile-color: ${i(r.color)}; --tile-text-color: ${i(r.textColor)}">${i(r.label)}</span>
          <input name="specialTileName_${s}" maxlength="12" value="${i(r.name)}" />
          <input name="specialTileLabel_${s}" maxlength="2" value="${i(r.label)}" />
          <input name="specialTileColor_${s}" type="color" value="${i(r.color)}" />
          <input name="specialTileTextColor_${s}" type="color" value="${i(r.textColor)}" />
          <input name="specialTileImageUrl_${s}" value="${i(r.imageUrl || "")}" placeholder="\u8D34\u56FEURL\uFF0C\u53EF\u7A7A" />
        </div>
      `).join("");
  return `
    <label>
      <span>\u65B9\u5757\u4E3B\u9898\u5F00\u5173</span>
      <select name="tileThemeEnabled">
        <option value="true" ${t.enabled ? "selected" : ""}>\u542F\u7528\u540E\u53F0\u914D\u7F6E</option>
        <option value="false" ${t.enabled ? "" : "selected"}>\u4F7F\u7528\u4EE3\u7801\u9ED8\u8BA4</option>
      </select>
    </label>
    <p class="meta">\u8D34\u56FEURL\u53EF\u586B https \u56FE\u7247\u5730\u5740\u6216\u7AD9\u5185 /assets/xxx.png\uFF1B\u4E3A\u7A7A\u65F6\u4F7F\u7528\u989C\u8272\u3002\u5EFA\u8BAE\u56FE\u7247\u63A7\u5236\u5728 128x128 \u4EE5\u5185\uFF0C\u4F18\u5148 webp/png\u3002</p>
    <div class="tile-config-head">
      <span>\u9884\u89C8</span><span>\u540D\u79F0</span><span>\u5B57</span><span>\u4E3B\u8272</span><span>\u5B57\u8272</span><span>\u8D34\u56FEURL</span>
    </div>
    ${a}
    <strong>\u7279\u6B8A\u65B9\u5757</strong>
    <div class="tile-config-head">
      <span>\u9884\u89C8</span><span>\u540D\u79F0</span><span>\u5B57</span><span>\u4E3B\u8272</span><span>\u5B57\u8272</span><span>\u8D34\u56FEURL</span>
    </div>
    ${n}
  `;
}
function Ke(e) {
  return [{ key: "bronze", name: "\u9752\u94DC", icon: "\u25C6", color: "#b87a45", enabled: true }, { key: "silver", name: "\u767D\u94F6", icon: "\u25C7", color: "#c7d2e2", enabled: true }, { key: "gold", name: "\u9EC4\u91D1", icon: "\u2726", color: "#f2c84b", enabled: true }, { key: "platinum", name: "\u94C2\u91D1", icon: "\u2727", color: "#7fe6ff", enabled: true }, { key: "diamond", name: "\u94BB\u77F3", icon: "\u2739", color: "#b58cff", enabled: true }, { key: "starlight", name: "\u661F\u8000", icon: "\u2737", color: "#e7a6ff", enabled: true }, { key: "king", name: "\u738B\u8005", icon: "\u265B", color: "#ffdc73", enabled: true }].map((n) => ({ ...n, ...(e.operation?.ranks || []).find((s) => s.key === n.key) })).map((n, s) => `
        <div class="rank-config-row">
          <span class="rank-preview" style="--rank-color: ${i(n.color)}">${i(n.icon)}</span>
          <input name="rankName${s + 1}" maxlength="12" value="${i(n.name)}" />
          <input name="rankIcon${s + 1}" maxlength="2" value="${i(n.icon)}" />
          <input name="rankColor${s + 1}" type="color" value="${i(n.color)}" />
          <select name="rankEnabled${s + 1}">
            <option value="true" ${n.enabled !== false ? "selected" : ""}>\u542F\u7528</option>
            <option value="false" ${n.enabled === false ? "selected" : ""}>\u505C\u7528</option>
          </select>
        </div>
      `).join("");
}
const ee = [{ code: "zh-CN", label: "\u4E2D\u6587", hint: "\u9ED8\u8BA4\u4E2D\u6587\u5185\u5BB9" }, { code: "en", label: "English", hint: "\u82F1\u6587\u5185\u5BB9" }, { code: "vi", label: "Ti\u1EBFng Vi\u1EC7t", hint: "\u8D8A\u5357\u8BED\u5185\u5BB9" }, { code: "ko", label: "\uD55C\uAD6D\uC5B4", hint: "\u97E9\u8BED\u5185\u5BB9" }, { code: "ja", label: "\u65E5\u672C\u8A9E", hint: "\u65E5\u8BED\u5185\u5BB9" }], pe = [{ key: "projectName", label: "\u9996\u9875\u6807\u9898" }, { key: "englishName", label: "\u9876\u90E8\u82F1\u6587\u6807\u8BC6" }, { key: "bannerDescription", label: "\u9996\u9875\u63CF\u8FF0" }], be = [{ key: "rechargeNotice", label: "\u5145\u503C\u63D0\u793A" }, { key: "withdrawNotice", label: "\u63D0\u73B0\u63D0\u793A" }, { key: "ruleSummary", label: "\u6BB5\u4F4D\u89C4\u5219\u6458\u8981" }];
function He(e) {
  return !!String(e || "").trim();
}
function ue(e, t) {
  return t.filter((a) => !He(e[a.key])).map((a) => a.label);
}
function ke(e, t) {
  const a = ee.map((s) => {
    const r = ue(e(s.code), t);
    return { locale: s, missing: r, complete: t.length - r.length };
  }), n = a.reduce((s, r) => s + r.missing.length, 0);
  return `
    <div class="i18n-health ${n ? "warning" : "ok"}">
      <div>
        <strong>${n ? `\u8FD8\u6709 ${n} \u9879\u672A\u586B\u5199` : "\u591A\u8BED\u8A00\u5185\u5BB9\u5B8C\u6574"}</strong>
        <span>${n ? "\u5EFA\u8BAE\u4E0A\u7EBF\u524D\u8865\u9F50\uFF0C\u907F\u514D\u6D77\u5916\u7528\u6237\u770B\u5230\u7A7A\u6587\u6848\u6216\u4E2D\u6587\u56DE\u9000\u3002" : "\u5F53\u524D\u8BED\u8A00\u914D\u7F6E\u53EF\u4EE5\u652F\u6301\u6D77\u5916\u7528\u6237\u57FA\u7840\u8FD0\u8425\u3002"}</span>
      </div>
      <div class="i18n-health-list">
        ${a.map((s) => `
              <span class="${s.missing.length ? "missing" : "ok"}">
                ${i(s.locale.label)} ${s.complete}/${t.length}
              </span>
            `).join("")}
      </div>
    </div>
  `;
}
function $e(e, t) {
  const a = e.operation?.localizedContent || {};
  return { ...{ maintenanceNotice: e.operation?.maintenanceNotice || "", rechargeNotice: "", withdrawNotice: "", ruleSummary: e.operation?.rankRules?.ruleSummary || "" }, ...a[t] || {} };
}
function Je(e) {
  const t = ke((a) => $e(e, a), be);
  return ee.map((a, n) => {
    const s = $e(e, a.code), r = ue(s, be);
    return `
        ${n === 0 ? t : ""}
        <section class="localized-config-card">
          <div class="section-head compact">
            <div>
              <strong>${i(a.label)}</strong>
              <p class="meta">${r.length ? `\u7F3A\u5C11\uFF1A${i(r.join("\u3001"))}` : i(a.hint)}</p>
            </div>
            <span class="pill ${r.length ? "warning" : "ok"}">${r.length ? "\u5F85\u8865\u9F50" : "\u5B8C\u6574"} \xB7 ${i(a.code)}</span>
          </div>
          <label><span>\u7EF4\u62A4\u516C\u544A</span><textarea name="i18n_${a.code}_maintenanceNotice" rows="2">${i(s.maintenanceNotice || "")}</textarea></label>
          <label><span>\u5145\u503C\u63D0\u793A</span><textarea name="i18n_${a.code}_rechargeNotice" rows="2">${i(s.rechargeNotice || "")}</textarea></label>
          <label><span>\u63D0\u73B0\u63D0\u793A</span><textarea name="i18n_${a.code}_withdrawNotice" rows="2">${i(s.withdrawNotice || "")}</textarea></label>
          <label><span>\u6BB5\u4F4D\u89C4\u5219\u6458\u8981</span><textarea name="i18n_${a.code}_ruleSummary" rows="2">${i(s.ruleSummary || "")}</textarea></label>
        </section>
      `;
  }).join("");
}
function Ve(e) {
  return ee.reduce((t, a) => (t[a.code] = { maintenanceNotice: String(e.get(`i18n_${a.code}_maintenanceNotice`) || ""), rechargeNotice: String(e.get(`i18n_${a.code}_rechargeNotice`) || ""), withdrawNotice: String(e.get(`i18n_${a.code}_withdrawNotice`) || ""), ruleSummary: String(e.get(`i18n_${a.code}_ruleSummary`) || "") }, t), {});
}
function ve(e, t) {
  const a = Array.isArray(e?.banners) && e.banners.length ? e.banners[0] : {}, n = e?.localizedContent || {};
  return { ...{ projectName: t === "zh-CN" ? e?.projectName : e?.englishName, englishName: e?.englishName || "Blitz of Pi", bannerDescription: a?.description || "" }, ...n[t] || {} };
}
function Qe(e) {
  const t = ke((a) => ve(e, a), pe);
  return ee.map((a, n) => {
    const s = ve(e, a.code), r = ue(s, pe);
    return `
        ${n === 0 ? t : ""}
        <section class="localized-config-card">
          <div class="section-head compact">
            <div>
              <strong>${i(a.label)}</strong>
              <p class="meta">${r.length ? `\u7F3A\u5C11\uFF1A${i(r.join("\u3001"))}` : i(a.hint)}</p>
            </div>
            <span class="pill ${r.length ? "warning" : "ok"}">${r.length ? "\u5F85\u8865\u9F50" : "\u5B8C\u6574"} \xB7 ${i(a.code)}</span>
          </div>
          <label><span>\u9996\u9875\u6807\u9898</span><input name="home_i18n_${a.code}_projectName" value="${E(s.projectName || "")}" /></label>
          <label><span>\u9876\u90E8\u82F1\u6587\u6807\u8BC6</span><input name="home_i18n_${a.code}_englishName" value="${E(s.englishName || "")}" /></label>
          <label><span>\u9996\u9875\u63CF\u8FF0</span><textarea name="home_i18n_${a.code}_bannerDescription" rows="3">${i(s.bannerDescription || "")}</textarea></label>
        </section>
      `;
  }).join("");
}
function Ge(e) {
  return ee.reduce((t, a) => (t[a.code] = { projectName: String(e.get(`home_i18n_${a.code}_projectName`) || ""), englishName: String(e.get(`home_i18n_${a.code}_englishName`) || ""), bannerDescription: String(e.get(`home_i18n_${a.code}_bannerDescription`) || "") }, t), {});
}
function Xe(e) {
  const t = e.operation?.rankRules || {}, a = Array.isArray(t.rankedModes) ? t.rankedModes : ["points_battle", "poc_battle", "pi_battle"], n = Array.isArray(t.weeklyLeaderboardModes) ? t.weeklyLeaderboardModes : ["points_battle", "poc_battle", "pi_battle"], s = Se(t), r = e.operation?.ranks?.length ? e.operation.ranks : [{ key: "bronze", name: "\u9752\u94DC" }, { key: "silver", name: "\u767D\u94F6" }, { key: "gold", name: "\u9EC4\u91D1" }, { key: "platinum", name: "\u94C2\u91D1" }, { key: "diamond", name: "\u94BB\u77F3" }, { key: "starlight", name: "\u661F\u8000" }, { key: "king", name: "\u738B\u8005" }];
  return `
    <div class="rank-rule-grid">
      <label><span>\u6BCF\u6BB5\u661F\u6570</span><input name="rankStarsPerRank" type="number" inputmode="decimal" min="1" max="10" step="1" value="${t.starsPerRank ?? 5}" /></label>
      <label><span>\u80DC\u5229\u52A0\u661F</span><input name="rankWinStars" type="number" inputmode="decimal" min="1" max="5" step="1" value="${t.winStars ?? 1}" /></label>
      <label><span>\u5931\u8D25\u6263\u661F</span><input name="rankLoseStars" type="number" inputmode="decimal" min="0" max="5" step="1" value="${t.loseStars ?? 1}" /></label>
      <label>
        <span>\u9752\u94DC\u4FDD\u62A4</span>
        <select name="rankBronzeProtection">
          <option value="true" ${t.bronzeProtection !== false ? "selected" : ""}>\u5F00\u542F</option>
          <option value="false" ${t.bronzeProtection === false ? "selected" : ""}>\u5173\u95ED</option>
        </select>
      </label>
      <label>
        <span>\u8FDE\u80DC\u5956\u52B1</span>
        <select name="rankWinStreakBonusEnabled">
          <option value="true" ${t.winStreakBonusEnabled !== false ? "selected" : ""}>\u5F00\u542F</option>
          <option value="false" ${t.winStreakBonusEnabled === false ? "selected" : ""}>\u5173\u95ED</option>
        </select>
      </label>
      <label><span>\u8FDE\u80DC\u573A\u6B21</span><input name="rankWinStreakRequired" type="number" inputmode="decimal" min="2" max="10" step="1" value="${t.winStreakRequired ?? 3}" /></label>
      <label><span>\u8FDE\u80DC\u989D\u5916\u52A0\u661F</span><input name="rankWinStreakBonusStars" type="number" inputmode="decimal" min="0" max="5" step="1" value="${t.winStreakBonusStars ?? 1}" /></label>
      <label><span>\u6BCF\u65E5\u5B9D\u7BB1\u6709\u6548\u573A\u6570</span><input name="rankDailyChestRequiredBattles" type="number" inputmode="decimal" min="1" max="20" step="1" value="${t.dailyChestRequiredBattles ?? 3}" /></label>
      <label>
        <span>\u5468\u699C\u81EA\u52A8\u53D1\u5956</span>
        <select name="rankWeeklyAutoSettleEnabled">
          <option value="true" ${t.weeklyAutoSettleEnabled !== false ? "selected" : ""}>\u5F00\u542F</option>
          <option value="false" ${t.weeklyAutoSettleEnabled === false ? "selected" : ""}>\u5173\u95ED</option>
        </select>
      </label>
      <label>
        <span>\u8D85\u7EA7\u5BCC\u8C6A\u6700\u4F4E\u6BB5\u4F4D</span>
        <select name="rankRichBattleMinRankKey">
          ${r.map((o) => `<option value="${o.key}" ${(t.richBattleMinRankKey || "bronze") === o.key ? "selected" : ""}>${i(o.name)}</option>`).join("")}
        </select>
      </label>
      <label>
        <span>\u5FEB\u901F\u5F00\u6218\u6700\u9AD8\u5347\u5230</span>
        <select name="rankQuickBattleMaxRankKey">
          ${r.map((o) => `<option value="${o.key}" ${(t.quickBattleMaxRankKey || "silver") === o.key ? "selected" : ""}>${i(o.name)}</option>`).join("")}
        </select>
      </label>
      <label>
        <span>\u5C0F\u5BCC\u8C6A/\u5927\u5BCC\u8C6A\u6700\u9AD8\u5347\u5230</span>
        <select name="rankTicketBattleMaxRankKey">
          ${r.map((o) => `<option value="${o.key}" ${(t.ticketBattleMaxRankKey || "platinum") === o.key ? "selected" : ""}>${i(o.name)}</option>`).join("")}
        </select>
      </label>
    </div>
    <div class="weekly-tier-editor">
      <div class="weekly-tier-head">
        <strong>\u5468\u699C\u5956\u52B1\u6863\u4F4D</strong>
        <button type="button" id="add-weekly-tier">\u65B0\u589E\u6863\u4F4D</button>
      </div>
      <p class="meta">\u6309\u540D\u6B21\u914D\u5956\u52B1\uFF0C\u5468\u4E00\u81EA\u52A8\u53D1\u653E\u3002</p>
      <div id="weekly-tier-list">
        ${s.map(_e).join("")}
      </div>
    </div>
    <div class="ranked-mode-checks">
      <label><input type="checkbox" name="rankedModeQuick" value="quick_battle" ${a.includes("quick_battle") ? "checked" : ""} /> \u5FEB\u901F\u5F00\u6218\u8BA1\u5165\u6BB5\u4F4D</label>
      <label><input type="checkbox" name="rankedModePoints" value="points_battle" ${a.includes("points_battle") ? "checked" : ""} /> \u5C0F\u5BCC\u8C6A\uFF08\u79EF\u5206\uFF09\u8BA1\u5165\u6BB5\u4F4D</label>
      <label><input type="checkbox" name="rankedModePoc" value="poc_battle" ${a.includes("poc_battle") ? "checked" : ""} /> \u5927\u5BCC\u8C6A\uFF08POC\uFF09\u8BA1\u5165\u6BB5\u4F4D</label>
      <label><input type="checkbox" name="rankedModePi" value="pi_battle" ${a.includes("pi_battle") ? "checked" : ""} /> \u8D85\u7EA7\u5BCC\u8C6A\uFF08Pi\uFF09\u8BA1\u5165\u6BB5\u4F4D</label>
    </div>
    <div class="ranked-mode-checks">
      <label><input type="checkbox" name="weeklyModeQuick" value="quick_battle" ${n.includes("quick_battle") ? "checked" : ""} /> \u5FEB\u901F\u5F00\u6218\u8BA1\u5165\u5468\u699C</label>
      <label><input type="checkbox" name="weeklyModePoints" value="points_battle" ${n.includes("points_battle") ? "checked" : ""} /> \u5C0F\u5BCC\u8C6A\uFF08\u79EF\u5206\uFF09\u8BA1\u5165\u5468\u699C</label>
      <label><input type="checkbox" name="weeklyModePoc" value="poc_battle" ${n.includes("poc_battle") ? "checked" : ""} /> \u5927\u5BCC\u8C6A\uFF08POC\uFF09\u8BA1\u5165\u5468\u699C</label>
      <label><input type="checkbox" name="weeklyModePi" value="pi_battle" ${n.includes("pi_battle") ? "checked" : ""} /> \u8D85\u7EA7\u5BCC\u8C6A\uFF08Pi\uFF09\u8BA1\u5165\u5468\u699C</label>
    </div>
    <div class="rank-reward-grid">
      ${r.map((o) => `
            <label>
              <span>${i(o.name)}\u5B9D\u7BB1\u5956\u52B1 Pi</span>
              <input name="rankChestReward_${o.key}" type="number" inputmode="decimal" min="0" max="100" step="0.0001" value="${t.chestRewards?.[o.key] ?? 0}" />
            </label>
          `).join("")}
    </div>
    <label><span>\u6BB5\u4F4D\u89C4\u5219\u8BF4\u660E</span><textarea name="rankRuleSummary" rows="2">${i(t.ruleSummary || "\u5C0F\u5BCC\u8C6A\u3001\u5927\u5BCC\u8C6A\u3001\u8D85\u7EA7\u5BCC\u8C6A\u8BA1\u5165\u6BB5\u4F4D\u548C\u5468\u699C\u3002")}</textarea></label>
  `;
}
function Se(e = {}) {
  return (Array.isArray(e.weeklyRewardTiers) && e.weeklyRewardTiers.length ? e.weeklyRewardTiers : [{ fromRank: 1, toRank: 1, amount: e.weeklyRewards?.top1 ?? 0.05 }, { fromRank: 2, toRank: 2, amount: e.weeklyRewards?.top2 ?? 0.03 }, { fromRank: 3, toRank: 3, amount: e.weeklyRewards?.top3 ?? 0.02 }, { fromRank: 4, toRank: 10, amount: e.weeklyRewards?.top10 ?? 5e-3 }]).map((a) => ({ fromRank: Number(a.fromRank || 1), toRank: Number(a.toRank || a.fromRank || 1), amount: Number(a.amount || 0) })).filter((a) => a.amount > 0).sort((a, n) => a.fromRank - n.fromRank || a.toRank - n.toRank);
}
function _e(e = { fromRank: 1, toRank: 1, amount: 0 }) {
  return `
    <div class="weekly-tier-row" data-weekly-tier-row>
      <label><span>\u8D77\u59CB\u540D\u6B21</span><input name="weeklyTierFromRank" type="number" inputmode="decimal" min="1" max="500" step="1" value="${e.fromRank}" /></label>
      <label><span>\u7ED3\u675F\u540D\u6B21</span><input name="weeklyTierToRank" type="number" inputmode="decimal" min="1" max="500" step="1" value="${e.toRank}" /></label>
      <label><span>\u6BCF\u4EBA\u5956\u52B1 Pi</span><input name="weeklyTierAmount" type="number" inputmode="decimal" min="0" max="100" step="0.0001" value="${e.amount}" /></label>
      <button type="button" data-remove-weekly-tier>\u5220\u9664</button>
    </div>
  `;
}
function Ze(e, t) {
  return `
    <div class="invite-level-row">
      <label><span>\u7B49\u7EA7\u6807\u8BC6</span><input name="inviteLevelKey${t}" maxlength="24" value="${E(e.key || `level_${t + 1}`)}" /></label>
      <label><span>\u7B49\u7EA7\u540D\u79F0</span><input name="inviteLevelName${t}" maxlength="16" value="${E(e.name || "\u8D21\u732E\u4F19\u4F34")}" /></label>
      <label><span>\u63D0\u6210\u6BD4\u4F8B</span><input name="inviteLevelRate${t}" type="number" inputmode="decimal" min="0" max="0.2" step="0.001" value="${Number(e.commissionRate || 0)}" /></label>
      <label><span>\u4F59\u989D\u8FBE\u6807 Pi</span><input name="inviteLevelMinBalance${t}" type="number" inputmode="decimal" min="0" step="0.01" value="${Number(e.minBalance || 0)}" /></label>
      <label><span>\u9080\u8BF7\u8FBE\u6807\u4EBA\u6570</span><input name="inviteLevelMinInvites${t}" type="number" inputmode="decimal" min="0" step="1" value="${Number(e.minDirectInvites || 0)}" /></label>
      <label><span>\u72B6\u6001</span><select name="inviteLevelEnabled${t}">
        <option value="true" ${e.enabled !== false ? "selected" : ""}>\u542F\u7528</option>
        <option value="false" ${e.enabled === false ? "selected" : ""}>\u505C\u7528</option>
      </select></label>
    </div>
  `;
}
function Re(e) {
  const t = ["overview", "users", "funds", "withdraw", "growth", "ranks", "reconciliation", "risk", "matches", "config", "security", "logs"];
  _ = ge(window.location.hash || _), le.innerHTML = `
    <div class="layout">
      <aside class="sidebar">
        <div class="sidebar-brand">
          <span class="brand-mark" aria-hidden="true">${BRAND_LOGO_HTML}</span>
          <div>
            <h1>Pi\u95EA\u7535\u6218\u540E\u53F0</h1>
            <small class="build-version">${Te}</small>
          </div>
        </div>
        <nav>
          ${t.map((a) => `<a href="#${a}" data-admin-tab-link="${a}" class="${_ === a ? "active" : ""}">${Me(a)}</a>`).join("")}
          <a href="#" id="logout">\u9000\u51FA\u767B\u5F55</a>
        </nav>
      </aside>
      <main class="content">${e}</main>
    </div>
  `, document.querySelector("#logout")?.addEventListener("click", (a) => {
    a.preventDefault(), localStorage.removeItem("blitz_admin_token"), ae();
  }), document.querySelectorAll("[data-admin-tab-link]").forEach((a) => {
    a.addEventListener("click", (n) => {
      n.preventDefault(), _ = a.dataset.adminTabLink, window.location.hash = _, F();
    });
  }), document.querySelectorAll("[data-page-key]").forEach((a) => {
    a.addEventListener("click", () => {
      const n = a.dataset.pageKey || "", s = Number(a.dataset.pageTarget || 1);
      !n || !Number.isFinite(s) || (Z[n] = s, F());
    });
  }), document.querySelectorAll("[data-payment-status-filter]").forEach((a) => {
    a.addEventListener("click", () => {
      paymentStatusFilter = a.dataset.paymentStatusFilter || "all";
      Z["funds-payments"] = 1;
      F();
    });
  }), document.querySelectorAll("[data-list-filter-group]").forEach((a) => {
    a.addEventListener("click", () => {
      const n = a.dataset.listFilterGroup || "", s = a.dataset.listFilterValue || "all";
      if (n === "users") {
        userListFilter = s;
        Z.users = 1;
      }
      if (n === "ledgers") {
        ledgerListFilter = s;
        Z["funds-ledgers"] = 1;
      }
      if (n === "withdraw") {
        withdrawListFilter = s;
        Z["withdraw-orders"] = 1;
      }
      if (n === "growth-rewards") {
        growthRewardFilter = s;
        Z["growth-rewards"] = 1;
      }
      if (n === "logs") {
        logListFilter = s;
        Z.logs = 1;
      }
      F();
    });
  }), document.querySelector("#rank-user-filter")?.addEventListener("change", (a) => {
    G = a.currentTarget.value, Z["ranks-users"] = 1, F();
  }), document.querySelector("#rank-weekly-settle")?.addEventListener("click", async (a) => {
    const n = a.currentTarget, s = document.querySelector("#rank-weekly-status");
    if (confirm("\u786E\u8BA4\u6267\u884C\u4E0A\u4E00\u5468\u6BB5\u4F4D\u699C\u5E94\u6025\u8865\u53D1\uFF1F\u7CFB\u7EDF\u4F1A\u81EA\u52A8\u9632\u91CD\u590D\u53D1\u653E\u3002")) {
      n.disabled = true, s && (s.textContent = "\u6B63\u5728\u6267\u884C\u5468\u5956\u52B1\u7ED3\u7B97...");
      try {
        const r = await d("/admin-api/ranks/settle-weekly", { method: "POST" });
        s && (s.textContent = r.alreadySettled ? `${r.seasonNo} \u5DF2\u7ED3\u7B97\uFF0C\u65E0\u9700\u91CD\u590D\u53D1\u653E` : `${r.seasonNo} \u7ED3\u7B97\u5B8C\u6210\uFF0C\u53D1\u653E ${r.rewards.length} \u4EBA`), await q();
      } catch (r) {
        s && (s.textContent = g(r)), n.disabled = false;
      }
    }
  }), document.querySelector("#risk-refresh")?.addEventListener("click", async (a) => {
    const n = a.currentTarget, s = document.querySelector("#risk-status");
    n.disabled = true, s && (s.textContent = "\u6B63\u5728\u91CD\u65B0\u5DE1\u68C0...");
    try {
      const r = await d("/admin-api/risk-audit/report");
      Q && (Q[13] = r), s && (s.textContent = "\u5DE1\u68C0\u5B8C\u6210\uFF0C\u6B63\u5728\u5237\u65B0\u9875\u9762..."), F();
    } catch (r) {
      s && (s.textContent = g(r)), n.disabled = false;
    }
  }), document.querySelector("#add-engagement-task")?.addEventListener("click", () => {
    const a = document.querySelectorAll("[data-engagement-task-row]").length + 1;
    document.querySelector("#engagement-task-list")?.insertAdjacentHTML("beforeend", engagementTaskRows([{
      key: `task_${a}`,
      title: `每日任务${a}`,
      condition: "battle_count",
      requiredCount: 1,
      rewardAmount: 0,
      enabled: true,
      modes: ENGAGEMENT_PAID_MODES
    }]));
    he();
  }), document.querySelector("#add-weekly-tier")?.addEventListener("click", () => {
    document.querySelector("#weekly-tier-list")?.insertAdjacentHTML("beforeend", _e({ fromRank: 1, toRank: 1, amount: 0 })), he();
  }), he();
}
function he() {
  document.querySelectorAll("[data-remove-engagement-task]").forEach((e) => {
    e.dataset.bound !== "true" && (e.dataset.bound = "true", e.addEventListener("click", () => {
      e.closest("[data-engagement-task-row]")?.remove();
    }));
  });
  document.querySelectorAll("[data-remove-weekly-tier]").forEach((e) => {
    e.dataset.bound !== "true" && (e.dataset.bound = "true", e.addEventListener("click", () => {
      e.closest("[data-weekly-tier-row]")?.remove();
    }));
  });
}
function S(e, t, a, n = "") {
  return `
    <article class="metric-card dashboard-card ${n}">
      <h3>${i(e)}</h3>
      <p>${i(t)}</p>
      <small>${i(a)}</small>
    </article>
  `;
}
function f(e, t, a) {
  return `
    <article class="mini-stat">
      <span>${i(e)}</span>
      <strong>${i(t)}</strong>
      <small>${i(a)}</small>
    </article>
  `;
}
function renderAssetLines(e = []) {
  return (Array.isArray(e) ? e : []).map((t) => `
    <span class="asset-line">
      <b>${$(t.platformRevenue)} ${i(t.assetUnit || t.assetType)}</b>
      <small>${Number(t.finishedRooms || 0)} \u5C40</small>
    </span>
  `).join("");
}
function renderRewardAssetLines(e = []) {
  return (Array.isArray(e) ? e : []).map((t) => {
    const a = t.assetType === "POINTS" ? Math.floor(Number(t.totalReward || 0)) : $(t.totalReward);
    return `
      <span class="asset-line">
        <b>${a} ${i(t.assetUnit || t.assetType)}</b>
        <small>${Number(t.finishedRooms || 0)} \u5C40</small>
      </span>
    `;
  }).join("");
}
const Ye = { match_queue_join: "\u8FDB\u5165\u961F\u5217", match_reuse_room: "\u590D\u7528\u623F\u95F4", match_room_created: "\u521B\u5EFA\u623F\u95F4", match_status_room_created: "\u8F6E\u8BE2\u6210\u623F", match_bot_room_created: "\u673A\u5668\u4EBA\u8865\u4F4D", match_cancel: "\u53D6\u6D88\u5339\u914D", match_watch_join: "\u5339\u914D\u63A8\u9001\u63A5\u5165", match_watch_failed: "\u5339\u914D\u63A8\u9001\u964D\u7EA7", realtime_join: "WS\u8FDB\u623F", realtime_ready: "\u51C6\u5907\u786E\u8BA4", realtime_started: "\u6B63\u5F0F\u5F00\u5C40", realtime_swap_event: "\u7279\u6B8A/\u653B\u51FB\u4E8B\u4EF6", realtime_swap_ok: "\u4EA4\u6362\u6210\u529F", realtime_swap_error: "\u4EA4\u6362\u5F02\u5E38", realtime_disconnected: "\u8FDE\u63A5\u65AD\u5F00", realtime_finished: "\u5BF9\u5C40\u7ED3\u675F", realtime_tick_slow: "Tick\u6162", realtime_tick_skipped: "Tick\u8DF3\u8FC7", realtime_broadcast_slow: "\u5E7F\u64AD\u6162", settlement_queued: "\u7ED3\u7B97\u5165\u961F", settlement_done: "\u7ED3\u7B97\u5B8C\u6210", settlement_retry: "\u7ED3\u7B97\u91CD\u8BD5", client_match_start: "\u7528\u6237\u70B9\u5339\u914D", client_match_queueing: "\u7528\u6237\u6392\u961F\u4E2D", client_match_ws_open: "\u5339\u914D\u63A8\u9001\u6253\u5F00", client_match_ws_ready: "\u5339\u914D\u63A8\u9001\u53EF\u7528", client_match_ws_error: "\u5339\u914D\u63A8\u9001\u5F02\u5E38", client_match_ws_closed: "\u5339\u914D\u63A8\u9001\u65AD\u5F00", client_match_poll_failed: "\u5339\u914D\u8F6E\u8BE2\u5931\u8D25", client_match_enter_room: "\u7528\u6237\u8FDB\u623F", client_match_start_failed: "\u53D1\u8D77\u5339\u914D\u5931\u8D25", client_match_cancel: "\u7528\u6237\u53D6\u6D88\u5339\u914D", client_match_cancel_failed: "\u53D6\u6D88\u5339\u914D\u5931\u8D25", client_realtime_connect_start: "\u7528\u6237\u8FDE\u5BF9\u5C40", client_realtime_open: "\u5BF9\u5C40WS\u6253\u5F00", client_realtime_first_state: "\u6536\u5230\u9996\u5305", client_realtime_connect_slow: "\u8FDB\u623F\u6162", client_realtime_slow: "\u5BF9\u5C40\u5F31\u7F51", client_realtime_retry: "\u7528\u6237\u7AEF\u91CD\u8FDE", client_realtime_retry_failed: "\u91CD\u8FDE\u5931\u8D25", client_realtime_error: "\u5BF9\u5C40WS\u5F02\u5E38", client_realtime_closed: "\u5BF9\u5C40WS\u65AD\u5F00", client_swap_send: "\u7528\u6237\u6ED1\u52A8", client_swap_rejected: "\u4EA4\u6362\u88AB\u62D2", client_burst_show: "\u63D0\u793A\u663E\u793A", client_burst_suppressed: "\u63D0\u793A\u5DF2\u53BB\u91CD", client_error: "\u7528\u6237\u7AEF\u62A5\u9519" };
function et(e = "") {
  return Ye[e] || e || "\u672A\u77E5\u8282\u70B9";
}
function tt(e = 0) {
  if (!e) return "-";
  const t = new Date(e);
  return Number.isNaN(t.getTime()) ? "-" : t.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}
function at(e) {
  return [e.mode ? oe(e.mode) : "", e.status || "", e.result || "", e.waitingSeconds ? `\u7B49\u5F85${e.waitingSeconds}s` : "", e.costMs ? `\u8017\u65F6${e.costMs}ms` : "", e.latencyMs ? `\u95F4\u9694${e.latencyMs}ms` : "", e.queueLength ? `\u961F\u5217${e.queueLength}` : "", e.network ? `\u7F51\u7EDC:${e.network}` : "", e.seq ? `seq:${e.seq}` : "", e.message || "", e.source || ""].filter(Boolean).join(" \xB7 ");
}
function isObserverActionable(e = {}) {
  const t = e.stage || "";
  return t === "settlement_retry" || t === "match_watch_failed" || t === "client_realtime_retry_failed" || t === "realtime_tick_slow" || t === "realtime_tick_skipped" || t === "realtime_broadcast_slow";
}
function getObserverActionCount(e = {}) {
  return Number(e.settlement_retry || 0) + Number(e.match_watch_failed || 0) + Number(e.client_realtime_retry_failed || 0) + Number(e.realtime_tick_slow || 0) + Number(e.realtime_tick_skipped || 0) + Number(e.realtime_broadcast_slow || 0);
}
function getObserverWatchCount(e = {}) {
  return Number(e.client_match_poll_failed || 0) + Number(e.client_realtime_connect_slow || 0);
}
function nt(e) {
  const t = e?.counters || {}, a = e?.recentEvents || [], n = [["\u8FDB\u5165\u961F\u5217", t.match_queue_join || 0, "\u4ECA\u65E5\u5339\u914D\u8BF7\u6C42"], ["\u7528\u6237\u70B9\u5339\u914D", t.client_match_start || 0, "\u524D\u7AEF\u53D1\u8D77\u6B21\u6570"], ["\u521B\u5EFA\u623F\u95F4", (t.match_room_created || 0) + (t.match_status_room_created || 0), "\u771F\u4EBA/\u8F6E\u8BE2\u6210\u623F"], ["\u63A8\u9001\u63A5\u5165", t.match_watch_join || 0, "\u670D\u52A1\u7AEF\u5339\u914DWS"], ["\u7528\u6237\u8FDB\u623F", t.client_match_enter_room || 0, "\u5339\u914D\u6210\u529F\u5230\u8FDB\u623F"], ["WS\u8FDB\u623F", t.realtime_join || 0, "\u8FDB\u5165\u5B9E\u65F6\u623F\u95F4"], ["\u6536\u5230\u9996\u5305", t.client_realtime_first_state || 0, "\u7528\u6237\u7AEF\u9996\u4E2A\u623F\u95F4\u5305"], ["\u6B63\u5F0F\u5F00\u5C40", t.realtime_started || 0, "\u53CC\u65B9\u51C6\u5907\u5B8C\u6210"], ["\u64CD\u4F5C\u62E6\u622A", t.realtime_swap_error || 0, "\u9650\u9891/\u623F\u95F4\u8FC7\u671F"], ["\u7528\u6237\u5F31\u7F51", t.client_realtime_slow || 0, "\u5BA2\u6237\u7AEF\u7F51\u7EDC\u89C2\u5BDF"], ["Tick\u6162", t.realtime_tick_slow || 0, "\u670D\u52A1\u7AEF\u5FAA\u73AF\u8017\u65F6\u9AD8"], ["\u5E7F\u64AD\u6162", t.realtime_broadcast_slow || 0, "\u623F\u95F4\u72B6\u6001\u4E0B\u53D1\u6162"], ["\u7ED3\u7B97\u5B8C\u6210", t.settlement_done || 0, "\u5B9E\u65F6\u7ED3\u7B97\u95ED\u73AF"]], s = getObserverActionCount(t), r = getObserverWatchCount(t);
  return `
    <section class="panel overview-block battle-observer-panel">
      <div class="section-head">
        <div>
          <p class="tag">Realtime Trace</p>
          <h2>\u5BF9\u5C40\u94FE\u8DEF\u89C2\u6D4B</h2>
        </div>
        <span class="pill ${s ? "warning" : "ok"}">${s ? `${s} \u4E2A\u9700\u5904\u7406` : r ? `${r} \u6761\u89C2\u5BDF` : "\u94FE\u8DEF\u6B63\u5E38"}</span>
      </div>
      <div class="observer-stats">
        ${n.map(([r, o, m]) => f(String(r), o, String(m))).join("")}
      </div>
      <div class="observer-events">
        ${a.length ? a.slice(0, 8).map((r) => {
    const o = r.roomNo ? r.roomNo.replace(/^room_/, "").slice(-8).toUpperCase() : "", m = at(r);
    return `
                  <article class="observer-event ${isObserverActionable(r) ? "warning" : ""}">
                    <b>${i(et(r.stage))}</b>
                    <span>${i(tt(r.at))}${o ? ` \xB7 \u623F\u95F4 ${i(o)}` : ""}</span>
                    <small>${i(m || r.source || "-")}</small>
                  </article>
                `;
  }).join("") : '<article class="observer-event empty"><b>\u6682\u65E0\u4E8B\u4EF6</b><span>\u7B49\u5F85\u4E0B\u4E00\u573A\u5BF9\u5C40\u5199\u5165\u94FE\u8DEF\u8BB0\u5F55</span><small>-</small></article>'}
      </div>
    </section>
  `;
}
function st() {
  Re(`
    <section class="panel">
      <p class="tag">Blitz of Pi Admin</p>
      <h2>\u6B63\u5728\u52A0\u8F7D\u540E\u53F0...</h2>
    </section>
  `);
}
let Q = null;
function F() {
  Q && Ne(...Q);
}
function ae(e = "") {
  le.innerHTML = `
    <main class="login-page">
      <section class="login-card">
        <div class="login-brand-mark" aria-hidden="true">${BRAND_LOGO_HTML}</div>
        <p class="tag">Blitz of Pi Admin</p>
        <h1>Pi\u95EA\u7535\u6218\u540E\u53F0</h1>
        <form id="login-form" class="form">
          <label>
            <span>\u8D26\u53F7</span>
            <input name="username" value="admin" autocomplete="username" />
          </label>
          <label>
            <span>\u5BC6\u7801</span>
            <input name="password" type="password" autocomplete="current-password" />
          </label>
          <button type="submit">\u767B\u5F55\u540E\u53F0</button>
          <p id="login-status" class="status">${i(e)}</p>
        </form>
      </section>
    </main>
  `, document.querySelector("#login-form")?.addEventListener("submit", async (t) => {
    t.preventDefault();
    const a = new FormData(t.currentTarget), n = document.querySelector("#login-status");
    n && (n.textContent = "\u767B\u5F55\u4E2D...");
    try {
      const s = await d("/admin-api/auth/login", { method: "POST", body: JSON.stringify({ username: String(a.get("username") || ""), password: String(a.get("password") || "") }) });
      localStorage.setItem("blitz_admin_token", s.accessToken), await q();
    } catch (s) {
      n && (n.textContent = g(s));
    }
  });
}
function Ne(e, t, a, n, s, r, o, m, R, y, x, j, A, B, w, L, T, C, M, U) {
  const homeConfig = { projectName: "Pi闪电战", englishName: "Blitz of Pi", localizedContent: {}, banners: [], ...(t || {}) };
  Q = [e, homeConfig, a, n, s, r, o, m, R, y, x, j, A, B, w, L, T, C, M, U];
  const J = Array.isArray(homeConfig.banners) && homeConfig.banners.length ? homeConfig.banners[0] : {};
  Re(`
    ${it({ admin: e, config: homeConfig, piConfig: a, gameConfig: n, dashboard: s, rooms: r, paymentOrders: o, users: m, ledgers: y, battleRooms: x, withdrawOrders: j, reconciliation: A, riskAudit: B, auditLogs: w, rankStarRecords: L, rankChestRecords: T, rankLeaderboard: C, rankWeeklySettlements: M, growthOps: U, banner: J })}
  `), Ut(homeConfig, J, n), jt(), It(), Ft(), Dt();
}
function it({ admin: e, config: t, piConfig: a, gameConfig: n, dashboard: s, rooms: r, paymentOrders: o, users: m, ledgers: R, battleRooms: y, withdrawOrders: x, reconciliation: j, riskAudit: A, auditLogs: B, rankStarRecords: w, rankChestRecords: L, rankLeaderboard: T, rankWeeklySettlements: C, growthOps: M, banner: U }) {
  if (_ === "overview") return `
      <section class="overview-hero">
        <div>
          <p class="tag">Blitz of Pi Admin</p>
          <h2>\u8FD0\u8425\u9A7E\u9A76\u8231</h2>
          <p class="meta">\u8D26\u53F7\uFF1A${i(e.username)} \xB7 \u89D2\u8272\uFF1A${i(e.roleName)} \xB7 \u5F53\u524D\u7BA1\u7406\u5458\uFF1A${i(e.nickname)}</p>
        </div>
        <div class="overview-health">
          <strong>${s.todayActiveRate}%</strong>
          <span>\u4ECA\u65E5\u6D3B\u8DC3\u7387</span>
        </div>
      </section>
      <section class="overview-metrics">
        ${S("\u603B\u7528\u6237", s.totalUsers, "\u7D2F\u8BA1\u6388\u6743\u8FDB\u5165\u5E73\u53F0\u7684\u7528\u6237", "primary")}
        ${S("\u4ECA\u65E5\u65B0\u589E", s.todayNewUsers, "\u4ECA\u5929\u65B0\u6CE8\u518C/\u9996\u6B21\u8FDB\u5165", "")}
        ${S("\u4ECA\u65E5\u6D3B\u8DC3", s.todayActiveUsers, `\u6D3B\u8DC3\u7387 ${s.todayActiveRate}%`, "")}
        ${S("\u5B9E\u65F6\u5728\u7EBF", s.onlineUsers, `${s.realtimeConnections ?? 0} \u6761\u8FDE\u63A5 / ${s.realtimeInstances ?? 0} \u5B9E\u4F8B`, "live")}
        ${S("\u5339\u914D\u4E2D", s.matchingUsers, "\u6B63\u5728\u6392\u961F\u7B49\u5F85\u5BF9\u624B", "")}
        ${S("\u5BF9\u5C40\u4E2D", s.roomsInBattle, "\u5B9E\u65F6\u8FDB\u884C\u4E2D\u7684\u623F\u95F4", "")}
      </section>
      <section class="overview-columns">
        <section class="panel overview-block">
          <div class="section-head">
            <div>
              <p class="tag">Revenue</p>
              <h2>\u8D44\u91D1\u4E0E\u6536\u5165</h2>
            </div>
            <span class="pill">\u5206\u8D44\u4EA7\u7EDF\u8BA1</span>
          </div>
          <div class="asset-revenue-box">
            <div>
              <span>\u4ECA\u65E5\u5BF9\u6218\u6536\u76CA</span>
              ${renderAssetLines(s.todayBattleRevenueAssets)}
            </div>
            <div>
              <span>\u7D2F\u8BA1\u5BF9\u6218\u6536\u76CA</span>
              ${renderAssetLines(s.totalBattleRevenueAssets)}
            </div>
            <div>
              <span>\u7D2F\u8BA1\u5BF9\u6218\u5956\u52B1</span>
              ${renderRewardAssetLines(s.totalBattleRewardAssets)}
            </div>
          </div>
          <div class="mini-grid">
            ${f("Pi\u7D2F\u8BA1\u5145\u503C", `${$(s.totalRechargePi)} Pi`, `${s.completedPaymentCount} \u7B14\u6210\u529F\u652F\u4ED8`)}
            ${f("Pi\u7D2F\u8BA1\u63D0\u73B0", `${$(s.totalWithdrawPi)} Pi`, `${s.todayWithdrawCount} \u7B14\u4ECA\u65E5\u7533\u8BF7`)}
            ${f("Pi\u94B1\u5305\u6C60", `${$(s.walletAvailablePi)} Pi`, `\u51BB\u7ED3 ${$(s.walletLockedPi)} Pi`)}
            ${f("Pi\u94B1\u5305\u5956\u52B1", `${$(s.totalRewardPi)} Pi`, "\u4EC5\u9879\u76EE\u5185Pi\u94B1\u5305")}
          </div>
        </section>
        <section class="panel overview-block">
          <div class="section-head">
            <div>
              <p class="tag">Battle</p>
              <h2>\u5BF9\u5C40\u8FD0\u8425</h2>
            </div>
            <span class="pill">\u4ED8\u8D39\u5360\u6BD4 ${s.todayPaidBattleRate}%</span>
          </div>
          <div class="mini-grid">
            ${f("\u4ECA\u65E5\u603B\u5BF9\u5C40", s.todayBattleCount, `${s.todayFinishedBattleCount} \u5C40\u5DF2\u5B8C\u6210`)}
            ${f("\u4ECA\u65E5\u4ED8\u8D39\u573A", s.todayPaidBattleCount, "\u5C0F\u5BCC\u8C6A\u573A + \u5927\u5BCC\u8C6A\u573A")}
            ${f("\u6392\u961F/\u5BF9\u5C40\u4E2D", `${s.matchingUsers}/${s.roomsInBattle}`, "\u5339\u914D\u6C60\u4E0E\u8FDB\u884C\u4E2D\u623F\u95F4")}
            ${f("\u5B9E\u65F6\u8FDE\u63A5", s.realtimeConnections ?? s.onlineUsers, `${s.onlineUsers} \u7528\u6237 / ${s.realtimeInstances ?? 0} \u5B9E\u4F8B`)}
            ${f("\u6700\u8FD1Tick", `${s.realtimeLastRoomTickCostMs ?? 0}ms`, `\u6162Tick ${s.realtimeTickSlowCount ?? 0} \u6B21`)}
            ${f("\u6700\u8FD1\u5E7F\u64AD", `${s.realtimeLastBroadcastCostMs ?? 0}ms`, `\u6162\u5E7F\u64AD ${s.realtimeBroadcastSlowCount ?? 0} \u6B21`)}
          </div>
        </section>
      </section>
      ${nt(s.battleObserver)}
      <section class="overview-metrics compact-dashboard">
        ${S("\u8D44\u6599\u5B8C\u6210", s.profileCompletedUsers, "\u5DF2\u8BBE\u7F6E\u6635\u79F0\u548C\u5934\u50CF", "")}
        ${S("\u5C01\u7981\u7528\u6237", s.bannedUsers, "\u9700\u8981\u6301\u7EED\u89C2\u5BDF\u5F02\u5E38\u884C\u4E3A", s.bannedUsers ? "danger" : "")}
        ${S("\u5F85\u5904\u7406\u63D0\u73B0", s.pendingWithdrawCount, "\u5F85\u5BA1\u6838/\u5F85\u6253\u6B3E", s.pendingWithdrawCount ? "warning" : "")}
        ${S("\u672A\u95ED\u73AF\u652F\u4ED8", s.pendingPaymentCount, "\u5DF2\u521B\u5EFA/\u5F85\u5904\u7406/\u5DF2\u901A\u8FC7", s.pendingPaymentCount ? "warning" : "")}
      </section>
    `;
  if (_ === "security") return `
      <section class="panel">
        <h2>\u8D26\u53F7\u5B89\u5168</h2>
        <form id="password-form" class="form">
          <label><span>\u5F53\u524D\u5BC6\u7801</span><input name="oldPassword" type="password" autocomplete="current-password" /></label>
          <label><span>\u65B0\u5BC6\u7801</span><input name="newPassword" type="password" autocomplete="new-password" /></label>
          <label><span>\u786E\u8BA4\u65B0\u5BC6\u7801</span><input name="confirmPassword" type="password" autocomplete="new-password" /></label>
          <button type="submit">\u4FEE\u6539\u5BC6\u7801</button>
          <p id="password-status" class="status"></p>
        </form>
      </section>
    `;
  if (_ === "config") return `
      <section class="panel">
        <h2>Pi\u8FD0\u884C\u73AF\u5883</h2>
        <form id="pi-config-form" class="form">
          <label>
            <span>\u5F53\u524D\u6A21\u5F0F</span>
            <select name="runtimeMode">
              <option value="sandbox" ${a.runtimeMode === "sandbox" ? "selected" : ""}>\u6C99\u76D2\u8C03\u8BD5</option>
              <option value="production" ${a.runtimeMode === "production" ? "selected" : ""}>\u6B63\u5F0F\u4E3B\u7F51</option>
            </select>
          </label>
          <label><span>\u6C99\u76D2\u5730\u5740</span><input name="sandboxUrl" value="${E(a.sandboxUrl)}" /></label>
          <label><span>\u6B63\u5F0F\u5730\u5740</span><input name="productionUrl" value="${E(a.productionUrl)}" /></label>
          <p class="meta">App Slug\uFF1A${i(a.appSlug || "blitz-of-pi")} \xB7 \u524D\u7AEFSDK\uFF1A${a.frontendSandbox ? "\u6C99\u76D2" : "\u4E3B\u7F51"} \xB7 \u540E\u7AEF\uFF1A${a.sandbox ? "\u6C99\u76D2" : "\u4E3B\u7F51"} \xB7 API Key\uFF1A${a.hasApiKey ? "\u5DF2\u914D\u7F6E" : "\u672A\u914D\u7F6E"}</p>
          <button type="submit">\u4FDD\u5B58Pi\u73AF\u5883</button>
          <p id="pi-status" class="status"></p>
        </form>
      </section>
      <section class="panel">
        <h2>\u6E38\u620F\u8FD0\u8425\u914D\u7F6E</h2>
        <form id="game-config-form" class="form">
          <label>
            <span>\u5FEB\u901F\u573A\u5F00\u5173</span>
            <select name="quickEnabled">
              <option value="true" ${n.quickBattle.enabled ? "selected" : ""}>\u5F00\u542F</option>
              <option value="false" ${n.quickBattle.enabled ? "" : "selected"}>\u5173\u95ED</option>
            </select>
          </label>
          <label><span>\u5FEB\u901F\u5F00\u6218\u8D39\u7528</span><input name="quickEntryFee" type="number" inputmode="decimal" min="0" step="0.01" value="0" disabled /></label>
          <p class="meta">\u5FEB\u901F\u5F00\u6218\u56FA\u5B9A\u514D\u8D39\uFF0C\u4E3B\u8981\u7528\u4E8E\u65B0\u7528\u6237\u7EC3\u624B\u548C\u63D0\u5347\u6D3B\u8DC3\u3002</p>
          <label>
            <span>\u5FEB\u901F\u573A\u673A\u5668\u4EBA\u5339\u914D</span>
            <select name="quickBotMatchEnabled">
              <option value="true" ${n.quickBattle.botMatchEnabled !== false ? "selected" : ""}>\u5141\u8BB8</option>
              <option value="false" ${n.quickBattle.botMatchEnabled === false ? "selected" : ""}>\u4E0D\u5141\u8BB8</option>
            </select>
          </label>
          <label>
            <span>\u5FEB\u901F\u573A\u673A\u5668\u4EBA\u5C40\u5956\u52B1</span>
            <select name="quickBotRewardsEnabled">
              <option value="false" ${n.quickBattle.botRewardsEnabled ? "" : "selected"}>\u4E0D\u53D1\u5956\u52B1</option>
              <option value="true" ${n.quickBattle.botRewardsEnabled ? "selected" : ""}>\u5141\u8BB8\u53D1\u5956\u52B1</option>
            </select>
          </label>
          <hr />
          <label>
            <span>HashPi\u8D44\u4EA7\u7F51\u5173</span>
            <select name="assetGatewayEnabled">
              <option value="false" ${n.assetGateway?.enabled ? "" : "selected"}>\u5173\u95ED\u8D44\u4EA7\u540C\u6B65</option>
              <option value="true" ${n.assetGateway?.enabled ? "selected" : ""}>\u5F00\u542F\u8D44\u4EA7\u540C\u6B65</option>
            </select>
          </label>
          <label><span>\u79EF\u5206\u6743\u9650</span><select name="assetGatewayPointsEnabled"><option value="false" ${n.assetGateway?.pointsEnabled ? "" : "selected"}>\u5173\u95ED</option><option value="true" ${n.assetGateway?.pointsEnabled ? "selected" : ""}>\u5F00\u542F</option></select></label>
          <label><span>POC\u6743\u9650</span><select name="assetGatewayPocEnabled"><option value="false" ${n.assetGateway?.pocEnabled ? "" : "selected"}>\u5173\u95ED</option><option value="true" ${n.assetGateway?.pocEnabled ? "selected" : ""}>\u5F00\u542F</option></select></label>
          <label><span>\u7070\u5EA6 Pi UID</span><textarea name="assetGatewayGrayUids" rows="2" placeholder="\u7559\u7A7A\u8868\u793A\u5168\u91CF\uFF0C\u591A\u4E2A\u6362\u884C">${(n.assetGateway?.grayUserPiUids || []).join(`
`)}</textarea></label>
          <label><span>\u7070\u5EA6 Pi username</span><textarea name="assetGatewayGrayUsernames" rows="2" placeholder="\u53EF\u9009\uFF0C\u4EC5\u8F85\u52A9\u5339\u914D">${(n.assetGateway?.grayUserPiUsernames || []).join(`
`)}</textarea></label>
          <p class="meta">\u5F00\u542F\u8D44\u4EA7\u540C\u6B65\u540E\uFF0C\u524D\u53F0\u624D\u4F1A\u663E\u793A\u79EF\u5206/POC\u5E76\u5141\u8BB8\u5165\u573A\u3002\u7070\u5EA6\u540D\u5355\u7559\u7A7A\u8868\u793A\u5168\u91CF\u5F00\u653E\uFF0C\u586B\u5199 UID/username \u8868\u793A\u53EA\u7ED9\u540D\u5355\u7528\u6237\u5F00\u653E\u3002\u79EF\u5206/POC\u9ED8\u8BA4\u53EA\u771F\u4EBA\u5339\u914D\uFF1B\u79EF\u5206\u95E8\u7968\u5FC5\u987B\u662F\u6574\u6570\uFF0C\u4E0D\u80FD\u586B\u5C0F\u6570\u3002</p>
          <hr />
          <label>
            <span>\u5C0F\u5BCC\u8C6A\uFF08\u79EF\u5206\uFF09\u5F00\u5173</span>
            <select name="pointsEnabled">
              <option value="true" ${n.pointsBattle?.enabled ? "selected" : ""}>\u5F00\u542F</option>
              <option value="false" ${n.pointsBattle?.enabled ? "" : "selected"}>\u5173\u95ED</option>
            </select>
          </label>
          <label><span>\u5C0F\u5BCC\u8C6A\u95E8\u7968\uFF08POINTS\uFF09</span><input name="pointsEntryFee" type="number" inputmode="numeric" min="0" step="1" value="${n.pointsBattle?.entryFee ?? 100}" /></label>
          <label><span>\u5C0F\u5BCC\u8C6A\u5E73\u53F0\u62BD\u6210</span><input name="pointsPlatformFeeRate" type="number" inputmode="decimal" min="0" max="0.5" step="0.01" value="${n.pointsBattle?.platformFeeRate ?? 0.3}" /></label>
          <label><span>\u5C0F\u5BCC\u8C6A\u80DC\u8005\u5956\u52B1</span><input name="pointsRewardRate" type="number" inputmode="decimal" min="0" max="1" step="0.01" value="${n.pointsBattle?.rewardRate ?? 0.7}" /></label>
          <hr />
          <label><span>\u5927\u5BCC\u8C6A\uFF08POC\uFF09\u5F00\u5173</span><select name="pocEnabled"><option value="true" ${n.pocBattle?.enabled ? "selected" : ""}>\u5F00\u542F</option><option value="false" ${n.pocBattle?.enabled ? "" : "selected"}>\u5173\u95ED</option></select></label>
          <label><span>\u5927\u5BCC\u8C6A\u95E8\u7968\uFF08POC\uFF09</span><input name="pocEntryFee" type="number" inputmode="decimal" min="0" step="0.000001" value="${n.pocBattle?.entryFee ?? 1}" /></label>
          <label><span>\u5927\u5BCC\u8C6A\u5E73\u53F0\u62BD\u6210</span><input name="pocPlatformFeeRate" type="number" inputmode="decimal" min="0" max="0.5" step="0.01" value="${n.pocBattle?.platformFeeRate ?? 0.3}" /></label>
          <label><span>\u5927\u5BCC\u8C6A\u80DC\u8005\u5956\u52B1</span><input name="pocRewardRate" type="number" inputmode="decimal" min="0" max="1" step="0.01" value="${n.pocBattle?.rewardRate ?? 0.7}" /></label>
          <hr />
          <label><span>\u8D85\u7EA7\u5BCC\u8C6A\uFF08Pi\uFF09\u5F00\u5173</span><select name="piBattleEnabled"><option value="true" ${n.piBattle?.enabled !== false ? "selected" : ""}>\u5F00\u542F</option><option value="false" ${n.piBattle?.enabled === false ? "selected" : ""}>\u5173\u95ED</option></select></label>
          <label><span>\u8D85\u7EA7\u5BCC\u8C6A\u95E8\u7968\uFF08Pi\uFF09</span><input name="piBattleEntryFee" type="number" inputmode="decimal" min="0" step="0.01" value="${n.piBattle?.entryFee ?? 1}" /></label>
          <label><span>\u8D85\u7EA7\u5BCC\u8C6A\u5E73\u53F0\u62BD\u6210</span><input name="piBattlePlatformFeeRate" type="number" inputmode="decimal" min="0" max="0.5" step="0.01" value="${n.piBattle?.platformFeeRate ?? 0.3}" /></label>
          <label><span>\u8D85\u7EA7\u5BCC\u8C6A\u80DC\u8005\u5956\u52B1</span><input name="piBattleRewardRate" type="number" inputmode="decimal" min="0" max="1" step="0.01" value="${n.piBattle?.rewardRate ?? 0.7}" /></label>
          <hr />
          <h3 class="sub-panel-title">\u5173\u952E\u65F6\u95F4\u914D\u7F6E</h3>
          <label><span>\u673A\u5668\u4EBA\u8865\u4F4D\u79D2\u6570</span><input name="quickBotFallbackSeconds" type="number" inputmode="decimal" min="5" max="120" step="1" value="${n.timing?.quickBotFallbackSeconds ?? 30}" /></label>
          <label><span>\u5141\u8BB8\u53D6\u6D88\u7B49\u5F85\u79D2\u6570</span><input name="matchCancelWaitSeconds" type="number" inputmode="decimal" min="0" max="60" step="1" value="${n.timing?.matchCancelWaitSeconds ?? 20}" /></label>
          <label><span>\u53D6\u6D88\u51B7\u5374\u79D2\u6570</span><input name="matchCancelCooldownSeconds" type="number" inputmode="decimal" min="0" max="60" step="1" value="${n.timing?.matchCancelCooldownSeconds ?? 10}" /></label>
          <label><span>\u5BF9\u5C40\u786E\u8BA4\u79D2\u6570</span><input name="waitingReadyTimeoutSeconds" type="number" inputmode="decimal" min="10" max="120" step="1" value="${n.timing?.waitingReadyTimeoutSeconds ?? 30}" /></label>
          <label><span>VS\u5C55\u793A\u79D2\u6570</span><input name="vsIntroSeconds" type="number" inputmode="decimal" min="0" max="10" step="1" value="${n.timing?.vsIntroSeconds ?? 5}" /></label>
          <label><span>\u5F00\u5C40\u5012\u8BA1\u65F6\u79D2\u6570</span><input name="readyCountdownSeconds" type="number" inputmode="decimal" min="0" max="15" step="1" value="${n.timing?.readyCountdownSeconds ?? 6}" /></label>
          <label><span>\u5FEB\u901F\u573A\u5C40\u5185\u79D2\u6570</span><input name="quickRoundSeconds" type="number" inputmode="decimal" min="30" max="180" step="1" value="${n.timing?.quickRoundSeconds ?? 75}" /></label>
          <label><span>\u4ED8\u8D39\u573A\u5C40\u5185\u79D2\u6570</span><input name="paidRoundSeconds" type="number" inputmode="decimal" min="30" max="300" step="1" value="${n.timing?.paidRoundSeconds ?? 90}" /></label>
          <label><span>\u673A\u5668\u4EBA\u51FA\u624B\u95F4\u9694\u79D2</span><input name="botMoveIntervalSeconds" type="number" inputmode="decimal" min="1" max="10" step="0.1" value="${n.timing?.botMoveIntervalSeconds ?? 2.6}" /></label>
          <hr />
          <h3 class="sub-panel-title">\u627F\u8F7D\u4FDD\u62A4</h3>
          <label><span>\u6700\u5927\u540C\u65F6\u623F\u95F4</span><input name="maxActiveRooms" type="number" inputmode="decimal" min="0" max="5000" step="1" value="${n.capacity?.maxActiveRooms ?? 500}" /></label>
          <label><span>\u5355\u6A21\u5F0F\u6392\u961F\u4E0A\u9650</span><input name="maxQueueLengthPerMode" type="number" inputmode="decimal" min="100" max="20000" step="1" value="${n.capacity?.maxQueueLengthPerMode ?? 2e3}" /></label>
          <p class="meta">\u8FBE\u5230\u623F\u95F4\u4E0A\u9650\u540E\u7EE7\u7EED\u6392\u961F\uFF1B\u586B 0 \u8868\u793A\u4E0D\u9650\u5236\u540C\u65F6\u623F\u95F4\u3002</p>
          <h3 class="sub-panel-title">\u5B9E\u65F6\u8FDE\u63A5\u4FDD\u62A4</h3>
          <label><span>\u5355\u5B9E\u4F8B\u6700\u5927\u8FDE\u63A5</span><input name="realtimeMaxConnectionsPerInstance" type="number" inputmode="decimal" min="100" max="20000" step="50" value="${n.capacity?.realtimeMaxConnectionsPerInstance ?? 1200}" /></label>
          <label><span>\u5355\u7528\u6237\u6700\u5927\u8FDE\u63A5</span><input name="realtimeMaxConnectionsPerUser" type="number" inputmode="decimal" min="1" max="10" step="1" value="${n.capacity?.realtimeMaxConnectionsPerUser ?? 2}" /></label>
          <label><span>\u8FDE\u63A5\u5FC3\u8DF3\u79D2\u6570</span><input name="realtimeHeartbeatSeconds" type="number" inputmode="decimal" min="10" max="60" step="1" value="${n.capacity?.realtimeHeartbeatSeconds ?? 25}" /></label>
          <label><span>\u7A7A\u95F2\u65AD\u5F00\u79D2\u6570</span><input name="realtimeIdleTimeoutSeconds" type="number" inputmode="decimal" min="30" max="300" step="1" value="${n.capacity?.realtimeIdleTimeoutSeconds ?? 90}" /></label>
          <label><span>\u5355\u6761\u6D88\u606F\u4E0A\u9650</span><input name="realtimeMaxPayloadBytes" type="number" inputmode="decimal" min="512" max="16384" step="512" value="${n.capacity?.realtimeMaxPayloadBytes ?? 2048}" /></label>
          <p class="meta">\u5EFA\u8BAE\uFF1A\u5E73\u65F6\u4FDD\u6301\u9ED8\u8BA4\u3002\u8FDE\u63A5\u6570\u4E0D\u662F\u8D8A\u9AD8\u8D8A\u597D\uFF0C\u8FC7\u9AD8\u4F1A\u8BA9\u5F31\u673A\u548C\u5F31\u7F51\u66F4\u5BB9\u6613\u6296\u52A8\u3002</p>
          <p class="meta">\u65B0\u914D\u7F6E\u53EA\u5F71\u54CD\u65B0\u5339\u914D\u623F\u95F4\uFF1B\u5DF2\u521B\u5EFA\u5BF9\u5C40\u6309\u521B\u5EFA\u65F6\u5FEB\u7167\u6267\u884C\u3002</p>
          <hr />
          <h3 class="sub-panel-title">\u753B\u9762\u4E0E\u6027\u80FD</h3>
          <label>
            <span>\u9ED8\u8BA4\u6548\u679C\u6A21\u5F0F</span>
            <select name="effectDefaultMode">
              <option value="balanced" ${!n.visualEffects?.defaultMode || n.visualEffects?.defaultMode === "balanced" ? "selected" : ""}>\u5747\u8861\u6A21\u5F0F</option>
              <option value="high" ${n.visualEffects?.defaultMode === "high" ? "selected" : ""}>\u70AB\u5F69\u6A21\u5F0F</option>
            </select>
          </label>
          <label>
            <span>Pi Browser\u9ED8\u8BA4\u6A21\u5F0F</span>
            <select name="effectPiBrowserDefaultMode">
              <option value="balanced" ${!n.visualEffects?.piBrowserDefaultMode || n.visualEffects?.piBrowserDefaultMode === "balanced" ? "selected" : ""}>\u5747\u8861\u6A21\u5F0F</option>
              <option value="high" ${n.visualEffects?.piBrowserDefaultMode === "high" ? "selected" : ""}>\u70AB\u5F69\u6A21\u5F0F</option>
            </select>
          </label>
          <label>
            <span>\u5141\u8BB8\u7528\u6237\u81EA\u9009</span>
            <select name="effectAllowUserChoice">
              <option value="true" ${n.visualEffects?.allowUserChoice !== false ? "selected" : ""}>\u5141\u8BB8</option>
              <option value="false" ${n.visualEffects?.allowUserChoice === false ? "selected" : ""}>\u4E0D\u5141\u8BB8</option>
            </select>
          </label>
          <label>
            <span>\u6389\u5E27\u81EA\u52A8\u964D\u7EA7</span>
            <select name="effectAutoDowngradeEnabled">
              <option value="true" ${n.visualEffects?.autoDowngradeEnabled !== false ? "selected" : ""}>\u5F00\u542F</option>
              <option value="false" ${n.visualEffects?.autoDowngradeEnabled === false ? "selected" : ""}>\u5173\u95ED</option>
            </select>
          </label>
          <label>
            <span>\u6ED1\u52A8\u62D6\u5C3E</span>
            <select name="effectDragTrailEnabled">
              <option value="true" ${n.visualEffects?.dragTrailEnabled !== false ? "selected" : ""}>\u5F00\u542F</option>
              <option value="false" ${n.visualEffects?.dragTrailEnabled === false ? "selected" : ""}>\u5173\u95ED</option>
            </select>
          </label>
          <label>
            <span>\u9707\u52A8\u53CD\u9988</span>
            <select name="effectHapticEnabled">
              <option value="true" ${n.visualEffects?.hapticEnabled !== false ? "selected" : ""}>\u5F00\u542F</option>
              <option value="false" ${n.visualEffects?.hapticEnabled === false ? "selected" : ""}>\u5173\u95ED</option>
            </select>
          </label>
          <label>
            <span>\u88AB\u653B\u51FB\u6587\u5B57\u63D0\u793A</span>
            <select name="effectAttackWarningEnabled">
              <option value="true" ${n.visualEffects?.attackWarningEnabled !== false ? "selected" : ""}>\u5F00\u542F</option>
              <option value="false" ${n.visualEffects?.attackWarningEnabled === false ? "selected" : ""}>\u5173\u95ED</option>
            </select>
          </label>
          <label><span>\u88AB\u653B\u51FB\u63D0\u793A\u6587\u6848</span><input name="effectAttackWarningText" maxlength="32" value="${ve(n.visualEffects?.attackWarningText || "\u88AB\u653B\u51FB \u538B\u529B+{attack}")}" /></label>
          <p class="meta">{attack} \u4F1A\u81EA\u52A8\u66FF\u6362\u4E3A\u538B\u529B\u503C\u3002\u5EFA\u8BAE\u6587\u6848\u77ED\u4E00\u70B9\uFF0C\u4E0D\u8981\u6321\u68CB\u76D8\u3002</p>
          <p class="meta">\u5EFA\u8BAE\u9ED8\u8BA4\u5747\u8861\uFF1B\u624B\u673A\u6027\u80FD\u597D\u7684\u7528\u6237\u53EF\u5207\u70AB\u5F69\u3002\u6389\u5E27\u81EA\u52A8\u964D\u7EA7\u53EA\u662F\u515C\u5E95\uFF0C\u4E0D\u4F5C\u4E3A\u7528\u6237\u6A21\u5F0F\u5C55\u793A\u3002</p>
          <div class="avatar-config">
            <strong>\u52A8\u753B\u65F6\u957F\uFF08\u79D2\uFF09</strong>
            <p class="meta">\u8C03\u5C0F\u66F4\u5FEB\uFF0C\u8C03\u5927\u66F4\u660E\u663E\u3002\u5EFA\u8BAE\u4E0D\u8981\u8D85\u8FC7 2 \u79D2\u3002</p>
            <div class="rank-row">
              <label><span>\u672C\u5730\u5927\u63D0\u793A</span><input name="effectLocalBurstSeconds" type="number" inputmode="decimal" min="0.05" max="3" step="0.01" value="${n.visualEffects?.animationDurations?.localBurstSeconds ?? 0.56}" /></label>
              <label><span>\u70AB\u5F69\u672C\u5730\u63D0\u793A</span><input name="effectLocalBurstHighSeconds" type="number" inputmode="decimal" min="0.05" max="3" step="0.01" value="${n.visualEffects?.animationDurations?.localBurstHighSeconds ?? 0.72}" /></label>
              <label><span>\u670D\u52A1\u7AEF\u63D0\u793A</span><input name="effectServerBurstSeconds" type="number" inputmode="decimal" min="0.05" max="3" step="0.01" value="${n.visualEffects?.animationDurations?.serverBurstSeconds ?? 1.52}" /></label>
              <label><span>\u70AB\u5F69\u670D\u52A1\u7AEF\u63D0\u793A</span><input name="effectServerBurstHighSeconds" type="number" inputmode="decimal" min="0.05" max="3" step="0.01" value="${n.visualEffects?.animationDurations?.serverBurstHighSeconds ?? 1.42}" /></label>
            </div>
            <div class="rank-row">
              <label><span>\u4F4E\u6027\u80FD\u63D0\u793A</span><input name="effectLowPerformanceBurstSeconds" type="number" inputmode="decimal" min="0.05" max="3" step="0.01" value="${n.visualEffects?.animationDurations?.lowPerformanceBurstSeconds ?? 1.65}" /></label>
              <label><span>\u670D\u52A1\u7AEF\u6821\u5BF9</span><input name="effectServerSettleSeconds" type="number" inputmode="decimal" min="0.05" max="3" step="0.01" value="${n.visualEffects?.animationDurations?.serverSettleSeconds ?? 0.24}" /></label>
              <label><span>\u5F97\u5206\u95EA\u52A8</span><input name="effectImpactSeconds" type="number" inputmode="decimal" min="0.05" max="3" step="0.01" value="${n.visualEffects?.animationDurations?.impactSeconds ?? 0.72}" /></label>
              <label><span>\u70AB\u5F69\u5F97\u5206\u95EA\u52A8</span><input name="effectImpactHighSeconds" type="number" inputmode="decimal" min="0.05" max="3" step="0.01" value="${n.visualEffects?.animationDurations?.impactHighSeconds ?? 0.92}" /></label>
            </div>
            <div class="rank-row">
              <label><span>\u68CB\u76D8\u53CD\u9988</span><input name="effectBoardEffectSeconds" type="number" inputmode="decimal" min="0.05" max="3" step="0.01" value="${n.visualEffects?.animationDurations?.boardEffectSeconds ?? 0.32}" /></label>
              <label><span>\u70AB\u5F69\u68CB\u76D8</span><input name="effectBoardEffectHighSeconds" type="number" inputmode="decimal" min="0.05" max="3" step="0.01" value="${n.visualEffects?.animationDurations?.boardEffectHighSeconds ?? 0.42}" /></label>
              <label><span>\u65B9\u5757\u7206\u5F00</span><input name="effectTileBurstSeconds" type="number" inputmode="decimal" min="0.05" max="3" step="0.01" value="${n.visualEffects?.animationDurations?.tileBurstSeconds ?? 0.34}" /></label>
              <label><span>\u70AB\u5F69\u65B9\u5757\u7206\u5F00</span><input name="effectTileBurstHighSeconds" type="number" inputmode="decimal" min="0.05" max="3" step="0.01" value="${n.visualEffects?.animationDurations?.tileBurstHighSeconds ?? 0.46}" /></label>
            </div>
            <div class="rank-row">
              <label><span>\u65B9\u5757\u4E0B\u843D</span><input name="effectTileFallSeconds" type="number" inputmode="decimal" min="0.05" max="3" step="0.01" value="${n.visualEffects?.animationDurations?.tileFallSeconds ?? 0.3}" /></label>
              <label><span>\u70AB\u5F69\u65B9\u5757\u4E0B\u843D</span><input name="effectTileFallHighSeconds" type="number" inputmode="decimal" min="0.05" max="3" step="0.01" value="${n.visualEffects?.animationDurations?.tileFallHighSeconds ?? 0.38}" /></label>
              <label><span>\u538B\u529B\u95EA\u52A8</span><input name="effectPressureHitSeconds" type="number" inputmode="decimal" min="0.05" max="3" step="0.01" value="${n.visualEffects?.animationDurations?.pressureHitSeconds ?? 0.72}" /></label>
              <label><span>\u53D7\u51FB\u68CB\u76D8</span><input name="effectBoardUnderAttackSeconds" type="number" inputmode="decimal" min="0.05" max="3" step="0.01" value="${n.visualEffects?.animationDurations?.boardUnderAttackSeconds ?? 0.58}" /></label>
            </div>
            <div class="rank-row">
              <label><span>\u6ED1\u52A8\u53CD\u9988</span><input name="effectLocalSwapSeconds" type="number" inputmode="decimal" min="0.05" max="3" step="0.01" value="${n.visualEffects?.animationDurations?.localSwapSeconds ?? 0.18}" /></label>
              <label><span>\u65E0\u6548\u4EA4\u6362</span><input name="effectInvalidSwapSeconds" type="number" inputmode="decimal" min="0.05" max="3" step="0.01" value="${n.visualEffects?.animationDurations?.invalidSwapSeconds ?? 0.26}" /></label>
              <label><span>\u653B\u51FB\u7EBF</span><input name="effectAttackLineSeconds" type="number" inputmode="decimal" min="0.05" max="3" step="0.01" value="${n.visualEffects?.animationDurations?.attackLineSeconds ?? 0.78}" /></label>
              <label><span>\u88AB\u653B\u51FB\u8B66\u793A</span><input name="effectHitWarningSeconds" type="number" inputmode="decimal" min="0.05" max="3" step="0.01" value="${n.visualEffects?.animationDurations?.hitWarningSeconds ?? 0.62}" /></label>
            </div>
          </div>
          <button type="submit">\u4FDD\u5B58\u6E38\u620F\u914D\u7F6E</button>
          <p id="game-status" class="status"></p>
        </form>
      </section>
      <section class="panel">
        <h2>\u5145\u503C\u8D60\u9001\u914D\u7F6E</h2>
        <form id="recharge-bonus-form" class="form">
          <label>
            <span>\u5145\u503C\u8D60\u9001</span>
            <select name="rechargeBonusEnabled">
              <option value="false" ${n.rechargeBonus?.enabled ? "" : "selected"}>\u5173\u95ED</option>
              <option value="true" ${n.rechargeBonus?.enabled ? "selected" : ""}>\u5F00\u542F</option>
            </select>
          </label>
          <label><span>\u901A\u7528\u8D60\u9001\u6BD4\u4F8B</span><input name="rechargeBonusRate" type="number" inputmode="decimal" min="0" max="0.2" step="0.001" value="${n.rechargeBonus?.bonusRate ?? 0}" /></label>
          <label><span>\u5355\u7B14\u8D60\u9001\u4E0A\u9650 Pi</span><input name="rechargeMaxBonusAmount" type="number" inputmode="decimal" min="0" step="0.01" value="${n.rechargeBonus?.maxBonusAmount ?? 0}" /></label>
          <div class="avatar-config">
            <strong>\u5145\u503C\u6863\u4F4D</strong>
            <p class="meta">\u7528\u6237\u7AEF\u4F1A\u663E\u793A\u5F00\u542F\u7684\u6863\u4F4D\u3002\u6863\u4F4D\u8D60\u9001\u91D1\u989D\u4F18\u5148\u4E8E\u901A\u7528\u6BD4\u4F8B\uFF1B\u8D60\u9001\u4F59\u989D\u53EF\u6B63\u5E38\u7528\u4E8E\u5BF9\u6218\u548C\u63D0\u73B0\u3002</p>
            ${[0, 1, 2, 3].map((k) => {
    const c = n.rechargeBonus?.presets?.[k] || { amount: [1, 3, 10, 30][k], bonusAmount: 0, label: "", enabled: true };
    return `
                  <div class="rank-row">
                    <label><span>\u91D1\u989D Pi</span><input name="rechargePresetAmount${k}" type="number" inputmode="decimal" min="0" step="0.01" value="${c.amount}" /></label>
                    <label><span>\u8D60\u9001 Pi</span><input name="rechargePresetBonus${k}" type="number" inputmode="decimal" min="0" step="0.01" value="${c.bonusAmount}" /></label>
                    <label><span>\u6807\u7B7E</span><input name="rechargePresetLabel${k}" value="${i(c.label || "")}" /></label>
                    <label><span>\u72B6\u6001</span><select name="rechargePresetEnabled${k}">
                      <option value="true" ${c.enabled !== false ? "selected" : ""}>\u663E\u793A</option>
                      <option value="false" ${c.enabled === false ? "selected" : ""}>\u9690\u85CF</option>
                    </select></label>
                  </div>
                `;
  }).join("")}
          </div>
          <button type="submit">\u4FDD\u5B58\u5145\u503C\u8D60\u9001</button>
          <p id="recharge-bonus-status" class="status"></p>
        </form>
      </section>
      <section class="panel">
        <h2>\u63D0\u73B0\u98CE\u63A7\u914D\u7F6E</h2>
        <form id="withdraw-risk-form" class="form">
          <label><span>\u5355\u7B14\u6700\u5C0F\u63D0\u73B0 Pi</span><input name="minAmount" type="number" inputmode="decimal" min="0" step="0.01" value="${n.withdrawRisk?.minAmount ?? 0.1}" /></label>
          <label><span>\u5355\u7528\u6237\u6BCF\u65E5\u63D0\u73B0\u4E0A\u9650 Pi</span><input name="dailyLimitAmount" type="number" inputmode="decimal" min="0" step="0.01" value="${n.withdrawRisk?.dailyLimitAmount ?? 10}" /></label>
          <label><span>\u63D0\u73B0\u624B\u7EED\u8D39\u6BD4\u4F8B</span><input name="feeRate" type="number" inputmode="decimal" min="0" max="0.2" step="0.01" value="${n.withdrawRisk?.feeRate ?? 0}" /></label>
          <label><span>\u5927\u989D\u4EBA\u5DE5\u590D\u6838\u9608\u503C Pi</span><input name="manualReviewAmount" type="number" inputmode="decimal" min="0" step="0.01" value="${n.withdrawRisk?.manualReviewAmount ?? 5}" /></label>
          <p class="meta">\u5F53\u524D\u5DF2\u751F\u6548\uFF1A\u4F4E\u4E8E\u6700\u5C0F\u91D1\u989D\u4E0D\u53EF\u63D0\u4EA4\uFF1B\u8D85\u8FC7\u6BCF\u65E5\u4E0A\u9650\u4E0D\u53EF\u63D0\u4EA4\u3002\u624B\u7EED\u8D39\u4E0E\u5927\u989D\u590D\u6838\u9608\u503C\u5148\u4F5C\u4E3A\u8FD0\u8425\u914D\u7F6E\u8BB0\u5F55\uFF0C\u540E\u7EED\u53EF\u63A5\u5165\u81EA\u52A8\u6263\u8D39/\u98CE\u63A7\u961F\u5217\u3002</p>
          <button type="submit">\u4FDD\u5B58\u63D0\u73B0\u98CE\u63A7</button>
          <p id="withdraw-risk-status" class="status"></p>
        </form>
      </section>
      <section class="panel">
        <h2>\u8FD0\u8425\u6587\u6848\u4E0E\u89C4\u5219</h2>
        <form id="operation-config-form" class="form">
          <label>
            <span>\u7EF4\u62A4\u6A21\u5F0F</span>
            <select name="maintenanceEnabled">
              <option value="false" ${n.operation?.maintenanceEnabled ? "" : "selected"}>\u5173\u95ED</option>
              <option value="true" ${n.operation?.maintenanceEnabled ? "selected" : ""}>\u5F00\u542F</option>
            </select>
          </label>
          <label><span>\u7EF4\u62A4\u516C\u544A</span><textarea name="maintenanceNotice" rows="3">${i(n.operation?.maintenanceNotice || "")}</textarea></label>
          <div class="avatar-config localized-config">
            <strong>\u591A\u8BED\u8A00\u8FD0\u8425\u6587\u6848</strong>
            <p class="meta">\u7528\u6237\u7AEF\u4F1A\u6839\u636E\u8BED\u8A00\u9009\u62E9\u81EA\u52A8\u8BFB\u53D6\uFF1B\u672A\u914D\u7F6E\u65F6\u56DE\u9000\u82F1\u6587\uFF0C\u518D\u56DE\u9000\u4E2D\u6587\u3002\u5EFA\u8BAE\u81F3\u5C11\u7EF4\u62A4\u4E2D\u6587\u3001\u82F1\u6587\u3001\u8D8A\u5357\u8BED\u3002</p>
            ${Je(n)}
          </div>
          <label><span>\u6635\u79F0\u6700\u5C0F\u957F\u5EA6</span><input name="nicknameMinLength" type="number" inputmode="decimal" min="1" max="12" step="1" value="${n.operation?.nicknameMinLength ?? 2}" /></label>
          <label><span>\u6635\u79F0\u6700\u5927\u957F\u5EA6</span><input name="nicknameMaxLength" type="number" inputmode="decimal" min="2" max="20" step="1" value="${n.operation?.nicknameMaxLength ?? 12}" /></label>
          <label><span>\u6635\u79F0\u89C4\u5219\u8BF4\u660E</span><input name="nicknamePattern" value="${i(n.operation?.nicknamePattern || "")}" /></label>
          <label><span>\u6635\u79F0\u7981\u7528\u8BCD\uFF08\u4E00\u884C\u4E00\u4E2A\uFF09</span><textarea name="bannedWords" rows="4">${me(n.operation?.bannedWords)}</textarea></label>
          <label><span>\u5C01\u7981\u539F\u56E0\u9884\u8BBE\uFF08\u4E00\u884C\u4E00\u4E2A\uFF09</span><textarea name="banReasons" rows="5">${me(n.operation?.banReasons)}</textarea></label>
          <div class="avatar-config">
            <strong>\u9884\u8BBE\u5934\u50CF\u7BA1\u7406</strong>
            ${Oe(n)}
          </div>
          <div class="avatar-config tile-theme-config">
            <strong>\u68CB\u76D8\u65B9\u5757\u4E3B\u9898</strong>
            ${We(n)}
          </div>
          <div class="avatar-config rank-config">
            <strong>\u6BB5\u4F4D\u6807\u7B7E\u7BA1\u7406</strong>
            <p class="meta">\u6BB5\u4F4D\u540D\u79F0\u3001\u6807\u5FD7\u548C\u989C\u8272\u4F1A\u5C55\u793A\u5728\u7528\u6237\u7AEF\u201C\u6211\u7684\u201D\u9875\u9762\u73A9\u5BB6\u8D44\u6599\u91CC\u3002</p>
            ${Ke(n)}
          </div>
          <div class="avatar-config rank-config">
            <strong>\u6BB5\u4F4D\u5347\u964D\u7EA7\u89C4\u5219</strong>
            <p class="meta">\u63A7\u5236\u5347\u964D\u661F\u3001\u6BCF\u65E5\u5B9D\u7BB1\u3001\u5468\u699C\u81EA\u52A8\u53D1\u5956\u548C\u5927\u5BCC\u8C6A\u573A\u95E8\u69DB\u3002</p>
            ${Xe(n)}
          </div>
          <button type="submit">\u4FDD\u5B58\u8FD0\u8425\u89C4\u5219</button>
          <p id="operation-status" class="status"></p>
        </form>
      </section>
      <section class="panel">
        <h2>\u9996\u9875\u914D\u7F6E</h2>
        <form id="home-config-form" class="form">
          <label><span>\u4E2D\u6587\u9879\u76EE\u540D</span><input name="projectName" value="${E(t.projectName)}" /></label>
          <label><span>\u82F1\u6587\u9879\u76EE\u540D</span><input name="englishName" value="${E(t.englishName)}" /></label>
          <label><span>\u9996\u9875\u63CF\u8FF0</span><textarea name="bannerDescription" rows="4">${i(U?.description ?? "")}</textarea></label>
          <div class="avatar-config localized-config">
            <strong>\u9996\u9875\u591A\u8BED\u8A00\u914D\u7F6E</strong>
            <p class="meta">\u7528\u6237\u5207\u6362\u8BED\u8A00\u540E\uFF0C\u9996\u9875\u6807\u9898\u548C\u63CF\u8FF0\u4F1A\u8BFB\u53D6\u8FD9\u91CC\u3002\u5EFA\u8BAE\u81F3\u5C11\u7EF4\u62A4\u4E2D\u6587\u3001\u82F1\u6587\u3001\u8D8A\u5357\u8BED\u3002</p>
            ${Qe(t)}
          </div>
          <button type="submit">\u4FDD\u5B58\u9996\u9875\u914D\u7F6E</button>
          <p id="status" class="status"></p>
        </form>
      </section>
    `;
  if (_ === "funds") {
    const filteredPayments = filterPaymentOrders(o), filteredLedgers = filterList(R, LEDGER_LIST_FILTERS, ledgerListFilter), k = N("funds-payments", filteredPayments), c = N("funds-ledgers", filteredLedgers), activePaymentFilter = PAYMENT_STATUS_FILTERS.find((v) => v.key === paymentStatusFilter) || PAYMENT_STATUS_FILTERS[0], activeLedgerFilter = LEDGER_LIST_FILTERS.find((v) => v.key === ledgerListFilter) || LEDGER_LIST_FILTERS[0];
    return `
      <section class="panel">
        <div class="section-head">
          <div>
            <h2>\u8D44\u91D1\u8BA2\u5355</h2>
            <p class="meta">\u6309\u72B6\u6001\u5206\u7C7B\u67E5\u770B\uFF0C\u4F18\u5148\u5904\u7406\u672A\u95ED\u73AF\u8BA2\u5355\u3002</p>
          </div>
          <span class="pill">${i(activePaymentFilter.label)} ${filteredPayments.length} \u7B14</span>
        </div>
        ${renderPaymentStatusFilters(o)}
        <div class="room-list">
          ${k.items.length ? k.items.map(gt).join("") : '<p class="meta">\u5F53\u524D\u6682\u65E0\u652F\u4ED8\u8BA2\u5355</p>'}
        </div>
        ${P("funds-payments", filteredPayments.length)}
      </section>
      <section class="panel">
        <div class="section-head">
          <div>
            <h2>\u8D44\u4EA7\u6D41\u6C34</h2>
            <p class="meta">\u6309\u6536\u652F\u3001\u51BB\u7ED3\u3001\u5BF9\u6218\u3001\u63D0\u73B0\u7B49\u7C7B\u578B\u67E5\u770B\u3002</p>
          </div>
          <span class="pill">${i(activeLedgerFilter.label)} ${filteredLedgers.length} \u6761</span>
        </div>
        ${renderListFilters(R, LEDGER_LIST_FILTERS, ledgerListFilter, "ledgers")}
        <div class="table-list">
          ${c.items.map(Pe).join("") || '<p class="meta">\u6682\u65E0\u6D41\u6C34</p>'}
        </div>
        ${P("funds-ledgers", filteredLedgers.length)}
      </section>
    `;
  }
  if (_ === "withdraw") return pt(n, x);
  if (_ === "growth") return ft(n, M);
  if (_ === "reconciliation") return St(j);
  if (_ === "risk") return Et(A);
  if (_ === "users") {
    const filteredUsers = filterList(m, USER_LIST_FILTERS, userListFilter), activeUserFilter = USER_LIST_FILTERS.find((v) => v.key === userListFilter) || USER_LIST_FILTERS[0];
    return W ? Tt(W) : `
      <section class="panel">
        <div class="section-head">
          <div>
            <h2>\u7528\u6237\u4E0E\u94B1\u5305</h2>
            <p class="meta">\u6309\u8D26\u53F7\u72B6\u6001\u3001\u8D44\u6599\u5B8C\u6210\u5EA6\u548C\u51BB\u7ED3\u4F59\u989D\u5206\u7C7B\u67E5\u770B\u3002</p>
          </div>
          <span class="pill">${i(activeUserFilter.label)} ${filteredUsers.length} \u4EBA</span>
        </div>
        ${renderListFilters(m, USER_LIST_FILTERS, userListFilter, "users")}
        <div class="table-list">
          ${N("users", filteredUsers).items.map(Bt).join("") || '<p class="meta">\u6682\u65E0\u7528\u6237</p>'}
        </div>
        ${P("users", filteredUsers.length)}
      </section>
    `;
  }
  if (_ === "ranks") {
    const k = n.operation?.ranks?.length ? n.operation.ranks : [], c = G === "all" ? m : m.filter((v) => v.rankKey === G || v.rankName === G), l = N("ranks-users", c), p = N("ranks-stars", w), u = N("ranks-chests", L), b = N("ranks-weekly", C), se = L.reduce((v, ie) => v + Number(ie.rewardAmount || 0), 0), z = C.reduce((v, ie) => v + Number(ie.rewardAmount || 0), 0), de = n.operation?.rankRules, xe = Se(de);
    const rankModeText = (Array.isArray(de?.rankedModes) ? de.rankedModes.map(oe) : []).join("\u3001") || "\u672A\u5F00\u542F";
    const weeklyModeText = (Array.isArray(de?.weeklyLeaderboardModes) ? de.weeklyLeaderboardModes.map(oe) : []).join("\u3001") || "\u672A\u5F00\u542F";
    const weeklyRewardText = xe.length ? `\u7B2C${xe[0].fromRank}-${xe[xe.length - 1].toRank}\u540D` : "\u672A\u914D\u7F6E";
    return `
      <section class="panel">
        <div class="section-head">
          <div>
            <p class="tag">Rank Ops</p>
            <h2>\u6BB5\u4F4D\u8FD0\u8425</h2>
            <p class="meta">\u67E5\u770B\u6BB5\u4F4D\u3001\u5468\u699C\u3001\u5B9D\u7BB1\u548C\u5956\u52B1\u8BB0\u5F55\u3002</p>
          </div>
          <span class="pill">\u5468\u699C\u5DF2\u53D1 ${$(z)} Pi</span>
        </div>
        <div class="rank-rule-summary">
          <span>\u6BB5\u4F4D\uFF1A${i(rankModeText)}</span>
          <span>\u5468\u699C\uFF1A${i(weeklyModeText)}</span>
          <span>\u5B9D\u7BB1\uFF1A${Number(de?.dailyChestRequiredBattles || 3)}\u573A</span>
          <span>\u5468\u5956\uFF1A${i(weeklyRewardText)}</span>
        </div>
        <div class="rank-auto-panel">
          <div>
            <strong>\u5468\u699C\u81EA\u52A8\u53D1\u5956\uFF1A${de?.weeklyAutoSettleEnabled !== false ? "\u5DF2\u5F00\u542F" : "\u5DF2\u5173\u95ED"}</strong>
            <span>\u6BCF\u5468\u4E00\u81EA\u52A8\u53D1\u653E\uFF0C\u6309\u94AE\u4EC5\u7528\u4E8E\u5E94\u6025\u8865\u53D1\u3002</span>
          </div>
          <button type="button" id="rank-weekly-settle">\u5E94\u6025\u8865\u53D1\u4E0A\u4E00\u5468</button>
        </div>
        <p id="rank-weekly-status" class="status"></p>
        <div class="rank-weekly-rewards">
          ${xe.map((v) => f(`\u7B2C${v.fromRank}-${v.toRank}\u540D`, `${$(v.amount)} Pi/\u4EBA`, "\u81EA\u52A8\u53D1\u653E")).join("")}
        </div>
        <h2 class="sub-panel-title">\u5F53\u524D\u6BB5\u4F4D\u603B\u699C</h2>
        <p class="meta">\u5468\u5956\u6309\u672C\u5468\u699C\u53D1\u653E\uFF0C\u4E0D\u6309\u603B\u699C\u53D1\u653E\u3002</p>
        <div class="table-list leaderboard-admin-list">
          ${T.slice(0, 10).map((v) => rt(v, n)).join("") || '<p class="meta">\u6682\u65E0\u6392\u884C\u699C\u6570\u636E</p>'}
        </div>
      </section>
      <section class="panel">
        <div class="section-head">
          <div>
            <h2>\u6BB5\u4F4D\u7528\u6237</h2>
            <p class="meta">\u5F53\u524D\u7B5B\u9009 ${c.length} \u4EBA</p>
          </div>
          <span class="pill">\u8FD1 ${L.length} \u6B21\u5B9D\u7BB1\uFF1A${$(se)} Pi</span>
        </div>
        <div class="rank-filter-bar">
          <select id="rank-user-filter">
            <option value="all" ${G === "all" ? "selected" : ""}>\u5168\u90E8\u6BB5\u4F4D</option>
            ${k.map((v) => `<option value="${v.key}" ${G === v.key ? "selected" : ""}>${i(v.name)}</option>`).join("")}
          </select>
          <span>\u5F53\u524D\u7B5B\u9009 ${c.length} \u4EBA</span>
        </div>
        <div class="table-list">
          ${l.items.map(ot).join("") || '<p class="meta">\u6682\u65E0\u7528\u6237</p>'}
        </div>
        ${P("ranks-users", c.length)}
      </section>
      <section class="panel">
        <h2>\u5468\u699C\u81EA\u52A8\u53D1\u5956\u8BB0\u5F55</h2>
        <div class="table-list">
          ${b.items.map((v) => ct(v, n)).join("") || '<p class="meta">\u6682\u65E0\u5468\u699C\u53D1\u5956\u8BB0\u5F55</p>'}
        </div>
        ${P("ranks-weekly", C.length)}
      </section>
      <section class="panel">
        <h2>\u6BB5\u4F4D\u661F\u7EA7\u6D41\u6C34</h2>
        <div class="table-list">
          ${p.items.map((v) => ut(v, n)).join("") || '<p class="meta">\u6682\u65E0\u6BB5\u4F4D\u6D41\u6C34</p>'}
        </div>
        ${P("ranks-stars", w.length)}
      </section>
      <section class="panel">
        <h2>\u6BCF\u65E5\u5B9D\u7BB1\u9886\u53D6\u8BB0\u5F55</h2>
        <div class="table-list">
          ${u.items.map((v) => dt(v, n)).join("") || '<p class="meta">\u6682\u65E0\u5B9D\u7BB1\u8BB0\u5F55</p>'}
        </div>
        ${P("ranks-chests", L.length)}
      </section>
    `;
  }
  if (_ === "matches") {
    const k = De(y), c = N("matches-battle", k), l = N("matches-live", r), p = y.filter(ce).length, u = y.filter((z) => z.status === "manual_review").length, b = y.filter((z) => z.status === "playing" && z.entryFee > 0).length, se = y.filter((z) => z.status === "expired").length;
    return `
      <section class="panel match-ops-panel">
        <div class="section-head">
          <div>
            <p class="tag">Battle Ops</p>
            <h2>\u5F02\u5E38\u5BF9\u5C40\u5904\u7406\u4E2D\u5FC3</h2>
            <p class="meta">\u514D\u8D39\u673A\u5668\u4EBA\u5F02\u5E38\u5C40\u53EF\u76F4\u63A5\u4F5C\u5E9F\uFF1B\u4ED8\u8D39/\u771F\u4EBA\u5F02\u5E38\u5C40\u53EA\u8F6C\u4EBA\u5DE5\u590D\u6838\uFF0C\u907F\u514D\u8BEF\u52A8\u7528\u6237\u8D44\u4EA7\u3002</p>
          </div>
          <span class="pill">\u9700\u5173\u6CE8 ${p + u + b} \u5C40</span>
        </div>
        <div class="mini-grid match-ops-grid">
          ${f("\u7591\u4F3C\u5361\u5C40", p, "\u5BF9\u5C40\u4E2D\u8D85\u8FC75\u5206\u949F")}
          ${f("\u4EBA\u5DE5\u590D\u6838", u, "\u5DF2\u6807\u8BB0\u5F85\u5904\u7406")}
          ${f("\u4ED8\u8D39\u8FDB\u884C\u4E2D", b, "\u4ED8\u8D39\u5C40\u4E0D\u81EA\u52A8\u5224\u5B9A")}
          ${f("\u8D85\u65F6\u7ED3\u675F", se, "\u5DF2\u7CFB\u7EDF/\u540E\u53F0\u4F5C\u5E9F")}
        </div>
        <div class="match-toolbar">
          <input id="match-search" placeholder="\u641C\u7D22\u623F\u95F4\u53F7 / \u73A9\u5BB6\u6635\u79F0 / Pi\u7528\u6237\u540D / \u6A21\u5F0F" value="${E(re)}" />
          <select id="match-status-filter">
            <option value="all" ${I === "all" ? "selected" : ""}>\u5168\u90E8\u72B6\u6001</option>
            <option value="stale" ${I === "stale" ? "selected" : ""}>\u9700\u5173\u6CE8</option>
            <option value="playing" ${I === "playing" ? "selected" : ""}>\u5BF9\u5C40\u4E2D</option>
            <option value="manual_review" ${I === "manual_review" ? "selected" : ""}>\u4EBA\u5DE5\u590D\u6838</option>
            <option value="expired" ${I === "expired" ? "selected" : ""}>\u8D85\u65F6\u7ED3\u675F</option>
            <option value="finished" ${I === "finished" ? "selected" : ""}>\u5DF2\u7ED3\u675F</option>
          </select>
          <select id="match-mode-filter">
            ${BATTLE_MODE_FILTERS.map((z) => `<option value="${z.key}" ${battleModeFilter === z.key ? "selected" : ""}>${i(z.label)}</option>`).join("")}
          </select>
        </div>
        <p id="battle-action-status" class="status"></p>
      </section>
      <section class="panel">
        <h2>\u6B63\u5F0F\u5BF9\u5C40\u8BB0\u5F55</h2>
        <p class="meta">\u5F53\u524D\u7B5B\u9009 ${k.length} / \u603B\u8BA1 ${y.length} \u6761</p>
        <div class="room-list">
          ${c.items.length ? c.items.map(qt).join("") : '<p class="meta">\u5F53\u524D\u6682\u65E0\u6B63\u5F0F\u5BF9\u5C40\u8BB0\u5F55</p>'}
        </div>
        ${P("matches-battle", k.length)}
      </section>
      <section class="panel">
        <h2>\u5F53\u524D\u623F\u95F4\u5FEB\u7167</h2>
        <div class="room-list">
          ${l.items.length ? l.items.map(Lt).join("") : '<p class="meta">\u5F53\u524D\u6682\u65E0\u623F\u95F4</p>'}
        </div>
        ${P("matches-live", r.length)}
      </section>
    `;
  }
  const filteredLogs = filterList(B, LOG_LIST_FILTERS, logListFilter), activeLogFilter = LOG_LIST_FILTERS.find((v) => v.key === logListFilter) || LOG_LIST_FILTERS[0];
  return `
    <section class="panel">
      <div class="section-head">
        <div>
          <h2>\u540E\u53F0\u64CD\u4F5C\u65E5\u5FD7</h2>
          <p class="meta">\u6309\u64CD\u4F5C\u5BF9\u8C61\u5206\u7C7B\uFF0C\u5FEB\u901F\u8FFD\u8E2A\u7528\u6237\u3001\u63D0\u73B0\u3001\u5BF9\u5C40\u548C\u914D\u7F6E\u53D8\u66F4\u3002</p>
        </div>
        <span class="pill">${i(activeLogFilter.label)} ${filteredLogs.length} \u6761</span>
      </div>
      ${renderListFilters(B, LOG_LIST_FILTERS, logListFilter, "logs")}
      <div class="table-list">
        ${N("logs", filteredLogs).items.map(Ct).join("") || '<p class="meta">\u6682\u65E0\u64CD\u4F5C\u65E5\u5FD7</p>'}
      </div>
      ${P("logs", filteredLogs.length)}
    </section>
  `;
}
function ne(e, t) {
  return e.operation?.ranks?.find((a) => a.key === t || a.name === t)?.name || t || "\u9752\u94DC";
}
function lt(e, t) {
  return e.operation?.ranks?.find((a) => a.key === t || a.name === t) || { key: "bronze", name: "\u9752\u94DC", icon: "\u25C6", color: "#b87a45", enabled: true };
}
function rt(e, t) {
  const a = e.nickname || e.piUsername || h(e.uid), n = lt(t, e.rankKey || e.rankName);
  return `
    <article class="rank-row leaderboard-admin-row">
      <div>
        <strong>#${e.rankNo} ${i(a)}</strong>
        <span>${i(K(e))} \xB7 ${i(h(e.uid))}</span>
      </div>
      <div>
        <strong style="color: ${i(n.color)}">${i(n.icon)} ${i(n.name)} \xB7 ${e.stars || 0}\u661F</strong>
        <span>${e.winCount || 0}\u80DC ${e.loseCount || 0}\u8D1F \xB7 ${e.winStreak || 0}\u8FDE\u80DC</span>
      </div>
      <div>
        <strong>${e.rankScore || 1e3} \u5206</strong>
        <span>\u5F53\u524D\u699C\u5355</span>
      </div>
    </article>
  `;
}
function ot(e) {
  return `
    <article class="rank-row">
      <div>
        <strong>${i(e.nickname || e.piUsername || h(e.uid))}</strong>
        <span>${i(K(e))} \xB7 ${i(h(e.uid))}</span>
      </div>
      <div>
        <strong>${i(e.rankName)} \xB7 ${e.stars || 0}\u661F</strong>
        <span>\u8FDE\u80DC ${e.winStreak || 0} \xB7 \u4F59\u989D ${$(e.wallet.availableBalance)} Pi</span>
      </div>
      <div>
        <strong>${e.status === 1 ? "\u6B63\u5E38" : "\u7981\u7528"}</strong>
        <span>\u6CE8\u518C ${i(O(e.createdAt))}</span>
      </div>
    </article>
  `;
}
function ct(e, t) {
  const a = e.nickname || e.piUsername || h(e.uid);
  return `
    <article class="rank-row rank-record">
      <div>
        <strong>${i(e.seasonNo)} \xB7 \u7B2C${e.rankNo}\u540D</strong>
        <span>${i(a)} \xB7 ${i(K(e))}</span>
      </div>
      <div>
        <strong>${$(e.rewardAmount)} Pi</strong>
        <span>${i(ne(t, e.rankKey))} \xB7 ${e.stars || 0}\u661F</span>
      </div>
      <div>
        <strong>\u5DF2\u81EA\u52A8\u53D1\u653E</strong>
        <span>${i(O(e.createdAt))}</span>
      </div>
    </article>
  `;
}
function ut(e, t) {
  const a = e.nickname || e.piUsername || h(e.uid);
  return `
    <article class="rank-row rank-record">
      <div>
        <strong>${i(a)}</strong>
        <span>${i(oe(e.mode))} \xB7 ${i(h(e.roomNo))}</span>
      </div>
      <div>
        <strong>${e.result === "win" ? "\u80DC\u5229" : "\u5931\u8D25"} ${e.starDelta >= 0 ? "+" : ""}${e.starDelta}\u661F</strong>
        <span>${i(ne(t, e.rankKeyBefore))} ${e.starsBefore}\u661F \u2192 ${i(ne(t, e.rankKeyAfter))} ${e.starsAfter}\u661F</span>
      </div>
      <div>
        <strong>${i(O(e.createdAt))}</strong>
        <span>${i(h(e.uid))}</span>
      </div>
    </article>
  `;
}
function dt(e, t) {
  const a = e.nickname || e.piUsername || h(e.uid);
  return `
    <article class="rank-row rank-record">
      <div>
        <strong>${i(a)}</strong>
        <span>${i(e.claimDate || "")} \xB7 ${i(h(e.uid))}</span>
      </div>
      <div>
        <strong>${$(e.rewardAmount)} Pi</strong>
        <span>${i(ne(t, e.rankKey))}\u5B9D\u7BB1</span>
      </div>
      <div>
        <strong>\u5DF2\u9886\u53D6</strong>
        <span>${i(O(e.createdAt))}</span>
      </div>
    </article>
  `;
}
function mt(e) {
  const t = E(e.orderNo), a = e.walletCheckStatus === "valid";
  return `
    <article class="room-item">
      <h3>${i(e.orderNo)} \xB7 ${i(H(e.status))}</h3>
      <p>\u7528\u6237\uFF1A${Y(e)} ${i(X(e))} \xB7 ${i(K(e))}</p>
      <p>\u7533\u8BF7\uFF1A${$(e.amount)} Pi \xB7 \u624B\u7EED\u8D39\uFF1A${$(e.feeAmount || 0)} Pi \xB7 \u5230\u8D26\uFF1A${$(e.payoutAmount || e.amount)} Pi</p>
      <p>\u94B1\u5305\uFF1A${a ? "\u6B63\u5E38" : "\u9700\u6838\u5BF9"} \xB7 ${i(e.walletCheckMessage || "-")}</p>
      <p>\u5730\u5740\uFF1A${i(e.walletAddress)}</p>
      <p>\u81EA\u52A8\u72B6\u6001\uFF1A${i(Ue(e.autoPayoutStatus))} \xB7 \u91CD\u8BD5 ${e.autoPayoutAttempts || 0} \u6B21</p>
      ${e.autoPayoutError ? `<p>\u5931\u8D25\u539F\u56E0\uFF1A${i(e.autoPayoutError)}</p>` : ""}
      <p>TXID\uFF1A${i(e.txid || "-")}</p>
      <p>\u5907\u6CE8\uFF1A${i(e.auditRemark || "-")}</p>
      ${e.status === "pending" ? `<div class="inline-actions">
              <button type="button" data-withdraw-action="approve" data-order-no="${t}">\u901A\u8FC7</button>
              <button type="button" data-withdraw-action="reject" data-order-no="${t}" class="danger">\u62D2\u7EDD</button>
            </div>` : ""}
      ${e.status === "approved" ? `<div class="inline-actions">
              <input placeholder="\u586B\u5199\u94FE\u4E0ATXID" data-withdraw-txid="${t}" />
              <button type="button" data-withdraw-action="paid" data-order-no="${t}">\u6807\u8BB0\u5DF2\u6253\u6B3E</button>
            </div>` : ""}
    </article>
  `;
}
function pt(e, t) {
  const a = te, n = a?.summary || { pending: t.filter((m) => m.status === "pending").length, approved: t.filter((m) => m.status === "approved").length, queued: t.filter((m) => m.autoPayoutStatus === "queued").length, failed: t.filter((m) => m.autoPayoutStatus === "failed").length }, s = a?.config?.payoutRuntime, filteredWithdraws = filterList(t, WITHDRAW_LIST_FILTERS, withdrawListFilter), r = N("withdraw-orders", filteredWithdraws), o = e.withdrawRisk, activeWithdrawFilter = WITHDRAW_LIST_FILTERS.find((m) => m.key === withdrawListFilter) || WITHDRAW_LIST_FILTERS[0];
  return `
    <section class="panel">
      <div class="section-head">
        <div>
          <p class="tag">Withdraw Ops</p>
          <h2>\u63D0\u73B0\u7BA1\u7406</h2>
        </div>
        <button type="button" id="withdraw-refresh">\u5237\u65B0\u961F\u5217</button>
      </div>
      <div class="dashboard-grid">
        ${S("\u5F85\u5BA1\u6838", n.pending, "\u9700\u8981\u4EBA\u5DE5\u5224\u65AD")}
        ${S("\u5F85\u6253\u6B3E", n.approved, "\u5DF2\u5BA1\u6838\u672A\u5B8C\u6210")}
        ${S("\u81EA\u52A8\u961F\u5217", n.queued, "worker \u4F1A\u5904\u7406")}
        ${S("\u81EA\u52A8\u5931\u8D25", n.failed, "\u9700\u8981\u6392\u67E5\u6216\u4EBA\u5DE5\u63A5\u7BA1", n.failed ? "danger" : "")}
      </div>
      <p id="withdraw-refresh-status" class="status"></p>
    </section>

    <section class="panel">
      <h2>\u81EA\u52A8\u51FA\u6B3E\u914D\u7F6E</h2>
      <form id="withdraw-risk-form" class="form">
        <label><span>\u5355\u7B14\u6700\u5C0F\u63D0\u73B0 Pi</span><input name="minAmount" type="number" inputmode="decimal" min="0" step="0.01" value="${o.minAmount}" /></label>
        <label><span>\u5355\u7528\u6237\u6BCF\u65E5\u63D0\u73B0\u4E0A\u9650 Pi</span><input name="dailyLimitAmount" type="number" inputmode="decimal" min="0" step="0.01" value="${o.dailyLimitAmount}" /></label>
        <label><span>\u63D0\u73B0\u624B\u7EED\u8D39\u6BD4\u4F8B</span><input name="feeRate" type="number" inputmode="decimal" min="0" max="0.2" step="0.001" value="${o.feeRate}" /></label>
        <label><span>\u5927\u989D\u4EBA\u5DE5\u590D\u6838\u9608\u503C Pi</span><input name="manualReviewAmount" type="number" inputmode="decimal" min="0" step="0.01" value="${o.manualReviewAmount}" /></label>
        <label>
          <span>\u81EA\u52A8\u5BA1\u6838</span>
          <select name="autoApproveEnabled">
            <option value="false" ${o.autoApproveEnabled ? "" : "selected"}>\u5173\u95ED</option>
            <option value="true" ${o.autoApproveEnabled ? "selected" : ""}>\u5F00\u542F</option>
          </select>
        </label>
        <label>
          <span>\u81EA\u52A8\u94FE\u4E0A\u51FA\u6B3E</span>
          <select name="autoPayoutEnabled">
            <option value="false" ${o.autoPayoutEnabled ? "" : "selected"}>\u5173\u95ED</option>
            <option value="true" ${o.autoPayoutEnabled ? "selected" : ""}>\u5F00\u542F</option>
          </select>
        </label>
        <label><span>\u5355\u7B14\u81EA\u52A8\u4E0A\u9650 Pi</span><input name="autoPayoutMaxAmount" type="number" inputmode="decimal" min="0" step="0.01" value="${o.autoPayoutMaxAmount}" /></label>
        <label><span>\u6BCF\u65E5\u81EA\u52A8\u4E0A\u9650 Pi</span><input name="autoPayoutDailyLimitAmount" type="number" inputmode="decimal" min="0" step="0.01" value="${o.autoPayoutDailyLimitAmount}" /></label>
        <label><span>\u5931\u8D25\u91CD\u8BD5\u6B21\u6570</span><input name="maxRetryCount" type="number" inputmode="decimal" min="0" max="10" step="1" value="${o.maxRetryCount}" /></label>
        <label>
          <span>\u94B1\u5305\u5730\u5740\u6821\u9A8C</span>
          <select name="walletValidationRequired">
            <option value="true" ${o.walletValidationRequired !== false ? "selected" : ""}>\u5FC5\u987B\u901A\u8FC7</option>
            <option value="false" ${o.walletValidationRequired === false ? "selected" : ""}>\u4EC5\u8BB0\u5F55\u63D0\u9192</option>
          </select>
        </label>
        <button type="submit">\u4FDD\u5B58\u63D0\u73B0\u914D\u7F6E</button>
        <p id="withdraw-risk-status" class="status"></p>
      </form>
      <p class="meta">\u8FD0\u884C\u73AF\u5883\uFF1AHorizon ${s?.horizonConfigured ? "\u5DF2\u914D\u7F6E" : "\u672A\u914D\u7F6E"} \xB7 \u70ED\u94B1\u5305\u79C1\u94A5 ${s?.sourceSecretConfigured ? s.sourceSecretValid === false ? "\u683C\u5F0F\u5F02\u5E38" : "\u5DF2\u914D\u7F6E" : "\u672A\u914D\u7F6E"} \xB7 \u516C\u94A5 ${s?.sourcePublicConfigured ? s.sourcePublicValid === false || s.sourcePublicMatches === false ? "\u5F02\u5E38" : "\u5DF2\u786E\u8BA4" : "\u672A\u914D\u7F6E"}</p>
    </section>

    <section class="panel">
      <div class="section-head">
        <div>
          <h2>\u63D0\u73B0\u961F\u5217</h2>
          <p class="meta">\u6309\u5F85\u5BA1\u6838\u3001\u5F85\u6253\u6B3E\u3001\u5DF2\u6253\u6B3E\u548C\u5931\u8D25\u72B6\u6001\u5206\u7C7B\u5904\u7406\u3002</p>
        </div>
        <span class="pill">${i(activeWithdrawFilter.label)} ${filteredWithdraws.length} \u7B14</span>
      </div>
      ${renderListFilters(t, WITHDRAW_LIST_FILTERS, withdrawListFilter, "withdraw")}
      <div class="room-list">
        ${r.items.length ? r.items.map(mt).join("") : '<p class="meta">\u5F53\u524D\u6682\u65E0\u63D0\u73B0\u7533\u8BF7</p>'}
      </div>
      ${P("withdraw-orders", filteredWithdraws.length)}
      <p id="withdraw-status" class="status"></p>
    </section>
  `;
}
function bt(e = "") {
  return { qualification: "\u5B8C\u6210\u5BF9\u5C40\u5956\u52B1", battle_commission: "\u4ED8\u8D39\u5BF9\u6218\u63D0\u6210" }[e] || e || "-";
}
function $t(e) {
  return `
    <article class="row-card growth-row">
      <strong>${i(e.transferNo)}</strong>
      <span>${i(e.fromNickname || e.fromPiUsername || h(e.fromUid))} \u2192 ${i(e.toNickname || e.toPiUsername || h(e.toUid))}</span>
      <span>${$(e.amount)} Pi \xB7 \u8D39 ${$(e.feeAmount || 0)}</span>
      <span>${i(O(e.createdAt))}</span>
    </article>
  `;
}
function vt(e) {
  return `
    <article class="row-card growth-row">
      <strong>${i(e.inviterNickname || e.inviterPiUsername || h(e.inviterUid))}</strong>
      <span>\u9080\u8BF7 ${i(e.inviteeNickname || e.inviteePiUsername || h(e.inviteeUid))}</span>
      <span>${i(H(e.status))}</span>
      <span>${i(O(e.boundAt))}</span>
    </article>
  `;
}
function ht(e) {
  return `
    <article class="row-card growth-row">
      <strong>${i(bt(e.rewardType))}</strong>
      <span>${i(e.inviterNickname || e.inviterPiUsername || h(e.inviterUid))} \xB7 ${i(e.inviteeNickname || e.inviteePiUsername || h(e.inviteeUid))}</span>
      <span>${$(e.amount)} Pi \xB7 ${e.rate ? `${Math.round(e.rate * 1e3) / 10}%` : "-"}</span>
      <span>${i(H(e.status))} \xB7 ${i(O(e.createdAt))}</span>
    </article>
  `;
}
function renderEngagementClaim(e) {
  const t = e.assetSummary || e.rewardSummary || `${$(e.rewardAmount)} Pi`;
  return `
    <article class="row-card growth-row">
      <strong>${i(e.claimType === "sign_in" ? "\u6BCF\u65E5\u7B7E\u5230" : "\u6BCF\u65E5\u4EFB\u52A1")}</strong>
      <span>${i(e.nickname || e.piUsername || h(e.uid))} \xB7 ${i(e.title || "-")}</span>
      <span>${i(t)}</span>
      <span>${i(O(e.createdAt))}</span>
    </article>
  `;
}
function engagementConditionLabel(e = "") {
  return { battle_count: "\u5B8C\u6210\u5BF9\u5C40\u6570", win_count: "\u80DC\u5229\u5BF9\u5C40\u6570", paid_battle_count: "\u4ED8\u8D39\u5BF9\u5C40\u6570" }[e] || "\u5B8C\u6210\u5BF9\u5C40\u6570";
}
function engagementTaskModeChecks(e = [], t) {
  const a = Array.isArray(e) && e.length ? e : ENGAGEMENT_PAID_MODES;
  return `
    <div class="engagement-mode-checks">
      ${ENGAGEMENT_BATTLE_MODES.map((n) => `
        <label>
          <input type="checkbox" name="engagementTaskMode${t}" value="${n.key}" ${a.includes(n.key) ? "checked" : ""} />
          <span>${i(n.label)}</span>
        </label>
      `).join("")}
    </div>
  `;
}
function engagementTaskRows(e = []) {
  const t = (e.length ? e : ENGAGEMENT_TASK_DEFAULTS).map((a, n) => ({ ...ENGAGEMENT_TASK_DEFAULTS[n], ...a }));
  return t.map((a, n) => `
    <div class="engagement-task-card" data-engagement-task-row>
      <div class="engagement-task-head">
        <strong>${i(a.title || `每日任务${n + 1}`)}</strong>
        <button type="button" data-remove-engagement-task>\u5220\u9664</button>
      </div>
      <div class="growth-config-grid">
        <label><span>\u4EFB\u52A1\u5F00\u5173</span><select data-engagement-task-enabled>
          <option value="true" ${a.enabled !== false ? "selected" : ""}>\u5F00\u542F</option>
          <option value="false" ${a.enabled === false ? "selected" : ""}>\u5173\u95ED</option>
        </select></label>
        <label><span>\u4EFB\u52A1\u7F16\u53F7</span><input data-engagement-task-key value="${i(a.key || `task_${n + 1}`)}" /></label>
        <label><span>\u524D\u53F0\u6807\u9898</span><input data-engagement-task-title value="${i(a.title || "")}" /></label>
        <label><span>\u5B8C\u6210\u6761\u4EF6</span><select data-engagement-task-condition>
          ${["battle_count", "win_count", "paid_battle_count"].map((s) => `<option value="${s}" ${a.condition === s ? "selected" : ""}>${engagementConditionLabel(s)}</option>`).join("")}
        </select></label>
        <label><span>\u9700\u8981\u6570\u91CF</span><input data-engagement-task-required type="number" inputmode="decimal" min="1" max="50" step="1" value="${a.requiredCount ?? 1}" /></label>
        <label><span>\u5956\u52B1 Pi</span><input data-engagement-task-reward type="number" inputmode="decimal" min="0" max="10" step="0.001" value="${a.rewardAmount ?? 0}" /></label>
      </div>
      <label class="engagement-task-modes">
        <span>\u7EDF\u8BA1\u54EA\u4E9B\u573A\u6B21</span>
        ${engagementTaskModeChecks(a.modes, n)}
      </label>
    </div>
  `).join("");
}
function ft(e, t) {
  const a = e.transfer || { enabled: true, minAmount: 0.01, maxAmount: 20, dailyLimitAmount: 50, feeRate: 0, feeMinAmount: 0, cooldownSeconds: 10 }, n = e.inviteRewards || { enabled: true, bindEnabled: true, qualificationEnabled: true, qualificationRequiredBattles: 2, qualificationRewardAmount: 0.02, battleCommissionEnabled: true, commissionBase: "entry_fee", maxCommissionRate: 0.2, levels: [] }, engagement = e.engagement || { enabled: true, dailySignIn: { enabled: true, title: "\u6BCF\u65E5\u7B7E\u5230", piRewardEnabled: true, rewardAmount: 0.01, pointsRewardEnabled: false, pointsRewardAmount: 0, pocRewardEnabled: false, pocRewardAmount: 0 }, tasks: ENGAGEMENT_TASK_DEFAULTS }, s = n.levels?.length ? n.levels : [{ key: "starter", name: "\u95EA\u7535\u4F19\u4F34", commissionRate: 0.03, minBalance: 0, minDirectInvites: 0, enabled: true }, { key: "silver", name: "\u94F6\u724C\u961F\u957F", commissionRate: 0.05, minBalance: 5, minDirectInvites: 5, enabled: true }, { key: "gold", name: "\u91D1\u724C\u961F\u957F", commissionRate: 0.08, minBalance: 20, minDirectInvites: 20, enabled: true }], r = t?.transfers || [], o = t?.relations || [], m = t?.rewards || [], engagementClaims = t?.engagementClaims || [], filteredRewards = filterList(m, GROWTH_REWARD_FILTERS, growthRewardFilter), R = N("growth-transfers", r), y = N("growth-relations", o), x = N("growth-rewards", filteredRewards), engagementClaimPager = N("growth-engagement-claims", engagementClaims), j = m.reduce((B, w) => B + Number(w.amount || 0), 0), A = r.reduce((B, w) => B + Number(w.feeAmount || 0), 0), activeRewardFilter = GROWTH_REWARD_FILTERS.find((B) => B.key === growthRewardFilter) || GROWTH_REWARD_FILTERS[0];
  return `
    <section class="panel">
      <div class="section-head">
        <div>
          <p class="tag">Growth Ops</p>
          <h2>\u589E\u957F\u8FD0\u8425</h2>
          <p class="meta">\u7BA1\u7406\u5E73\u53F0\u5185\u8F6C\u8D26\u3001\u9080\u8BF7\u5956\u52B1\u548C\u8D21\u732E\u7B49\u7EA7\u3002\u7528\u6237\u7AEF\u6587\u6848\u4FDD\u6301\u201C\u9080\u8BF7\u597D\u53CB\u201D\uFF0C\u907F\u514D\u590D\u6742\u8868\u8FF0\u3002</p>
        </div>
        <span class="pill">\u9080\u8BF7\u5DF2\u53D1 ${$(j)} Pi</span>
      </div>
      <div class="mini-grid">
        ${f("\u8F6C\u8D26\u7B14\u6570", r.length, `\u624B\u7EED\u8D39 ${$(A)} Pi`)}
        ${f("\u9080\u8BF7\u5173\u7CFB", o.length, "\u5DF2\u7ED1\u5B9A\u7528\u6237")}
        ${f("\u5956\u52B1\u8BB0\u5F55", m.length, "\u5B8C\u6210\u5956\u52B1 + \u5BF9\u6218\u63D0\u6210")}
        ${f("\u6700\u9AD8\u63D0\u6210", `${Math.round(Number(n.maxCommissionRate || 0) * 1e3) / 10}%`, "\u5355\u4EBA\u6BD4\u4F8B\u4E0A\u9650")}
      </div>
    </section>

    <section class="panel">
      <h2>\u8F6C\u8D26\u914D\u7F6E</h2>
      <form id="growth-config-form" class="form">
        <div class="growth-config-grid">
          <label><span>\u5E73\u53F0\u5185\u8F6C\u8D26</span><select name="transferEnabled">
            <option value="true" ${a.enabled !== false ? "selected" : ""}>\u5F00\u542F</option>
            <option value="false" ${a.enabled === false ? "selected" : ""}>\u5173\u95ED</option>
          </select></label>
          <label><span>\u5355\u7B14\u6700\u5C0F Pi</span><input name="transferMinAmount" type="number" inputmode="decimal" min="0" step="0.01" value="${a.minAmount}" /></label>
          <label><span>\u5355\u7B14\u6700\u5927 Pi</span><input name="transferMaxAmount" type="number" inputmode="decimal" min="0" step="0.01" value="${a.maxAmount}" /></label>
          <label><span>\u6BCF\u65E5\u4E0A\u9650 Pi</span><input name="transferDailyLimitAmount" type="number" inputmode="decimal" min="0" step="0.01" value="${a.dailyLimitAmount}" /></label>
          <label><span>\u624B\u7EED\u8D39\u6BD4\u4F8B</span><input name="transferFeeRate" type="number" inputmode="decimal" min="0" max="0.2" step="0.001" value="${a.feeRate}" /></label>
          <label><span>\u6700\u4F4E\u624B\u7EED\u8D39 Pi</span><input name="transferFeeMinAmount" type="number" inputmode="decimal" min="0" step="0.001" value="${a.feeMinAmount}" /></label>
          <label><span>\u8F6C\u8D26\u51B7\u5374\u79D2</span><input name="transferCooldownSeconds" type="number" inputmode="decimal" min="0" max="600" step="1" value="${a.cooldownSeconds}" /></label>
        </div>

        <h2>\u9080\u8BF7\u6FC0\u52B1</h2>
        <div class="growth-config-grid">
          <label><span>\u9080\u8BF7\u7CFB\u7EDF</span><select name="inviteEnabled">
            <option value="true" ${n.enabled !== false ? "selected" : ""}>\u5F00\u542F</option>
            <option value="false" ${n.enabled === false ? "selected" : ""}>\u5173\u95ED</option>
          </select></label>
          <label><span>\u5141\u8BB8\u7ED1\u5B9A\u9080\u8BF7\u4EBA</span><select name="inviteBindEnabled">
            <option value="true" ${n.bindEnabled !== false ? "selected" : ""}>\u5141\u8BB8</option>
            <option value="false" ${n.bindEnabled === false ? "selected" : ""}>\u5173\u95ED</option>
          </select></label>
          <label><span>\u5B8C\u6210\u5BF9\u5C40\u5956\u52B1</span><select name="qualificationEnabled">
            <option value="true" ${n.qualificationEnabled !== false ? "selected" : ""}>\u5F00\u542F</option>
            <option value="false" ${n.qualificationEnabled === false ? "selected" : ""}>\u5173\u95ED</option>
          </select></label>
          <label><span>\u9700\u5B8C\u6210\u5BF9\u5C40</span><input name="qualificationRequiredBattles" type="number" inputmode="decimal" min="1" max="20" step="1" value="${n.qualificationRequiredBattles}" /></label>
          <label><span>\u53EF\u9886\u5956\u52B1 Pi</span><input name="qualificationRewardAmount" type="number" inputmode="decimal" min="0" step="0.001" value="${n.qualificationRewardAmount}" /></label>
          <label><span>\u4ED8\u8D39\u5BF9\u6218\u63D0\u6210</span><select name="battleCommissionEnabled">
            <option value="true" ${n.battleCommissionEnabled !== false ? "selected" : ""}>\u5F00\u542F</option>
            <option value="false" ${n.battleCommissionEnabled === false ? "selected" : ""}>\u5173\u95ED</option>
          </select></label>
          <label><span>\u63D0\u6210\u57FA\u51C6</span><select name="commissionBase">
            <option value="entry_fee" ${n.commissionBase !== "platform_fee" ? "selected" : ""}>\u6309\u5165\u573A\u8D39</option>
            <option value="platform_fee" ${n.commissionBase === "platform_fee" ? "selected" : ""}>\u6309\u5E73\u53F0\u62BD\u6210</option>
          </select></label>
          <label><span>\u6700\u9AD8\u63D0\u6210\u6BD4\u4F8B</span><input name="maxCommissionRate" type="number" inputmode="decimal" min="0" max="0.2" step="0.001" value="${n.maxCommissionRate}" /></label>
        </div>

        <div class="avatar-config rank-config">
          <strong>\u8D21\u732E\u7B49\u7EA7</strong>
          <p class="meta">\u4F59\u989D\u8FBE\u6807\u6216\u9080\u8BF7\u4EBA\u6570\u8FBE\u6807\uFF0C\u6EE1\u8DB3\u4EFB\u4E00\u6761\u4EF6\u5373\u53EF\u5347\u7EA7\uFF1B\u5B9E\u9645\u5355\u5C40\u603B\u63D0\u6210\u4E0D\u4F1A\u8D85\u8FC7\u672C\u5C40\u5E73\u53F0\u62BD\u6210\u3002</p>
          ${s.slice(0, 6).map(Ze).join("")}
        </div>

        <h2>\u6BCF\u65E5\u7B7E\u5230\u548C\u4EFB\u52A1</h2>
        <div class="growth-config-grid">
          <label><span>\u6D3B\u8DC3\u5956\u52B1\u603B\u5F00\u5173</span><select name="engagementEnabled">
            <option value="true" ${engagement.enabled !== false ? "selected" : ""}>\u5F00\u542F</option>
            <option value="false" ${engagement.enabled === false ? "selected" : ""}>\u5173\u95ED</option>
          </select></label>
          <label><span>\u6BCF\u65E5\u7B7E\u5230</span><select name="dailySignInEnabled">
            <option value="true" ${engagement.dailySignIn?.enabled !== false ? "selected" : ""}>\u5F00\u542F</option>
            <option value="false" ${engagement.dailySignIn?.enabled === false ? "selected" : ""}>\u5173\u95ED</option>
          </select></label>
          <label><span>\u7B7E\u5230\u6807\u9898</span><input name="dailySignInTitle" value="${i(engagement.dailySignIn?.title || "\u6BCF\u65E5\u7B7E\u5230")}" /></label>
          <label><span>Pi\u5956\u52B1</span><select name="dailySignInPiRewardEnabled">
            <option value="true" ${engagement.dailySignIn?.piRewardEnabled !== false ? "selected" : ""}>\u5F00\u542F</option>
            <option value="false" ${engagement.dailySignIn?.piRewardEnabled === false ? "selected" : ""}>\u5173\u95ED</option>
          </select></label>
          <label><span>\u5956\u52B1 Pi</span><input name="dailySignInReward" type="number" inputmode="decimal" min="0" max="10" step="0.001" value="${engagement.dailySignIn?.rewardAmount ?? 0}" /></label>
          <label><span>\u79EF\u5206\u5956\u52B1</span><select name="dailySignInPointsRewardEnabled">
            <option value="false" ${engagement.dailySignIn?.pointsRewardEnabled ? "" : "selected"}>\u5173\u95ED</option>
            <option value="true" ${engagement.dailySignIn?.pointsRewardEnabled ? "selected" : ""}>\u5F00\u542F</option>
          </select></label>
          <label><span>\u5956\u52B1\u79EF\u5206</span><input name="dailySignInPointsReward" type="number" inputmode="numeric" min="0" max="100000" step="1" value="${engagement.dailySignIn?.pointsRewardAmount ?? 0}" /></label>
          <label><span>POC\u5956\u52B1</span><select name="dailySignInPocRewardEnabled">
            <option value="false" ${engagement.dailySignIn?.pocRewardEnabled ? "" : "selected"}>\u5173\u95ED</option>
            <option value="true" ${engagement.dailySignIn?.pocRewardEnabled ? "selected" : ""}>\u5F00\u542F</option>
          </select></label>
          <label><span>\u5956\u52B1 POC</span><input name="dailySignInPocReward" type="number" inputmode="decimal" min="0" max="100000" step="0.000001" value="${engagement.dailySignIn?.pocRewardAmount ?? 0}" /></label>
        </div>
        <div class="avatar-config rank-config">
          <div class="engagement-task-title-row">
            <div>
              <strong>\u6BCF\u65E5\u4EFB\u52A1</strong>
              <p class="meta">\u9ED8\u8BA4\u4E0D\u7EDF\u8BA1\u5FEB\u901F\u5F00\u6218\uFF1B\u53EF\u6307\u5B9A\u53EA\u8BA9\u5C0F\u5BCC\u8C6A\u3001\u5927\u5BCC\u8C6A\u3001\u8D85\u7EA7\u5BCC\u8C6A\u751F\u6548\uFF0C\u5F15\u5BFC\u7528\u6237\u6D88\u8017\u79EF\u5206/POC/Pi\u3002</p>
            </div>
            <button type="button" id="add-engagement-task">\u65B0\u589E\u4EFB\u52A1</button>
          </div>
          <div id="engagement-task-list">
            ${engagementTaskRows(engagement.tasks || [])}
          </div>
        </div>
        <button type="submit">\u4FDD\u5B58\u589E\u957F\u914D\u7F6E</button>
        <p id="growth-config-status" class="status"></p>
      </form>
    </section>

    <section class="panel">
      <h2>\u8F6C\u8D26\u8BB0\u5F55</h2>
      <div class="table-list">${R.items.map($t).join("") || '<p class="meta">\u6682\u65E0\u8F6C\u8D26\u8BB0\u5F55</p>'}</div>
      ${P("growth-transfers", r.length)}
    </section>
    <section class="panel">
      <h2>\u9080\u8BF7\u5173\u7CFB</h2>
      <div class="table-list">${y.items.map(vt).join("") || '<p class="meta">\u6682\u65E0\u9080\u8BF7\u5173\u7CFB</p>'}</div>
      ${P("growth-relations", o.length)}
    </section>
    <section class="panel">
      <div class="section-head">
        <div>
          <h2>\u5956\u52B1\u8BB0\u5F55</h2>
          <p class="meta">\u6309\u5BF9\u5C40\u5956\u52B1\u3001\u5BF9\u6218\u63D0\u6210\u548C\u53D1\u653E\u72B6\u6001\u5206\u7C7B\u67E5\u770B\u3002</p>
        </div>
        <span class="pill">${i(activeRewardFilter.label)} ${filteredRewards.length} \u6761</span>
      </div>
      ${renderListFilters(m, GROWTH_REWARD_FILTERS, growthRewardFilter, "growth-rewards")}
      <div class="table-list">${x.items.map(ht).join("") || '<p class="meta">\u6682\u65E0\u5956\u52B1\u8BB0\u5F55</p>'}</div>
      ${P("growth-rewards", filteredRewards.length)}
    </section>
    <section class="panel">
      <div class="section-head">
        <div>
          <h2>\u7B7E\u5230/\u4EFB\u52A1\u9886\u53D6\u8BB0\u5F55</h2>
          <p class="meta">\u67E5\u770B\u7528\u6237\u6BCF\u65E5\u7B7E\u5230\u548C\u4EFB\u52A1\u9886\u53D6\u60C5\u51B5\uFF0C\u4FBF\u4E8E\u505A\u6D3B\u8DC3\u6D3B\u52A8\u5BF9\u8D26\u3002</p>
        </div>
        <span class="pill">${engagementClaims.length} \u6761</span>
      </div>
      <div class="table-list">${engagementClaimPager.items.map(renderEngagementClaim).join("") || '<p class="meta">\u6682\u65E0\u9886\u53D6\u8BB0\u5F55</p>'}</div>
      ${P("growth-engagement-claims", engagementClaims.length)}
    </section>
  `;
}
function gt(e) {
  const t = Number(e.bonusAmount || 0), a = Number(e.totalCreditAmount || e.amount + t);
  return `
    <article class="room-item">
      <h3>${i(e.orderNo)}</h3>
      <p>\u7528\u6237\uFF1A${Y(e)} ${i(X(e))} \xB7 ${i(K(e))}</p>
      <p>\u91D1\u989D\uFF1A${e.amount} Pi \xB7 \u8D60\u9001\uFF1A${t.toFixed(4)} Pi \xB7 \u5230\u8D26\uFF1A${a.toFixed(4)} Pi</p>
      <p>\u72B6\u6001\uFF1A${i(H(e.status))}</p>
      <p>Pi Payment\uFF1A${i(e.piPaymentId || "-")}</p>
      <p>TXID\uFF1A${i(e.txid || "-")}</p>
      <p>\u8BF4\u660E\uFF1A${i(e.memo || "-")}</p>
    </article>
  `;
}
function Pe(e) {
  return `
    <article class="row-card">
      <strong>${i(qe(e.type))} \xB7 ${i(Le(e.direction))}</strong>
      <span>${Y(e)} ${i(X(e))} \xB7 ${i(K(e))}</span>
      <span>${e.amount} Pi</span>
      <span>${i(e.remark || "-")}</span>
    </article>
  `;
}
function $(e) {
  return Number(e || 0).toFixed(4).replace(/\.?0+$/, "");
}
function yt(e) {
  return e >= 90 ? "\u53EF\u7070\u5EA6\u8FD0\u8425" : e >= 70 ? "\u9700\u8981\u5173\u6CE8" : "\u6682\u7F13\u63A8\u5E7F";
}
function wt(e) {
  return e === "danger" ? "\u9AD8\u98CE\u9669" : e === "warning" ? "\u9700\u5173\u6CE8" : "\u63D0\u793A";
}
function kt(e) {
  return e === "danger" ? "danger" : e === "warning" ? "warning" : "info";
}
function renderBattleAssetRevenue(e = {}) {
  const t = Array.isArray(e.assets) ? e.assets : [];
  const a = t.length ? t : [
    { assetType: "PI", assetUnit: "Pi", platformRevenue: e.platformRevenue || 0, finishedRooms: e.finishedRooms || 0 },
    { assetType: "POINTS", assetUnit: "积分", platformRevenue: 0, finishedRooms: 0 },
    { assetType: "POC", assetUnit: "POC", platformRevenue: 0, finishedRooms: 0 }
  ];
  return a.map((n) => `
    <span class="recon-asset-line">
      <b>${$(n.platformRevenue)} ${i(n.assetUnit || n.assetType)}</b>
      <small>${Number(n.finishedRooms || 0)} \u5C40</small>
    </span>
  `).join("");
}
function St(e) {
  const t = e.dangerCount || 0, a = e.warningCount || 0, n = e.infoCount || 0;
  return `
    <section class="recon-hero">
      <div>
        <p class="tag">Operation Health</p>
        <h2>\u5F02\u5E38\u4E2D\u5FC3\u4E0E\u8FD0\u8425\u9A8C\u6536</h2>
        <p class="meta">\u68C0\u67E5\u65F6\u95F4\uFF1A${i(O(e.checkedAt))} \xB7 \u5F02\u5E38\u9879\uFF1A${e.issueCount}</p>
        <div class="alert-chips">
          <span class="danger">\u9AD8\u98CE\u9669 ${t}</span>
          <span class="warning">\u9700\u5173\u6CE8 ${a}</span>
          <span class="info">\u63D0\u793A ${n}</span>
        </div>
      </div>
      <div class="health-orb ${e.healthScore >= 90 ? "ok" : e.healthScore >= 70 ? "warning" : "danger"}">
        <strong>${e.healthScore}</strong>
        <span>${yt(e.healthScore)}</span>
      </div>
    </section>
    <section class="recon-grid">
      <article class="recon-card">
        <span>\u5145\u503C\u5B8C\u6210</span>
        <strong>${e.summary.payments.completedOrders}/${e.summary.payments.totalOrders}</strong>
        <small>${$(e.summary.payments.completedAmount)} Pi \u5DF2\u5165\u8D26 \xB7 ${e.summary.payments.openOrders} \u7B14\u672A\u95ED\u73AF</small>
      </article>
      <article class="recon-card">
        <span>\u94B1\u5305\u4E00\u81F4\u6027</span>
        <strong>${e.summary.wallets.mismatchCount === 0 ? "\u6B63\u5E38" : e.summary.wallets.mismatchCount}</strong>
        <small>\u6309\u6D41\u6C34\u53CD\u7B97\u53EF\u7528/\u51BB\u7ED3\u4F59\u989D</small>
      </article>
      <article class="recon-card">
        <span>\u63D0\u73B0\u961F\u5217</span>
        <strong>${e.summary.withdraws.pendingOrders + e.summary.withdraws.approvedOrders}</strong>
        <small>\u5F85\u5BA1\u6838 ${e.summary.withdraws.pendingOrders} \xB7 \u5F85\u6253\u6B3E ${e.summary.withdraws.approvedOrders} \xB7 \u5DF2\u6253\u6B3E ${$(e.summary.withdraws.paidAmount)} Pi</small>
      </article>
      <article class="recon-card">
        <span>\u5BF9\u5C40\u6536\u76CA</span>
        <div class="recon-asset-revenue">${renderBattleAssetRevenue(e.summary.battles)}</div>
        <small>${e.summary.battles.finishedRooms} \u5C40\u5DF2\u7ED3\u7B97 \xB7 ${e.summary.battles.playingRooms} \u5C40\u8FDB\u884C\u4E2D</small>
      </article>
      <article class="recon-card ${t ? "danger" : a ? "warning" : "ok"}">
        <span>\u5F02\u5E38\u544A\u8B66</span>
        <strong>${t + a}</strong>
        <small>\u9AD8\u98CE\u9669 ${t} \xB7 \u9700\u5173\u6CE8 ${a} \xB7 \u63D0\u793A ${n}</small>
      </article>
    </section>
    <section class="recon-groups">
      ${e.groups.map(_t).join("")}
    </section>
  `;
}
function _t(e) {
  const t = N(`reconciliation-${e.key}`, e.items);
  return `
    <section class="panel recon-group ${e.level}">
      <div class="recon-group-head">
        <div>
          <h2>${i(e.title)}</h2>
          <p class="meta">${e.count === 0 ? "\u672A\u53D1\u73B0\u5F02\u5E38\uFF0C\u53EF\u4EE5\u7EE7\u7EED\u89C2\u5BDF\u3002" : `\u53D1\u73B0 ${e.count} \u4E2A\u9700\u8981\u5904\u7406\u7684\u95EE\u9898\u3002`}</p>
        </div>
        <span class="recon-level">${e.level === "ok" ? "\u6B63\u5E38" : e.level === "danger" ? "\u9AD8\u98CE\u9669" : e.level === "info" ? "\u63D0\u793A" : "\u9700\u5173\u6CE8"}</span>
      </div>
      <div class="recon-issue-list">
        ${e.items.length ? t.items.map(Rt).join("") : '<article class="recon-empty">\u8FD9\u7EC4\u5F88\u5E72\u51C0\uFF0C\u50CF\u521A\u64E6\u8FC7\u7684\u73BB\u7483\u3002</article>'}
      </div>
      ${e.items.length ? P(`reconciliation-${e.key}`, e.items.length) : ""}
    </section>
  `;
}
function Rt(e) {
  const t = e.assetUnit || "Pi";
  return `
    <article class="recon-issue ${kt(e.severity)}">
      <div>
        <strong><em>${wt(e.severity)}</em>${i(e.title)}</strong>
        <span>${i(e.targetId)} \xB7 ${i(e.user)}</span>
      </div>
      <div>
        <b>${e.amount ? `${$(e.amount)} ${i(t)}` : "-"}</b>
        <span>${i(H(e.status))}</span>
      </div>
      <p>${i(e.hint)}</p>
      ${e.actionText ? `<small class="issue-action">\u5904\u7406\u5EFA\u8BAE\uFF1A${i(e.actionText)}</small>` : ""}
    </article>
  `;
}
function Nt(e) {
  return { ok: "\u6B63\u5E38", info: "\u63D0\u793A", warning: "\u9700\u5173\u6CE8", danger: "\u9AD8\u98CE\u9669" }[e] || e;
}
function Pt(e) {
  const t = Number(e.summary.danger || 0), a = Number(e.summary.warning || 0), n = Number(e.summary.info || 0);
  return Math.max(0, 100 - t * 22 - a * 10 - n * 4);
}
function xt(e) {
  if (!e) return "";
  const t = Object.entries(e).slice(0, 8);
  return t.length ? `
    <dl class="risk-data">
      ${t.map(([a, n]) => {
    const s = typeof n == "object" && n !== null ? JSON.stringify(n) : String(n ?? "-");
    return `<div><dt>${i(a)}</dt><dd>${i(s)}</dd></div>`;
  }).join("")}
    </dl>
  ` : "";
}
function At(e) {
  return `
    <article class="risk-check ${e.level}">
      <div class="risk-check-main">
        <span>${i(Nt(e.level))}</span>
        <div>
          <strong>${i(e.title)}</strong>
          <p>${i(e.detail)}</p>
        </div>
      </div>
      ${xt(e.data)}
    </article>
  `;
}
function Et(e) {
  const t = Pt(e), a = t >= 90 ? "ok" : t >= 70 ? "warning" : "danger", n = ["danger", "warning", "info", "ok"].flatMap((s) => e.checks.filter((r) => r.level === s)).map(At).join("");
  return `
    <section class="risk-hero ${a}">
      <div>
        <p class="tag">Risk Control</p>
        <h2>\u751F\u4EA7\u98CE\u63A7\u5DE1\u68C0</h2>
        <p class="meta">\u68C0\u67E5\u65F6\u95F4\uFF1A${i(O(e.checkedAt))} \xB7 \u9AD8\u98CE\u9669 ${e.summary.danger || 0} \xB7 \u9700\u5173\u6CE8 ${e.summary.warning || 0} \xB7 \u63D0\u793A ${e.summary.info || 0}</p>
      </div>
      <div class="risk-score">
        <strong>${t}</strong>
        <span>${t >= 90 ? "\u53EF\u8FD0\u8425" : t >= 70 ? "\u5148\u5904\u7406\u544A\u8B66" : "\u6682\u505C\u63A8\u5E7F"}</span>
      </div>
    </section>
    <section class="risk-summary">
      ${S("\u9AD8\u98CE\u9669", e.summary.danger || 0, "\u9700\u8981\u7ACB\u5373\u5904\u7406", e.summary.danger ? "danger" : "")}
      ${S("\u9700\u5173\u6CE8", e.summary.warning || 0, "\u5EFA\u8BAE\u5F53\u5929\u5904\u7406", e.summary.warning ? "warning" : "")}
      ${S("\u63D0\u793A", e.summary.info || 0, "\u8FD0\u8425\u53C2\u8003\u9879", "")}
      ${S("\u6B63\u5E38\u9879", e.summary.ok || 0, "\u5DE1\u68C0\u901A\u8FC7\u9879\u76EE", "live")}
    </section>
    <section class="panel risk-panel">
      <div class="section-head">
        <div>
          <p class="tag">Checklist</p>
          <h2>\u5DE1\u68C0\u660E\u7EC6</h2>
        </div>
        <button type="button" id="risk-refresh">\u91CD\u65B0\u5DE1\u68C0</button>
      </div>
      <div class="risk-list">
        ${n || '<article class="recon-empty">\u6682\u65E0\u5DE1\u68C0\u6570\u636E</article>'}
      </div>
      <p id="risk-status" class="status"></p>
    </section>
  `;
}
function Bt(e) {
  const t = E(e.uid);
  return `
    <article class="user-card" data-user-card="${t}">
      <div class="user-card-main">
        ${Y(e)}
        <div>
          <strong>${i(e.nickname)}</strong>
          <span>${i(K(e))} \xB7 \u6BB5\u4F4D\uFF1A${i(e.rankName)} \xB7 \u72B6\u6001\uFF1A${e.status === 1 ? "\u6B63\u5E38" : "\u7981\u7528"} \xB7 \u8D44\u6599\uFF1A${e.profileCompleted ? "\u5DF2\u8BBE\u7F6E" : "\u5F85\u8BBE\u7F6E"}</span>
          <small>ID\uFF1A${i(h(e.uid))} \xB7 \u6CE8\u518C\uFF1A${i(e.createdAt || "-")}</small>
        </div>
      </div>
      <div class="user-card-wallet">\u53EF\u7528 ${e.wallet.availableBalance} Pi \xB7 \u51BB\u7ED3 ${e.wallet.lockedBalance} Pi \xB7 \u5145\u503C ${e.wallet.totalRecharge} Pi</div>
      <form class="inline-user-form" data-user-form="${t}">
        <input name="nickname" maxlength="20" value="${E(e.nickname)}" placeholder="\u7528\u6237\u6635\u79F0" />
        <select name="avatarKey">
          ${[1, 2, 3, 4, 5, 6].map((a) => {
    const n = `avatar_${a}`;
    return `<option value="${n}" ${e.avatarKey === n ? "selected" : ""}>\u5934\u50CF${a}</option>`;
  }).join("")}
        </select>
        <select name="status">
          <option value="1" ${e.status === 1 ? "selected" : ""}>\u6B63\u5E38</option>
          <option value="0" ${e.status === 0 ? "selected" : ""}>\u7981\u7528</option>
        </select>
        <button type="submit">\u4FDD\u5B58</button>
      </form>
      <div class="inline-actions">
        <button type="button" data-user-detail="${t}">\u67E5\u770B\u8BE6\u60C5</button>
        <button type="button" data-user-status="${t}" data-next-status="${e.status === 1 ? 0 : 1}" class="${e.status === 1 ? "danger" : ""}">${e.status === 1 ? "\u5C01\u7981\u7528\u6237" : "\u89E3\u5C01\u7528\u6237"}</button>
        <button type="button" data-user-reset-profile="${t}">\u91CD\u7F6E\u8D44\u6599\u5F15\u5BFC</button>
      </div>
    </article>
  `;
}
function Tt(e) {
  const t = e.user, a = E(t.uid), n = N(`user-detail-ledgers-${t.uid}`, e.ledgers);
  return `
    <section class="panel">
      <button type="button" class="back-button" id="back-user-list">\u8FD4\u56DE\u7528\u6237\u5217\u8868</button>
      <div class="user-detail-head">
        ${Y(t)}
        <div>
          <p class="tag">\u7528\u6237\u8BE6\u60C5</p>
          <h2>${i(t.nickname)}</h2>
          <p class="meta">${i(K(t))} \xB7 ${i(h(t.uid))} \xB7 ${t.status === 1 ? "\u6B63\u5E38" : "\u7981\u7528"}</p>
        </div>
      </div>
      <section class="cards compact">
        <article class="metric-card"><h3>\u53EF\u7528\u4F59\u989D</h3><p>${t.wallet.availableBalance}</p></article>
        <article class="metric-card"><h3>\u51BB\u7ED3\u4F59\u989D</h3><p>${t.wallet.lockedBalance}</p></article>
        <article class="metric-card"><h3>\u7D2F\u8BA1\u5145\u503C</h3><p>${t.wallet.totalRecharge}</p></article>
        <article class="metric-card"><h3>\u7D2F\u8BA1\u63D0\u73B0</h3><p>${t.wallet.totalWithdraw}</p></article>
        <article class="metric-card"><h3>\u7D2F\u8BA1\u5956\u52B1</h3><p>${t.wallet.totalReward}</p></article>
        <article class="metric-card"><h3>\u8D44\u6599\u72B6\u6001</h3><p>${t.profileCompleted ? "\u5DF2\u8BBE\u7F6E" : "\u5F85\u8BBE\u7F6E"}</p></article>
      </section>
      <div class="inline-actions">
        <button type="button" data-user-status="${a}" data-next-status="${t.status === 1 ? 0 : 1}" class="${t.status === 1 ? "danger" : ""}">${t.status === 1 ? "\u5C01\u7981\u7528\u6237" : "\u89E3\u5C01\u7528\u6237"}</button>
        <button type="button" data-user-reset-profile="${a}">\u91CD\u7F6E\u8D44\u6599\u5F15\u5BFC</button>
      </div>
      <p id="user-detail-status" class="status"></p>
    </section>
    <section class="panel">
      <h2>\u8BE5\u7528\u6237\u8D44\u4EA7\u6D41\u6C34</h2>
      <div class="table-list">
        ${e.ledgers.length ? n.items.map(Pe).join("") : '<p class="meta">\u6682\u65E0\u6D41\u6C34</p>'}
      </div>
      ${P(`user-detail-ledgers-${t.uid}`, e.ledgers.length)}
    </section>
  `;
}
function Mt(e) {
  return Array.from(e.querySelectorAll("[data-weekly-tier-row]")).map((t) => {
    const a = Number(t.querySelector('[name="weeklyTierFromRank"]')?.value || 0), n = Number(t.querySelector('[name="weeklyTierToRank"]')?.value || 0), s = Number(t.querySelector('[name="weeklyTierAmount"]')?.value || 0);
    return { fromRank: Math.min(a, n), toRank: Math.max(a, n), amount: s };
  }).filter((t) => t.fromRank > 0 && t.toRank > 0 && t.amount > 0).sort((t, a) => t.fromRank - a.fromRank || t.toRank - a.toRank);
}
function qt(e) {
  const t = e.winnerUid ? X({ nickname: e.winnerNickname, piUsername: e.winnerPiUsername, uid: e.winnerUid }) : e.status === "expired" ? "\u7CFB\u7EDF\u8D85\u65F6\u7ED3\u675F" : "\u672A\u7ED3\u675F", a = ce(e), n = e.status !== "finished" && e.status !== "expired" && e.entryFee === 0 && e.isBotRoom, s = e.status !== "finished" && e.status !== "manual_review" && e.status !== "expired";
  return `
    <article class="room-item ${a || e.status === "expired" ? "room-warning" : ""}">
      <h3>${i(e.roomNo)} ${a ? '<span class="status-chip danger">\u7591\u4F3C\u5361\u5C40</span>' : ""}</h3>
      <p>\u72B6\u6001\uFF1A${i(H(e.status))} \xB7 \u6A21\u5F0F\uFF1A${i(oe(e.mode))}${e.isBotRoom ? " \xB7 \u673A\u5668\u4EBA\u5C40" : " \xB7 \u771F\u4EBA\u5C40"}</p>
      <p>\u73A9\u5BB6\uFF1A${i(X({ nickname: e.playerANickname, piUsername: e.playerAPiUsername, uid: e.playerAUid }))} vs ${i(X({ nickname: e.playerBNickname, piUsername: e.playerBPiUsername, uid: e.playerBUid }))}</p>
      <p>\u80DC\u8005\uFF1A${i(t)} \xB7 \u62A5\u540D\u8D39\uFF1A${e.entryFee} \xB7 \u5956\u52B1\uFF1A${e.rewardAmount}</p>
      <p>\u521B\u5EFA\uFF1A${i(e.createdAt || "-")} \xB7 \u7ED3\u675F\uFF1A${i(e.finishedAt || "-")}</p>
      ${n || s ? `<div class="inline-actions">
              ${n ? `<button type="button" data-battle-action="expire_free_bot" data-room-no="${E(e.roomNo)}">\u4F5C\u5E9F\u514D\u8D39\u5F02\u5E38\u5C40</button>` : ""}
              ${s ? `<button type="button" data-battle-action="manual_review" data-room-no="${E(e.roomNo)}" class="danger">\u8F6C\u4EBA\u5DE5\u590D\u6838</button>` : ""}
            </div>` : ""}
    </article>
  `;
}
function Lt(e) {
  return `
    <article class="room-item">
      <h3>${i(e.roomNo)}</h3>
      <p>\u72B6\u6001\uFF1A${i(H(e.status))}</p>
      <p>\u73A9\u5BB6\uFF1A${i(e.players.map(h).join(" vs "))}</p>
      <p>\u80DC\u8005\uFF1A${i(e.winnerUid ? h(e.winnerUid) : "\u672A\u7ED3\u675F")}</p>
    </article>
  `;
}
function Ct(e) {
  return `
    <article class="row-card">
      <strong>${i(Ce(e.action))}</strong>
      <span>\u64CD\u4F5C\u4EBA\uFF1A${i(e.adminUsername || "-")}</span>
      <span>${i(je(e.targetType))}\uFF1A${i(h(e.targetId))}</span>
      <span>${i(O(e.createdAt))}</span>
    </article>
  `;
}
function Ut(e, t, a) {
  const n = document.querySelector("#home-config-form"), s = document.querySelector("#status"), r = document.querySelector("#pi-config-form"), o = document.querySelector("#pi-status"), m = document.querySelector("#password-form"), R = document.querySelector("#password-status"), y = document.querySelector("#game-config-form"), x = document.querySelector("#game-status"), j = document.querySelector("#growth-config-form"), A = document.querySelector("#growth-config-status"), B = document.querySelector("#recharge-bonus-form"), w = document.querySelector("#recharge-bonus-status"), L = document.querySelector("#withdraw-risk-form"), T = document.querySelector("#withdraw-risk-status"), C = document.querySelector("#operation-config-form"), M = document.querySelector("#operation-status");
  m?.addEventListener("submit", async (c) => {
    c.preventDefault();
    const l = new FormData(m), p = String(l.get("newPassword") || ""), u = String(l.get("confirmPassword") || "");
    if (p !== u) {
      R && (R.textContent = "\u4E24\u6B21\u8F93\u5165\u7684\u65B0\u5BC6\u7801\u4E0D\u4E00\u81F4");
      return;
    }
    R && (R.textContent = "\u4FEE\u6539\u4E2D...");
    try {
      await d("/admin-api/auth/change-password", { method: "POST", body: JSON.stringify({ oldPassword: String(l.get("oldPassword") || ""), newPassword: p }) }), localStorage.removeItem("blitz_admin_token"), ae("\u5BC6\u7801\u4FEE\u6539\u6210\u529F\uFF0C\u8BF7\u91CD\u65B0\u767B\u5F55\u3002");
    } catch (b) {
      R && (R.textContent = g(b));
    }
  }), n?.addEventListener("submit", async (c) => {
    c.preventDefault();
    const l = new FormData(n), p = { projectName: String(l.get("projectName") || e.projectName), englishName: String(l.get("englishName") || e.englishName), localizedContent: Ge(l), banners: [{ id: t?.id ?? 1, title: String(l.get("projectName") || e.projectName), subtitle: String(l.get("englishName") || e.englishName), description: String(l.get("bannerDescription") || "") }], announcements: [] };
    s && (s.textContent = "\u4FDD\u5B58\u4E2D...");
    try {
      await d("/admin-api/home-config", { method: "POST", body: JSON.stringify(p) }), s && (s.textContent = "\u4FDD\u5B58\u6210\u529F");
    } catch (u) {
      s && (s.textContent = g(u));
    }
  }), r?.addEventListener("submit", async (c) => {
    c.preventDefault();
    const l = new FormData(r);
    o && (o.textContent = "\u4FDD\u5B58\u4E2D...");
    try {
      await d("/admin-api/pi-config", { method: "POST", body: JSON.stringify({ runtimeMode: String(l.get("runtimeMode") || "production"), sandboxUrl: String(l.get("sandboxUrl") || ""), productionUrl: String(l.get("productionUrl") || "") }) }), o && (o.textContent = "\u4FDD\u5B58\u6210\u529F\uFF0C\u7528\u6237\u7AEF\u5237\u65B0\u540E\u751F\u6548");
    } catch (p) {
      o && (o.textContent = g(p));
    }
  });
  function U(c) {
    return { quickBattle: c.quickBattle || a.quickBattle, ticketBattle: c.ticketBattle || a.ticketBattle, richBattle: c.richBattle || a.richBattle, pointsBattle: c.pointsBattle || a.pointsBattle, pocBattle: c.pocBattle || a.pocBattle, piBattle: c.piBattle || a.piBattle, assetGateway: c.assetGateway || a.assetGateway, timing: c.timing || a.timing, capacity: c.capacity || a.capacity, withdrawRisk: c.withdrawRisk || a.withdrawRisk, rechargeBonus: c.rechargeBonus || a.rechargeBonus, transfer: c.transfer || a.transfer, inviteRewards: c.inviteRewards || a.inviteRewards, engagement: c.engagement || a.engagement, visualEffects: c.visualEffects || a.visualEffects, operation: c.operation || a.operation };
  }
  function J(c) {
    return [0, 1, 2, 3, 4, 5].map((l) => ({ key: String(c.get(`inviteLevelKey${l}`) || "").trim(), name: String(c.get(`inviteLevelName${l}`) || "").trim(), commissionRate: Number(c.get(`inviteLevelRate${l}`) || 0), minBalance: Number(c.get(`inviteLevelMinBalance${l}`) || 0), minDirectInvites: Number(c.get(`inviteLevelMinInvites${l}`) || 0), enabled: String(c.get(`inviteLevelEnabled${l}`)) === "true" })).filter((l) => l.key && l.name);
  }
  function buildEngagementTasks() {
    return Array.from(j?.querySelectorAll("[data-engagement-task-row]") || []).map((c) => ({
      key: String(c.querySelector("[data-engagement-task-key]")?.value || "").trim(),
      title: String(c.querySelector("[data-engagement-task-title]")?.value || "").trim(),
      condition: String(c.querySelector("[data-engagement-task-condition]")?.value || "battle_count"),
      requiredCount: Number(c.querySelector("[data-engagement-task-required]")?.value || 1),
      rewardAmount: Number(c.querySelector("[data-engagement-task-reward]")?.value || 0),
      enabled: String(c.querySelector("[data-engagement-task-enabled]")?.value) === "true",
      modes: Array.from(c.querySelectorAll("input[type=checkbox]:checked")).map((l) => l.value).filter(Boolean)
    })).filter((c) => c.key && c.title);
  }
  function k(c) {
    const l = (u, b) => ({ key: u.key || D.normalTiles[b]?.key || `tile_${b + 1}`, name: String(c.get(`tileName${b}`) || u.name), label: String(c.get(`tileLabel${b}`) || ""), color: String(c.get(`tileColor${b}`) || u.color), textColor: String(c.get(`tileTextColor${b}`) || u.textColor), imageUrl: String(c.get(`tileImageUrl${b}`) || "").trim() }), p = (u, b) => ({ name: String(c.get(`specialTileName_${u}`) || b.name), label: String(c.get(`specialTileLabel_${u}`) || b.label), color: String(c.get(`specialTileColor_${u}`) || b.color), textColor: String(c.get(`specialTileTextColor_${u}`) || b.textColor), imageUrl: String(c.get(`specialTileImageUrl_${u}`) || "").trim() });
    return { enabled: String(c.get("tileThemeEnabled")) !== "false", normalTiles: D.normalTiles.map(l), specialTiles: { horizontal: p("horizontal", D.specialTiles.horizontal), vertical: p("vertical", D.specialTiles.vertical), bomb: p("bomb", D.specialTiles.bomb) } };
  }
  y?.addEventListener("submit", async (c) => {
    c.preventDefault();
    const l = new FormData(y);
    const p = Number(l.get("pointsEntryFee") || 0);
    if (!Number.isInteger(p)) {
      x && (x.textContent = "\u5C0F\u5BCC\u8C6A\u79EF\u5206\u95E8\u7968\u5FC5\u987B\u662F\u6574\u6570\uFF0C\u4E0D\u80FD\u586B\u5C0F\u6570");
      return;
    }
    x && (x.textContent = "\u4FDD\u5B58\u4E2D...");
    try {
      await d("/admin-api/game-config", { method: "POST", body: JSON.stringify(U({ quickBattle: { enabled: String(l.get("quickEnabled")) === "true", entryFee: 0, platformFeeRate: 0, rewardRate: 0, botMatchEnabled: String(l.get("quickBotMatchEnabled")) === "true", botRewardsEnabled: String(l.get("quickBotRewardsEnabled")) === "true" }, pointsBattle: { enabled: String(l.get("pointsEnabled")) === "true", entryFee: Number(l.get("pointsEntryFee") || 0), platformFeeRate: Number(l.get("pointsPlatformFeeRate") || 0), rewardRate: Number(l.get("pointsRewardRate") || 0), assetType: "POINTS", botMatchEnabled: false, botRewardsEnabled: false }, pocBattle: { enabled: String(l.get("pocEnabled")) === "true", entryFee: Number(l.get("pocEntryFee") || 0), platformFeeRate: Number(l.get("pocPlatformFeeRate") || 0), rewardRate: Number(l.get("pocRewardRate") || 0), assetType: "POC", botMatchEnabled: false, botRewardsEnabled: false }, piBattle: { enabled: String(l.get("piBattleEnabled")) === "true", entryFee: Number(l.get("piBattleEntryFee") || 0), platformFeeRate: Number(l.get("piBattlePlatformFeeRate") || 0), rewardRate: Number(l.get("piBattleRewardRate") || 0), assetType: "PI", botMatchEnabled: false, botRewardsEnabled: false }, assetGateway: { enabled: String(l.get("assetGatewayEnabled")) === "true", pointsEnabled: String(l.get("assetGatewayPointsEnabled")) === "true", pocEnabled: String(l.get("assetGatewayPocEnabled")) === "true", summaryEnabled: true, grayUserPiUids: String(l.get("assetGatewayGrayUids") || "").split(/\r?\n|,/).map((p) => p.trim()).filter(Boolean), grayUserPiUsernames: String(l.get("assetGatewayGrayUsernames") || "").split(/\r?\n|,/).map((p) => p.trim()).filter(Boolean) }, timing: { quickBotFallbackSeconds: Number(l.get("quickBotFallbackSeconds") || 30), matchCancelWaitSeconds: Number(l.get("matchCancelWaitSeconds") || 20), matchCancelCooldownSeconds: Number(l.get("matchCancelCooldownSeconds") || 10), waitingReadyTimeoutSeconds: Number(l.get("waitingReadyTimeoutSeconds") || 30), vsIntroSeconds: Number(l.get("vsIntroSeconds") || 5), readyCountdownSeconds: Number(l.get("readyCountdownSeconds") || 6), quickRoundSeconds: Number(l.get("quickRoundSeconds") || 75), paidRoundSeconds: Number(l.get("paidRoundSeconds") || 90), botMoveIntervalSeconds: Number(l.get("botMoveIntervalSeconds") || 2.6) }, capacity: { maxActiveRooms: Number(l.get("maxActiveRooms") || 500), maxQueueLengthPerMode: Number(l.get("maxQueueLengthPerMode") || 2e3), realtimeMaxConnectionsPerInstance: Number(l.get("realtimeMaxConnectionsPerInstance") || 1200), realtimeMaxConnectionsPerUser: Number(l.get("realtimeMaxConnectionsPerUser") || 2), realtimeHeartbeatSeconds: Number(l.get("realtimeHeartbeatSeconds") || 25), realtimeIdleTimeoutSeconds: Number(l.get("realtimeIdleTimeoutSeconds") || 90), realtimeMaxPayloadBytes: Number(l.get("realtimeMaxPayloadBytes") || 2048) }, withdrawRisk: a.withdrawRisk, rechargeBonus: a.rechargeBonus, visualEffects: { defaultMode: String(l.get("effectDefaultMode") || "balanced"), piBrowserDefaultMode: String(l.get("effectPiBrowserDefaultMode") || "balanced"), allowUserChoice: String(l.get("effectAllowUserChoice")) === "true", allowHighMode: true, autoDowngradeEnabled: String(l.get("effectAutoDowngradeEnabled")) === "true", dragTrailEnabled: String(l.get("effectDragTrailEnabled")) === "true", hapticEnabled: String(l.get("effectHapticEnabled")) === "true", attackWarningEnabled: String(l.get("effectAttackWarningEnabled")) === "true", attackWarningText: String(l.get("effectAttackWarningText") || "\u88AB\u653B\u51FB \u538B\u529B+{attack}").trim(), animationDurations: { localBurstSeconds: Number(l.get("effectLocalBurstSeconds") || 0.56), localBurstHighSeconds: Number(l.get("effectLocalBurstHighSeconds") || 0.72), serverBurstSeconds: Number(l.get("effectServerBurstSeconds") || 1.52), serverBurstHighSeconds: Number(l.get("effectServerBurstHighSeconds") || 1.42), lowPerformanceBurstSeconds: Number(l.get("effectLowPerformanceBurstSeconds") || 1.65), boardEffectSeconds: Number(l.get("effectBoardEffectSeconds") || 0.32), boardEffectHighSeconds: Number(l.get("effectBoardEffectHighSeconds") || 0.42), tileBurstSeconds: Number(l.get("effectTileBurstSeconds") || 0.34), tileBurstHighSeconds: Number(l.get("effectTileBurstHighSeconds") || 0.46), tileFallSeconds: Number(l.get("effectTileFallSeconds") || 0.3), tileFallHighSeconds: Number(l.get("effectTileFallHighSeconds") || 0.38), localSwapSeconds: Number(l.get("effectLocalSwapSeconds") || 0.18), invalidSwapSeconds: Number(l.get("effectInvalidSwapSeconds") || 0.26), serverSettleSeconds: Number(l.get("effectServerSettleSeconds") || 0.24), impactSeconds: Number(l.get("effectImpactSeconds") || 0.72), impactHighSeconds: Number(l.get("effectImpactHighSeconds") || 0.92), pressureHitSeconds: Number(l.get("effectPressureHitSeconds") || 0.72), boardUnderAttackSeconds: Number(l.get("effectBoardUnderAttackSeconds") || 0.58), attackLineSeconds: Number(l.get("effectAttackLineSeconds") || 0.78), hitWarningSeconds: Number(l.get("effectHitWarningSeconds") || 0.62) } } })) }), x && (x.textContent = "\u4FDD\u5B58\u6210\u529F\uFF0C\u6B63\u5728\u5237\u65B0..."), await q();
    } catch (p) {
      x && (x.textContent = g(p));
    }
  }), j?.addEventListener("submit", async (c) => {
    c.preventDefault();
    const l = new FormData(j);
    const pointsSignReward = Number(l.get("dailySignInPointsReward") || 0);
    if (!Number.isInteger(pointsSignReward)) {
      A && (A.textContent = "\u7B7E\u5230\u79EF\u5206\u5956\u52B1\u5FC5\u987B\u662F\u6574\u6570");
      return;
    }
    A && (A.textContent = "\u4FDD\u5B58\u4E2D...");
    try {
      await d("/admin-api/game-config", { method: "POST", body: JSON.stringify(U({ transfer: { enabled: String(l.get("transferEnabled")) === "true", minAmount: Number(l.get("transferMinAmount") || 0), maxAmount: Number(l.get("transferMaxAmount") || 0), dailyLimitAmount: Number(l.get("transferDailyLimitAmount") || 0), feeRate: Number(l.get("transferFeeRate") || 0), feeMinAmount: Number(l.get("transferFeeMinAmount") || 0), cooldownSeconds: Number(l.get("transferCooldownSeconds") || 0) }, inviteRewards: { enabled: String(l.get("inviteEnabled")) === "true", bindEnabled: String(l.get("inviteBindEnabled")) === "true", qualificationEnabled: String(l.get("qualificationEnabled")) === "true", qualificationRequiredBattles: Number(l.get("qualificationRequiredBattles") || 2), qualificationRewardAmount: Number(l.get("qualificationRewardAmount") || 0), battleCommissionEnabled: String(l.get("battleCommissionEnabled")) === "true", commissionBase: String(l.get("commissionBase") || "entry_fee") === "platform_fee" ? "platform_fee" : "entry_fee", maxCommissionRate: Number(l.get("maxCommissionRate") || 0), levels: J(l) }, engagement: { enabled: String(l.get("engagementEnabled")) === "true", dailySignIn: { enabled: String(l.get("dailySignInEnabled")) === "true", title: String(l.get("dailySignInTitle") || "\u6BCF\u65E5\u7B7E\u5230"), piRewardEnabled: String(l.get("dailySignInPiRewardEnabled")) === "true", rewardAmount: Number(l.get("dailySignInReward") || 0), pointsRewardEnabled: String(l.get("dailySignInPointsRewardEnabled")) === "true", pointsRewardAmount: pointsSignReward, pocRewardEnabled: String(l.get("dailySignInPocRewardEnabled")) === "true", pocRewardAmount: Number(l.get("dailySignInPocReward") || 0) }, tasks: buildEngagementTasks() } })) }), A && (A.textContent = "\u4FDD\u5B58\u6210\u529F\uFF0C\u6B63\u5728\u5237\u65B0..."), await q();
    } catch (p) {
      A && (A.textContent = g(p));
    }
  }), L?.addEventListener("submit", async (c) => {
    c.preventDefault();
    const l = new FormData(L);
    T && (T.textContent = "\u4FDD\u5B58\u4E2D...");
    try {
      await d("/admin-api/game-config", { method: "POST", body: JSON.stringify(U({ withdrawRisk: { minAmount: Number(l.get("minAmount") || 0), dailyLimitAmount: Number(l.get("dailyLimitAmount") || 0), feeRate: Number(l.get("feeRate") || 0), manualReviewAmount: Number(l.get("manualReviewAmount") || 0), autoApproveEnabled: String(l.get("autoApproveEnabled")) === "true", autoPayoutEnabled: String(l.get("autoPayoutEnabled")) === "true", autoPayoutMaxAmount: Number(l.get("autoPayoutMaxAmount") || 0), autoPayoutDailyLimitAmount: Number(l.get("autoPayoutDailyLimitAmount") || 0), maxRetryCount: Number(l.get("maxRetryCount") || 0), walletValidationRequired: String(l.get("walletValidationRequired")) !== "false", payoutChannel: "stellar_direct" } })) }), T && (T.textContent = "\u4FDD\u5B58\u6210\u529F\uFF0C\u6B63\u5728\u5237\u65B0..."), await q();
    } catch (p) {
      T && (T.textContent = g(p));
    }
  }), B?.addEventListener("submit", async (c) => {
    c.preventDefault();
    const l = new FormData(B);
    w && (w.textContent = "\u4FDD\u5B58\u4E2D...");
    try {
      await d("/admin-api/game-config", { method: "POST", body: JSON.stringify(U({ rechargeBonus: { enabled: String(l.get("rechargeBonusEnabled")) === "true", bonusRate: Number(l.get("rechargeBonusRate") || 0), maxBonusAmount: Number(l.get("rechargeMaxBonusAmount") || 0), presets: [0, 1, 2, 3].map((p) => ({ amount: Number(l.get(`rechargePresetAmount${p}`) || 0), bonusAmount: Number(l.get(`rechargePresetBonus${p}`) || 0), label: String(l.get(`rechargePresetLabel${p}`) || ""), enabled: String(l.get(`rechargePresetEnabled${p}`)) === "true" })) } })) }), w && (w.textContent = "\u4FDD\u5B58\u6210\u529F\uFF0C\u6B63\u5728\u5237\u65B0..."), await q();
    } catch (p) {
      w && (w.textContent = g(p));
    }
  }), C?.addEventListener("submit", async (c) => {
    c.preventDefault();
    const l = new FormData(C), p = Mt(C);
    M && (M.textContent = "\u4FDD\u5B58\u4E2D...");
    try {
      await d("/admin-api/game-config", { method: "POST", body: JSON.stringify(U({ operation: { maintenanceEnabled: String(l.get("maintenanceEnabled")) === "true", maintenanceNotice: String(l.get("maintenanceNotice") || ""), localizedContent: Ve(l), nicknameMinLength: Number(l.get("nicknameMinLength") || 2), nicknameMaxLength: Number(l.get("nicknameMaxLength") || 12), nicknamePattern: String(l.get("nicknamePattern") || ""), bannedWords: String(l.get("bannedWords") || "").split(/\r?\n|,/).map((u) => u.trim()).filter(Boolean), banReasons: String(l.get("banReasons") || "").split(/\r?\n|,/).map((u) => u.trim()).filter(Boolean), avatars: [1, 2, 3, 4, 5, 6].map((u) => ({ key: `avatar_${u}`, name: String(l.get(`avatarName${u}`) || `\u5934\u50CF${u}`), enabled: String(l.get(`avatarEnabled${u}`)) === "true" })), tileTheme: k(l), ranks: [{ key: "bronze", fallbackName: "\u9752\u94DC", fallbackIcon: "\u25C6", fallbackColor: "#b87a45" }, { key: "silver", fallbackName: "\u767D\u94F6", fallbackIcon: "\u25C7", fallbackColor: "#c7d2e2" }, { key: "gold", fallbackName: "\u9EC4\u91D1", fallbackIcon: "\u2726", fallbackColor: "#f2c84b" }, { key: "platinum", fallbackName: "\u94C2\u91D1", fallbackIcon: "\u2727", fallbackColor: "#7fe6ff" }, { key: "diamond", fallbackName: "\u94BB\u77F3", fallbackIcon: "\u2739", fallbackColor: "#b58cff" }, { key: "starlight", fallbackName: "\u661F\u8000", fallbackIcon: "\u2737", fallbackColor: "#e7a6ff" }, { key: "king", fallbackName: "\u738B\u8005", fallbackIcon: "\u265B", fallbackColor: "#ffdc73" }].map((u, b) => ({ key: u.key, name: String(l.get(`rankName${b + 1}`) || u.fallbackName), icon: String(l.get(`rankIcon${b + 1}`) || u.fallbackIcon), color: String(l.get(`rankColor${b + 1}`) || u.fallbackColor), enabled: String(l.get(`rankEnabled${b + 1}`)) === "true" })), rankRules: { starsPerRank: Number(l.get("rankStarsPerRank") || 5), winStars: Number(l.get("rankWinStars") || 1), loseStars: Number(l.get("rankLoseStars") || 1), winStreakBonusEnabled: String(l.get("rankWinStreakBonusEnabled")) === "true", winStreakRequired: Number(l.get("rankWinStreakRequired") || 3), winStreakBonusStars: Number(l.get("rankWinStreakBonusStars") || 1), bronzeProtection: String(l.get("rankBronzeProtection")) === "true", rankedModes: [l.get("rankedModeQuick") ? "quick_battle" : "", l.get("rankedModePoints") ? "points_battle" : "", l.get("rankedModePoc") ? "poc_battle" : "", l.get("rankedModePi") ? "pi_battle" : ""].filter(Boolean), weeklyLeaderboardModes: [l.get("weeklyModeQuick") ? "quick_battle" : "", l.get("weeklyModePoints") ? "points_battle" : "", l.get("weeklyModePoc") ? "poc_battle" : "", l.get("weeklyModePi") ? "pi_battle" : ""].filter(Boolean), quickBattleMaxRankKey: String(l.get("rankQuickBattleMaxRankKey") || "silver"), ticketBattleMaxRankKey: String(l.get("rankTicketBattleMaxRankKey") || "platinum"), richBattleMinRankKey: String(l.get("rankRichBattleMinRankKey") || "platinum"), dailyChestRequiredBattles: Number(l.get("rankDailyChestRequiredBattles") || 3), weeklyAutoSettleEnabled: String(l.get("rankWeeklyAutoSettleEnabled")) === "true", chestRewards: { bronze: Number(l.get("rankChestReward_bronze") || 0), silver: Number(l.get("rankChestReward_silver") || 0), gold: Number(l.get("rankChestReward_gold") || 0), platinum: Number(l.get("rankChestReward_platinum") || 0), diamond: Number(l.get("rankChestReward_diamond") || 0), starlight: Number(l.get("rankChestReward_starlight") || 0), king: Number(l.get("rankChestReward_king") || 0) }, weeklyRewards: { top1: p.find((u) => u.fromRank <= 1 && u.toRank >= 1)?.amount || 0, top2: p.find((u) => u.fromRank <= 2 && u.toRank >= 2)?.amount || 0, top3: p.find((u) => u.fromRank <= 3 && u.toRank >= 3)?.amount || 0, top10: p.find((u) => u.fromRank <= 10 && u.toRank >= 10)?.amount || 0 }, weeklyRewardTiers: p, ruleSummary: String(l.get("rankRuleSummary") || "") } } })) }), M && (M.textContent = "\u4FDD\u5B58\u6210\u529F\uFF0C\u6B63\u5728\u5237\u65B0..."), await q();
    } catch (u) {
      M && (M.textContent = g(u));
    }
  });
}
function jt() {
  const e = document.querySelector("#withdraw-status");
  document.querySelectorAll("[data-withdraw-action]").forEach((t) => {
    t.addEventListener("click", async () => {
      const a = t.dataset.withdrawAction || "", n = t.dataset.orderNo || "", s = document.querySelector(`[data-withdraw-txid="${n}"]`), r = { approve: `/admin-api/withdraw/approve/${encodeURIComponent(n)}`, reject: `/admin-api/withdraw/reject/${encodeURIComponent(n)}`, paid: `/admin-api/withdraw/paid/${encodeURIComponent(n)}` };
      if (r[a]) {
        if (a === "paid") {
          const o = String(s?.value || "").trim();
          if (!o) {
            e && (e.textContent = "\u8BF7\u5148\u586B\u5199\u94FE\u4E0A TXID");
            return;
          }
          if (!window.confirm(`\u786E\u8BA4\u8BE5\u63D0\u73B0\u8BA2\u5355\u5DF2\u94FE\u4E0A\u6253\u6B3E\uFF1F
\u8BA2\u5355\uFF1A${n}
TXID\uFF1A${o}`)) return;
        }
        if (!(a === "reject" && !window.confirm(`\u786E\u8BA4\u62D2\u7EDD\u63D0\u73B0\u8BA2\u5355 ${n} \u5E76\u89E3\u51BB\u7528\u6237\u4F59\u989D\uFF1F`))) {
          e && (e.textContent = "\u5904\u7406\u4E2D...");
          try {
            await d(r[a], { method: "POST", body: JSON.stringify({ txid: s?.value || "", auditRemark: a === "approve" ? "\u540E\u53F0\u5BA1\u6838\u901A\u8FC7" : a === "reject" ? "\u540E\u53F0\u5BA1\u6838\u62D2\u7EDD" : "\u540E\u53F0\u786E\u8BA4\u5DF2\u6253\u6B3E" }) }), e && (e.textContent = "\u64CD\u4F5C\u6210\u529F\uFF0C\u6B63\u5728\u5237\u65B0..."), await q();
          } catch (o) {
            e && (e.textContent = g(o));
          }
        }
      }
    });
  });
}
function It() {
  const e = document.querySelector("#withdraw-refresh"), t = document.querySelector("#withdraw-refresh-status");
  e?.addEventListener("click", async () => {
    e.disabled = true, t && (t.textContent = "\u6B63\u5728\u5237\u65B0\u63D0\u73B0\u961F\u5217...");
    try {
      te = await d("/admin-api/withdraw/ops"), Q && (Q[11] = te.orders), t && (t.textContent = "\u5237\u65B0\u5B8C\u6210"), F();
    } catch (a) {
      t && (t.textContent = g(a)), e.disabled = false;
    }
  });
}
function Dt() {
  const e = document.querySelector("#battle-action-status"), t = document.querySelector("#match-search"), a = document.querySelector("#match-status-filter"), n = document.querySelector("#match-mode-filter");
  t?.addEventListener("input", () => {
    re = t.value, Z["matches-battle"] = 1, F();
  }), a?.addEventListener("change", () => {
    I = a.value, Z["matches-battle"] = 1, F();
  }), n?.addEventListener("change", () => {
    battleModeFilter = n.value, Z["matches-battle"] = 1, F();
  }), document.querySelectorAll("[data-battle-action]").forEach((s) => {
    s.addEventListener("click", async () => {
      const r = s.dataset.roomNo || "", o = s.dataset.battleAction || "";
      if (!r || !o) return;
      const m = o === "expire_free_bot" ? "\u4F5C\u5E9F\u514D\u8D39\u5F02\u5E38\u5C40" : "\u8F6C\u4EBA\u5DE5\u590D\u6838", R = window.prompt(`\u8BF7\u8F93\u5165${m}\u539F\u56E0\uFF1A`, o === "expire_free_bot" ? "\u514D\u8D39\u673A\u5668\u4EBA\u5C40\u8D85\u65F6\u672A\u7ED3\u675F" : "\u5BF9\u5C40\u5F02\u5E38\uFF0C\u9700\u4EBA\u5DE5\u590D\u6838");
      if (!(R === null || !window.confirm(`\u786E\u8BA4${m}\uFF1F
\u623F\u95F4\uFF1A${r}
\u539F\u56E0\uFF1A${R || "-"}`))) {
        e && (e.textContent = "\u5904\u7406\u4E2D..."), s.disabled = true;
        try {
          await d(`/admin-api/battle-rooms/handle/${encodeURIComponent(r)}`, { method: "POST", body: JSON.stringify({ action: o, remark: R }) }), e && (e.textContent = "\u5904\u7406\u6210\u529F\uFF0C\u6B63\u5728\u5237\u65B0..."), await q();
        } catch (y) {
          e && (e.textContent = g(y)), s.disabled = false;
        }
      }
    });
  });
}
function Ft() {
  document.querySelector("#back-user-list")?.addEventListener("click", () => {
    W = null, F();
  }), document.querySelectorAll("[data-user-detail]").forEach((e) => {
    e.addEventListener("click", async () => {
      const t = e.dataset.userDetail || "";
      if (t) {
        e.textContent = "\u52A0\u8F7D\u4E2D...";
        try {
          W = await d(`/admin-api/users/detail/${encodeURIComponent(t)}`), F();
        } catch (a) {
          e.textContent = g(a).slice(0, 12);
        }
      }
    });
  }), document.querySelectorAll("[data-user-reset-profile]").forEach((e) => {
    e.addEventListener("click", async () => {
      const t = e.dataset.userResetProfile || "";
      if (t) {
        e.textContent = "\u5904\u7406\u4E2D...";
        try {
          await d(`/admin-api/users/reset-profile/${encodeURIComponent(t)}`, { method: "POST", body: JSON.stringify({}) }), W = W ? await d(`/admin-api/users/detail/${encodeURIComponent(t)}`) : null, await q();
        } catch (a) {
          e.textContent = g(a).slice(0, 12);
        }
      }
    });
  }), document.querySelectorAll("[data-user-status]").forEach((e) => {
    e.addEventListener("click", async () => {
      const t = e.dataset.userStatus || "", a = Number(e.dataset.nextStatus || 1);
      if (t) {
        e.textContent = "\u5904\u7406\u4E2D...";
        try {
          await d(`/admin-api/users/status/${encodeURIComponent(t)}`, { method: "POST", body: JSON.stringify({ status: a }) }), W = W ? await d(`/admin-api/users/detail/${encodeURIComponent(t)}`) : null, await q();
        } catch (n) {
          e.textContent = g(n).slice(0, 12);
        }
      }
    });
  }), document.querySelectorAll("[data-user-form]").forEach((e) => {
    e.addEventListener("submit", async (t) => {
      t.preventDefault();
      const a = e.dataset.userForm || "", n = new FormData(e), s = e.querySelector("button");
      if (a) {
        s && (s.textContent = "\u4FDD\u5B58\u4E2D...");
        try {
          await d(`/admin-api/users/update/${encodeURIComponent(a)}`, { method: "POST", body: JSON.stringify({ nickname: String(n.get("nickname") || ""), avatarKey: String(n.get("avatarKey") || "avatar_1"), status: Number(n.get("status") || 1) }) }), s && (s.textContent = "\u5DF2\u4FDD\u5B58"), await q();
        } catch (r) {
          s && (s.textContent = g(r).slice(0, 12));
        }
      }
    });
  });
}
async function q() {
  try {
    if (!fe()) {
      ae();
      return;
    }
    st();
    const [e, t, a, n, s, r, o, m, R, y, x, j, A, B, w, L, T, C, M, U, J, k] = await Promise.all([d("/admin-api/auth/me"), d("/admin-api/home-config"), d("/admin-api/pi-config"), d("/admin-api/game-config"), d("/admin-api/dashboard/overview"), d("/admin-api/matches/rooms"), d("/admin-api/payments/orders"), d("/admin-api/users"), d("/admin-api/wallets"), d("/admin-api/wallet-ledgers"), d("/admin-api/battle-rooms"), d("/admin-api/withdraw/orders"), d("/admin-api/reconciliation/report"), d("/admin-api/risk-audit/report"), d("/admin-api/audit-logs"), d("/admin-api/ranks/star-records"), d("/admin-api/ranks/daily-chests"), d("/admin-api/ranks/leaderboard"), d("/admin-api/ranks/weekly-settlements"), d("/admin-api/withdraw/ops").catch(() => null), d("/admin-api/growth/ops").catch(() => null), d("/admin-api/engagement/claims").catch(() => [])]);
    te = U, Ne(e, t, a, n, s, r, o, m, R, y, x, j, A, B, w, L, T, C, M, { ...(J || {}), engagementClaims: k || [] });
  } catch (e) {
    localStorage.removeItem("blitz_admin_token"), ae(`\u540E\u53F0\u52A0\u8F7D\u5931\u8D25\uFF1A${g(e)}`);
  }
}
q();
window.addEventListener("hashchange", () => {
  _ = ge(window.location.hash), F();
});

