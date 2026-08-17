import { describe, it, expect } from 'vitest';
import { createInitialMetricsHistory } from './MetricsSystem';

describe('MetricsSystem', () => {
  it('createInitialMetricsHistory：四个序列初始为空数组', () => {
    const m = createInitialMetricsHistory();
    expect(m.netWorth).toEqual([]);
    expect(m.revenue).toEqual([]);
    expect(m.expense).toEqual([]);
    expect(m.orders).toEqual([]);
  });
});
