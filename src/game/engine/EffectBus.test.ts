import { describe, it, expect } from 'vitest';
import { applyCommand, applyCommands } from './EffectBus';
import { createTestState } from '../testFixtures';
import type { GameState } from '../types';

describe('EffectBus', () => {
  it('gold：累加并四舍五入', () => {
    const s = createTestState({ player: { ...createTestState().player, gold: 1000 } });
    const next = applyCommand(s, { type: 'gold', value: 12.345 });
    expect(next.player.gold).toBeCloseTo(1012.35, 2);
  });

  it('healthScore：限制在 0-5', () => {
    const s = createTestState({ player: { ...createTestState().player, healthScore: 4.9 } });
    expect(applyCommand(s, { type: 'healthScore', value: 1 }).player.healthScore).toBe(5);
    expect(applyCommand(s, { type: 'healthScore', value: -99 }).player.healthScore).toBe(0);
  });

  it('reputation：限制在 0-100', () => {
    const s = createTestState({ player: { ...createTestState().player, reputation: 95 } });
    expect(applyCommand(s, { type: 'reputation', value: 50 }).player.reputation).toBe(100);
    expect(applyCommand(s, { type: 'reputation', value: -999 }).player.reputation).toBe(0);
  });

  it('inventory：按 productId 调增减', () => {
    const s = createTestState({
      inventory: [{ productId: 'p1', quantity: 10, warehouseType: 'self' } as any],
    });
    const next = applyCommand(s, { type: 'inventory', target: 'p1', value: -3 });
    expect(next.inventory[0].quantity).toBe(7);
  });

  it('grantCertificate：写入/更新为 active', () => {
    let s: GameState = createTestState();
    s = applyCommand(s, { type: 'grantCertificate', certId: 'CE' });
    expect(s.certificates).toHaveLength(1);
    expect(s.certificates[0]).toMatchObject({ id: 'CE', status: 'active' });
  });

  it('sendMessage：前置一条通知', () => {
    const s = createTestState();
    const next = applyCommand(s, { type: 'sendMessage', from: '海关', title: '扣货通知', body: '缺少CE' });
    expect(next.notifications).toHaveLength(1);
    expect(next.notifications[0].title).toBe('扣货通知');
  });

  it('applyCommands：顺序执行多条', () => {
    const s = createTestState({ player: { ...createTestState().player, gold: 500, reputation: 0 } });
    const next = applyCommands(s, [
      { type: 'gold', value: 100 },
      { type: 'reputation', value: 10 },
    ]);
    expect(next.player.gold).toBe(600);
    expect(next.player.reputation).toBe(10);
  });
});
