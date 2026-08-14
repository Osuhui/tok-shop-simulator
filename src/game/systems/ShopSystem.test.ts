import { describe, it, expect } from 'vitest';
import { canUpgrade, applyUpgrade, getUpgradeRequirement, MAX_SHOP_LEVEL } from './ShopSystem';
import { createTestState } from '../testFixtures';
import type { PlayerState } from '../types';

function player(overrides: Partial<PlayerState> = {}): PlayerState {
  return { ...createTestState().player, ...overrides };
}

describe('ShopSystem', () => {
  it('canUpgrade：条件未满足时为 false', () => {
    const p = player({ shopLevel: 1, gold: 0, totalRevenue: 0, totalOrdersCompleted: 0 });
    expect(canUpgrade(p, getUpgradeRequirement(1))).toBe(false);
  });

  it('canUpgrade：条件全满足时为 true', () => {
    const req = getUpgradeRequirement(1);
    const p = player({
      shopLevel: 1,
      gold: req.goldCost,
      totalRevenue: req.revenueRequired,
      totalOrdersCompleted: req.ordersRequired,
    });
    expect(canUpgrade(p, req)).toBe(true);
  });

  it('applyUpgrade：等级 +1 并扣款', () => {
    const req = getUpgradeRequirement(1);
    const state = createTestState({
      player: player({
        shopLevel: 1,
        gold: req.goldCost + 100,
        totalRevenue: req.revenueRequired,
        totalOrdersCompleted: req.ordersRequired,
      }),
    });
    const next = applyUpgrade(state);
    expect(next.player.shopLevel).toBe(2);
    expect(next.player.gold).toBeCloseTo(100, 2);
  });

  it('applyUpgrade：条件不满足时返回原引用（无变化）', () => {
    const state = createTestState();
    expect(applyUpgrade(state)).toBe(state);
  });

  it('MAX_SHOP_LEVEL 上限：满级不可再升', () => {
    const req = getUpgradeRequirement(MAX_SHOP_LEVEL);
    const p = player({ shopLevel: MAX_SHOP_LEVEL });
    expect(canUpgrade(p, req)).toBe(false);
  });
});
