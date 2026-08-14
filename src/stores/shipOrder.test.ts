import { describe, it, expect } from 'vitest';
import { useGameStore } from './gameStore';
import { getProduct } from '../game/data/products';
import type { Order, InventoryItem } from '../game/types';

describe('store.shipOrder 回归', () => {
  it('对已满足库存的待发货订单发货：扣运费、状态变更、不抛错', () => {
    useGameStore.getState().initNewGame({ identityId: 'entrepreneur', difficultyId: 'normal', region: 'UK' });
    const prod = getProduct('prod_stanup_cup');
    expect(prod).toBeDefined();

    const orderId = 'ORD-regression-1';
    const order: Order = {
      orderId,
      productId: prod!.id,
      productName: prod!.name,
      quantity: 2,
      unitPrice: prod!.basePrice,
      totalAmount: prod!.basePrice * 2,
      shippingCost: 0,
      platformFeeRate: 0.05,
      status: 'pending',
      shippingType: 'self',
      region: 'UK',
      createdAt: 1,
      deadline: 30,
      isCOD: false,
      expectedPaymentDay: 5,
      paid: false,
    };
    const inventory: InventoryItem[] = [
      { productId: prod!.id, quantity: 10, inboundQuantity: 0, warehouseType: 'self' },
    ];
    useGameStore.setState({ orders: [order], inventory });

    const goldBefore = useGameStore.getState().player.gold;
    const res = useGameStore.getState().shipOrder(orderId);

    expect(res.success).toBe(true);
    const after = useGameStore.getState();
    expect(after.player.gold).toBeLessThan(goldBefore); // 运费已扣
    expect(after.orders[0].status).toBe('shipped');
  });

  it('库存不足时发货应失败且不抛错', () => {
    useGameStore.getState().initNewGame({ identityId: 'entrepreneur', difficultyId: 'normal', region: 'UK' });
    const prod = getProduct('prod_stanup_cup')!;
    const orderId = 'ORD-regression-2';
    const order: Order = {
      orderId,
      productId: prod.id,
      productName: prod.name,
      quantity: 5,
      unitPrice: prod.basePrice,
      totalAmount: prod.basePrice * 5,
      shippingCost: 0,
      platformFeeRate: 0.05,
      status: 'pending',
      shippingType: 'self',
      region: 'UK',
      createdAt: 1,
      deadline: 30,
      isCOD: false,
      expectedPaymentDay: 5,
      paid: false,
    };
    useGameStore.setState({ orders: [order], inventory: [] });

    const res = useGameStore.getState().shipOrder(orderId);
    expect(res.success).toBe(false);
    expect(useGameStore.getState().orders[0].status).toBe('pending');
  });
});
