// ============================================================
// 难度配置（只调节开业严格度与全局松紧，不删减内容）
// ============================================================
import type { DifficultyConfig } from '../types';

const ALL_L0 = ['SELLER_VERIFY', 'BUSINESS_LICENSE', 'RECEIVING_ACCOUNT', 'CUSTOMS_REG'] as const;

export const DIFFICULTIES: Record<string, DifficultyConfig> = {
  easy: {
    id: 'easy',
    blockOpening: false,
    requiredBeforeOpening: [],
    gracePeriodDays: 14,
    startGoldMultiplier: 1.3,
    penaltyMultiplier: 0.7,
  },
  normal: {
    id: 'normal',
    blockOpening: false,
    requiredBeforeOpening: ['SELLER_VERIFY', 'RECEIVING_ACCOUNT'],
    gracePeriodDays: 7,
    startGoldMultiplier: 1.0,
    penaltyMultiplier: 1.0,
  },
  hard: {
    id: 'hard',
    blockOpening: true,
    requiredBeforeOpening: [...ALL_L0],
    gracePeriodDays: 0,
    startGoldMultiplier: 0.8,
    penaltyMultiplier: 1.3,
  },
};
