// ============================================================
// 平衡模拟脚本（非功能测试，用于量化试玩平衡）
// 建模"稳健玩法"玩家策略：补货 -> 发货 -> 升级 -> 贷款 -> 报税
// 不触发随机事件（聚焦核心循环数值），跑满目标天数输出指标。
// 运行：npm test -- balance.sim.test.ts
// ============================================================
import { describe, it, expect } from 'vitest';
import type { GameState, InventoryItem, Product, DifficultyId } from './types';
import { INITIAL_PLAYER_STATE } from './types';
import { IDENTITIES } from './data/identities';
import { DIFFICULTIES } from './data/difficulties';
import { GOALS } from './data/goals';
import { getProduct } from './data/products';
import { INFLUENCERS } from './data/influencers';
import { seasonForDay } from './data/seasonConfig';
import { CERT_DEFINITION_MAP } from './data/certificates';
import { createInitialTax } from './systems/TaxSystem';
import { createInitialCompetitors } from './systems/CompetitionSystem';
import { createInitialEmployees } from './systems/EmployeeSystem';
import { runDay } from './engine/DayProcessor';
import { SourcingSystem } from './systems/SourcingSystem';
import { LogisticsSystem } from './systems/LogisticsSystem';
import { AffiliateSystem } from './systems/AffiliateSystem';
import { repayLoan } from './systems/LoanSystem';
import { fileTax } from './systems/TaxSystem';
import { calculatePurchaseCost } from './engine/formulas';
import { getUpgradeRequirement, canUpgrade, applyUpgrade as applyUpgradeState } from './systems/ShopSystem';

// ---- 初始状态构造（复制 gameStore.generateInitialState 核心） ----
function buildInitialState(opts: { identityId?: any; difficultyId?: any; region?: any } = {}): GameState {
  const identityId = opts.identityId ?? 'entrepreneur';
  const difficultyId = opts.difficultyId ?? 'normal';
  const identity = IDENTITIES[identityId];
  const difficulty = DIFFICULTIES[difficultyId];
  const region = opts.region ?? INITIAL_PLAYER_STATE.currentRegion;
  const goal = GOALS[difficultyId as DifficultyId];

  const player = {
    ...INITIAL_PLAYER_STATE,
    gold: Math.round(identity.startGold * difficulty.startGoldMultiplier),
    shopLevel: identity.startShopLevel,
    reputation: identity.startReputation,
    currentRegion: region,
  };

  const certificates: any[] = identity.preownedCerts.map((id) => {
    const def = CERT_DEFINITION_MAP[id];
    return {
      id: def.id, name: def.name, layer: def.layer, region: def.region,
      cost: def.cost, leadTimeDays: def.leadTimeDays, status: 'active' as const,
      unlocks: def.unlocks,
    };
  });

  const loans: any[] = [];
  if (identity.loan) {
    loans.push({
      id: 'loan-init', type: 'payday',
      principal: identity.loan.amount, repayAmount: identity.loan.repay,
      dueDay: identity.loan.dueInDays, takenDay: 0,
    });
    player.gold += identity.loan.amount;
  }

  return {
    player,
    inventory: [
      { productId: 'prod_stanup_cup', quantity: 30, inboundQuantity: 0, warehouseType: 'self' as const },
      { productId: 'prod_novelty_snacks', quantity: 50, inboundQuantity: 0, warehouseType: 'self' as const },
      { productId: 'prod_resistance_bands', quantity: 20, inboundQuantity: 0, warehouseType: 'self' as const },
    ],
    orders: [],
    influencers: [...INFLUENCERS],
    gameSpeed: '1x',
    gamePhase: 'playing',
    activePanel: null,
    activeScene: 'office',
    todayRevenue: 0, todayExpenses: 0, todayOrdersCount: 0,
    notifications: [],
    certificates,
    eventCooldowns: {},
    competitors: createInitialCompetitors(region),
    competitionPressure: 1,
    employees: createInitialEmployees(),
    tax: createInitialTax(),
    campaigns: [],
    loans,
    reviews: [],
    carrierId: 'rabbit',
    legalSubscribed: false,
    season: 0,
    hotCategories: seasonForDay(0).hotCategories,
    identityId, difficultyId, mainCategory: undefined,
    goal, activeChainId: IDENTITIES[identityId].storyChainId,
  } as GameState;
}

