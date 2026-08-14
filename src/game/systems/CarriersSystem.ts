// ============================================================
// 物流承运商系统：选择承运商、旺季运费波动、保险
// ============================================================
import type { GameState, CarrierId } from '../types';
import { CARRIERS, getCarrier, isPeakSeason } from '../data/carriers';

/** 选择承运商（须支持当前区域） */
export function selectCarrier(state: GameState, carrierId: CarrierId): { state: GameState; error?: string } {
  const carrier = CARRIERS[carrierId];
  if (!carrier.regions.includes(state.player.currentRegion)) {
    return { state, error: `${carrier.name} 不支持当前区域` };
  }
  return { state: { ...state, carrierId } };
}

/** 当前运费倍率（承运商倍率 × 旺季系数） */
export function shippingMultiplier(state: GameState, day: number): number {
  const base = getCarrier(state.carrierId).costMultiplier;
  return isPeakSeason(day) ? base * 1.5 : base;
}

/** 是否处于旺季爆仓 */
export function peakActive(day: number): boolean {
  return isPeakSeason(day);
}
