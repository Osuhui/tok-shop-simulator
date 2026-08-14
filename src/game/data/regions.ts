// ============================================================
// 区域配置数据
// ============================================================
import type { RegionConfig } from '../types';

export const REGIONS: Record<string, RegionConfig> = {
  SEA: {
    id: 'SEA',
    name: 'Southeast Asia',
    nameCN: '东南亚 (印尼/泰国)',
    unlockRequirement: { shopLevel: 1, totalRevenue: 0 },
    customerPriceRange: [5, 15],
    logisticsSpeed: 3,
    paymentCycle: 4,
    codRejectRate: 0.15,
    returnRate: 0.04,
    complianceDifficulty: 2,
    hotCategories: ['fashion', 'snacks', 'accessories'],
    platformFeeRate: 0.05,
    dailyOrganicTraffic: 8,
    supportsCOD: true,
    requiresOverseasWarehouse: false,
    shippingRates: { perKg: 2.5, perCubic: 80 },
    overseasStorageFee: 0.03,
  },
  UK: {
    id: 'UK',
    name: 'United Kingdom',
    nameCN: '英国 (UK)',
    unlockRequirement: { shopLevel: 3, totalRevenue: 5000 },
    customerPriceRange: [25, 55],
    logisticsSpeed: 7,
    paymentCycle: 5,
    codRejectRate: 0.05,
    returnRate: 0.10,
    complianceDifficulty: 6,
    hotCategories: ['fashion', 'beauty', 'electronics'],
    platformFeeRate: 0.05,
    dailyOrganicTraffic: 6,
    supportsCOD: false,
    requiresOverseasWarehouse: false,
    shippingRates: { perKg: 2.0, perCubic: 60 },
    overseasStorageFee: 0.08,
  },
  US: {
    id: 'US',
    name: 'United States',
    nameCN: '北美 (US)',
    unlockRequirement: { shopLevel: 6, totalRevenue: 20000 },
    customerPriceRange: [35, 80],
    logisticsSpeed: 10,
    paymentCycle: 10,
    codRejectRate: 0.02,
    returnRate: 0.08,
    complianceDifficulty: 9,
    hotCategories: ['electronics', 'pets', 'toys'],
    platformFeeRate: 0.12,
    dailyOrganicTraffic: 6,
    supportsCOD: false,
    requiresOverseasWarehouse: true,
    shippingRates: { perKg: 8.0, perCubic: 250 },
    overseasStorageFee: 0.15,
  },
};

export function getRegionConfig(regionId: string): RegionConfig {
  const config = REGIONS[regionId];
  if (!config) throw new Error(`Unknown region: ${regionId}`);
  return config;
}
