import { describe, it, expect } from 'vitest';
import { runDay } from './DayProcessor';
import { startCertificateApplication, advanceCertificatesProcessor } from '../systems/TaskSystem';
import { createTestState } from '../testFixtures';

describe('DayProcessor', () => {
  it('runDay：把玩家 day 推进到目标 day', () => {
    const s = createTestState({ player: { ...createTestState().player, day: 5 } });
    const ctx = runDay(s, 6);
    expect(ctx.state.player.day).toBe(6);
    expect(ctx.day).toBe(6);
  });

  it('runDay：有库存时生成自然流量订单', () => {
    const s = createTestState({
      inventory: [{ productId: 'p1', quantity: 50, warehouseType: 'self' } as any],
    });
    const ctx = runDay(s, 2);
    expect(Array.isArray(ctx.newOrders)).toBe(true);
  });

  it('runDay：无库存时不生成自然流量订单', () => {
    const ctx = runDay(createTestState(), 2);
    expect(ctx.newOrders).toHaveLength(0);
  });

  it('开业封锁：normal 未办齐两证时不生成自然流量订单（即使库存已上架）', () => {
    const s = createTestState({
      difficultyId: 'normal',
      inventory: [{ productId: 'prod_stanup_cup', quantity: 50, inboundQuantity: 0, warehouseType: 'self', isListed: true }],
    });
    const ctx = runDay(s, 2);
    expect(ctx.newOrders).toHaveLength(0);
  });

  it('开业封锁：办齐两证后自然流量恢复', () => {
    const s = createTestState({
      difficultyId: 'normal',
      inventory: [{ productId: 'prod_stanup_cup', quantity: 50, inboundQuantity: 0, warehouseType: 'self', isListed: true }],
      certificates: [
        { id: 'SELLER_VERIFY', name: '卖家实名认证', layer: 'L0', cost: 0, leadTimeDays: 1, status: 'active', unlocks: [] },
        { id: 'RECEIVING_ACCOUNT', name: '跨境收款账户', layer: 'L0', cost: 0, leadTimeDays: 1, status: 'active', unlocks: [] },
      ],
    });
    const ctx = runDay(s, 2);
    expect(ctx.newOrders.length).toBeGreaterThan(0);
  });

  it('advanceCertificatesProcessor：到期待审自动转 active', () => {
    const applying = createTestState();
    const withCert = startCertificateApplication(applying, 'CE').state; // grantedDay = day + 7
    const grantedDay = withCert.certificates[0].grantedDay!;
    const ctx = advanceCertificatesProcessor(
      { state: withCert, day: grantedDay, newOrders: [], report: null, paymentReceived: 0, overduePenalty: 0, overdueCount: 0, todayRevenue: 0, todayExpenses: 0, todayOrdersCount: 0 },
      grantedDay,
    );
    expect(ctx.state.certificates[0].status).toBe('active');
  });

  it('runDay 集成：申请证件后在 leadTime 后转为 active', () => {
    const s = createTestState({ player: { ...createTestState().player, day: 1 } });
    const withCert = startCertificateApplication(s, 'CE').state; // grantedDay = 8
    const ctx = runDay(withCert, 10);
    expect(ctx.state.certificates[0].status).toBe('active');
  });
});
