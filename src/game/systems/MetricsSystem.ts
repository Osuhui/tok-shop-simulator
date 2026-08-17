// ============================================================
// 经营指标历史：按日滚动快照，供数据看板可视化
// - 纯观测数据，不参与任何经济计算（对 sim 零影响）
// ============================================================
import type { MetricHistory } from '../types';

export function createInitialMetricsHistory(): MetricHistory {
  return { netWorth: [], revenue: [], expense: [], orders: [] };
}
