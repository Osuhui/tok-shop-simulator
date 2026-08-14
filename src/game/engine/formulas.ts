// ============================================================
// 核心计算公式
// ============================================================
import type { Product, Influencer, RegionConfig, RegionId } from '../types';
import { getRegionConfig } from '../data/regions';

// ============================================================
// 达人合作成功率
// ============================================================

/**
 * P_success = BaseWill × (1 + (V_player - V_expected) / 20) × MatchScore × (1 - F_risk)
 */
export function calculateAffiliateSuccessRate(
  influencer: Influencer,
  commissionOffered: number, // 玩家出价佣金比例 (0.0-1.0)
  productTags: string[],
  shopHealthScore: number,
): number {
  const baseWill = influencer.baseWillingness;
  const commissionBonus = 1 + (commissionOffered - influencer.baseCommission) / 0.20;
  const matchScore = calculateMatchScore(productTags, influencer.categoryTags);
  const riskPenalty = shopHealthScore < 3.0 ? 0.3 : 0;

  let probability = baseWill * commissionBonus * matchScore * (1 - riskPenalty);

  // 限制在 0.01 - 0.99 范围内
  return Math.max(0.01, Math.min(0.99, probability));
}

/**
 * 计算商品标签与达人标签的匹配度
 */
export function calculateMatchScore(productTags: string[], influencerTags: string[]): number {
  if (productTags.length === 0 || influencerTags.length === 0) return 0.5;

  const matchedCount = productTags.filter(t => influencerTags.includes(t)).length;
  const ratio = matchedCount / Math.max(productTags.length, influencerTags.length);

  // 映射到 0.3 - 1.5
  return 0.3 + ratio * 1.2;
}

// ============================================================
// 达人带货订单量
// ============================================================

/**
 * OrderQty = BaseOrder × ConversionRate × (1 + (V_player - V_expected) × 2)
 */
export function calculateAffiliateOrderVolume(
  influencer: Influencer,
  commissionOffered: number,
  _region: RegionConfig,
): number {
  const baseOrder = influencer.baseOrderVolume;
  const conversionRate = influencer.recentPerformance * getRegionPriceMatch(influencer.region);
  const commissionMultiplier = 1 + (commissionOffered - influencer.baseCommission) * 2;

  return Math.round(baseOrder * conversionRate * Math.max(0.5, commissionMultiplier));
}

function getRegionPriceMatch(region: RegionId): number {
  switch (region) {
    case 'SEA': return 1.2; // 低客单价易转化
    case 'UK': return 0.9;
    case 'US': return 0.8;  // 高客单价难转化
  }
}

// ============================================================
// 采购成本
// ============================================================

export function calculatePurchaseCost(product: Product, quantity: number): number {
  let unitCost = product.cost;
  if (quantity >= 500) unitCost *= 0.8;
  else if (quantity >= 100) unitCost *= 0.9;
  return Math.round(unitCost * quantity * 100) / 100;
}

// ============================================================
// 建议售价
// ============================================================

export function calculateSellPrice(
  product: Product,
  regionId: RegionId,
  healthScore: number,
): number {
  const region = getRegionConfig(regionId);
  let price = Math.max(product.basePrice, region.customerPriceRange[0]);
  price = Math.min(price, region.customerPriceRange[1]);
  if (healthScore >= 4.5) price *= 1.1;
  return Math.round(price * 100) / 100;
}

// ============================================================
// 运费
// ============================================================

export function calculateShippingCost(
  product: { volume: number; weight: number },
  quantity: number,
  regionId: RegionId,
): number {
  const region = getRegionConfig(regionId);
  const totalWeight = product.weight * quantity;
  const totalVolume = product.volume * quantity;

  const byWeight = totalWeight * region.shippingRates.perKg;
  const byVolume = totalVolume * region.shippingRates.perCubic;

  return Math.round(Math.max(byWeight, byVolume, 5.99) * 100) / 100;
}

// ============================================================
// 平台佣金
// ============================================================

export function calculatePlatformFee(orderAmount: number, regionId: RegionId): number {
  const region = getRegionConfig(regionId);
  return Math.round(orderAmount * region.platformFeeRate * 100) / 100;
}

// ============================================================
// 每日固定运营成本
// ============================================================

export function calculateDailyOperatingCost(shopLevel: number): number {
  return Math.max(4, 12 - shopLevel);
}

// ============================================================
// 海外仓仓储费
// ============================================================

export function calculateStorageFee(
  quantity: number,
  regionId: RegionId,
  daysStored: number,
): number {
  const region = getRegionConfig(regionId);
  let rate = region.overseasStorageFee;
  // 超过30天翻倍
  if (daysStored > 30) rate *= 2;
  return Math.round(quantity * rate * daysStored * 100) / 100;
}

// ============================================================
// 店铺等级升级所需
// ============================================================

export function getLevelUpRequirement(currentLevel: number): {
  revenueRequired: number;
  ordersRequired: number;
  goldCost: number;
} {
  return {
    revenueRequired: currentLevel * 3000,
    ordersRequired: currentLevel * 50,
    goldCost: currentLevel * 300,
  };
}
