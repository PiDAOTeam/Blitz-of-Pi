// 动画时长常量与归一化函数 —— 由 main.js 抽离，逐字搬迁，未改动逻辑。

export const DEFAULT_ANIMATION_DURATIONS = {
  localBurstSeconds: 1.18,
  localBurstHighSeconds: 1.26,
  serverBurstSeconds: 1.22,
  serverBurstHighSeconds: 1.28,
  lowPerformanceBurstSeconds: 0.9,
  boardEffectSeconds: 0.28,
  boardEffectHighSeconds: 0.34,
  tileBurstSeconds: 0.34,
  tileBurstHighSeconds: 0.38,
  tileFallSeconds: 0.26,
  tileFallHighSeconds: 0.28,
  localSwapSeconds: 0.18,
  invalidSwapSeconds: 0.2,
  serverSettleSeconds: 0.16,
  impactSeconds: 0.82,
  impactHighSeconds: 0.92,
  pressureHitSeconds: 0.72,
  boardUnderAttackSeconds: 0.58,
  attackLineSeconds: 0.78,
  hitWarningSeconds: 0.92
};
export const DEFAULT_ATTACK_WARNING_TEXT = "\u88AB\u653B\u51FB \u538B\u529B+{attack}";
export function normalizeAnimationDurations(e = {}) {
  const t = (r, o = DEFAULT_ANIMATION_DURATIONS[r]) => {
    const s = Number(e?.[r]);
    return Number.isFinite(s) && s >= 0.05 && s <= 3 ? s : o;
  };
  return Object.fromEntries(Object.keys(DEFAULT_ANIMATION_DURATIONS).map((r) => [r, t(r)]));
}
