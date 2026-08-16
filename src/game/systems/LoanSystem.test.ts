import { describe, it, expect } from 'vitest';
import { runDay } from '../engine/DayProcessor';
import { createTestState } from '../testFixtures';
import type { Loan } from '../types';

const overdueLoan = (overrides: Partial<Loan> = {}): Loan => ({
  id: 'L1', type: 'payday', principal: 5000, repayAmount: 6500, dueDay: 10, takenDay: 0,
  ...overrides,
});

describe('loanProcessor 难度接线（宽限 + 罚息倍率）', () => {
  it('easy：宽限 14 天内逾期不罚息', () => {
    const s = createTestState({ difficultyId: 'easy', loans: [overdueLoan()] });
    const ctx = runDay(s, 12); // dueDay + 2，仍在宽限内
    expect(ctx.state.loans[0].repayAmount).toBe(6500);
  });

  it('easy：宽限过后才罚息，且倍率 0.7', () => {
    const s = createTestState({ difficultyId: 'easy', loans: [overdueLoan()] });
    const ctx = runDay(s, 25); // dueDay + 15，超出宽限
    // 5000 × 3% × 0.7 = 105
    expect(ctx.state.loans[0].repayAmount).toBe(6500 + 105);
    expect(ctx.state.player.gold).toBeLessThan(s.player.gold);
  });

  it('normal：宽限 7 天，宽限后日罚息 = 本金 3% × 1.0', () => {
    const s = createTestState({ difficultyId: 'normal', loans: [overdueLoan()] });
    const ctx = runDay(s, 18); // dueDay + 8
    expect(ctx.state.loans[0].repayAmount).toBe(6500 + 150);
  });

  it('hard：0 宽限，宽限后日罚息 = 本金 3% × 1.3', () => {
    const s = createTestState({ difficultyId: 'hard', loans: [overdueLoan()] });
    const ctx = runDay(s, 11); // dueDay + 1
    expect(ctx.state.loans[0].repayAmount).toBe(6500 + 195);
  });

  it('罚息封顶为本金 150%，到顶后债务冻结不再增长', () => {
    const s = createTestState({ difficultyId: 'hard', loans: [overdueLoan({ repayAmount: 7500 })] });
    const ctx = runDay(s, 11);
    expect(ctx.state.loans[0].repayAmount).toBe(7500);
  });
});
