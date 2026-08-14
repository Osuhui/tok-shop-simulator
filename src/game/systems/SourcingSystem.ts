// ============================================================
// 供应链选品系统
// ============================================================
import type { Product, RegionId, InventoryItem } from '../types';
import { calculatePurchaseCost } from '../engine/formulas';
import { getProductsByRegion } from '../data/products';

export const SourcingSystem = {
  /** 获取当前区域可用货盘（每7天刷新一次，在不同天显示不同子集） */
  getAvailableProducts(_allProducts: Product[], region: RegionId, day: number): Product[] {
    const regionProducts = getProductsByRegion(region);
    // 每7天轮换，用伪随机确保同一周期内一致
    const seed = Math.floor(day / 7);
    const shuffled = seededShuffle(regionProducts, seed);
    // 显示8-12个
    const count = 8 + (seed % 5);
    return shuffled.slice(0, count);
  },

  /** 采购商品 */
  purchase(
    product: Product,
    quantity: number,
    currentGold: number,
    warehouseType: 'self' | 'overseas',
    region: RegionId,
    currentDay: number,
  ): { success: boolean; cost: number; inventoryItem: InventoryItem; error?: string } {
    const cost = calculatePurchaseCost(product, quantity);

    if (cost > currentGold) {
      return { success: false, cost: 0, inventoryItem: null as any, error: '资金不足' };
    }

    if (quantity <= 0) {
      return { success: false, cost: 0, inventoryItem: null as any, error: '数量必须大于0' };
    }

    const arrivalDay = currentDay + (product.sourcingLeadTime[region] || 3);

    const inventoryItem: InventoryItem = {
      productId: product.id,
      quantity: 0, // 到货后才可用
      inboundQuantity: quantity,
      warehouseType,
      storageFeePerDay: warehouseType === 'overseas' ? 0.05 : 0,
      arrivalDay,
      isListed: false, // 新采购到货后需主动上架才能接收自然流量
    };

    return { success: true, cost, inventoryItem };
  },

  /** 在途库存到货 */
  processArrivals(inventory: InventoryItem[], currentDay: number): InventoryItem[] {
    return inventory.map(item => {
      if (item.arrivalDay && item.arrivalDay <= currentDay && item.inboundQuantity > 0) {
        return {
          ...item,
          quantity: item.quantity + item.inboundQuantity,
          inboundQuantity: 0,
          arrivalDay: undefined,
        };
      }
      return item;
    });
  },
};

/** 带种子的洗牌（确保同一seed产生相同结果） */
function seededShuffle<T>(array: T[], seed: number): T[] {
  const shuffled = [...array];
  let s = seed;
  for (let i = shuffled.length - 1; i > 0; i--) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    const j = s % (i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
