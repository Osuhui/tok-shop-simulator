// ============================================================
// 格式化工具
// ============================================================

/** 格式化金额 */
export function formatGold(amount: number): string {
  return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** 格式化数字 */
export function formatNumber(n: number): string {
  return n.toLocaleString('en-US');
}

/** 格式化百分比 */
export function formatPercent(ratio: number): string {
  return `${(ratio * 100).toFixed(1)}%`;
}

/** 格式化游戏天数 */
export function formatDay(day: number): string {
  return `Day ${day}`;
}

/** 格式化时间戳为可读时间 */
export function formatTimestamp(ts: number): string {
  return new Date(ts).toLocaleString('zh-CN');
}

/** 订单状态中文 */
export function orderStatusLabel(status: string): string {
  const map: Record<string, string> = {
    pending: '待处理',
    processing: '处理中',
    shipped: '已发货',
    inTransit: '运输中',
    delivered: '已签收',
    cancelled: '已取消',
    refunded: '已退款',
  };
  return map[status] || status;
}

/** 订单状态颜色 */
export function orderStatusColor(status: string): string {
  const map: Record<string, string> = {
    pending: '#f59e0b',
    processing: '#3b82f6',
    shipped: '#8b5cf6',
    inTransit: '#06b6d4',
    delivered: '#22c55e',
    cancelled: '#ef4444',
    refunded: '#f97316',
  };
  return map[status] || '#94a3b8';
}
