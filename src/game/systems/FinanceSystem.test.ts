import { describe, it, expect } from 'vitest';
import { FinanceSystem } from './FinanceSystem';
import { createTestState, makeTestOrder } from '../testFixtures';
import { getProduct } from '../data/products';

describe('FinanceSystem.dailySettle', () => {
  it('BUG#3：结算时计入采购成本(COGS)并拉低净利', () => {
    const product = getProduct('prod_stanup_cup')!;
    const order = makeTestOrder({ quantity: 3, totalAmount: 30 });
    const state = createTestState({
      orders: [order],
      player: { ...createTestState().player, day: 5 },
    });
    const { report } = FinanceSystem.dailySettle(state, state.orders, state.inventory, 5);

    expect(report.expenses.sourcingCost).toBeCloseTo(product.cost * 3, 2);
    // 净利应小于"未计 COGS 时的毛利"
    const gross = report.revenue.orderPayments - report.expenses.platformFees;
    expect(report.netProfit).toBeLessThan(gross);
  });

  it('已结算(paid)订单不再重复计入收入与成本', () => {
    const order = makeTestOrder({ paid: true });
    const state = createTestState({
      orders: [order],
      player: { ...createTestState().player, day: 5 },
    });
    const { report, paymentReceived } = FinanceSystem.dailySettle(state, state.orders, state.inventory, 5);

    expect(paymentReceived).toBe(0);
    expect(report.revenue.orderPayments).toBe(0);
    expect(report.expenses.sourcingCost).toBe(0);
  });
});