// ---- 工具 ----
function netWorth(state: GameState): number {
  const invValue = state.inventory.reduce((s, it) => s + (getProduct(it.productId)?.cost ?? 0) * it.quantity, 0);
  const debt = state.loans.reduce((s, l) => s + l.repayAmount, 0);
  return Math.round((state.player.gold + invValue - debt) * 100) / 100;
}

const MAIN_PRODUCTS_FULL = [
  'prod_stanup_cup', 'prod_resistance_bands', 'prod_face_roller',
  'prod_yoga_pants', 'prod_trendy_sunglasses', 'prod_aroma_diffuser',
  'prod_decompression_toy', 'prod_boba_kit', 'prod_pet_toy_set',
];
const MAIN_PRODUCTS_STARTER = [
  'prod_stanup_cup', 'prod_resistance_bands', 'prod_face_roller',
  'prod_decompression_toy', 'prod_trendy_sunglasses',
];

function mergeInventory(state: GameState, item: InventoryItem): GameState {
  const existing = state.inventory.find(i => i.productId === item.productId && i.warehouseType === item.warehouseType);
  let inventory: InventoryItem[];
  if (existing) {
    inventory = state.inventory.map(i =>
      i === existing
        ? { ...i, inboundQuantity: i.inboundQuantity + item.inboundQuantity, arrivalDay: item.arrivalDay }
        : i,
    );
  } else {
    inventory = [...state.inventory, item];
  }
  return { ...state, inventory };
}

