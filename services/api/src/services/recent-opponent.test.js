const test = require("node:test");
const assert = require("node:assert/strict");
const {
  recentOpponentPairKey,
  shouldRememberRecentOpponent,
  takePairForUser
} = require("./recent-opponent");

test("对手冷却键按 uid 排序，机器人不记", () => {
  assert.equal(
    recentOpponentPairKey("pi_b", "pi_a"),
    recentOpponentPairKey("pi_a", "pi_b")
  );
  assert.equal(recentOpponentPairKey("pi_a", "pi_a"), "");
  assert.equal(shouldRememberRecentOpponent("pi_a", "pi_b"), true);
  assert.equal(shouldRememberRecentOpponent("pi_a", "bot_1"), false);
  assert.equal(shouldRememberRecentOpponent("bot_1", "pi_a"), false);
});

test("队列里跳过刚配过的人，改配下一位", () => {
  const queue = [
    { uid: "me" },
    { uid: "old" },
    { uid: "fresh" }
  ];
  const pair = takePairForUser(queue, "me", new Set(["old"]));
  assert.deepEqual(pair.map((item) => item.uid).sort(), ["fresh", "me"]);
  assert.deepEqual(queue.map((item) => item.uid), ["old"]);
});

test("只剩冷却中的对手时不成房，人还留在队列", () => {
  const queue = [{ uid: "me" }, { uid: "old" }];
  const pair = takePairForUser(queue, "me", new Set(["old"]));
  assert.equal(pair, null);
  assert.equal(queue.length, 2);
});
