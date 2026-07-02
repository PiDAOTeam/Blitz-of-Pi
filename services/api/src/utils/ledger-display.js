function extractSeasonRank(relatedId = "", remark = "") {
  const idMatch = String(relatedId || "").match(/^(\d{4}-\d{2}):/);
  const remarkMatch = String(remark || "").match(/(\d{4}-\d{2}).*?第(\d+)名/);
  return {
    seasonNo: remarkMatch?.[1] || idMatch?.[1] || "",
    rankNo: remarkMatch?.[2] || ""
  };
}

function formatLedgerRemark(row = {}) {
  const relatedType = String(row.related_type || row.relatedType || "");
  const relatedId = String(row.related_id || row.relatedId || "");
  const remark = String(row.remark || "");
  const { seasonNo, rankNo } = extractSeasonRank(relatedId, remark);
  const prefix = seasonNo ? `${seasonNo}月赛季` : "月赛季";
  const rankText = rankNo ? `第${rankNo}名` : "奖励";

  if (relatedType === "rank_monthly_season_reward") {
    return `${prefix}${rankText}奖励已改为积分发放`;
  }
  if (relatedType === "rank_monthly_season_reward_reversal") {
    return `${prefix}${rankText}奖励资产纠正：扣回误发 Pi`;
  }
  if (relatedType === "rank_monthly_season_reward_remaining_reversal") {
    return `${prefix}${rankText}奖励资产纠正：扣回剩余误发 Pi`;
  }
  if (relatedType === "rank_monthly_season_reward_remaining_restore") {
    return `${prefix}${rankText}奖励资产纠正：保留原可用余额`;
  }
  if (relatedType === "withdraw_order_reject" && remark.includes("月赛季误发")) {
    return "月赛季奖励资产纠正：提现终止并解除冻结";
  }
  if (relatedType === "rank_monthly_season_points_reward") {
    return `${prefix}${rankText}积分奖励`;
  }

  return remark;
}

module.exports = {
  formatLedgerRemark
};
