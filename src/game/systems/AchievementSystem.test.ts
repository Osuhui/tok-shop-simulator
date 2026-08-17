import { describe, it, expect } from 'vitest';
import { evaluateAchievements, createInitialAchievements } from './AchievementSystem';
import { createTestState, makeTestOrder } from '../testFixtures';

describe('AchievementSystem', () => {
  it('createInitialAchievements：全部 12 项初始未解锁', () => {
    const a = createInitialAchievements();
    expect(a).toHaveLength(12);
    expect(a.every((x) => !x.unlocked)).toBe(true);
  });

  it('evaluateAchievements：首单回款解锁 first_sale，且为纯函数不改写原 state', () => {
    const s = createTestState();
    const s2 = { ...s, orders: [makeTestOrder({ paid: true })] };
    const next = evaluateAchievements(s2);

    expect(next.achievements.find((x) => x.id === 'first_sale')?.unlocked).toBe(true);
    // 其它项保持未解锁
    expect(next.achievements.find((x) => x.id === 'cert_L0')?.unlocked).toBe(false);
    // 纯函数：原 state 不被改动
    expect(s.achievements.find((x) => x.id === 'first_sale')?.unlocked).toBe(false);
  });

  it('evaluateAchievements：已解锁项保持解锁（幂等）', () => {
    const s = createTestState({ orders: [makeTestOrder({ paid: true })] });
    const once = evaluateAchievements(s);
    const twice = evaluateAchievements(once);
    expect(twice.achievements.find((x) => x.id === 'first_sale')?.unlocked).toBe(true);
    expect(twice.achievements).toEqual(once.achievements);
  });

  it('evaluateAchievements：店铺升至 Lv.5 解锁 shop_lv5', () => {
    const base = createTestState();
    const s = createTestState({ player: { ...base.player, shopLevel: 5 } });
    const next = evaluateAchievements(s);
    expect(next.achievements.find((x) => x.id === 'shop_lv5')?.unlocked).toBe(true);
  });

  it('evaluateAchievements：集齐 4 张 L0 证件解锁 cert_L0', () => {
    const s = createTestState({
      certificates: [
        { id: 'SELLER_VERIFY', name: '实名', layer: 'L0', region: 'SEA', cost: 0, leadTimeDays: 1, status: 'active', appliedDay: 1, grantedDay: 1, unlocks: [] },
        { id: 'BUSINESS_LICENSE', name: '执照', layer: 'L0', region: 'SEA', cost: 0, leadTimeDays: 1, status: 'active', appliedDay: 1, grantedDay: 1, unlocks: [] },
        { id: 'RECEIVING_ACCOUNT', name: '收款', layer: 'L0', region: 'SEA', cost: 0, leadTimeDays: 1, status: 'active', appliedDay: 1, grantedDay: 1, unlocks: [] },
        { id: 'CUSTOMS_REG', name: '海关', layer: 'L0', region: 'SEA', cost: 0, leadTimeDays: 1, status: 'active', appliedDay: 1, grantedDay: 1, unlocks: [] },
      ],
    });
    const next = evaluateAchievements(s);
    expect(next.achievements.find((x) => x.id === 'cert_L0')?.unlocked).toBe(true);
  });
});
