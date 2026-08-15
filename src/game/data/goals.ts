// ============================================================
// 经营目标（按难度配置）——玩家一眼可见的"通关条件"
// ============================================================
import type { DifficultyId, GameGoal } from '../types';

export const GOALS: Record<DifficultyId, GameGoal> = {
  easy: {
    day: 365,
    shopLevel: 6,
    netWorth: 10000,
    label: '稳健经营：第 365 天前做到 Lv.6、净资产 $10,000',
  },
  normal: {
    day: 365,
    shopLevel: 8,
    netWorth: 35000,
    label: '规模扩张：第 365 天前做到 Lv.8、净资产 $35,000',
  },
  hard: {
    day: 330,
    shopLevel: 9,
    netWorth: 55000,
    label: '跨境巨头：第 330 天前做到 Lv.9、净资产 $55,000',
  },
};
