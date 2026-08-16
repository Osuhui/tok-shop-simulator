// ============================================================
// 财务结算系统
// ============================================================
import type { GameState, Order, InventoryItem } from '../types';
import { calculatePlatformFee, calculateDailyOperatingCost } from '../engine/formulas';
import { getRegionConfig } from '../data/regions';
import { getProduct } from '../data/products';
import { seasonForDay } from '../data/seasonConfig';
import { isShopOpen } from './OpeningSystem';

export interface DailyFinanceReport {
  day: number;
  /** 收入明细 */
  revenue: {
    orderPayments: number;    // 已签收订单回款
    refunds: number;          // 退款
    other: number;            // 其他收入
  };
  /** 支出明细 */
  expenses: {
    platformFees: number;     // 平台佣金
    influencerCommissions: number; // 达人佣金
    shippingCosts: number;    // 物流运费
    storageFees: number;      // 海外仓仓储费
    operatingCost: number;    // 固定运营成本
    fines: number;            // 罚款
    sourcingCost: number;     // 采购成本
  };
  netProfit: number;
}

export const FinanceSystem = {
  /** 每日结算 */
  dailySettle(
    state: GameState,
    orders: Order[],
    inventory: InventoryItem[],
    day: number,
  ): { report: DailyFinanceReport; paymentReceived: number } {
    const region = getRegionConfig(state.player.currentRegion);

    // --- 收入 ---
    // 已签收订单回款
    const settledOrders = orders.filter(
      o => o.status === 'delivered' && o.expectedPaymentDay <= day && !o.paid
    );
    const orderPayments = settledOrders.reduce((sum, o) => sum + o.totalAmount, 0);

    // 退款 (UK高退货率，客服可降低)
    const csCount = state.employees.filter((e) => e.role === 'cs').length;
    const refundRate = region.returnRate * Math.max(0.8, 1 - 0.03 * csCount);
    const refunds = settledOrders.reduce((sum, o) => {
      if (Math.random() < refundRate) {
        return sum + o.totalAmount;
      }
      return sum;
    }, 0);

    // --- 支出 ---
    const platformFees = settledOrders.reduce(
      (sum, o) => sum + calculatePlatformFee(o.totalAmount, o.region), 0
    );

    const influencerCommissions = settledOrders
      .filter(o => o.influencerId && o.influencerCommission)
      .reduce((sum, o) => sum + o.totalAmount * (o.influencerCommission || 0), 0);

    const shippingCosts = settledOrders
      .filter(o => o.status === 'delivered')
      .reduce((sum, o) => sum + o.shippingCost, 0);

    const storageFees = inventory
      .filter(i => i.warehouseType === 'overseas' && i.quantity > 0)
      .reduce((sum, i) => sum + i.quantity * (i.storageFeePerDay || 0.05), 0);

    const operatingCost = calculateDailyOperatingCost(state.player.shopLevel);
    const sourcingCost = settledOrders.reduce((sum, o) => sum + (getProduct(o.productId)?.cost || 0) * o.quantity, 0);

    const totalRevenue = orderPayments - refunds;
    const totalExpenses = platformFees + influencerCommissions + shippingCosts + storageFees + operatingCost + sourcingCost;
    const netProfit = Math.round((totalRevenue - totalExpenses) * 100) / 100;

    return {
      report: {
        day,
        revenue: {
          orderPayments: Math.round(orderPayments * 100) / 100,
          refunds: Math.round(refunds * 100) / 100,
          other: 0,
        },
        expenses: {
          platformFees: Math.round(platformFees * 100) / 100,
          influencerCommissions: Math.round(influencerCommissions * 100) / 100,
          shippingCosts: Math.round(shippingCosts * 100) / 100,
          storageFees: Math.round(storageFees * 100) / 100,
          operatingCost: Math.round(operatingCost * 100) / 100,
          fines: 0,
          sourcingCost: Math.round(sourcingCost * 100) / 100,
        },
        netProfit,
      },
      paymentReceived: Math.round((orderPayments - refunds) * 100) / 100,
    };
  },

  /** 自然流量生成订单 */
  generateOrganicOrders(state: GameState, day: number): Order[] {
    // 开业封锁：未办齐开业证件的店铺不产生自然流量（达人订单在 store 层同样被 gate）
    if (!isShopOpen(state)) return [];
    const region = getRegionConfig(state.player.currentRegion);
    const pressure = state.competitionPressure ?? 1;
    const opsBoost = 1 + 0.25 * state.employees.filter((e) => e.role === 'ops').length + 0.2 * state.campaigns.filter((c) => c.type === 'seo').length;
    // 店铺等级增益：高等级带来品牌势能，自然流量随等级提升（让"升级"成为正向投资而非现金黑洞）
    const levelBoost = 1 + 0.06 * (state.player.shopLevel - 1);
    const traffic = Math.floor(
      (region.dailyOrganicTraffic + Math.floor(state.player.reputation / 20)) *
        pressure *
        opsBoost *
        seasonForDay(state.player.day).demandMultiplier *
        levelBoost,
    );

    const orders: Order[] = [];
    const availableProducts = state.inventory.filter(i => i.quantity > 0 && (i.isListed ?? false));

    if (availableProducts.length === 0) return [];

    for (let i = 0; i < traffic; i++) {
      const invItem = availableProducts[Math.floor(Math.random() * availableProducts.length)];
      const qty = 1 + Math.floor(Math.random() * 3);

      // 限制不超过库存
      const actualQty = Math.min(qty, invItem.quantity);
      if (actualQty <= 0) continue;

      const unitPrice = invItem.warehouseType === 'overseas'
        ? region.customerPriceRange[1] * (0.8 + Math.random() * 0.2)
        : region.customerPriceRange[0] + Math.random() * (region.customerPriceRange[1] - region.customerPriceRange[0]);

      const totalAmount = Math.round(unitPrice * actualQty * 100) / 100;
      const isCOD = region.supportsCOD && Math.random() < region.codRejectRate;

      orders.push({
        orderId: `ORG-${day}-${i}`,
        productId: invItem.productId,
        productName: invItem.productId, // 简化为productId
        quantity: actualQty,
        unitPrice: Math.round(unitPrice * 100) / 100,
        totalAmount,
        shippingCost: 0,
        platformFeeRate: region.platformFeeRate,
        status: 'pending',
        shippingType: region.requiresOverseasWarehouse ? 'overseas' : 'self',
        region: state.player.currentRegion,
        createdAt: day,
        deadline: day + 2,
        isCOD,
        expectedPaymentDay: day + region.paymentCycle + region.logisticsSpeed,
      });
    }

    return orders;
  },
};