// ---- 模拟一局（稳健玩法：自然流量 + 补货 + 发货 + 升级 + 贷款 + 适度达人） ----
function simulate(opts: { identityId?: any; difficultyId?: any; region?: any; useAffiliates?: boolean; maxDays?: number; rich?: boolean }) {
  const maxDays = opts.maxDays ?? 365;
  let state = buildInitialState(opts);
  if (opts.rich) state = { ...state, player: { ...state.player, gold: state.player.gold * 6 } };
  // 根据初始资金自适应策略：低资金用小盘口+低目标
  const startGold = state.player.gold;
  const isLowCapital = startGold <= 5500;
  const MAIN_PRODUCTS = isLowCapital ? MAIN_PRODUCTS_STARTER : MAIN_PRODUCTS_FULL;
  const TARGET_STOCK = isLowCapital ? 80 : 150;
  const REORDER_POINT = isLowCapital ? 30 : 60;
  const goal = state.goal!;
  let levelAtNetWorth: { level: number; netWorth: number; day: number }[] = [];
  let prevLevel = state.player.shopLevel;
  let outcome = 'timeout';

  for (let day = state.player.day; day <= maxDays; day++) {
    // --- 玩家当日操作（runDay 之前） ---
    // 1. 发货：所有 pending 订单
    for (const o of state.orders) {
      if (o.status === 'pending') {
        const r = LogisticsSystem.shipOrder(o, state.inventory, state.player.day);
        if (r.result.success) {
          state = {
            ...state,
            inventory: r.updatedInventory,
            orders: state.orders.map(x => x.orderId === o.orderId ? { ...x, status: 'shipped' as const, shippingCost: r.result.shippingCost } : x),
            player: { ...state.player, gold: Math.round((state.player.gold - r.result.shippingCost) * 100) / 100 },
          };
        }
      }
    }

    // 2. 补货
    for (const pid of MAIN_PRODUCTS) {
      const inv = state.inventory.find(i => i.productId === pid && i.warehouseType === 'self');
      const qty = inv?.quantity ?? 0;
      const inbound = inv?.inboundQuantity ?? 0;
      if (qty + inbound < REORDER_POINT) {
        const product = getProduct(pid)!;
        const buyQty = TARGET_STOCK - (qty + inbound);
        const cost = calculatePurchaseCost(product, buyQty);
        if (cost <= state.player.gold * 0.7) {
          const res = SourcingSystem.purchase(product, buyQty, state.player.gold, 'self', state.player.currentRegion, state.player.day);
          if (res.success) {
            state = mergeInventory(state, res.inventoryItem);
            state = { ...state, player: { ...state.player, gold: Math.round((state.player.gold - res.cost) * 100) / 100 } };
          }
        }
      }
    }

    // 2.5 上架：模拟玩家将（新到货的）库存上架，自然流量才会认它
    state = {
      ...state,
      inventory: state.inventory.map(i =>
        i.isListed ? i : { ...i, isListed: true, listedTitle: getProduct(i.productId)?.name ?? i.productId },
      ),
    };

    // 3. 达人合作（可选）：仅当某主力品库存足以接住预估订单量
    if (opts.useAffiliates) {
      const avail = state.influencers.filter(i => i.status === 'available' && i.region === state.player.currentRegion);
      if (avail.length && state.player.gold > 4000) {
        // 选一个预估订单量 <= 某主力品库存 的达人
        let chosen: any = null;
        let chosenProduct: Product | undefined;
        for (const inf of avail) {
          const est = AffiliateSystem.getEstimation(inf, getProduct(MAIN_PRODUCTS[0])!, inf.baseCommission + 0.05, state.player).estimatedOrders;
          for (const pid of MAIN_PRODUCTS) {
            const stock = state.inventory.find(i => i.productId === pid && i.warehouseType === 'self')?.quantity ?? 0;
            if (stock >= est) { chosen = inf; chosenProduct = getProduct(pid); break; }
          }
          if (chosen) break;
        }
        if (chosen && chosenProduct) {
          const commission = chosen.baseCommission + 0.05;
          const res = AffiliateSystem.initiateCooperation(chosen, chosenProduct, commission, state);
          if (res.success) {
            state = { ...state, orders: [...state.orders, ...res.ordersGenerated] };
          }
          state = { ...state, influencers: state.influencers.map(i => i.id === chosen!.id ? { ...i, status: 'coolingDown' as const, cooldownRemaining: 14 } : i) };
          // 立即发货新订单
          for (const o of res.ordersGenerated) {
            const r = LogisticsSystem.shipOrder(o, state.inventory, state.player.day);
            if (r.result.success) {
              state = { ...state, inventory: r.updatedInventory, player: { ...state.player, gold: Math.round((state.player.gold - r.result.shippingCost) * 100) / 100 } };
              state = { ...state, orders: state.orders.map(x => x.orderId === o.orderId ? { ...x, status: 'shipped' as const, shippingCost: r.result.shippingCost } : x) };
            }
          }
        }
      }
    }

    // 4. 升级
    const req = getUpgradeRequirement(state.player.shopLevel);
    if (canUpgrade(state.player, req)) {
      state = applyUpgradeState(state);
    }

    // 5. 还款：临近到期且现金充足时偿还，避免高利贷罚息螺旋
    for (const loan of [...state.loans]) {
      if (loan.dueDay - state.player.day <= 5 && state.player.gold >= loan.repayAmount) {
        const r = repayLoan(state, loan.id);
        if (!r.error) state = r.state;
      }
    }

    // 6. 报税：有税就缴
    if (state.tax.taxOwed > 0) {
      const r = fileTax(state, state.player.day);
      state = { ...state, tax: r.tax, player: r.player };
    }

    // --- 推进一天 ---
    const nextDay = state.player.day + 1;
    const ctx = runDay(state, nextDay);
    state = { ...ctx.state, orders: [...ctx.state.orders, ...ctx.newOrders] };

    // 记录升级时的净资产
    if (state.player.shopLevel > prevLevel) {
      levelAtNetWorth.push({ level: state.player.shopLevel, netWorth: netWorth(state), day: nextDay });
      prevLevel = state.player.shopLevel;
    }

    if (day <= 22 && day % 2 === 0) {
      const pending = state.orders.filter(o => o.status === 'pending').length;
      const invVal = state.inventory.reduce((s, i) => s + (getProduct(i.productId)?.cost ?? 0) * i.quantity, 0);
      console.log(`  调试 D${day} gold=${Math.round(state.player.gold)} pending=${pending} invVal=${Math.round(invVal)} paidOrders=${state.player.totalOrdersCompleted}`);
    }

    // 破产 / 通关
    if (state.player.gold <= -500) { outcome = 'bankrupt'; break; }
    if (state.goal && state.player.shopLevel >= state.goal.shopLevel) {
      if (netWorth(state) >= state.goal.netWorth) { outcome = 'victory'; break; }
    }
  }

  return {
    outcome,
    day: state.player.day,
    gold: Math.round(state.player.gold),
    level: state.player.shopLevel,
    netWorth: netWorth(state),
    totalOrders: state.player.totalOrdersCompleted,
    totalRevenue: Math.round(state.player.totalRevenue),
    goalLevel: goal.shopLevel,
    goalNetWorth: goal.netWorth,
    levelAtNetWorth,
  };
}

