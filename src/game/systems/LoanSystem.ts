// ============================================================
// 贷款与现金流（扩展 FinanceSystem）
// ============================================================
import type { GameState, Loan, LoanType } from '../types';
import type { DayProcessor } from '../engine/DayProcessor';

interface LoanProduct {
  type: LoanType;
  name: string;
  principal: number;
  repayMultiplier: number; // 还款 = 本金 × 倍率
  dueInDays: number;
  minShopLevel: number;
  desc: string;
}

export const LOAN_PRODUCTS: Record<LoanType, LoanProduct> = {
  payday: {
    type: 'payday',
    name: '极速贷',
    principal: 5000,
    repayMultiplier: 1.3,
    dueInDays: 30,
    minShopLevel: 1,
    desc: '高利贷，30 天还本息 130%，逾期重罚',
  },
  bank: {
    type: 'bank',
    name: '银行经营贷',
    principal: 10000,
    repayMultiplier: 1.1,
    dueInDays: 60,
    minShopLevel: 5,
    desc: '低息需店铺 Lv.5，审核门槛高',
  },
};

let loanSeq = 0;
export function takeLoan(state: GameState, type: LoanType, day: number): { state: GameState; error?: string } {
  const prod = LOAN_PRODUCTS[type];
  if (state.player.shopLevel < prod.minShopLevel) {
    return { state, error: `需店铺等级达到 Lv.${prod.minShopLevel}` };
  }
  if (state.player.gold < 0 && type === 'bank') {
    return { state, error: '银行审核未通过' };
  }
  const loan: Loan = {
    id: `loan-${day}-${loanSeq++}`,
    type,
    principal: prod.principal,
    repayAmount: Math.round(prod.principal * prod.repayMultiplier),
    dueDay: day + prod.dueInDays,
    takenDay: day,
  };
  return {
    state: {
      ...state,
      loans: [...state.loans, loan],
      player: { ...state.player, gold: state.player.gold + prod.principal },
    },
  };
}

export function repayLoan(state: GameState, loanId: string): { state: GameState; error?: string } {
  const loan = state.loans.find((l) => l.id === loanId);
  if (!loan) return { state, error: '贷款不存在' };
  if (state.player.gold < loan.repayAmount) return { state, error: '资金不足' };
  return {
    state: {
      ...state,
      loans: state.loans.filter((l) => l.id !== loanId),
      player: { ...state.player, gold: Math.round((state.player.gold - loan.repayAmount) * 100) / 100 },
    },
  };
}

/** 每日检查：逾期贷款产生罚息并扣健康分（罚息封顶为本金 150%，到顶后冻结，避免复利死亡螺旋） */
export const loanProcessor: DayProcessor = (ctx) => {
  const overdue = ctx.state.loans.filter((l) => ctx.day > l.dueDay);
  if (overdue.length === 0) return ctx;
  let state = ctx.state;
  for (const loan of overdue) {
    const cap = Math.round(loan.principal * 1.5);
    const penalty =
      loan.repayAmount >= cap
        ? 0 // 已到封顶：债务冻结，仅健康分持续下滑
        : Math.min(Math.round(loan.principal * 0.03), cap - loan.repayAmount);
    state = {
      ...state,
      loans: state.loans.map((l) =>
        l.id === loan.id ? { ...l, repayAmount: Math.min(l.repayAmount + penalty, cap) } : l,
      ),
      player: {
        ...state.player,
        gold: Math.round((state.player.gold - penalty) * 100) / 100,
        healthScore: Math.max(0, state.player.healthScore - 0.3),
      },
    };
  }
  return { ...ctx, state };
};
