// ============================================================
// 店铺系统：升级判定与施加（纯函数，便于测试与扩展）
// ============================================================
import type { GameState, PlayerState } from '../types';
import { getLevelUpRequirement } from '../engine/formulas';

export interface LevelRequirement {
  revenueRequired: number;
  ordersRequired: number;
  goldCost: number;
}

export const MAX_SHOP_LEVEL = 10;

export function getUpgradeRequirement(shopLevel: number): LevelRequirement {
  return getLevelUpRequirement(shopLevel);
}

/** 是否满足升级条件（等级未满 + 营收/订单/金币达标） */
export function canUpgrade(player: PlayerState, req: LevelRequirement): boolean {
  return (
    player.shopLevel < MAX_SHOP_LEVEL &&
    player.totalRevenue >= req.revenueRequired &&
    player.totalOrdersCompleted >= req.ordersRequired &&
    player.gold >= req.goldCost
  );
}

/** 施加升级：等级 +1、扣除金币；条件不满足则原样返回（便于调用方判断是否有变化） */
export function applyUpgrade(state: GameState): GameState {
  const req = getUpgradeRequirement(state.player.shopLevel);
  if (!canUpgrade(state.player, req)) return state;

  const player: PlayerState = {
    ...state.player,
    shopLevel: state.player.shopLevel + 1,
    gold: Math.round((state.player.gold - req.goldCost) * 100) / 100,
  };
  return { ...state, player };
}