describe('平衡模拟 · 稳健玩法', () => {
  it('量化当前平衡（标准/UK/创业者，自然流量 + 适度达人）', () => {
    const runs = 3;
    for (let i = 0; i < runs; i++) {
      const r = simulate({ identityId: 'entrepreneur', difficultyId: 'normal', region: 'UK', useAffiliates: true, maxDays: 365 });
      console.log(`\n=== 模拟 #${i + 1} (normal/UK/entrepreneur) ===`);
      console.log(`结果: ${r.outcome} | Day ${r.day} | Lv.${r.level}/${r.goalLevel} | 净资产 $${r.netWorth} / 目标 $${r.goalNetWorth} | 累计订单 ${r.totalOrders} | 累计营收 $${r.totalRevenue}`);
      console.log('升级时净资产轨迹:', r.levelAtNetWorth.map(l => `Lv${l.level}:$${l.netWorth}(D${l.day})`).join('  '));
    }
    // 软断言：模拟不应崩溃
    expect(true).toBe(true);
  });

  it('rich start：验证长期单位经济是否为正（排除早期现金不足干扰）', () => {
    const r = simulate({ identityId: 'entrepreneur', difficultyId: 'normal', region: 'UK', useAffiliates: true, rich: true, maxDays: 365 });
    console.log(`\n=== Rich Start (初始资金×6) ===`);
    console.log(`结果: ${r.outcome} | Day ${r.day} | Lv.${r.level}/${r.goalLevel} | 净资产 $${r.netWorth} / 目标 $${r.goalNetWorth} | 订单 ${r.totalOrders} | 营收 $${r.totalRevenue}`);
    console.log('升级轨迹:', r.levelAtNetWorth.map((l) => `Lv${l.level}:$${l.netWorth}(D${l.day})`).join('  '));
    expect(true).toBe(true);
  });
  it('对比：纯自然流量（不放达人）是否更慢', () => {
    const r = simulate({ identityId: 'entrepreneur', difficultyId: 'normal', region: 'UK', useAffiliates: false, maxDays: 365 });
    console.log(`\n=== 纯自然流量 (不放达人) ===`);
    console.log(`结果: ${r.outcome} | Day ${r.day} | Lv.${r.level} | 净资产 $${r.netWorth} / 目标 $${r.goalNetWorth} | 累计订单 ${r.totalOrders}`);
    expect(true).toBe(true);
  });

  it('老兵身份通关验证（标准/UK，达人策略）', () => {
    const r = simulate({ identityId: 'veteran', difficultyId: 'normal', region: 'UK', useAffiliates: true, maxDays: 365 });
    console.log(`\n=== 老兵 (normal/UK/veteran) ===`);
    console.log(`结果: ${r.outcome} | Day ${r.day} | Lv.${r.level}/${r.goalLevel} | 净资产 $${r.netWorth} / 目标 $${r.goalNetWorth} | 累计订单 ${r.totalOrders} | 累计营收 $${r.totalRevenue}`);
    console.log('升级轨迹:', r.levelAtNetWorth.map((l) => `Lv${l.level}:$${l.netWorth}(D${l.day})`).join('  '));
    expect(true).toBe(true);
  });

  it('学生身份通关验证（标准/UK，达人策略）', () => {
    const r = simulate({ identityId: 'student', difficultyId: 'normal', region: 'UK', useAffiliates: true, maxDays: 365 });
    console.log(`\n=== 学生 (normal/UK/student) ===`);
    console.log(`结果: ${r.outcome} | Day ${r.day} | Lv.${r.level}/${r.goalLevel} | 净资产 $${r.netWorth} / 目标 $${r.goalNetWorth} | 累计订单 ${r.totalOrders} | 累计营收 $${r.totalRevenue}`);
    console.log('升级轨迹:', r.levelAtNetWorth.map((l) => `Lv${l.level}:$${l.netWorth}(D${l.day})`).join('  '));
    expect(true).toBe(true);
  });
});
