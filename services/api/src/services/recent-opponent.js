// 同一对手短时不再匹配。只决定「能不能配」，不碰结算。

const REDIS_RECENT_OPPONENT_PREFIX = "blitz:match:recent-opponent:";

function isBotUid(uid) {
  return String(uid || "").startsWith("bot_");
}

function recentOpponentPairKey(uidA, uidB) {
  const [left, right] = [String(uidA || ""), String(uidB || "")].filter(Boolean).sort();
  if (!left || !right || left === right) return "";
  return `${REDIS_RECENT_OPPONENT_PREFIX}${left}:${right}`;
}

function shouldRememberRecentOpponent(uidA, uidB) {
  return Boolean(uidA && uidB && uidA !== uidB && !isBotUid(uidA) && !isBotUid(uidB));
}

function takePairForUser(queue, uid, blockedOpponentUids = new Set()) {
  const selfIndex = queue.findIndex((item) => item.uid === uid);
  if (selfIndex < 0) return null;

  const opponentIndex = queue.findIndex(
    (item) => item.uid !== uid && !blockedOpponentUids.has(item.uid)
  );

  if (opponentIndex < 0) {
    return null;
  }

  const pairIndexes = [selfIndex, opponentIndex].sort((a, b) => b - a);
  const players = [];

  for (const index of pairIndexes) {
    players.push(queue.splice(index, 1)[0]);
  }

  const self = players.find((item) => item.uid === uid);
  const opponent = players.find((item) => item.uid !== uid);
  return [self, opponent];
}

module.exports = {
  REDIS_RECENT_OPPONENT_PREFIX,
  isBotUid,
  recentOpponentPairKey,
  shouldRememberRecentOpponent,
  takePairForUser
};
