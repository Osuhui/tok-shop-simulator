// 各内容系统的单元行为校验
import { describe, it, expect } from 'vitest';
import { createTestState, makeTestOrder } from './testFixtures';
import { takeLoan, repayLoan, LOAN_PRODUCTS } from './systems/LoanSystem';
import { fileTax, accrueTax } from './systems/TaxSystem';
import { hireEmployee, EMPLOYEE_DEFS } from './systems/EmployeeSystem';
import { startCampaign } from './systems/MarketingSystem';
import { selectCarrier, shippingMultiplier } from './systems/CarriersSystem';
import { createInitialCompetitors, competitionProcessor, tryPoach } from './systems/CompetitionSystem';
import { applyUpgrade, canUpgrade, getUpgradeRequirement } from './systems/ShopSystem';

describe('税务系统 TaxSystem', () => {
  it('accrueTax 按销售额计提流转税', () => {
    const s = createTestState({ player: { ...createTestState().player, currentRegion: 'UK' } });
    const order = makeTestOrder({ totalAmount: 100, region: 'UK' });
    const s1 = accrueTax(s, 1, [order]);
    expect(s1.tax.taxOwed).toBeCloseTo(20, 5); // UK VAT 20%
  });

  it('fileTax 缴纳后清零欠税并扣款', () => {
    let s = createTestState();
    s = { ...s, tax: { ...s.tax, taxOwed: 100 } };
    const goldBefore = s.player.gold;
    const next = fileTax(s, 10);
    expect(next.tax.taxOwed).toBe(0);
    expect(next.player.gold).toBeCloseTo(goldBefore - 100, 5);
  });
});

describe('贷款现金流 LoanSystem', () => {
  it('takeLoan 注入本金并生成贷款记录', () => {
    const s = createTestState({ player: { ...createTestState().player, shopLevel: 1 } });
    const { state, error } = takeLoan(s, 'payday', 1);
    expect(error).toBeUndefined();
    expect(state.loans.length).toBe(1);
    expect(state.player.gold).toBeCloseTo(s.player.gold + LOAN_PRODUCTS.payday.principal, 5);
  });

  it('repayLoan 扣回款并移除记录', () => {
    let s = createTestState({ player: { ...createTestState().player, shopLevel: 1 } });
    const taken = takeLoan(s, 'payday', 1).state;
    const goldBefore = taken.player.gold;
    const loanId = taken.loans[0].id;
    const { state, error } = repayLoan(taken, loanId);
    expect(error).toBeUndefined();
    expect(state.loans.length).toBe(0);
    expect(state.player.gold).toBeLessThan(goldBefore);
  });
});

describe('员工系统 EmployeeSystem', () => {
  it('hireEmployee 招募并扣首月薪资', () => {
    const s = createTestState();
    const goldBefore = s.player.gold;
    const { state, error } = hireEmployee(s, 'cs', 1);
    expect(error).toBeUndefined();
    expect(state.employees.length).toBe(1);
    expect(state.player.gold).toBeCloseTo(goldBefore - EMPLOYEE_DEFS.cs.salary, 5);
  });
});

describe('营销系统 MarketingSystem', () => {
  it('startCampaign 扣投入并登记活动', () => {
    const s = createTestState();
    const goldBefore = s.player.gold;
    const { state, error } = startCampaign(s, 'ads', 200, 1);
    expect(error).toBeUndefined();
    expect(state.campaigns.length).toBe(1);
    expect(state.player.gold).toBeCloseTo(goldBefore - 200, 5);
  });

  it('startCampaign 投入不足时拒绝', () => {
    const s = createTestState();
    const { error } = startCampaign(s, 'ads', 10, 1);
    expect(error).toBeDefined();
  });
});

describe('物流承运商 CarriersSystem', () => {
  it('selectCarrier 切换承运商', () => {
    const s = createTestState();
    const { state, error } = selectCarrier(s, 'eagle');
    expect(error).toBeUndefined();
    expect(state.carrierId).toBe('eagle');
  });

  it('shippingMultiplier 旺季为 1.5 倍', () => {
    const base = shippingMultiplier(createTestState(), 5);
    const peak = shippingMultiplier(createTestState(), 85); // day%90>=80 旺季
    expect(peak).toBeCloseTo(base * 1.5, 5);
  });
});

describe('竞争 AI CompetitionSystem', () => {
  it('createInitialCompetitors 按区域生成对手', () => {
    const comps = createInitialCompetitors('UK');
    expect(comps.length).toBeGreaterThan(0);
  });

  it('competitionProcessor 运行不崩溃', () => {
    const s = createTestState({ competitors: createInitialCompetitors('UK') });
    const ctx = { state: s, day: 10, newOrders: [], report: null, paymentReceived: 0, overduePenalty: 0, overdueCount: 0, todayRevenue: 0, todayExpenses: 0, todayOrdersCount: 0 };
    const out = competitionProcessor(ctx, 10);
    expect(Number.isFinite(out.state.competitionPressure)).toBe(true);
  });

  it('tryPoach 会挖走可用的中高阶达人', () => {
    const availableMid = {
      id: 'inf_x',
      name: '可挖达人',
      tier: 'mid',
      status: 'available',
      followers: 1200,
      commissionRate: 0.1,
      cooperationRate: 0.5,
      category: 'home',
      cooldownRemaining: 0,
    } as any;
    const aggressiveComp = {
      id: 'compA',
      name: '激进竞品',
      tier: 'mid',
      mainCategory: 'home',
      priceStrategy: 'low',
      marketShare: 0.2,
      aggressive: 0.9,
      poachedInfluencerIds: [],
    } as any;
    let poached = false;
    for (let day = 1; day <= 200 && !poached; day++) {
      const s = createTestState({ competitors: [aggressiveComp], influencers: [availableMid] });
      const out = tryPoach(s, day);
      if (out.competitors[0].poachedInfluencerIds.includes('inf_x')) poached = true;
    }
    expect(poached).toBe(true);
  });
});

describe('店铺升级 ShopSystem', () => {
  it('canUpgrade 在营收/订单/金币达标时为真', () => {
    const req = getUpgradeRequirement(1);
    const player = {
      ...createTestState().player,
      gold: 99999,
      shopLevel: 1,
      totalRevenue: req.revenueRequired + 1,
      totalOrdersCompleted: req.ordersRequired + 1,
    };
    expect(canUpgrade(player, req)).toBe(true);
  });

  it('applyUpgrade 提升等级并扣费', () => {
    const req = getUpgradeRequirement(1);
    const s = createTestState({
      player: {
        ...createTestState().player,
        gold: 99999,
        shopLevel: 1,
        totalRevenue: req.revenueRequired + 1,
        totalOrdersCompleted: req.ordersRequired + 1,
      },
    });
    const next = applyUpgrade(s);
    expect(next.player.shopLevel).toBe(2);
    expect(next.player.gold).toBeCloseTo(99999 - req.goldCost, 5);
  });
});
