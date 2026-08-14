// ============================================================
// 税务系统：流转税（VAT / Sales Tax / GST）按销售额代收代缴
// 每日累计 -> 周期申报缴纳 -> 漏报累积稽查风险
// ============================================================
import type { GameState, Order, PlayerTaxState } from '../types';
import { getTaxRule } from '../data/taxRules';
import type { DayProcessor } from '../engine/DayProcessor';

export function createInitialTax(): PlayerTaxState {
  return {
    taxOwed: 0,
    lastFilingDay: 0,
    vatRegistered: false,
    auditRisk: 0,
    lastAuditDay: 0,
  };
}

/** 每日累计：每笔新订单按区域税率计提流转税（商家代收，法理属税务局） */
export function accrueTax(state: GameState, _day: number, newOrders: Order[]): GameState {
  const rule = getTaxRule(state.player.currentRegion);
  if (rule.rate <= 0) return state; // 如 SEA 跨境小包豁免

  const collected = newOrders.reduce((sum, o) => sum + o.totalAmount * rule.rate, 0);
  if (collected <= 0) return state;

  return {
    ...state,
    tax: { ...state.tax, taxOwed: Math.round((state.tax.taxOwed + collected) * 100) / 100 },
  };
}

/** 申报缴纳：清零欠税、重置稽查风险 */
export function fileTax(state: GameState, day: number): GameState {
  return {
    ...state,
    player: { ...state.player, gold: Math.round((state.player.gold - state.tax.taxOwed) * 100) / 100 },
    tax: { ...state.tax, taxOwed: 0, lastFilingDay: day, auditRisk: 0 },
  };
}

/** 周期检查：到申报期未缴则累积稽查风险；达阈值触发稽查事件 */
export function checkAudit(state: GameState, day: number): { state: GameState; triggerAudit: boolean } {
  const rule = getTaxRule(state.player.currentRegion);
  const cycle = rule.filingCycleDays;
  if (day - state.tax.lastFilingDay < cycle) return { state, triggerAudit: false };
  if (state.tax.taxOwed <= 0) return { state, triggerAudit: false };

  const auditRisk = Math.min(1, state.tax.auditRisk + 0.25);
  const triggerAudit = auditRisk >= 0.5;
  return {
    state: { ...state, tax: { ...state.tax, auditRisk, lastAuditDay: triggerAudit ? day : state.tax.lastAuditDay } },
    triggerAudit,
  };
}

/** UK 玩家未持 VAT 证件时，稽查概率 ×3（与 L1 VAT 解锁描述联动） */
export function auditProbabilityMultiplier(state: GameState): number {
  if (state.player.currentRegion !== 'UK') return 1;
  return state.tax.vatRegistered ? 1 : 3;
}

export const taxProcessor: DayProcessor = (ctx) => {
  const state = accrueTax(ctx.state, ctx.day, ctx.newOrders);
  const { state: afterAudit } = checkAudit(state, ctx.day);
  return { ...ctx, state: afterAudit };
};
