// ============================================================
// 评价与复购系统：已签收订单产生评价，影响声誉；满意客户概率复购
// ============================================================
import type { GameState, Order, Review } from '../types';
import { getProduct } from '../data/products';
import type { DayProcessor } from '../engine/DayProcessor';

let reviewSeq = 0;
let reorderSeq = 0;

function makeReview(order: Order, day: number): Review {
  const product = getProduct(order.productId);
  const risk = product?.riskLevel ?? 'genuine';
  // 风险等级越高、超时越久，差评概率越大
  const onTime = day <= order.expectedPaymentDay + 3;
  const badBias = (risk === 'counterfeit' ? 0.4 : risk === 'whiteLabel' ? 0.2 : 0.05) + (onTime ? 0 : 0.2);

  const roll = pseudoRandom(day + order.orderId.length + reviewSeq);
  let sentiment: Review['sentiment'];
  let comment: string;
  if (roll < badBias) {
    sentiment = 'negative';
    comment = '质量与描述不符，差评！';
  } else if (roll < badBias + 0.2) {
    sentiment = 'neutral';
    comment = '中规中矩。';
  } else {
    sentiment = 'positive';
    comment = '很喜欢，物流也快！';
  }
  reviewSeq++;
  return { id: `rev-${day}-${reviewSeq}`, orderId: order.orderId, sentiment, day, comment };
}

// 简易确定性随机（避免依赖 Math.random，便于测试）
function pseudoRandom(seed: number): number {
  const x = Math.sin(seed * 999.13) * 10000;
  return x - Math.floor(x);
}

export function reputationProcessorFn(state: GameState, day: number): GameState {
  const reviewedIds = new Set(state.reviews.map((r) => r.orderId));
  const newReviews: Review[] = [];
  let reputationDelta = 0;

  for (const o of state.orders) {
    if (o.status === 'delivered' && o.paid && !reviewedIds.has(o.orderId)) {
      const review = makeReview(o, day);
      newReviews.push(review);
      reputationDelta += review.sentiment === 'positive' ? 2 : review.sentiment === 'negative' ? -3 : 0;
    }
  }

  if (newReviews.length === 0 && reputationDelta === 0) return state;

  // 复购：每条好评有概率带来一张新订单（基于现有库存）
  let orders = state.orders;
  const positiveCount = newReviews.filter((r) => r.sentiment === 'positive').length;
  for (let i = 0; i < positiveCount; i++) {
    if (pseudoRandom(day + i + reorderSeq) < 0.3) {
      const inv = state.inventory.find((it) => it.quantity > 0);
      if (inv) {
        reorderSeq++;
        orders = [
          ...orders,
          {
            ...minimalOrder(inv.productId, Math.min(2, inv.quantity), day, reorderSeq),
          },
        ];
      }
    }
  }

  return {
    ...state,
    reviews: [...state.reviews, ...newReviews],
    orders,
    player: {
      ...state.player,
      reputation: Math.max(0, Math.min(100, state.player.reputation + reputationDelta)),
    },
  };
}

function minimalOrder(productId: string, qty: number, day: number, seq: number): Order {
  const product = getProduct(productId);
  const price = product ? product.basePrice : 10;
  const total = Math.round(price * qty * 100) / 100;
  return {
    orderId: `RO-${day}-${seq}`,
    productId,
    productName: product?.name ?? productId,
    quantity: qty,
    unitPrice: price,
    totalAmount: total,
    shippingCost: 0,
    platformFeeRate: 0.05,
    status: 'pending',
    shippingType: 'self',
    region: 'SEA',
    createdAt: day,
    deadline: day + 2,
    isCOD: false,
    expectedPaymentDay: day + 5,
  };
}

export const reputationProcessor: DayProcessor = (ctx) => ({
  ...ctx,
  state: reputationProcessorFn(ctx.state, ctx.day),
});
