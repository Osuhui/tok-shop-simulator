// ============================================================
// 达人建联系统
// ============================================================
import type { Influencer, Product, Order, GameState, PlayerState } from '../types';
import { calculateAffiliateSuccessRate, calculateAffiliateOrderVolume } from '../engine/formulas';
import { getRegionConfig } from '../data/regions';

export interface AffiliateResult {
  success: boolean;
  probability: number;
  ordersGenerated: Order[];
  message: string;
}

export const AffiliateSystem = {
  /** 发起达人合作 */
  initiateCooperation(
    influencer: Influencer,
    product: Product,
    commissionOffered: number,
    state: GameState,
  ): AffiliateResult {
    const probability = calculateAffiliateSuccessRate(
      influencer,
      commissionOffered,
      product.tags,
      state.player.healthScore,
    );

    const roll = Math.random();
    const success = roll < probability;

    if (!success) {
      // 失败：达人进入冷却
      return {
        success: false,
        probability,
        ordersGenerated: [],
        message: `合作失败！（成功率 ${(probability * 100).toFixed(1)}%，实际roll: ${(roll * 100).toFixed(1)}%）${influencer.name} 拒绝了您的邀约，进入14天冷却期。`,
      };
    }

    // 成功：生成订单
    const region = getRegionConfig(state.player.currentRegion);
    const rawVolume = calculateAffiliateOrderVolume(influencer, commissionOffered, region);
    // 履约上限：大达人不会向无法履约的小店倾倒订单（店铺等级 = 履约/信任能力）
    const orderVolume = Math.min(rawVolume, state.player.shopLevel * 100);
    const unitPrice = product.basePrice * (0.9 + Math.random() * 0.2); // 实际售价有浮动

    const orders: Order[] = [];
    const batchSize = Math.min(orderVolume, 200); // 分批生成，每批最多200
    const batches = Math.ceil(orderVolume / batchSize);

    for (let b = 0; b < batches; b++) {
      const qty = Math.min(batchSize, orderVolume - b * batchSize);
      const totalAmount = Math.round(unitPrice * qty * 100) / 100;

      const order: Order = {
        orderId: `ORD-${state.player.day}-${b}`,
        productId: product.id,
        productName: product.name,
        quantity: qty,
        unitPrice: Math.round(unitPrice * 100) / 100,
        totalAmount,
        shippingCost: 0, // 发货时计算
        platformFeeRate: region.platformFeeRate,
        status: 'pending',
        shippingType: region.requiresOverseasWarehouse ? 'overseas' : 'self',
        region: state.player.currentRegion,
        createdAt: state.player.day,
        deadline: state.player.day + 2, // 48小时发货
        influencerId: influencer.id,
        influencerCommission: commissionOffered,
        isCOD: region.supportsCOD,
        expectedPaymentDay: state.player.day + region.paymentCycle + region.logisticsSpeed,
      };

      orders.push(order);
    }

    return {
      success: true,
      probability,
      ordersGenerated: orders,
      message: `合作成功！${influencer.name} 为您带来了 ${orderVolume} 单订单！请尽快发货。`,
    };
  },

  /** 计算展示用的预估数据 */
  getEstimation(
    influencer: Influencer,
    product: Product,
    commissionOffered: number,
    player: PlayerState,
  ): {
    successRate: number;
    estimatedOrders: number;
    estimatedRevenue: number;
    commissionCost: number;
  } {
    const successRate = calculateAffiliateSuccessRate(
      influencer,
      commissionOffered,
      product.tags,
      player.healthScore,
    );

    const region = getRegionConfig(player.currentRegion);
    // 与 initiateCooperation 一致：预估单量同样受店铺等级履约上限约束
    const estimatedOrders = Math.min(
      calculateAffiliateOrderVolume(influencer, commissionOffered, region),
      player.shopLevel * 100,
    );
    const avgPrice = product.basePrice;
    const estimatedRevenue = avgPrice * estimatedOrders;
    const commissionCost = estimatedRevenue * commissionOffered;

    return {
      successRate,
      estimatedOrders,
      estimatedRevenue: Math.round(estimatedRevenue * 100) / 100,
      commissionCost: Math.round(commissionCost * 100) / 100,
    };
  },
};
