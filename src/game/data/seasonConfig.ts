// ============================================================
// 选品趋势 / 季节配置
// ============================================================
import type { ProductCategory } from '../types';

export interface SeasonConfig {
  index: number;
  name: string;
  hotCategories: ProductCategory[];
  demandMultiplier: number; // 整体需求系数
}

// 每 30 天一个季节，循环
export const SEASONS: SeasonConfig[] = [
  { index: 0, name: '春季', hotCategories: ['fashion', 'beauty', 'sports'], demandMultiplier: 1.0 },
  { index: 1, name: '夏季', hotCategories: ['accessories', 'beauty', 'snacks'], demandMultiplier: 1.1 },
  { index: 2, name: '秋季', hotCategories: ['home', 'electronics', 'toys'], demandMultiplier: 1.0 },
  { index: 3, name: '冬季', hotCategories: ['home', 'pets', 'toys'], demandMultiplier: 1.15 },
];

export function seasonForDay(day: number): SeasonConfig {
  if (day <= 0) return SEASONS[0];
  return SEASONS[Math.floor(day / 30) % SEASONS.length];
}
