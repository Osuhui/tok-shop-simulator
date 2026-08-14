// 整局模拟：验证税务 / 竞争 / 员工 / 营销 / 物流 / 贷款 / 评价复购 / 选品趋势
// 等系统注册为 DayProcessor 后，连续推进多日不崩溃且字段正常演进。
import { describe, it, expect } from 'vitest';
import { runDay } from './engine/DayProcessor';
import { createTestState, makeTestOrder } from './testFixtures';
import { tryTriggerEvent } from './engine/EventEngine';
import { EVENTS } from './data/events';
import { createInitialCompetitors } from './systems/CompetitionSystem';
import { startCampaign } from './systems/MarketingSystem';
import { hireEmployee } from './systems/EmployeeSystem';
import { takeLoan } from './systems/LoanSystem';
import { fileTax } from './systems/TaxSystem';
import { startCertificateApplication } from './systems/TaskSystem';

describe('整局模拟 Integration', () => {
  it('连续推进 120 天，全部系统协同运行且不崩溃', () => {
    let state = createTestState({
      competitors: createInitialCompetitors('SEA'),
    });

    // 充足库存 + 两笔已结算订单（驱动评价/复购系统）
    const seed = makeTestOrder({ status: 'delivered', paid: true, expectedPaymentDay: 1 });
    state = {
      ...state,
      inventory: [{ productId: 'prod_stanup_cup', quantity: 2000, inboundQuantity: 0, warehouseType: 'self' }],
      orders: [seed, { ...seed, orderId: 'T2' }],
    };

    for (let day = 1; day <= 120; day++) {
      // 周期性触发业务动作，覆盖各系统代码路径
      if (day === 5) state = startCampaign(state, 'ads', 200, day).state;
      if (day === 12) state = hireEmployee(state, 'packer', day).state;
      if (day === 18) state = takeLoan(state, 'payday', day).state;
      if (day === 22) state = startCertificateApplication(state, 'VAT');
      if (day === 45) state = fileTax(state, day);

      const ctx = runDay(state, day);
      state = {
        ...ctx.state,
        orders: [...ctx.state.orders, ...ctx.newOrders],
        player: { ...ctx.state.player, day },
      };

      // 事件触发不应抛错
      const ev = tryTriggerEvent(state, EVENTS);
      expect(ev === null || typeof ev.id === 'string').toBe(true);
    }

    // 基本不变量
    expect(state.player.day).toBe(120);
    expect(Number.isFinite(state.player.gold)).toBe(true);
    expect(Array.isArray(state.reviews)).toBe(true);
    expect(Array.isArray(state.competitors)).toBe(true);
    expect(Array.isArray(state.employees)).toBe(true);
    expect(Array.isArray(state.campaigns)).toBe(true);
    expect(Number.isFinite(state.competitionPressure)).toBe(true);
  });
});
