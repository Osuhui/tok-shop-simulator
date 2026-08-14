// ============================================================
// 选品趋势 / 季节演化：更新季节与热门品类，季节影响整体需求
// ============================================================
import type { GameState, ProductCategory } from '../types';
import { SEASONS, seasonForDay } from '../data/seasonConfig';
import type { DayProcessor } from '../engine/DayProcessor';

/** 季节对自然流量的整体需求系数 */
export function seasonalDemandMultiplier(state: GameState): number {
  return seasonForDay(state.player.day).demandMultiplier;
}

/** 当季热门品类（每 14 天轮换加入一点随机性由调用方决定） */
export function currentHotCategories(day: number): ProductCategory[] {
  const season = seasonForDay(day);
  return season.hotCategories;
}

export const sourcingProcessor: DayProcessor = (ctx) => {
  const season = seasonForDay(ctx.day);
  const hotCategories = currentHotCategories(ctx.day);

  // 季节切换或热门品类变化时更新
  if (ctx.state.season === season.index && sameCategories(ctx.state.hotCategories, hotCategories)) {
    return ctx;
  }

  return {
    ...ctx,
    state: {
      ...ctx.state,
      season: season.index,
      hotCategories,
    },
  };
};

function sameCategories(a: ProductCategory[], b: ProductCategory[]): boolean {
  if (a.length !== b.length) return false;
  const set = new Set(a);
  return b.every((c) => set.has(c));
}

export { SEASONS };
