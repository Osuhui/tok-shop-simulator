import { describe, it, expect } from 'vitest';
import {
  getLevelUpRequirement,
  calculateDailyOperatingCost,
  calculatePlatformFee,
} from './formulas';

describe('formulas', () => {
  it('getLevelUpRequirement：随等级线性增长', () => {
    const r1 = getLevelUpRequirement(1);
    const r2 = getLevelUpRequirement(2);
    expect(r2.revenueRequired).toBe(r1.revenueRequired * 2);
    expect(r2.ordersRequired).toBe(r1.ordersRequired * 2);
    expect(r2.goldCost).toBe(r1.goldCost * 2);
  });

  it('calculateDailyOperatingCost：随等级提升而递减（效率红利，下限 4）', () => {
    expect(calculateDailyOperatingCost(1)).toBe(11);
    expect(calculateDailyOperatingCost(5)).toBe(7);
    expect(calculateDailyOperatingCost(20)).toBe(4); // 下限保护
  });

  it('calculatePlatformFee：按费率计算并四舍五入', () => {
    expect(calculatePlatformFee(100, 'SEA')).toBe(5); // SEA 5%
  });
});
