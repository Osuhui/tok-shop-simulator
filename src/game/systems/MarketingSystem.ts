// ============================================================
// 营销系统：投流广告 / SEO / 社媒 / 平台大促（大促走事件链）
// 广告与社媒在活动期内额外带来订单；SEO/法务为月度订阅
// ============================================================
import type { GameState, MarketingCampaign, CampaignType, Order } from '../types';
import { getProduct } from '../data/products';
import type { DayProcessor } from '../engine/DayProcessor';

export const DURATION: Record<CampaignType, number> = {
  ads: 3,
  social: 5,
  seo: 999,
  platformEvent: 0,
};

export const MIN_SPEND: Record<CampaignType, number> = {
  ads: 100,
  social: 50,
  seo: 200,
  platformEvent: 0,
};

let campaignSeq = 0;
let mktOrderSeq = 0;

export function startCampaign(
  state: GameState,
  type: CampaignType,
  spend: number,
  day: number,
): { state: GameState; error?: string } {
  if (type === 'platformEvent') return { state, error: '平台大促由活动事件触发' };
  if (spend < MIN_SPEND[type]) return { state, error: `投入至少 $${MIN_SPEND[type]}` };
  if (state.player.gold < spend) return { state, error: '资金不足' };

  const campaign: MarketingCampaign = {
    id: `cmp-${day}-${campaignSeq++}`,
    type,
    spend,
    startedDay: day,
    durationDays: DURATION[type],
    monthly: type === 'seo',
  };
  return {
    state: {
      ...state,
      campaigns: [...state.campaigns, campaign],
      player: { ...state.player, gold: state.player.gold - spend },
    },
  };
}

function makeCampaignOrder(state: GameState, day: number): Order | null {
  const inv = state.inventory.find((it) => it.quantity > 0);
  if (!inv) return null;
  const product = getProduct(inv.productId);
  const price = product ? product.basePrice : 10;
  const qty = 1 + (day % 2);
  mktOrderSeq++;
  return {
    orderId: `MK-${day}-${mktOrderSeq}`,
    productId: inv.productId,
    productName: product?.name ?? inv.productId,
    quantity: qty,
    unitPrice: price,
    totalAmount: Math.round(price * qty * 100) / 100,
    shippingCost: 0,
    platformFeeRate: 0.05,
    status: 'pending',
    shippingType: inv.warehouseType,
    region: state.player.currentRegion,
    createdAt: day,
    deadline: day + 2,
    isCOD: false,
    expectedPaymentDay: day + 5,
  };
}

export const marketingProcessor: DayProcessor = (ctx) => {
  let state = ctx.state;
  let orders = state.orders;

  for (const cmp of state.campaigns) {
    const active = ctx.day - cmp.startedDay < cmp.durationDays;
    if (!active) continue;
    if (cmp.type === 'ads') {
      const o = makeCampaignOrder(state, ctx.day);
      if (o) orders = [...orders, o];
    } else if (cmp.type === 'social' && ctx.day % 2 === 0) {
      const o = makeCampaignOrder(state, ctx.day);
      if (o) orders = [...orders, o];
    }
  }

  // 月度订阅扣费（SEO / 法务）
  let gold = state.player.gold;
  let legalSubscribed = state.legalSubscribed;
  let campaigns = state.campaigns;
  if (ctx.day % 30 === 0) {
    for (const cmp of state.campaigns) {
      if (cmp.monthly) {
        gold -= cmp.spend;
        if (cmp.type === 'seo') {
          // SEO 持续带来流量（在 generateOrganicOrders 中按 campaigns 读取）
        }
      }
    }
    legalSubscribed = state.campaigns.some((c) => c.type === 'seo');
  }

  // 过期活动清理
  campaigns = state.campaigns.filter((c) => c.monthly || ctx.day - c.startedDay < c.durationDays);

  if (orders === state.orders && gold === state.player.gold && campaigns === state.campaigns) {
    return ctx;
  }

  return {
    ...ctx,
    state: {
      ...state,
      orders,
      campaigns,
      legalSubscribed,
      player: { ...state.player, gold: Math.round(gold * 100) / 100 },
    },
  };
};
