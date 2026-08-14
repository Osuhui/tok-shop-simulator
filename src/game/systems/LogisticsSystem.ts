// ============================================================
// 物流履约系统
// ============================================================
import type { Order, InventoryItem, RegionId } from '../types';
import { calculateShippingCost } from '../engine/formulas';
import { getProduct } from '../data/products';

export interface ShippingResult {
  success: boolean;
  shippingCost: number;
  error?: string;
}

export const LogisticsSystem = {
  /** 发货 */
  shipOrder(
    order: Order,
    inventory: InventoryItem[],
    currentDay: number,
  ): { result: ShippingResult; updatedInventory: InventoryItem[] } {
    // 检查是否超时
    if (currentDay > order.deadline) {
      return {
        result: {
          success: false,
          shippingCost: 0,
          error: `订单 ${order.orderId} 已超过发货截止时间（Day ${order.deadline}）`,
        },
        updatedInventory: inventory,
      };
    }

    // 查找库存
    const invItem = inventory.find(i => i.productId === order.productId);
    if (!invItem || invItem.quantity < order.quantity) {
      return {
        result: {
          success: false,
          shippingCost: 0,
          error: `库存不足：需要 ${order.quantity} 件，当前库存 ${invItem?.quantity || 0} 件`,
        },
        updatedInventory: inventory,
      };
    }

    // 海外仓发货：自动秒发，运费更低
    if (invItem.warehouseType === 'overseas') {
      const product = getProduct(order.productId);
      if (!product) {
        return { result: { success: false, shippingCost: 0, error: '商品不存在' }, updatedInventory: inventory };
      }

      const shippingCost = calculateShippingCost(product, order.quantity, order.region);
      const updatedInventory = inventory.map(i =>
        i.productId === order.productId
          ? { ...i, quantity: i.quantity - order.quantity }
          : i
      );

      return {
        result: { success: true, shippingCost },
        updatedInventory,
      };
    }

    // 自发货
    const product = getProduct(order.productId);
    if (!product) {
      return { result: { success: false, shippingCost: 0, error: '商品不存在' }, updatedInventory: inventory };
    }

    const shippingCost = calculateShippingCost(product, order.quantity, order.region);
    const updatedInventory = inventory.map(i =>
      i.productId === order.productId
        ? { ...i, quantity: i.quantity - order.quantity }
        : i
    );

    return {
      result: { success: true, shippingCost },
      updatedInventory,
    };
  },

  /** 检查超时订单并计算罚款 */
  checkOverdueOrders(orders: Order[], currentDay: number): { overdueOrders: Order[]; totalPenalty: number } {
    const overdueOrders = orders.filter(
      o => o.status === 'pending' && currentDay > o.deadline
    );

    const totalPenalty = overdueOrders.reduce((sum, o) => {
      return sum + 50 + o.totalAmount * 0.05; // $50基础罚款 + 订单金额的5%
    }, 0);

    return { overdueOrders, totalPenalty: Math.round(totalPenalty * 100) / 100 };
  },

  /** 海外仓批量入库 */
  bulkInbound(
    productId: string,
    quantity: number,
    inventory: InventoryItem[],
    region: RegionId,
    currentDay: number,
  ): InventoryItem[] {
    const existing = inventory.find(i => i.productId === productId && i.warehouseType === 'overseas');

    if (existing) {
      return inventory.map(i =>
        i.productId === productId && i.warehouseType === 'overseas'
          ? { ...i, quantity: i.quantity + quantity }
          : i
      );
    }

    // 海外仓到货时间较长
    const arrivalDay = currentDay + (region === 'US' ? 10 : 7);
    return [
      ...inventory,
      {
        productId,
        quantity: 0,
        inboundQuantity: quantity,
        warehouseType: 'overseas',
        storageFeePerDay: region === 'US' ? 0.15 : 0.08,
        arrivalDay,
      },
    ];
  },
};
