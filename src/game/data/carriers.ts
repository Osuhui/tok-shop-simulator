// ============================================================
// 物流承运商配置
// ============================================================
import type { Carrier, CarrierId } from '../types';

export const CARRIERS: Record<CarrierId, Carrier> = {
  rabbit: {
    id: 'rabbit',
    name: '兔子速递',
    speedDays: 2,
    costMultiplier: 1.0,
    reliability: 0.9,
    regions: ['SEA', 'UK', 'US'],
  },
  eagle: {
    id: 'eagle',
    name: '飞鹰物流',
    speedDays: 1,
    costMultiplier: 1.4,
    reliability: 0.97,
    regions: ['SEA', 'UK', 'US'],
  },
  whale: {
    id: 'whale',
    name: '鲸鱼海运',
    speedDays: 7,
    costMultiplier: 0.7,
    reliability: 0.8,
    regions: ['UK', 'US'],
  },
};

export function getCarrier(id: CarrierId): Carrier {
  return CARRIERS[id];
}

/** 旺季爆仓窗口（节假日）：每 90 天中的后 10 天 */
export function isPeakSeason(day: number): boolean {
  return day > 0 && day % 90 >= 80;
}
