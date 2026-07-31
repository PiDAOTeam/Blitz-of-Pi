const test = require("node:test");
const assert = require("node:assert/strict");

const { formatBusinessDate } = require("./engagement.repository");

test("业务日期不使用 UTC 日期，避免签到幂等键提前一天", () => {
  const localDate = new Date(2026, 6, 31, 0, 0, 0);

  assert.equal(formatBusinessDate(localDate), "2026-07-31");
});
