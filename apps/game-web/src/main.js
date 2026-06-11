const qa = ["localhost", "127.0.0.1"].includes(window.location.hostname), fn = qa ? "http://localhost:3000" : "https://blitzapi.hashpi.app", Gt = fn, Ia = qa ? Gt.replace(/^http/, "ws").replace(/\/$/, "") + "/ws/" : "wss://blitzapi.hashpi.app/ws/", hn = window.location.hostname === "sandbox.minepi.com", R = document.querySelector("#app");
if (!R) throw new Error("\u672A\u627E\u5230\u5E94\u7528\u6302\u8F7D\u8282\u70B9");
const BRAND_MARK_HTML = '<img class="brand-logo" src="/assets/brand/blitz-logo-128.jpg" alt="" loading="eager" decoding="async" />';
const Da = "blitz_language", Wa = "blitz_visual_effect_mode", INVITE_CODE_STORAGE_KEY = "blitz_pending_invite_code", Jt = ["zh-CN", "en", "vi", "ko", "ja"], ot = ["balanced", "high"];
const INVITE_LIST_PAGE_SIZE = 6;
let inviteRelationPage = 1, inviteIncomePage = 1;
function gn() {
  const e = localStorage.getItem(Da);
  return Jt.includes(e) ? e : "zh-CN";
}
function bn() {
  const e = localStorage.getItem(Wa);
  return ot.includes(e) ? e : "balanced";
}
const Z = ["ruby", "amber", "jade", "aqua", "slate", "gold"], wa = 10, ya = 20, ka = 30, a = { user: null, home: null, wallet: null, rankStatus: null, rankLeaderboard: null, piConfig: null, gameConfig: null, inviteInfo: null, engagement: null, battleHistory: [], battleHistoryPage: 1, battleHistoryTotal: 0, battleHistoryTotalPages: 1, battleHistoryFilter: "all", walletLedgerExpanded: false, walletLedgerPage: 1, walletLedgerFilter: "all", screen: "loading", activePanel: "home", selectedMode: "quick_battle", roomNo: "", roomJoinToken: "", room: null, realtimeRoom: null, result: null, selectedTile: null, tileEffect: null, battleMessage: "", networkStatus: "connecting", networkLatencyMs: 0, vsIntroUntil: 0, lastRoomStateAt: 0, lastSwapSentAt: 0, lastSwapSeq: 0, pendingSwapSeq: 0, pendingSwapPositions: [], pendingSwapQueue: [], clientRoomVersion: 0, clientPredictedBoard: null, clientPredictionStats: { sent: 0, ack: 0, reject: 0, rollback: 0, corrected: 0, longFrames: 0 }, lastSwapPositions: [], battleConnectingAt: 0, battleEnteredAt: 0, feedbackEventId: "", feedback: null, battleBursts: [], battleImpacts: [], localBattleEvents: [], localSwapFx: null, canvasTileBursts: [], matchPollTimer: null, matchUiTimer: null, matchStartedAt: 0, matchWaitingSeconds: 0, matchCanCancel: false, matchCancelMessage: "", matchCancelling: false, matchSessionId: 0, matchPollFailedCount: 0, language: gn(), visualEffectMode: bn(), effectiveVisualEffectMode: "balanced", profileOptions: null, withdrawWallets: [] }, St = [{ code: "zh-CN", flag: "\u{1F1E8}\u{1F1F3}", nativeName: "\u4E2D\u6587", displayName: "\u7B80\u4F53\u4E2D\u6587" }, { code: "en", flag: "\u{1F1FA}\u{1F1F8}", nativeName: "English", displayName: "English" }, { code: "vi", flag: "\u{1F1FB}\u{1F1F3}", nativeName: "Ti\u1EBFng Vi\u1EC7t", displayName: "\u8D8A\u5357\u8BED" }, { code: "ko", flag: "\u{1F1F0}\u{1F1F7}", nativeName: "\uD55C\uAD6D\uC5B4", displayName: "\u97E9\u8BED" }, { code: "ja", flag: "\u{1F1EF}\u{1F1F5}", nativeName: "\u65E5\u672C\u8A9E", displayName: "\u65E5\u8BED" }], $t = { "zh-CN": { languageTitle: "\u9009\u62E9\u8BED\u8A00", languageSummary: "\u5207\u6362\u540E\u4F1A\u7ACB\u5373\u751F\u6548\uFF0C\u5E76\u81EA\u52A8\u8BB0\u4F4F\u4F60\u7684\u9009\u62E9\u3002", languageCancel: "\u53D6\u6D88", homeProjectNameFallback: "Pi\u95EA\u7535\u6218", homeEnglishNameFallback: "BLITZ OF PI", realtimePvp: "\u5B9E\u65F6PVP", match3: "6x8\u4E09\u6D88", piReward: "Pi\u5956\u52B1", gameTips: "\u73A9\u6CD5\u6280\u5DE7", rankBoard: "\u6BB5\u4F4D\u699C", totalPlayers: "\u603B\u73A9\u5BB6", totalBattles: "\u7D2F\u8BA1\u5BF9\u5C40", todayBattles: "\u4ECA\u65E5\u5BF9\u5C40", totalRewards: "\u5DF2\u53D1\u5956\u52B1", practiceMode: "\u7EC3\u624B\u6A21\u5F0F", quickBattle: "\u5FEB\u901F\u5F00\u6218", quickBattleDesc: "\u514D\u8D39\u7EC3\u624B\uFF0C\u4E45\u7B49\u8865\u673A\u5668\u4EBA\u3002", lowEntryReward: "\u4F4E\u95E8\u69DB\u5956\u52B1", ticketBattle: "\u5C0F\u5BCC\u8C6A\u573A", ticketBattleDesc: "\u4F4E\u95E8\u69DB\u771F\u4EBA\u573A\uFF0C\u8BA1\u5165\u5468\u699C\u3002", highPrizePool: "\u9AD8\u5956\u6C60\u523A\u6FC0", richBattle: "\u5927\u5BCC\u8C6A\u573A", richBattleDesc: "\u9AD8\u5956\u6C60\u771F\u4EBA\u573A\uFF0C{rank}\u89E3\u9501\u3002", rankRoute: "\u51B2\u6BB5\u8DEF\u7EBF", quickShort: "\u5FEB\u901F", ticketShort: "\u5C0F\u5BCC\u8C6A", richShort: "\u5927\u5BCC\u8C6A", maintenanceTitle: "\u7EF4\u62A4\u516C\u544A", maintenanceFallback: "\u5E73\u53F0\u7EF4\u62A4\u4E2D\uFF0C\u90E8\u5206\u529F\u80FD\u53EF\u80FD\u6682\u4E0D\u53EF\u7528\u3002", activityFallback: "\u6D3B\u52A8\u516C\u544A", activityDescriptionFallback: "\u5B8C\u6210\u5BF9\u5C40\u3001\u63D0\u5347\u6BB5\u4F4D\uFF0C\u8D62\u53D6 Pi \u5956\u52B1\u3002", ruleSwap: "\u73A9\u6CD5\uFF1A\u4EA4\u6362\u76F8\u90BB\u65B9\u5757\uFF0C\u4E09\u8FDE\u5373\u53EF\u6D88\u9664", ruleCombo: "\u6280\u5DE7\uFF1A\u8FDE\u51FB\u8D8A\u9AD8\uFF0C\u5BF9\u624B\u538B\u529B\u8D8A\u5927", ruleGoal: "\u76EE\u6807\uFF1A90\u79D2\u5185\u6253\u51FA\u66F4\u9AD8\u5206\u6570", chooseBattleMode: "\u9009\u62E9\u5BF9\u6218\u6A21\u5F0F", home: "\u9996\u9875", battle: "\u5F00\u6218", mine: "\u6211\u7684", battleMode: "\u5BF9\u6218\u6A21\u5F0F", chooseModeTitle: "\u9009\u62E9\u5BF9\u6218\u6A21\u5F0F", quickModeDetail: "\u514D\u8D39\u7EC3\u624B\uFF0C\u4E45\u7B49\u8865\u673A\u5668\u4EBA\u3002", ticketModeDetail: "\u4F4E\u95E8\u69DB\u771F\u4EBA\u573A\uFF0C{weekly}", richModeDetail: "\u9AD8\u5956\u6C60\u771F\u4EBA\u573A\uFF0C{rank}\u89E3\u9501\u3002", weeklyOn: "\u8BA1\u5165\u5468\u699C\u5956\u52B1\u3002", weeklyOff: "\u4E0D\u8BA1\u5468\u699C\u3002", richUnlock: " \xB7 {rank}\u89E3\u9501", balanceAndStars: "\u4F59\u989D {balance} Pi \xB7 \u80DC+{win}/\u8D1F-{lose} \xB7 \u9752\u94DC{protection}", protected: "\u6709\u4FDD\u62A4", unprotected: "\u65E0\u4FDD\u62A4" }, en: { languageTitle: "Choose Language", languageSummary: "Changes apply instantly and will be remembered on this device.", languageCancel: "Cancel", homeProjectNameFallback: "Blitz of Pi", homeEnglishNameFallback: "BLITZ OF PI", realtimePvp: "Real-time PVP", match3: "6x8 Match-3", piReward: "Pi Rewards", gameTips: "How to Play", rankBoard: "Rank Board", totalPlayers: "Players", totalBattles: "Battles", todayBattles: "Today", totalRewards: "Rewards Paid", practiceMode: "Practice", quickBattle: "Quick Battle", quickBattleDesc: "Free practice. Bots fill long waits.", lowEntryReward: "Low Entry", ticketBattle: "Small Rich Room", ticketBattleDesc: "Low-entry real-player room.", highPrizePool: "High Prize", richBattle: "Big Rich Room", richBattleDesc: "High-prize room. Unlocks at {rank}.", rankRoute: "Rank Path", quickShort: "Quick", ticketShort: "Small", richShort: "Big", maintenanceTitle: "Maintenance", maintenanceFallback: "The platform is under maintenance. Some features may be unavailable.", activityFallback: "Event", activityDescriptionFallback: "Play battles, climb ranks, and win Pi rewards.", ruleSwap: "Swap adjacent tiles and match 3 to clear.", ruleCombo: "Higher combos create more pressure.", ruleGoal: "Score higher within 90 seconds.", chooseBattleMode: "Choose Battle Mode", home: "Home", battle: "Battle", mine: "Mine", battleMode: "Battle Mode", chooseModeTitle: "Choose Battle Mode", quickModeDetail: "Free practice. Bots fill long waits.", ticketModeDetail: "Low-entry real-player room. {weekly}", richModeDetail: "High-prize room. Unlocks at {rank}.", weeklyOn: "Counts for weekly rewards.", weeklyOff: "Not counted weekly.", richUnlock: " \xB7 {rank} unlock", balanceAndStars: "Bal {balance} Pi \xB7 W+{win}/L-{lose} \xB7 Bronze {protection}", protected: "protected", unprotected: "not protected" }, vi: { languageTitle: "Ch\u1ECDn ng\xF4n ng\u1EEF", languageSummary: "Thay \u0111\u1ED5i c\xF3 hi\u1EC7u l\u1EF1c ngay v\xE0 s\u1EBD \u0111\u01B0\u1EE3c ghi nh\u1EDB.", languageCancel: "H\u1EE7y", homeProjectNameFallback: "Blitz of Pi", homeEnglishNameFallback: "BLITZ OF PI", realtimePvp: "PVP th\u1EDDi gian th\u1EF1c", match3: "6x8 gh\xE9p 3", piReward: "Th\u01B0\u1EDFng Pi", gameTips: "M\u1EB9o ch\u01A1i", rankBoard: "B\u1EA3ng h\u1EA1ng", totalPlayers: "Ng\u01B0\u1EDDi ch\u01A1i", totalBattles: "Tr\u1EADn \u0111\xE3 ch\u01A1i", todayBattles: "H\xF4m nay", totalRewards: "Pi \u0111\xE3 th\u01B0\u1EDFng", practiceMode: "Luy\u1EC7n t\u1EADp", quickBattle: "\u0110\u1EA5u nhanh", quickBattleDesc: "Mi\u1EC5n ph\xED. Tr\u1EADn ng\u01B0\u1EDDi th\u1EADt {cap}; tr\u1EADn bot kh\xF4ng t\xEDnh h\u1EA1ng ho\u1EB7c th\u01B0\u1EDFng tu\u1EA7n.", lowEntryReward: "Ph\xED th\u1EA5p", ticketBattle: "Ph\xF2ng Ti\u1EC3u ph\xFA", ticketBattleDesc: "M\u1ED7i b\xEAn tr\u1EA3 {fee} Pi, ng\u01B0\u1EDDi th\u1EAFng d\u1EF1 ki\u1EBFn nh\u1EADn {reward} Pi, {cap}.", highPrizePool: "Gi\u1EA3i l\u1EDBn", richBattle: "Ph\xF2ng \u0110\u1EA1i ph\xFA", richBattleDesc: "M\u1ED7i b\xEAn tr\u1EA3 {fee} Pi, th\u1EAFng d\u1EF1 ki\u1EBFn nh\u1EADn {reward} Pi, {rank} m\u1EDF kh\xF3a Tinh di\u1EC7u/Vua.", rankRoute: "L\u1ED9 tr\xECnh h\u1EA1ng", quickShort: "Nhanh", ticketShort: "Ti\u1EC3u ph\xFA", richShort: "\u0110\u1EA1i ph\xFA", maintenanceTitle: "B\u1EA3o tr\xEC", maintenanceFallback: "N\u1EC1n t\u1EA3ng \u0111ang b\u1EA3o tr\xEC, m\u1ED9t s\u1ED1 t\xEDnh n\u0103ng c\xF3 th\u1EC3 t\u1EA1m d\u1EEBng.", activityFallback: "S\u1EF1 ki\u1EC7n", activityDescriptionFallback: "Thi \u0111\u1EA5u, leo h\u1EA1ng v\xE0 nh\u1EADn th\u01B0\u1EDFng Pi.", ruleSwap: "\u0110\u1ED5i \xF4 li\u1EC1n k\u1EC1, gh\xE9p 3 \u0111\u1EC3 x\xF3a.", ruleCombo: "Combo c\xE0ng cao, \xE1p l\u1EF1c c\xE0ng l\u1EDBn.", ruleGoal: "Ghi \u0111i\u1EC3m cao h\u01A1n trong 90 gi\xE2y.", chooseBattleMode: "Ch\u1ECDn ch\u1EBF \u0111\u1ED9", home: "Trang ch\u1EE7", battle: "\u0110\u1EA5u", mine: "C\u1EE7a t\xF4i", battleMode: "Ch\u1EBF \u0111\u1ED9 \u0111\u1EA5u", chooseModeTitle: "Ch\u1ECDn ch\u1EBF \u0111\u1ED9", quickModeDetail: "Luy\u1EC7n mi\u1EC5n ph\xED. Tr\u1EADn ng\u01B0\u1EDDi th\u1EADt {cap}; ch\u1EDD l\xE2u c\xF3 th\u1EC3 g\u1EB7p bot v\xE0 kh\xF4ng t\xEDnh h\u1EA1ng/tu\u1EA7n.", ticketModeDetail: "M\u1ED7i b\xEAn tr\u1EA3 {fee} Pi, th\u1EAFng nh\u1EADn {reward} Pi, {cap}, {weekly}", richModeDetail: "M\u1ED7i b\xEAn tr\u1EA3 {fee} Pi, th\u1EAFng nh\u1EADn {reward} Pi, {rank} m\u1EDF kh\xF3a Tinh di\u1EC7u/Vua, {weekly}", weeklyOn: "T\xEDnh th\u01B0\u1EDFng tu\u1EA7n.", weeklyOff: "Kh\xF4ng t\xEDnh tu\u1EA7n.", richUnlock: " \xB7 m\u1EDF \u1EDF {rank}", balanceAndStars: "S\u1ED1 d\u01B0 {balance} Pi; th\u1EAFng +{win} sao, thua -{lose} sao, \u0110\u1ED3ng {protection}.", protected: "\u0111\u01B0\u1EE3c b\u1EA3o v\u1EC7", unprotected: "kh\xF4ng b\u1EA3o v\u1EC7" }, ko: { languageTitle: "\uC5B8\uC5B4 \uC120\uD0DD", languageSummary: "\uBCC0\uACBD \uC989\uC2DC \uC801\uC6A9\uB418\uBA70 \uC774 \uAE30\uAE30\uC5D0 \uC800\uC7A5\uB429\uB2C8\uB2E4.", languageCancel: "\uCDE8\uC18C", homeProjectNameFallback: "Blitz of Pi", homeEnglishNameFallback: "BLITZ OF PI", realtimePvp: "\uC2E4\uC2DC\uAC04 PVP", match3: "6x8 \uB9E4\uCE583", piReward: "Pi \uBCF4\uC0C1", gameTips: "\uD50C\uB808\uC774 \uD301", rankBoard: "\uB7AD\uD0B9", totalPlayers: "\uCD1D \uC720\uC800", totalBattles: "\uB204\uC801 \uB300\uC804", todayBattles: "\uC624\uB298 \uB300\uC804", totalRewards: "\uC9C0\uAE09 \uBCF4\uC0C1", practiceMode: "\uC5F0\uC2B5 \uBAA8\uB4DC", quickBattle: "\uBE60\uB978 \uB300\uC804", quickBattleDesc: "\uBB34\uB8CC \uC785\uC7A5. \uC2E4\uC81C \uC720\uC800 \uB300\uC804\uC740 {cap}; \uBD07 \uB300\uC804\uC740 \uB7AD\uD06C/\uC8FC\uAC04 \uBCF4\uC0C1 \uC81C\uC678.", lowEntryReward: "\uB0AE\uC740 \uCC38\uAC00\uBE44", ticketBattle: "\uC2A4\uBAB0 \uB9AC\uCE58", ticketBattleDesc: "\uC591\uCABD {fee} Pi \uC9C0\uBD88, \uC2B9\uC790 \uC608\uC0C1 {reward} Pi \uD68D\uB4DD, {cap}.", highPrizePool: "\uD070 \uC0C1\uAE08", richBattle: "\uBE45 \uB9AC\uCE58", richBattleDesc: "\uC591\uCABD {fee} Pi \uC9C0\uBD88, \uC2B9\uC790 \uC608\uC0C1 {reward} Pi \uD68D\uB4DD, {rank}\uBD80\uD130 \uC2A4\uD0C0\uB77C\uC774\uD2B8/\uD0B9 \uB3C4\uC804.", rankRoute: "\uB7AD\uD06C \uACBD\uB85C", quickShort: "\uBE60\uB978", ticketShort: "\uC2A4\uBAB0", richShort: "\uBE45", maintenanceTitle: "\uC810\uAC80 \uC548\uB0B4", maintenanceFallback: "\uD50C\uB7AB\uD3FC \uC810\uAC80 \uC911\uC785\uB2C8\uB2E4. \uC77C\uBD80 \uAE30\uB2A5\uC744 \uC0AC\uC6A9\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.", activityFallback: "\uC774\uBCA4\uD2B8", activityDescriptionFallback: "\uB300\uC804\uD558\uACE0 \uB7AD\uD06C\uB97C \uC62C\uB824 Pi \uBCF4\uC0C1\uC744 \uBC1B\uC73C\uC138\uC694.", ruleSwap: "\uC778\uC811 \uBE14\uB85D\uC744 \uBC14\uAFD4 3\uAC1C\uB97C \uB9DE\uCD94\uC138\uC694.", ruleCombo: "\uCF64\uBCF4\uAC00 \uB192\uC744\uC218\uB85D \uC0C1\uB300 \uC555\uBC15\uC774 \uCEE4\uC9D1\uB2C8\uB2E4.", ruleGoal: "90\uCD08 \uC548\uC5D0 \uB354 \uB192\uC740 \uC810\uC218\uB97C \uB0B4\uC138\uC694.", chooseBattleMode: "\uB300\uC804 \uBAA8\uB4DC \uC120\uD0DD", home: "\uD648", battle: "\uB300\uC804", mine: "\uB0B4 \uC815\uBCF4", battleMode: "\uB300\uC804 \uBAA8\uB4DC", chooseModeTitle: "\uB300\uC804 \uBAA8\uB4DC \uC120\uD0BD", quickModeDetail: "\uBB34\uB8CC \uC5F0\uC2B5. \uC2E4\uC81C \uC720\uC800 \uB300\uC804\uC740 {cap}; \uB300\uAE30 \uD6C4 \uBD07 \uB9E4\uCE6D \uAC00\uB2A5\uD558\uBA70 \uB7AD\uD06C/\uC8FC\uAC04 \uC81C\uC678.", ticketModeDetail: "\uC591\uCABD {fee} Pi \uC9C0\uBD88, \uC2B9\uC790 {reward} Pi \uD68D\uB4DD, {cap}, {weekly}", richModeDetail: "\uC591\uCABD {fee} Pi \uC9C0\uBD88, \uC2B9\uC790 {reward} Pi \uD68D\uB4DD, {rank}\uBD80\uD130 \uC2A4\uD0C0\uB77C\uC774\uD2B8/\uD0B9 \uB3C4\uC804, {weekly}", weeklyOn: "\uC8FC\uAC04 \uBCF4\uC0C1 \uBC18\uC601.", weeklyOff: "\uC8FC\uAC04 \uC81C\uC678.", richUnlock: " \xB7 {rank} \uD574\uC81C", balanceAndStars: "\uC794\uC561 {balance} Pi; \uC2B9\uB9AC +{win}\uC131, \uD328\uBC30 -{lose}\uC131, \uBE0C\uB860\uC988 {protection}.", protected: "\uBCF4\uD638", unprotected: "\uBCF4\uD638 \uC5C6\uC74C" }, ja: { languageTitle: "\u8A00\u8A9E\u3092\u9078\u629E", languageSummary: "\u5909\u66F4\u306F\u3059\u3050\u53CD\u6620\u3055\u308C\u3001\u3053\u306E\u7AEF\u672B\u306B\u4FDD\u5B58\u3055\u308C\u307E\u3059\u3002", languageCancel: "\u30AD\u30E3\u30F3\u30BB\u30EB", homeProjectNameFallback: "Blitz of Pi", homeEnglishNameFallback: "BLITZ OF PI", realtimePvp: "\u30EA\u30A2\u30EB\u30BF\u30A4\u30E0PVP", match3: "6x8\u30DE\u30C3\u30C13", piReward: "Pi\u5831\u916C", gameTips: "\u904A\u3073\u65B9", rankBoard: "\u30E9\u30F3\u30AF\u699C", totalPlayers: "\u7DCF\u30D7\u30EC\u30A4\u30E4\u30FC", totalBattles: "\u7D2F\u8A08\u5BFE\u6226", todayBattles: "\u672C\u65E5\u5BFE\u6226", totalRewards: "\u914D\u5E03\u5831\u916C", practiceMode: "\u7DF4\u7FD2\u30E2\u30FC\u30C9", quickBattle: "\u30AF\u30A4\u30C3\u30AF\u5BFE\u6226", quickBattleDesc: "\u7121\u6599\u53C2\u52A0\u3002\u771F\u4EBA\u6226\u306F{cap}\uFF1BBot\u6226\u306F\u30E9\u30F3\u30AF/\u9031\u9593\u5831\u916C\u5BFE\u8C61\u5916\u3002", lowEntryReward: "\u4F4E\u53C2\u52A0\u8CBB", ticketBattle: "\u5C0F\u5BCC\u8C6A\u5834", ticketBattleDesc: "\u53CC\u65B9 {fee} Pi\u3001\u52DD\u8005\u306F\u7D04 {reward} Pi\u3001{cap}\u3002", highPrizePool: "\u9AD8\u8CDE\u91D1", richBattle: "\u5927\u5BCC\u8C6A\u5834", richBattleDesc: "\u53CC\u65B9 {fee} Pi\u3001\u52DD\u8005\u306F\u7D04 {reward} Pi\u3001{rank}\u304B\u3089\u661F\u8000/\u738B\u8005\u3078\u6311\u6226\u3002", rankRoute: "\u30E9\u30F3\u30AF\u9053", quickShort: "\u5FEB\u901F", ticketShort: "\u5C0F\u5BCC\u8C6A", richShort: "\u5927\u5BCC\u8C6A", maintenanceTitle: "\u30E1\u30F3\u30C6\u30CA\u30F3\u30B9", maintenanceFallback: "\u30E1\u30F3\u30C6\u30CA\u30F3\u30B9\u4E2D\u3067\u3059\u3002\u4E00\u90E8\u6A5F\u80FD\u304C\u5229\u7528\u3067\u304D\u306A\u3044\u5834\u5408\u304C\u3042\u308A\u307E\u3059\u3002", activityFallback: "\u30A4\u30D9\u30F3\u30C8", activityDescriptionFallback: "\u5BFE\u6226\u3057\u3066\u30E9\u30F3\u30AF\u3092\u4E0A\u3052\u3001Pi\u5831\u916C\u3092\u7372\u5F97\u3057\u307E\u3057\u3087\u3046\u3002", ruleSwap: "\u96A3\u306E\u30D6\u30ED\u30C3\u30AF\u3092\u5165\u308C\u66FF\u3048\u30013\u3064\u63C3\u3048\u3066\u6D88\u3057\u307E\u3059\u3002", ruleCombo: "\u30B3\u30F3\u30DC\u304C\u9AD8\u3044\u307B\u3069\u76F8\u624B\u3078\u306E\u5727\u529B\u304C\u5897\u3048\u307E\u3059\u3002", ruleGoal: "90\u79D2\u4EE5\u5185\u306B\u3088\u308A\u9AD8\u3044\u30B9\u30B3\u30A2\u3092\u72D9\u3044\u307E\u3059\u3002", chooseBattleMode: "\u5BFE\u6226\u30E2\u30FC\u30C9\u9078\u629E", home: "\u30DB\u30FC\u30E0", battle: "\u5BFE\u6226", mine: "\u30DE\u30A4", battleMode: "\u5BFE\u6226\u30E2\u30FC\u30C9", chooseModeTitle: "\u5BFE\u6226\u30E2\u30FC\u30C9\u9078\u629E", quickModeDetail: "\u7121\u6599\u7DF4\u7FD2\u3002\u771F\u4EBA\u6226\u306F{cap}\uFF1B\u5F85\u6A5F\u5F8C\u306EBot\u6226\u306F\u30E9\u30F3\u30AF/\u9031\u9593\u5BFE\u8C61\u5916\u3002", ticketModeDetail: "\u53CC\u65B9 {fee} Pi\u3001\u52DD\u8005 {reward} Pi\u3001{cap}\u3001{weekly}", richModeDetail: "\u53CC\u65B9 {fee} Pi\u3001\u52DD\u8005 {reward} Pi\u3001{rank}\u304B\u3089\u661F\u8000/\u738B\u8005\u3078\u6311\u6226\u3001{weekly}", weeklyOn: "\u9031\u9593\u5831\u916C\u306B\u53CD\u6620\u3002", weeklyOff: "\u9031\u9593\u5BFE\u8C61\u5916\u3002", richUnlock: " \xB7 {rank}\u3067\u89E3\u653E", balanceAndStars: "\u6B8B\u9AD8 {balance} Pi\uFF1B\u52DD\u5229 +{win} \u661F\u3001\u6557\u5317 -{lose} \u661F\u3001\u30D6\u30ED\u30F3\u30BA\u306F{protection}\u3002", protected: "\u4FDD\u8B77\u3042\u308A", unprotected: "\u4FDD\u8B77\u306A\u3057" } };
document.documentElement.lang = a.language;
const DEFAULT_ANIMATION_DURATIONS = {
  localBurstSeconds: 0.96,
  localBurstHighSeconds: 1.16,
  serverBurstSeconds: 1.52,
  serverBurstHighSeconds: 1.42,
  lowPerformanceBurstSeconds: 1.65,
  boardEffectSeconds: 0.46,
  boardEffectHighSeconds: 0.62,
  tileBurstSeconds: 0.5,
  tileBurstHighSeconds: 0.68,
  tileFallSeconds: 0.3,
  tileFallHighSeconds: 0.38,
  localSwapSeconds: 0.18,
  invalidSwapSeconds: 0.26,
  serverSettleSeconds: 0.24,
  impactSeconds: 0.72,
  impactHighSeconds: 0.92,
  pressureHitSeconds: 0.72,
  boardUnderAttackSeconds: 0.58,
  attackLineSeconds: 0.78,
  hitWarningSeconds: 0.92
};
const DEFAULT_ATTACK_WARNING_TEXT = "\u88AB\u653B\u51FB \u538B\u529B+{attack}";
function normalizeAnimationDurations(e = {}) {
  const t = (r, o = DEFAULT_ANIMATION_DURATIONS[r]) => {
    const s = Number(e?.[r]);
    return Number.isFinite(s) && s >= 0.05 && s <= 3 ? s : o;
  };
  return Object.fromEntries(Object.keys(DEFAULT_ANIMATION_DURATIONS).map((r) => [r, t(r)]));
}
function animationSeconds(e) {
  return ve().animationDurations?.[e] ?? DEFAULT_ANIMATION_DURATIONS[e] ?? 0.3;
}
function animationMs(e, t = 0) {
  return Math.round(animationSeconds(e) * 1e3) + t;
}
function animationMsAtLeast(e, t, r = 0) {
  return Math.max(t, animationMs(e, r));
}
function applyAnimationDurationVars() {
  const e = ve().animationDurations, t = document.documentElement.style, r = a.effectiveVisualEffectMode === "high";
  const o = r ? e.serverBurstHighSeconds : e.serverBurstSeconds, s = r ? e.localBurstHighSeconds : e.localBurstSeconds;
  t.setProperty("--battle-burst-duration", `${o}s`);
  t.setProperty("--battle-burst-ring-duration", `${Math.min(o, 0.72)}s`);
  t.setProperty("--battle-burst-score-duration", `${Math.max(0.12, o - 0.14)}s`);
  t.setProperty("--battle-burst-particle-duration", `${Math.min(o, 0.68)}s`);
  t.setProperty("--battle-burst-local-ring-duration", `${Math.min(s, 0.52)}s`);
  t.setProperty("--tile-burst-duration", `${r ? e.tileBurstHighSeconds : e.tileBurstSeconds}s`);
  t.setProperty("--tile-fall-duration", `${r ? e.tileFallHighSeconds : e.tileFallSeconds}s`);
  t.setProperty("--board-local-swap-duration", `${e.localSwapSeconds}s`);
  t.setProperty("--board-server-settle-duration", `${e.serverSettleSeconds}s`);
  t.setProperty("--board-invalid-swap-duration", `${e.invalidSwapSeconds}s`);
  t.setProperty("--board-clear-duration", `${r ? e.boardEffectHighSeconds : e.boardEffectSeconds}s`);
  t.setProperty("--board-clear-high-duration", `${e.boardEffectHighSeconds}s`);
  t.setProperty("--pressure-hit-duration", `${e.pressureHitSeconds}s`);
  t.setProperty("--board-under-attack-duration", `${e.boardUnderAttackSeconds}s`);
  t.setProperty("--attack-line-duration", `${e.attackLineSeconds}s`);
  t.setProperty("--hit-warning-duration", `${e.hitWarningSeconds}s`);
}
function wn() {
  return St.find((e) => e.code === a.language) || St[0];
}
function n(e, t = {}) {
  const r = $t[a.language]?.[e] || $t["zh-CN"][e] || e;
  return Object.entries(t).reduce((o, [s, l]) => o.replaceAll(`{${s}}`, String(l)), r);
}
function yn(e) {
  a.language = e, localStorage.setItem(Da, e), document.documentElement.lang = e;
}
function ve() {
  const e = (t) => t === "high" ? "high" : "balanced";
  return { defaultMode: e(a.gameConfig?.visualEffects?.defaultMode), piBrowserDefaultMode: e(a.gameConfig?.visualEffects?.piBrowserDefaultMode), allowUserChoice: a.gameConfig?.visualEffects?.allowUserChoice !== false, allowHighMode: true, autoDowngradeEnabled: a.gameConfig?.visualEffects?.autoDowngradeEnabled !== false, dragTrailEnabled: a.gameConfig?.visualEffects?.dragTrailEnabled !== false, hapticEnabled: a.gameConfig?.visualEffects?.hapticEnabled !== false, attackWarningEnabled: a.gameConfig?.visualEffects?.attackWarningEnabled !== false, attackWarningText: String(a.gameConfig?.visualEffects?.attackWarningText || DEFAULT_ATTACK_WARNING_TEXT).trim() || DEFAULT_ATTACK_WARNING_TEXT, animationDurations: normalizeAnimationDurations(a.gameConfig?.visualEffects?.animationDurations) };
}
function extremeRealtimeConfig() {
  const e = a.gameConfig?.extremeRealtime || {};
  return {
    enabled: true,
    enabledModes: ["quick_battle", "points_battle", "poc_battle", "pi_battle"],
    maxPendingSwaps: Math.max(1, Math.min(6, Number(e.maxPendingSwaps || 3))),
    snapshotIntervalMs: Math.max(500, Math.min(1e4, Number(e.snapshotIntervalMs || 2e3))),
    swapMinIntervalMs: Math.max(60, Math.min(500, Number(e.swapMinIntervalMs || 120))),
    metricsSampleRate: Math.max(0, Math.min(1, Number(e.metricsSampleRate ?? 0.05)))
  };
}
function isExtremeRealtimeActive(e = a.realtimeRoom) {
  return Boolean(e && a.user);
}
function resetPredictionState() {
  a.pendingSwapSeq = 0, a.pendingSwapPositions = [], a.pendingSwapQueue = [], a.clientPredictedBoard = null, a.clientRoomVersion = Number(a.realtimeRoom?.version || 0);
}
function Oa(e) {
  const t = ve(), r = Zt() ? t.piBrowserDefaultMode : t.defaultMode;
  return (ot.includes(e) ? e : r) === "high" ? "high" : "balanced";
}
function kn(e) {
  a.visualEffectMode = ot.includes(e) ? e : "balanced", localStorage.setItem(Wa, a.visualEffectMode), Qe();
}
const Y = { "zh-CN": { unknownError: "\u672A\u77E5\u9519\u8BEF", requestFailed: "\u8BF7\u6C42\u5931\u8D25", requestTimeout: "\u7F51\u7EDC\u8D85\u65F6\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5", networkRequestFailed: "\u7F51\u7EDC\u8FDE\u63A5\u5931\u8D25\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5", inProgress: "\u8FDB\u884C\u4E2D", all: "\u5168\u90E8", historyEyebrow: "\u5BF9\u6218\u8BB0\u5F55", battleHistory: "\u5386\u53F2\u5BF9\u6218", totalMatches: "\u5171{total}\u573A", historyPageInfo: "\u7B2C{page}/{totalPages}\u9875 \xB7 \u5171{total}\u573A", emptyHistory: "\u6682\u65E0\u5BF9\u6218\u8BB0\u5F55\uFF0C\u5148\u53BB\u5F00\u4E00\u5C40\u5427\u3002", unknownPlayer: "\u672A\u77E5\u73A9\u5BB6", bot: "\u673A\u5668\u4EBA", opponent: "\u5BF9\u624B", rewardPlus: "\u5956\u52B1 +{amount}", drawRefund: "\u5E73\u5C40\u9000\u56DE {amount}", ticketFee: "\u95E8\u7968 {amount}", freeMatch: "\u514D\u8D39\u5BF9\u5C40", score: "\u6BD4\u5206", prevPage: "\u4E0A\u4E00\u9875", nextPage: "\u4E0B\u4E00\u9875", totalBattleCount: "\u603B\u5BF9\u5C40", pageWins: "\u672C\u9875\u80DC\u573A", pageWinRate: "\u672C\u9875\u80DC\u7387", pageReward: "\u672C\u9875\u5956\u52B1", dailyChest: "\u6BCF\u65E5\u5B9D\u7BB1", rankChest: "\u6BB5\u4F4D\u5B9D\u7BB1", claimedToday: "\u4ECA\u65E5\u5DF2\u9886\u53D6", claimPi: "\u9886\u53D6 {amount} Pi", notReached: "\u672A\u8FBE\u6210", goPlay: "\u53BB\u5B8C\u6210\u5BF9\u5C40", currentRank: "\u5F53\u524D\u6BB5\u4F4D", rankRuleHint: "\u67E5\u770B\u5347\u661F\u3001\u5C01\u9876\u548C\u5956\u52B1\u3002", starProgress: "{stars}/{starsPerRank} \u661F \xB7 \u518D\u8D62 {left} \u661F\u51B2\u4E0B\u4E00\u6BB5", todayChestProgress: "\u5B9D\u7BB1 {done}/{required} \xB7 \u5956 {amount} Pi", chestRuleText: "\u5B8C\u6210 {required} \u573A\u53EF\u9886 {amount} Pi", rules: "\u89C4\u5219", futureRewards: "\u540E\u7EED\u5956\u52B1", rankRewardWall: "\u6BB5\u4F4D\u5956\u52B1\u5899", rankRewardHint: "\u5347\u5230\u66F4\u9AD8\u6BB5\u4F4D\uFF0C\u6BCF\u65E5\u5B9D\u7BB1\u5956\u52B1\u540C\u6B65\u63D0\u5347", expandAll: "\u5168\u90E8\u5C55\u5F00", collapse: "\u6536\u8D77", recentRecords: "\u6700\u8FD1{count}\u6761", walletLedgerPager: "{page}/{totalPages}", playerRank: "\u73A9\u5BB6\u6BB5\u4F4D", loadingDefault: "\u6B63\u5728\u52A0\u8F7D...", errorDefault: "\u9875\u9762\u52A0\u8F7D\u5931\u8D25\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5\u3002", reloadPage: "\u91CD\u65B0\u8FDB\u5165", missingHome: "\u9996\u9875\u6570\u636E\u7F3A\u5931", heroFallback: "\u79FB\u52A8\u7AEF\u5B9E\u65F6\u6D88\u9664\u5BF9\u6218\u6E38\u620F", weeklyReward: "\u5468\u699C\u5956\u52B1", weeklyTitle: "\u672C\u5468\u51B2\u699C", weeklySummary: "\u7EDF\u8BA1 {modes}\uFF0C\u6BCF\u5468\u4E00\u53D1\u5956\u3002", myWeeklyRank: "\u6211\u7684\u5468\u699C\u6392\u540D", weeklyRecord: "\u672C\u5468\u6218\u7EE9", expectedReward: "\u9884\u8BA1\u5956\u52B1", notRanked: "\u672A\u4E0A\u699C", rankHow: "\u4E0A\u699C\u65B9\u5F0F", winPaidMatch: "\u8D62\u4ED8\u8D39\u5C40", emptyLeaderboard: "\u672C\u5468\u6682\u65E0\u4ED8\u8D39\u51B2\u699C\u8BB0\u5F55\uFF0C\u8D62\u4E00\u573A\u5C0F\u5BCC\u8C6A/\u5927\u5BCC\u8C6A\u5373\u53EF\u4E0A\u699C\u3002", leaderboardPager: "{page} / {totalPages} \xB7 \u5171{total}\u4EBA", gotIt: "\u6211\u77E5\u9053\u4E86", rewardNotConfigured: "\u540E\u53F0\u6682\u672A\u914D\u7F6E\u5468\u699C\u5956\u52B1", rewardTiersAria: "\u5468\u699C\u5956\u52B1\u6863\u4F4D", rankSingle: "\u7B2C{rank}\u540D", rankRange: "\u7B2C{from}-{to}\u540D", championPool: "\u51A0\u519B\u5956\u6C60", leaderboardReward: "\u51B2\u699C\u5956\u52B1", listedReward: "\u5165\u699C\u5956\u52B1", champion: "\u51A0\u519B", runnerUp: "\u4E9A\u519B", thirdPlace: "\u5B63\u519B", rankNo: "\u7B2C{rank}\u540D", weeklyMetaReward: "{stars}\u661F \xB7 {wins}\u80DC \xB7 \u5956{amount}", rankMeta: "{stars}\u661F \xB7 {wins}\u80DC", matchCount: "{count}\u573A", winStreakCount: "{count}\u8FDE\u80DC", beginnerTitle: "\u65B0\u624B 15 \u79D2\u770B\u61C2", guideStep1: "\u6ED1\u52A8\u6216\u70B9\u51FB\u4E24\u4E2A\u76F8\u90BB\u65B9\u5757\u4EA4\u6362\u3002", guideStep2: "\u51D1 3 \u4E2A\u540C\u8272\u5C31\u6D88\u9664\u3002", guideStep3: "\u8FDE\u7EED\u6D88\u9664\u4F1A\u6253\u538B\u5BF9\u624B\u3002", guideStep4: "90 \u79D2\u9AD8\u5206\u8D62\uFF0C\u538B\u529B\u6EE1\u4F1A\u8F93\u3002", highScoreTitle: "\u600E\u6837\u6253\u51FA\u9AD8\u5206\uFF1F", basicRules: "\u57FA\u7840\u89C4\u5219", basicRulesText: "\u53EA\u4EA4\u6362\u4E0A\u4E0B\u5DE6\u53F3\u76F8\u90BB\u65B9\u5757\u3002", scoreRules: "\u5F97\u5206\u89C4\u5219", scoreRulesText: "\u6D88\u5F97\u8D8A\u591A\u3001\u8FDE\u9501\u8D8A\u591A\uFF0C\u5206\u8D8A\u9AD8\u3002", attackPressure: "\u653B\u51FB\u538B\u529B", attackPressureText: "\u8FDE\u51FB\u548C\u5927\u6D88\u9664\u4F1A\u7ED9\u5BF9\u624B\u52A0\u538B\u3002", winRule: "\u80DC\u8D1F\u5224\u5B9A", winRuleText: "\u65F6\u95F4\u5230\u6BD4\u5206\u9AD8\u8005\u80DC\uFF1B\u538B\u529B\u6EE1\u63D0\u524D\u8D25\u3002", battleTipsTitle: "\u5B9E\u6218\u6280\u5DE7", battleTipsText: "\u591A\u627E 4 \u8FDE\u548C\u5E95\u90E8\u4EA4\u6362\u3002", battleTypes: "\u5BF9\u5C40\u7C7B\u578B", battleTypesText: "\u5FEB\u901F\u514D\u8D39\u7EC3\uFF1B\u5BCC\u8C6A\u573A\u8D62 Pi\u3002", rankRules: "\u6BB5\u4F4D\u89C4\u5219", starUp: "\u5347\u661F", protection: "\u4FDD\u62A4", winStreak: "\u8FDE\u80DC", validModes: "\u6709\u6548\u573A", quickCap: "\u5FEB\u901F\u5C01\u9876", richCap: "\u5BCC\u8C6A\u5C01\u9876", weeklyBonus: "\u5468\u5956\u52B1", richEntry: "\u5927\u5BCC\u8C6A", note: "\u8BF4\u660E", starRuleText: "\u80DC\u5229 +{win} \u661F\uFF0C\u5931\u8D25 -{lose} \u661F\u3002", bronzeProtectText: "\u9752\u94DC\u6BB5\u5931\u8D25\u4E0D\u6263\u661F\uFF0C\u65B0\u624B\u66F4\u5BB9\u6613\u4E0A\u624B\u3002", noProtectText: "\u6240\u6709\u6BB5\u4F4D\u5931\u8D25\u90FD\u4F1A\u6309\u89C4\u5219\u6263\u661F\u3002", streakEnabledText: "\u8FDE\u7EED\u80DC\u5229 {required} \u573A\uFF0C\u989D\u5916 +{bonus} \u661F\u3002", streakDisabledText: "\u5F53\u524D\u672A\u5F00\u542F\u8FDE\u80DC\u989D\u5916\u52A0\u661F\u3002", validModesText: "{modes} \u8BA1\u6BB5\u4F4D\uFF1B\u6BCF\u65E5 {count} \u573A\u9886\u5B9D\u7BB1\u3002", quickCapText: "\u5FEB\u901F\u573A\u6700\u9AD8\u5230 {rank}\u3002", ticketCapText: "\u5C0F\u5BCC\u8C6A\u6700\u9AD8\u5230 {rank}\uFF1B\u66F4\u9AD8\u8FDB\u5927\u5BCC\u8C6A\u3002", weeklyBonusText: "\u6BCF\u5468\u4E00\u6309 {modes} \u53D1\u5956\u3002", richEntryText: "\u6700\u4F4E {rank} \u6BB5\u4F4D\u53EF\u8FDB\u5165\u3002", ruleSummaryFallback: "\u5FEB\u901F\u7EC3\u624B\uFF0C\u4ED8\u8D39\u573A\u51B2\u6BB5\u3002", rankCurrentTitle: "\u5F53\u524D\u6BB5\u4F4D\uFF1A{rank}", missingUser: "\u7528\u6237\u8D44\u6599\u7F3A\u5931", myRecord: "\u6211\u7684\u6218\u7EE9", playerProfile: "\u73A9\u5BB6\u8D44\u6599", piUsername: "Pi\u7528\u6237\u540D", edit: "\u7F16\u8F91", availableBalance: "\u53EF\u7528\u4F59\u989D", lockedBalance: "\u51BB\u7ED3\u4F59\u989D", totalRecharge: "\u7D2F\u8BA1\u5145\u503C", totalWithdraw: "\u7D2F\u8BA1\u63D0\u73B0", walletLedger: "\u94B1\u5305\u660E\u7EC6", emptyWalletLedger: "\u6682\u65E0\u94B1\u5305\u6D41\u6C34", ledgerBalanceAfter: "\u4F59\u989D", rechargeWallet: "\u5145\u503C\u94B1\u5305", applyWithdraw: "\u7533\u8BF7\u63D0\u73B0", transferBalance: "\u8F6C\u7ED9\u597D\u53CB", inviteFriends: "\u9080\u8BF7\u597D\u53CB", profileSetupTitle: "\u8BBE\u7F6E\u4F60\u7684\u6218\u6597\u540D\u7247", profileEditTitle: "\u7F16\u8F91\u8D44\u6599", profileSetupSummary: "\u9009\u5934\u50CF\u548C\u6635\u79F0\uFF0C\u9A6C\u4E0A\u5F00\u6218\u3002", profileEditSummary: "\u6635\u79F0\u548C\u5934\u50CF\u4F1A\u663E\u793A\u5728\u5BF9\u5C40\u91CC\u3002", walletOverview: "\u94B1\u5305\u603B\u89C8", nicknameLabel: "\u6E38\u620F\u6635\u79F0", nicknameRule: "{min}-{max} \u4E2A\u5B57\u7B26\uFF0C{pattern}\u3002", nicknamePatternFallback: "\u4E2D\u6587\u3001\u82F1\u6587\u3001\u6570\u5B57\u5747\u53EF\uFF0C\u7981\u6B62\u7279\u6B8A\u7B26\u53F7\u548C\u654F\u611F\u8BCD", chooseAvatar: "\u9009\u62E9\u5934\u50CF", saveEnterLobby: "\u4FDD\u5B58\u5E76\u8FDB\u5165\u5927\u5385", saveProfile: "\u4FDD\u5B58\u8D44\u6599", backLobby: "\u8FD4\u56DE\u5927\u5385", savingProfile: "\u6B63\u5728\u4FDD\u5B58\u8D44\u6599...", saveSuccess: "\u4FDD\u5B58\u6210\u529F", sandboxDebug: "\u6C99\u76D2\u8C03\u8BD5", mainnet: "\u6B63\u5F0F\u4E3B\u7F51", wallet: "\u94B1\u5305", rechargeSummary: "{mode} \xB7 \u8F93\u5165 Pi \u6570\u91CF\uFF0C\u652F\u4ED8\u540E\u5165\u8D26\u3002", rechargeAmount: "\u5145\u503C\u6570\u91CF", createRechargeOrder: "\u521B\u5EFA\u5145\u503C\u8BA2\u5355", creatingOrder: "\u6B63\u5728\u521B\u5EFA\u8BA2\u5355...", createOrderFailed: "\u521B\u5EFA\u8BA2\u5355\u5931\u8D25", paymentOrderConflict: "\u5145\u503C\u8BA2\u5355\u5F02\u5E38\u5DF2\u81EA\u52A8\u4FEE\u590D\uFF0C\u8BF7\u91CD\u65B0\u521B\u5EFA\u8BA2\u5355\u3002", rechargeBonusPreview: "\u8D60\u9001 {bonus}\uFF0C\u5230\u8D26 {total}", rechargeNoBonusPreview: "\u5230\u8D26 {total}", rechargePresetTitle: "\u63A8\u8350\u6863\u4F4D", rechargePresetCharge: "\u5145 {amount}", rechargePresetBonus: "\u8D60 {bonus}", rechargePresetCredit: "\u5230\u8D26 {total}", withdrawTitle: "\u7533\u8BF7\u63D0\u73B0", withdrawSummary: "\u53EF\u7528 {balance} Pi \xB7 \u5230\u8D26 {payout} Pi", withdrawAmount: "\u63D0\u73B0\u6570\u91CF", walletAddress: "\u6536\u6B3E\u94B1\u5305\u5730\u5740", walletAddressPlaceholder: "\u7C98\u8D34 G \u5F00\u5934\u4E3B\u7F51\u94B1\u5305\u5730\u5740", walletCheckOk: "\u94B1\u5305\u5730\u5740\u6B63\u5E38", walletCheckInvalid: "\u8BF7\u586B\u5199\u6B63\u786E\u7684 Pi \u4E3B\u7F51\u94B1\u5305\u5730\u5740", withdrawFeePreview: "\u624B\u7EED\u8D39 {fee} Pi\uFF0C\u5230\u8D26 {payout} Pi", savedWallets: "\u5E38\u7528\u5730\u5740", useSavedWallet: "\u4F7F\u7528", savedWalletHint: "\u63D0\u4EA4\u6210\u529F\u540E\u81EA\u52A8\u4FDD\u5B58", submitWithdraw: "\u63D0\u4EA4\u63D0\u73B0\u7533\u8BF7", submittingWithdraw: "\u6B63\u5728\u63D0\u4EA4\u63D0\u73B0\u7533\u8BF7...", withdrawSubmitted: "\u63D0\u73B0\u7533\u8BF7\u5DF2\u63D0\u4EA4\u3002", withdrawPaidSuccess: "\u63D0\u73B0\u5DF2\u81EA\u52A8\u6253\u6B3E\uFF0C\u5230\u8D26 {payout} Pi\u3002", withdrawQueuedSuccess: "\u81EA\u52A8\u63D0\u73B0\u4E2D\uFF0C\u8BF7\u7B49\u5F85\u3002", withdrawReviewSuccess: "\u63D0\u73B0\u5DF2\u63D0\u4EA4\uFF0C\u7B49\u5F85\u590D\u6838\u3002", withdrawAutoFailed: "\u81EA\u52A8\u63D0\u73B0\u4E2D\uFF0C\u8BF7\u7B49\u5F85\u3002", withdrawFailed: "\u63D0\u73B0\u7533\u8BF7\u5931\u8D25", transferTitle: "\u8F6C\u7ED9\u597D\u53CB", transferSummary: "\u8F93\u5165\u5BF9\u65B9 Pi \u7528\u6237\u540D\uFF0C\u4F59\u989D\u5B9E\u65F6\u5230\u8D26\u3002", receiverPiUsername: "\u6536\u6B3E Pi \u7528\u6237\u540D", searchReceiver: "\u641C\u7D22\u7528\u6237", transferAmount: "\u8F6C\u8D26\u6570\u91CF", transferFeePreview: "\u624B\u7EED\u8D39 {fee}\uFF0C\u5230\u8D26 {receive}", confirmTransfer: "\u786E\u8BA4\u8F6C\u8D26", searchingUser: "\u6B63\u5728\u641C\u7D22...", userNotFound: "\u672A\u627E\u5230\u7528\u6237", transferSuccess: "\u8F6C\u8D26\u6210\u529F\uFF0C\u5DF2\u5230\u8D26\u3002", transferFailed: "\u8F6C\u8D26\u5931\u8D25", processing: "\u5904\u7406\u4E2D...", searchInviter: "\u641C\u7D22\u9080\u8BF7\u4EBA", inviterNotFound: "\u672A\u627E\u5230\u9080\u8BF7\u4EBA\uFF0C\u8BF7\u786E\u8BA4 Pi \u7528\u6237\u540D\u3002", inviteBindFailed: "\u7ED1\u5B9A\u5931\u8D25", confirmUserFirst: "\u8BF7\u5148\u641C\u7D22\u5E76\u786E\u8BA4\u7528\u6237\u4FE1\u606F\u3002", confirmInviterFirst: "\u8BF7\u5148\u641C\u7D22\u5E76\u786E\u8BA4\u9080\u8BF7\u4EBA\u3002", selectedUserChanged: "\u7528\u6237\u540D\u5DF2\u53D8\u5316\uFF0C\u8BF7\u91CD\u65B0\u641C\u7D22\u786E\u8BA4\u3002", inviteTitle: "\u9080\u8BF7\u597D\u53CB", bindInviter: "\u7ED1\u5B9A\u9080\u8BF7\u4EBA", inviterPiUsername: "\u9080\u8BF7\u4EBA Pi \u7528\u6237\u540D", bindNow: "\u7ACB\u5373\u7ED1\u5B9A", myInviteLevel: "\u6211\u7684\u7B49\u7EA7", inviteNoLevel: "\u6682\u672A\u8FBE\u6807", inviteCount: "\u5DF2\u9080\u8BF7 {count} \u4EBA", paidCommission: "\u4ED8\u8D39\u63D0\u6210", inviteCommissionRate: "\u63D0\u6210 {rate}%", inviteCtaTitle: "\u9080\u8BF7\u8D5APi", inviteCtaSubtitle: "\u597D\u53CB\u4ED8\u8D39\u5BF9\u6218\uFF0C\u4F60\u62FF\u63D0\u6210", inviteCtaRate: "\u6700\u9AD8 {rate}%", inviteCtaExample: "\u6BCF\u5C40\u53EF\u8D5A {amount}", inviteIncomeTitle: "\u597D\u53CB\u6253\u4ED8\u8D39\u573A\uFF0C\u4F60\u62FF\u63D0\u6210", inviteIncomeSummary: "\u597D\u53CB\u4ED8\u8D39\u5BF9\u6218\uFF0C\u4F60\u6309\u7B49\u7EA7\u62FF\u63D0\u6210\uFF0C\u81EA\u52A8\u8FDB\u4F59\u989D\u3002", inviteIncomeFormula: "\u7B97\u6CD5\uFF1A\u597D\u53CB\u5165\u573A\u8D39 \xD7 \u7B49\u7EA7\u6BD4\u4F8B = \u4F60\u7684\u63D0\u6210", inviteLevelRatesTitle: "\u8D21\u732E\u7B49\u7EA7", inviteExamplesTitle: "\u6536\u76CA\u6848\u4F8B", inviteExampleSmall: "\u6BCF\u5C40 {amount}", inviteExampleRich: "\u6BCF\u5C40 {amount}", inviteTwoFriendsExample: "\u5982\u679C 2 \u4F4D\u597D\u53CB\u6BCF\u5929\u5404\u73A9 5 \u5C40\u5927\u5BCC\u8C6A\uFF0C\u6309\u5F53\u524D\u7B49\u7EA7\u9884\u8BA1 {amount}/\u5929", inviteOnceReward: "\u597D\u53CB\u5B8C\u6210 {battles} \u573A\uFF0C\u518D\u9886 {amount}", inviteUpgradeHint: "\u4F59\u989D\u6216\u9080\u8BF7\u4EBA\u6570\u8FBE\u6807\uFF0C\u81EA\u52A8\u5347\u7EA7\u66F4\u9AD8\u63D0\u6210\u3002", inviteLevelCondition: "\u4F59\u989D\u6EE1\u8DB3{balance} \u6216 \u9080\u8BF7{count}\u4EBA", inviteRelationEyebrow: "\u5173\u7CFB", inviteRelationTitle: "\u6211\u7684\u9080\u8BF7\u5173\u7CFB", inviteParent: "\u6211\u7684\u4E0A\u7EA7", inviteUnbound: "\u6682\u672A\u7ED1\u5B9A", inviteUnboundHint: "\u53EF\u586B\u5199\u9080\u8BF7\u4EBA Pi \u7528\u6237\u540D\u3002", inviteNoChildren: "\u8FD8\u6CA1\u6709\u4E0B\u7EA7\u597D\u53CB\uFF0C\u5148\u9080\u8BF7 1 \u4F4D\u597D\u53CB\u6765\u73A9\u4ED8\u8D39\u573A\u3002", inviteIncomeEyebrow: "\u6536\u76CA", inviteRewardHistoryTitle: "\u9080\u8BF7\u6536\u76CA\u660E\u7EC6", inviteNoIncomeHistory: "\u6682\u65E0\u6536\u76CA\u8BB0\u5F55\u3002\u597D\u53CB\u5B8C\u6210\u4EFB\u52A1\u6216\u53C2\u4E0E\u4ED8\u8D39\u5BF9\u6218\u540E\u4F1A\u663E\u793A\u5728\u8FD9\u91CC\u3002", inviteTotalIncome: "\u7D2F\u8BA1\u6536\u76CA", claimInviteReward: "\u9886\u53D6\u5956\u52B1", noClaimableInviteReward: "\u6682\u65E0\u53EF\u9886\u5956\u52B1", inviteRewardReady: "\u53EF\u9886\u53D6 {amount}", inviteBindSuccess: "\u7ED1\u5B9A\u6210\u529F", inviteClaimSuccess: "\u9886\u53D6\u6210\u529F\uFF0C\u5956\u52B1\u5DF2\u5165\u8D26\u3002", invitedUsers: "\u6211\u7684\u9080\u8BF7", inviteRuleBrief: "\u597D\u53CB\u5B8C\u6210 {battles} \u573A\uFF0C\u4F60\u53EF\u9886 {amount}\u3002", invalidRechargeAmount: "\u8BF7\u8F93\u5165\u6B63\u786E\u7684\u5145\u503C\u6570\u91CF", piPaymentInBrowser: "\u8BF7\u5728 Pi Browser \u4E2D\u5B8C\u6210 Pi \u652F\u4ED8", orderCreated: "\u8BA2\u5355 {orderNo} \u5DF2\u521B\u5EFA\uFF0C\u6B63\u5728\u6253\u5F00 Pi \u652F\u4ED8...", approvingPayment: "\u6B63\u5728\u786E\u8BA4\u652F\u4ED8\u8BA2\u5355...", completingPayment: "\u6B63\u5728\u5B8C\u6210\u94FE\u4E0A\u652F\u4ED8\u5E76\u5165\u8D26...", rechargeSuccess: "\u5145\u503C\u6210\u529F\uFF0C\u94B1\u5305\u4F59\u989D\u5DF2\u66F4\u65B0\u3002", paymentCanceled: "\u4F60\u5DF2\u53D6\u6D88\u672C\u6B21\u652F\u4ED8\uFF0C\u94B1\u5305\u4F59\u989D\u672A\u53D8\u5316\u3002", piPaymentFailed: "Pi \u652F\u4ED8\u5931\u8D25\uFF1A{message}", matchingDefault: "\u6B63\u5728\u5339\u914D\u5BF9\u624B...", canceling: "\u53D6\u6D88\u4E2D...", cancelMatch: "\u53D6\u6D88\u5339\u914D", cancelAfter: "{seconds}s \u540E\u53EF\u53D6\u6D88", canCancelHint: "\u53EF\u53D6\u6D88\uFF0C\u5339\u914D\u6210\u529F\u540E\u4E0D\u53EF\u53D6\u6D88\u3002", lightningMatching: "\u95EA\u7535\u5339\u914D", matching: "\u5339\u914D\u4E2D", waitedSeconds: "\u5DF2\u7B49\u5F85 {seconds} \u79D2", matchingShort: "\u6B63\u5728\u5339\u914D", matchFailed: "\u5339\u914D\u5931\u8D25\uFF0C\u8BF7\u8FD4\u56DE\u540E\u91CD\u8BD5", matchNetworkRetrying: "\u7F51\u7EDC\u6CE2\u52A8\uFF0C\u6B63\u5728\u6062\u590D\u5339\u914D...", waitBeforeCancel: "\u8BF7\u518D\u7B49 {seconds} \u79D2\u540E\u53D6\u6D88", cancelingStatus: "\u6B63\u5728\u53D6\u6D88...", self: "\u4F60", pressureFinish: "{player}\u7684\u538B\u529B\u6761\u5DF2\u6EE1\uFF0C\u672C\u5C40\u63D0\u524D\u7ED3\u675F", timeoutFinish: "\u5BF9\u6218\u65F6\u95F4\u7ED3\u675F\uFF0C\u6309\u5206\u6570\u5224\u5B9A\u80DC\u8D1F", readyTimeoutFinish: "\u5BF9\u624B\u672A\u786E\u8BA4\uFF0C\u5DF2\u81EA\u52A8\u9000\u56DE\u5165\u573A\u8D39", settledFinish: "\u672C\u5C40\u5DF2\u5B8C\u6210\u7ED3\u7B97", emptyLog: "\u6682\u65E0\u6218\u62A5", cleared: "\u6D88\u9664", chain: "\u8FDE\u9501", attack: "\u653B\u51FB", comboFeedback: "{chain}\u8FDE\u51FB +{score}", readyStart: "\u51C6\u5907\u5F00\u6218", startAfterCountdown: "\u5012\u8BA1\u65F6\u7ED3\u675F\u540E\u5F00\u6218", observeBoard: "\u73B0\u5728\u5148\u89C2\u5BDF\u68CB\u76D8\uFF0C\u6682\u65F6\u4E0D\u80FD\u4EA4\u6362", draw: "\u5E73\u5C40", win: "\u80DC\u5229", lose: "\u5931\u8D25", battleSettlement: "\u5BF9\u5C40\u7ED3\u7B97", yourScore: "\u4F60\u7684\u5206\u6570", opponentScore: "\u5BF9\u624B\u5206\u6570", playAgain: "\u518D\u6765\u4E00\u5C40", drawNoStar: "\u5E73\u5C40\u4E0D\u5347\u661F\u4E0D\u6263\u661F", notRankedBattle: "\u672C\u5C40\u4E0D\u8BA1\u5165\u6B63\u5F0F\u6BB5\u4F4D", botPracticeNotRanked: "\u673A\u5668\u4EBA\u5C40\u4E0D\u8BA1\u6BB5\uFF1B\u771F\u4EBA\u5FEB\u901F\u6700\u9AD8 {rank}", modeAtCap: "{mode}\u5DF2\u5C01\u9876\uFF0C\u8BF7\u6362\u66F4\u9AD8\u573A", rankUpEstimate: "\u6BB5\u4F4D\u9884\u8BA1 +{stars} \u661F", bronzeNoLose: "\u9752\u94DC\u4FDD\u62A4\uFF0C\u672C\u5C40\u4E0D\u6263\u661F", rankDownEstimate: "\u6BB5\u4F4D\u9884\u8BA1 -{stars} \u661F", enteringRoom: "\u6B63\u5728\u8FDB\u5165\u5B9E\u65F6\u623F\u95F4...", missingBattlePlayers: "\u5BF9\u5C40\u73A9\u5BB6\u4FE1\u606F\u7F3A\u5931", staleRoomMatched: "\u623F\u95F4\u5DF2\u7ED3\u675F\uFF0C\u8BF7\u91CD\u65B0\u5339\u914D\u3002", room: "\u623F\u95F4", pressureCombo: "\u538B {pressure} / \u8FDE {combo}", pressureComboStatus: "{status} \xB7 \u538B\u529B {pressure}/30 \xB7 \u8FDE\u51FB {combo}", pressureSafe: "\u5F88\u7A33", pressureWarning: "\u6CE8\u610F", pressureDanger: "\u5371\u9669", pressureCritical: "\u5FEB\u6EE1\u4E86", battleEnded: "\u672C\u5C40\u5DF2\u7ED3\u675F", tapToSwap: "\u6ED1\u52A8\u65B9\u5757\u4E09\u6D88\u5F97\u5206", battleHint: "\u4E09\u6D88\u5F97\u5206\uFF0C\u8FDE\u51FB\u538B\u5236\u5BF9\u624B\u3002", battleLog: "\u6218\u62A5", recentSteps: "\u6700\u8FD12\u6B65", restartingMode: "\u6B63\u5728\u91CD\u65B0\u8FDB\u5165{mode}...", resultMissing: "\u7ED3\u7B97\u6570\u636E\u7F3A\u5931", winnerLine: "\u80DC\u8005\uFF1A{name} \uFF5C \u5206\u6570\uFF1A{score}", loserLine: "\u8D25\u8005\uFF1A{name} \uFF5C \u5206\u6570\uFF1A{score}", backHome: "\u8FD4\u56DE\u9996\u9875", roomGoneAlert: "\u623F\u95F4\u5DF2\u7ED3\u675F\uFF0C\u8BF7\u91CD\u65B0\u5339\u914D\u3002", operationFailed: "\u64CD\u4F5C\u5931\u8D25", realtimeError: "\u8FDE\u63A5\u5F02\u5E38\uFF0C\u8BF7\u91CD\u8BD5", reconnecting: "\u5DF2\u65AD\u5F00\uFF0C\u6B63\u5728\u91CD\u8FDE...", realtimeConnectingSlow: "\u8FDE\u63A5\u8F83\u6162\uFF0C\u6B63\u5728\u91CD\u8BD5...", realtimeRetryFailed: "\u8FDE\u63A5\u5931\u8D25\uFF0C\u8BF7\u56DE\u5927\u5385\u91CD\u8BD5\u3002", networkOnline: "\u6D41\u7545", networkSlow: "\u7F51\u7EDC\u504F\u6162", networkReconnecting: "\u91CD\u8FDE\u4E2D", networkOffline: "\u5DF2\u65AD\u5F00", networkConnecting: "\u8FDE\u63A5\u4E2D", matchedVsTitle: "\u5339\u914D\u6210\u529F", matchedVsSubtitle: "\u53CC\u65B9\u5C31\u4F4D\uFF0C\u51C6\u5907\u5F00\u6218", settlementRewardTitle: "\u672C\u5C40\u6536\u76CA", settlementRankTitle: "\u6BB5\u4F4D\u53D8\u5316", settlementWinnerReward: "\u80DC\u65B9\u5956\u52B1 {amount} Pi", settlementEntryFee: "\u5165\u573A\u8D39 {amount} Pi", settlementNoReward: "\u672C\u5C40\u65E0 Pi \u5956\u52B1", settlementScoreGapTitle: "\u5206\u5DEE", settlementScoreGap: "{gap} \u5206", settlementSafeTitle: "\u7ED3\u7B97\u65B9\u5F0F", settlementSafeLabel: "\u81EA\u52A8\u5165\u8D26", newbieTipTitle: "\u65B0\u624B\u653E\u5FC3\u73A9", newbieTipText: "\u5148\u7EC3\u5FEB\u901F\u573A\uFF0C\u987A\u624B\u540E\u518D\u8FDB\u5C0F\u5BCC\u8C6A\u573A\u3002", paidTrustTitle: "\u8D39\u7528\u660E\u7EC6", paidEntryLabel: "\u5165\u573A", paidRewardLabel: "\u80DC\u5956", platformFeeLabel: "\u670D\u52A1\u8D39", realPlayerOnly: "\u771F\u4EBA\u5339\u914D", paidModeRecommend: "\u63A8\u8350", modeEconomyFree: "\u514D\u8D39", modeEconomyTicket: "{fee} \u5165\u573A \xB7 \u80DC\u5956 {reward}", modeEconomyRich: "{fee} \u5165\u573A \xB7 \u80DC\u5956 {reward}", winUpsell: "\u624B\u611F\u6B63\u70ED\uFF0C\u53EF\u4EE5\u53BB\u5C0F\u5BCC\u8C6A\u573A\u51B2\u4E00\u628A\u5956\u52B1\u3002", loseRetryHint: "\u8FD9\u5C40\u5148\u7EC3\u624B\u611F\uFF0C\u4E0B\u4E00\u5C40\u591A\u627E\u5E95\u90E8\u8FDE\u9501\u3002", closeLossHint: "\u53EA\u5DEE {gap} \u5206\uFF0C\u5DF2\u7ECF\u5F88\u63A5\u8FD1\u4E86\u3002", tryPaidMode: "\u6311\u6218\u5C0F\u5BCC\u8C6A\u573A", practiceAgain: "\u7EE7\u7EED\u7EC3\u624B", performanceWarning: "\u8BBE\u5907\u8D1F\u8F7D\u504F\u9AD8\uFF0C\u5DF2\u81EA\u52A8\u964D\u4F4E\u52A8\u753B\u5F3A\u5EA6", visualEffectTitle: "\u753B\u9762\u6548\u679C", visualEffectSummary: "\u5747\u8861\u7A33\u5B9A\uFF0C\u70AB\u5F69\u66F4\u723D\u3002", visualEffectBalanced: "\u5747\u8861", visualEffectHigh: "\u70AB\u5F69", visualEffectLocked: "\u5F53\u524D\u7531\u540E\u53F0\u7EDF\u4E00\u63A7\u5236", visualEffectSaved: "\u5DF2\u5207\u6362\u753B\u9762\u6548\u679C", visualEffectOpen: "\u753B\u9762", visualEffectSheetTitle: "\u753B\u9762\u6548\u679C", waitingBothReady: "\u7B49\u5F85\u53CC\u65B9\u786E\u8BA4", readyConfirmTitle: "\u786E\u8BA4\u51C6\u5907", readyConfirmSubtitle: "\u53CC\u65B9\u51C6\u5907\u540E\u5F00\u59CB\u5012\u8BA1\u65F6\u3002", readySelf: "\u4F60\u5DF2\u51C6\u5907", readyOpponent: "\u5BF9\u624B\u5DF2\u51C6\u5907", readySelfPending: "\u4F60\u672A\u51C6\u5907", readyOpponentPending: "\u7B49\u5F85\u5BF9\u624B", readyButton: "\u6211\u5DF2\u51C6\u5907", readyWaitingOpponent: "\u5DF2\u51C6\u5907\uFF0C\u7B49\u5BF9\u624B...", readyAutoStartHint: "{seconds}s \u540E\u81EA\u52A8\u5F00\u6218", readyTimeoutHint: "{seconds}s \u540E\u672A\u786E\u8BA4\u81EA\u52A8\u9000\u56DE", waitReady: "\u5012\u8BA1\u65F6\u4E2D\uFF0C\u5F00\u6218\u540E\u518D\u4EA4\u6362", waitBothReady: "\u5148\u70B9\u51C6\u5907\uFF0C\u53CC\u65B9\u5C31\u7EEA\u540E\u5F00\u6218", socketNotReady: "\u5B9E\u65F6\u8FDE\u63A5\u672A\u5C31\u7EEA\uFF0C\u8BF7\u7A0D\u540E\u518D\u8BD5", selectNeighbor: "\u8BF7\u9009\u62E9\u76F8\u90BB\u65B9\u5757\u5B8C\u6210\u4EA4\u6362", selectionCanceled: "\u5DF2\u53D6\u6D88\u9009\u62E9", onlyAdjacent: "\u53EA\u80FD\u4EA4\u6362\u4E0A\u4E0B\u5DE6\u53F3\u76F8\u90BB\u65B9\u5757", piSdkMissing: "\u8BF7\u7528 Pi Browser \u6253\u5F00\u3002", piPlayer: "Pi\u73A9\u5BB6", connectingRealtime: "\u6B63\u5728\u5EFA\u7ACB\u5B9E\u65F6\u5BF9\u6218\u8FDE\u63A5...", loginLoading: "\u6B63\u5728\u767B\u5F55 Pi\u95EA\u7535\u6218...", initFailed: "\u521D\u59CB\u5316\u5931\u8D25\uFF1A{message}", roomUnlockHint: "\u8FBE\u5230 {rank} \u89E3\u9501\u5927\u5BCC\u8C6A\u573A\u3002", confirmPaidMode: "\u786E\u8BA4\u8FDB\u5165{mode}\uFF1F", confirmQuickMode: "\u786E\u8BA4\u5FEB\u901F\u5F00\u6218\uFF1F", paidConfirmSummary: "\u5165\u573A {fee} Pi \xB7 \u4F59\u989D {balance} Pi \xB7 \u80DC\u5956 {reward} Pi", quickConfirmSummary: "\u514D\u8D39\u7EC3\u624B\uFF0C\u4E45\u7B49\u8865\u673A\u5668\u4EBA\u3002", ruleSwapShort: "\u771F\u4EBA\u5339\u914D", ruleComboShort: "\u4E09\u6D88\u8FDE\u51FB\u538B\u5236\u5BF9\u624B", rankedModeText: "\u8BA1\u6BB5\u4F4D\uFF0C{cap}", unrankedModeText: "{mode}\u4E0D\u8BA1\u5165\u6B63\u5F0F\u6BB5\u4F4D", weeklyBattleOn: "\u8BA1\u5165\u5468\u699C", weeklyBattleOff: "\u4E0D\u8BA1\u5468\u699C", winLoseStars: "\u80DC\u5229 +{win} \u661F\uFF0C\u5931\u8D25 -{lose} \u661F", insufficientBalance: "\u4F59\u989D\u4E0D\u8DB3\uFF0C\u8BF7\u5148\u5145\u503C\u3002", richRankLocked: "\u8FBE\u5230 {rank} \u540E\u89E3\u9501\u5927\u5BCC\u8C6A\u573A\u3002", confirmPaidStart: "\u786E\u8BA4\u5E76\u5339\u914D", startMatching: "\u5F00\u59CB\u5339\u914D" }, en: {}, vi: {}, ko: {}, ja: {} };
Y.en = { ...Y["zh-CN"], unknownError: "Unknown error", requestFailed: "Request failed", requestTimeout: "Network timeout. Please retry later.", networkRequestFailed: "Network failed. Please retry later.", inProgress: "In progress", all: "All", historyEyebrow: "Battle Records", battleHistory: "Battle History", totalMatches: "{total} matches", historyPageInfo: "Page {page}/{totalPages} \xB7 {total} matches", emptyHistory: "No battles yet. Start one first.", unknownPlayer: "Unknown player", bot: "Bot", opponent: "Opponent", rewardPlus: "Reward +{amount}", drawRefund: "Draw refund {amount}", ticketFee: "Ticket {amount}", freeMatch: "Free battle", score: "Score", prevPage: "Prev", nextPage: "Next", totalBattleCount: "Battles", pageWins: "Page Wins", pageWinRate: "Win Rate", pageReward: "Page Rewards", dailyChest: "Daily Chest", rankChest: "Rank Chest", claimedToday: "Claimed", claimPi: "Claim {amount} Pi", notReached: "Not ready", goPlay: "Play now", inviteTitle: "Invite Friends", bindInviter: "Bind Inviter", inviterPiUsername: "Inviter Pi username", bindNow: "Bind Now", myInviteLevel: "My Level", inviteNoLevel: "Not qualified", inviteCount: "{count} invited", paidCommission: "Paid Commission", inviteCommissionRate: "{rate}% commission", inviteCtaTitle: "Invite & Earn", inviteCtaSubtitle: "Friends play paid battles, you earn", inviteCtaRate: "Up to {rate}%", inviteCtaExample: "Earn {amount}/battle", inviteIncomeTitle: "Earn when friends play", inviteIncomeSummary: "Friends play paid battles. You earn by level, paid into balance.", inviteIncomeFormula: "Formula: friend entry fee x level rate = your commission", inviteLevelRatesTitle: "Levels", inviteExamplesTitle: "Examples", inviteExampleSmall: "{amount}/battle", inviteExampleRich: "{amount}/battle", inviteTwoFriendsExample: "If 2 friends each play 5 Big Rich battles daily, estimated {amount}/day.", inviteOnceReward: "Friend completes {battles} battles, claim {amount}", inviteUpgradeHint: "Balance or invite count unlocks higher commission.", inviteLevelCondition: "Balance {balance}+ or invite {count}", inviteRelationEyebrow: "Relation", inviteRelationTitle: "Invite Relations", inviteParent: "My Inviter", inviteUnbound: "Not bound", inviteUnboundHint: "Enter inviter Pi username.", inviteNoChildren: "No invited friends yet. Invite one to play paid battles.", inviteIncomeEyebrow: "Income", inviteRewardHistoryTitle: "Invite Income", inviteNoIncomeHistory: "No income yet. It appears after friends complete tasks or paid battles.", inviteTotalIncome: "Total Income", claimInviteReward: "Claim Reward", noClaimableInviteReward: "No reward yet", inviteRewardReady: "Claim {amount}", inviteBindSuccess: "Bound successfully", inviteClaimSuccess: "Claimed. Reward added to balance.", invitedUsers: "My Invites", inviteRuleBrief: "Friend completes {battles} battles, you claim {amount}.", searchInviter: "Search Inviter", inviterNotFound: "Inviter not found. Check the Pi username.", inviteBindFailed: "Bind failed", confirmUserFirst: "Search and confirm the user first.", confirmInviterFirst: "Search and confirm the inviter first.", selectedUserChanged: "Username changed. Search again to confirm.", currentRank: "Current Rank", rankRuleHint: "View stars, caps, and rewards.", starProgress: "{stars}/{starsPerRank} stars \xB7 win {left} more to rank up", todayChestProgress: "Chest {done}/{required} \xB7 {amount} Pi", chestRuleText: "Play {required} battles to claim {amount} Pi.", rules: "Rules", futureRewards: "Next Rewards", rankRewardWall: "Rank Reward Wall", rankRewardHint: "Higher ranks unlock higher daily chest rewards.", expandAll: "Expand all", collapse: "Collapse", recentRecords: "Recent {count}", walletLedgerPager: "{page}/{totalPages}", playerRank: "Player Rank", loadingDefault: "Loading...", errorDefault: "Page failed to load. Please try again.", reloadPage: "Reload", missingHome: "Home data missing", heroFallback: "Real-time mobile match-3 battle game", weeklyReward: "Weekly Rewards", weeklyTitle: "Weekly Push", weeklySummary: "{modes} count. Paid every Monday.", myWeeklyRank: "My Weekly Rank", weeklyRecord: "Weekly Record", expectedReward: "Estimated Reward", notRanked: "Not ranked", rankHow: "How to Rank", winPaidMatch: "Win paid battles", emptyLeaderboard: "No paid ranked records this week. Win one Small/Big Rich battle to rank.", leaderboardPager: "{page} / {totalPages} \xB7 {total} players", gotIt: "Got it", rewardNotConfigured: "Weekly rewards are not configured yet", rewardTiersAria: "Weekly reward tiers", rankSingle: "No.{rank}", rankRange: "No.{from}-{to}", championPool: "Champion Pool", leaderboardReward: "Rank Reward", listedReward: "Listed Reward", champion: "Champion", runnerUp: "Runner-up", thirdPlace: "Third", rankNo: "No.{rank}", weeklyMetaReward: "{stars} stars \xB7 {wins} wins \xB7 {amount}", rankMeta: "{stars} stars \xB7 {wins} wins", matchCount: "{count} battles", winStreakCount: "{count} streak", beginnerTitle: "Learn in 15 Seconds", guideStep1: "Tap two adjacent tiles.", guideStep2: "Match 3 same colors.", guideStep3: "Combos pressure opponents.", guideStep4: "High score wins in 90s.", highScoreTitle: "How to Score Higher", basicRules: "Basic Rules", basicRulesText: "Only adjacent tiles can swap.", scoreRules: "Scoring", scoreRulesText: "More clears and chains mean more score.", attackPressure: "Attack Pressure", attackPressureText: "Combos and big clears add pressure.", winRule: "Win Rules", winRuleText: "High score wins; full pressure loses early.", battleTipsTitle: "Battle Tips", battleTipsText: "Look for 4-matches and bottom swaps.", battleTypes: "Battle Types", battleTypesText: "Quick is free. Rich rooms win Pi.", rankRules: "Rank Rules", starUp: "Stars", protection: "Protection", winStreak: "Streak", validModes: "Valid Modes", quickCap: "Quick Cap", richCap: "Rich Cap", weeklyBonus: "Weekly Bonus", richEntry: "Big Rich", note: "Note", starRuleText: "Win +{win} stars, lose -{lose} stars.", bronzeProtectText: "Bronze losses do not deduct stars.", noProtectText: "All ranks lose stars by rules.", streakEnabledText: "Win {required} in a row to gain +{bonus} extra stars.", streakDisabledText: "Win-streak bonus is disabled.", validModesText: "{modes} count. {count} daily battles for chest.", quickCapText: "Quick caps at {rank}.", ticketCapText: "Small Rich caps at {rank}; higher needs Big Rich.", weeklyBonusText: "{modes} rewards every Monday.", richEntryText: "Minimum rank required: {rank}.", ruleSummaryFallback: "Quick for practice. Paid rooms for rank.", rankCurrentTitle: "Current Rank: {rank}", missingUser: "User profile missing", myRecord: "My Record", playerProfile: "Player Profile", piUsername: "Pi Username", edit: "Edit", availableBalance: "Available", lockedBalance: "Locked", totalRecharge: "Recharged", totalWithdraw: "Withdrawn", walletLedger: "Wallet Details", emptyWalletLedger: "No wallet records", ledgerBalanceAfter: "Balance", rechargeWallet: "Recharge", applyWithdraw: "Withdraw", profileSetupTitle: "Set Your Battle Card", profileEditTitle: "Edit Profile", profileSetupSummary: "Pick avatar and nickname, then battle.", profileEditSummary: "Nickname and avatar show in battle.", walletOverview: "Wallet Overview", nicknameLabel: "Nickname", nicknameRule: "{min}-{max} chars. {pattern}.", nicknamePatternFallback: "Letters, numbers, and Chinese are allowed. No sensitive words.", chooseAvatar: "Choose Avatar", saveEnterLobby: "Save and Enter", saveProfile: "Save Profile", backLobby: "Back to Lobby", savingProfile: "Saving profile...", saveSuccess: "Saved", sandboxDebug: "Sandbox", mainnet: "Mainnet", wallet: "Wallet", rechargeSummary: "{mode} \xB7 Enter Pi amount. Auto credited.", rechargeAmount: "Amount", createRechargeOrder: "Create Order", creatingOrder: "Creating order...", createOrderFailed: "Failed to create order", paymentOrderConflict: "Payment order was refreshed. Please create a new order.", rechargeBonusPreview: "Bonus {bonus}. Credit {total}.", rechargeNoBonusPreview: "Credit {total}.", rechargePresetTitle: "Recommended", rechargePresetCharge: "Pay {amount}", rechargePresetBonus: "Bonus {bonus}", rechargePresetCredit: "Credit {total}", withdrawTitle: "Withdraw", withdrawSummary: "Available {balance} Pi. Receive {payout} Pi.", withdrawAmount: "Amount", walletAddress: "Wallet Address", walletAddressPlaceholder: "Mainnet address starting with G", walletCheckOk: "Wallet address looks good", walletCheckInvalid: "Enter a valid Pi mainnet wallet address", withdrawFeePreview: "Fee {fee} Pi. Receive {payout} Pi.", savedWallets: "Saved wallets", useSavedWallet: "Use", savedWalletHint: "Saved after successful submission", submitWithdraw: "Submit Withdrawal", submittingWithdraw: "Submitting withdrawal...", withdrawSubmitted: "Withdrawal submitted.", withdrawPaidSuccess: "Withdrawal paid. Received {payout} Pi.", withdrawQueuedSuccess: "Auto withdrawal is processing. Please wait.", withdrawReviewSuccess: "Withdrawal submitted for review.", withdrawAutoFailed: "Auto withdrawal is processing. Please wait.", withdrawFailed: "Withdrawal failed", invalidRechargeAmount: "Please enter a valid recharge amount", piPaymentInBrowser: "Please complete Pi payment in Pi Browser", orderCreated: "Order {orderNo} created. Opening Pi payment...", approvingPayment: "Approving payment...", completingPayment: "Completing on-chain payment...", rechargeSuccess: "Recharge successful. Wallet updated.", paymentCanceled: "Payment canceled. Wallet unchanged.", piPaymentFailed: "Pi payment failed: {message}", matchingDefault: "Matching opponent...", canceling: "Canceling...", cancelMatch: "Cancel Match", cancelAfter: "Cancel in {seconds}s", canCancelHint: "Cancelable now. Cannot cancel after matched.", lightningMatching: "Blitz Matching", matching: "Matching", waitedSeconds: "Waited {seconds}s", matchingShort: "Matching", matchFailed: "Match failed. Please go back and retry.", matchNetworkRetrying: "Network is unstable. Restoring match...", waitBeforeCancel: "Please wait {seconds}s before canceling", cancelingStatus: "Canceling...", self: "You", pressureFinish: "{player}'s pressure is full. Battle ended early.", timeoutFinish: "Time is up. Winner decided by score.", readyTimeoutFinish: "Opponent was not ready. Entry refunded.", settledFinish: "Battle settled.", emptyLog: "No battle log", cleared: "Clear", chain: "Chain", attack: "Attack", comboFeedback: "{chain} Combo +{score}", readyStart: "Ready", startAfterCountdown: "Battle starts after countdown", observeBoard: "Observe the board. Swaps are locked now.", draw: "Draw", win: "Victory", lose: "Defeat", battleSettlement: "Battle Result", yourScore: "Your Score", opponentScore: "Opponent Score", playAgain: "Play Again", drawNoStar: "Draw: no star changes", notRankedBattle: "This battle does not affect rank", botPracticeNotRanked: "Bots do not rank. Real Quick caps at {rank}.", modeAtCap: "{mode} capped. Switch higher.", rankUpEstimate: "Rank estimate +{stars} stars", bronzeNoLose: "Bronze protection: no star loss", rankDownEstimate: "Rank estimate -{stars} stars", enteringRoom: "Entering realtime room...", missingBattlePlayers: "Battle players missing", staleRoomMatched: "Room ended. Match again.", room: "Room", pressureCombo: "P {pressure} / C {combo}", pressureComboStatus: "{status} \xB7 Pressure {pressure}/30 \xB7 Combo {combo}", pressureSafe: "Stable", pressureWarning: "Watch it", pressureDanger: "Danger", pressureCritical: "Almost full", battleEnded: "Battle Ended", tapToSwap: "Swipe/tap to swap", battleHint: "Match 3 to score. Chains pressure your opponent.", battleLog: "Log", recentSteps: "Last 2", restartingMode: "Re-entering {mode}...", resultMissing: "Result data missing", winnerLine: "Winner: {name} | Score: {score}", loserLine: "Loser: {name} | Score: {score}", backHome: "Back Home", roomGoneAlert: "Room ended. Match again.", operationFailed: "Operation failed", realtimeError: "Connection error. Retry.", reconnecting: "Disconnected. Reconnecting...", realtimeConnectingSlow: "Slow connection. Retrying...", realtimeRetryFailed: "Connection failed. Return and retry.", networkOnline: "Realtime OK", networkSlow: "Network slow", networkReconnecting: "Reconnecting", networkOffline: "Offline", networkConnecting: "Connecting", matchedVsTitle: "Matched", matchedVsSubtitle: "Both players ready", settlementRewardTitle: "Reward", settlementRankTitle: "Rank Change", settlementWinnerReward: "Winner reward {amount} Pi", settlementEntryFee: "Entry fee {amount} Pi", settlementNoReward: "No Pi reward", settlementScoreGapTitle: "Score Gap", settlementScoreGap: "{gap} pts", settlementSafeTitle: "Settlement", settlementSafeLabel: "Auto wallet", newbieTipTitle: "New player friendly", newbieTipText: "Practice first. Enter paid mode when ready.", paidTrustTitle: "Fee Details", paidEntryLabel: "Entry", paidRewardLabel: "Win", platformFeeLabel: "Fee", realPlayerOnly: "Real-player priority", paidModeRecommend: "Recommended", modeEconomyFree: "Free", modeEconomyTicket: "{fee} entry \xB7 Win {reward}", modeEconomyRich: "{fee} entry \xB7 Win {reward}", winUpsell: "You are hot. Try a paid battle for rewards.", loseRetryHint: "Practice one more and look for bottom combos.", closeLossHint: "Only {gap} pts away. Very close.", tryPaidMode: "Try Ticket Battle", practiceAgain: "Practice Again", performanceWarning: "Device load is high. Effects reduced.", visualEffectTitle: "Visual Effects", visualEffectSummary: "Balanced is stable. High feels richer.", visualEffectBalanced: "Balanced", visualEffectHigh: "High", visualEffectLocked: "Controlled by platform", visualEffectSaved: "Effects updated", visualEffectOpen: "Effects", visualEffectSheetTitle: "Visual Effects", waitingBothReady: "Waiting for both players", readyConfirmTitle: "Ready Check", readyConfirmSubtitle: "Countdown starts when both are ready.", readySelf: "You ready", readyOpponent: "Opponent ready", readySelfPending: "You not ready", readyOpponentPending: "Waiting opponent", readyButton: "Ready", readyWaitingOpponent: "Ready. Waiting...", readyAutoStartHint: "Auto starts in {seconds}s", readyTimeoutHint: "Refunds in {seconds}s", waitReady: "Countdown. Swap after start.", waitBothReady: "Tap ready first.", socketNotReady: "Realtime connection not ready. Try later.", selectNeighbor: "Select a neighboring tile to swap.", selectionCanceled: "Selection canceled", onlyAdjacent: "Only up/down/left/right adjacent tiles can swap.", piSdkMissing: "Open with Pi Browser.", piPlayer: "Pi Player", connectingRealtime: "Connecting realtime battle...", loginLoading: "Logging in to Blitz of Pi...", initFailed: "Initialization failed: {message}", roomUnlockHint: "Big Rich unlocks at {rank}.", confirmPaidMode: "Enter {mode}?", confirmQuickMode: "Start Quick Battle?", paidConfirmSummary: "Entry {fee} Pi \xB7 Balance {balance} Pi \xB7 Win {reward} Pi", quickConfirmSummary: "Free practice. Bots fill long waits.", ruleSwapShort: "Real-player priority", ruleComboShort: "Combos pressure opponent", rankedModeText: "Ranked, {cap}", unrankedModeText: "{mode} does not affect rank", weeklyBattleOn: "Weekly counted", weeklyBattleOff: "No weekly", winLoseStars: "Win +{win} stars, lose -{lose} stars", insufficientBalance: "Insufficient balance. Recharge first.", richRankLocked: "Big Rich unlocks at {rank}.", confirmPaidStart: "Confirm Match", startMatching: "Start Matching" };
Y.vi = { ...Y.en, languageTitle: "Ch\u1ECDn ng\xF4n ng\u1EEF", home: "Trang ch\u1EE7", battle: "\u0110\u1EA5u", mine: "C\u1EE7a t\xF4i", quickBattle: "\u0110\u1EA5u nhanh", ticketBattle: "Ph\xF2ng Ti\u1EC3u ph\xFA", richBattle: "Ph\xF2ng \u0110\u1EA1i ph\xFA", gameTips: "M\u1EB9o ch\u01A1i", rankBoard: "B\u1EA3ng h\u1EA1ng", wallet: "V\xED", rechargeWallet: "N\u1EA1p v\xED", applyWithdraw: "R\xFAt Pi", matching: "\u0110ang gh\xE9p", win: "Th\u1EAFng", lose: "Thua", draw: "H\xF2a", backLobby: "V\u1EC1 s\u1EA3nh", backHome: "V\u1EC1 trang ch\u1EE7", gotIt: "\u0110\xE3 hi\u1EC3u", cancelMatch: "H\u1EE7y gh\xE9p", playAgain: "Ch\u01A1i l\u1EA1i", playerProfile: "H\u1ED3 s\u01A1", battleHistory: "L\u1ECBch s\u1EED \u0111\u1EA5u", rankRules: "Lu\u1EADt h\u1EA1ng", score: "T\u1EF7 s\u1ED1", readyStart: "S\u1EB5n s\xE0ng", waitingBothReady: "Ch\u1EDD hai b\xEAn s\u1EB5n s\xE0ng", readyConfirmTitle: "X\xE1c nh\u1EADn s\u1EB5n s\xE0ng", readyConfirmSubtitle: "\u0110\u1EBFm ng\u01B0\u1EE3c b\u1EAFt \u0111\u1EA7u khi c\u1EA3 hai ng\u01B0\u1EDDi ch\u01A1i x\xE1c nh\u1EADn.", readySelf: "B\u1EA1n \u0111\xE3 s\u1EB5n s\xE0ng", readyOpponent: "\u0110\u1ED1i th\u1EE7 \u0111\xE3 s\u1EB5n s\xE0ng", readySelfPending: "B\u1EA1n ch\u01B0a s\u1EB5n s\xE0ng", readyOpponentPending: "Ch\u1EDD \u0111\u1ED1i th\u1EE7", readyButton: "T\xF4i s\u1EB5n s\xE0ng", readyWaitingOpponent: "\u0110\xE3 s\u1EB5n s\xE0ng, \u0111ang ch\u1EDD \u0111\u1ED1i th\u1EE7...", waitBothReady: "H\xE3y x\xE1c nh\u1EADn s\u1EB5n s\xE0ng tr\u01B0\u1EDBc.", startAfterCountdown: "B\u1EAFt \u0111\u1EA7u sau \u0111\u1EBFm ng\u01B0\u1EE3c", notRankedBattle: "Tr\u1EADn n\xE0y kh\xF4ng \u1EA3nh h\u01B0\u1EDFng h\u1EA1ng", botPracticeNotRanked: "Tr\u1EADn bot kh\xF4ng t\xEDnh h\u1EA1ng. \u0110\u1EA5u nhanh ng\u01B0\u1EDDi th\u1EADt c\xF3 th\u1EC3 l\xEAn t\u1EDBi {rank}.", validModesText: "{modes} t\xEDnh h\u1EA1ng. M\u1ED7i ng\xE0y \u0111\u1EE7 {count} tr\u1EADn h\u1EE3p l\u1EC7 c\xF3 th\u1EC3 nh\u1EADn r\u01B0\u01A1ng.", quickCapText: "N\u1EBFu \u0110\u1EA5u nhanh \u0111\u01B0\u1EE3c b\u1EADt t\xEDnh h\u1EA1ng, ch\u1EC9 c\xF3 th\u1EC3 l\xEAn t\u1EDBi {rank}; sau \u0111\xF3 c\u1EA7n v\xE0o ph\xF2ng tr\u1EA3 ph\xED.", ticketCapText: "Ph\xF2ng Ti\u1EC3u ph\xFA c\xF3 th\u1EC3 l\xEAn t\u1EDBi {rank}; h\u1EA1ng cao h\u01A1n c\u1EA7n Ph\xF2ng \u0110\u1EA1i ph\xFA.", weeklyBonusText: "Th\u1EE9 Hai h\xE0ng tu\u1EA7n, h\u1EC7 th\u1ED1ng ph\xE1t th\u01B0\u1EDFng theo sao r\xF2ng, th\u1EAFng v\xE0 h\u1EA1ng c\u1EE7a {modes}.", richEntryText: "Y\xEAu c\u1EA7u h\u1EA1ng t\u1ED1i thi\u1EC3u: {rank}.", ruleSummaryFallback: "\u0110\u1EA5u nhanh ng\u01B0\u1EDDi th\u1EADt c\xF3 th\u1EC3 l\xEAn B\u1EA1c; ph\xF2ng tr\u1EA3 ph\xED d\xF9ng \u0111\u1EC3 leo h\u1EA1ng cao h\u01A1n.", expandAll: "M\u1EDF t\u1EA5t c\u1EA3", collapse: "Thu g\u1ECDn", recentRecords: "{count} m\u1EE5c g\u1EA7n nh\u1EA5t", walletLedgerPager: "{page}/{totalPages}", playerRank: "H\u1EA1ng ng\u01B0\u1EDDi ch\u01A1i", paymentOrderConflict: "\u0110\u01A1n n\u1EA1p \u0111\xE3 \u0111\u01B0\u1EE3c l\xE0m m\u1EDBi. Vui l\xF2ng t\u1EA1o \u0111\u01A1n m\u1EDBi." };
Y.ko = { ...Y.en, languageTitle: "\uC5B8\uC5B4 \uC120\uD0DD", home: "\uD648", battle: "\uB300\uC804", mine: "\uB0B4 \uC815\uBCF4", quickBattle: "\uBE60\uB978 \uB300\uC804", ticketBattle: "\uC2A4\uBAB0 \uB9AC\uCE58", richBattle: "\uBE45 \uB9AC\uCE58", gameTips: "\uD50C\uB808\uC774 \uD301", rankBoard: "\uB7AD\uD0B9", wallet: "\uC9C0\uAC11", rechargeWallet: "\uCDA9\uC804", applyWithdraw: "\uCD9C\uAE08", matching: "\uB9E4\uCE6D \uC911", win: "\uC2B9\uB9AC", lose: "\uD328\uBC30", draw: "\uBB34\uC2B9\uBD80", backLobby: "\uB85C\uBE44\uB85C", backHome: "\uD648\uC73C\uB85C", gotIt: "\uD655\uC778", cancelMatch: "\uB9E4\uCE6D \uCDE8\uC18C", playAgain: "\uB2E4\uC2DC \uD558\uAE30", playerProfile: "\uD504\uB85C\uD544", battleHistory: "\uB300\uC804 \uAE30\uB85D", rankRules: "\uB7AD\uD06C \uADDC\uCE59", score: "\uC2A4\uCF54\uC5B4", readyStart: "\uC900\uBE44", waitingBothReady: "\uC591\uCABD \uC900\uBE44 \uB300\uAE30", readyConfirmTitle: "\uC900\uBE44 \uD655\uC778", readyConfirmSubtitle: "\uB450 \uD50C\uB808\uC774\uC5B4\uAC00 \uBAA8\uB450 \uD655\uC778\uD558\uBA74 \uCE74\uC6B4\uD2B8\uB2E4\uC6B4\uC774 \uC2DC\uC791\uB429\uB2C8\uB2E4.", readySelf: "\uB0B4 \uC900\uBE44 \uC644\uB8CC", readyOpponent: "\uC0C1\uB300 \uC900\uBE44 \uC644\uB8CC", readySelfPending: "\uB0B4 \uC900\uBE44 \uC804", readyOpponentPending: "\uC0C1\uB300 \uB300\uAE30", readyButton: "\uC900\uBE44 \uC644\uB8CC", readyWaitingOpponent: "\uC900\uBE44 \uC644\uB8CC, \uC0C1\uB300\uB97C \uAE30\uB2E4\uB9AC\uB294 \uC911...", waitBothReady: "\uBA3C\uC800 \uC900\uBE44\uB97C \uD655\uC778\uD574 \uC8FC\uC138\uC694.", startAfterCountdown: "\uCE74\uC6B4\uD2B8\uB2E4\uC6B4 \uD6C4 \uC2DC\uC791", notRankedBattle: "\uC774\uBC88 \uB300\uC804\uC740 \uB7AD\uD06C\uC5D0 \uBC18\uC601\uB418\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4", botPracticeNotRanked: "\uBD07 \uC5F0\uC2B5\uC804\uC740 \uB7AD\uD06C \uC81C\uC678. \uC2E4\uC81C \uBE60\uB978 \uB300\uC804\uC740 {rank}\uAE4C\uC9C0 \uAC00\uB2A5.", validModesText: "{modes}\uB294 \uB7AD\uD06C\uC5D0 \uBC18\uC601\uB429\uB2C8\uB2E4. \uB9E4\uC77C \uC720\uD6A8 \uB300\uC804 {count}\uD68C \uD6C4 \uBCF4\uC0C1 \uC0C1\uC790\uB97C \uBC1B\uC744 \uC218 \uC788\uC2B5\uB2C8\uB2E4.", quickCapText: "\uBE60\uB978 \uB300\uC804 \uB7AD\uD06C\uAC00 \uCF1C\uC838 \uC788\uC73C\uBA74 {rank}\uAE4C\uC9C0\uB9CC \uC624\uB97C \uC218 \uC788\uC73C\uBA70, \uC774\uD6C4 \uC720\uB8CC \uBC29\uC774 \uD544\uC694\uD569\uB2C8\uB2E4.", ticketCapText: "\uC2A4\uBAB0 \uB9AC\uCE58\uB294 {rank}\uAE4C\uC9C0 \uAC00\uB2A5\uD558\uBA70 \uB354 \uB192\uC740 \uB7AD\uD06C\uB294 \uBE45 \uB9AC\uCE58\uAC00 \uD544\uC694\uD569\uB2C8\uB2E4.", weeklyBonusText: "\uB9E4\uC8FC \uC6D4\uC694\uC77C {modes}\uC758 \uC21C \uBCC4, \uC2B9\uC218, \uB7AD\uD06C \uAE30\uC900\uC73C\uB85C \uBCF4\uC0C1\uC774 \uC9C0\uAE09\uB429\uB2C8\uB2E4.", richEntryText: "\uCD5C\uC18C \uD544\uC694 \uB7AD\uD06C: {rank}.", ruleSummaryFallback: "\uC2E4\uC81C \uBE60\uB978 \uB300\uC804\uC740 \uC2E4\uBC84\uAE4C\uC9C0 \uAC00\uB2A5\uD558\uBA70, \uC720\uB8CC \uBC29\uC5D0\uC11C \uB354 \uB192\uC740 \uB7AD\uD06C\uC5D0 \uB3C4\uC804\uD569\uB2C8\uB2E4.", expandAll: "\uC804\uCCB4 \uBCF4\uAE30", collapse: "\uC811\uAE30", recentRecords: "\uCD5C\uADFC {count}\uAC74", walletLedgerPager: "{page}/{totalPages}", playerRank: "\uD50C\uB808\uC774\uC5B4 \uB7AD\uD06C", paymentOrderConflict: "\uCDA9\uC804 \uC8FC\uBB38\uC774 \uC0C8\uB85C\uACE0\uCE68\uB418\uC5C8\uC2B5\uB2C8\uB2E4. \uB2E4\uC2DC \uC8FC\uBB38\uC744 \uC0DD\uC131\uD574 \uC8FC\uC138\uC694." };
Y.ja = { ...Y.en, languageTitle: "\u8A00\u8A9E\u3092\u9078\u629E", home: "\u30DB\u30FC\u30E0", battle: "\u5BFE\u6226", mine: "\u30DE\u30A4", quickBattle: "\u30AF\u30A4\u30C3\u30AF\u5BFE\u6226", ticketBattle: "\u5C0F\u5BCC\u8C6A\u5834", richBattle: "\u5927\u5BCC\u8C6A\u5834", gameTips: "\u904A\u3073\u65B9", rankBoard: "\u30E9\u30F3\u30AF\u699C", wallet: "\u30A6\u30A9\u30EC\u30C3\u30C8", rechargeWallet: "\u30C1\u30E3\u30FC\u30B8", applyWithdraw: "\u51FA\u91D1", matching: "\u30DE\u30C3\u30C1\u4E2D", win: "\u52DD\u5229", lose: "\u6557\u5317", draw: "\u5F15\u304D\u5206\u3051", backLobby: "\u30ED\u30D3\u30FC\u3078", backHome: "\u30DB\u30FC\u30E0\u3078", gotIt: "\u4E86\u89E3", cancelMatch: "\u30AD\u30E3\u30F3\u30BB\u30EB", playAgain: "\u3082\u3046\u4E00\u6226", playerProfile: "\u30D7\u30ED\u30D5\u30A3\u30FC\u30EB", battleHistory: "\u5BFE\u6226\u5C65\u6B74", rankRules: "\u30E9\u30F3\u30AF\u898F\u5247", score: "\u30B9\u30B3\u30A2", readyStart: "\u6E96\u5099", waitingBothReady: "\u4E21\u8005\u306E\u6E96\u5099\u5F85\u3061", readyConfirmTitle: "\u6E96\u5099\u78BA\u8A8D", readyConfirmSubtitle: "\u4E21\u8005\u304C\u78BA\u8A8D\u3059\u308B\u3068\u30AB\u30A6\u30F3\u30C8\u30C0\u30A6\u30F3\u304C\u59CB\u307E\u308A\u307E\u3059\u3002", readySelf: "\u81EA\u5206\u306F\u6E96\u5099\u5B8C\u4E86", readyOpponent: "\u76F8\u624B\u306F\u6E96\u5099\u5B8C\u4E86", readySelfPending: "\u81EA\u5206\u306F\u672A\u6E96\u5099", readyOpponentPending: "\u76F8\u624B\u5F85\u3061", readyButton: "\u6E96\u5099\u5B8C\u4E86", readyWaitingOpponent: "\u6E96\u5099\u5B8C\u4E86\u3001\u76F8\u624B\u3092\u5F85\u3063\u3066\u3044\u307E\u3059...", waitBothReady: "\u5148\u306B\u6E96\u5099\u3092\u78BA\u8A8D\u3057\u3066\u304F\u3060\u3055\u3044\u3002", startAfterCountdown: "\u30AB\u30A6\u30F3\u30C8\u30C0\u30A6\u30F3\u5F8C\u306B\u958B\u59CB", notRankedBattle: "\u3053\u306E\u5BFE\u6226\u306F\u30E9\u30F3\u30AF\u306B\u53CD\u6620\u3055\u308C\u307E\u305B\u3093", botPracticeNotRanked: "Bot\u7DF4\u7FD2\u6226\u306F\u30E9\u30F3\u30AF\u5BFE\u8C61\u5916\u3002\u771F\u4EBA\u30AF\u30A4\u30C3\u30AF\u6226\u306F{rank}\u307E\u3067\u6607\u683C\u3067\u304D\u307E\u3059\u3002", validModesText: "{modes}\u304C\u30E9\u30F3\u30AF\u5BFE\u8C61\u3067\u3059\u3002\u6BCE\u65E5{count}\u56DE\u306E\u6709\u52B9\u5BFE\u6226\u3067\u5B9D\u7BB1\u3092\u53D7\u3051\u53D6\u308C\u307E\u3059\u3002", quickCapText: "\u30AF\u30A4\u30C3\u30AF\u6226\u306E\u30E9\u30F3\u30AF\u53CD\u6620\u304C\u6709\u52B9\u306A\u5834\u5408\u3001{rank}\u307E\u3067\u6607\u683C\u3067\u304D\u307E\u3059\u3002\u305D\u306E\u5F8C\u306F\u6709\u6599\u5834\u304C\u5FC5\u8981\u3067\u3059\u3002", ticketCapText: "\u5C0F\u5BCC\u8C6A\u5834\u306F{rank}\u307E\u3067\u6607\u683C\u3067\u304D\u307E\u3059\u3002\u3055\u3089\u306B\u4E0A\u306F\u5927\u5BCC\u8C6A\u5834\u304C\u5FC5\u8981\u3067\u3059\u3002", weeklyBonusText: "\u6BCE\u9031\u6708\u66DC\u306B\u3001{modes}\u306E\u7D14\u661F\u6570\u3001\u52DD\u5229\u6570\u3001\u30E9\u30F3\u30AF\u3067\u5831\u916C\u3092\u914D\u5E03\u3057\u307E\u3059\u3002", richEntryText: "\u5FC5\u8981\u6700\u4F4E\u30E9\u30F3\u30AF\uFF1A{rank}\u3002", ruleSummaryFallback: "\u771F\u4EBA\u30AF\u30A4\u30C3\u30AF\u6226\u306F\u767D\u9280\u307E\u3067\u6607\u683C\u53EF\u80FD\u3002\u6709\u6599\u5834\u3067\u3055\u3089\u306B\u4E0A\u3092\u76EE\u6307\u3057\u307E\u3059\u3002", expandAll: "\u3059\u3079\u3066\u8868\u793A", collapse: "\u9589\u3058\u308B", recentRecords: "\u6700\u8FD1{count}\u4EF6", walletLedgerPager: "{page}/{totalPages}", playerRank: "\u30D7\u30EC\u30A4\u30E4\u30FC\u30E9\u30F3\u30AF", paymentOrderConflict: "\u30C1\u30E3\u30FC\u30B8\u6CE8\u6587\u3092\u66F4\u65B0\u3057\u307E\u3057\u305F\u3002\u3082\u3046\u4E00\u5EA6\u4F5C\u6210\u3057\u3066\u304F\u3060\u3055\u3044\u3002" };
Jt.forEach((e) => {
  Object.assign($t[e], Y[e]);
});
Object.assign($t["zh-CN"], {
  myInviteLink: "我的邀请链接",
  inviteLinkHint: "好友用 Pi 浏览器打开，会自动绑定你",
  copyInviteLink: "复制链接",
  inviteLinkCopied: "邀请链接已复制",
  inviteLinkUnavailable: "登录后生成邀请链接",
  inviteAutoBindSuccess: "已绑定邀请人",
  inviteAutoBindFailed: "邀请链接无效，请手动绑定",
  pointsAsset: "积分",
  publicRewardPi: "Pi奖励",
  publicRewardPoints: "积分奖励",
  publicRewardPoc: "POC奖励",
  dailySignInTitle: "每日签到",
  dailyRewardAvailable: "有 {count} 个奖励可领",
  dailyRewardFallback: "做任务，领每日奖励",
  dailyRewardGo: "去看看",
  dailyRewardShort: "每日奖励",
  piRewardShort: "Pi 奖励",
  modePointsTag: "积分对战",
  modePocTag: "POC对战",
  modePiTag: "Pi对战",
  modeEntryRewardText: "{entry}入场，胜者预计{reward}，{cap}",
  modePiEntryRewardText: "{entry}入场，胜者预计{reward}，{rank}解锁",
  dailyTaskModePrefix: "仅限：{modes}",
  dailyTaskModeFallback: "仅限：小富豪 / 大富豪 / 超级富豪",
  dailyTaskDefaultTitle: "每日任务",
  dailyTaskWinCount: "胜利对局",
  dailyTaskPaidBattleCount: "付费对局",
  dailyTaskBattleCount: "完成对局",
  dailyTaskClaimed: "已领取",
  dailyTaskClaim: "领 {amount}",
  dailyActiveEyebrow: "每日活跃",
  dailySheetTitle: "签到和任务",
  dailySheetSummary: "每天来玩几局，把可领奖励拿走。",
  todaySignIn: "今日签到",
  signInClaim: "签到领 {amount}",
  signInUnavailable: "暂不可领",
  signInTomorrow: "明天再来领",
  signInReadyHint: "打开就能领",
  noDailyTasks: "暂无任务",
  dailyTasksReady: "{count} 个任务可领",
  dailyTasksKeepGoing: "今日任务继续加油",
  claiming: "领取中...",
  claimSuccess: "领取成功",
  copyPiUsername: "复制",
  noPiUsername: "暂无Pi用户名",
  copyPiUsernameSuccess: "Pi用户名已复制",
  copyPiUsernameFailed: "复制失败，请长按用户名复制",
  ledgerRecharge: "充值",
  ledgerReward: "获奖",
  ledgerBattleEntry: "入场费",
  ledgerBattleRefund: "退回",
  ledgerWithdrawLock: "提现冻结",
  ledgerWithdrawUnlock: "提现退回",
  ledgerWithdrawComplete: "提现完成",
  ledgerWithdrawReject: "提现驳回",
  ledgerTransferOut: "转账支出",
  ledgerTransferIn: "转账收入",
  ledgerTransferFee: "转账手续费",
  ledgerInviteReward: "邀请奖励",
  ledgerInviteCommission: "邀请提成",
  ledgerDailySigninReward: "签到奖励",
  ledgerDailyTaskReward: "任务奖励",
  ledgerIncome: "收入",
  ledgerExpense: "支出",
  ledgerLock: "冻结",
  ledgerUnlock: "解冻",
  ledgerDefault: "流水"
});
Object.assign($t.en, {
  myInviteLink: "My Invite Link",
  inviteLinkHint: "Open in Pi Browser to bind automatically",
  copyInviteLink: "Copy Link",
  inviteLinkCopied: "Invite link copied",
  inviteLinkUnavailable: "Login to create link",
  inviteAutoBindSuccess: "Inviter bound",
  inviteAutoBindFailed: "Invite link invalid. Bind manually.",
  pointsAsset: "Points",
  publicRewardPi: "Pi Paid",
  publicRewardPoints: "Points Paid",
  publicRewardPoc: "POC Paid",
  dailySignInTitle: "Daily Check-in",
  dailyRewardAvailable: "{count} reward ready",
  dailyRewardFallback: "Do tasks, earn daily rewards",
  dailyRewardGo: "View",
  dailyRewardShort: "Daily Reward",
  piRewardShort: "Pi Reward",
  modePointsTag: "Points Battle",
  modePocTag: "POC Battle",
  modePiTag: "Pi Battle",
  modeEntryRewardText: "Entry {entry}, win {reward}, {cap}",
  modePiEntryRewardText: "Entry {entry}, win {reward}, unlock at {rank}",
  dailyTaskModePrefix: "Modes: {modes}",
  dailyTaskModeFallback: "Modes: Small Rich / Big Rich / Super Rich",
  dailyTaskDefaultTitle: "Daily Task",
  dailyTaskWinCount: "Win battles",
  dailyTaskPaidBattleCount: "Paid battles",
  dailyTaskBattleCount: "Complete battles",
  dailyTaskClaimed: "Claimed",
  dailyTaskClaim: "Claim {amount}",
  dailyActiveEyebrow: "Daily",
  dailySheetTitle: "Check-in & Tasks",
  dailySheetSummary: "Play a few battles daily and claim rewards.",
  todaySignIn: "Today",
  signInClaim: "Claim {amount}",
  signInUnavailable: "Unavailable",
  signInTomorrow: "Come back tomorrow",
  signInReadyHint: "Open to claim",
  noDailyTasks: "No tasks",
  dailyTasksReady: "{count} task ready",
  dailyTasksKeepGoing: "Keep going today",
  claiming: "Claiming...",
  claimSuccess: "Claimed",
  copyPiUsername: "Copy",
  noPiUsername: "No Pi username",
  copyPiUsernameSuccess: "Pi username copied",
  copyPiUsernameFailed: "Copy failed. Long press to copy.",
  ledgerRecharge: "Recharge",
  ledgerReward: "Reward",
  ledgerBattleEntry: "Entry Fee",
  ledgerBattleRefund: "Refund",
  ledgerWithdrawLock: "Withdraw Lock",
  ledgerWithdrawUnlock: "Withdraw Return",
  ledgerWithdrawComplete: "Withdraw Paid",
  ledgerWithdrawReject: "Withdraw Rejected",
  ledgerTransferOut: "Transfer Out",
  ledgerTransferIn: "Transfer In",
  ledgerTransferFee: "Transfer Fee",
  ledgerInviteReward: "Invite Reward",
  ledgerInviteCommission: "Invite Commission",
  ledgerDailySigninReward: "Check-in Reward",
  ledgerDailyTaskReward: "Task Reward",
  ledgerIncome: "Income",
  ledgerExpense: "Expense",
  ledgerLock: "Locked",
  ledgerUnlock: "Unlocked",
  ledgerDefault: "Ledger"
});
let M = null, A = null, be = null, ze = null, he = 0, Pt = "", Re = "", je = "", se = [], Ve = "", Ke = "", K = "", Ct = "", Tt = "", Rt = "", Mt = "", Bt = 0;
const vn = 1100, va = 2600, Sn = 80, me = /* @__PURE__ */ new Set();
let Se = null;
function Ua() {
  return Se = { board: document.querySelector("#game-board"), overlay: document.querySelector("#battle-overlay"), feedbackLayer: document.querySelector("#battle-feedback-layer"), shell: document.querySelector(".battle-shell"), roomLabel: document.querySelector("#battle-room-label"), title: document.querySelector("#battle-title"), modeLabel: document.querySelector("#battle-mode-label"), timerWrap: document.querySelector("#battle-timer-wrap"), timer: document.querySelector("#battle-timer"), timerBar: document.querySelector("#battle-timer-bar"), selfCard: document.querySelector("#battle-self-card"), opponentCard: document.querySelector("#battle-opponent-card"), selfName: document.querySelector("#battle-self-name"), opponentName: document.querySelector("#battle-opponent-name"), selfScore: document.querySelector("#battle-self-score"), opponentScore: document.querySelector("#battle-opponent-score"), selfPressureMeter: document.querySelector("#battle-self-pressure-meter"), opponentPressureMeter: document.querySelector("#battle-opponent-pressure-meter"), selfPressure: document.querySelector("#battle-self-pressure"), opponentPressure: document.querySelector("#battle-opponent-pressure"), networkPill: document.querySelector("#network-pill") }, Se;
}
function st() {
  return Se?.board ? Se : Ua();
}
function oe() {
  return st().board;
}
function lt(e) {
  if (me.has(e)) return false;
  for (me.add(e); me.size > Sn; ) {
    const t = me.values().next().value;
    if (!t) break;
    me.delete(t);
  }
  return true;
}
let Nt = "", j = null, V = null, Be = null, ee = null, y = null, x = null, k = null, Ne = null, Yt = 0, Et = 0, Lt = "", xt = 0, Ee = "", te = 0, pe = -1, Xe = "", le = null, Ge = 0, Me = 0, clientPerfStableFrames = 0, clientPerfLowSince = 0, clientPerfLockedLow = false, clientPerfFrameCount = 0, clientPerfLongFrameCount = 0, clientPerfSampleStartedAt = 0, clientPreviewBurstUid = "", clientPreviewBurstSeq = 0, clientPreviewBurstAt = 0, canvasFxFrame = null;
a.canvasSpecialFx = [];
let cleanupBoardInputListeners = null;
const Sa = /* @__PURE__ */ new Map();
let z = null, W = null, At = 0, q = null;
const $n = 8e3, Pn = 3, Cn = 9e3, Ha = 1200, Tn = 1800, Ie = 8, Rn = 5e3, Mn = 6, Xt = 8e3, fe = 3, Bn = 16, Nn = 8, $a = 30, $e = 8, Pe = 6, Pa = 0.18, En = 1200;
function we() {
  Be && (window.clearInterval(Be), Be = null), Ee = "", te = 0, pe = -1;
  canvasFxFrame && (window.cancelAnimationFrame(canvasFxFrame), canvasFxFrame = null), a.canvasSpecialFx = [], a.canvasTileBursts = [];
}
function cleanupBoardInputs() {
  try {
    cleanupBoardInputListeners?.();
  } catch {
  }
  cleanupBoardInputListeners = null;
  try {
    Ne?.abort?.();
  } catch {
  }
  Ne = null;
}
function ce() {
  be && (window.cancelAnimationFrame(be), be = null), ee && (window.clearTimeout(ee), ee = null), le && (window.cancelAnimationFrame(le), le = null), j && (window.cancelAnimationFrame(j), j = null), V && (window.cancelAnimationFrame(V), V = null), z = null, W = null, At = 0, q = null, Ge = 0, Me = 0, clientPerfStableFrames = 0, clientPerfLowSince = 0, clientPerfLockedLow = false, clientPerfFrameCount = 0, clientPerfLongFrameCount = 0, clientPerfSampleStartedAt = 0, clientPreviewBurstUid = "", clientPreviewBurstSeq = 0, clientPreviewBurstAt = 0, document.documentElement.classList.remove("low-performance"), we(), Pt = "", Re = "", je = "", se = [], Ve = "", Ke = "", K = "", Ct = "", Tt = "", Rt = "", Mt = "", Bt = 0, Se = null, me.clear(), Nt = "", y = null, Et = 0, Lt = "", xt = 0, a.pendingSwapSeq = 0, a.pendingSwapPositions = [], cleanupBoardInputs(), x = null, k = null, Yt = 0, a.battleBursts = [], a.battleImpacts = [], a.localBattleEvents = [], a.localSwapFx = null, a.canvasSpecialFx = [];
}
function ge() {
  ze && (window.clearTimeout(ze), ze = null);
}
function $() {
  be || (be = window.requestAnimationFrame(() => {
    be = null, Hi();
  }));
}
function flashClass(e, t, r) {
  if (!e) return;
  e.classList.remove(t), window.requestAnimationFrame(() => {
    e.classList.add(t), window.setTimeout(() => e.classList.remove(t), r);
  });
}
function flashOneOf(e, t, r, o) {
  if (!e) return;
  e.classList.remove(...t), window.requestAnimationFrame(() => {
    e.classList.add(r), window.setTimeout(() => e.classList.remove(r), o);
  });
}
function Ln() {
  if (le) return;
  const e = (t) => {
    if (a.screen !== "battle" || !ve().autoDowngradeEnabled) {
      le = null;
      return;
    }
    const r = Ge ? t - Ge : 0, o = document.documentElement.classList.contains("low-performance");
    if (isExtremeRealtimeActive() && r > 0) {
      clientPerfSampleStartedAt || (clientPerfSampleStartedAt = Date.now());
      clientPerfFrameCount += 1;
      r > 52 && (clientPerfLongFrameCount += 1, a.clientPredictionStats.longFrames += 1);
      const s = Date.now() - clientPerfSampleStartedAt, l = extremeRealtimeConfig().metricsSampleRate;
      s >= 1e4 && l > 0 && Math.random() <= l && v("client_perf_sample", { roomNo: a.roomNo, mode: a.realtimeRoom?.mode || a.selectedMode, result: document.documentElement.classList.contains("low-performance") ? "low" : "normal", costMs: Math.round(s), fps: Math.round(clientPerfFrameCount * 1e3 / Math.max(1, s)), longFrames: clientPerfLongFrameCount, pending: (a.pendingSwapQueue || []).length, sent: a.clientPredictionStats.sent, ack: a.clientPredictionStats.ack, reject: a.clientPredictionStats.reject, rollback: a.clientPredictionStats.rollback, corrected: a.clientPredictionStats.corrected }, 9e3);
      s >= 1e4 && (clientPerfSampleStartedAt = Date.now(), clientPerfFrameCount = 0, clientPerfLongFrameCount = 0);
    }
    r > 52 ? (Me += 2, clientPerfStableFrames = 0) : r > 42 ? (Me += 1, clientPerfStableFrames = 0) : (Me = Math.max(0, Me - 1), clientPerfStableFrames += 1), Me >= 6 && !o && (document.documentElement.classList.add("low-performance"), clientPerfLowSince = Date.now(), clientPerfLockedLow = true), !clientPerfLockedLow && o && a.effectiveVisualEffectMode !== "low" && clientPerfStableFrames > 360 && Date.now() - clientPerfLowSince > 18e3 && (document.documentElement.classList.remove("low-performance"), Me = 0, clientPerfStableFrames = 0), Ge = t, le = window.requestAnimationFrame(e);
  };
  le = window.requestAnimationFrame(e);
}
function O() {
  a.matchPollTimer && (window.clearTimeout(a.matchPollTimer), a.matchPollTimer = null), a.matchUiTimer && (window.clearInterval(a.matchUiTimer), a.matchUiTimer = null), rt();
}
function ct() {
  return a.matchStartedAt ? Math.max(0, Math.floor((Date.now() - a.matchStartedAt) / 1e3)) : a.matchWaitingSeconds;
}
function Ce() {
  const e = Number(a.gameConfig?.timing?.matchCancelWaitSeconds);
  return Number.isFinite(e) && e >= 0 ? e : 20;
}
function Qt() {
  const e = ct(), t = Ce();
  return a.matchWaitingSeconds = Math.max(a.matchWaitingSeconds, e), a.matchCanCancel = a.matchCanCancel || a.matchWaitingSeconds >= t, a.matchWaitingSeconds;
}
function dt() {
  return localStorage.getItem("blitz_user_token") || "";
}
function Zt() {
  return !!window.Pi;
}
function Qe() {
  const e = Oa(a.visualEffectMode);
  a.effectiveVisualEffectMode = e, applyAnimationDurationVars(), document.documentElement.classList.toggle("pi-browser", Zt()), document.documentElement.classList.remove("effect-low", "effect-balanced", "effect-high"), document.documentElement.classList.add(`effect-${e}`), document.documentElement.classList.toggle("effect-no-trail", !ve().dragTrailEnabled), document.documentElement.classList.toggle("effect-no-haptic", !ve().hapticEnabled), e === "low" ? document.documentElement.classList.add("low-performance") : a.screen !== "battle" && document.documentElement.classList.remove("low-performance");
}
function xn() {
  const e = new URLSearchParams(window.location.search);
  let t = "";
  try {
    t = Array.from(window.location.ancestorOrigins || []).join(",");
  } catch {
    t = "";
  }
  return window.location.hostname === "sandbox.minepi.com" || document.referrer.includes("sandbox.minepi.com") || t.includes("sandbox.minepi.com") || e.get("sandbox") === "true" || e.get("pi_sandbox") === "true" || !!window.__BLITZ_PI_SANDBOX__;
}
function N(e) {
  if (e instanceof Error) return e.message;
  if (typeof e == "string") return e;
  try {
    return JSON.stringify(e);
  } catch {
    return n("unknownError");
  }
}
async function An(e = 6e3) {
  const t = Date.now();
  for (; Date.now() - t < e; ) {
    if (window.Pi) return window.Pi;
    await new Promise((r) => window.setTimeout(r, 120));
  }
  return null;
}
async function w(e, t) {
  const r = new AbortController(), o = window.setTimeout(() => r.abort(), Cn);
  let s;
  try {
    s = await fetch(`${Gt}${e}`, { ...t, signal: t?.signal || r.signal, headers: { "Content-Type": "application/json", Authorization: `Bearer ${dt()}`, ...t?.headers || {} } });
  } catch (c) {
    const d = c instanceof DOMException && c.name === "AbortError" ? n("requestTimeout") : n("networkRequestFailed");
    throw new Error(d);
  } finally {
    window.clearTimeout(o);
  }
  const l = await s.json();
  if (!s.ok || l.code !== 0) {
    const c = new Error(l.message || n("requestFailed"));
    c.code = l.code;
    throw c;
  }
  return l.data;
}
function v(e, t = {}, r = En) {
  const o = dt();
  if (!o) return;
  const s = Date.now(), l = [e, t.roomNo || a.roomNo || "", t.seq || "", t.message || ""].join(":"), c = Sa.get(l) || 0;
  if (s - c < r) return;
  Sa.set(l, s);
  const d = { stage: e, roomNo: a.roomNo, mode: a.selectedMode, status: a.realtimeRoom?.status || a.screen, screen: a.screen, network: a.networkStatus, latencyMs: a.networkLatencyMs, waitingSeconds: a.screen === "matching" ? ct() : 0, clientAt: s, ...t };
  fetch(`${Gt}/api/client/trace`, { method: "POST", keepalive: true, headers: { "Content-Type": "application/json", Authorization: `Bearer ${o}` }, body: JSON.stringify(d) }).catch(() => {
  });
}
function i(e) {
  return e.replace(/[&<>"']/g, (t) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[t] || t);
}
function S(e, t = "info") {
  const r = String(e || "").trim();
  if (!r) return;
  let o = document.querySelector("#blitz-toast-stack");
  o || (o = document.createElement("div"), o.id = "blitz-toast-stack", o.className = "blitz-toast-stack", o.setAttribute("role", "status"), o.setAttribute("aria-live", "polite"), document.body.appendChild(o));
  const s = document.createElement("div");
  s.className = `blitz-toast ${t}`, s.textContent = r, o.appendChild(s), window.setTimeout(() => {
    s.classList.add("leaving"), window.setTimeout(() => {
      s.remove(), o && !o.childElementCount && o.remove();
    }, 220);
  }, t === "error" ? 2600 : 1900);
}
function re(e, t) {
  e && (e.dataset.busy = t ? "true" : "false", e.querySelectorAll('button[type="submit"]').forEach((r) => {
    r.disabled = t, r.classList.toggle("is-loading", t);
  }));
}
function ea(e) {
  const t = e?.nickname || e?.piUsername || "Pi";
  return i(t.trim().slice(0, 1).toUpperCase() || "P");
}
const Fn = { avatar_1: { "zh-CN": "\u95EA\u7535", en: "Lightning", vi: "Tia ch\u1EDBp", ko: "\uBC88\uAC1C", ja: "\u7A32\u59BB" }, avatar_2: { "zh-CN": "\u91D1\u8292", en: "Gold Ray", vi: "Tia v\xE0ng", ko: "\uACE8\uB4DC", ja: "\u91D1\u5149" }, avatar_3: { "zh-CN": "\u7FE1\u7FE0", en: "Jade", vi: "Ng\u1ECDc", ko: "\uC81C\uC774\uB4DC", ja: "\u7FE1\u7FE0" }, avatar_4: { "zh-CN": "\u6D6A\u6F6E", en: "Wave", vi: "S\xF3ng", ko: "\uD30C\uB3C4", ja: "\u6CE2" }, avatar_5: { "zh-CN": "\u661F\u591C", en: "Night", vi: "\u0110\xEAm sao", ko: "\uBC24\uD558\uB298", ja: "\u661F\u591C" }, avatar_6: { "zh-CN": "\u51A0\u519B", en: "Champion", vi: "V\xF4 \u0111\u1ECBch", ko: "\uCC54\uD53C\uC5B8", ja: "\u738B\u8005" } };
function _n(e) {
  return Fn[e.key]?.[a.language] || e.name || e.key;
}
function ta(e) {
  return `avatar-token ${/^avatar_[1-6]$/.test(e || "") ? e : "avatar_1"}`;
}
function xe(e, t = "large") {
  return `<div class="${ta(e.avatarKey)} ${t}" aria-hidden="true"><span class="avatar-label">${i(ea(e))}</span></div>`;
}
function qn(e, t) {
  return { nickname: e.nickname || t?.nickname || "", piUsername: e.piUsername || t?.piUsername || "", avatarKey: e.avatarKey || t?.avatarKey || (e.isBot ? "bot" : "avatar_1") };
}
function Ze(e, t, r) {
  const o = qn(e, r);
  return `<span class="${e.isBot ? "battle-avatar bot" : `battle-avatar ${t}`} ${ta(o.avatarKey)}" aria-hidden="true"><span class="avatar-label">${i(ea(o))}</span></span>`;
}
const Ca = [{ key: "ruby", label: "", color: "#d6262f", textColor: "#fff6bd", imageUrl: "" }, { key: "amber", label: "", color: "#f08a12", textColor: "#fff6bd", imageUrl: "" }, { key: "jade", label: "", color: "#169950", textColor: "#fff6bd", imageUrl: "" }, { key: "aqua", label: "", color: "#0098e8", textColor: "#fff6bd", imageUrl: "" }, { key: "slate", label: "", color: "#6f2cff", textColor: "#fff6bd", imageUrl: "" }, { key: "gold", label: "", color: "#d2a51a", textColor: "#fff6bd", imageUrl: "" }];
function De(e, t) {
  const r = a.gameConfig?.operation?.tileTheme, o = Ca[e] || Ca[0];
  if (!r?.enabled) return o;
  if (t) {
    const l = r.specialTiles?.[t] || {};
    return { ...o, ...l, key: o.key, label: l.label ?? (t === "bomb" ? "\u7206" : t === "vertical" ? "\u7EB5" : "\u6A2A") };
  }
  const s = r.normalTiles?.find((l) => l.key === o.key) || r.normalTiles?.[e] || {};
  return { ...o, ...s, key: o.key };
}
function aa() {
  return a.gameConfig?.operation?.tileTheme?.enabled === true;
}
function In(e) {
  if (!aa()) return "";
  const t = [`--tile-main-color: ${e.color}`, `--tile-text-color: ${e.textColor}`, `background-image: linear-gradient(145deg, rgba(255, 255, 255, 0.24), ${e.color})`];
  return e.imageUrl && t.push(`--tile-image: url('${e.imageUrl.replace(/'/g, "%27")}')`, `background-image: url('${e.imageUrl.replace(/'/g, "%27")}'), linear-gradient(145deg, rgba(255, 255, 255, 0.18), ${e.color})`), t.join("; ");
}
function Dn(e, t) {
  if (!aa()) {
    e.style.removeProperty("--tile-main-color"), e.style.removeProperty("--tile-text-color"), e.style.removeProperty("--tile-image"), e.style.backgroundImage = "", e.classList.remove("tile-has-image");
    return;
  }
  e.style.setProperty("--tile-main-color", t.color), e.style.setProperty("--tile-text-color", t.textColor), e.style.backgroundImage = `linear-gradient(145deg, rgba(255, 255, 255, 0.24), ${t.color})`, t.imageUrl ? (e.style.setProperty("--tile-image", `url('${t.imageUrl.replace(/'/g, "%27")}')`), e.style.backgroundImage = `url('${t.imageUrl.replace(/'/g, "%27")}'), linear-gradient(145deg, rgba(255, 255, 255, 0.18), ${t.color})`, e.classList.add("tile-has-image")) : (e.style.removeProperty("--tile-image"), e.classList.remove("tile-has-image"));
}
function na(e) {
  if (e >= ka) {
    const r = e - ka, o = De(r, "bomb");
    return { colorClass: Z[r] || Z[0], specialClass: " tile-special tile-bomb", label: o.label || "\u7206", color: o.color || "#ffe56d", textColor: o.textColor || "#ffe56d", imageUrl: o.imageUrl || "" };
  }
  if (e >= ya) {
    const r = e - ya, o = De(r, "vertical");
    return { colorClass: Z[r] || Z[0], specialClass: " tile-special tile-lightning tile-lightning-vertical", label: o.label || "\u7EB5", color: o.color || "#ffe56d", textColor: o.textColor || "#ffe56d", imageUrl: o.imageUrl || "" };
  }
  if (e >= wa) {
    const r = e - wa, o = De(r, "horizontal");
    return { colorClass: Z[r] || Z[0], specialClass: " tile-special tile-lightning tile-lightning-horizontal", label: o.label || "\u6A2A", color: o.color || "#ffe56d", textColor: o.textColor || "#ffe56d", imageUrl: o.imageUrl || "" };
  }
  const t = De(e);
  return { colorClass: Z[e] || Z[0], specialClass: "", label: t.label || "", color: t.color || "#8a35ff", textColor: t.textColor || "#fff6bd", imageUrl: t.imageUrl || "" };
}
function clientTileColor(e) {
  if (e === null || e === void 0) return null;
  return e >= ka ? e - ka : e >= ya ? e - ya : e >= wa ? e - wa : e;
}
function clientIsSpecialTile(e) {
  return e >= wa;
}
function clientSpecialKind(e) {
  return e >= ka ? "bomb" : e >= ya ? "vertical" : e >= wa ? "horizontal" : "";
}
function clientMakeSpecialTile(e, t) {
  return t === "bomb" ? ka + e : t === "vertical" ? ya + e : wa + e;
}
function clientIsSameMatchTile(e, t) {
  const r = clientTileColor(e), o = clientTileColor(t);
  return r !== null && r === o;
}
function clientCreateRandom(e = "") {
  let t = 0;
  const r = String(e || Date.now());
  for (let o = 0; o < r.length; o += 1) t = (t * 31 + r.charCodeAt(o)) >>> 0;
  t %= 2147483647, t <= 0 && (t += 2147483646);
  return () => (t = t * 16807 % 2147483647, (t - 1) / 2147483646);
}
function clientRandomTile(e) {
  return Math.floor(e() * 5);
}
function clientWouldCreateMatchAt(e, t, r, o) {
  return r >= 2 && clientIsSameMatchTile(e[t]?.[r - 1], o) && clientIsSameMatchTile(e[t]?.[r - 2], o) || r + 2 < Pe && clientIsSameMatchTile(e[t]?.[r + 1], o) && clientIsSameMatchTile(e[t]?.[r + 2], o) || t >= 2 && clientIsSameMatchTile(e[t - 1]?.[r], o) && clientIsSameMatchTile(e[t - 2]?.[r], o) || t + 2 < $e && clientIsSameMatchTile(e[t + 1]?.[r], o) && clientIsSameMatchTile(e[t + 2]?.[r], o);
}
function clientSafeRandomTile(e, t, r, o) {
  for (let s = 0; s < 15; s += 1) {
    const l = clientRandomTile(o);
    if (!clientWouldCreateMatchAt(e, t, r, l)) return l;
  }
  for (let s = 0; s < 5; s += 1) if (!clientWouldCreateMatchAt(e, t, r, s)) return s;
  return clientRandomTile(o);
}
function clientCloneBoard(e) {
  return Array.isArray(e) ? e.map((t) => Array.isArray(t) ? [...t] : []) : [];
}
function clientIsInside(e, t) {
  return t && t.row >= 0 && t.row < e.length && Array.isArray(e[t.row]) && t.col >= 0 && t.col < e[t.row].length;
}
function clientSwap(e, t, r) {
  const o = e[t.row][t.col];
  e[t.row][t.col] = e[r.row][r.col], e[r.row][r.col] = o;
}
function clientFindMatches(e) {
  const t = /* @__PURE__ */ new Set(), r = [];
  for (let o = 0; o < e.length; o += 1) {
    let s = 0, l = clientTileColor(e[o]?.[0]);
    for (let c = 1; c <= (e[o]?.length || 0); c += 1) {
      const d = c < e[o].length ? clientTileColor(e[o][c]) : null;
      if (d !== l || l === null) {
        const u = c - s;
        if (l !== null && u >= 3) {
          const h = [];
          for (let p = s; p < c; p += 1) t.add(`${o}:${p}`), h.push({ row: o, col: p });
          r.push({ orientation: "horizontal", length: u, color: l, cells: h });
        }
        s = c, l = d;
      }
    }
  }
  for (let o = 0; o < Pe; o += 1) {
    let s = 0, l = clientTileColor(e[0]?.[o]);
    for (let c = 1; c <= e.length; c += 1) {
      const d = c < e.length ? clientTileColor(e[c]?.[o]) : null;
      if (d !== l || l === null) {
        const u = c - s;
        if (l !== null && u >= 3) {
          const h = [];
          for (let p = s; p < c; p += 1) t.add(`${p}:${o}`), h.push({ row: p, col: o });
          r.push({ orientation: "vertical", length: u, color: l, cells: h });
        }
        s = c, l = d;
      }
    }
  }
  return t.runs = r, t;
}
function clientAddSpecialTargets(e, t, r = null) {
  const o = /* @__PURE__ */ new Set();
  for (const s of t) {
    const [l, c] = s.split(":").map(Number), d = e[l]?.[c];
    if (!clientIsSpecialTile(d)) continue;
    const u = clientSpecialKind(d);
    r && !r.some((h) => h.kind === u && h.position?.row === l && h.position?.col === c) && r.push({ kind: u, position: { row: l, col: c }, tile: d });
    if (u === "horizontal") for (let h = 0; h < Pe; h += 1) o.add(`${l}:${h}`);
    else if (u === "vertical") for (let h = 0; h < e.length; h += 1) o.add(`${h}:${c}`);
    else if (u === "bomb") for (let h = l - 1; h <= l + 1; h += 1) for (let p = c - 1; p <= c + 1; p += 1) h >= 0 && h < e.length && p >= 0 && p < Pe && o.add(`${h}:${p}`);
  }
  for (const s of o) t.add(s);
  return o.size;
}
function clientSpecialCreation(e, t) {
  const r = (Array.isArray(e.runs) ? e.runs : []).filter((o) => o.length >= 4).sort((o, s) => s.length - o.length);
  if (!r.length) return null;
  const o = r[0], s = [t?.to, t?.from].find((l) => l && o.cells.some((c) => c.row === l.row && c.col === l.col));
  const l = o.length >= 5 ? "bomb" : o.orientation === "horizontal" ? "horizontal" : "vertical";
  return { kind: l, position: s || o.cells[Math.floor(o.cells.length / 2)], tile: clientMakeSpecialTile(o.color, l) };
}
function clientDirectSpecialMatches(e, t, r, o = null) {
  const s = /* @__PURE__ */ new Set();
  [t, r].forEach((l) => {
    clientIsInside(e, l) && clientIsSpecialTile(e[l.row][l.col]) && s.add(`${l.row}:${l.col}`);
  });
  return s.size && clientAddSpecialTargets(e, s, o), s;
}
function clientCollapseBoard(e, t) {
  for (let r = 0; r < Pe; r += 1) {
    const o = [];
    for (let s = $e - 1; s >= 0; s -= 1) e[s]?.[r] !== null && e[s]?.[r] !== void 0 && o.push(e[s][r]);
    for (let s = $e - 1; s >= 0; s -= 1) e[s][r] = o[$e - 1 - s] ?? clientSafeRandomTile(e, s, r, t);
  }
}
function clientHasValidMove(e) {
  for (let t = 0; t < $e; t += 1) for (let r = 0; r < Pe; r += 1) {
    const o = [{ row: t, col: r + 1 }, { row: t + 1, col: r }];
    for (const s of o) {
      if (!clientIsInside(e, s)) continue;
      const l = clientCloneBoard(e);
      clientSwap(l, { row: t, col: r }, s);
      if (clientIsSpecialTile(l[t]?.[r]) || clientIsSpecialTile(l[s.row]?.[s.col]) || clientFindMatches(l).size > 0) return true;
    }
  }
  return false;
}
function clientCreateCandidateBoard(e) {
  const t = Array.from({ length: $e }, () => Array.from({ length: Pe }, () => null));
  for (let r = 0; r < $e; r += 1) for (let o = 0; o < Pe; o += 1) t[r][o] = clientSafeRandomTile(t, r, o, e);
  let r = 0;
  for (; clientFindMatches(t).size > 0 && r < 20; ) {
    const o = clientFindMatches(t);
    for (const s of o) {
      const [l, c] = s.split(":").map(Number);
      t[l][c] = clientSafeRandomTile(t, l, c, e);
    }
    r += 1;
  }
  return t;
}
function clientRefillBoardIfStuck(e, t) {
  if (clientHasValidMove(e)) return;
  const r = clientCreateCandidateBoard(clientCreateRandom(`${t?.roomNo || ""}:refill:${t?.version || 0}:${Date.now()}`));
  for (let o = 0; o < $e; o += 1) for (let s = 0; s < Pe; s += 1) e[o][s] = r[o][s];
}
function clientResolveBoard(e, t, r = null) {
  const n = [];
  let o = 0, s = 0, l = 0, c = 0, d = 0, u = r ? clientDirectSpecialMatches(e, r.from, r.to, n) : /* @__PURE__ */ new Set();
  for (; o < 4; ) {
    const h = u.size > 0 ? u : clientFindMatches(e);
    if (u = /* @__PURE__ */ new Set(), h.size === 0) break;
    o += 1;
    const p = clientAddSpecialTargets(e, h, n);
    c += p > 0 ? 1 : 0;
    const f = clientSpecialCreation(h, o === 1 ? r : null), m = Math.min(h.size, 18), g = Math.min(m, Math.max(0, 18 - s));
    s += g, l += g * 10 + Math.min(o - 1, 3) * 8 + c * 8;
    for (const P of h) {
      const [C, T] = P.split(":").map(Number);
      e[C][T] = null;
    }
    f && e[f.position.row]?.[f.position.col] === null && (e[f.position.row][f.position.col] = f.tile, d += 1);
    clientCollapseBoard(e, t);
    if (s >= 18) break;
  }
  return { chain: o, totalCleared: s, scoreGain: l, specialTriggered: c, specialCreated: d, specialFx: n };
}
function clientSettleRemainingMatches(e, t) {
  let r = 0;
  for (; clientFindMatches(e).size > 0 && r < 8; ) {
    for (const o of clientFindMatches(e)) {
      const [s, l] = o.split(":").map(Number);
      e[s][l] = null;
    }
    clientCollapseBoard(e, t), r += 1;
  }
}
function battleClearCount(e) {
  return Math.max(0, Number(e?.cleared ?? e?.totalCleared ?? 0));
}
function battleChainCount(e) {
  return Math.max(1, Number(e?.chain || 1));
}
function battleFeedbackPower(e) {
  const t = battleChainCount(e), r = battleClearCount(e);
  return Math.min(6, Math.max(0, t - 1) + (r >= 8 ? 3 : r >= 6 ? 2 : r >= 4 ? 1 : 0) + (e?.specialTriggered ? 2 : 0) + (e?.specialCreated ? 1 : 0) + (Number(e?.attack || 0) > 0 ? 1 : 0));
}
function battleIsMegaFeedback(e) {
  return battleChainCount(e) >= 3 || battleClearCount(e) >= 6 || !!e?.specialTriggered || Number(e?.specialCreated || 0) > 0 && battleClearCount(e) >= 5;
}
function battleBurstText(e) {
  const t = battleChainCount(e), r = battleClearCount(e), o = Number(e?.scoreGain || 0), s = Number(e?.attack || 0);
  return e?.specialTriggered && t >= 3 ? `\u8FDE\u7206x${t} +${o}` : e?.specialTriggered ? `\u95EA\u7535\u7206\u53D1 +${o}` : e?.specialCreated && r >= 5 ? `\u70B8\u5F39\u751F\u6210 +${o}` : e?.specialCreated ? `\u95EA\u7535\u751F\u6210 +${o}` : s > 0 && t >= 3 ? `\u8FDE\u51FB\u7535\u51FB +${s}` : s > 0 ? `\u7535\u51FB +${s}` : t >= 4 ? `\u6781\u9650\u8FDE\u51FBx${t}` : t >= 3 ? `\u95EA\u7535\u8FDE\u51FBx${t}` : t > 1 && r >= 6 ? `\u8FDE\u51FBx${t} \u5927\u6D88` : t > 1 ? `\u8FDE\u51FBx${t} +${o}` : r >= 8 ? `\u5168\u573A\u5927\u6D88 +${o}` : r >= 6 ? `\u5927\u6D88\u9664 +${o}` : r >= 4 ? `${r}\u6D88 +${o}` : `+${o}`;
}
function waPreviewText(e) {
  return battleBurstText(e);
}
function yaPreviewSemantic(e) {
  return e.specialTriggered ? "special_triggered" : e.specialCreated ? e.cleared >= 5 ? "special_bomb" : "special_lightning" : e.attack > 0 ? "attack" : e.chain > 1 ? "combo" : e.cleared >= 4 ? "big_clear" : "score";
}
function clientPreviewTone(e) {
  return e.specialTriggered ? "attack" : battleIsMegaFeedback(e) ? "mega" : e.specialCreated ? "combo" : e.attack > 0 ? "attack" : e.chain > 1 ? "combo" : e.cleared >= 4 ? "clear" : "score";
}
function kaPreviewSwap(e, t, r) {
  const o = a.realtimeRoom?.players?.find((m) => m.uid === a.user?.uid);
  if (!o?.board || !clientIsInside(o.board, e) || !clientIsInside(o.board, t)) return null;
  const s = clientCloneBoard(o.board);
  clientSwap(s, e, t);
  const l = clientCreateRandom(`${a.realtimeRoom?.roomNo || ""}:${a.clientRoomVersion || a.realtimeRoom?.version || 0}:${r}`), c = clientResolveBoard(s, l, { from: e, to: t });
  if (!c.totalCleared) return null;
  clientSettleRemainingMatches(s, l), clientRefillBoardIfStuck(s, a.realtimeRoom);
  const d = Math.min(4, Math.max(0, c.chain - 1) + Math.floor(Math.min(c.totalCleared, 16) / 8) + Math.min(1, Number(c.specialTriggered || 0))), u = { uid: a.user?.uid || "local", type: "local_preview", seq: r, cleared: c.totalCleared, chain: c.chain, scoreGain: c.scoreGain, attack: d, specialTriggered: Number(c.specialTriggered || 0), specialCreated: Number(c.specialCreated || 0), specialFx: c.specialFx || [], at: Date.now(), localPending: true, board: s };
  return u.previewSemantic = yaPreviewSemantic(u), u.previewTone = clientPreviewTone(u), u.previewText = waPreviewText(u), u;
}
function xaPreviewSwap(e, t, r) {
  try {
    const o = kaPreviewSwap(e, t, r);
    o && (clientPreviewBurstUid = o.uid || "", clientPreviewBurstSeq = Number(o.seq || 0), clientPreviewBurstAt = Date.now(), nn(o), Si(o));
  } catch (o) {
    console.warn("local swap preview failed", o);
  }
}
function applyPredictedSwap(e, t, r) {
  try {
    const o = kaPreviewSwap(e, t, r), s = xa(a.realtimeRoom, a.user?.uid || "");
    if (!o || !s?.board || !clientIsInside(s.board, e) || !clientIsInside(s.board, t)) return false;
    const l = clientCloneBoard(o.board || s.board), c = a.realtimeRoom?.players?.find((d) => d.uid !== s.uid);
    s.board = l, s.score = Number(s.score || 0) + Number(o.scoreGain || 0), s.combo = Number(o.chain || 1), s.lastGain = Number(o.scoreGain || 0), s.pressure = Math.max(0, Number(s.pressure || 0) - 1), c && (c.pressure = Number(c.pressure || 0) + Number(o.attack || 0)), a.clientPredictedBoard = clientCloneBoard(l), Re = "", renderCanvasBoard(oe(), s), clientPreviewBurstUid = o.uid || "", clientPreviewBurstSeq = Number(o.seq || 0), clientPreviewBurstAt = Date.now(), nn(o), Si(o);
    return true;
  } catch (o) {
    console.warn("local predicted swap failed", o);
    return false;
  }
}
function Ft(e) {
  return e.isBot ? "\u95EA\u6218Bot" : e.nickname;
}
function Wn() {
  return a.networkStatus === "online" ? n("networkOnline") : a.networkStatus === "slow" ? n("networkSlow") : a.networkStatus === "reconnecting" ? n("networkReconnecting") : a.networkStatus === "offline" ? n("networkOffline") : n("networkConnecting");
}
function On() {
  return `net-${a.networkStatus}`;
}
function za() {
  return a.screen === "battle" && a.realtimeRoom?.status === "playing" && a.vsIntroUntil > Date.now();
}
function ra(e, t) {
  return e.row === t.row && e.col === t.col;
}
function de(e) {
  if (ve().hapticEnabled && "vibrate" in navigator) try {
    navigator.vibrate(e);
  } catch {
  }
}
function Un(e, t) {
  const r = a.selectedTile;
  return !r || ra(r, { row: e, col: t }) ? "" : _e(r, { row: e, col: t }) ? " tile-neighbor" : "";
}
function Hn(e, t) {
  const r = a.tileEffect;
  if (!r || r.positions.length !== 2 || Date.now() - r.at > 260) return "";
  const [o, s] = r.positions, l = o.row === e && o.col === t, c = s.row === e && s.col === t;
  if (!l && !c) return "";
  const d = l ? o : s, u = l ? s : o;
  return ` tile-swap-${u.col > d.col ? "right" : u.col < d.col ? "left" : u.row > d.row ? "down" : "up"}`;
}
function zn(e, t) {
  const r = a.tileEffect;
  return !r || Date.now() - r.at > 760 || !r.positions.some((l) => l.row === e && l.col === t) ? "" : ` ${r.type === "success" ? "tile-success" : "tile-fail"}${Hn(e, t)}`;
}
function jn(e, t) {
  const r = a.localSwapFx;
  return !r || Date.now() - r.at > 360 ? "" : r.from.row === e && r.from.col === t ? ` tile-local-merge tile-local-from merge-${et(r.from, r.to)}` : r.to.row === e && r.to.col === t ? ` tile-local-merge tile-local-to merge-${et(r.to, r.from)}` : "";
}
function et(e, t) {
  return t.col > e.col ? "right" : t.col < e.col ? "left" : t.row > e.row ? "down" : "up";
}
function Vn(e) {
  return e === "up" ? "down" : e === "down" ? "up" : e === "left" ? "right" : "left";
}
function Kn(e, t) {
  return !k || Date.now() - k.at > 420 ? "" : k.from.row === e && k.from.col === t ? ` tile-swipe-preview tile-swipe-from preview-${k.direction}` : k.to.row === e && k.to.col === t ? ` tile-swipe-preview tile-swipe-to preview-${Vn(k.direction)}` : "";
}
function ut() {
  k && (k = null, $());
}
function Gn(e, t) {
  if (!_e(e, t)) return;
  const r = et(e, t), o = `${e.row}:${e.col}:${t.row}:${t.col}:${r}`, s = k ? `${k.from.row}:${k.from.col}:${k.to.row}:${k.to.col}:${k.direction}` : "";
  o === s && Date.now() - k.at < 180 || (k = { from: e, to: t, direction: r, at: Date.now() }, $(), window.setTimeout(() => {
    k?.at && Date.now() - k.at >= 380 && ut();
  }, 430));
}
function Jn(e, t) {
  return !x || Date.now() - x.at > 260 || x.position.row !== e || x.position.col !== t ? "" : ` tile-dragging trail-${x.direction}`;
}
function Yn(e, t) {
  x = { position: e, direction: et(e, t), at: Date.now() }, window.setTimeout(() => {
    x?.at && Date.now() - x.at >= 220 && (x = null, $());
  }, 260);
}
function Ta() {
  const e = a.tileEffect;
  return !e || Date.now() - e.at > 760 ? "" : e.type === "success" ? " board-success" : " board-fail";
}
function ae(e, t) {
  a.tileEffect = { type: e, positions: t, at: Date.now() }, window.setTimeout(() => {
    a.tileEffect?.at && Date.now() - a.tileEffect.at >= 700 && (a.tileEffect = null, $());
  }, 780);
}
function I(e) {
  return modeAssetMeta(e).name;
}
function Xn(e) {
  return { win: n("win"), lose: n("lose"), draw: n("draw"), unfinished: n("inProgress"), expired: a.language === "zh-CN" ? "\u5DF2\u4F5C\u5E9F" : "Expired", review: a.language === "zh-CN" ? "\u590D\u6838\u4E2D" : "Review" }[e] || n("inProgress");
}
function Qn(e) {
  return e === "win" ? "win" : e === "lose" ? "lose" : "pending";
}
function ye(e) {
  return Number(e || 0).toFixed(4).replace(/\.?0+$/, "");
}
function b(e) {
  return `${ye(e)} Pi`;
}
function modeAssetMeta(e) {
  const t = {
    quick_battle: { configKey: "quickBattle", assetType: "FREE", name: n("quickBattle"), icon: "quick", detailKey: "quickModeDetail" },
    points_battle: { configKey: "pointsBattle", assetType: "POINTS", name: a.language === "zh-CN" ? "\u5C0F\u5BCC\u8C6A" : "Small Rich", icon: "ticket", detailKey: "ticketModeDetail" },
    poc_battle: { configKey: "pocBattle", assetType: "POC", name: a.language === "zh-CN" ? "\u5927\u5BCC\u8C6A" : "Big Rich", icon: "rich", detailKey: "ticketModeDetail" },
    pi_battle: { configKey: "piBattle", assetType: "PI", name: a.language === "zh-CN" ? "\u8D85\u7EA7\u5BCC\u8C6A" : "Super Rich", icon: "rich", detailKey: "richModeDetail" },
    ticket_battle: { configKey: "piBattle", assetType: "PI", name: a.language === "zh-CN" ? "\u8D85\u7EA7\u5BCC\u8C6A" : "Super Rich", icon: "rich", detailKey: "richModeDetail" },
    rich_battle: { configKey: "piBattle", assetType: "PI", name: a.language === "zh-CN" ? "\u8D85\u7EA7\u5BCC\u8C6A" : "Super Rich", icon: "rich", detailKey: "richModeDetail" }
  };
  return t[e] || t.quick_battle;
}
function modeAssetType(e) {
  return String(pt(e)?.assetType || modeAssetMeta(e).assetType || "PI").toUpperCase();
}
function formatModeAmount(e, t) {
  const r = modeAssetType(e), o = Number(t || 0);
  return r === "POINTS" ? `${Math.floor(o)} ${n("pointsAsset")}` : r === "POC" ? `${Number(o || 0).toFixed(2).replace(/\.?0+$/, "")} POC` : r === "FREE" ? n("modeEconomyFree") : b(o);
}
function formatPublicReward(e, t) {
  const r = Number(t || 0);
  if (e === "POINTS") return `${Math.floor(r)} ${n("pointsAsset")}`;
  if (e === "POC") return `${r.toFixed(2).replace(/\.?0+$/, "")} POC`;
  return `${r.toFixed(2)} Pi`;
}
function formatPublicRewardNumber(e, t) {
  const r = Number(t || 0);
  if (e === "POINTS") return String(Math.floor(r));
  if (e === "POC") return r.toFixed(2).replace(/\.?0+$/, "") || "0";
  return r.toFixed(2).replace(/\.?0+$/, "") || "0";
}
function formatAssetReward(e, t) {
  const r = String(e || "PI").toUpperCase(), o = Number(t || 0);
  return r === "POINTS" ? `${Math.floor(o)} ${n("pointsAsset")}` : r === "POC" ? `${o.toFixed(2).replace(/\.?0+$/, "")} POC` : b(o);
}
function formatRewardList(e = [], t = 0) {
  const r = (Array.isArray(e) ? e : []).filter((o) => Number(o.amount || 0) > 0).map((o) => formatAssetReward(o.assetType, o.amount));
  if (!r.length && Number(t || 0) > 0) r.push(b(t));
  return r.join(" / ");
}
function formatHistoryTotal(e = []) {
  const t = e.reduce((r, o) => {
    const s = modeAssetType(o.mode);
    return s === "FREE" ? r : (r[o.mode] = (r[o.mode] || 0) + Number(o.rewardAmount || 0), r);
  }, {});
  return Object.entries(t).filter(([, r]) => r > 0).map(([r, o]) => formatModeAmount(r, o)).join(" / ") || "0";
}
function assetUnitLabel(e) {
  const t = String(e || "").toUpperCase();
  return t === "POINTS" ? n("pointsAsset") : t || "-";
}
function getRemoteAssetSnapshot(e) {
  if (e !== "POINTS" && e !== "POC") return null;
  const t = a.wallet?.remoteAssets || null;
  if (!t) return null;
  if (t[e]) return t[e];
  if (t.assets?.[e]) return t.assets[e];
  if (Array.isArray(t.assets)) return t.assets.find((r) => String(r.assetType || r.asset_type || r.type || "").toUpperCase() === e) || null;
  return null;
}
function getModeBalanceState(e) {
  const t = modeAssetType(e);
  if (t === "FREE") return { assetType: t, balance: 0, label: n("modeEconomyFree"), error: "" };
  if (t === "PI") {
    const o = Number(a.wallet?.availableBalance ?? 0);
    return { assetType: t, balance: o, label: formatModeAmount(e, o), error: "" };
  }
  const r = getRemoteAssetSnapshot(t);
  if (a.wallet?.remoteAssetsError) return { assetType: t, balance: 0, label: `-- ${assetUnitLabel(t)}`, error: a.wallet.remoteAssetsError };
  if (!a.user?.piUserId && !a.user?.pi_user_id && !a.user?.piUsername && !a.user?.pi_username) return { assetType: t, balance: 0, label: `-- ${assetUnitLabel(t)}`, error: "\u5F53\u524D\u8D26\u53F7\u7F3A\u5C11 Pi UID/username\uFF0C\u4E0D\u80FD\u8FDB\u5165\u8D44\u4EA7\u573A" };
  if (!r) return { assetType: t, balance: 0, label: `-- ${assetUnitLabel(t)}`, error: "\u8D44\u4EA7\u4F59\u989D\u6682\u672A\u540C\u6B65\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5" };
  const o = Number(r.balance ?? r.availableBalance ?? r.available_balance ?? r.amount ?? 0);
  return { assetType: t, balance: Number.isFinite(o) ? o : 0, label: formatModeAmount(e, o), error: "" };
}
function isAssetGatewayModeClosed(e) {
  const t = modeAssetType(e), r = a.gameConfig?.assetGateway || {};
  return t === "POINTS" ? !r.enabled || !r.pointsEnabled : t === "POC" ? !r.enabled || !r.pocEnabled : false;
}
function Zn(e) {
  const t = Number(e || 0);
  return a.language === "zh-CN" && t >= 1e4 ? `${(t / 1e4).toFixed(1)}\u4E07` : a.language !== "zh-CN" && t >= 1e3 ? `${(t / 1e3).toFixed(1)}K` : String(Math.floor(t));
}
function _t(e) {
  return e.join(a.language === "zh-CN" || a.language === "ja" ? "\u3001" : ", ");
}
const Ra = { bronze: { "zh-CN": "\u9752\u94DC", en: "Bronze", vi: "\u0110\u1ED3ng", ko: "\uBE0C\uB860\uC988", ja: "\u30D6\u30ED\u30F3\u30BA" }, silver: { "zh-CN": "\u767D\u94F6", en: "Silver", vi: "B\u1EA1c", ko: "\uC2E4\uBC84", ja: "\u30B7\u30EB\u30D0\u30FC" }, gold: { "zh-CN": "\u9EC4\u91D1", en: "Gold", vi: "V\xE0ng", ko: "\uACE8\uB4DC", ja: "\u30B4\u30FC\u30EB\u30C9" }, platinum: { "zh-CN": "\u94C2\u91D1", en: "Platinum", vi: "B\u1EA1ch kim", ko: "\uD50C\uB798\uD2F0\uB118", ja: "\u30D7\u30E9\u30C1\u30CA" }, diamond: { "zh-CN": "\u94BB\u77F3", en: "Diamond", vi: "Kim c\u01B0\u01A1ng", ko: "\uB2E4\uC774\uC544", ja: "\u30C0\u30A4\u30E4" }, starlight: { "zh-CN": "\u661F\u8000", en: "Starlight", vi: "Tinh di\u1EC7u", ko: "\uC2A4\uD0C0\uB77C\uC774\uD2B8", ja: "\u661F\u8000" }, king: { "zh-CN": "\u738B\u8005", en: "King", vi: "Vua", ko: "\uD0B9", ja: "\u738B\u8005" } };
function G(e) {
  const r = (a.gameConfig?.operation?.ranks || []).find((s) => s.key === e || s.name === e), o = r?.key || e || "bronze";
  return Ra[o]?.[a.language] || r?.name || e || Ra.bronze[a.language];
}
function B(e) {
  return G(e);
}
const TEXT_LOCALIZE_MAP = {
  en: {
    "\u79EF\u5206": "Points",
    "\u6BCF\u65E5\u7B7E\u5230": "Daily Check-in",
    "\u5B8C\u62103\u5C40": "Complete 3 battles",
    "\u8D621\u5C40": "Win 1 battle",
    "\u94DC\u724C\u961F\u957F": "Bronze Captain",
    "\u94F6\u724C\u961F\u957F": "Silver Captain",
    "\u91D1\u724C\u961F\u957F": "Gold Captain",
    "\u95EA\u7535\u4F19\u4F34": "Lightning Partner",
    "\u597D\u53CB": "Friend"
  }
};
function localizeText(e) {
  const t = String(e || "");
  if (a.language === "zh-CN") return t;
  return TEXT_LOCALIZE_MAP[a.language]?.[t] || TEXT_LOCALIZE_MAP.en?.[t] || t;
}
function localizeInviteLevelName(e) {
  return localizeText(e || n("inviteNoLevel"));
}
function localizeTaskTitle(e) {
  return localizeText(e || n("dailyTaskDefaultTitle"));
}
function localizeCondition(e) {
  return e === "win_count" ? n("dailyTaskWinCount") : e === "paid_battle_count" ? n("dailyTaskPaidBattleCount") : n("dailyTaskBattleCount");
}
function mt(e) {
  const t = a.gameConfig?.operation, r = t?.localizedContent || {}, o = r[a.language]?.[e], s = r.en?.[e], l = r["zh-CN"]?.[e], c = e === "ruleSummary" ? t?.rankRules?.ruleSummary : t?.[e];
  return a.language !== "zh-CN" ? String(o || s || er(e) || "").trim() : String(o || s || l || c || "").trim();
}
function er(e) {
  return { maintenanceNotice: n("maintenanceFallback"), rechargeNotice: "", withdrawNotice: "", ruleSummary: n("ruleSummaryFallback") }[e];
}
function tr(e) {
  const t = String(e || "").trim().replace(/\s+/g, "");
  return t ? /^G[A-Z2-7]{55}$/.test(t) ? { address: t, valid: true, status: "format_ok", message: n("walletCheckOk") } : { address: t, valid: false, status: "invalid_format", message: n("walletCheckInvalid") } : { address: t, valid: false, status: "empty", message: n("walletCheckInvalid") };
}
function Ma(e) {
  const t = Number(a.gameConfig?.withdrawRisk?.feeRate || 0), r = Number((Number(e || 0) * t).toFixed(8)), o = Number(Math.max(0, Number(e || 0) - r).toFixed(8));
  return { fee: r, payout: o };
}
function Ba(e) {
  const t = a.gameConfig?.transfer, r = Math.max(0, Number(e || 0)), o = r * Number(t?.feeRate || 0), s = Number(Math.max(o, o > 0 ? Number(t?.feeMinAmount || 0) : 0).toFixed(8)), l = Number(Math.max(0, r).toFixed(8));
  return { fee: s, receive: l, totalCost: Number((l + s).toFixed(8)) };
}
function qt(e) {
  const t = a.gameConfig?.rechargeBonus, r = Number(e || 0);
  if (!t?.enabled || !Number.isFinite(r) || r <= 0) return { bonus: 0, total: Math.max(0, r) };
  const o = (t.presets || []).find((d) => Math.abs(Number(d.amount || 0) - r) < 1e-8), s = o ? Number(o.bonusAmount || 0) : r * Number(t.bonusRate || 0), l = Number(t.maxBonusAmount || 0), c = Number(Math.max(0, l > 0 ? Math.min(s, l) : s).toFixed(8));
  return { bonus: c, total: Number((r + c).toFixed(8)) };
}
function ar() {
  const e = a.inviteInfo;
  if (!e?.config?.enabled) return "";
  const t = (e.claimableRewards || []).reduce((s, l) => s + Number(l.amount || 0), 0), r = e.stats.levelKey ? e.config.levels.find((s) => s.key === e.stats.levelKey) : null, o = Math.round(Number(r?.commissionRate || 0) * 1e3) / 10;
  return `
    <section class="invite-mini-panel">
      <div>
        <span>${i(n("myInviteLevel"))}</span>
        <strong>${i(localizeInviteLevelName(e.stats.levelName || r?.name || n("inviteNoLevel")))}</strong>
        <small>${i(n("inviteCount", { count: e.stats.directInviteCount || 0 }))} \xB7 ${i(n("inviteCommissionRate", { rate: o }))}</small>
      </div>
      <button type="button" class="secondary" data-open-invite>${t > 0 ? i(n("inviteRewardReady", { amount: b(t) })) : i(n("inviteFriends"))}</button>
    </section>
  `;
}
function nr() {
  const e = (a.gameConfig?.rechargeBonus?.presets || []).filter((t) => Number(t.amount || 0) > 0);
  return e.length ? `
    <section class="recharge-presets" aria-label="${i(n("rechargePresetTitle"))}">
      <p class="summary">${i(n("rechargePresetTitle"))}</p>
      <div>
        ${e.slice(0, 6).map((t) => {
    const r = qt(t.amount), o = r.bonus > 0;
    return `<button type="button" class="secondary recharge-preset-button" data-recharge-amount="${t.amount}">
              <span>${i(n("rechargePresetCharge", { amount: b(t.amount) }))}</span>
              <b class="${o ? "" : "empty"}">${o ? i(n("rechargePresetBonus", { bonus: b(r.bonus) })) : "&nbsp;"}</b>
              <small>${i(n("rechargePresetCredit", { total: b(r.total) }))}</small>
            </button>`;
  }).join("")}
      </div>
    </section>
  ` : "";
}
function rr(e) {
  const t = e.order;
  return t.status === "paid" ? n("withdrawPaidSuccess", { payout: b(t.payoutAmount) }) : t.autoPayoutEligible && ["queued", "processing", "failed"].includes(t.autoPayoutStatus) ? t.autoPayoutStatus === "failed" ? n("withdrawAutoFailed") : n("withdrawQueuedSuccess") : t.status === "pending" || t.autoPayoutStatus === "manual_review" ? n("withdrawReviewSuccess") : n("withdrawSubmitted");
}
function ir() {
  const e = a.withdrawWallets || [];
  return e.length ? `
    <section class="saved-wallets" aria-label="${i(n("savedWallets"))}">
      <p class="summary">${i(n("savedWallets"))}</p>
      <div class="saved-wallet-list">
        ${e.slice(0, 3).map((t) => `
              <button type="button" class="secondary saved-wallet-button" data-wallet-address="${i(t.walletAddress)}">
                <span>${i(t.label || n("savedWallets"))}</span>
                <small>${i(t.walletAddress.slice(0, 8))}...${i(t.walletAddress.slice(-6))}</small>
              </button>
            `).join("")}
      </div>
    </section>
  ` : `<p class="summary">${i(n("savedWalletHint"))}</p>`;
}
function or(e) {
  return /[\u3400-\u9fff]/.test(String(e || ""));
}
function bt(e, t) {
  return !e || a.language !== "zh-CN" && a.language !== "ja" && or(e) ? n(t) : e;
}
function sr(e) {
  const t = e.localizedContent || {}, r = t[a.language] || {}, o = t.en || {}, s = t["zh-CN"] || {}, l = e.banners[0];
  return { projectName: bt(r.projectName || (a.language !== "zh-CN" ? o.projectName : "") || s.projectName || e.projectName, "homeProjectNameFallback"), englishName: bt(r.englishName || o.englishName || s.englishName || e.englishName, "homeEnglishNameFallback"), bannerDescription: bt(r.bannerDescription || (a.language !== "zh-CN" ? o.bannerDescription : "") || s.bannerDescription || l?.description, "heroFallback") };
}
function ke(e) {
  const t = a.gameConfig?.operation?.ranks || [], r = t.find((o) => o.name === e || o.key === e) || t.find((o) => o.name === "\u9752\u94DC") || t[0];
  return { name: r?.name || e || "\u9752\u94DC", icon: r?.icon || "\u25C6", color: r?.color || "#f2c84b" };
}
function F() {
  return a.gameConfig?.operation?.rankRules || { starsPerRank: 8, winStars: 1, loseStars: 1, winStreakBonusEnabled: true, winStreakRequired: 5, winStreakBonusStars: 1, bronzeProtection: true, rankedModes: ["quick_battle", "points_battle", "poc_battle", "pi_battle"], weeklyLeaderboardModes: ["points_battle", "poc_battle", "pi_battle"], quickBattleMaxRankKey: "silver", ticketBattleMaxRankKey: "platinum", richBattleMinRankKey: "platinum", dailyChestRequiredBattles: 3, ruleSummary: "\u5FEB\u901F\u5F00\u6218\u771F\u4EBA\u5C40\u53EF\u5347\u5230\u767D\u94F6\uFF1B\u5C0F\u5BCC\u8C6A\u3001\u5927\u5BCC\u8C6A\u548C\u8D85\u7EA7\u5BCC\u8C6A\u7EE7\u7EED\u51B2\u66F4\u9AD8\u6BB5\u4F4D\u3002" };
}
function ja() {
  return (a.gameConfig?.operation?.ranks || []).map((e) => e.key);
}
function It(e) {
  const r = ja().indexOf(e || "bronze");
  return r >= 0 ? r : 0;
}
function Ae(e) {
  return (a.gameConfig?.operation?.ranks || []).find((r) => r.name === e || r.key === e)?.key || "bronze";
}
function We(e) {
  return (a.gameConfig?.operation?.ranks || []).find((r) => r.key === e)?.name || "\u9752\u94DC";
}
function ia() {
  const e = F().richBattleMinRankKey || "bronze", t = ja(), r = t.indexOf(e), o = t.indexOf(Ae(a.user?.rankName));
  return r <= 0 || o >= r;
}
function Va(e) {
  return F().rankedModes?.includes(e) ?? false;
}
function Dt(e) {
  return (F().weeklyLeaderboardModes || ["points_battle", "poc_battle", "pi_battle"]).includes(e);
}
function lr(e) {
  const t = F();
  return e === "quick_battle" ? `\u6700\u9AD8${We(t.quickBattleMaxRankKey || "silver")}` : e === "points_battle" || e === "poc_battle" ? `\u6700\u9AD8${We(t.ticketBattleMaxRankKey || "platinum")}` : `\u51B2${We("starlight")}/${We("king")}`;
}
function Le(e) {
  if (a.language === "zh-CN") return lr(e);
  const t = F(), r = e === "quick_battle" ? B(t.quickBattleMaxRankKey || "silver") : e === "points_battle" || e === "poc_battle" ? B(t.ticketBattleMaxRankKey || "platinum") : `${B("starlight")}/${B("king")}`;
  return e === "pi_battle" || e === "rich_battle" || e === "ticket_battle" ? `push ${r}` : `up to ${r}`;
}
function cr(e) {
  const t = F(), r = e === "quick_battle" ? t.quickBattleMaxRankKey || "silver" : e === "points_battle" || e === "poc_battle" ? t.ticketBattleMaxRankKey || "platinum" : "";
  if (!r) return false;
  const o = It(r), s = It(Ae(a.user?.rankName)), l = a.rankStatus;
  return s > o || s === o && Number(l?.stars || 0) >= Number(l?.starsPerRank || 5);
}
function Wt(e) {
  return Math.max(0, Math.min(100, Math.round(Number(e || 0) / 30 * 100)));
}
function Ka(e) {
  return 1 - Math.pow(1 - e, 3);
}
function dr(e, t) {
  return { selfScore: Number(e.score || 0), opponentScore: Number(t.score || 0), selfPressure: Number(e.pressure || 0), opponentPressure: Number(t.pressure || 0) };
}
function ur(e, t) {
  return !e || !t ? false : e.selfScore === t.selfScore && e.opponentScore === t.opponentScore && e.selfPressure === t.selfPressure && e.opponentPressure === t.opponentPressure;
}
function wt(e) {
  const t = st(), r = (s, l) => {
    s && s.textContent !== l && (s.textContent = l);
  }, o = (s, l) => {
    s && (s.style.width = `${Wt(l)}%`);
  };
  r(t.selfScore, String(Math.round(e.selfScore))), r(t.opponentScore, String(Math.round(e.opponentScore))), o(t.selfPressure, e.selfPressure), o(t.opponentPressure, e.opponentPressure);
}
function mr(e, t = false) {
  if (t || !z) {
    z = { ...e }, W = { ...e }, wt(z);
    return;
  }
  if (ur(W, e)) return;
  j && (window.cancelAnimationFrame(j), j = null), q = { ...z }, W = { ...e }, At = performance.now();
  const r = document.documentElement.classList.contains("low-performance") ? 160 : 420, o = (s) => {
    if (!q || !W) return;
    const l = Math.min(1, (s - At) / r), c = Ka(l);
    z = { selfScore: q.selfScore + (W.selfScore - q.selfScore) * c, opponentScore: q.opponentScore + (W.opponentScore - q.opponentScore) * c, selfPressure: q.selfPressure + (W.selfPressure - q.selfPressure) * c, opponentPressure: q.opponentPressure + (W.opponentPressure - q.opponentPressure) * c }, wt(z), l < 1 ? j = window.requestAnimationFrame(o) : (z = { ...W }, wt(z), j = null, q = null);
  };
  j = window.requestAnimationFrame(o);
}
function pr() {
  return a.effectiveVisualEffectMode === "low" || document.documentElement.classList.contains("low-performance") ? false : !window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}
function fr(e, t, r = "pi_battle") {
  const o = Number(t || 0), s = r || "pi_battle";
  if (o <= 0 || !pr()) {
    e.textContent = formatModeAmount(s, o);
    return;
  }
  V && (window.cancelAnimationFrame(V), V = null);
  const l = performance.now(), c = a.effectiveVisualEffectMode === "high" ? 900 : 720, d = (u) => {
    const h = Math.min(1, (u - l) / c), p = Ka(h);
    if (e.textContent = formatModeAmount(s, o * p), h < 1) {
      V = window.requestAnimationFrame(d);
      return;
    }
    e.textContent = formatModeAmount(s, o), V = null;
  };
  e.textContent = formatModeAmount(s, 0), V = window.requestAnimationFrame(d);
}
function hr(e, t) {
  if (e.status !== "finished" || e.winnerUid !== t.uid) return;
  const r = ie(e.mode);
  if (r <= 0) return;
  const o = `${e.roomNo}:${e.winnerUid}:${r}`;
  if (o === Nt) return;
  Nt = o;
  const s = document.querySelector("#settlement-reward-amount");
  s && fr(s, r, e.mode);
}
function gr(e) {
  return typeof e != "string" ? e.mode === "quick_battle" ? Number(e.timing?.quickRoundSeconds || 75) : Number(e.timing?.paidRoundSeconds || 90) : e === "quick_battle" ? 75 : 90;
}
function Na(e) {
  const t = gr(e);
  return Math.max(0, Math.min(100, Math.round(Number(e.remainSeconds || 0) / t * 100)));
}
function br(e) {
  if (!e) return n("inProgress");
  const t = new Date(e);
  return Number.isNaN(t.getTime()) ? String(e).slice(0, 16) : t.toLocaleString(a.language, { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}
function wr(e) {
  const t = a.battleHistoryPage, r = a.battleHistoryTotal, o = a.battleHistoryTotalPages, l = `
    <div class="history-tabs">
      ${[{ key: "all", label: n("all") }, { key: "quick_battle", label: I("quick_battle") }, { key: "points_battle", label: I("points_battle") }, { key: "poc_battle", label: I("poc_battle") }, { key: "pi_battle", label: I("pi_battle") }].map((c) => `<button type="button" class="${a.battleHistoryFilter === c.key ? "active" : ""}" data-history-filter="${c.key}">${i(c.label)}</button>`).join("")}
    </div>
  `;
  return e.length === 0 ? `
      <section class="history-panel empty-history">
        <div class="section-title">
          <div>
            <p class="eyebrow">${i(n("historyEyebrow"))}</p>
            <h2>${i(n("battleHistory"))}</h2>
          </div>
          <span>${i(n("totalMatches", { total: 0 }))}</span>
        </div>
        ${l}
        <p>${i(n("emptyHistory"))}</p>
      </section>
    ` : `
    <section class="history-panel">
      <div class="section-title">
        <div>
          <p class="eyebrow">${i(n("historyEyebrow"))}</p>
          <h2>${i(n("battleHistory"))}</h2>
        </div>
        <span>${i(n("historyPageInfo", { page: t, totalPages: o, total: r }))}</span>
      </div>
      ${l}
      <div class="battle-history">
        ${e.map((c) => {
    const d = Qn(c.result), u = c.opponent?.nickname || c.opponent?.piUsername || n("unknownPlayer"), h = c.result === "win" ? n("rewardPlus", { amount: formatModeAmount(c.mode, c.rewardAmount) }) : c.result === "draw" && c.entryFee > 0 ? n("drawRefund", { amount: formatModeAmount(c.mode, c.entryFee) }) : c.entryFee > 0 ? n("ticketFee", { amount: formatModeAmount(c.mode, c.entryFee) }) : n("freeMatch"), p = c.myScore > c.opponentScore ? "lead" : c.myScore < c.opponentScore ? "behind" : "draw";
    return `
              <article class="history-card ${d}">
                <div class="history-main">
                  <div>
                    <strong>${i(I(c.mode))}</strong>
                    <small>${i(n("opponent"))}\uFF1A${i(u)}${c.isBotRoom ? ` \xB7 ${i(n("bot"))}` : ""}</small>
                  </div>
                  <span class="history-result ${d}">${Xn(c.result)}</span>
                </div>
                <div class="history-score ${p}" aria-label="\u672C\u5C40\u6BD4\u5206">
                  <span>${i(n("score"))}</span>
                  <strong>${c.myScore}<em>:</em>${c.opponentScore}</strong>
                </div>
                <div class="history-meta">
                  <span>${h}</span>
                  <span>${br(c.finishedAt || c.createdAt)}</span>
                </div>
              </article>
            `;
  }).join("")}
      </div>
      <div class="history-pager">
        <button type="button" class="secondary" id="history-prev" ${t <= 1 ? "disabled" : ""}>${i(n("prevPage"))}</button>
        <span>${t} / ${o}</span>
        <button type="button" class="secondary" id="history-next" ${t >= o ? "disabled" : ""}>${i(n("nextPage"))}</button>
      </div>
    </section>
  `;
}
function yr(e) {
  const t = e.filter((l) => l.result === "win" || l.result === "lose" || l.result === "draw"), r = e.filter((l) => l.result === "win").length, o = t.length ? Math.round(r / t.length * 100) : 0, s = formatHistoryTotal(e);
  return `
    <section class="mine-stats">
      <article>
        <span>${i(n("totalBattleCount"))}</span>
        <strong>${a.battleHistoryTotal}</strong>
      </article>
      <article>
        <span>${i(n("pageWins"))}</span>
        <strong>${r}</strong>
      </article>
      <article>
        <span>${i(n("pageWinRate"))}</span>
        <strong>${o}%</strong>
      </article>
      <article>
        <span>${i(n("pageReward"))}</span>
        <strong>${i(s)}</strong>
      </article>
    </section>
  `;
}
function Ga(e = "", t = "") {
  const r = { recharge: "ledgerRecharge", reward: "ledgerReward", battle_entry: "ledgerBattleEntry", battle_refund: "ledgerBattleRefund", withdraw_lock: "ledgerWithdrawLock", withdraw_unlock: "ledgerWithdrawUnlock", withdraw_complete: "ledgerWithdrawComplete", withdraw_reject: "ledgerWithdrawReject", transfer_out: "ledgerTransferOut", transfer_in: "ledgerTransferIn", transfer_fee: "ledgerTransferFee", invite_reward: "ledgerInviteReward", invite_commission: "ledgerInviteCommission", daily_signin_reward: "ledgerDailySigninReward", daily_task_reward: "ledgerDailyTaskReward" };
  return r[e] ? n(r[e]) : t === "in" ? n("ledgerIncome") : t === "out" ? n("ledgerExpense") : t === "lock" ? n("ledgerLock") : t === "unlock" ? n("ledgerUnlock") : e || n("ledgerDefault");
}
function kr(e = "") {
  return e === "in" || e === "unlock" ? "+" : e === "out" || e === "lock" ? "-" : "";
}
function getLedgerAssetType(e = {}) {
  return String(e.asset_type || e.assetType || "PI").toUpperCase();
}
function formatLedgerAmount(e = {}) {
  const t = getLedgerAssetType(e), r = Number(e.amount || 0);
  return t === "POINTS" ? `${Math.floor(r)} ${n("pointsAsset")}` : t === "POC" ? `${r.toFixed(2).replace(/\.?0+$/, "")} POC` : `${r.toFixed(4)} Pi`;
}
function walletLedgerFilterLabel(e) {
  return e === "POINTS" ? n("pointsAsset") : e === "POC" ? "POC" : e === "PI" ? "Pi" : n("all");
}
function vr(e) {
  const T = e?.allLedgers || [...(e?.ledgers || []), ...(e?.assetLedgers || [])], t = T.filter((p) => a.walletLedgerFilter === "all" || getLedgerAssetType(p) === a.walletLedgerFilter), r = n("walletLedger") === "walletLedger" ? "\u94B1\u5305\u660E\u7EC6" : n("walletLedger"), o = n("emptyWalletLedger") === "emptyWalletLedger" ? "\u6682\u65E0\u94B1\u5305\u6D41\u6C34" : n("emptyWalletLedger"), s = n("ledgerBalanceAfter") === "ledgerBalanceAfter" ? "\u4F59\u989D" : n("ledgerBalanceAfter"), l = a.walletLedgerExpanded, c = Math.max(1, Math.ceil(t.length / fe)), d = Math.min(Math.max(1, a.walletLedgerPage), c), u = l ? t.slice((d - 1) * fe, d * fe) : t.slice(0, fe), h = l ? n("walletLedgerPager", { page: d, totalPages: c }) : n("recentRecords", { count: Math.min(fe, t.length) }), P = ["all", "PI", "POINTS", "POC"];
  return t.length ? `<section class="wallet-ledger-panel">
    <div class="section-title">
      <div>
        <p class="eyebrow">${i(n("wallet"))}</p>
        <h2>${i(r)}</h2>
      </div>
      <span>${i(h)}</span>
    </div>
    <div class="wallet-ledger-tabs">
      ${P.map((p) => `<button type="button" class="${a.walletLedgerFilter === p ? "active" : ""}" data-wallet-ledger-filter="${i(p)}">${i(walletLedgerFilterLabel(p))}</button>`).join("")}
    </div>
    <div class="wallet-ledger-list">
      ${u.map((p) => {
    const f = p.balance_after !== null && p.balance_after !== void 0 && p.balance_after !== "", m = Number(p.balance_after || 0), g = kr(p.direction), C = p.direction === "in" || p.direction === "unlock" ? "in" : p.direction === "lock" ? "lock" : "out", T = p.created_at ? new Date(p.created_at).toLocaleString(void 0, { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }) : "-";
    return `<article class="wallet-ledger-item ${C}">
            <div>
              <strong>${i(Ga(p.type, p.direction))}</strong>
              <small>${i(p.remark || T)}</small>
            </div>
            <div>
              <b>${g}${i(formatLedgerAmount(p))}</b>
              <small>${f ? `${i(s)} ${m.toFixed(4)}` : i(T)}</small>
            </div>
          </article>`;
  }).join("")}
    </div>
    <div class="wallet-ledger-controls">
      <button type="button" class="secondary" id="toggle-wallet-ledger">${i(n(l ? "collapse" : "expandAll"))}</button>
      ${l ? `<div class="wallet-ledger-pager">
              <button type="button" class="ghost-button" id="wallet-ledger-prev" ${d <= 1 ? "disabled" : ""}>${i(n("prevPage"))}</button>
              <span>${i(n("walletLedgerPager", { page: d, totalPages: c }))}</span>
              <button type="button" class="ghost-button" id="wallet-ledger-next" ${d >= c ? "disabled" : ""}>${i(n("nextPage"))}</button>
            </div>` : ""}
    </div>
  </section>` : `<section class="wallet-ledger-panel">
      <div class="section-title">
        <div>
          <p class="eyebrow">${i(n("wallet"))}</p>
          <h2>${i(r)}</h2>
        </div>
        <span>0</span>
      </div>
      <div class="wallet-ledger-tabs">
        ${P.map((p) => `<button type="button" class="${a.walletLedgerFilter === p ? "active" : ""}" data-wallet-ledger-filter="${i(p)}">${i(walletLedgerFilterLabel(p))}</button>`).join("")}
      </div>
      <p class="wallet-ledger-empty">${i(o)}</p>
    </section>`;
}
function Sr() {
  const e = a.user, t = a.rankStatus, r = t?.rankKey || Ae(e?.rankName), o = ke(r), s = t?.stars ?? 0, l = t?.starsPerRank ?? F().starsPerRank, c = Math.max(0, l - s);
  return `
    <div class="profile-rank-badge" style="--rank-color: ${i(o.color)}">
      <span class="profile-rank-icon">${i(o.icon)}</span>
      <div>
        <small>${i(n("playerRank"))}</small>
        <strong>${i(G(r))}</strong>
        <em>${i(n("starProgress", { stars: s, starsPerRank: l, left: c || l }))}</em>
      </div>
    </div>
  `;
}
function $r() {
  const e = a.rankStatus;
  if (!e) return "";
  const t = Math.min(100, Math.round(e.todayRankedBattles / Math.max(1, e.dailyChestRequiredBattles) * 100)), r = e.dailyChestClaimed ? n("claimedToday") : e.dailyChestEligible ? n("claimPi", { amount: e.dailyChestRewardAmount.toFixed(4) }) : n("notReached");
  return `
    <section class="rank-chest-card">
      <div class="section-title">
        <div>
          <p class="eyebrow">${i(n("dailyChest"))}</p>
          <h2>${i(n("rankChest"))}</h2>
        </div>
        <span>${i(n("matchCount", { count: `${e.todayRankedBattles}/${e.dailyChestRequiredBattles}` }))}</span>
      </div>
      <div class="rank-stars" aria-label="\u5F53\u524D\u6BB5\u4F4D\u661F\u7EA7">
        ${Array.from({ length: e.starsPerRank }).map((o, s) => `<i class="${s < e.stars ? "active" : ""}">\u2605</i>`).join("")}
      </div>
      <div class="chest-progress"><i style="width: ${t}%"></i></div>
      <p>${i(n("chestRuleText", { required: e.dailyChestRequiredBattles, amount: e.dailyChestRewardAmount.toFixed(4) }))}</p>
      <button type="button" id="claim-rank-chest" ${e.dailyChestEligible ? "" : "disabled"}>${r}</button>
    </section>
  `;
}
function Pr(e) {
  const t = F().chestRewards || {}, r = e ? Number(t[e]) : NaN;
  return Number.isFinite(r) ? r : Number(a.rankStatus?.dailyChestRewardAmount || 0);
}
function Cr() {
  const e = a.rankStatus, t = a.user, r = a.gameConfig?.operation?.ranks || [];
  if (!e || !t || !r.length) return `
      <article class="rank-card" id="open-rank-rules" style="--rank-color: ${i(ke(t?.rankName).color)}">
        <div class="rank-emblem">${i(ke(t?.rankName).icon)}</div>
        <div>
          <span>${i(n("currentRank"))}</span>
          <strong>${i(G(t?.rankName))}</strong>
          <small>${i(n("rankRuleHint"))}</small>
        </div>
      </article>
      ${$r()}
    `;
  const o = e.rankKey || Ae(t.rankName), s = It(o), l = ke(o), c = Math.max(0, e.starsPerRank - e.stars), d = Math.min(100, Math.round(e.todayRankedBattles / Math.max(1, e.dailyChestRequiredBattles) * 100)), u = e.dailyChestClaimed ? n("claimedToday") : e.dailyChestEligible ? n("claimPi", { amount: e.dailyChestRewardAmount.toFixed(4) }) : n("goPlay"), h = r.slice(s + 1), f = (h.length ? h : r.slice(Math.max(0, r.length - 6))).map((m) => `
      <div class="rank-reward-row">
        <b style="--rank-color: ${i(m.color)}">${i(m.icon)}</b>
        <span>${i(G(m.key))}</span>
        <strong>${Pr(m.key).toFixed(4)} Pi</strong>
      </div>
    `);
  return `
    <section class="rank-growth-carousel single" aria-label="\u6BB5\u4F4D\u6210\u957F">
      <article class="rank-growth-card current" style="--rank-color: ${i(l.color)}">
        <div class="rank-growth-head">
          <div class="rank-growth-emblem">${i(l.icon)}</div>
          <div>
            <span>${i(n("currentRank"))}</span>
            <strong>${i(G(o))}</strong>
            <small>${i(n("starProgress", { stars: e.stars, starsPerRank: e.starsPerRank, left: c || e.starsPerRank }))}</small>
          </div>
        </div>
        <div class="rank-stars compact" aria-label="\u5F53\u524D\u6BB5\u4F4D\u661F\u7EA7">
          ${Array.from({ length: e.starsPerRank }).map((m, g) => `<i class="${g < e.stars ? "active" : ""}">\u2605</i>`).join("")}
        </div>
        <div class="chest-progress"><i style="width: ${d}%"></i></div>
        <p>${i(n("todayChestProgress", { done: e.todayRankedBattles, required: e.dailyChestRequiredBattles, amount: e.dailyChestRewardAmount.toFixed(4) }))}</p>
        <div class="rank-growth-actions">
          <button type="button" id="claim-rank-chest" ${e.dailyChestEligible ? "" : "disabled"}>${u}</button>
          <button type="button" class="secondary" id="open-rank-rules">${i(n("rules"))}</button>
        </div>
        <div class="rank-growth-title compact-title">
          <span>${i(n("futureRewards"))}</span>
          <strong>${i(n("rankRewardWall"))}</strong>
          <small>${i(n("rankRewardHint"))}</small>
        </div>
        <div class="rank-reward-list">
          ${f.join("")}
        </div>
      </article>
    </section>
  `;
}
function pt(e) {
  return a.gameConfig?.[modeAssetMeta(e).configKey] || a.gameConfig?.quickBattle;
}
function Ea(e) {
  return n(e === "balanced" ? "visualEffectBalanced" : e === "high" ? "visualEffectHigh" : e === "locked" ? "visualEffectLocked" : "visualEffectBalanced");
}
function Tr() {
  const e = ve(), t = e.allowUserChoice ? a.visualEffectMode : Oa(e.defaultMode), r = ["balanced", "high"];
  return `
    <section class="effect-setting-panel">
      <div>
        <span>${i(n("visualEffectTitle"))}</span>
        <small>${i(e.allowUserChoice ? n("visualEffectSummary") : n("visualEffectLocked"))}</small>
      </div>
      ${e.allowUserChoice ? `<div class="effect-mode-options">
              ${r.map((o) => `
                    <button
                      type="button"
                      class="${t === o ? "active" : ""}"
                      data-effect-mode="${o}"
                    >${i(Ea(o))}</button>
                  `).join("")}
            </div>` : `<strong>${i(Ea(t))}</strong>`}
    </section>
  `;
}
function Rr() {
  document.querySelector("#visual-effect-sheet-mask")?.remove();
  const e = Tr();
  R.insertAdjacentHTML("beforeend", `
      <div class="mode-sheet-mask" id="visual-effect-sheet-mask">
        <section class="mode-sheet visual-effect-sheet">
          <p class="eyebrow">${i(n("visualEffectTitle"))}</p>
          <h2>${i(n("visualEffectSheetTitle"))}</h2>
          ${e}
          <button type="button" class="secondary" id="close-visual-effect-sheet">${i(n("gotIt"))}</button>
        </section>
      </div>
    `), document.querySelector("#visual-effect-sheet-mask")?.addEventListener("click", (t) => {
    t.target === t.currentTarget && document.querySelector("#visual-effect-sheet-mask")?.remove();
  }), document.querySelector("#close-visual-effect-sheet")?.addEventListener("click", () => {
    document.querySelector("#visual-effect-sheet-mask")?.remove();
  }), Mr(() => {
    document.querySelector("#visual-effect-sheet-mask")?.remove(), L();
  });
}
function Mr(e = () => L()) {
  document.querySelectorAll("[data-effect-mode]").forEach((t) => {
    t.addEventListener("click", () => {
      const r = t.dataset.effectMode;
      ot.includes(r) && (kn(r), S(n("visualEffectSaved"), "success"), e());
    });
  });
}
function X(e) {
  const t = Number(pt(e)?.entryFee || 0);
  return modeAssetType(e) === "POINTS" ? Math.floor(t) : t;
}
function ie(e) {
  const t = pt(e), r = Number(t?.entryFee || 0), o = Number(t?.rewardRate || 0);
  return modeAssetType(e) === "POINTS" ? Math.floor(r * 2 * o) : Number((r * 2 * o).toFixed(modeAssetType(e) === "POC" ? 6 : 4));
}
function Br(e) {
  return Math.round(Number(pt(e)?.platformFeeRate || 0) * 100);
}
function oa() {
  return (a.inviteInfo?.config?.levels || a.gameConfig?.inviteRewards?.levels || []).filter((e) => e && e.enabled !== false).map((e) => ({ key: String(e.key || ""), name: localizeInviteLevelName(e.name), commissionRate: Number(e.commissionRate || 0), minBalance: Number(e.minBalance || 0), minDirectInvites: Number(e.minDirectInvites || 0) })).filter((e) => e.key && e.commissionRate > 0);
}
function Ja() {
  const e = oa();
  if (!e.length) return null;
  const t = a.inviteInfo?.stats?.levelKey || "";
  return t && e.find((r) => r.key === t) || null;
}
function Nr() {
  const e = oa();
  return e.length ? e.reduce((t, r) => r.commissionRate > t.commissionRate ? r : t, e[0]) : null;
}
function tt(e, t = Ja()) {
  if (!t) return 0;
  const r = a.gameConfig?.inviteRewards, o = X(e), s = o * 2 * Number(pt(e)?.platformFeeRate || 0), l = r?.commissionBase === "platform_fee" ? s : o, c = Number(r?.maxCommissionRate || t.commissionRate || 0), d = Math.min(Number(t.commissionRate || 0), c > 0 ? c : Number(t.commissionRate || 0));
  return Number(Math.max(0, l * d).toFixed(4));
}
function sa(e) {
  return (Number(e || 0) * 100).toFixed(1).replace(/\.0$/, "");
}
function Er() {
  const e = a.gameConfig?.inviteRewards;
  if (e?.enabled === false || e?.battleCommissionEnabled === false) return "";
  const t = Nr();
  if (!t) return "";
  const r = tt("pi_battle", t), o = tt("points_battle", t), s = r > 0 ? r : o;
  return `
    <button type="button" class="home-invite-cta" id="open-home-invite">
      <span class="home-invite-icon" aria-hidden="true">\u03C0</span>
      <span class="home-invite-copy">
        <strong>${i(n("inviteCtaTitle"))}</strong>
        <small>${i(n("inviteCtaSubtitle"))}</small>
      </span>
      <span class="home-invite-income">
        <b>${i(n("inviteCtaRate", { rate: sa(t.commissionRate) }))}</b>
        <small>${i(n("inviteCtaExample", { amount: b(s) }))}</small>
      </span>
      <span class="home-invite-arrow" aria-hidden="true">\u203A</span>
    </button>
  `;
}
function renderDailyRewardEntry() {
  const e = a.engagement;
  if (!e?.enabled) return "";
  const t = e.dailySignIn?.claimable ? 1 : 0, r = (e.tasks || []).filter((u) => u.claimable).length, o = t + r, s = [...(t ? e.dailySignIn?.rewards || [] : []), ...(e.tasks || []).filter((u) => u.claimable && Number(u.rewardAmount || 0) > 0).map((u) => ({ assetType: "PI", amount: Number(u.rewardAmount || 0) }))], l = formatRewardList(s);
  return `
    <button type="button" class="daily-reward-cta" id="open-daily-rewards">
      <span class="daily-reward-badge" aria-hidden="true">\u2605</span>
      <span class="daily-reward-copy">
        <strong>${i(n("dailySignInTitle"))}</strong>
        <small>${i(o > 0 ? n("dailyRewardAvailable", { count: o }) : n("dailyRewardFallback"))}</small>
      </span>
      <span class="daily-reward-prize">
        <b>${i(l ? `+${l}` : n("dailyRewardGo"))}</b>
        <small>${i(n("dailyRewardShort"))}</small>
      </span>
      <span class="home-invite-arrow" aria-hidden="true">\u203A</span>
    </button>
  `;
}
function dailyTaskModeText(e = []) {
  const t = ["quick_battle", "points_battle", "poc_battle", "pi_battle"], r = (Array.isArray(e) ? e : []).filter((o) => t.includes(o));
  return r.length ? n("dailyTaskModePrefix", { modes: r.map(I).join(" / ") }) : n("dailyTaskModeFallback");
}
function renderDailyTaskItem(e) {
  const t = Math.min(100, Math.round(Number(e.progress || 0) / Math.max(1, Number(e.requiredCount || 1)) * 100)), r = e.claimed ? n("dailyTaskClaimed") : e.claimable ? n("dailyTaskClaim", { amount: b(e.rewardAmount) }) : `${e.progress || 0}/${e.requiredCount || 1}`;
  return `
    <article class="daily-task-card ${e.claimable ? "claimable" : ""} ${e.claimed ? "claimed" : ""}">
      <div>
        <strong>${i(localizeTaskTitle(e.title))}</strong>
        <span>${i(localizeCondition(e.condition))} ${i(`${e.progress || 0}/${e.requiredCount || 1}`)}</span>
        <small class="daily-task-modes">${i(dailyTaskModeText(e.modes))}</small>
      </div>
      <div class="daily-task-progress"><i style="width:${t}%"></i></div>
      <button type="button" data-claim-task="${i(e.key || "")}" ${e.claimable ? "" : "disabled"}>${i(r)}</button>
    </article>
  `;
}
function openDailyRewards() {
  const e = a.engagement;
  if (!e?.enabled) return;
  document.querySelectorAll("#daily-reward-sheet-mask").forEach((u) => u.remove());
  const t = e.dailySignIn || {}, fallbackPiReward = t.piRewardEnabled !== false ? t.rewardAmount : 0, r = formatRewardList(t.rewards, fallbackPiReward), o = t.claimed ? n("claimedToday") : t.claimable ? n("signInClaim", { amount: r || b(0) }) : n("signInUnavailable"), taskReadyCount = (e.tasks || []).filter((u) => u.claimable).length;
  R.insertAdjacentHTML("beforeend", `
    <div class="mode-sheet-mask" id="daily-reward-sheet-mask">
      <section class="mode-sheet daily-reward-sheet">
        <p class="eyebrow">${i(n("dailyActiveEyebrow"))}</p>
        <h2>${i(n("dailySheetTitle"))}</h2>
        <p class="summary">${i(n("dailySheetSummary"))}</p>
        <article class="daily-sign-card ${t.claimable ? "claimable" : ""} ${t.claimed ? "claimed" : ""}">
          <div>
            <span>${i(n("todaySignIn"))}</span>
            <strong>${i(localizeTaskTitle(t.title || n("dailySignInTitle")))}</strong>
            <small>${i(t.claimed ? n("signInTomorrow") : n("signInReadyHint"))}</small>
          </div>
          <button type="button" id="claim-daily-sign" ${t.claimable ? "" : "disabled"}>${i(o)}</button>
        </article>
        <div class="daily-task-list">
          ${(e.tasks || []).map(renderDailyTaskItem).join("") || `<article class="daily-task-empty">${i(n("noDailyTasks"))}</article>`}
        </div>
        <div class="daily-reward-footer">
          <span>${i(taskReadyCount > 0 ? n("dailyTasksReady", { count: taskReadyCount }) : n("dailyTasksKeepGoing"))}</span>
          <button type="button" class="secondary" data-close-daily-rewards="1">${i(n("gotIt"))}</button>
        </div>
        <p id="daily-reward-status" class="summary" role="status" aria-live="polite"></p>
      </section>
    </div>
  `);
  const s = document.querySelector("#daily-reward-status"), l = async (u, h = null) => {
    const p = h || document.querySelector("#claim-daily-sign");
    if (p?.disabled) return;
    p && (p.disabled = true, p.classList.add("is-loading")), s && (s.textContent = n("claiming"));
    try {
      a.engagement = await w(u, { method: "POST", body: h ? JSON.stringify({ taskKey: h.dataset.claimTask || "" }) : JSON.stringify({}) }), a.wallet = await w("/api/wallet/me"), s && (s.textContent = n("claimSuccess")), S(n("claimSuccess"), "success"), window.setTimeout(() => {
        document.querySelector("#daily-reward-sheet-mask")?.remove(), _();
      }, 450);
    } catch (f) {
      const m = N(f);
      s && (s.textContent = m), S(m, "error"), p && (p.disabled = false, p.classList.remove("is-loading"));
    }
  };
  document.querySelector("#daily-reward-sheet-mask")?.addEventListener("click", (u) => {
    (u.target === u.currentTarget || u.target?.closest("[data-close-daily-rewards]")) && document.querySelector("#daily-reward-sheet-mask")?.remove();
  }), document.querySelector("#claim-daily-sign")?.addEventListener("click", () => l("/api/engagement/sign-in/claim")), document.querySelectorAll("[data-claim-task]").forEach((u) => {
    u.addEventListener("click", () => l("/api/engagement/task/claim", u));
  });
}
function Lr(e = "") {
  const t = oa();
  return t.length ? `
    <section class="invite-level-board">
      <div class="section-title compact">
        <div>
          <p class="eyebrow">${i(n("inviteLevelRatesTitle"))}</p>
          <h2>${i(n("inviteUpgradeHint"))}</h2>
        </div>
      </div>
      <div class="invite-level-list">
        ${t.map((r) => `
              <article class="${r.key === e ? "active" : ""}">
                <div>
                  <strong>${i(r.name)}</strong>
                  <span>${i(n("inviteCommissionRate", { rate: sa(r.commissionRate) }))}</span>
                </div>
                <small>${i(n("inviteLevelCondition", { balance: b(r.minBalance), count: r.minDirectInvites }))}</small>
              </article>
            `).join("")}
      </div>
    </section>
  ` : "";
}
function xr(e = Ja()) {
  if (!e) return "";
  const t = tt("points_battle", e), r = tt("poc_battle", e), o = Number(a.inviteInfo?.config?.qualificationRewardAmount || 0), s = Number(a.inviteInfo?.config?.qualificationRequiredBattles || 2);
  return `
    <section class="invite-income-card">
      <div class="invite-income-head">
        <p class="eyebrow">${i(n("inviteExamplesTitle"))}</p>
        <h2>${i(n("inviteIncomeTitle"))}</h2>
      </div>
      <div class="invite-example-grid">
        <article><span>${i(I("points_battle"))}</span><strong>${i(formatModeAmount("points_battle", t))}</strong><small>${i(n("inviteExampleSmall", { amount: formatModeAmount("points_battle", t) }))}</small></article>
        <article><span>${i(I("poc_battle"))}</span><strong>${i(formatModeAmount("poc_battle", r))}</strong><small>${i(n("inviteExampleRich", { amount: formatModeAmount("poc_battle", r) }))}</small></article>
      </div>
      ${o > 0 ? `<div class="invite-once-line">${i(n("inviteOnceReward", { battles: s, amount: b(o) }))}</div>` : ""}
    </section>
  `;
}
function Ar(e = "") {
  return e === "battle_commission" ? n("paidCommission") : e === "qualification" ? n("claimInviteReward") : Ga(e);
}
function invitePagerHtml(e, t, r) {
  return t <= 1 ? "" : `
    <div class="invite-pager">
      <button type="button" class="secondary" data-invite-page-target="${e}" data-page="${r - 1}" ${r <= 1 ? "disabled" : ""}>${i(n("prevPage"))}</button>
      <span>${r}/${t}</span>
      <button type="button" class="secondary" data-invite-page-target="${e}" data-page="${r + 1}" ${r >= t ? "disabled" : ""}>${i(n("nextPage"))}</button>
    </div>
  `;
}
function bindInvitePagination() {
  document.querySelectorAll("[data-invite-page-target]").forEach((e) => e.addEventListener("click", () => {
    const t = e.dataset.invitePageTarget, r = Math.max(1, Number.parseInt(e.dataset.page || "1", 10) || 1);
    t === "relation" ? inviteRelationPage = r : inviteIncomePage = r;
    at();
  }));
}
function Fr(e) {
  const t = e.inviter, r = e.invitedUsers || [];
  const o = Math.max(1, Math.ceil(r.length / INVITE_LIST_PAGE_SIZE));
  inviteRelationPage = Math.min(Math.max(1, inviteRelationPage), o);
  const s = (inviteRelationPage - 1) * INVITE_LIST_PAGE_SIZE, l = r.slice(s, s + INVITE_LIST_PAGE_SIZE);
  return `
    <section class="invite-relation-panel">
      <div class="section-title compact">
        <div>
          <p class="eyebrow">${i(n("inviteRelationEyebrow"))}</p>
          <h2>${i(n("inviteRelationTitle"))}</h2>
        </div>
        <span>${i(n("inviteCount", { count: r.length }))}</span>
      </div>
      <article class="invite-parent-card">
        <span>${i(n("inviteParent"))}</span>
        ${t ? `<strong>${i(t.nickname || t.piUsername)}</strong><small>${i(t.piUsername || "-")}</small>` : `<strong>${i(n("inviteUnbound"))}</strong><small>${i(n("inviteUnboundHint"))}</small>`}
      </article>
      ${r.length ? `<div class="invite-child-strip">
              ${l.map((o) => `
                    <article>
                      ${xe(o)}
                      <div>
                        <strong>${i(o.nickname || o.piUsername)}</strong>
                        <span>${i(o.piUsername || "-")}</span>
                      </div>
                    </article>
                  `).join("")}
            </div>${invitePagerHtml("relation", o, inviteRelationPage)}` : `<p class="summary">${i(n("inviteNoChildren"))}</p>`}
    </section>
  `;
}
function _r(e) {
  const t = e.rewardHistory || [];
  const r = Math.max(1, Math.ceil(t.length / INVITE_LIST_PAGE_SIZE));
  inviteIncomePage = Math.min(Math.max(1, inviteIncomePage), r);
  const o = (inviteIncomePage - 1) * INVITE_LIST_PAGE_SIZE, s = t.slice(o, o + INVITE_LIST_PAGE_SIZE);
  return `
    <section class="invite-reward-history">
      <div class="section-title compact">
        <div>
          <p class="eyebrow">${i(n("inviteIncomeEyebrow"))}</p>
          <h2>${i(n("inviteRewardHistoryTitle"))}</h2>
        </div>
        <span>${t.length}</span>
      </div>
      ${t.length ? `<div class="invite-income-list">
              ${s.map((r) => {
    const o = r.inviteeNickname || r.inviteePiUsername || "\u597D\u53CB", s = r.rate > 0 ? ` \xB7 ${sa(r.rate)}%` : "", l = r.battleRoomNo ? ` \xB7 ${r.battleRoomNo}` : "";
    return `
                    <article>
                      <div>
                        <strong>${i(Ar(r.rewardType))}</strong>
                        <span>${i(o)}${i(s)}${i(l)}</span>
                      </div>
                      <b>+${i(b(r.amount))}</b>
                    </article>
                  `;
  }).join("")}
            </div>${invitePagerHtml("income", r, inviteIncomePage)}` : `<p class="summary">${i(n("inviteNoIncomeHistory"))}</p>`}
    </section>
  `;
}
function la(e) {
  return X(e) > 0;
}
function La(e) {
  return e >= 26 ? "critical" : e >= 20 ? "danger" : e >= 12 ? "warning" : "safe";
}
function qr(e, t, r) {
  return la(e) ? `
    <div class="paid-trust-box">
      <strong>${i(n("paidTrustTitle"))}</strong>
      <div>
        <span><small>${i(n("paidEntryLabel"))}</small><b>${i(formatModeAmount(e, t))}</b></span>
        <span><small>${i(n("paidRewardLabel"))}</small><b>${i(formatModeAmount(e, r))}</b></span>
        <span><small>${i(n("platformFeeLabel"))}</small><b>${Br(e)}%</b></span>
        <span><small>${i(n("settlementSafeTitle"))}</small><b>${i(n("settlementSafeLabel"))}</b></span>
      </div>
    </div>
  ` : `<div class="newbie-tip"><strong>${i(n("newbieTipTitle"))}</strong><span>${i(n("newbieTipText"))}</span></div>`;
}
function yt(e) {
  return e === "quick_battle" ? n("modeEconomyFree") : `${formatModeAmount(e, X(e))} \u2192 ${formatModeAmount(e, ie(e))}`;
}
function ca(e = a.activePanel) {
  return `
    <nav class="bottom-nav" aria-label="\u5E95\u90E8\u5BFC\u822A">
      <button type="button" class="${e === "home" ? "active" : ""}" data-nav="home">
        <span>\u2302</span>
        ${n("home")}
      </button>
      <button type="button" class="battle-fab" data-nav="battle">
        <span>\u26A1</span>
        ${n("battle")}
      </button>
      <button type="button" class="${e === "mine" ? "active" : ""}" data-nav="mine">
        <span>\u25CF</span>
        ${n("mine")}
      </button>
    </nav>
  `;
}
function da() {
  document.querySelectorAll("[data-nav]").forEach((e) => {
    e.addEventListener("click", () => {
      const t = e.dataset.nav;
      if (t === "home") {
        a.activePanel = "home", _();
        return;
      }
      if (t === "mine") {
        a.activePanel = "mine", L();
        return;
      }
      Xa();
    });
  });
}
function ua(e = n("loadingDefault")) {
  R.innerHTML = `
    <main class="shell">
      <section class="hero">
        <div class="brand-mark" aria-hidden="true">${BRAND_MARK_HTML}</div>
        <p class="eyebrow">Blitz of Pi</p>
        <h1>${i(n("home") === "\u9996\u9875" ? "\u95EA\u7535\u6218" : "Blitz of Pi")}</h1>
        <p class="brand-subtitle">Blitz of Pi</p>
        <p class="summary">${e}</p>
      </section>
    </main>
  `;
}
function Fe(e = n("errorDefault")) {
  R.innerHTML = `
    <main class="shell">
      <section class="hero">
        <div class="brand-mark" aria-hidden="true">${BRAND_MARK_HTML}</div>
        <p class="eyebrow">Blitz of Pi</p>
        <h1>${i(n("home") === "\u9996\u9875" ? "\u95EA\u7535\u6218" : "Blitz of Pi")}</h1>
        <p class="brand-subtitle">Blitz of Pi</p>
        <p class="summary">${e}</p>
        <div class="actions">
          <button type="button" id="reload-page">${i(n("reloadPage"))}</button>
        </div>
      </section>
    </main>
  `, document.querySelector("#reload-page")?.addEventListener("click", () => {
    window.location.reload();
  });
}
function Ir() {
  const e = wn();
  return `
    <button type="button" class="language-pill" id="open-language-sheet" aria-label="${i(n("languageTitle"))}">
      <span class="language-flag" aria-hidden="true">${e.flag}</span>
      <strong>${i(e.nativeName)}</strong>
      <i aria-hidden="true">\u2304</i>
    </button>
  `;
}
function Dr() {
  document.querySelector("#open-language-sheet")?.addEventListener("click", () => Wr());
}
function Wr() {
  document.querySelector("#language-sheet-mask")?.remove(), R.insertAdjacentHTML("beforeend", `
      <div class="mode-sheet-mask language-sheet-mask" id="language-sheet-mask">
        <section class="mode-sheet language-sheet">
          <p class="eyebrow">Language</p>
          <h2>${i(n("languageTitle"))}</h2>
          <p class="summary">${i(n("languageSummary"))}</p>
          <div class="language-list">
            ${St.map((e) => `
                  <button type="button" class="language-option ${e.code === a.language ? "active" : ""}" data-language="${e.code}">
                    <span class="language-flag" aria-hidden="true">${e.flag}</span>
                    <span>
                      <strong>${i(e.nativeName)}</strong>
                      <small>${i(e.displayName)}</small>
                    </span>
                    <i aria-hidden="true">${e.code === a.language ? "\u2713" : ""}</i>
                  </button>
                `).join("")}
          </div>
          <button type="button" class="secondary" id="close-language-sheet">${i(n("languageCancel"))}</button>
        </section>
      </div>
    `), document.querySelector("#close-language-sheet")?.addEventListener("click", () => {
    document.querySelector("#language-sheet-mask")?.remove();
  }), document.querySelectorAll("[data-language]").forEach((e) => {
    e.addEventListener("click", () => {
      const t = e.dataset.language;
      if (Jt.includes(t)) {
        if (yn(t), document.querySelector("#language-sheet-mask")?.remove(), a.activePanel === "mine") {
          L();
          return;
        }
        _();
      }
    });
  });
}
function _() {
  Q(), O(), ce();
  const e = a.home;
  if (!e) {
    Fe(n("missingHome"));
    return;
  }
  const t = X("points_battle") || 100, r = ie("points_battle"), o = X("poc_battle") || 1, s = ie("poc_battle"), l = X("pi_battle") || 1, c = ie("pi_battle"), d = e.stats, u = mt("maintenanceNotice"), h = sr(e), p = B(F().richBattleMinRankKey || "platinum"), f = a.gameConfig?.operation;
  R.innerHTML = `
    <main class="shell">
      <section class="hero home-hero">
        <div class="brand-mark" aria-hidden="true">${BRAND_MARK_HTML}</div>
        ${Ir()}
        <p class="eyebrow">${i(h.englishName)}</p>
        <h1>${i(h.projectName)}</h1>
        <p class="brand-subtitle">Blitz of Pi</p>
        <p class="summary">${i(h.bannerDescription)}</p>
        <div class="mode-strip">
          <span>${i(n("realtimePvp"))}</span>
          <span>${i(n("match3"))}</span>
          <span>${i(n("piReward"))}</span>
          <button type="button" class="mode-strip-action" id="open-game-tips">
            <i aria-hidden="true">\u2726</i>
            <span>${i(n("gameTips"))}</span>
          </button>
          <button type="button" class="mode-strip-action" id="open-rank-leaderboard">
            <i aria-hidden="true">\u265B</i>
            <span>${i(n("rankBoard"))}</span>
          </button>
        </div>
        ${d ? `<section class="trust-strip" aria-label="\u5E73\u53F0\u771F\u5B9E\u6570\u636E">
                <article><span>${i(n("totalBattles"))}</span><strong>${Zn(d.totalBattles)}</strong></article>
                <article><span>${i(n("publicRewardPi"))}</span><strong>${i(formatPublicRewardNumber("PI", d.totalRewardPi))}</strong></article>
                <article><span>${i(n("publicRewardPoints"))}</span><strong>${i(formatPublicRewardNumber("POINTS", d.totalRewardPoints))}</strong></article>
                <article><span>${i(n("publicRewardPoc"))}</span><strong>${i(formatPublicRewardNumber("POC", d.totalRewardPoc))}</strong></article>
              </section>` : ""}
        ${renderDailyRewardEntry()}
        ${Er()}
        <section class="home-arena">
          <article class="arena-card free">
            <i class="mode-icon quick" aria-hidden="true"></i>
            <div class="arena-copy">
              <span>${i(n("practiceMode"))}</span>
              <strong>${i(n("quickBattle"))}</strong>
              <small>${i(n("quickBattleDesc", { cap: Le("quick_battle") }))}</small>
            </div>
          </article>
          <article class="arena-card premium">
            <i class="mode-icon ticket" aria-hidden="true"></i>
            <div class="arena-copy">
              <span>${i(n("modePointsTag"))}</span>
              <strong>${i(I("points_battle"))}</strong>
              <small>${i(n("modeEntryRewardText", { entry: formatModeAmount("points_battle", t), reward: formatModeAmount("points_battle", r), cap: Le("points_battle") }))}</small>
            </div>
          </article>
          <article class="arena-card premium rich">
            <i class="mode-icon rich" aria-hidden="true"></i>
            <div class="arena-copy">
              <span>${i(n("modePocTag"))}</span>
              <strong>${i(I("poc_battle"))}</strong>
              <small>${i(n("modeEntryRewardText", { entry: formatModeAmount("poc_battle", o), reward: formatModeAmount("poc_battle", s), cap: Le("poc_battle") }))}</small>
            </div>
          </article>
          <article class="arena-card premium rich">
            <i class="mode-icon rich" aria-hidden="true"></i>
            <div class="arena-copy">
              <span>${i(n("modePiTag"))}</span>
              <strong>${i(I("pi_battle"))}</strong>
              <small>${i(n("modePiEntryRewardText", { entry: formatModeAmount("pi_battle", l), reward: formatModeAmount("pi_battle", c), rank: p }))}</small>
            </div>
          </article>
        </section>
        <section class="rank-route">
          <p class="eyebrow">${i(n("rankRoute"))}</p>
          <div>
            <span>${i(n("quickShort"))}</span><strong>${i(B("silver"))}</strong>
            <i></i>
            <span>${i(I("points_battle"))}</span><strong>${i(B("platinum"))}</strong>
            <i></i>
            <span>${i(I("pi_battle"))}</span><strong>${i(`${B("starlight")}/${B("king")}`)}</strong>
          </div>
        </section>
        ${f?.maintenanceEnabled ? `<article class="notice danger-notice">
                <h2>${i(n("maintenanceTitle"))}</h2>
                <p>${i(u || n("maintenanceFallback"))}</p>
              </article>` : ""}
        <div class="actions">
          <button type="button" class="primary-action" id="start-match">${i(n("chooseBattleMode"))}</button>
        </div>
      </section>
      ${ca("home")}
    </main>
  `, document.querySelector("#start-match")?.addEventListener("click", async () => {
    Xa();
  }), Dr(), document.querySelector("#open-daily-rewards")?.addEventListener("click", () => openDailyRewards()), document.querySelector("#open-home-invite")?.addEventListener("click", () => at()), document.querySelector("#open-game-tips")?.addEventListener("click", () => Hr()), document.querySelector("#open-rank-leaderboard")?.addEventListener("click", async () => {
    await Kt(1), Ot();
  }), da();
}
function Ot() {
  document.querySelectorAll("#leaderboard-sheet-mask").forEach((s) => s.remove());
  const e = a.rankLeaderboard, t = e?.items || [], r = e?.myRank, o = _t((e?.weeklyModes || ["points_battle", "poc_battle", "pi_battle"]).map(I));
  R.insertAdjacentHTML("beforeend", `
      <div class="mode-sheet-mask" id="leaderboard-sheet-mask">
        <section class="mode-sheet leaderboard-sheet">
          <div class="leaderboard-sheet-head">
            <p class="eyebrow">${i(n("weeklyReward"))} \xB7 ${i(e?.seasonNo || "")}</p>
            <h2>${i(n("weeklyTitle"))}</h2>
            <p class="summary">${i(n("weeklySummary", { modes: o }))}</p>
          </div>
          <div class="leaderboard-scroll-body">
            <section class="leaderboard-my-rank">
              ${r ? `<div><span>${i(n("myWeeklyRank"))}</span><strong>#${r.rankNo}</strong></div>
                     <div><span>${i(n("weeklyRecord"))}</span><strong>${i(n("rankMeta", { stars: r.weeklyStarGain || 0, wins: r.weeklyWinCount || 0 }))}</strong></div>
                     <div><span>${i(n("expectedReward"))}</span><strong>${b(r.rewardAmount || 0)}</strong></div>` : `<div><span>${i(n("myWeeklyRank"))}</span><strong>${i(n("notRanked"))}</strong></div>
                     <div><span>${i(n("weeklyRecord"))}</span><strong>${i(n("rankMeta", { stars: 0, wins: 0 }))}</strong></div>
                     <div><span>${i(n("rankHow"))}</span><strong>${i(n("winPaidMatch"))}</strong></div>`}
            </section>
            ${Or(e?.rewardTiers || [])}
            <div class="leaderboard-list">
              ${t.length ? t.map(Ur).join("") : `<article class="leaderboard-empty">${i(n("emptyLeaderboard"))}</article>`}
            </div>
            <div class="leaderboard-pager">
              <button type="button" class="secondary" id="leaderboard-prev" ${!e || e.page <= 1 ? "disabled" : ""}>${i(n("prevPage"))}</button>
              <span>${i(n("leaderboardPager", { page: e?.page || 1, totalPages: e?.totalPages || 1, total: e?.total || 0 }))}</span>
              <button type="button" class="secondary" id="leaderboard-next" ${!e || e.page >= e.totalPages ? "disabled" : ""}>${i(n("nextPage"))}</button>
            </div>
          </div>
          <div class="leaderboard-sheet-actions">
            <button type="button" class="secondary" id="close-leaderboard-sheet" data-close-leaderboard="1">${i(n("gotIt"))}</button>
          </div>
        </section>
      </div>
    `), document.querySelector("#leaderboard-sheet-mask")?.addEventListener("click", (s) => {
    const l = s.target;
    (s.target === s.currentTarget || l?.closest("[data-close-leaderboard]")) && document.querySelectorAll("#leaderboard-sheet-mask").forEach((c) => c.remove());
  }), bindLeaderboardPager();
}
function bindLeaderboardPager() {
  document.querySelector("#leaderboard-prev")?.addEventListener("click", () => updateLeaderboardPage((a.rankLeaderboard?.page || 1) - 1));
  document.querySelector("#leaderboard-next")?.addEventListener("click", () => updateLeaderboardPage((a.rankLeaderboard?.page || 1) + 1));
}
function renderLeaderboardPageBody() {
  const e = a.rankLeaderboard, t = e?.items || [], r = e?.myRank;
  return `
    <section class="leaderboard-my-rank">
      ${r ? `<div><span>${i(n("myWeeklyRank"))}</span><strong>#${r.rankNo}</strong></div>
             <div><span>${i(n("weeklyRecord"))}</span><strong>${i(n("rankMeta", { stars: r.weeklyStarGain || 0, wins: r.weeklyWinCount || 0 }))}</strong></div>
             <div><span>${i(n("expectedReward"))}</span><strong>${b(r.rewardAmount || 0)}</strong></div>` : `<div><span>${i(n("myWeeklyRank"))}</span><strong>${i(n("notRanked"))}</strong></div>
             <div><span>${i(n("weeklyRecord"))}</span><strong>${i(n("rankMeta", { stars: 0, wins: 0 }))}</strong></div>
             <div><span>${i(n("rankHow"))}</span><strong>${i(n("winPaidMatch"))}</strong></div>`}
    </section>
    ${Or(e?.rewardTiers || [])}
    <div class="leaderboard-list">
      ${t.length ? t.map(Ur).join("") : `<article class="leaderboard-empty">${i(n("emptyLeaderboard"))}</article>`}
    </div>
    <div class="leaderboard-pager">
      <button type="button" class="secondary" id="leaderboard-prev" ${!e || e.page <= 1 ? "disabled" : ""}>${i(n("prevPage"))}</button>
      <span>${i(n("leaderboardPager", { page: e?.page || 1, totalPages: e?.totalPages || 1, total: e?.total || 0 }))}</span>
      <button type="button" class="secondary" id="leaderboard-next" ${!e || e.page >= e.totalPages ? "disabled" : ""}>${i(n("nextPage"))}</button>
    </div>
  `;
}
async function updateLeaderboardPage(e) {
  const t = document.querySelector(".leaderboard-scroll-body"), r = document.querySelector(".leaderboard-pager");
  if (!t || r?.classList.contains("loading")) return;
  r?.classList.add("loading"), r?.querySelectorAll("button").forEach((o) => {
    o.disabled = true;
  });
  try {
    await Kt(e), t.innerHTML = renderLeaderboardPageBody(), t.scrollTop = 0, bindLeaderboardPager();
  } finally {
    document.querySelector(".leaderboard-pager")?.classList.remove("loading");
  }
}
function Or(e) {
  const t = e.slice(0, 5);
  return t.length ? `
    <section class="reward-tier-board" aria-label="${i(n("rewardTiersAria"))}">
      ${t.map((r, o) => {
    const s = r.fromRank === r.toRank ? n("rankSingle", { rank: r.fromRank }) : n("rankRange", { from: r.fromRank, to: r.toRank });
    return `
            <article class="${o < 3 ? `top top-${o + 1}` : "wide"}">
              <span>${i(s)}</span>
              <strong>${b(r.amount)}</strong>
              <small>${i(o === 0 ? n("championPool") : o < 3 ? n("leaderboardReward") : n("listedReward"))}</small>
            </article>
          `;
  }).join("")}
    </section>
  ` : `<section class="reward-tier-board empty">${i(n("rewardNotConfigured"))}</section>`;
}
function Ur(e) {
  const t = { nickname: e.nickname || e.piUsername || n("piPlayer"), piUsername: e.piUsername || "", avatarKey: e.avatarKey }, r = ke(e.rankKey || e.rankName), o = e.rankNo <= 3 ? [n("champion"), n("runnerUp"), n("thirdPlace")][e.rankNo - 1] : n("rankNo", { rank: e.rankNo }), s = e.weeklyBattleCount !== void 0 ? n("weeklyMetaReward", { stars: e.weeklyStarGain || 0, wins: e.weeklyWinCount || 0, amount: b(e.rewardAmount || 0) }) : n("rankMeta", { stars: e.stars, wins: e.winCount });
  return `
    <article class="leaderboard-item ${e.rankNo <= 3 ? "top" : ""}">
      <b>${i(o)}</b>
      ${xe(t, "medium")}
      <div>
        <strong>${i(t.nickname)}</strong>
        <span style="--rank-color: ${i(r.color)}">${i(r.icon)} ${i(G(e.rankKey || e.rankName))} \xB7 ${i(s)}</span>
      </div>
      <em>${i(e.weeklyBattleCount !== void 0 ? n("matchCount", { count: e.weeklyBattleCount }) : n("winStreakCount", { count: e.winStreak }))}</em>
    </article>
  `;
}
function Hr() {
  R.insertAdjacentHTML("beforeend", `
      <div class="mode-sheet-mask" id="tips-sheet-mask">
        <section class="mode-sheet tips-sheet">
          <p class="eyebrow">${i(n("gameTips"))}</p>
          <h2>${i(n("beginnerTitle"))}</h2>
          <div class="guide-steps">
            <article><b>1</b><span>${i(n("guideStep1"))}</span></article>
            <article><b>2</b><span>${i(n("guideStep2"))}</span></article>
            <article><b>3</b><span>${i(n("guideStep3"))}</span></article>
            <article><b>4</b><span>${i(n("guideStep4"))}</span></article>
          </div>
          <h2 class="tips-subtitle">${i(n("highScoreTitle"))}</h2>
          <div class="tips-grid">
            <article>
              <strong>${i(n("basicRules"))}</strong>
              <span>${i(n("basicRulesText"))}</span>
            </article>
            <article>
              <strong>${i(n("scoreRules"))}</strong>
              <span>${i(n("scoreRulesText"))}</span>
            </article>
            <article>
              <strong>${i(n("attackPressure"))}</strong>
              <span>${i(n("attackPressureText"))}</span>
            </article>
            <article>
              <strong>${i(n("winRule"))}</strong>
              <span>${i(n("winRuleText"))}</span>
            </article>
            <article>
              <strong>${i(n("battleTipsTitle"))}</strong>
              <span>${i(n("battleTipsText"))}</span>
            </article>
            <article>
              <strong>${i(n("battleTypes"))}</strong>
              <span>${i(n("battleTypesText"))}</span>
            </article>
          </div>
          <h2 class="tips-subtitle">${i(n("rankRules"))}</h2>
          <div class="rank-rule-list">
            ${Ya()}
          </div>
          <button type="button" class="secondary" id="close-tips-sheet">${i(n("gotIt"))}</button>
        </section>
      </div>
    `), document.querySelector("#close-tips-sheet")?.addEventListener("click", () => {
    document.querySelector("#tips-sheet-mask")?.remove();
  }), document.querySelector("#tips-sheet-mask")?.addEventListener("click", (e) => {
    e.target === e.currentTarget && document.querySelector("#tips-sheet-mask")?.remove();
  });
}
function Ya() {
  const e = F(), t = _t((e.rankedModes || []).map(I)) || `${I("points_battle")}, ${I("poc_battle")}, ${I("pi_battle")}`, r = _t((e.weeklyLeaderboardModes || ["points_battle", "poc_battle", "pi_battle"]).map(I));
  return `
    <article><b>${i(n("starUp"))}</b><span>${i(n("starRuleText", { win: e.winStars, lose: e.loseStars }))}</span></article>
    <article><b>${i(n("protection"))}</b><span>${i(e.bronzeProtection ? n("bronzeProtectText") : n("noProtectText"))}</span></article>
    <article><b>${i(n("winStreak"))}</b><span>${i(e.winStreakBonusEnabled ? n("streakEnabledText", { required: e.winStreakRequired, bonus: e.winStreakBonusStars }) : n("streakDisabledText"))}</span></article>
    <article><b>${i(n("validModes"))}</b><span>${i(n("validModesText", { modes: t, count: e.dailyChestRequiredBattles }))}</span></article>
    <article><b>${i(n("quickCap"))}</b><span>${i(n("quickCapText", { rank: B(e.quickBattleMaxRankKey || "silver") }))}</span></article>
    <article><b>${i(n("richCap"))}</b><span>${i(n("ticketCapText", { rank: B(e.ticketBattleMaxRankKey || "platinum") }))}</span></article>
    <article><b>${i(n("weeklyBonus"))}</b><span>${i(n("weeklyBonusText", { modes: r }))}</span></article>
    <article><b>${i(n("richEntry"))}</b><span>${i(n("richEntryText", { rank: B(e.richBattleMinRankKey) }))}</span></article>
    <article><b>${i(n("note"))}</b><span>${i(mt("ruleSummary") || n("ruleSummaryFallback"))}</span></article>
  `;
}
function zr() {
  ke(a.user?.rankName), R.insertAdjacentHTML("beforeend", `
      <div class="mode-sheet-mask" id="rank-rules-mask">
        <section class="mode-sheet rank-rules-sheet">
          <p class="eyebrow">${i(n("rankRules"))}</p>
          <h2>${i(n("rankCurrentTitle", { rank: G(a.user?.rankName) }))}</h2>
          <div class="rank-rule-list">
            ${Ya()}
          </div>
          <button type="button" class="secondary" id="close-rank-rules">${i(n("gotIt"))}</button>
        </section>
      </div>
    `), document.querySelector("#close-rank-rules")?.addEventListener("click", () => {
    document.querySelector("#rank-rules-mask")?.remove();
  }), document.querySelector("#rank-rules-mask")?.addEventListener("click", (e) => {
    e.target === e.currentTarget && document.querySelector("#rank-rules-mask")?.remove();
  });
}
async function copyTextToClipboard(e) {
  const t = String(e || "").trim();
  if (!t) return false;
  if (navigator.clipboard?.writeText && window.isSecureContext) {
    await navigator.clipboard.writeText(t);
    return true;
  }
  const r = document.createElement("textarea");
  r.value = t, r.setAttribute("readonly", ""), r.style.position = "fixed", r.style.left = "-9999px", document.body.appendChild(r), r.select();
  const o = document.execCommand("copy");
  return r.remove(), o;
}
async function copyPiUsername() {
  const e = a.user?.piUsername || "";
  if (!e) {
    S(n("noPiUsername"), "error");
    return;
  }
  try {
    await copyTextToClipboard(e), S(n("copyPiUsernameSuccess"), "success");
  } catch {
    S(n("copyPiUsernameFailed"), "error");
  }
}
function sanitizeInviteCode(e) {
  const t = String(e || "").trim().replace(/^@+/, "");
  return /^[A-Za-z0-9_.-]{3,40}$/.test(t) ? t : "";
}
function getStoredInviteCode() {
  return sanitizeInviteCode(localStorage.getItem(INVITE_CODE_STORAGE_KEY));
}
function clearStoredInviteCode() {
  localStorage.removeItem(INVITE_CODE_STORAGE_KEY);
}
function captureInviteCodeFromLocation() {
  const e = new URLSearchParams(window.location.search), t = sanitizeInviteCode(e.get("invite") || e.get("ref") || e.get("code"));
  if (t) {
    localStorage.setItem(INVITE_CODE_STORAGE_KEY, t);
    return t;
  }
  const r = window.location.pathname.split("/").filter(Boolean).map((o) => {
    try {
      return decodeURIComponent(o);
    } catch {
      return "";
    }
  });
  let o = "";
  if (r[0] === "i" || r[0] === "invite") {
    o = sanitizeInviteCode(r[1] || "");
  } else if (r.length === 1) {
    const s = r[0] || "", l = new Set(["api", "admin-api", "assets", "health", "favicon.ico", "robots.txt", "sitemap.xml", "validation-key.txt"]);
    !l.has(s.toLowerCase()) && !s.includes(".") && (o = sanitizeInviteCode(s));
  }
  return o ? (localStorage.setItem(INVITE_CODE_STORAGE_KEY, o), o) : "";
}
function getMyInviteCode() {
  return sanitizeInviteCode(a.user?.piUsername || a.user?.uid || "");
}
function getMyInviteLink() {
  const e = getMyInviteCode();
  return e ? `${window.location.origin}/i/${encodeURIComponent(e)}` : "";
}
async function copyInviteLink() {
  const e = getMyInviteLink();
  if (!e) {
    S(n("inviteLinkUnavailable"), "error");
    return;
  }
  try {
    await copyTextToClipboard(e), S(n("inviteLinkCopied"), "success");
  } catch {
    S(e, "error");
  }
}
async function tryAutoBindInvite() {
  const e = getStoredInviteCode();
  if (!e || !a.user || !a.inviteInfo?.config?.enabled) return;
  if (a.inviteInfo?.inviter) {
    clearStoredInviteCode();
    return;
  }
  const t = String(e).toLowerCase(), r = [a.user.piUsername, a.user.uid].filter(Boolean).map((l) => String(l).toLowerCase());
  if (r.includes(t)) {
    clearStoredInviteCode();
    return;
  }
  try {
    await w("/api/invite/bind", { method: "POST", body: JSON.stringify({ inviterPiUsername: e }) }), clearStoredInviteCode(), await D(), S(n("inviteAutoBindSuccess"), "success");
  } catch (o) {
    const s = N(o);
    if (/已经绑定|不能绑定自己|不存在|限制|请填写/.test(s)) {
      clearStoredInviteCode(), S(n("inviteAutoBindFailed"), "error");
    } else {
      console.warn("邀请链接自动绑定失败", o);
    }
  }
}
captureInviteCodeFromLocation();
function L() {
  Q(), O(), ce();
  const e = a.user, t = a.wallet;
  if (!e) {
    Fe(n("missingUser"));
    return;
  }
  R.innerHTML = `
    <main class="shell">
      <section class="hero">
        <div class="brand-mark" aria-hidden="true">${BRAND_MARK_HTML}</div>
        <button type="button" class="mine-effect-entry" id="open-visual-effect-sheet" aria-label="${i(n("visualEffectTitle"))}">
          <span aria-hidden="true">\u2726</span>
          ${i(n("visualEffectOpen"))}
        </button>
        <p class="eyebrow">${i(n("myRecord"))}</p>
        <h1>${i(n("mine"))}</h1>
        <article class="profile-card account-card">
          ${xe(e)}
          <div class="profile-main">
            <span class="profile-kicker">${i(n("playerProfile"))}</span>
            <strong>${i(e.nickname)}</strong>
            <small class="pi-username-row"><span>${i(n("piUsername"))}\uFF1A${i(e.piUsername || "-")}</span>${e.piUsername ? `<button type="button" class="copy-pi-username" id="copy-pi-username" aria-label="${i(n("copyPiUsername"))}">${i(n("copyPiUsername"))}</button>` : ""}</small>
          </div>
          <button type="button" class="ghost-button" id="edit-profile">${i(n("edit"))}</button>
          ${Sr()}
          <section class="profile-wallet" aria-label="${i(n("walletOverview"))}">
            <div class="profile-wallet-grid">
              <article><span>${i(n("availableBalance"))}</span><strong>${b(t?.availableBalance ?? 0)}</strong></article>
              <article><span>${i(n("pointsAsset"))}</span><strong>${i(getModeBalanceState("points_battle").label)}</strong></article>
              <article><span>${i("POC")}</span><strong>${i(getModeBalanceState("poc_battle").label)}</strong></article>
              <article><span>${i(n("lockedBalance"))}</span><strong>${b(t?.lockedBalance ?? 0)}</strong></article>
              <article><span>${i(n("totalRecharge"))}</span><strong>${b(t?.totalRecharge ?? 0)}</strong></article>
              <article><span>${i(n("totalWithdraw"))}</span><strong>${b(t?.totalWithdraw ?? 0)}</strong></article>
            </div>
            <div class="profile-wallet-actions">
              <button type="button" id="open-recharge">${i(n("rechargeWallet"))}</button>
              <button type="button" class="secondary" id="open-withdraw">${i(n("applyWithdraw"))}</button>
              <button type="button" class="secondary" id="open-transfer">${i(n("transferBalance"))}</button>
              <button type="button" class="secondary" id="open-invite">${i(n("inviteFriends"))}</button>
            </div>
          </section>
        </article>
        ${ar()}
        ${vr(t)}
        ${Cr()}
        ${yr(a.battleHistory)}
        ${wr(a.battleHistory)}
      </section>
      ${ca("mine")}
    </main>
  `, document.querySelector("#edit-profile")?.addEventListener("click", () => Qa()), document.querySelector("#copy-pi-username")?.addEventListener("click", () => copyPiUsername()), document.querySelector("#open-rank-rules")?.addEventListener("click", () => zr()), document.querySelector("#toggle-wallet-ledger")?.addEventListener("click", () => {
    a.walletLedgerExpanded = !a.walletLedgerExpanded, a.walletLedgerPage = 1, L();
  }), document.querySelectorAll("[data-wallet-ledger-filter]").forEach((r) => {
    r.addEventListener("click", () => {
      a.walletLedgerFilter = r.dataset.walletLedgerFilter || "all", a.walletLedgerPage = 1, L();
    });
  }), document.querySelector("#wallet-ledger-prev")?.addEventListener("click", () => {
    a.walletLedgerPage = Math.max(1, a.walletLedgerPage - 1), L();
  }), document.querySelector("#wallet-ledger-next")?.addEventListener("click", () => {
    const r = Math.max(1, Math.ceil(((a.wallet?.allLedgers || [...(a.wallet?.ledgers || []), ...(a.wallet?.assetLedgers || [])]).filter((o) => a.walletLedgerFilter === "all" || getLedgerAssetType(o) === a.walletLedgerFilter).length || 0) / fe));
    a.walletLedgerPage = Math.min(r, a.walletLedgerPage + 1), L();
  }), document.querySelector("#claim-rank-chest")?.addEventListener("click", async () => {
    try {
      await w("/api/rank/daily-chest/claim", { method: "POST" }), await D(), L();
    } catch (r) {
      S(N(r), "error");
    }
  }), document.querySelector("#open-recharge")?.addEventListener("click", () => jr()), document.querySelector("#open-withdraw")?.addEventListener("click", () => Vr()), document.querySelector("#open-transfer")?.addEventListener("click", () => Kr()), document.querySelector("#open-visual-effect-sheet")?.addEventListener("click", () => Rr()), document.querySelectorAll("#open-invite, [data-open-invite]").forEach((r) => r.addEventListener("click", () => at())), document.querySelectorAll("[data-history-filter]").forEach((r) => {
    r.addEventListener("click", async () => {
      a.battleHistoryFilter = r.dataset.historyFilter || "all", await vt(1), L();
    });
  }), document.querySelector("#history-prev")?.addEventListener("click", async () => {
    await vt(a.battleHistoryPage - 1), L();
  }), document.querySelector("#history-next")?.addEventListener("click", async () => {
    await vt(a.battleHistoryPage + 1), L();
  }), da();
}
function Xa() {
  const e = F(), t = !ia(), r = B(e.richBattleMinRankKey || "platinum"), o = ["quick_battle", "points_battle", "poc_battle", "pi_battle"], s = o.map((d) => {
    const u = pt(d) || {}, h = d === "pi_battle" && t, p = u.enabled === false || isAssetGatewayModeClosed(d), f = d === "quick_battle", g = getModeBalanceState(d), P = h || p, C = p ? "\u6682\u672A\u5F00\u653E" : h ? n("richUnlock", { rank: r }) : "", T = f ? "\u514D\u8D39\u7EC3\u624B" : `\u95E8\u7968 ${formatModeAmount(d, X(d))} \xB7 \u80DC\u5956 ${formatModeAmount(d, ie(d))}`, U = f ? "\u4E45\u7B49\u8865\u673A\u5668\u4EBA" : `\u4F59\u989D ${g.label} \xB7 \u771F\u4EBA`;
    return `
          <button type="button" class="mode-card ${f ? "" : "premium"} ${d === "points_battle" ? "recommended" : ""} ${d === "poc_battle" || d === "pi_battle" ? "rich" : ""} ${P ? "locked" : ""}" data-start-mode="${d}" data-locked="${P ? "true" : "false"}" data-lock-reason="${i(C)}" aria-disabled="${P ? "true" : "false"}">
            <i class="mode-icon ${modeAssetMeta(d).icon}" aria-hidden="true"></i>
            <span class="mode-copy">
              <strong>${i(I(d))}${d === "points_battle" ? `<b class="mode-card-recommend">${i(n("paidModeRecommend"))}</b>` : ""}${C && !p ? i(C) : ""}</strong>
              <span>${i(T)}</span>
              <em class="mode-economy">${i(U)}${p ? ` \xB7 ${i("\u6682\u672A\u5F00\u653E")}` : ""}</em>
            </span>
          </button>`;
  }).join("");
  R.insertAdjacentHTML("beforeend", `
      <div class="mode-sheet-mask" id="mode-sheet-mask">
        <section class="mode-sheet">
          <p class="eyebrow">${i(n("battleMode"))}</p>
          <h2>${i(n("chooseModeTitle"))}</h2>
          ${s}
          <div class="newbie-tip">
            <strong>${i(n("newbieTipTitle"))}</strong>
            <span>${i(n("newbieTipText"))}</span>
          </div>
          <button type="button" class="secondary" id="close-mode-sheet">${i(n("languageCancel"))}</button>
        </section>
      </div>
    `), document.querySelector("#close-mode-sheet")?.addEventListener("click", () => {
    document.querySelector("#mode-sheet-mask")?.remove();
  }), document.querySelectorAll("[data-start-mode]").forEach((u) => {
    u.addEventListener("click", () => {
      const h = o.includes(u.dataset.startMode) ? u.dataset.startMode : "quick_battle";
      if (u.dataset.locked === "true") {
        const p = document.querySelector("#mode-lock-note"), f = u.dataset.lockReason || "\u6682\u672A\u5F00\u653E";
        p && (p.classList.add("warning"), p.innerHTML = i(f)), u.classList.remove("locked-shake"), u.offsetWidth, u.classList.add("locked-shake");
        return;
      }
      document.querySelector("#mode-sheet-mask")?.remove(), ma(h);
    });
  });
}
function ma(e) {
  const t = X(e), r = ie(e), o = la(e), s = I(e), l = getModeBalanceState(e), c = pt(e)?.enabled === false || isAssetGatewayModeClosed(e), d = l.error || "", u = o && !d && l.balance < t, h = F(), p = e === "pi_battle" && !ia(), f = c || !!d || u || p;
  R.insertAdjacentHTML("beforeend", `
      <div class="mode-sheet-mask" id="confirm-sheet-mask">
        <section class="mode-sheet">
          <p class="eyebrow">${i(n("readyStart"))}</p>
          <h2>${i(o ? n("confirmPaidMode", { mode: s }) : n("confirmQuickMode"))}</h2>
          <p class="summary">${i(o ? `\u95E8\u7968 ${formatModeAmount(e, t)} \xB7 \u4F59\u989D ${l.label} \xB7 \u80DC\u5956 ${formatModeAmount(e, r)}` : n("quickConfirmSummary"))}</p>
          <div class="rule-list">
            <span>${i(n("ruleSwapShort"))}</span>
            <span>${i(Va(e) ? n("rankedModeText", { mode: s, cap: Le(e) }) : n("unrankedModeText", { mode: s }))}</span>
            <span>${i(n(Dt(e) ? "weeklyBattleOn" : "weeklyBattleOff"))}</span>
          </div>
          ${qr(e, t, r)}
          ${c ? `<p class="summary danger-text">${i("\u8BE5\u573A\u6B21\u6682\u672A\u5F00\u653E\uFF0C\u8BF7\u7B49\u5F85\u8FD0\u8425\u5F00\u542F")}</p>` : ""}
          ${d ? `<p class="summary danger-text">${i(d)}</p>` : ""}
          ${u ? `<p class="summary danger-text">${i(n("insufficientBalance", { mode: s }))}</p>` : ""}
          ${p ? `<p class="summary danger-text">${i(n("richRankLocked", { rank: B(h.richBattleMinRankKey) }))}</p>` : ""}
          <button type="button" class="primary-action" id="confirm-start-match" ${f ? "disabled" : ""}>${i(n(o ? "confirmPaidStart" : "startMatching"))}</button>
          <button type="button" class="secondary" id="cancel-start-match">${i(n("languageCancel"))}</button>
        </section>
      </div>
    `), document.querySelector("#cancel-start-match")?.addEventListener("click", () => {
    document.querySelector("#confirm-sheet-mask")?.remove();
  }), document.querySelector("#confirm-start-match")?.addEventListener("click", async () => {
    document.querySelector("#confirm-sheet-mask")?.remove(), await un(e);
  });
}
function Qa(e = "edit") {
  const t = a.user;
  if (!t) {
    Fe(n("missingUser"));
    return;
  }
  const r = a.profileOptions?.avatars?.length ? a.profileOptions.avatars : [{ key: "avatar_1", name: "Lightning" }, { key: "avatar_2", name: "Gold" }, { key: "avatar_3", name: "Jade" }, { key: "avatar_4", name: "Wave" }, { key: "avatar_5", name: "Night" }, { key: "avatar_6", name: "Champion" }], o = a.profileOptions?.nicknameRules;
  R.innerHTML = `
    <main class="shell">
      <section class="hero profile-editor">
        <div class="brand-mark" aria-hidden="true">${BRAND_MARK_HTML}</div>
        <p class="eyebrow">${i(n(e === "setup" ? "loginLoading" : "playerProfile"))}</p>
        <h1>${i(n(e === "setup" ? "profileSetupTitle" : "profileEditTitle"))}</h1>
        <p class="summary">${i(n(e === "setup" ? "profileSetupSummary" : "profileEditSummary"))}</p>
        <form id="profile-form" class="recharge-form">
          <label>
            <span>${i(n("piUsername"))}</span>
            <input value="${i(t.piUsername || "-")}" disabled />
          </label>
          <label>
            <span>${i(n("nicknameLabel"))}</span>
            <input name="nickname" maxlength="${o?.maxLength || 12}" value="${i(t.nickname)}" />
          </label>
          <p class="summary">${i(n("nicknameRule", { pattern: o?.pattern || n("nicknamePatternFallback"), min: o?.minLength || 2, max: o?.maxLength || 12 }))}</p>
          <div class="avatar-picker" role="radiogroup" aria-label="${i(n("chooseAvatar"))}">
            ${r.map((s) => `
                  <label class="avatar-option ${s.key === t.avatarKey ? "selected" : ""}">
                    <input type="radio" name="avatarKey" value="${s.key}" ${s.key === t.avatarKey ? "checked" : ""} />
                    <span class="${ta(s.key)} medium">${ea(t)}</span>
                    <em>${i(_n(s))}</em>
                  </label>
                `).join("")}
          </div>
          <button type="submit">${i(n(e === "setup" ? "saveEnterLobby" : "saveProfile"))}</button>
          ${e === "edit" ? `<button type="button" class="secondary" id="back-home">${i(n("backLobby"))}</button>` : ""}
          <p id="profile-status" class="summary"></p>
        </form>
      </section>
      ${ca(a.activePanel)}
    </main>
  `, document.querySelector("#back-home")?.addEventListener("click", _), da(), document.querySelectorAll(".avatar-option").forEach((s) => {
    s.addEventListener("click", () => {
      document.querySelectorAll(".avatar-option").forEach((l) => l.classList.remove("selected")), s.classList.add("selected");
    });
  }), document.querySelector("#profile-form")?.addEventListener("submit", async (s) => {
    s.preventDefault();
    const l = document.querySelector("#profile-status"), c = new FormData(s.currentTarget);
    l && (l.textContent = n("savingProfile"));
    try {
      const d = await w("/api/profile/update", { method: "POST", body: JSON.stringify({ nickname: String(c.get("nickname") || ""), avatarKey: String(c.get("avatarKey") || "avatar_1") }) });
      a.user = d, l && (l.textContent = n("saveSuccess")), window.setTimeout(_, 600);
    } catch (d) {
      l && (l.textContent = N(d));
    }
  });
}
function jr() {
  const e = window.location.hostname === "sandbox.minepi.com" || a.piConfig?.frontendSandbox ? n("sandboxDebug") : n("mainnet"), t = Number(a.gameConfig?.rechargeBonus?.presets?.find((d) => Number(d.amount || 0) > 0)?.amount || 1), r = qt(t);
  R.innerHTML = `
    <main class="shell">
      <section class="hero">
        <div class="brand-mark" aria-hidden="true">${BRAND_MARK_HTML}</div>
        <p class="eyebrow">${i(n("wallet"))}</p>
        <h1>${i(n("rechargeWallet"))}</h1>
        <p class="summary">${i(mt("rechargeNotice") || n("rechargeSummary", { mode: e }))}</p>
        <form id="recharge-form" class="recharge-form">
          <label>
            <span>${i(n("rechargeAmount"))}</span>
            <input name="amount" type="number" inputmode="decimal" min="0.01" step="0.01" value="${t}" />
          </label>
          ${nr()}
          <p id="recharge-bonus-preview" class="summary">${i(r.bonus > 0 ? n("rechargeBonusPreview", { bonus: b(r.bonus), total: b(r.total) }) : n("rechargeNoBonusPreview", { total: b(r.total) }))}</p>
          <button type="submit">${i(n("createRechargeOrder"))}</button>
          <button type="button" class="secondary" id="back-home">${i(n("backLobby"))}</button>
          <p id="recharge-status" class="summary" role="status" aria-live="polite"></p>
        </form>
      </section>
    </main>
  `, document.querySelector("#back-home")?.addEventListener("click", _);
  const o = document.querySelector("#recharge-form"), s = o?.querySelector('input[name="amount"]'), l = document.querySelector("#recharge-bonus-preview"), c = () => {
    const d = qt(Number(s?.value || 0));
    l && (l.textContent = d.bonus > 0 ? n("rechargeBonusPreview", { bonus: b(d.bonus), total: b(d.total) }) : n("rechargeNoBonusPreview", { total: b(d.total) }));
  };
  s?.addEventListener("input", c), document.querySelectorAll("[data-recharge-amount]").forEach((d) => {
    d.addEventListener("click", () => {
      s && (s.value = d.dataset.rechargeAmount || "", c());
    });
  }), o?.addEventListener("submit", async (d) => {
    if (d.preventDefault(), o.dataset.busy === "true") return;
    const u = document.querySelector("#recharge-status"), h = new FormData(d.currentTarget), p = Number(h.get("amount"));
    u && (u.textContent = n("creatingOrder")), re(o, true);
    try {
      await Yr(p, u);
    } catch (f) {
      const m = Gr(f);
      u && (u.textContent = m), S(m, "error");
    } finally {
      re(o, false);
    }
  });
}
function Vr() {
  const e = a.wallet, t = Math.max(0.1, Number(a.gameConfig?.withdrawRisk?.minAmount || 0.1)), r = Ma(t), o = e?.availableBalance ?? 0;
  R.innerHTML = `
    <main class="shell">
      <section class="hero">
        <div class="brand-mark" aria-hidden="true">${BRAND_MARK_HTML}</div>
        <p class="eyebrow">Withdraw</p>
        <h1>${i(n("withdrawTitle"))}</h1>
        <p class="summary">${i(mt("withdrawNotice") || n("withdrawSummary", { balance: b(o), payout: b(r.payout) }))}</p>
        <form id="withdraw-form" class="recharge-form">
          <label>
            <span>${i(n("withdrawAmount"))}</span>
            <input name="amount" type="number" inputmode="decimal" min="${t}" step="0.01" value="${t}" />
          </label>
          <p id="withdraw-fee-preview" class="summary">${i(n("withdrawFeePreview", { fee: b(r.fee), payout: b(r.payout) }))}</p>
          <label>
            <span>${i(n("walletAddress"))}</span>
            <input name="walletAddress" inputmode="text" autocomplete="off" autocapitalize="characters" placeholder="${i(n("walletAddressPlaceholder"))}" />
          </label>
          <p id="wallet-check-status" class="summary" role="status" aria-live="polite"></p>
          ${ir()}
          <button type="submit">${i(n("submitWithdraw"))}</button>
          <button type="button" class="secondary" id="back-home">${i(n("backLobby"))}</button>
          <p id="withdraw-status" class="summary" role="status" aria-live="polite"></p>
        </form>
      </section>
    </main>
  `, document.querySelector("#back-home")?.addEventListener("click", _);
  const s = document.querySelector("#withdraw-form"), l = s?.querySelector('input[name="amount"]'), c = s?.querySelector('input[name="walletAddress"]'), d = document.querySelector("#withdraw-fee-preview"), u = document.querySelector("#wallet-check-status"), h = () => {
    const f = Number(l?.value || 0), m = Ma(f);
    d && (d.textContent = n("withdrawFeePreview", { fee: b(m.fee), payout: b(m.payout) }));
  }, p = () => {
    const f = tr(c?.value || "");
    return u && (u.textContent = f.address ? f.message : ""), f;
  };
  l?.addEventListener("input", h), c?.addEventListener("input", p), document.querySelectorAll("[data-wallet-address]").forEach((f) => {
    f.addEventListener("click", () => {
      c && (c.value = f.dataset.walletAddress || "", p());
    });
  }), s?.addEventListener("submit", async (f) => {
    if (f.preventDefault(), s.dataset.busy === "true") return;
    const m = document.querySelector("#withdraw-status"), g = new FormData(f.currentTarget), P = p();
    if (!P.valid) {
      m && (m.textContent = P.message), S(P.message, "error");
      return;
    }
    m && (m.textContent = n("submittingWithdraw")), re(s, true);
    try {
      const C = await w("/api/withdraw/check-wallet", { method: "POST", body: JSON.stringify({ walletAddress: P.address }) });
      if (!C.valid) {
        m && (m.textContent = C.message), S(C.message, "error");
        return;
      }
      const T = await w("/api/withdraw/apply", { method: "POST", body: JSON.stringify({ amount: Number(g.get("amount")), walletAddress: C.address, remark: "" }) }), U = rr(T);
      await D(), m && (m.textContent = U), S(U, "success"), window.setTimeout(_, 900);
    } catch (C) {
      const T = C instanceof Error ? C.message : n("withdrawFailed");
      m && (m.textContent = T), S(T, "error");
    } finally {
      re(s, false);
    }
  });
}
function Kr() {
  const e = a.gameConfig?.transfer, t = Math.max(e?.minAmount || 0.01, 0.01), r = Ba(t);
  R.innerHTML = `
    <main class="shell">
      <section class="hero">
        <div class="brand-mark" aria-hidden="true">${BRAND_MARK_HTML}</div>
        <p class="eyebrow">${i(n("wallet"))}</p>
        <h1>${i(n("transferTitle"))}</h1>
        <p class="summary">${i(n("transferSummary"))}</p>
        <form id="transfer-form" class="recharge-form">
          <label>
            <span>${i(n("receiverPiUsername"))}</span>
            <input name="toPiUsername" inputmode="text" autocomplete="off" autocapitalize="none" />
          </label>
          <button type="button" class="secondary" id="search-transfer-user">${i(n("searchReceiver"))}</button>
          <div id="transfer-user-preview" class="transfer-user-preview"></div>
          <label>
            <span>${i(n("transferAmount"))}</span>
            <input name="amount" type="number" inputmode="decimal" min="${t}" step="0.01" value="${t}" />
          </label>
          <p id="transfer-fee-preview" class="summary">${i(n("transferFeePreview", { fee: b(r.fee), receive: b(r.receive) }))}</p>
          <button type="submit">${i(n("confirmTransfer"))}</button>
          <button type="button" class="secondary" id="back-home">${i(n("backLobby"))}</button>
          <p id="transfer-status" class="summary" role="status" aria-live="polite"></p>
        </form>
      </section>
    </main>
  `, document.querySelector("#back-home")?.addEventListener("click", L);
  const o = document.querySelector("#transfer-form"), s = o?.querySelector('input[name="amount"]'), l = o?.querySelector('input[name="toPiUsername"]'), c = document.querySelector("#transfer-fee-preview"), d = document.querySelector("#transfer-status"), u = document.querySelector("#transfer-user-preview");
  let h = null;
  const p = () => {
    const f = Ba(Number(s?.value || 0));
    c && (c.textContent = n("transferFeePreview", { fee: b(f.fee), receive: b(f.receive) }));
  };
  s?.addEventListener("input", p), l?.addEventListener("input", () => {
    h = null, u && (u.innerHTML = "");
  }), document.querySelector("#search-transfer-user")?.addEventListener("click", async () => {
    const f = String(l?.value || "").trim();
    if (!f) {
      d && (d.textContent = n("receiverPiUsername")), S(n("receiverPiUsername"), "error");
      return;
    }
    d && (d.textContent = n("searchingUser"));
    try {
      const g = (await w(`/api/wallet/search-users?keyword=${encodeURIComponent(f)}`))[0];
      if (!g) {
        h = null, u && (u.innerHTML = ""), d && (d.textContent = n("userNotFound")), S(n("userNotFound"), "error");
        return;
      }
      h = g, l && (l.value = g.piUsername || g.uid), u && (u.innerHTML = `
          <article>
            ${xe(g)}
            <div>
              <strong>${i(g.nickname || g.piUsername)}</strong>
              <span>${i(g.piUsername || g.uid)} \xB7 ${i(G(g.rankName))}</span>
            </div>
          </article>
        `), d && (d.textContent = "");
    } catch (m) {
      const g = N(m);
      d && (d.textContent = g), S(g, "error");
    }
  }), o?.addEventListener("submit", async (f) => {
    if (f.preventDefault(), o.dataset.busy === "true") return;
    const m = new FormData(f.currentTarget), g = String(m.get("toPiUsername") || "").trim(), P = h?.piUsername || h?.uid || "";
    if (!h) {
      d && (d.textContent = n("confirmUserFirst")), S(n("confirmUserFirst"), "error");
      return;
    }
    if (g && g !== P) {
      d && (d.textContent = n("selectedUserChanged")), S(n("selectedUserChanged"), "error");
      return;
    }
    d && (d.textContent = n("processing")), re(o, true);
    try {
      await w("/api/wallet/transfer", { method: "POST", body: JSON.stringify({ toPiUsername: P, amount: Number(m.get("amount") || 0) }) }), await D(), d && (d.textContent = n("transferSuccess")), S(n("transferSuccess"), "success"), window.setTimeout(L, 700);
    } catch (C) {
      const T = N(C) || n("transferFailed");
      d && (d.textContent = T), S(T, "error");
    } finally {
      re(o, false);
    }
  });
}
function at() {
  const e = a.inviteInfo;
  if (!e?.config?.enabled) {
    R.innerHTML = `
      <main class="shell">
        <section class="hero">
          <div class="brand-mark" aria-hidden="true">${BRAND_MARK_HTML}</div>
          <p class="eyebrow">Invite</p>
          <h1>${i(n("inviteTitle"))}</h1>
          <p class="summary">${i(n("maintenanceFallback"))}</p>
          <button type="button" class="secondary" id="back-home">${i(n("backLobby"))}</button>
        </section>
      </main>
    `, document.querySelector("#back-home")?.addEventListener("click", L);
    return;
  }
  const t = e?.stats.levelKey ? e?.config.levels.find((f) => f.key === e.stats.levelKey) : null, r = (e?.claimableRewards || []).reduce((f, m) => f + Number(m.amount || 0), 0), o = Math.round(Number(t?.commissionRate || 0) * 1e3) / 10, s = Number(e.stats.totalCommission || 0) + Number(e.stats.totalQualificationReward || 0), inviteLink = getMyInviteLink();
  R.innerHTML = `
    <main class="shell">
      <section class="hero">
        <div class="brand-mark" aria-hidden="true">${BRAND_MARK_HTML}</div>
        <p class="eyebrow">Invite</p>
        <h1>${i(n("inviteTitle"))}</h1>
        <p class="summary">${i(n("inviteIncomeSummary"))}</p>
        <section class="invite-hero-card">
          <div>
            <span>${i(n("myInviteLevel"))}</span>
            <strong>${i(localizeInviteLevelName(e?.stats.levelName || t?.name || n("inviteNoLevel")))}</strong>
            <small>${i(n("inviteCommissionRate", { rate: o }))}</small>
          </div>
          <div>
            <span>${i(n("inviteTotalIncome"))}</span>
            <strong>${i(b(s))}</strong>
            <small>${i(n("inviteCount", { count: e.stats.directInviteCount || 0 }))}</small>
          </div>
        </section>
        <section class="invite-link-card">
          <div>
            <span>${i(n("myInviteLink"))}</span>
            <strong>${i(inviteLink || n("inviteLinkUnavailable"))}</strong>
            <small>${i(n("inviteLinkHint"))}</small>
          </div>
          <button type="button" class="secondary" id="copy-invite-link" ${inviteLink ? "" : "disabled"}>${i(n("copyInviteLink"))}</button>
        </section>
        ${Fr(e)}
        ${e?.inviter ? "" : `<form id="invite-bind-form" class="recharge-form compact-form invite-bind-top">
                <label>
                  <span>${i(n("inviterPiUsername"))}</span>
                  <input name="inviterPiUsername" inputmode="text" autocomplete="off" autocapitalize="none" value="${i(e?.config?.officialInviterPiUsername || "")}" />
                </label>
                <button type="button" class="secondary" id="search-invite-user">${i(n("searchInviter"))}</button>
                <div id="invite-user-preview" class="transfer-user-preview"></div>
                <button type="submit" class="secondary">${i(n("bindNow"))}</button>
                <p id="invite-bind-status" class="summary" role="status" aria-live="polite"></p>
              </form>`}
        ${xr(t)}
        ${Lr(e.stats.levelKey)}
        <button type="button" id="claim-invite-reward" ${r <= 0 ? "disabled" : ""}>${r > 0 ? i(n("inviteRewardReady", { amount: b(r) })) : i(n("noClaimableInviteReward"))}</button>
        ${_r(e)}
        <button type="button" class="secondary" id="back-home">${i(n("backLobby"))}</button>
        <p id="invite-status" class="summary" role="status" aria-live="polite"></p>
      </section>
    </main>
  `, document.querySelector("#back-home")?.addEventListener("click", L), document.querySelector("#copy-invite-link")?.addEventListener("click", () => copyInviteLink()), bindInvitePagination();
  const l = document.querySelector("#invite-status"), c = document.querySelector("#invite-bind-status"), d = document.querySelector("#invite-bind-form"), u = d?.querySelector('input[name="inviterPiUsername"]'), h = document.querySelector("#invite-user-preview");
  let p = null;
  u?.addEventListener("input", () => {
    p = null, h && (h.innerHTML = "");
  }), document.querySelector("#search-invite-user")?.addEventListener("click", async () => {
    const f = String(u?.value || "").trim();
    if (!f) {
      c && (c.textContent = n("inviterPiUsername")), S(n("inviterPiUsername"), "error");
      return;
    }
    c && (c.textContent = n("searchingUser"));
    try {
      const g = (await w(`/api/wallet/search-users?keyword=${encodeURIComponent(f)}`))[0];
      if (!g) {
        p = null, h && (h.innerHTML = ""), c && (c.textContent = n("inviterNotFound")), S(n("inviterNotFound"), "error");
        return;
      }
      p = g, u && (u.value = g.piUsername || g.uid), h && (h.innerHTML = `
          <article>
            ${xe(g)}
            <div>
              <strong>${i(g.nickname || g.piUsername)}</strong>
              <span>${i(g.piUsername || g.uid)} \xB7 ${i(G(g.rankName))}</span>
            </div>
          </article>
        `), c && (c.textContent = "");
    } catch (m) {
      const g = N(m);
      c && (c.textContent = g), S(g, "error");
    }
  }), d?.addEventListener("submit", async (f) => {
    if (f.preventDefault(), d.dataset.busy === "true") return;
    const m = new FormData(f.currentTarget), g = String(m.get("inviterPiUsername") || "").trim(), P = p?.piUsername || p?.uid || "";
    if (!p && !g) {
      c && (c.textContent = n("confirmInviterFirst")), S(n("confirmInviterFirst"), "error");
      return;
    }
    if (p && g && g !== P) {
      c && (c.textContent = n("selectedUserChanged")), S(n("selectedUserChanged"), "error");
      return;
    }
    c && (c.textContent = n("processing")), re(d, true);
    try {
      await w("/api/invite/bind", { method: "POST", body: JSON.stringify({ inviterPiUsername: P || g }) }), await D(), c && (c.textContent = n("inviteBindSuccess")), S(n("inviteBindSuccess"), "success"), window.setTimeout(at, 500);
    } catch (C) {
      const T = N(C) || n("inviteBindFailed");
      c && (c.textContent = T), S(T, "error");
    } finally {
      re(d, false);
    }
  }), document.querySelector("#claim-invite-reward")?.addEventListener("click", async () => {
    if (r <= 0) return;
    const f = document.querySelector("#claim-invite-reward");
    if (!f?.disabled) {
      f && (f.disabled = true, f.classList.add("is-loading")), l && (l.textContent = n("processing"));
      try {
        await w("/api/invite/claim", { method: "POST" }), await D(), l && (l.textContent = n("inviteClaimSuccess")), S(n("inviteClaimSuccess"), "success"), at();
      } catch (m) {
        const g = N(m);
        l && (l.textContent = g), S(g, "error");
      } finally {
        f && (f.disabled = false, f.classList.remove("is-loading"));
      }
    }
  });
}
function Gr(e) {
  const t = N(e);
  return /Duplicate entry|uk_payment_txid|uk_payment_pi_payment_id|payment_orders/i.test(t) ? n("paymentOrderConflict") : t || n("createOrderFailed");
}
async function Jr(e) {
  const t = e, r = t.identifier || t.paymentId;
  if (!r) {
    console.warn("\u53D1\u73B0\u672A\u5B8C\u6210 Pi \u652F\u4ED8\uFF0C\u4F46\u7F3A\u5C11 paymentId", e);
    return;
  }
  try {
    await w("/api/payments/sync-incomplete", { method: "POST", body: JSON.stringify({ paymentId: r, txid: t.transaction?.txid, orderNo: t.metadata?.orderNo }) }), await D();
  } catch (o) {
    console.warn("\u540C\u6B65\u672A\u5B8C\u6210 Pi \u652F\u4ED8\u5931\u8D25", o);
  }
}
async function Yr(e, t) {
  if (!Number.isFinite(e) || e <= 0) throw new Error(n("invalidRechargeAmount"));
  if (!window.Pi) throw new Error(n("piPaymentInBrowser"));
  const r = await w("/api/payments/recharge-order", { method: "POST", body: JSON.stringify({ amount: e }) });
  t && (t.textContent = n("orderCreated", { orderNo: r.orderNo })), window.Pi.createPayment({ amount: r.amount, memo: r.memo, metadata: { orderNo: r.orderNo, type: "wallet_recharge" } }, { onReadyForServerApproval: async (o) => {
    t && (t.textContent = n("approvingPayment")), await w("/api/payments/approve", { method: "POST", body: JSON.stringify({ orderNo: r.orderNo, paymentId: o }) });
  }, onReadyForServerCompletion: async (o, s) => {
    t && (t.textContent = n("completingPayment")), await w("/api/payments/complete", { method: "POST", body: JSON.stringify({ orderNo: r.orderNo, paymentId: o, txid: s }) }), await D(), t && (t.textContent = n("rechargeSuccess")), window.setTimeout(_, 900);
  }, onCancel: () => {
    t && (t.textContent = n("paymentCanceled")), w("/api/payments/cancel", { method: "POST", body: JSON.stringify({ orderNo: r.orderNo }) }).catch((o) => console.warn("\u53D6\u6D88\u8BA2\u5355\u540C\u6B65\u5931\u8D25", o));
  }, onError: (o) => {
    console.error("Pi \u652F\u4ED8\u5931\u8D25", o), t && (t.textContent = n("piPaymentFailed", { message: N(o) }));
  } });
}
function nt(e = n("matchingDefault")) {
  const t = Qt(), r = Ce(), o = a.matchCanCancel || t >= r, s = Math.max(0, r - t), l = a.matchCancelling ? n("canceling") : o ? n("cancelMatch") : n("cancelAfter", { seconds: s }), c = o ? n("canCancelHint") : n("cancelAfter", { seconds: s });
  R.innerHTML = `
    <main class="shell">
      <section class="hero matching-card">
        <div class="brand-mark" aria-hidden="true">${BRAND_MARK_HTML}</div>
        <p class="eyebrow">${i(n("lightningMatching"))}</p>
        <h1>${i(n("matching"))}</h1>
        <div class="spinner" aria-hidden="true"></div>
        <div class="match-radar" aria-hidden="true"><span></span><span></span><span></span></div>
        <p class="summary match-status-text" id="match-status-text">${i(e)}</p>
        <p class="summary match-help-text" id="match-help-text">${i(c)}</p>
        <div class="actions">
          <button type="button" class="secondary" id="cancel-match" ${o && !a.matchCancelling ? "" : "disabled"}>${i(l)}</button>
        </div>
        <p id="match-cancel-status" class="summary danger-text">${i(a.matchCancelMessage)}</p>
      </section>
    </main>
  `, document.querySelector("#cancel-match")?.addEventListener("click", Qi);
}
function J(e = n("matchingDefault")) {
  if (!document.querySelector("#cancel-match")) {
    nt(e);
    return;
  }
  const t = Qt(), r = Ce(), o = a.matchCanCancel || t >= r, s = Math.max(0, r - t), l = a.matchCancelling ? n("canceling") : o ? n("cancelMatch") : n("cancelAfter", { seconds: s }), c = o ? n("canCancelHint") : n("cancelAfter", { seconds: s }), d = document.querySelector("#match-status-text"), u = document.querySelector("#match-help-text"), h = document.querySelector("#match-cancel-status"), p = document.querySelector("#cancel-match");
  d && (d.textContent = e), u && (u.textContent = c), h && (h.textContent = a.matchCancelMessage), p && (p.textContent = l, p.disabled = !o || a.matchCancelling);
}
function Za() {
  if (a.screen !== "matching" || !a.matchStartedAt) return;
  const e = ct();
  if (e === a.matchWaitingSeconds) return;
  const t = a.matchCanCancel, r = Ce();
  a.matchWaitingSeconds = Math.max(a.matchWaitingSeconds, e), a.matchCanCancel = a.matchCanCancel || a.matchWaitingSeconds >= r, (a.matchCanCancel !== t || e < r + 2) && J(n("waitedSeconds", { seconds: a.matchWaitingSeconds }));
}
function en(e, t) {
  const r = { row: Number(e), col: Number(t) };
  return Number.isInteger(r.row) && Number.isInteger(r.col) && r.row >= 0 && r.row < $e && r.col >= 0 && r.col < Pe ? r : null;
}
function _e(e, t) {
  return Math.abs(e.row - t.row) + Math.abs(e.col - t.col) === 1;
}
function Xr(e, t, r) {
  const o = Math.abs(t), s = Math.abs(r);
  if (Math.max(o, s) < Bn || o > s && s > $a || s > o && o > $a) return null;
  const l = o >= s ? { row: e.row, col: e.col + (t > 0 ? 1 : -1) } : { row: e.row + (r > 0 ? 1 : -1), col: e.col };
  return l.row < 0 || l.row >= $e || l.col < 0 || l.col >= Pe ? null : l;
}
function Qr(e, t, r) {
  const o = Math.abs(t), s = Math.abs(r);
  if (Math.max(o, s) < Nn) return null;
  const l = o >= s ? { row: e.row, col: e.col + (t > 0 ? 1 : -1) } : { row: e.row + (r > 0 ? 1 : -1), col: e.col };
  return l.row < 0 || l.row >= $e || l.col < 0 || l.col >= Pe ? null : l;
}
function Zr() {
  const e = a.realtimeRoom, t = a.user;
  if (!e || !t) return null;
  const r = e.players.find((s) => s.uid === t.uid), o = e.players.find((s) => s.uid !== t.uid);
  return !r || !o || !r.board?.length ? null : { self: r, opponent: o };
}
function ei(e, t, r) {
  if (e.finishReason === "pressure") {
    const o = t.pressure >= r.pressure ? n("self") : n("opponent");
    return n("pressureFinish", { player: o });
  }
  return e.finishReason === "timeout" ? n("timeoutFinish") : e.finishReason === "ready_timeout" ? n("readyTimeoutFinish") : n("settledFinish");
}
function getBoardGeometry(e) {
  if (!e) return null;
  const t = e.getBoundingClientRect();
  if (t.width <= 0 || t.height <= 0) return null;
  const r = window.getComputedStyle(e), o = Number.parseFloat(r.paddingLeft) || 0, s = Number.parseFloat(r.paddingRight) || o, l = Number.parseFloat(r.paddingTop) || o, c = Number.parseFloat(r.paddingBottom) || l, d = Number.parseFloat(r.gap) || 0, u = Math.max(1, t.width - o - s), h = Math.max(1, t.height - l - c), p = Math.max(1, (u - d * (Pe - 1)) / Pe), f = Math.max(1, (h - d * ($e - 1)) / $e);
  return { rect: t, paddingLeft: o, paddingTop: l, gap: d, innerWidth: u, innerHeight: h, tileWidth: p, tileHeight: f, startX: t.left + o, startY: t.top + l };
}
function canvasCellRect(e, t, r) {
  const o = e.paddingLeft + r * (e.tileWidth + e.gap), s = e.paddingTop + t * (e.tileHeight + e.gap);
  return { x: o, y: s, w: Math.max(2, e.tileWidth - 1), h: Math.max(2, e.tileHeight - 1), cx: o + e.tileWidth / 2, cy: s + e.tileHeight / 2 };
}
function canvasRoundRect(e, t, r, o, s, l) {
  e.beginPath(), e.roundRect ? e.roundRect(t, r, o, s, l) : (e.moveTo(t + l, r), e.lineTo(t + o - l, r), e.quadraticCurveTo(t + o, r, t + o, r + l), e.lineTo(t + o, r + s - l), e.quadraticCurveTo(t + o, r + s, t + o - l, r + s), e.lineTo(t + l, r + s), e.quadraticCurveTo(t, r + s, t, r + s - l), e.lineTo(t, r + l), e.quadraticCurveTo(t, r, t + l, r));
}
function canvasHexToRgba(e, t = 1) {
  const r = String(e || "").trim();
  if (!/^#[0-9a-f]{6}$/i.test(r)) return `rgba(255, 226, 120, ${t})`;
  const o = Number.parseInt(r.slice(1, 3), 16), s = Number.parseInt(r.slice(3, 5), 16), l = Number.parseInt(r.slice(5, 7), 16);
  return `rgba(${o}, ${s}, ${l}, ${t})`;
}
function canvasShadeColor(e, t = 0) {
  const r = String(e || "").trim();
  if (!/^#[0-9a-f]{6}$/i.test(r)) return e || "#8a35ff";
  const o = Math.max(-1, Math.min(1, Number(t) || 0));
  const s = (l) => {
    const c = Number.parseInt(r.slice(l, l + 2), 16), d = o >= 0 ? 255 : 0;
    return Math.max(0, Math.min(255, Math.round(c + (d - c) * Math.abs(o)))).toString(16).padStart(2, "0");
  };
  return `#${s(1)}${s(3)}${s(5)}`;
}
function drawCanvasTileBody(e, t, r, o, s, l, c) {
  const d = t.color || "#8a35ff", u = Math.min(o.w, o.h), h = canvasShadeColor(d, 0.34), p = canvasShadeColor(d, -0.36);
  canvasRoundRect(e, o.x, o.y + Math.max(2, u * 0.055), o.w, o.h, s), e.fillStyle = "rgba(0, 0, 0, .34)", e.fill();
  canvasRoundRect(e, o.x + 0.5, o.y + 0.5, o.w - 1, o.h - 1, s);
  const f = e.createLinearGradient(o.x, o.y, o.x + o.w, o.y + o.h);
  f.addColorStop(0, h), f.addColorStop(0.18, d), f.addColorStop(0.68, d), f.addColorStop(1, p);
  e.shadowColor = r >= wa || c.glow > 0 ? canvasHexToRgba(d, l ? 0.72 : 0.48) : "rgba(255, 228, 123, .18)", e.shadowBlur = l ? 16 : 9, e.fillStyle = f, e.fill(), e.shadowBlur = 0;
  const m = e.createLinearGradient(o.x, o.y, o.x, o.y + o.h);
  m.addColorStop(0, "rgba(255,255,255,.52)"), m.addColorStop(0.2, "rgba(255,255,255,.16)"), m.addColorStop(0.56, "rgba(0,0,0,.04)"), m.addColorStop(1, "rgba(0,0,0,.36)"), e.fillStyle = m, e.fill();
  canvasRoundRect(e, o.x + u * 0.08, o.y + u * 0.07, o.w * 0.72, o.h * 0.32, Math.max(4, s * 0.58)), e.fillStyle = "rgba(255,255,255,.18)", e.fill();
  e.beginPath(), e.moveTo(o.x + o.w * 0.16, o.y + o.h * 0.16), e.lineTo(o.x + o.w * 0.44, o.y + o.h * 0.08), e.strokeStyle = "rgba(255, 255, 255, .46)", e.lineWidth = Math.max(1.2, u * 0.04), e.stroke();
  e.strokeStyle = r >= wa ? "rgba(255, 245, 174, .68)" : "rgba(255, 249, 218, .28)", e.lineWidth = r >= wa ? 1.9 : 1.1, canvasRoundRect(e, o.x + 0.5, o.y + 0.5, o.w - 1, o.h - 1, s), e.stroke();
}
function canvasHasActiveFx(e = Date.now()) {
  return !!(a.tileEffect && e - a.tileEffect.at < 780 || a.localSwapFx && e - a.localSwapFx.at < animationMs("localSwapSeconds", 80) || x && e - x.at < 260 || k && e - k.at < 430 || (a.canvasTileBursts || []).some((t) => e - t.at < t.durationMs) || (a.canvasSpecialFx || []).some((t) => e - t.at < t.durationMs));
}
function renderCurrentCanvasBoard() {
  const e = oe(), t = Zr()?.self;
  e && t && renderCanvasBoard(e, t);
}
function scheduleCanvasFxFrame() {
  if (canvasFxFrame || !canvasHasActiveFx()) return;
  canvasFxFrame = window.requestAnimationFrame(() => {
    canvasFxFrame = null, renderCurrentCanvasBoard(), canvasHasActiveFx() && scheduleCanvasFxFrame();
  });
}
function canvasEffectForCell(e, t, r, o) {
  const s = { scale: 1, dx: 0, dy: 0, glow: 0, tone: "normal" };
  if (a.tileEffect && o - a.tileEffect.at < 760 && a.tileEffect.positions?.some((l) => l.row === e && l.col === t)) {
    const l = Math.min(1, (o - a.tileEffect.at) / 760);
    s.tone = a.tileEffect.type, s.glow = 1 - l, a.tileEffect.type === "success" ? s.scale += Math.sin(l * Math.PI) * 0.075 : s.dx += Math.sin(l * Math.PI * 6) * 4 * (1 - l);
  }
  return s;
}
function drawCanvasSpecial(e, t, r, o) {
  const s = Math.min(o.w, o.h), l = o.cx, c = o.cy;
  e.save(), e.lineCap = "round", e.lineJoin = "round";
  if (t >= ka) {
    const d = s * 0.2;
    e.shadowColor = "rgba(255, 210, 82, .72)", e.shadowBlur = s * 0.2, e.fillStyle = "rgba(255, 246, 184, .95)", e.beginPath(), e.arc(l, c + s * 0.02, d, 0, Math.PI * 2), e.fill(), e.shadowBlur = 0, e.strokeStyle = "rgba(118, 69, 15, .42)", e.lineWidth = Math.max(1.5, s * 0.045), e.stroke(), e.strokeStyle = "rgba(255, 242, 158, .95)", e.lineWidth = Math.max(2, s * 0.055), e.beginPath(), e.moveTo(l + d * 0.5, c - d * 0.72), e.quadraticCurveTo(l + d * 1.2, c - d * 1.22, l + d * 1.48, c - d * 1.9), e.stroke(), e.strokeStyle = "rgba(255, 115, 84, .62)", e.lineWidth = Math.max(1, s * 0.026), e.beginPath(), e.arc(l, c + s * 0.02, d * 1.52, -0.5, Math.PI * 1.5), e.stroke(), e.fillStyle = "rgba(255, 255, 255, .95)", e.beginPath(), e.arc(l - d * 0.42, c - d * 0.32, Math.max(1.5, d * 0.22), 0, Math.PI * 2), e.fill();
  } else if (t >= wa) {
    const d = t >= ya;
    const u = d ? e.createLinearGradient(l, o.y + s * 0.12, l, o.y + o.h - s * 0.12) : e.createLinearGradient(o.x + s * 0.12, c, o.x + o.w - s * 0.12, c);
    u.addColorStop(0, "rgba(255, 251, 187, .08)"), u.addColorStop(0.45, "rgba(255, 245, 151, .72)"), u.addColorStop(0.5, "rgba(255, 255, 255, .96)"), u.addColorStop(0.55, "rgba(111, 225, 255, .58)"), u.addColorStop(1, "rgba(255, 251, 187, .08)"), e.shadowColor = "rgba(255, 232, 109, .78)", e.shadowBlur = s * 0.18, e.strokeStyle = u, e.lineWidth = Math.max(4, s * 0.16), e.beginPath(), d ? (e.moveTo(l, o.y + s * 0.1), e.lineTo(l, o.y + o.h - s * 0.1)) : (e.moveTo(o.x + s * 0.1, c), e.lineTo(o.x + o.w - s * 0.1, c)), e.stroke(), e.shadowBlur = 0, e.fillStyle = "rgba(255, 250, 184, .96)", e.strokeStyle = "rgba(85, 45, 8, .28)", e.lineWidth = Math.max(1, s * 0.035), e.beginPath();
    d ? (e.moveTo(l + s * 0.05, c - s * 0.34), e.lineTo(l - s * 0.16, c + s * 0.03), e.lineTo(l + s * 0.02, c + s * 0.03), e.lineTo(l - s * 0.07, c + s * 0.36), e.lineTo(l + s * 0.22, c - s * 0.08), e.lineTo(l + s * 0.04, c - s * 0.08)) : (e.moveTo(l - s * 0.36, c - s * 0.02), e.lineTo(l - s * 0.04, c - s * 0.18), e.lineTo(l - s * 0.04, c), e.lineTo(l + s * 0.36, c - s * 0.08), e.lineTo(l + s * 0.02, c + s * 0.18), e.lineTo(l + s * 0.02, c)), e.closePath(), e.fill(), e.stroke();
  } else if (r.label) {
    e.fillStyle = r.textColor || "#fff6bd", e.font = `700 ${Math.max(11, Math.floor(s * 0.28))}px system-ui, sans-serif`, e.textAlign = "center", e.textBaseline = "middle", e.fillText(r.label, l, c);
  }
  e.restore();
}
function drawCanvasSpecialFx(e, t) {
  const r = Date.now();
  a.canvasSpecialFx = (a.canvasSpecialFx || []).filter((o) => r - o.at < o.durationMs);
  for (const o of a.canvasSpecialFx) {
    const s = Math.min(1, Math.max(0, (r - o.at) / o.durationMs)), l = 1 - s, c = canvasCellRect(t, o.position.row, o.position.col), d = Math.min(c.w, c.h), u = Math.max(0, Math.min(6, Number(o.power || 0))), h = 1 + u * 0.08;
    e.save(), e.globalCompositeOperation = "lighter", e.globalAlpha = Math.max(0, l);
    if (o.kind === "horizontal" || o.kind === "vertical") {
      const p = o.kind === "vertical", f = p ? t.paddingTop : c.cy, m = p ? c.cx : t.paddingLeft, g = p ? t.innerHeight : c.w, P = p ? c.h : t.innerWidth, C = p ? c.cx : t.paddingLeft + t.innerWidth, T = p ? t.paddingTop + t.innerHeight : c.cy, U = p ? e.createLinearGradient(c.cx, f, c.cx, T) : e.createLinearGradient(m, c.cy, C, c.cy);
      U.addColorStop(0, "rgba(255, 230, 102, 0)"), U.addColorStop(0.18, "rgba(255, 249, 181, .62)"), U.addColorStop(0.48, "rgba(255, 255, 255, 1)"), U.addColorStop(0.52, "rgba(255, 255, 255, .96)"), U.addColorStop(0.82, "rgba(82, 221, 255, .58)"), U.addColorStop(1, "rgba(132, 223, 255, 0)");
      e.shadowColor = "rgba(255, 232, 109, .9)", e.shadowBlur = d * 0.28 * h, e.strokeStyle = U, e.lineWidth = Math.max(7, d * (0.24 + u * 0.012 - s * 0.07)), e.beginPath(), e.moveTo(m, f), e.lineTo(C, T), e.stroke(), e.shadowBlur = 0, e.strokeStyle = "rgba(255, 255, 255, .86)", e.lineWidth = Math.max(1.8, d * (0.05 + u * 0.004)), e.beginPath(), e.moveTo(m, f), e.lineTo(C, T), e.stroke();
      for (let Te = -1; Te <= 1; Te += 2) e.strokeStyle = `rgba(126, 236, 255, ${0.34 * l})`, e.lineWidth = Math.max(1, d * 0.026), e.beginPath(), p ? (e.moveTo(c.cx + Te * d * 0.16, f), e.lineTo(c.cx + Te * d * 0.16, T)) : (e.moveTo(m, c.cy + Te * d * 0.16), e.lineTo(C, c.cy + Te * d * 0.16)), e.stroke();
      const Te = p ? g : P, qe = Math.max(5, Math.min(14, Math.round((o.cleared || 3) / 1.5 + u)));
      for (let gt = 0; gt < qe; gt += 1) {
        const ha = (gt + 0.5) / qe, fa = (ha * Te + s * d * 1.2) % Te, va = p ? c.cx + Math.sin(gt * 1.7) * d * 0.1 : t.paddingLeft + fa, ba = p ? t.paddingTop + fa : c.cy + Math.cos(gt * 1.5) * d * 0.1;
        e.fillStyle = "rgba(255, 246, 176, .86)", e.beginPath(), e.arc(va, ba, d * (0.04 + l * 0.035 + u * 0.004), 0, Math.PI * 2), e.fill();
      }
    } else {
      const p = d * (0.4 + s * (1.55 + u * 0.12)), f = e.createRadialGradient(c.cx, c.cy, d * 0.12, c.cx, c.cy, p);
      f.addColorStop(0, "rgba(255, 255, 255, 1)"), f.addColorStop(0.16, "rgba(255, 239, 124, .9)"), f.addColorStop(0.38, "rgba(255, 132, 77, .56)"), f.addColorStop(0.62, "rgba(255, 75, 108, .32)"), f.addColorStop(1, "rgba(255, 94, 94, 0)"), e.fillStyle = f, e.beginPath(), e.arc(c.cx, c.cy, p, 0, Math.PI * 2), e.fill(), e.strokeStyle = "rgba(255, 246, 185, .9)", e.lineWidth = Math.max(2.4, d * (0.068 + u * 0.006) * l), e.beginPath(), e.arc(c.cx, c.cy, d * (0.48 + s * (1.18 + u * 0.09)), 0, Math.PI * 2), e.stroke();
      const m = Math.min(20, 14 + Math.round(u));
      for (let g = 0; g < m; g += 1) {
        const P = g / m * Math.PI * 2 + (o.seed || 0), C = d * (0.3 + s * (1.42 + u * 0.1)), T = c.cx + Math.cos(P) * C, U = c.cy + Math.sin(P) * C;
        e.strokeStyle = g % 2 ? "rgba(255, 232, 122, .76)" : "rgba(255, 119, 96, .66)", e.lineWidth = Math.max(1.1, d * 0.03 * l), e.beginPath(), e.moveTo(c.cx + Math.cos(P) * d * 0.18, c.cy + Math.sin(P) * d * 0.18), e.lineTo(T, U), e.stroke();
      }
    }
    e.restore();
  }
}
function drawCanvasTileBursts(e, t) {
  const r = Date.now();
  a.canvasTileBursts = (a.canvasTileBursts || []).filter((o) => r - o.at < o.durationMs);
  for (const o of a.canvasTileBursts) for (const s of o.positions || []) {
    const l = Math.min(1, Math.max(0, (r - o.at) / o.durationMs)), c = 1 - l, d = canvasCellRect(t, s.row, s.col), u = Math.min(d.w, d.h), h = Math.max(0, Math.min(6, Number(o.power || 0))), p = o.strong ? 10 + Math.round(h * 1.5) : 6 + Math.round(h), f = o.tone === "attack", m = o.tone === "mega";
    e.save(), e.globalAlpha = Math.max(0, c), e.globalCompositeOperation = "lighter", e.strokeStyle = f ? "rgba(255, 109, 126, .96)" : m ? "rgba(126, 236, 255, .96)" : "rgba(255, 235, 144, .96)", e.lineWidth = Math.max(1.4, u * (0.045 + h * 0.005)), e.beginPath(), e.arc(d.cx, d.cy, u * (0.16 + l * (0.58 + h * 0.045)), 0, Math.PI * 2), e.stroke(), e.fillStyle = f ? "rgba(255, 92, 112, .22)" : m ? "rgba(126, 236, 255, .2)" : "rgba(255, 229, 108, .18)", e.beginPath(), e.arc(d.cx, d.cy, u * (0.08 + l * (0.26 + h * 0.025)), 0, Math.PI * 2), e.fill();
    for (let g = 0; g < p; g += 1) {
      const P = Math.PI * 2 * g / p + (o.seed || 0), C = u * (0.14 + l * (o.strong ? 0.62 + h * 0.045 : 0.48 + h * 0.03)), T = d.cx + Math.cos(P) * C, U = d.cy + Math.sin(P) * C, Te = u * (0.08 + l * (0.12 + h * 0.012));
      e.beginPath(), e.moveTo(T, U), e.lineTo(T + Math.cos(P) * Te, U + Math.sin(P) * Te), e.stroke();
    }
    e.restore();
  }
}
function renderCanvasBoard(e, t) {
  const r = e?.querySelector?.("#battle-board-canvas"), o = t?.board || [], s = getBoardGeometry(e);
  if (!r || !o.length || !s) return false;
  const l = Math.max(1, Math.min(2, window.devicePixelRatio || 1)), c = Math.max(1, Math.floor(s.rect.width * l)), d = Math.max(1, Math.floor(s.rect.height * l));
  (r.width !== c || r.height !== d) && (r.width = c, r.height = d);
  r.style.width = `${s.rect.width}px`, r.style.height = `${s.rect.height}px`;
  const u = r.getContext("2d");
  if (!u) return false;
  u.setTransform(l, 0, 0, l, 0, 0), u.clearRect(0, 0, s.rect.width, s.rect.height);
  const h = Math.max(8, Math.min(s.tileWidth, s.tileHeight) * 0.2), p = Date.now(), f = a.effectiveVisualEffectMode === "high" && !document.documentElement.classList.contains("low-performance");
  const m = u.createLinearGradient(0, 0, 0, s.rect.height);
  m.addColorStop(0, "rgba(255, 231, 133, .08)"), m.addColorStop(0.45, "rgba(122, 76, 210, .08)"), m.addColorStop(1, "rgba(12, 2, 28, .18)"), u.fillStyle = m, u.fillRect(0, 0, s.rect.width, s.rect.height);
  for (let g = 0; g < $e; g += 1) for (let P = 0; P < Pe; P += 1) {
    const C = canvasCellRect(s, g, P);
    u.save(), canvasRoundRect(u, C.x + 1, C.y + 1, C.w - 2, C.h - 2, h * 0.9), u.fillStyle = "rgba(255, 255, 255, .035)", u.fill(), u.restore();
  }
  for (let g = 0; g < $e; g += 1) {
    for (let P = 0; P < Pe; P += 1) {
      const C = o[g]?.[P], T = na(C), U = canvasCellRect(s, g, P), Te = Math.min(U.w, U.h), qe = canvasEffectForCell(g, P, C, p), gt = a.selectedTile?.row === g && a.selectedTile?.col === P, ha = a.selectedTile && !gt && _e(a.selectedTile, { row: g, col: P });
      u.save(), u.translate(U.cx + qe.dx, U.cy + qe.dy), u.scale(qe.scale, qe.scale), u.translate(-U.cx, -U.cy), drawCanvasTileBody(u, T, C, U, h, f, qe);
      if (ha) u.strokeStyle = "rgba(255, 239, 159, .28)", u.lineWidth = 2, u.stroke();
      if (gt) {
        const H = 0.72 + Math.sin(p / 110) * 0.2;
        u.strokeStyle = `rgba(255, 244, 174, ${H})`, u.lineWidth = 3, u.stroke(), u.strokeStyle = "rgba(255, 255, 255, .48)", u.lineWidth = 1.2, canvasRoundRect(u, U.x + 4, U.y + 4, U.w - 8, U.h - 8, Math.max(4, h - 4)), u.stroke();
      }
      if (qe.glow > 0) u.strokeStyle = qe.tone === "fail" ? `rgba(255, 92, 111, ${0.75 * qe.glow})` : `rgba(255, 236, 138, ${0.85 * qe.glow})`, u.lineWidth = 2.4, canvasRoundRect(u, U.x - 1, U.y - 1, U.w + 2, U.h + 2, h + 1), u.stroke();
      drawCanvasSpecial(u, C, T, U), u.restore();
    }
  }
  drawCanvasSpecialFx(u, s), drawCanvasTileBursts(u, s), canvasHasActiveFx(p) && scheduleCanvasFxFrame();
  return true;
}
function Je(e) {
  return e.map((t) => [...t]);
}
function oi(e, t, r = false) {
  renderCanvasBoard(e, t), se = Je(t.board || []);
}
function si(e, t) {
  const r = ft(e).filter((d) => !d.at || Date.now() - d.at <= Xt), o = (d, u = false) => {
    const h = d.attack > 0 ? `${n("attack")}+${d.attack}` : `${n("cleared")}${d.cleared}`, p = `+${d.scoreGain}`, f = `${n("chain")}${d.chain}`;
    return `<span class="battle-log-chip ${u ? "highlight" : ""}"><i>${i(h)}</i><em>${i(p)}</em><small>${i(f)}</small></span>`;
  }, s = (d, u, h) => {
    const p = d.slice(0, 1), f = p.length ? p.map((m) => o(m, h === "self" && (m.attack > 0 || m.chain > 1))).join("") : `<span class="battle-log-chip empty-log">${i(n("emptyLog"))}</span>`;
    return `<div class="battle-log-column ${h}"><b>${i(u)}</b><div>${f}</div></div>`;
  }, l = r.filter((d) => d.uid === t.uid), c = r.filter((d) => d.uid !== t.uid);
  return `<div class="battle-log-grid">${s(l, n("self"), "self")}${s(c, n("opponent"), "opponent")}</div>`;
}
function ne(e) {
  return Number(e.seq || 0) > 0 ? [e.uid, e.type, e.seq].join(":") : [e.uid, e.type, e.at, e.scoreGain, e.attack, e.cleared, e.chain, e.specialTriggered || 0, e.specialCreated || 0].join(":");
}
function ft(e) {
  const t = /* @__PURE__ */ new Set();
  return e.filter((r) => {
    const o = ne(r);
    return t.has(o) ? false : (t.add(o), true);
  });
}
function xa(e, t = a.user?.uid || "") {
  return !e || !t ? null : e.players.find((r) => r.uid === t) || null;
}
function li(e, t, r) {
  if (!a.pendingSwapSeq) return false;
  if (t.status === "finished") return true;
  const o = xa(e, r), s = xa(t, r);
  if (!s) return false;
  const l = t.events.find((c) => c.uid === r);
  return l?.seq && Number(l.seq) >= a.pendingSwapSeq || l?.at && l.at >= a.lastSwapSentAt - 250 ? true : o ? s.score !== o.score || s.lastGain !== o.lastGain || s.combo !== o.combo || s.pressure !== o.pressure || jt(s) !== jt(o) : false;
}
function zt() {
  a.pendingSwapSeq = 0, a.pendingSwapPositions = [];
}
function clearPendingSwapSeq(e) {
  const t = Number(e || 0);
  a.pendingSwapQueue = (a.pendingSwapQueue || []).filter((r) => Number(r.seq || 0) !== t);
  a.pendingSwapSeq === t && (a.pendingSwapSeq = a.pendingSwapQueue[0]?.seq || 0, a.pendingSwapPositions = a.pendingSwapQueue[0]?.positions || []);
}
function syncAuthoritativeRoom(e, t = "state") {
  if (!e) return;
  const r = a.realtimeRoom, o = xa(r, a.user?.uid || ""), s = xa(e, a.user?.uid || "");
  const l = o && s && jt(o) !== jt(s);
  a.realtimeRoom = e, a.clientRoomVersion = Number(e.version || a.clientRoomVersion || 0), a.clientPredictedBoard = s?.board ? clientCloneBoard(s.board) : null, a.lastRoomStateAt = Date.now(), a.screen = "battle";
  l && t !== "state" && (a.clientPredictionStats.corrected += 1, v("client_snapshot_corrected", { roomNo: e.roomNo, mode: e.mode, result: t, version: a.clientRoomVersion }, 5e3));
  xi(e);
}
function mergeRoomDelta(e) {
  const t = e?.delta || e;
  if (!t || !a.realtimeRoom || t.roomNo !== a.realtimeRoom.roomNo) return;
  const r = { ...a.realtimeRoom, version: Number(t.version || a.realtimeRoom.version || 1), status: t.status || a.realtimeRoom.status, remainSeconds: Number(t.remainSeconds ?? a.realtimeRoom.remainSeconds), serverNow: t.serverNow || Date.now(), winnerUid: t.winnerUid || a.realtimeRoom.winnerUid || "", finishReason: t.finishReason || a.realtimeRoom.finishReason || "", events: Array.isArray(t.events) && t.events.length ? t.events : a.realtimeRoom.events };
  if (Array.isArray(t.players)) r.players = (a.realtimeRoom.players || []).map((o) => {
    const s = t.players.find((l) => l.uid === o.uid);
    return s ? { ...o, score: Number(s.score ?? o.score), pressure: Number(s.pressure ?? o.pressure), combo: Number(s.combo ?? o.combo), lastGain: Number(s.lastGain ?? o.lastGain), validMoveCount: Number(s.validMoveCount ?? o.validMoveCount) } : o;
  });
  a.realtimeRoom = r, a.clientRoomVersion = Number(r.version || a.clientRoomVersion || 0), a.lastRoomStateAt = Date.now(), a.networkStatus = "online", $();
}
function handleSwapAck(e) {
  clearPendingSwapSeq(e.seq), a.clientPredictionStats.ack += 1, e.version && (a.clientRoomVersion = Number(e.version));
  e.room && syncAuthoritativeRoom(e.room, "ack");
  v("client_prediction_ack", { roomNo: a.roomNo, mode: a.realtimeRoom?.mode || a.selectedMode, seq: e.seq || 0, latencyMs: e.serverAt && e.clientAt ? Math.max(0, Number(e.serverAt) - Number(e.clientAt)) : a.networkLatencyMs }, 2e3);
  $();
}
function handleSwapReject(e) {
  clearPendingSwapSeq(e.seq), a.clientPredictionStats.reject += 1, a.clientPredictionStats.rollback += 1;
  e.room && syncAuthoritativeRoom(e.room, "reject");
  v("client_prediction_reject", { roomNo: a.roomNo, mode: a.realtimeRoom?.mode || a.selectedMode, seq: e.seq || 0, message: e.reason || "", result: e.reasonCode || "" }, 2e3);
  $();
}
function handleRoomSnapshot(e) {
  if (!e.room) return;
  a.pendingSwapQueue = (a.pendingSwapQueue || []).filter((t) => Date.now() - Number(t.sentAt || 0) < 3500);
  a.pendingSwapSeq = a.pendingSwapQueue[0]?.seq || 0, a.pendingSwapPositions = a.pendingSwapQueue[0]?.positions || [];
  syncAuthoritativeRoom(e.room, "snapshot"), $();
}
function ci(e) {
  return ft(e).some((t) => !t.at || Date.now() - t.at <= Xt);
}
function di(e) {
  const t = ft(e).reduce((r, o) => Math.max(r, Number(o.at || 0)), 0);
  return t ? Math.max(0, t + Xt - Date.now() + 40) : 0;
}
function an(e, t) {
  const r = document.querySelector("#battle-event-log");
  if (!r) return;
  const o = ci(e.events);
  r.innerHTML = si(e.events, t), r.classList.toggle("empty", !o), ee && (window.clearTimeout(ee), ee = null);
  const s = di(e.events);
  o && s > 0 && (ee = window.setTimeout(() => {
    ee = null, an(e, t);
  }, s));
}
function ui(e, t) {
  const r = e.events.find((c) => c.uid === t.uid);
  if (!r) return null;
  const o = ne(r);
  if (o === a.feedbackEventId) return null;
  let s = "score", l = battleBurstText(r);
  return r.specialTriggered || r.attack > 0 ? s = "attack" : battleIsMegaFeedback(r) ? s = "mega" : r.specialCreated || r.chain > 1 ? s = "combo" : r.cleared >= 4 && (s = "clear"), { id: o, feedback: { text: l, tone: s, at: Date.now(), scoreGain: r.scoreGain, attack: r.attack, chain: r.chain } };
}
function mi() {
  const e = a.battleBursts.map(pi).join(""), t = a.battleImpacts.map(fi).join("");
  return `${e}${t}`;
}
function pi(e) {
  const t = Array.from({ length: e.particles }, (r, o) => {
    const s = Math.PI * 2 * o / Math.max(1, e.particles), l = 36 + o % 3 * 14 + Math.min(18, e.cleared * 2), c = Math.round(Math.cos(s) * l), d = Math.round(Math.sin(s) * l);
    return `<i style="--dx:${c}px;--dy:${d}px;--delay:${o * 18}ms"></i>`;
  }).join("");
  const r = Number(e.durationSeconds || 0), o = r > 0 ? `;--battle-burst-duration:${r}s;--battle-burst-score-duration:${Math.max(0.12, r - 0.14)}s;--battle-burst-ring-duration:${Math.min(r, 0.72)}s` : "";
  return `<div
    class="battle-burst ${e.tone} cleared-${Math.min(6, Math.max(3, e.cleared))}"
    style="left:${e.x}%;top:${e.y}%${o}"
  >
    ${e.text ? `<span>${i(e.text)}</span>` : ""}
    ${t ? `<div>${t}</div>` : ""}
  </div>`;
}
function fi(e) {
  return e.type === "attack-line" ? `<div class="battle-attack-line ${e.from}" aria-hidden="true">
      <i></i>
    </div>` : `<div class="battle-hit-warning ${e.from}" aria-hidden="true">
    <i></i>
  </div>`;
}
function hi(e, t) {
  const r = e.events[0];
  if (!r) return;
  const o = ne(r);
  if (!lt(`${o}:impact-root`) || o === Ct) return;
  Ct = o;
  const s = r.uid === t.uid, l = st(), c = l.selfCard, d = l.opponentCard, u = r.attack > 0 ? s ? d : c : s ? c : d, h = r.attack > 0 ? "impact-attacked" : r.chain > 1 ? "impact-combo" : "impact-score";
  if (flashOneOf(u, ["impact-score", "impact-combo", "impact-attacked"], h, a.effectiveVisualEffectMode === "high" ? animationMs("impactHighSeconds") : animationMs("impactSeconds")), r.attack > 0) {
    const p = s ? l.opponentPressureMeter : l.selfPressureMeter;
    flashClass(p, "pressure-hit", animationMs("pressureHitSeconds"));
  }
  s ? (clientShouldSkipServerBurst(r) || nn(r), Si(r)) : r.attack > 0 && showAttackWarning(r);
}
function clientShouldSkipServerBurst(e) {
  const t = Number(e.seq || 0);
  if (t <= 0 || (e.uid || "") !== (a.user?.uid || "")) return false;
  return t === clientPreviewBurstSeq && Date.now() - clientPreviewBurstAt < 3e3 || t === a.pendingSwapSeq || t === a.lastSwapSeq && Date.now() - a.lastSwapSentAt < 4e3;
}
function attackWarningText(e) {
  const t = Math.max(0, Number(e?.attack || 0));
  return (ve().attackWarningText || DEFAULT_ATTACK_WARNING_TEXT).replaceAll("{attack}", String(t));
}
function showAttackWarning(e) {
  if (ve().attackWarningEnabled === false || Number(e?.attack || 0) <= 0) return;
  const t = `${ne(e)}:attack-warning`;
  if (!lt(t) || a.battleBursts.some((h) => h.id === t)) return;
  const r = attackWarningText(e).trim();
  if (!r) return;
  const o = a.effectiveVisualEffectMode === "low" || document.documentElement.classList.contains("low-performance"), s = Math.max(0.92, animationSeconds("hitWarningSeconds")), l = { id: t, text: r, tone: "attack", at: Date.now(), x: 50, y: 34, cleared: Number(e.cleared || 3), chain: Number(e.chain || 1), attack: Number(e.attack || 0), particles: o ? 0 : a.effectiveVisualEffectMode === "high" ? 4 : 2, durationSeconds: s };
  a.battleBursts = [l], K = "", window.setTimeout(() => {
    a.battleBursts = a.battleBursts.filter((h) => h.id !== t), K = "", $();
  }, Math.max(120, Math.round(s * 1e3)));
}
function gi(e, t) {
  const r = ui(e, t);
  if (!r || !lt(`${r.id}:haptic`)) return;
  a.localBattleEvents = a.localBattleEvents.filter((s) => s.uid !== t.uid), a.feedbackEventId = r.id, a.feedback = null, K = "";
  const o = e.events.find((s) => s.uid === t.uid);
  de(o ? vi(o) : 12);
}
function bi(e) {
  if (a.effectiveVisualEffectMode === "low" || document.documentElement.classList.contains("low-performance")) return 0;
  const t = battleFeedbackPower(e), r = a.effectiveVisualEffectMode === "high", o = e.localPending ? r ? 8 : 5 : r ? 6 : 3, s = Math.round(o + t * (r ? 1.35 : 0.85));
  return Math.min(r ? 16 : 9, Math.max(e.localPending ? r ? 8 : 5 : r ? 6 : 3, s));
}
function wi(e) {
  return e.localPending && e.previewTone ? e.previewTone : e.localPending ? "local" : e.specialTriggered ? "attack" : battleIsMegaFeedback(e) ? "mega" : e.specialCreated ? "combo" : e.attack > 0 ? "attack" : e.chain > 1 ? "combo" : e.cleared >= 4 ? "clear" : "score";
}
function yi(e, t) {
  const r = e.uid || "unknown", o = e.previewSemantic || (e.specialTriggered ? "special_triggered" : e.specialCreated ? e.cleared >= 5 ? "special_bomb" : "special_lightning" : e.attack > 0 ? "attack" : e.chain > 1 ? "combo" : e.cleared >= 4 ? "big_clear" : "score");
  return `${r}:${t}:${o}:${Number(e.scoreGain || 0)}:${Number(e.attack || 0)}:${Number(e.cleared || 0)}:${Number(e.chain || 1)}`;
}
function ki(e) {
  return e.specialTriggered ? "board-clear-attack" : battleIsMegaFeedback(e) ? "board-clear-mega" : e.specialCreated && e.cleared >= 5 ? "board-clear-chain" : e.specialCreated ? "board-clear-combo" : e.attack > 0 ? "board-clear-attack" : e.chain >= 3 ? "board-clear-chain" : e.chain > 1 ? "board-clear-combo" : e.cleared >= 5 ? "board-clear-big" : e.cleared >= 4 ? "board-clear-good" : "board-clear-normal";
}
function vi(e) {
  return e.specialTriggered ? [46, 24, 62, 28, 42] : battleIsMegaFeedback(e) ? [26, 18, 38, 20, 46] : e.specialCreated ? [24, 18, 34] : e.attack > 0 ? [36, 24, 48, 24, 32] : e.chain >= 3 ? [24, 18, 34, 18, 42] : e.chain > 1 ? [18, 16, 30] : e.cleared >= 5 ? [20, 16, 28] : e.cleared >= 4 ? 20 : 12;
}
function Si(e) {
  const t = `${ne(e)}:board`;
  if (!lt(t) || t === Tt) return;
  Tt = t;
  const r = oe();
  if (!r) return;
  const o = ki(e);
  r.classList.remove("board-clear-normal", "board-clear-good", "board-clear-big", "board-clear-combo", "board-clear-chain", "board-clear-mega", "board-clear-attack"), r.offsetWidth, r.classList.add(o), window.setTimeout(() => {
    r.classList.remove(o);
  }, a.effectiveVisualEffectMode === "high" ? animationMs("boardEffectHighSeconds", 120) : animationMs("boardEffectSeconds", 120)), Ci(e);
}
function $i(e = false) {
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return false;
  return e ? a.effectiveVisualEffectMode !== "low" : !(a.effectiveVisualEffectMode === "low" || document.documentElement.classList.contains("low-performance"));
}
function Pi(e) {
  const t = [], r = (s) => {
    s && (s.row < 0 || s.row >= $e || s.col < 0 || s.col >= Pe || t.some((l) => l.row === s.row && l.col === s.col) || t.push(s));
  };
  const o = battleFeedbackPower(e), s = battleIsMegaFeedback(e);
  if (a.lastSwapPositions.forEach(r), a.effectiveVisualEffectMode === "high" || s) a.lastSwapPositions.forEach((l) => {
    r({ row: l.row - 1, col: l.col }), r({ row: l.row + 1, col: l.col }), r({ row: l.row, col: l.col - 1 }), r({ row: l.row, col: l.col + 1 });
  });
  if (s && a.lastSwapPositions[0]) {
    const l = a.lastSwapPositions[0];
    r({ row: l.row - 1, col: l.col - 1 }), r({ row: l.row - 1, col: l.col + 1 }), r({ row: l.row + 1, col: l.col - 1 }), r({ row: l.row + 1, col: l.col + 1 });
  } else if (Number(e.cleared || 0) >= 4 || Number(e.chain || 1) > 1 || e.specialTriggered || e.specialCreated) {
    const l = a.lastSwapPositions[0];
    l && (r({ row: l.row, col: l.col + 1 }), r({ row: l.row + 1, col: l.col }));
  }
  const l = a.effectiveVisualEffectMode === "high" ? 8 : 5;
  return t.slice(0, Math.min(l, Math.max(2, Math.min(8, Number(e.cleared || 3) + o))));
}
function triggerCanvasSpecialFx(e) {
  if (!$i(true)) return;
  const t = (Array.isArray(e.specialFx) ? e.specialFx : []).filter((r) => r?.position && r.kind);
  if (!t.length) return;
  const r = document.documentElement.classList.contains("low-performance"), o = battleFeedbackPower(e), s = r ? Math.min(2, o) : o, l = a.effectiveVisualEffectMode === "high" && !r ? animationMsAtLeast("boardEffectHighSeconds", 760 + o * 25, 180) : r ? 420 : animationMsAtLeast("boardEffectSeconds", 580 + o * 18, 170), c = Date.now(), d = r ? 1 : a.effectiveVisualEffectMode === "high" ? 3 : 2;
  a.canvasSpecialFx = [...(a.canvasSpecialFx || []), ...t.slice(0, d).map((u) => ({ kind: u.kind, position: u.position, at: c, durationMs: l, cleared: Number(e.cleared || 3), power: s, seed: Math.random() * Math.PI * 2 }))].slice(r ? -2 : -4), renderCurrentCanvasBoard(), scheduleCanvasFxFrame(), window.setTimeout(() => {
    a.canvasSpecialFx = (a.canvasSpecialFx || []).filter((u) => Date.now() - u.at < u.durationMs), renderCurrentCanvasBoard();
  }, l + 40);
}
function Ci(e) {
  if (!$i(true)) return;
  triggerCanvasSpecialFx(e);
  const t = Pi(e);
  if (!t.length) return;
  const r = document.documentElement.classList.contains("low-performance"), o = battleFeedbackPower(e), s = battleIsMegaFeedback(e), l = (a.effectiveVisualEffectMode === "high" || s) && !r && (Number(e.cleared || 0) >= 4 || Number(e.chain || 1) > 1 || e.specialTriggered || e.specialCreated), c = r ? 360 : l ? animationMsAtLeast("tileBurstHighSeconds", 760 + o * 22, 80) : animationMsAtLeast("tileBurstSeconds", 560, 80), d = r ? Math.min(2, o) : o;
  a.canvasTileBursts = [...(a.canvasTileBursts || []), { positions: r ? t.slice(0, 3) : t, at: Date.now(), durationMs: c, strong: l, power: d, tone: e.attack > 0 || e.specialTriggered ? "attack" : s ? "mega" : "score", seed: Math.random() * Math.PI }].slice(r ? -2 : -4), renderCurrentCanvasBoard(), scheduleCanvasFxFrame(), window.setTimeout(() => {
    a.canvasTileBursts = (a.canvasTileBursts || []).filter((c) => Date.now() - c.at < c.durationMs), renderCurrentCanvasBoard();
  }, c + 30);
}
function Ti() {
  const e = oe();
  flashClass(e, "board-server-settle", animationMs("serverSettleSeconds"));
}
function Ri() {
  if (!a.lastSwapPositions.length) return;
  ae("fail", a.lastSwapPositions);
  const e = oe();
  flashClass(e, "board-invalid-swap", animationMs("invalidSwapSeconds")), de([10, 18, 10]);
}
function Mi(e) {
  if (!e.length) return;
  a.lastSwapPositions = e, ae("fail", e);
  const t = oe();
  flashClass(t, "board-invalid-swap", animationMs("invalidSwapSeconds")), de([10, 18, 10]);
}
function nn(e) {
  const t = `${ne(e)}:burst`;
  if (!lt(t) || a.battleBursts.some((g) => g.id === t)) return;
  const r = a.effectiveVisualEffectMode === "high", o = a.effectiveVisualEffectMode === "low" || document.documentElement.classList.contains("low-performance"), s = wi(e), l = e.previewText || (e.localPending ? "" : e.specialTriggered ? `\u7206\u53D1 +${e.scoreGain}` : e.specialCreated ? e.cleared >= 5 ? `\u70B8\u5F39 +${e.scoreGain}` : `\u95EA\u7535 +${e.scoreGain}` : e.attack > 0 ? `\u7535\u51FB +${e.attack}` : e.chain > 1 ? `\u8FDE\u51FB x${e.chain}` : e.cleared >= 4 ? `${e.cleared}\u6D88!` : `+${e.scoreGain}`), c = `${s}:${l}`, d = yi(e, s), u = Date.now() - Bt, h = c === Rt && u < va, p = d === Mt && u < va, f = u < vn && (h || p);
  if (l && (f || h || p)) {
    v("client_burst_suppressed", { roomNo: a.roomNo, mode: a.realtimeRoom?.mode || a.selectedMode, message: l, seq: e.seq || 0, result: ne(e), costMs: u, reason: p ? "same_semantic" : h ? "same_text" : "too_soon" }, 0);
    return;
  }
  l && (Rt = c, Mt = d, Bt = Date.now(), (e.specialTriggered || e.specialCreated || e.attack > 0) && v("client_burst_show", { roomNo: a.roomNo, mode: a.realtimeRoom?.mode || a.selectedMode, message: l, seq: e.seq || 0, result: ne(e), specialTriggered: e.specialTriggered || 0, specialCreated: e.specialCreated || 0, attack: e.attack || 0 }, 0));
  const m = { id: t, text: l, tone: s, at: Date.now(), x: e.attack > 0 ? 63 : r ? 48 + Math.random() * 12 : 50, y: e.localPending ? 48 : e.attack > 0 ? 38 : r ? 46 + Math.random() * 10 : 50, cleared: Number(e.cleared || 3), chain: Number(e.chain || 1), attack: Number(e.attack || 0), particles: bi(e) };
  a.battleBursts = l ? [m] : [...a.battleBursts, m].slice(-2), K = "", window.setTimeout(() => {
    a.battleBursts = a.battleBursts.filter((g) => g.id !== t), K = "", $();
  }, e.localPending ? r ? animationMsAtLeast("localBurstHighSeconds", 1120) : animationMsAtLeast("localBurstSeconds", 920) : o ? animationMs("lowPerformanceBurstSeconds") : r ? animationMs("serverBurstHighSeconds") : animationMs("serverBurstSeconds"));
}
function Bi(e, t) {
  const r = Date.now();
  const o = oe();
  a.localSwapFx = { from: e, to: t, at: r }, flashClass(o, "board-local-swap", animationMs("localSwapSeconds")), ae("success", [e, t]), renderCurrentCanvasBoard(), scheduleCanvasFxFrame(), window.setTimeout(() => {
    a.localSwapFx?.at === r && (a.localSwapFx = null, $());
  }, animationMs("localSwapSeconds", 20));
}
function Ni(e) {
  if (a.battleImpacts.some((r) => r.id === e.id)) return;
  a.battleImpacts = [...a.battleImpacts, e].slice(-4), K = "";
  const t = oe();
  e.type === "self-hit" && t && (t.classList.remove("board-under-attack"), t.offsetWidth, t.classList.add("board-under-attack"), window.setTimeout(() => t.classList.remove("board-under-attack"), animationMs("boardUnderAttackSeconds", 40))), window.setTimeout(() => {
    a.battleImpacts = a.battleImpacts.filter((r) => r.id !== e.id), K = "", $();
  }, a.effectiveVisualEffectMode === "high" ? animationMs("impactHighSeconds") : animationMs("impactSeconds"));
}
function rn(e) {
  if (e.status !== "playing") return 0;
  if (e.readyEndsAt && e.serverNow) {
    const r = e.readyEndsAt - e.serverNow;
    if (r > -1e3) return Date.now() + Math.max(0, r);
  }
  if (e.readyEndsAt && e.readyEndsAt > Date.now() - 1e3) return e.readyEndsAt;
  const t = Math.max(0, e.readySeconds || 0);
  return t > 0 ? Date.now() + t * 1e3 : 0;
}
function Ei(e) {
  const t = Number(e.timing?.vsIntroSeconds);
  return Number.isFinite(t) && t >= 0 ? t * 1e3 : Rn;
}
function Li(e) {
  const t = Number(e.timing?.readyCountdownSeconds);
  return Number.isFinite(t) && t >= 0 ? t : Mn;
}
function on(e) {
  if (e.status !== "waiting_ready" || !e.waitingReadyEndsAt) return 0;
  if (e.serverNow) {
    const t = e.waitingReadyEndsAt - e.serverNow;
    return Math.max(0, Math.ceil(t / 1e3));
  }
  return Math.max(0, Math.ceil((e.waitingReadyEndsAt - Date.now()) / 1e3));
}
function ht(e) {
  if (Xe === e.roomNo) return 0;
  const t = Li(e);
  if (t <= 0) return 0;
  if (Ee === e.roomNo && te) return Math.min(t, Math.max(0, Math.ceil((te - Date.now()) / 1e3)));
  const r = rn(e);
  return r ? Math.min(t, Math.max(0, Math.ceil((r - Date.now()) / 1e3))) : 0;
}
function Aa(e) {
  const t = e || a.realtimeRoom;
  if (!t || t.status === "finished") {
    we();
    return;
  }
  const r = ht(t), o = document.querySelector("#ready-countdown-number");
  o && o.textContent !== String(r) && (o.textContent = String(r)), r <= 0 && (t.roomNo && (Xe = t.roomNo), we(), $());
}
function xi(e) {
  if (e.status !== "playing") {
    we();
    return;
  }
  if (Xe === e.roomNo) return;
  const t = rn(e);
  if (!t) {
    we();
    return;
  }
  (Ee !== e.roomNo || !te || Math.abs(te - t) > 900) && (Xe = "", Ee = e.roomNo, te = t, pe = -1);
  const o = Math.max(0, Math.ceil((te - Date.now()) / 1e3));
  o !== pe && (pe = o, Aa(e)), Be || (Be = window.setInterval(() => {
    if (!a.realtimeRoom || a.realtimeRoom.roomNo !== Ee) {
      we();
      return;
    }
    const s = Math.max(0, Math.ceil((te - Date.now()) / 1e3));
    s !== pe && (pe = s, Aa(a.realtimeRoom));
  }, 200));
}
function Ai(e, t, r, o) {
  const s = e.status === "finished", l = e.status === "waiting_ready", c = ht(e), d = !s && za(), u = !s && !d && c > 0, h = s ? ei(e, r, o) : "";
  if (l) {
    const p = !!r.readyAt, f = !!o.readyAt, m = on(e), g = la(e.mode) ? "readyTimeoutHint" : "readyAutoStartHint";
    return `<section class="ready-confirm-mask">
      <div class="ready-confirm-card">
        <p class="eyebrow">${i(n("waitingBothReady"))}</p>
        <h2>${i(n("readyConfirmTitle"))}</h2>
        <p>${i(n("readyConfirmSubtitle"))}</p>
        <div class="ready-duel-status">
          <span class="${p ? "ready" : ""}"><i>${p ? "\u2713" : "\u2022"}</i>${i(n(p ? "readySelf" : "readySelfPending"))}</span>
          <span class="${f ? "ready" : ""}"><i>${f ? "\u2713" : "\u2022"}</i>${i(n(f ? "readyOpponent" : "readyOpponentPending"))}</span>
        </div>
        ${p ? `<strong class="ready-waiting-text">${i(n("readyWaitingOpponent"))}</strong>` : `<button type="button" id="battle-ready-confirm">${i(n("readyButton"))}</button>`}
        ${m > 0 ? `<small class="ready-timeout-hint">${i(n(g, { seconds: m }))}</small>` : ""}
      </div>
    </section>`;
  }
  if (d) return `<section class="vs-intro-mask">
      <p class="eyebrow">${i(n("matchedVsTitle"))}</p>
      <div class="vs-intro-card">
        <div>${Ze(r, "self", t)}<strong>${i(r.nickname)}</strong></div>
        <b>VS</b>
        <div>${Ze(o, "opponent")}<strong>${i(Ft(o))}</strong></div>
      </div>
      <p>${i(n("matchedVsSubtitle"))}</p>
    </section>`;
  if (u) return `<section class="ready-mask">
      <p class="eyebrow">${i(n("readyStart"))}</p>
      <h2 id="ready-countdown-number">${c}</h2>
      <p>${i(n("startAfterCountdown"))}</p>
    </section>`;
  if (s) {
    const p = Fi(e, t, o), f = e.winnerUid ? e.winnerUid === t.uid ? n("win") : n("lose") : n("draw"), m = e.winnerUid === t.uid, g = Math.abs(r.score - o.score), P = X(e.mode), C = ie(e.mode), T = C > 0 && !!e.winnerUid && m, U = T ? "" : modeAssetType(e.mode) === "PI" ? n("settlementNoReward") : a.language === "zh-CN" ? "本局无奖励" : "No reward", Te = formatModeAmount(e.mode, C), qe = P > 0 ? (a.language === "zh-CN" ? `入场费 ${formatModeAmount(e.mode, P)}` : `Entry ${formatModeAmount(e.mode, P)}`) : n("freeMatch"), gt = m ? n("winUpsell") : g > 0 && g <= 250 ? n("closeLossHint", { gap: g }) : n("loseRetryHint"), fa = e.mode === "quick_battle" && m && !o.isBot;
    return `<section class="finish-mask">
      <div class="finish-card">
        <p class="eyebrow">${i(n("battleSettlement"))}</p>
        <h2>${i(f)}</h2>
        <p class="finish-reason">${i(h)}</p>
        <p class="settlement-mood ${m ? "win" : "steady"}">${i(gt)}</p>
        <div class="result-score-grid">
          <span>${i(n("yourScore"))}<strong>${r.score}</strong></span>
          <span>${i(n("opponentScore"))}<strong>${o.score}</strong></span>
        </div>
        <div class="settlement-insight-grid">
          <span class="settlement-reward-cell ${T ? "has-reward" : ""}">
            <small>${i(n("settlementRewardTitle"))}</small>
            <strong>${T ? `<b id="settlement-reward-amount" data-reward-amount="${C}">${i(Te)}</b>` : i(U)}</strong>
          </span>
          <span><small>${i(n("settlementRankTitle"))}</small><strong>${i(qe)}</strong></span>
          <span><small>${i(n("settlementScoreGapTitle"))}</small><strong>${i(n("settlementScoreGap", { gap: g }))}</strong></span>
          <span><small>${i(n("settlementSafeTitle"))}</small><strong>${i(n("settlementSafeLabel"))}</strong></span>
        </div>
        ${p}
      </div>
      <div class="finish-actions">
        ${fa ? `<button type="button" class="gold-action" id="battle-paid-next">${i(n("tryPaidMode"))}</button>` : ""}
        <button type="button" id="battle-restart">${i(n("playAgain"))}</button>
        <button type="button" class="secondary" id="battle-back-home">${i(n("backLobby"))}</button>
      </div>
    </section>`;
  }
  return "";
}
function Fi(e, t, r) {
  const o = F(), s = Va(e.mode) && !r.isBot;
  if (!e.winnerUid) return `<div class="rank-change-note neutral">${i(n("drawNoStar"))}</div>`;
  if (!s) return e.mode === "quick_battle" && r.isBot ? `<div class="rank-change-note neutral">${i(n("botPracticeNotRanked", { rank: B(o.quickBattleMaxRankKey || "silver") }))}</div>` : `<div class="rank-change-note neutral">${i(n("notRankedBattle"))}</div>`;
  const l = e.winnerUid === t.uid, c = l ? cr(e.mode) ? n("modeAtCap", { mode: I(e.mode) }) : n("rankUpEstimate", { stars: o.winStars }) : Ae(t.rankName) === "bronze" && o.bronzeProtection ? n("bronzeNoLose") : n("rankDownEstimate", { stars: o.loseStars });
  return `<div class="rank-change-note ${l ? "up" : "down"}">${c}</div>`;
}
function _i(e) {
  const t = a.tileEffect ? `${a.tileEffect.type}:${a.tileEffect.at}` : "", r = x ? `${x.position.row}:${x.position.col}:${x.direction}:${x.at}` : "", o = k ? `${k.from.row}:${k.from.col}:${k.to.row}:${k.to.col}:${k.direction}:${k.at}` : "", s = a.localSwapFx ? `${a.localSwapFx.from.row}:${a.localSwapFx.from.col}:${a.localSwapFx.to.row}:${a.localSwapFx.to.col}:${a.localSwapFx.at}` : "", l = (a.canvasSpecialFx || []).map((c) => `${c.kind}:${c.position?.row}:${c.position?.col}:${c.at}`).join(",");
  return `${(e.board || []).map((c) => c.join("")).join("|")}:${a.selectedTile?.row ?? "-"}:${a.selectedTile?.col ?? "-"}:${t}:${r}:${o}:${s}:${l}`;
}
function jt(e) {
  return (e.board || []).map((t) => t.join("")).join("|");
}
function Fa(e, t, r, o, s) {
  y?.handled || (y = { position: e, x: t, y: r, pointerId: o === "pointer" ? s : null, touchId: o === "touch" ? s : null, at: Date.now(), handled: false, source: o });
}
function _a(e) {
  return y ? y.pointerId === null ? (y.pointerId = e, true) : y.pointerId === e : false;
}
function qi(e) {
  return y ? y.touchId === null ? (y.touchId = e, true) : y.touchId === e : false;
}
function Oe(e, t) {
  if (!y) return false;
  if (y.handled) return true;
  const r = e - y.x, o = t - y.y, s = Ye(e, t), l = s && !ra(s, y.position) && _e(y.position, s) ? s : null, c = l || Qr(y.position, r, o);
  c && Gn(y.position, c);
  const d = l || Xr(y.position, r, o);
  return d ? (y.handled = true, Gi(y.position, d), y = null, true) : !!c;
}
function Ue() {
  y = null, ut();
}
function Vt(e, t) {
  for (let r = 0; r < e.length; r += 1) {
    const o = e.item(r);
    if (o?.identifier === t) return o;
  }
  return null;
}
function Ii(e, t) {
  return Vt(e.changedTouches, t) || Vt(e.touches, t);
}
function Di(e) {
  return y && y.touchId !== null ? Ii(e, y.touchId) : e.changedTouches.item(0) || e.touches.item(0);
}
function Ye(e, t) {
  const r = oe();
  if (!r) return He(e, t);
  const o = getBoardGeometry(r);
  if (!o) return He(e, t);
  const s = o.tileWidth * Pa, l = o.tileHeight * Pa, c = o.startX, d = o.startY, u = o.innerWidth, h = o.innerHeight;
  if (e < c - s || e > c + u + s || t < d - l || t > d + h + l) return He(e, t);
  const p = o.tileWidth + o.gap, f = o.tileHeight + o.gap, m = Math.min(Pe - 1, Math.max(0, Math.floor((e - c) / p))), g = Math.min($e - 1, Math.max(0, Math.floor((t - d) / f)));
  return { row: g, col: m };
}
function He(e, t) {
  const o = document.elementFromPoint(e, t)?.closest(".tile");
  return o ? en(o.dataset.row, o.dataset.col) : null;
}
function Wi(e, t) {
  try {
    e.setPointerCapture?.(t);
  } catch {
  }
}
function Oi(e, t) {
  try {
    (!e.hasPointerCapture || e.hasPointerCapture(t)) && e.releasePointerCapture?.(t);
  } catch {
  }
}
function Ui() {
  const e = oe();
  if (!e) return;
  cleanupBoardInputs();
  const t = { passive: false, capture: true };
  const r = [];
  const o = (m, g, P, C = t) => {
    if (!m) return;
    try {
      m.addEventListener(g, P, C), r.push([m, g, P, C]);
    } catch {
      m.addEventListener(g, P, true), r.push([m, g, P, true]);
    }
  };
  typeof AbortController == "function" && (Ne = new AbortController());
  cleanupBoardInputListeners = () => {
    r.forEach(([m, g, P, C]) => m?.removeEventListener(g, P, C));
    r.length = 0;
  };
  o(e, "dragstart", (c) => {
    c.preventDefault();
  }, t), o(e, "click", (c) => {
    if (Date.now() - Yt < 260) return;
    const u = c.target?.closest(".tile"), h = Ye(c.clientX, c.clientY) || (u ? en(u.dataset.row, u.dataset.col) : null);
    h && Ji(h);
  }, t);
  const s = (c) => {
    !y || !_a(c.pointerId) || Oe(c.clientX, c.clientY) && c.preventDefault();
  }, l = (c) => {
    !y || !_a(c.pointerId) || (Oe(c.clientX, c.clientY), Ue(), Oi(e, c.pointerId));
  }, d = (c) => {
    if (!y) return;
    const u = Di(c);
    !u || !qi(u.identifier) || Oe(u.clientX, u.clientY) && c.preventDefault();
  }, u = (c) => {
    if (!y) return;
    const h = y.touchId !== null ? Vt(c.changedTouches, y.touchId) : c.changedTouches.item(0);
    h && Oe(h.clientX, h.clientY), Ue();
  };
  o(e, "pointerdown", (c) => {
    if (!c.isPrimary) return;
    if (c.pointerType === "touch" && ("ontouchstart" in window || navigator.maxTouchPoints > 0)) return;
    const h = Ye(c.clientX, c.clientY);
    h && (c.preventDefault(), Fa(h, c.clientX, c.clientY, "pointer", c.pointerId), Wi(e, c.pointerId));
  }, t), o(e, "touchstart", (c) => {
    if (Date.now() < Et) {
      c.preventDefault();
      return;
    }
    const h = c.changedTouches.item(0);
    if (!h) return;
    const p = Ye(h.clientX, h.clientY);
    p && (c.preventDefault(), Fa(p, h.clientX, h.clientY, "touch", h.identifier));
  }, t), o(document, "pointermove", s, t), o(document, "pointerup", l, t), o(document, "pointercancel", () => Ue(), t), o(document, "touchmove", d, t), o(document, "touchend", u, t), o(document, "touchcancel", () => Ue(), t), o(document.querySelector("#battle-overlay"), "click", async (c) => {
    const h = c.target;
    if (h?.closest("#battle-ready-confirm")) {
      if (!M || M.readyState !== WebSocket.OPEN) {
        a.battleMessage = n("socketNotReady"), $();
        return;
      }
      M.send(JSON.stringify({ type: "player_ready" })), a.battleMessage = n("readyWaitingOpponent"), $();
      return;
    }
    if (h?.closest("#battle-back-home")) {
      Q(), O(), ce(), a.screen = "home", a.roomNo = "", a.roomJoinToken = "", a.room = null, a.realtimeRoom = null, a.result = null, a.selectedTile = null, a.battleConnectingAt = 0, a.battleEnteredAt = 0, a.feedback = null, a.feedbackEventId = "", a.battleMessage = "", await D(), _();
      return;
    }
    if (h?.closest("#battle-restart")) {
      await zi();
      return;
    }
    h?.closest("#battle-paid-next") && (Q(), O(), ce(), a.screen = "home", a.roomNo = "", a.roomJoinToken = "", a.room = null, a.realtimeRoom = null, a.result = null, a.selectedTile = null, a.battleConnectingAt = 0, a.battleEnteredAt = 0, a.feedback = null, a.feedbackEventId = "", a.battleMessage = "", await D(), _(), ma("points_battle"));
  });
}
function Hi() {
  const e = a.user, t = a.realtimeRoom;
  if (!e || !t) {
    ua(a.battleMessage || n("enteringRoom"));
    return;
  }
  const r = Zr();
  if (!r) {
    Fe(n("missingBattlePlayers"));
    return;
  }
  const { self: o, opponent: s } = r, l = t.status === "finished", c = t.status === "waiting_ready", d = La(o.pressure), u = La(s.pressure), h = a.battleEnteredAt || a.battleConnectingAt;
  if (l && h > 0 && Date.now() - h < 2500) {
    sn(n("staleRoomMatched"));
    return;
  }
  const p = t.roomNo.replace(/^room_/, "").slice(-8).toUpperCase(), f = Pt !== t.roomNo;
  Ln(), (f || !document.querySelector("#game-board")) && (Pt = t.roomNo, Se = null, Re = "", je = "", se = Je(o.board || []), Ve = "", Ke = "", K = "", R.innerHTML = `
    <main class="battle-shell ${t.remainSeconds <= 10 && !l ? "battle-final-countdown" : ""}">
      <header class="battle-header">
        <span id="battle-room-label">${i(n("room"))} ${i(p)}</span>
        <strong id="battle-title">${i(n(l ? "battleEnded" : "tapToSwap"))}</strong>
        <span id="battle-mode-label">${i(I(t.mode))}</span>
      </header>

      <section class="score-strip">
        <article class="score-card self pressure-${d}" id="battle-self-card">
          <div class="score-identity">
            ${Ze(o, "self", e)}
            <span id="battle-self-name">${i(o.nickname)}</span>
          </div>
          <strong id="battle-self-score">${o.score}</strong>
          <div class="pressure-meter self ${d}" id="battle-self-pressure-meter" aria-label="${i(n("self"))}">
            <i id="battle-self-pressure" style="width: ${Wt(o.pressure)}%"></i>
          </div>
        </article>
        <div class="vs-pill ${t.remainSeconds <= 10 ? "urgent" : ""}" id="battle-timer-wrap">
          <small>VS</small>
          <strong id="battle-timer">${t.remainSeconds}s</strong>
          <i id="battle-timer-bar" style="height: ${Na(t)}%"></i>
        </div>
        <article class="score-card opponent pressure-${u}" id="battle-opponent-card">
          <div class="score-identity right">
            <span id="battle-opponent-name">${i(Ft(s))}</span>
            ${Ze(s, "opponent")}
          </div>
          <strong id="battle-opponent-score">${s.score}</strong>
          <div class="pressure-meter opponent ${u}" id="battle-opponent-pressure-meter" aria-label="${i(n("opponent"))}">
            <i id="battle-opponent-pressure" style="width: ${Wt(s.pressure)}%"></i>
          </div>
        </article>
      </section>

      <section class="board-panel">
        <div class="game-board${Ta()} canvas-board" id="game-board">
          <canvas id="battle-board-canvas" class="battle-board-canvas"></canvas>
        </div>
      </section>

      <div id="battle-feedback-layer"></div>
      <div id="battle-overlay"></div>
    </main>
  `, Ui(), Ua()), l || gi(t, e);
  const m = st(), g = (E, H) => {
    E && E.textContent !== H && (E.textContent = H);
  };
  g(m.roomLabel, `${n("room")} ${p}`), g(m.timer, `${t.remainSeconds}s`), g(m.modeLabel, I(t.mode)), g(m.selfName, o.nickname), g(m.opponentName, Ft(s)), g(m.title, n(l ? "battleEnded" : "tapToSwap"));
  const P = m.networkPill?.querySelector("b");
  g(P || null, Wn()), m.networkPill && (m.networkPill.className = `network-pill ${On()}`), m.timerWrap?.classList.toggle("urgent", t.remainSeconds <= 10 && !l), m.shell?.classList.toggle("battle-final-countdown", t.remainSeconds <= 10 && !l), m.timerBar && (m.timerBar.style.height = `${Na(t)}%`);
  const C = (E, H, ue) => {
    E && (E.className = `${H} ${ue}`);
  }, T = (E, H, ue) => {
    E && (E.className = `${H} pressure-${ue}`);
  };
  T(m.selfCard, "score-card self", d), T(m.opponentCard, "score-card opponent", u), C(m.selfPressureMeter, "pressure-meter self", d), C(m.opponentPressureMeter, "pressure-meter opponent", u), mr(dr(o, s), f);
  const U = _i(o), Te = jt(o);
  if (U !== Re) {
    const E = m.board, H = !!Re, ue = Te !== je;
    if (E) {
      E.className = `game-board${Ta()} canvas-board`, E.querySelector("#battle-board-canvas") || (E.innerHTML = '<canvas id="battle-board-canvas" class="battle-board-canvas"></canvas>'), oi(E, o, H && ue && !l);
      const ba = t.events.find((pn) => pn.uid === e.uid), mn = !!(ba?.at && Date.now() - ba.at < 1400);
      H && ue && !mn && !l && Date.now() - a.lastSwapSentAt < 1800 && Ti();
    }
    Re = U, je = Te;
  }
  const qe = ft(t.events).slice(0, 4).map(ne).join("|");
  qe !== Ke && (hi(t, e), an(t, e), Ke = qe);
  const gt = on(t), ha = `${c ? "waiting" : za() ? "vs" : !l && ht(t) > 0 ? "ready" : l ? "finished" : "none"}:${t.roomNo}:${t.winnerUid}:${o.score}:${s.score}:${o.pressure}:${s.pressure}:${t.finishReason || ""}:${gt}:${o.readyAt || 0}:${s.readyAt || 0}`;
  ha !== Ve && (m.overlay && (m.overlay.innerHTML = Ai(t, e, o, s)), Ve = ha), l && hr(t, e);
  const ga = [a.battleBursts.map((E) => E.id).join("|"), a.battleImpacts.map((E) => E.id).join("|")].join("::");
  ga !== K && (m.feedbackLayer && (m.feedbackLayer.innerHTML = mi()), K = ga);
}
async function zi() {
  const e = a.realtimeRoom?.mode || a.room?.mode || a.selectedMode || "quick_battle", t = a.realtimeRoom?.roomNo || a.roomNo;
  Q(), O(), ce(), a.screen = "matching", a.selectedMode = e, a.roomNo = "", a.roomJoinToken = "", a.room = null, a.realtimeRoom = null, a.result = null, a.selectedTile = null, a.battleConnectingAt = 0, a.battleEnteredAt = 0, a.feedback = null, a.feedbackEventId = "", a.battleMessage = "", a.matchCancelMessage = "", nt(n("restartingMode", { mode: I(e) }));
  try {
    await ji(t), await D(), await un(e);
  } catch (r) {
    a.matchCancelMessage = N(r), nt(a.matchCancelMessage);
  }
}
async function ji(e = "") {
  if (e) for (let t = 0; t < 6; t += 1) {
    const o = (await w("/api/battle/history?page=1&pageSize=5&mode=")).items.find((s) => s.roomNo === e);
    if (o && ["win", "lose", "draw", "expired", "review"].includes(o.result)) return;
    await new Promise((s) => window.setTimeout(s, 450));
  }
}
function Q() {
  ge(), M && (M.onopen = null, M.onmessage = null, M.onerror = null, M.onclose = null, M.close(), M = null);
}
function rt() {
  A && (A.onopen = null, A.onmessage = null, A.onerror = null, A.onclose = null, A.close(), A = null);
}
async function pa(e, t) {
  a.screen !== "matching" || t !== a.matchSessionId || a.matchCancelling || e.status !== "matched" || !e.roomNo || (v("client_match_enter_room", { roomNo: e.roomNo, mode: e.mode || a.selectedMode, status: e.status, queueLength: e.queueLength || 0, waitingSeconds: e.waitingSeconds || ct(), costMs: a.matchStartedAt ? Date.now() - a.matchStartedAt : 0 }, 0), rt(), a.matchPollTimer && (window.clearTimeout(a.matchPollTimer), a.matchPollTimer = null), a.roomNo = e.roomNo, a.roomJoinToken = e.roomJoinToken || "", await eo(), !(a.screen !== "matching" || t !== a.matchSessionId || a.matchCancelling) && (a.screen = "battle", ua(n("connectingRealtime")), ln()));
}
function Vi(e) {
  const t = a.user;
  if (!t || a.screen !== "matching") return;
  rt();
  const r = new URL(Ia, window.location.href);
  A = new WebSocket(r.toString()), A.onopen = () => {
    v("client_match_ws_open", { mode: a.selectedMode, costMs: a.matchStartedAt ? Date.now() - a.matchStartedAt : 0 }, 0), A?.send(JSON.stringify({ type: "watch_match", uid: t.uid, token: dt(), sessionId: String(e) }));
  }, A.onmessage = (o) => {
    const s = JSON.parse(o.data);
    if (s.type === "match_watch_ready") {
      v("client_match_ws_ready", { mode: a.selectedMode, costMs: a.matchStartedAt ? Date.now() - a.matchStartedAt : 0 }, 0);
      return;
    }
    s.type === "match_state" && s.status && Number(s.sessionId || 0) === e && pa(s.status, e).catch((l) => {
      a.matchCancelMessage = N(l), J(n("matchFailed"));
    });
  }, A.onerror = () => {
    v("client_match_ws_error", { mode: a.selectedMode, message: "match watcher error", costMs: a.matchStartedAt ? Date.now() - a.matchStartedAt : 0 }, 0), rt();
  }, A.onclose = () => {
    v("client_match_ws_closed", { mode: a.selectedMode, costMs: a.matchStartedAt ? Date.now() - a.matchStartedAt : 0 }, 3e3), A = null;
  };
}
function kt(e = n("reconnecting")) {
  if (ge(), !(a.screen !== "battle" || !a.roomNo || a.realtimeRoom?.status === "finished")) {
    if (he >= Pn) {
      a.battleMessage = n("realtimeRetryFailed"), v("client_realtime_retry_failed", { roomNo: a.roomNo, message: e, costMs: a.battleConnectingAt ? Date.now() - a.battleConnectingAt : 0 }, 0), $();
      return;
    }
    he += 1, a.battleMessage = e, v("client_realtime_retry", { roomNo: a.roomNo, message: e, result: String(he), costMs: a.battleConnectingAt ? Date.now() - a.battleConnectingAt : 0 }, 0), $(), Q(), window.setTimeout(() => {
      a.screen === "battle" && a.roomNo && a.realtimeRoom?.status !== "finished" && ln(false);
    }, 700 + he * 400);
  }
}
function Ki(e = "") {
  return e.includes("\u623F\u95F4\u4E0D\u5B58\u5728") || e.includes("\u5DF2\u8FC7\u671F") || e.includes("\u73A9\u5BB6\u4E0D\u5C5E\u4E8E\u8BE5\u623F\u95F4");
}
function sn(e = n("roomGoneAlert")) {
  Q(), O(), ce(), a.screen = "home", a.roomNo = "", a.roomJoinToken = "", a.room = null, a.realtimeRoom = null, a.selectedTile = null, a.tileEffect = null, a.networkStatus = "connecting", a.networkLatencyMs = 0, a.vsIntroUntil = 0, a.lastRoomStateAt = 0, a.lastSwapSentAt = 0, resetPredictionState(), a.lastSwapPositions = [], a.battleConnectingAt = 0, a.battleEnteredAt = 0, a.feedback = null, a.feedbackEventId = "", a.battleMessage = "", a.matchCancelMessage = "", _(), window.setTimeout(() => {
    S(e, "error");
  }, 80);
}
function ln(e = true) {
  const t = a.user;
  if (!t || !a.roomNo) return;
  Q(), e && (he = 0), a.battleConnectingAt = Date.now(), a.battleEnteredAt = 0, a.feedback = null, a.feedbackEventId = "", a.networkStatus = "connecting", a.networkLatencyMs = 0, a.lastRoomStateAt = 0, a.lastSwapSentAt = 0, resetPredictionState(), a.lastSwapPositions = [];
  const r = new URL(Ia, window.location.href);
  r.searchParams.set("roomNo", a.roomNo), r.searchParams.set("uid", t.uid), M = new WebSocket(r.toString()), v("client_realtime_connect_start", { roomNo: a.roomNo, mode: a.selectedMode, result: e ? "fresh" : "retry" }, 0), ze = window.setTimeout(() => {
    (!a.realtimeRoom || a.realtimeRoom.roomNo !== a.roomNo) && (v("client_realtime_connect_slow", { roomNo: a.roomNo, mode: a.selectedMode, costMs: Date.now() - a.battleConnectingAt }, 0), kt(n("realtimeConnectingSlow")));
  }, $n), M.onopen = () => {
    v("client_realtime_open", { roomNo: a.roomNo, mode: a.selectedMode, costMs: Date.now() - a.battleConnectingAt }, 0), M?.send(JSON.stringify({ type: "join_room", roomNo: a.roomNo, uid: t.uid, roomJoinToken: a.roomJoinToken, token: dt() }));
  }, M.onmessage = (o) => {
    const s = JSON.parse(o.data);
    if (s.type === "room_state" && s.room) {
      ge(), he = 0;
      const l = a.realtimeRoom, c = !l || l.roomNo !== s.room.roomNo, d = Date.now(), u = a.lastRoomStateAt, h = s.room.status === "playing" && (!l || l.roomNo !== s.room.roomNo || l.status !== "playing");
      if (li(l || null, s.room, t.uid) && zt(), a.realtimeRoom = s.room, a.clientRoomVersion = Number(s.room.version || a.clientRoomVersion || 0), a.clientPredictedBoard = xa(s.room, t.uid)?.board ? clientCloneBoard(xa(s.room, t.uid).board) : null, a.lastRoomStateAt = d, a.networkLatencyMs = u ? Math.max(0, d - u) : a.networkLatencyMs, a.networkStatus = a.networkLatencyMs > 1900 ? "slow" : "online", c ? v("client_realtime_first_state", { roomNo: s.room.roomNo, mode: s.room.mode, status: s.room.status, costMs: a.battleConnectingAt ? d - a.battleConnectingAt : 0 }, 0) : a.networkStatus === "slow" && v("client_realtime_slow", { roomNo: s.room.roomNo, mode: s.room.mode, status: s.room.status, latencyMs: a.networkLatencyMs }, 5e3), h) {
        const p = Ei(s.room);
        a.vsIntroUntil = p > 0 ? d + p : 0, window.setTimeout(() => {
          a.screen === "battle" && a.roomNo === s.room?.roomNo && $();
        }, p + 80);
      }
      xi(s.room), a.battleMessage = s.message || a.battleMessage, a.battleEnteredAt === 0 && s.room.status !== "finished" && (a.battleEnteredAt = Date.now()), a.screen = "battle", $();
      return;
    }
    if (s.type === "swap_ack") {
      handleSwapAck(s);
      return;
    }
    if (s.type === "swap_reject") {
      handleSwapReject(s);
      return;
    }
    if (s.type === "room_delta") {
      mergeRoomDelta(s.delta || s);
      return;
    }
    if (s.type === "room_snapshot") {
      handleRoomSnapshot(s);
      return;
    }
    if (s.type === "error") {
      const l = s.message || n("operationFailed");
      if (v("client_error", { roomNo: a.roomNo, mode: a.selectedMode, message: l, seq: s.seq || 0 }, 0), Ki(l)) {
        ge(), sn(l);
        return;
      }
      ge(), a.networkStatus = "slow", a.battleMessage = l, s.kind === "swap_rejected" && Number(s.seq || 0) > 0 && Number(s.seq) === a.pendingSwapSeq ? (v("client_swap_rejected", { roomNo: a.roomNo, mode: a.selectedMode, message: l, seq: s.seq, costMs: a.lastSwapSentAt ? Date.now() - a.lastSwapSentAt : 0 }, 0), Mi(a.pendingSwapPositions), zt()) : !s.seq && Date.now() - a.lastSwapSentAt < 1800 && (!a.lastSwapPositions.length && a.selectedTile ? ae("fail", [a.selectedTile]) : Ri()), $();
    }
  }, M.onerror = () => {
    a.networkStatus = "offline", v("client_realtime_error", { roomNo: a.roomNo, mode: a.selectedMode, costMs: a.battleConnectingAt ? Date.now() - a.battleConnectingAt : 0 }, 0), kt(n("realtimeError"));
  }, M.onclose = () => {
    ge(), a.screen === "battle" && a.roomNo && a.realtimeRoom?.status !== "finished" && (a.networkStatus = "reconnecting", v("client_realtime_closed", { roomNo: a.roomNo, mode: a.selectedMode, latencyMs: a.networkLatencyMs }, 3e3), kt(n("reconnecting")));
  };
}
function cn() {
  const e = extremeRealtimeConfig();
  return (a.pendingSwapQueue || []).length >= e.maxPendingSwaps ? false : a.realtimeRoom?.status === "waiting_ready" ? (a.battleMessage = n("waitBothReady"), $(), false) : a.realtimeRoom && ht(a.realtimeRoom) > 0 ? (a.battleMessage = n("waitReady"), $(), false) : !M || M.readyState !== WebSocket.OPEN ? (a.battleMessage = n("socketNotReady"), $(), false) : true;
}
function dn(e, t) {
  const r = Date.now(), o = `${e.row}:${e.col}:${t.row}:${t.col}`;
  if (o === Lt && r - xt < 120) return;
  const s = Number(a.clientRoomVersion || a.realtimeRoom?.version || 0), l = a.lastSwapSeq + 1;
  if (!kaPreviewSwap(e, t, l)) {
    Lt = o, xt = r, ut(), a.selectedTile = null, a.lastSwapPositions = [e, t], Mi([e, t]);
    return;
  }
  Lt = o, xt = r, ut(), a.selectedTile = null, a.lastSwapSentAt = r, a.lastSwapPositions = [e, t], a.lastSwapSeq = l, a.pendingSwapSeq = l, a.pendingSwapPositions = [e, t], a.battleMessage = "", v("client_swap_send", { roomNo: a.roomNo, mode: a.realtimeRoom?.mode || a.selectedMode, seq: a.lastSwapSeq, latencyMs: a.networkLatencyMs, protocol: "swap_cmd" }, 1800), Yn(e, t), Bi(e, t);
  a.pendingSwapQueue = [...(a.pendingSwapQueue || []), { seq: a.lastSwapSeq, positions: [e, t], sentAt: r, baseVersion: s }].slice(-extremeRealtimeConfig().maxPendingSwaps), a.clientPredictionStats.sent += 1, applyPredictedSwap(e, t, a.lastSwapSeq), M?.send(JSON.stringify({ type: "swap_cmd", roomNo: a.roomNo, seq: a.lastSwapSeq, baseVersion: s, from: e, to: t, clientAt: r }));
  de(12);
}
function Gi(e, t) {
  if (Yt = Date.now(), ut(), !!cn()) {
    if (!_e(e, t)) {
      a.battleMessage = n("onlyAdjacent"), ae("fail", [e, t]), de([12, 18, 12]), $();
      return;
    }
    dn(e, t), $();
  }
}
function Ji(e) {
  if (!cn()) return;
  if (!a.selectedTile) {
    a.selectedTile = e, ae("success", [e]), a.battleMessage = n("selectNeighbor"), $();
    return;
  }
  const t = a.selectedTile;
  if (a.selectedTile = null, ra(t, e)) {
    a.battleMessage = n("selectionCanceled"), ae("fail", [e]), de(8), $();
    return;
  }
  if (!_e(t, e)) {
    a.battleMessage = n("onlyAdjacent"), ae("fail", [t, e]), de([12, 18, 12]), $();
    return;
  }
  dn(t, e), $();
}
async function Yi() {
  const e = await An();
  if (!e || !Zt()) throw new Error(n("piSdkMissing"));
  const t = await w("/api/pi/config");
  a.piConfig = t;
  const r = xn() || t.frontendSandbox || hn;
  (!window.__BLITZ_PI_INITIALIZED__ || window.__BLITZ_PI_INITIALIZED_SANDBOX__ !== r) && (e.init({ version: "2.0", sandbox: r }), window.__BLITZ_PI_INITIALIZED__ = true, window.__BLITZ_PI_INITIALIZED_SANDBOX__ = r);
  const o = await e.authenticate(["username", "payments"], async (l) => {
    console.warn("\u53D1\u73B0\u672A\u5B8C\u6210 Pi \u652F\u4ED8", l), await Jr(l);
  }), s = await w("/api/auth/pi-login", { method: "POST", body: JSON.stringify({ piAccessToken: o.accessToken, piUserId: o.user.uid, piUsername: o.user.username || "", nickname: o.user.username || n("piPlayer") }) });
  localStorage.setItem("blitz_user_token", s.accessToken), localStorage.setItem("blitz_pi_auth", JSON.stringify({ uid: o.user.uid, username: o.user.username || "", loggedAt: Date.now(), sandbox: r }));
}
async function D() {
  const [e, t, r, o, s, l, c, d, u, h, p, f] = await Promise.all([w("/api/home/index"), w("/api/auth/profile"), w("/api/wallet/me"), w("/api/rank/me"), w("/api/rank/leaderboard?page=1&pageSize=15&type=weekly"), w("/api/pi/config"), w("/api/profile/options"), w("/api/game/config"), w(`/api/battle/history?page=${a.battleHistoryPage}&pageSize=5&mode=${encodeURIComponent(a.battleHistoryFilter === "all" ? "" : a.battleHistoryFilter)}`), w("/api/withdraw/wallets").catch(() => []), w("/api/invite/me").catch(() => null), w("/api/engagement/me").catch(() => null)]);
  a.home = e, a.user = t, a.wallet = r, a.rankStatus = o, a.rankLeaderboard = s, a.piConfig = l, a.profileOptions = c, a.gameConfig = d, a.inviteInfo = p, a.engagement = f, Qe(), a.withdrawWallets = h, a.battleHistory = u.items, a.battleHistoryPage = u.page, a.battleHistoryTotal = u.total, a.battleHistoryTotalPages = u.totalPages;
}
async function vt(e) {
  const t = Math.max(1, Math.min(a.battleHistoryTotalPages || 1, e)), r = a.battleHistoryFilter === "all" ? "" : a.battleHistoryFilter, o = await w(`/api/battle/history?page=${t}&pageSize=5&mode=${encodeURIComponent(r)}`);
  a.battleHistory = o.items, a.battleHistoryPage = o.page, a.battleHistoryTotal = o.total, a.battleHistoryTotalPages = o.totalPages;
}
async function Kt(e) {
  const t = a.rankLeaderboard, r = Math.max(1, Math.min(t?.totalPages || 1, e));
  a.rankLeaderboard = await w(`/api/rank/leaderboard?page=${r}&pageSize=15&type=weekly`);
}
function Xi() {
  if (a.user && !a.user.profileCompleted) {
    Qa("setup");
    return;
  }
  _();
}
async function it() {
  if (a.screen !== "matching") return;
  const e = a.matchSessionId;
  let t;
  try {
    try {
      t = await w("/api/match/status");
    } catch (o) {
      await new Promise((s) => window.setTimeout(s, 350));
      t = await w("/api/match/status");
    }
    a.matchPollFailedCount = 0, a.matchCancelMessage = "";
  } catch (o) {
    if (a.screen !== "matching" || e !== a.matchSessionId || a.matchCancelling) return;
    if (a.matchPollFailedCount += 1, a.matchCanCancel = true, a.matchCancelMessage = a.matchPollFailedCount >= Ie ? N(o) : a.matchPollFailedCount >= 2 ? n("matchNetworkRetrying") : "", a.matchPollFailedCount >= 2 && v("client_match_poll_failed", { mode: a.selectedMode, message: N(o), result: String(a.matchPollFailedCount), waitingSeconds: a.matchWaitingSeconds }, a.matchPollFailedCount >= Ie ? 0 : 5e3), J(a.matchPollFailedCount >= Ie ? n("matchFailed") : n("waitedSeconds", { seconds: a.matchWaitingSeconds })), a.matchPollFailedCount >= Ie) {
      O(), await to(e, N(o));
      return;
    }
    a.matchPollTimer = window.setTimeout(it, Math.min(Tn + a.matchPollFailedCount * 400, 3200));
    return;
  }
  if (a.screen !== "matching" || e !== a.matchSessionId || a.matchCancelling) return;
  if (t.status === "matched" && t.roomNo) {
    await pa(t, e);
    return;
  }
  const r = Number(t.waitingSeconds ?? 0);
  r > a.matchWaitingSeconds + 1 ? (a.matchStartedAt = Date.now() - r * 1e3, a.matchWaitingSeconds = r) : Qt(), a.matchCanCancel = !!t.canCancel || a.matchWaitingSeconds >= Ce(), J(t.status === "queueing" ? n("waitedSeconds", { seconds: a.matchWaitingSeconds }) : n("matchingShort")), a.screen === "matching" && e === a.matchSessionId && !a.matchCancelling && (a.matchPollTimer = window.setTimeout(it, Ha));
}
async function un(e = "quick_battle") {
  const t = getModeBalanceState(e), r = X(e);
  if (pt(e)?.enabled === false || isAssetGatewayModeClosed(e) || t.error || la(e) && t.balance < r || e === "pi_battle" && !ia()) {
    ma(e);
    return;
  }
  Q(), O(), ce();
  const o = a.matchSessionId + 1;
  a.screen = "matching", a.matchSessionId = o, a.selectedMode = e, a.roomNo = "", a.roomJoinToken = "", a.room = null, a.realtimeRoom = null, a.result = null, a.selectedTile = null, a.battleConnectingAt = 0, a.battleEnteredAt = 0, a.feedback = null, a.feedbackEventId = "", a.battleMessage = "", a.matchCancelMessage = "", a.matchStartedAt = Date.now(), a.matchWaitingSeconds = 0, a.matchCanCancel = false, a.matchCancelling = false, a.matchPollFailedCount = 0, nt(), a.matchUiTimer = window.setInterval(Za, 250), v("client_match_start", { mode: e, result: String(o) }, 0);
  try {
    const s = await w("/api/match/join-queue", { method: "POST", body: JSON.stringify({ mode: e }) });
    if (a.screen !== "matching" || o !== a.matchSessionId || a.matchCancelling) return;
    if (s.status === "matched" && s.roomNo) {
      await pa(s, o);
      return;
    }
    v("client_match_queueing", { mode: e, queueLength: s.queueLength || 0, waitingSeconds: s.waitingSeconds || 0 }, 0), Vi(o), await it();
  } catch (s) {
    if (a.screen !== "matching" || o !== a.matchSessionId) return;
    const l = N(s);
    if (s?.code === 1601 || /绑定邀请人|邀请人/.test(l)) {
      a.matchSessionId += 1, a.screen = "home", a.matchStartedAt = 0, a.matchWaitingSeconds = 0, a.matchCanCancel = false, a.matchCancelling = false, a.matchPollFailedCount = 0, a.matchCancelMessage = "", O(), await D().catch(() => {
      }), at(), S(l, "error");
      return;
    }
    a.matchCancelMessage = l, v("client_match_start_failed", { mode: e, message: a.matchCancelMessage, costMs: Date.now() - a.matchStartedAt }, 0), J(n("matchFailed")), O();
  }
}
async function Qi() {
  if (a.matchCancelling) return;
  const e = Ce();
  if (!a.matchCanCancel && a.matchWaitingSeconds < e) {
    a.matchCancelMessage = n("waitBeforeCancel", { seconds: Math.max(1, e - a.matchWaitingSeconds) }), J(n("waitedSeconds", { seconds: a.matchWaitingSeconds }));
    return;
  }
  const t = a.matchSessionId;
  a.matchCancelling = true, a.matchCancelMessage = n("cancelingStatus"), J(n("waitedSeconds", { seconds: a.matchWaitingSeconds })), O();
  try {
    if (await w("/api/match/cancel-queue", { method: "POST", body: JSON.stringify({}) }), v("client_match_cancel", { mode: a.selectedMode, waitingSeconds: a.matchWaitingSeconds }, 0), t !== a.matchSessionId) return;
    a.matchSessionId += 1, a.screen = "home", a.matchStartedAt = 0, a.matchWaitingSeconds = 0, a.matchCanCancel = false, a.matchCancelling = false, a.matchPollFailedCount = 0, a.matchCancelMessage = "", await D(), _();
  } catch (r) {
    if (t !== a.matchSessionId) return;
    a.matchCancelling = false, a.matchCancelMessage = N(r), v("client_match_cancel_failed", { mode: a.selectedMode, message: a.matchCancelMessage, waitingSeconds: a.matchWaitingSeconds }, 0), a.screen = "matching", J(n("waitedSeconds", { seconds: a.matchWaitingSeconds })), a.matchUiTimer = window.setInterval(Za, 250), a.matchPollTimer = window.setTimeout(it, Ha);
  }
}
async function Zi() {
  a.room = await w(`/api/battle/room/${encodeURIComponent(a.roomNo)}`);
}
async function eo() {
  try {
    await Zi();
  } catch (e) {
    const t = N(e);
    if (Ki(t)) {
      sn(t);
      return;
    }
    a.room = null, a.battleMessage = t;
  }
}
async function to(e, t) {
  if (!(a.screen !== "matching" || e !== a.matchSessionId || a.matchCancelling)) {
    a.matchCancelling = true, a.matchCancelMessage = t, J(n("matchFailed"));
    try {
      await w("/api/match/cancel-queue", { method: "POST", body: JSON.stringify({}) });
    } catch {
    }
    a.screen !== "matching" || e !== a.matchSessionId || (a.matchCancelling = false, a.matchCanCancel = true);
  }
}
async function ao() {
  try {
    Qe(), ua(n("loginLoading")), await Yi(), Qe(), await D(), await tryAutoBindInvite(), a.screen = "home", Xi();
  } catch (e) {
    console.error("\u521D\u59CB\u5316\u5931\u8D25", e), Fe(n("initFailed", { message: N(e) }));
  }
}
ao();

