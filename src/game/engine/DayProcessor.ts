// ============================================================
// 每日处理器注册表：把 advanceOneDay 的"上帝函数"拆为可插拔纯函数
// 新增业务系统（税务 / 办证 / 竞争 / 员工 ...）只需 push 一个 DayProcessor，
// 完全不动核心推进逻辑，便于扩展与维护。
// ============================================================
import type { GameState, Order } from '../types';
import type { DailyFinanceReport } from '../systems/FinanceSystem';
import { SourcingSystem } from '../systems/SourcingSystem';
import { LogisticsSystem } from '../systems/LogisticsSystem';
import { FinanceSystem } from '../systems/FinanceSystem';
import { advanceCertificatesProcessor } from '../systems/TaskSystem';
import { taxProcessor } from '../systems/TaxSystem';
import { competitionProcessor } from '../systems/CompetitionSystem';
import { reputationProcessor } from '../systems/ReputationSystem';
import { employeeProcessor } from '../systems/EmployeeSystem';
import { marketingProcessor } from '../systems/MarketingSystem';
import { loanProcessor } from '../systems/LoanSystem';
import { sourcingProcessor } from '../systems/SourcingTrendSystem';

/** 单日推进过程中累积 / 传递的状态 */
export interface DayContext {
  state: GameState;
  day: number;
  newOrders: Order[];
  report: DailyFinanceReport | null;
  paymentReceived: number;
  overduePenalty: number;
  overdueCount: number;
  todayRevenue: number;
  todayExpenses: number;
  todayOrdersCount: number;
}

/** 每日处理器：接收并传播 DayContext 的纯函数 */
export type DayProcessor = (ctx: DayContext, day: number) => DayContext;

const arrivalsProcessor: DayProcessor = (ctx) => ({
  ...ctx,
  state: { ...ctx.state, inventory: SourcingSystem.processArrivals(ctx.state.inventory, ctx.day) },
});

const orderStatusProcessor: DayProcessor = (ctx) => ({
  ...ctx,
  state: {
    ...ctx.state,
    orders: ctx.state.orders.map((o) => {
      if (o.status === 'shipped') return { ...o, status: 'inTransit' as const };
      if (o.status === 'inTransit' && ctx.day >= o.expectedPaymentDay - 7)
        return { ...o, status: 'delivered' as const };
      return o;
    }),
  },
});

const overdueProcessor: DayProcessor = (ctx) => {
  const { overdueOrders, totalPenalty } = LogisticsSystem.checkOverdueOrders(ctx.state.orders, ctx.day);
  const orders = ctx.state.orders.map((o) =>
    o.status === 'pending' && ctx.day > o.deadline ? { ...o, status: 'cancelled' as const } : o,
  );
  return { ...ctx, state: { ...ctx.state, orders }, overduePenalty: totalPenalty, overdueCount: overdueOrders.length };
};

const financeProcessor: DayProcessor = (ctx) => {
  const { report, paymentReceived } = FinanceSystem.dailySettle(ctx.state, ctx.state.orders, ctx.state.inventory, ctx.day);
  return { ...ctx, report, paymentReceived };
};

const organicProcessor: DayProcessor = (ctx) => ({
  ...ctx,
  newOrders: FinanceSystem.generateOrganicOrders(
    // 与原始 advanceOneDay 一致：传入的临时 state 中 player.day 已为新的一天
    { ...ctx.state, player: { ...ctx.state.player, day: ctx.day } },
    ctx.day,
  ),
});

const inventoryDeductionProcessor: DayProcessor = (ctx) => {
  let inventory = [...ctx.state.inventory];
  for (const orgOrder of ctx.newOrders) {
    inventory = inventory.map((item) =>
      item.productId === orgOrder.productId
        ? { ...item, quantity: Math.max(0, item.quantity - orgOrder.quantity) }
        : item,
    );
  }
  return { ...ctx, state: { ...ctx.state, inventory } };
};

const influencerCooldownProcessor: DayProcessor = (ctx) => ({
  ...ctx,
  state: {
    ...ctx.state,
    influencers: ctx.state.influencers.map((inf) => {
      if (inf.status === 'coolingDown' && inf.cooldownRemaining > 0) {
        const newCool = inf.cooldownRemaining - 1;
        return {
          ...inf,
          cooldownRemaining: newCool,
          status: newCool <= 0 ? ('available' as const) : ('coolingDown' as const),
        };
      }
      return inf;
    }),
  },
});

const playerUpdateProcessor: DayProcessor = (ctx) => {
  const p = ctx.state.player;
  const operatingCost = ctx.report?.expenses.operatingCost ?? 0;
  const storageFees = ctx.report?.expenses.storageFees ?? 0;
  const platformFees = ctx.report?.expenses.platformFees ?? 0;
  const influencerCommissions = ctx.report?.expenses.influencerCommissions ?? 0;
  const player = {
    ...p,
    day: ctx.day,
    gold: Math.round(
      (p.gold + ctx.paymentReceived - platformFees - influencerCommissions - operatingCost - storageFees - ctx.overduePenalty) * 100,
    ) / 100,
    healthScore: clamp(p.healthScore - ctx.overdueCount * 0.2, 0, 5),
    totalRevenue: p.totalRevenue + (ctx.report?.revenue.orderPayments ?? 0),
    totalFines: p.totalFines + ctx.overduePenalty,
    reputation: clamp(p.reputation + (ctx.overdueCount > 0 ? -5 : 1), 0, 100),
    totalOrdersCompleted: ctx.state.orders.filter((o) => o.paid).length,
  };
  const todayExpenses = ctx.report ? Object.values(ctx.report.expenses).reduce((a, b) => a + b, 0) : 0;
  return {
    ...ctx,
    state: { ...ctx.state, player },
    todayRevenue: ctx.report?.revenue.orderPayments ?? 0,
    todayExpenses,
    todayOrdersCount: ctx.newOrders.length,
  };
};

const settleOrdersProcessor: DayProcessor = (ctx) => ({
  ...ctx,
  state: {
    ...ctx.state,
    orders: ctx.state.orders.map((o) =>
      o.status === 'delivered' && o.expectedPaymentDay <= ctx.day && !o.paid
        ? { ...o, paid: true }
        : o,
    ),
  },
});

/** 注册表：后续内容 Sprint 只需 push 新的 processor 即可扩展每日逻辑 */
export const DAY_PROCESSORS: DayProcessor[] = [
  arrivalsProcessor,
  orderStatusProcessor,
  overdueProcessor,
  financeProcessor,
  settleOrdersProcessor,
  organicProcessor,
  inventoryDeductionProcessor,
  influencerCooldownProcessor,
  playerUpdateProcessor,
  competitionProcessor,
  taxProcessor,
  reputationProcessor,
  employeeProcessor,
  marketingProcessor,
  sourcingProcessor,
  loanProcessor,
  advanceCertificatesProcessor,
];

/** 运行一整天，返回推进后的 DayContext（state 已含当日全部变更，newOrders 尚未并入 orders） */
export function runDay(state: GameState, day: number): DayContext {
  const ctx: DayContext = {
    state,
    day,
    newOrders: [],
    report: null,
    paymentReceived: 0,
    overduePenalty: 0,
    overdueCount: 0,
    todayRevenue: 0,
    todayExpenses: 0,
    todayOrdersCount: 0,
  };
  return DAY_PROCESSORS.reduce((c, p) => p(c, day), ctx);
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}
