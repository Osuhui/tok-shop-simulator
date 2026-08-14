import { describe, it, expect } from 'vitest';
import { runDay } from './DayProcessor';
import { createTestState, makeTestOrder } from '../testFixtures';

describe('结算一次性（BUG#3 配套修复）', () => {
  it('runDay：已签收订单回款只结算一次（paid 标记）', () => {
    const order = makeTestOrder();
    const s = createTestState({
      orders: [order],
      player: { ...createTestState().player, day: 5, gold: 1000 },
    });

    const ctx1 = runDay(s, 5);
    const paidOrder = ctx1.state.orders.find((o) => o.orderId === 'T1')!;
    expect(paidOrder.paid).toBe(true);
    expect(ctx1.paymentReceived).toBeGreaterThan(0);

    // 第二天：同一订单不再重复回款
    const ctx2 = runDay(ctx1.state, 6);
    expect(ctx2.paymentReceived).toBe(0);
  });
});
