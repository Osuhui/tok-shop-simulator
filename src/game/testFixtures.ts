// 测试用最小 GameState 构造器
import type { GameState, Order } from './types';
import { INITIAL_PLAYER_STATE } from './types';
import { INFLUENCERS } from './data/influencers';
import { createInitialTax } from './systems/TaxSystem';

export function createTestState(overrides: Partial<GameState> = {}): GameState {
  return {
    player: { ...INITIAL_PLAYER_STATE },
    inventory: [],
    orders: [],
    influencers: [...INFLUENCERS],
    notifications: [],
    gameSpeed: '1x',
    gamePhase: 'playing',
    activePanel: null,
    activeScene: 'office',
    todayRevenue: 0,
    todayExpenses: 0,
    todayOrdersCount: 0,
    certificates: [],
    eventCooldowns: {},
    competitors: [],
    competitionPressure: 1,
    employees: [],
    tax: createInitialTax(),
    campaigns: [],
    loans: [],
    reviews: [],
    carrierId: 'rabbit',
    legalSubscribed: false,
    season: 0,
    hotCategories: [],
    ...overrides,
  };
}

/** 构造一个最小可用的测试订单（默认已签收、待结算） */
export function makeTestOrder(overrides: Partial<Order> = {}): Order {
  return {
    orderId: 'T1',
    productId: 'prod_stanup_cup',
    productName: '杯',
    quantity: 2,
    unitPrice: 10,
    totalAmount: 20,
    shippingCost: 1,
    platformFeeRate: 0.05,
    status: 'delivered',
    shippingType: 'self',
    region: 'UK',
    createdAt: 1,
    deadline: 3,
    isCOD: false,
    expectedPaymentDay: 2,
    ...overrides,
  };
}
