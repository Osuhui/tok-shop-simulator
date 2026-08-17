import { describe, it, expect } from 'vitest';
import { createInitialTax, accrueTax, checkAudit, fileTax } from './TaxSystem';
import { createTestState } from '../testFixtures';
import type { Order } from '../types';

const order = (amount: number): Order => ({
  orderId: 'O1', productId: 'p', productName: 'p', quantity: 1, unitPrice: amount, totalAmount: amount,
  shippingCost: 0, platformFeeRate: 0, status: 'delivered', shippingType: 'self', region: 'UK',
  createdAt: 1, deadline: 3, isCOD: false, expectedPaymentDay: 2,
});

describe('TaxSystem', () => {
  it('accrueTax：UK 按 20% 计提流转税；SEA 免税不计提', () => {
    const uk = createTestState();
    uk.player.currentRegion = 'UK';
    expect(accrueTax(uk, 1, [order(1000)]).tax.taxOwed).toBeCloseTo(200, 5);

    const sea = createTestState();
    sea.player.currentRegion = 'SEA';
    expect(accrueTax(sea, 1, [order(1000)]).tax.taxOwed).toBe(0);
  });

  it('checkAudit：周期内或无欠税不累积', () => {
    const within = createTestState();
    within.tax = { ...createInitialTax(), taxOwed: 1000, lastFilingDay: 50 };
    expect(checkAudit(within, 60).triggerAudit).toBe(false); // 60-50=10 < 30 周期

    const noOwed = createTestState();
    noOwed.tax = { ...createInitialTax(), taxOwed: 0, lastFilingDay: 0 };
    expect(checkAudit(noOwed, 60).state.tax.auditRisk).toBe(0);
  });

  it('checkAudit：逾期且欠税时加收滞纳金（SEA 10%）并累积稽查风险', () => {
    const s = createTestState();
    s.tax = { ...createInitialTax(), taxOwed: 1000, lastFilingDay: 0 }; // 默认 SEA
    const { state, triggerAudit } = checkAudit(s, 60);
    expect(state.tax.latePenalty).toBeCloseTo(100, 5); // 1000 * 10%
    expect(state.tax.taxOwed).toBeCloseTo(1100, 5);
    expect(state.tax.auditRisk).toBeCloseTo(0.25, 5);
    expect(triggerAudit).toBe(false);
  });

  it('checkAudit：UK 未持 VAT 证时滞纳金 ×2（20%）', () => {
    const s = createTestState();
    s.player.currentRegion = 'UK';
    s.tax = { ...createInitialTax(), taxOwed: 1000, lastFilingDay: 0 };
    const { state } = checkAudit(s, 60);
    expect(state.tax.latePenalty).toBeCloseTo(200, 5);
  });

  it('fileTax：缴清欠税与滞纳金、清零稽查风险与滞纳记录', () => {
    const s = createTestState();
    s.tax = { ...createInitialTax(), taxOwed: 500, latePenalty: 100, auditRisk: 0.5, lastFilingDay: 10 };
    const ns = fileTax(s, 40);
    expect(ns.tax.taxOwed).toBe(0);
    expect(ns.tax.latePenalty).toBe(0);
    expect(ns.tax.auditRisk).toBe(0);
    expect(ns.tax.lastFilingDay).toBe(40);
    expect(ns.player.gold).toBeCloseTo(s.player.gold - 500, 5);
  });
});
