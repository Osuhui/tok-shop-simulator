// ============================================================
// 净资产推演：基于近期趋势估算达成目标所需天数
// ============================================================

/** 按近 N 日净资产平均增速估算达成目标还需的天数；数据不足或增速 <= 0 时返回 null */
export function estimateDaysToNetWorth(history: number[], target: number): number | null {
  if (history.length < 2) return null;
  const first = history[0];
  const last = history[history.length - 1];
  const avgDailyGain = (last - first) / (history.length - 1);
  if (avgDailyGain <= 0) return null;
  return Math.max(0, Math.ceil((target - last) / avgDailyGain));
}
