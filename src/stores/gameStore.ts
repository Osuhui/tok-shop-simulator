// ============================================================
// 核心游戏 Zustand Store
// ============================================================
import { create } from 'zustand';
import type {
  GameState,
  GameSpeed,
  RegionId,
  Notification,
  IdentityId,
  DifficultyId,
  ProductCategory,
  Certificate,
  CertId,
  Loan,
  LoanType,
  EmployeeRole,
  CampaignType,
  CarrierId,
} from '../game/types';
import { INITIAL_PLAYER_STATE } from '../game/types';
import { GameLoop } from '../game/engine/GameLoop';
import { SourcingSystem } from '../game/systems/SourcingSystem';
import { ListingSystem } from '../game/systems/ListingSystem';
import { AffiliateSystem } from '../game/systems/AffiliateSystem';
import { LogisticsSystem } from '../game/systems/LogisticsSystem';
import { RegionSystem } from '../game/systems/RegionSystem';
import { getRegionConfig } from '../game/data/regions';
import { applyUpgrade } from '../game/systems/ShopSystem';
import { createInitialTax } from '../game/systems/TaxSystem';
import { createInitialCompetitors } from '../game/systems/CompetitionSystem';
import { createInitialEmployees, hireEmployee as hireEmployeeFn } from '../game/systems/EmployeeSystem';
import { fileTax as fileTaxFn } from '../game/systems/TaxSystem';
import { startCertificateApplication } from '../game/systems/TaskSystem';
import { takeLoan as takeLoanFn, repayLoan as repayLoanFn } from '../game/systems/LoanSystem';
import { startCampaign as startCampaignFn } from '../game/systems/MarketingSystem';
import { selectCarrier as selectCarrierFn, shippingMultiplier } from '../game/systems/CarriersSystem';
import { IDENTITIES } from '../game/data/identities';
import { DIFFICULTIES } from '../game/data/difficulties';
import { GOALS } from '../game/data/goals';
import { seasonForDay } from '../game/data/seasonConfig';
import { CERT_DEFINITION_MAP } from '../game/data/certificates';
import { SaveSystem } from '../game/systems/SaveSystem';
import { getProduct } from '../game/data/products';
import { getInfluencer, INFLUENCERS as INFLUENCERS_DATA } from '../game/data/influencers';
import { EVENTS } from '../game/data/events';
import { tryTriggerEvent, driveChainEvent, resolveEventChoice } from '../game/engine/EventEngine';
import { applyCommands } from '../game/engine/EffectBus';
import { runDay } from '../game/engine/DayProcessor';
import { nextCooldownDay } from '../game/engine/StoryEngine';
import { isShopOpen, getRequiredCertIds } from '../game/systems/OpeningSystem';
import { fxBus } from '../game/fxBus';
import type { GameEvent } from '../game/types';

interface GameStore extends GameState {
  // 时间
  gameLoop: GameLoop;
  dayProgress: number;

  // Actions
  initNewGame: (opts?: NewGameOptions) => void;
  tick: (deltaMs: number) => void;
  setGameSpeed: (speed: GameSpeed) => void;
  skipToNextDay: () => void;

  // 选品
  purchaseProduct: (productId: string, quantity: number, warehouseType: 'self' | 'overseas') => { success: boolean; error?: string };
  setActivePanel: (panelId: string | null) => void;
  setActiveScene: (scene: string) => void;

  // 上架 & 合规
  checkAndListProduct: (productId: string, title: string) => { passed: boolean; violations: string[]; penaltyLevel: string };

  // 达人合作
  initiateAffiliate: (influencerId: string, productId: string, commission: number) => { success: boolean; message: string; ordersCount: number };

  // 物流
  shipOrder: (orderId: string) => { success: boolean; error?: string; shippingCost: number };
  checkOverdueOrders: () => void;

  // 区域
  unlockRegion: (regionId: RegionId) => { success: boolean; message: string };
  switchRegion: (regionId: RegionId) => { success: boolean; message: string };

  // 店铺升级
  upgradeShop: () => void;

  // 税务
  fileTax: () => { success: boolean; message: string };

  // 贷款现金流
  takeLoan: (type: LoanType) => { success: boolean; message: string };
  repayLoan: (loanId: string) => { success: boolean; message: string };

  // 员工
  hireEmployee: (role: EmployeeRole) => { success: boolean; message: string };

  // 证件 / 开业
  applyCertificate: (certId: CertId) => { success: boolean; message: string };

  // 营销
  startCampaign: (type: CampaignType, spend: number) => { success: boolean; message: string };

  // 物流承运商
  selectCarrier: (carrierId: CarrierId) => void;

  // 存档
  saveGame: (slot: number, name?: string) => Promise<boolean>;
  loadGame: (slot: number) => Promise<boolean>;
  deleteSave: (slot: number) => Promise<boolean>;

  // 通知
  addNotification: (title: string, message: string, type: Notification['type']) => void;
  markNotificationRead: (id: string) => void;

  // 事件
  activeEvent: GameEvent | null;
  resolveEvent: (choiceId: string) => void;
  dismissEvent: () => void;
}

type NewGameOptions = {
  identityId?: IdentityId;
  difficultyId?: DifficultyId;
  region?: RegionId;
  mainCategory?: ProductCategory;
};

function generateInitialState(opts: NewGameOptions = {}): GameState {
  const identityId = opts.identityId ?? 'entrepreneur';
  const difficultyId = opts.difficultyId ?? 'normal';
  const identity = IDENTITIES[identityId];
  const difficulty = DIFFICULTIES[difficultyId];
  const region = opts.region ?? INITIAL_PLAYER_STATE.currentRegion;
  const goal = GOALS[difficultyId];

  const player = {
    ...INITIAL_PLAYER_STATE,
    gold: Math.round(identity.startGold * difficulty.startGoldMultiplier),
    shopLevel: identity.startShopLevel,
    reputation: identity.startReputation,
    currentRegion: region,
  };

  // 身份自带资质 -> 直接 active
  const certificates: Certificate[] = identity.preownedCerts.map((id) => {
    const def = CERT_DEFINITION_MAP[id];
    return {
      id: def.id,
      name: def.name,
      layer: def.layer,
      region: def.region,
      cost: def.cost,
      leadTimeDays: def.leadTimeDays,
      status: 'active' as const,
      unlocks: def.unlocks,
    };
  });

  // 身份启动贷款
  const loans: Loan[] = [];
  if (identity.loan) {
    loans.push({
      id: 'loan-init',
      type: 'payday',
      principal: identity.loan.amount,
      repayAmount: identity.loan.repay,
      dueDay: identity.loan.dueInDays,
      takenDay: 0,
    });
    player.gold += identity.loan.amount;
  }

  // 开业封锁：easy（无开业证件要求）初始库存默认已上架；normal/hard 需先办证开业后再上架
  const initiallyListed = getRequiredCertIds(difficultyId).length === 0;

  return {
    player,
    inventory: [
      { productId: 'prod_stanup_cup', quantity: 30, inboundQuantity: 0, warehouseType: 'self', isListed: initiallyListed },
      { productId: 'prod_novelty_snacks', quantity: 50, inboundQuantity: 0, warehouseType: 'self', isListed: initiallyListed },
      { productId: 'prod_resistance_bands', quantity: 20, inboundQuantity: 0, warehouseType: 'self', isListed: initiallyListed },
    ],
    orders: [],
    influencers: [...INFLUENCERS_DATA],
    gameSpeed: '1x',
    gamePhase: 'menu',
    activePanel: null,
    activeScene: 'office',
    todayRevenue: 0,
    todayExpenses: 0,
    todayOrdersCount: 0,
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
    identityId,
    difficultyId,
    mainCategory: opts.mainCategory,
    goal,
    activeChainId: IDENTITIES[identityId].storyChainId,
    netWorthHistory: [],
    onboardingRewardClaimed: false,
  };
}

/** 从 store 摘出纯数据字段：store 混有 action 函数，整体序列化（IndexedDB）/参与每日结算会携带函数。
 *  - 存档与 runDay 入参都走这里，避免函数混入状态（曾导致 autosave 持续 DataCloneError 静默失败） */
function pickGameState(store: GameState): GameState {
  return {
    player: store.player,
    inventory: store.inventory,
    orders: store.orders,
    influencers: store.influencers,
    notifications: store.notifications,
    gameSpeed: store.gameSpeed,
    gamePhase: store.gamePhase,
    activePanel: store.activePanel,
    activeScene: store.activeScene,
    todayRevenue: store.todayRevenue,
    todayExpenses: store.todayExpenses,
    todayOrdersCount: store.todayOrdersCount,
    eventCooldowns: store.eventCooldowns,
    certificates: store.certificates,
    competitors: store.competitors,
    competitionPressure: store.competitionPressure,
    employees: store.employees,
    tax: store.tax,
    campaigns: store.campaigns,
    loans: store.loans,
    reviews: store.reviews,
    carrierId: store.carrierId,
    legalSubscribed: store.legalSubscribed,
    season: store.season,
    hotCategories: store.hotCategories,
    identityId: store.identityId,
    difficultyId: store.difficultyId,
    mainCategory: store.mainCategory,
    goal: store.goal,
    activeChainId: store.activeChainId,
    netWorthHistory: store.netWorthHistory,
    onboardingRewardClaimed: store.onboardingRewardClaimed,
  };
}

export const useGameStore = create<GameStore>((set, get) => ({
  ...generateInitialState(),
  gameLoop: new GameLoop('1x'),
  dayProgress: 0,

  // === 初始化 ===
  initNewGame: (opts) => {
    const state = generateInitialState(opts);
    state.gamePhase = 'playing';
    state.gameSpeed = '1x';
    const identity = IDENTITIES[(opts?.identityId ?? 'entrepreneur') as IdentityId];
    const region = getRegionConfig(state.player.currentRegion);
    state.notifications = [{
      id: 'welcome',
      title: `欢迎，${identity.name}！`,
      message: `你以「${identity.name}」的身份从${region.name}市场起步。初始资金 $${state.player.gold.toLocaleString()}，仓库中有一些初始库存。${
        getRequiredCertIds(state.difficultyId).length > 0
          ? '当前难度需要先到「办证」办齐开业证件，开业后才能上架接单！'
          : '打开"选品"采购商品，在"上架"中编辑标题，等待订单后去"物流"发货！'
      }`,
      type: 'info',
      timestamp: Date.now(),
      read: false,
    }];
    set({
      ...state,
      gameLoop: new GameLoop('1x'),
      dayProgress: 0,
      activePanel: 'dashboard',
      activeScene: 'office',
    });
  },

  // === 时间推进 ===
  tick: (deltaMs: number) => {
    const store = get();
    if (store.gamePhase !== 'playing') return;

    const newDays = store.gameLoop.tick(deltaMs);
    const dayProgress = store.gameLoop.getDayProgress();
    set({ dayProgress });

    if (newDays <= 0) return;

    // 推进多天
    for (let d = 0; d < newDays; d++) {
      advanceOneDay(get, set);
    }
  },

  setGameSpeed: (speed: GameSpeed) => {
    const store = get();
    store.gameLoop.setSpeed(speed);
    set({ gameSpeed: speed });
  },

  // === 快进一日 ===
  skipToNextDay: () => {
    const store = get();
    if (store.gamePhase !== 'playing') return; // 事件/破产/胜利/菜单期间禁用
    advanceOneDay(get, set);
    // 重置循环计时，避免上一帧累计的 elapsed 在下一帧立刻再推一天
    get().gameLoop.setSpeed(get().gameSpeed);
    set({ dayProgress: 0 });
  },

  // === 采购 ===
  purchaseProduct: (productId: string, quantity: number, warehouseType: 'self' | 'overseas') => {
    const store = get();
    const product = getProduct(productId);
    if (!product) return { success: false, error: '商品不存在' };

    const result = SourcingSystem.purchase(
      product,
      quantity,
      store.player.gold,
      warehouseType,
      store.player.currentRegion,
      store.player.day,
    );

    if (!result.success) return { success: false, error: result.error };

    // 扣款
    const player = { ...store.player, gold: store.player.gold - result.cost };

    // 添加库存 (在途)
    const existingIdx = store.inventory.findIndex(
      i => i.productId === productId && i.warehouseType === warehouseType
    );
    let inventory = [...store.inventory];
    if (existingIdx >= 0) {
      inventory[existingIdx] = {
        ...inventory[existingIdx],
        inboundQuantity: inventory[existingIdx].inboundQuantity + quantity,
        // 保留最早到货日：重复采购不得把已有在途批次一并推迟（否则天天买=永远不到货）
        arrivalDay: Math.min(
          inventory[existingIdx].arrivalDay ?? Infinity,
          result.inventoryItem.arrivalDay ?? Infinity,
        ),
      };
    } else {
      inventory.push(result.inventoryItem);
    }

    set({ player, inventory });
    get().addNotification('采购成功', `已采购 ${quantity} 件 ${product.name}，预计 Day ${result.inventoryItem.arrivalDay} 到货`, 'success');
    return { success: true };
  },

  // === UI ===
  setActivePanel: (panelId: string | null) => set({ activePanel: panelId }),
  setActiveScene: (scene: string) => set({ activeScene: scene }),

  // === 上架 ===
  checkAndListProduct: (productId: string, title: string) => {
    const store = get();
    const product = getProduct(productId);
    if (!product) return { passed: false, violations: [], penaltyLevel: 'none' };
    // 开业封锁：未办齐开业证件不可上架
    if (!isShopOpen(store)) {
      return { passed: false, violations: ['未开业：请先在「办证」中办齐全部开业证件'], penaltyLevel: 'none' };
    }

    const result = ListingSystem.checkCompliance(title, product, store.player.currentRegion);

    if (!result.passed) {
      const player = {
        ...store.player,
        gold: store.player.gold - result.penaltyGold,
        healthScore: Math.max(0, Math.min(5, store.player.healthScore + result.penaltyHealthScore)),
        totalFines: store.player.totalFines + result.penaltyGold,
      };
      set({ player });
      get().addNotification(
        '合规检测失败',
        `发现 ${result.violations.length} 个违规词，处罚等级: ${result.penaltyLevel}`,
        result.penaltyLevel === 'heavy' ? 'danger' : 'warning'
      );
    } else {
      // 合规通过：标记为已上架（开张营业），自然流量仅从已上架库存产生
      const inventory = store.inventory.map(i =>
        i.productId === productId ? { ...i, isListed: true, listedTitle: title } : i,
      );
      set({ inventory });
      get().addNotification('上架成功', `商品 "${title}" 已上架，开始接收自然流量订单`, 'success');
    }

    return {
      passed: result.passed,
      violations: result.violations,
      penaltyLevel: result.penaltyLevel,
    };
  },

  // === 达人合作 ===
  initiateAffiliate: (influencerId: string, productId: string, commission: number) => {
    const store = get();
    const influencer = getInfluencer(influencerId);
    const product = getProduct(productId);
    if (!influencer || !product) return { success: false, message: '达人或商品不存在', ordersCount: 0 };
    if (influencer.status === 'poached') return { success: false, message: `${influencer.name} 已被竞争对手挖角，无法合作`, ordersCount: 0 };
    // 开业封锁：未开业的店铺不能承接达人合作（达人自带流量但店铺需先能履约）
    if (!isShopOpen(store)) return { success: false, message: '店铺尚未开业，暂不能发起达人合作', ordersCount: 0 };

    const result = AffiliateSystem.initiateCooperation(influencer, product, commission, store);

    if (result.success) {
      // 添加订单
      const orders = [...store.orders, ...result.ordersGenerated];
      // 达人进入冷却
      const influencers = store.influencers.map(inf =>
        inf.id === influencerId
          ? { ...inf, status: 'coolingDown' as const, cooldownRemaining: 14 }
          : inf
      );
      set({ orders, influencers });
      get().addNotification('达人合作成功', result.message, 'success');
      fxBus.emit('order', `📋 +${result.ordersGenerated.length} 新订单`);
    } else {
      const influencers = store.influencers.map(inf =>
        inf.id === influencerId
          ? { ...inf, status: 'coolingDown' as const, cooldownRemaining: 14 }
          : inf
      );
      set({ influencers });
      get().addNotification('达人合作失败', result.message, 'warning');
    }

    return { success: result.success, message: result.message, ordersCount: result.ordersGenerated.length };
  },

  // === 发货 ===
  shipOrder: (orderId: string) => {
    const store = get();
    const order = store.orders.find(o => o.orderId === orderId);
    if (!order) return { success: false, error: '订单不存在', shippingCost: 0 };

    const { result, updatedInventory } = LogisticsSystem.shipOrder(
      order,
      store.inventory,
      store.player.day,
    );

    if (!result.success) return { success: false, error: result.error, shippingCost: 0 };

    // 承运商运费倍率（含旺季附加）
    const mult = shippingMultiplier(store, store.player.day);
    const finalShippingCost = Math.round((result.shippingCost ?? 0) * mult * 100) / 100;

    // 更新订单状态
    const orders = store.orders.map(o =>
      o.orderId === orderId
        ? { ...o, status: 'shipped' as const, shippingCost: finalShippingCost }
        : o
    );

    // 扣款（运费）
    const player = { ...store.player, gold: store.player.gold - finalShippingCost };

    set({ orders, inventory: updatedInventory, player });
    get().addNotification('发货成功', `订单 ${orderId} 已发货，运费 $${finalShippingCost.toFixed(2)}`, 'success');
    fxBus.emit('ship', `📦 ${orderId} 已发出`);

    return { success: true, shippingCost: finalShippingCost };
  },

  checkOverdueOrders: () => {
    const store = get();
    const { overdueOrders, totalPenalty } = LogisticsSystem.checkOverdueOrders(
      store.orders,
      store.player.day,
    );

    if (overdueOrders.length > 0) {
      const orders = store.orders.map(o =>
        o.status === 'pending' && store.player.day > o.deadline
          ? { ...o, status: 'cancelled' as const }
          : o
      );

      const player = {
        ...store.player,
        gold: store.player.gold - totalPenalty,
        healthScore: Math.max(0, store.player.healthScore - overdueOrders.length * 0.2),
        totalFines: store.player.totalFines + totalPenalty,
      };

      set({ orders, player });
      get().addNotification(
        '订单超时',
        `${overdueOrders.length} 个订单超时未发货，罚款 $${totalPenalty.toFixed(2)}，健康分 -${(overdueOrders.length * 0.2).toFixed(1)}`,
        'danger'
      );
    }
  },

  // === 区域 ===
  // 事件 / 破产等非 playing 阶段下，禁止任何状态变更（修复 BUG#6：事件暂停期间误操作）
  unlockRegion: (regionId: RegionId) => {
    if (get().gamePhase !== 'playing') return { success: false, message: '当前不可操作' };
    const store = get();
    const result = RegionSystem.unlock(store.player, regionId);
    if (result.success) {
      const player = {
        ...store.player,
        unlockedRegions: [...store.player.unlockedRegions, regionId],
      };
      set({ player });
      get().addNotification('区域解锁', result.message, 'success');
    }
    return result;
  },

  switchRegion: (regionId: RegionId) => {
    if (get().gamePhase !== 'playing') return { success: false, message: '当前不可操作' };
    const store = get();
    const result = RegionSystem.switchRegion(store.player, regionId);
    if (result.success) {
      const player = { ...store.player, currentRegion: regionId };
      set({ player });
      get().addNotification('区域切换', result.message, 'info');
    }
    return result;
  },

  // === 店铺升级 ===
  upgradeShop: () => {
    const store = get();
    if (store.gamePhase !== 'playing') return; // BUG#6：事件/破产期间禁止操作
    const newState = applyUpgrade(store);
    if (newState === store) return; // 条件不满足，无变化
    set(newState);
    fxBus.emit('levelup', `⬆️ 升级至 Lv.${newState.player.shopLevel}！`);
    get().addNotification('店铺升级', `恭喜！店铺已升级至 Lv.${newState.player.shopLevel}`, 'success');
  },

  // === 税务 ===
  fileTax: () => {
    const store = get();
    if (store.gamePhase !== 'playing') return { success: false, message: '当前不可操作' };
    if (store.tax.taxOwed <= 0) return { success: false, message: '当前没有应缴税款' };
    const paid = Math.round(store.tax.taxOwed * 100) / 100;
    const next = fileTaxFn(store, store.player.day);
    set({ tax: next.tax, player: next.player });
    get().addNotification('税务申报', `已完成申报并缴纳 $${paid.toFixed(2)}，稽查风险已清零`, 'info');
    return { success: true, message: `已缴税 $${paid.toFixed(2)}` };
  },

  // === 贷款现金流 ===
  takeLoan: (type) => {
    const store = get();
    if (store.gamePhase !== 'playing') return { success: false, message: '当前不可操作' };
    const { state: next, error } = takeLoanFn(store, type, store.player.day);
    if (error) return { success: false, message: error };
    const amount = Math.round((next.player.gold - store.player.gold) * 100) / 100;
    set({ loans: next.loans, player: next.player });
    get().addNotification('贷款到账', `成功借款 $${amount.toLocaleString()}`, 'success');
    return { success: true, message: `借款 $${amount}` };
  },
  repayLoan: (loanId) => {
    const store = get();
    if (store.gamePhase !== 'playing') return { success: false, message: '当前不可操作' };
    const { state: next, error } = repayLoanFn(store, loanId);
    if (error) return { success: false, message: error };
    const amount = Math.round((store.player.gold - next.player.gold) * 100) / 100;
    set({ loans: next.loans, player: next.player });
    get().addNotification('贷款还款', `已偿还 $${amount.toLocaleString()}`, 'success');
    return { success: true, message: `还款 $${amount}` };
  },

  // === 员工 ===
  hireEmployee: (role) => {
    const store = get();
    if (store.gamePhase !== 'playing') return { success: false, message: '当前不可操作' };
    const { state: next, error } = hireEmployeeFn(store, role, store.player.day);
    if (error) return { success: false, message: error };
    const cost = Math.round((store.player.gold - next.player.gold) * 100) / 100;
    set({ employees: next.employees, player: next.player });
    get().addNotification('招募员工', `已招募员工，支付首月薪资 $${cost}`, 'success');
    return { success: true, message: `招募成功，支出 $${cost}` };
  },

  // === 证件 / 开业 ===
  applyCertificate: (certId) => {
    const store = get();
    if (store.gamePhase !== 'playing') return { success: false, message: '当前不可操作' };
    const { state: next, error } = startCertificateApplication(store, certId);
    if (error) return { success: false, message: error };
    const def = CERT_DEFINITION_MAP[certId];
    const cost = Math.round((store.player.gold - next.player.gold) * 100) / 100;
    set({ certificates: next.certificates, player: next.player });
    get().addNotification(
      '证件申请',
      `已提交「${def.name}」申请，预计 Day ${next.certificates.find((c) => c.id === certId)?.grantedDay} 下发${cost > 0 ? `，办理费 $${cost}` : ''}`,
      'success',
    );
    return { success: true, message: `已申请 ${def.name}` };
  },

  // === 营销 ===
  startCampaign: (type, spend) => {
    const store = get();
    if (store.gamePhase !== 'playing') return { success: false, message: '当前不可操作' };
    const { state: next, error } = startCampaignFn(store, type, spend, store.player.day);
    if (error) return { success: false, message: error };
    set({ campaigns: next.campaigns, player: next.player });
    get().addNotification('营销活动', `已启动${type === 'ads' ? '投流广告' : type === 'social' ? '社媒推广' : 'SEO 优化'}，投入 $${spend}`, 'success');
    return { success: true, message: `已投入 $${spend}` };
  },

  // === 物流承运商 ===
  selectCarrier: (carrierId) => {
    if (get().gamePhase !== 'playing') return;
    const { state: next, error } = selectCarrierFn(get(), carrierId);
    if (error) {
      get().addNotification('承运商切换', error, 'warning');
      return;
    }
    set({ carrierId: next.carrierId });
    const name = carrierId === 'rabbit' ? '兔子速运' : carrierId === 'eagle' ? '鹰速' : '鲸运';
    get().addNotification('承运商切换', `已切换至 ${name}`, 'info');
  },

  // === 存档 ===
  saveGame: async (slot: number, name?: string) => {
    const state = pickGameState(get());
    const ok = await SaveSystem.save(slot, state, name);
    if (ok) get().addNotification('存档成功', `已保存到槽位 ${slot}`, 'success');
    return ok;
  },

  loadGame: async (slot: number) => {
    const data = await SaveSystem.load(slot);
    if (!data) return false;

    set({
      ...data.state,
      gameLoop: new GameLoop(data.state.gameSpeed),
      dayProgress: 0,
      gamePhase: 'playing',
    });
    return true;
  },

  deleteSave: async (slot: number) => {
    return SaveSystem.delete(slot);
  },

  // === 通知 ===
  addNotification: (title: string, message: string, type: Notification['type']) => {
    const notification: Notification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title,
      message,
      type,
      timestamp: Date.now(),
      read: false,
    };
    set(state => ({
      notifications: [notification, ...state.notifications].slice(0, 50), // 最多保留50条
    }));
  },

  markNotificationRead: (id: string) => {
    set(state => ({
      notifications: state.notifications.map(n =>
        n.id === id ? { ...n, read: true } : n
      ),
    }));
  },

  // === 事件 ===
  activeEvent: null,

  resolveEvent: (choiceId: string) => {
    const store = get();
    if (!store.activeEvent) return;
    const choice = store.activeEvent.choices.find(c => c.id === choiceId);
    if (!choice) return;

    // 扣款
    if (choice.cost && choice.cost > 0) {
      set({ player: { ...store.player, gold: store.player.gold - choice.cost } });
    }

    // 判定 + 经 EffectBus 施加效果
    const { success, effects } = resolveEventChoice(choice);
    const newState = applyCommands(get(), effects);

    // 反馈特效：金币增减浮动提示
    const goldCmd = effects.find(e => e.type === 'gold');
    if (goldCmd && goldCmd.type === 'gold') {
      const v = goldCmd.value;
      fxBus.emit(v > 0 ? 'gold' : 'bad', `${v > 0 ? '💰' : '💸'} ${v > 0 ? '+' : '-'}$${Math.abs(Math.round(v)).toLocaleString()}`);
    }

    set({
      ...newState,
      activeEvent: null,
      gamePhase: 'playing',
    });

    const outcomeText = success ? '成功！' : '失败...';
    get().addNotification(
      `${store.activeEvent.title} — ${outcomeText}`,
      effects.map(e => e.description).join('，'),
      success ? 'success' : 'warning'
    );
  },

  dismissEvent: () => {
    const store = get();
    if (store.activeEvent) {
      set({
        activeEvent: null,
        gamePhase: 'playing',
      });
    }
  },
}));

// ============================================================
// 内部：每日推进逻辑
// ============================================================
function advanceOneDay(
  get: () => GameStore,
  set: (partial: Partial<GameStore>) => void,
) {
  const store = get();
  const day = store.player.day + 1;

  // 通过可插拔的 DayProcessor 注册表推进一整天（纯函数聚合，便于扩展维护）
  // 入参必须是纯数据状态：store 混有 action 函数，直接传入会让函数随 nextState 流入自动存档导致序列化失败
  const ctx = runDay(pickGameState(store), day);
  const player = ctx.state.player;

  // 回款特效：当日有营收结算时浮动提示
  if (ctx.todayRevenue > 0) {
    fxBus.emit('gold', `💰 +$${Math.round(ctx.todayRevenue).toLocaleString()}`);
  }

  // 净资产快照（同时用于通关判定与看板趋势推演）
  const invValue = ctx.state.inventory.reduce(
    (sum, it) => sum + (getProduct(it.productId)?.cost ?? 0) * it.quantity,
    0,
  );
  const debt = ctx.state.loans.reduce((sum, l) => sum + l.repayAmount, 0);
  const netWorth = Math.round((player.gold + invValue - debt) * 100) / 100;
  const history = [...(store.netWorthHistory ?? []), netWorth].slice(-7);

  // 破产检查
  if (player.gold <= -500) {
    set({ player, gamePhase: 'gameOver' });
    return;
  }

  // 通关检查：达成店铺等级 + 净资产目标即胜利
  if (ctx.state.goal) {
    if (player.shopLevel >= ctx.state.goal.shopLevel && netWorth >= ctx.state.goal.netWorth) {
      fxBus.emit('victory', '🏆 通关达成！');
      set({ player });
      // 延迟切换胜利画面，让 FxLayer 有时间渲染庆祝特效
      setTimeout(() => set({ gamePhase: 'victory' }), 200);
      return;
    }
  }

  // 合并当日自然流量新订单
  const orders = [...ctx.state.orders, ...ctx.newOrders];

  // 事件检查（新一天结束后、存档前）：暂停并展示事件
  let nextState: GameState = {
    ...ctx.state,
    orders,
    todayRevenue: ctx.todayRevenue,
    todayExpenses: ctx.todayExpenses,
    todayOrdersCount: ctx.todayOrdersCount,
    netWorthHistory: history,
  };
  // 随机非链事件（剧情链事件仅由下方按顺序驱动，避免乱序触发）
  const randomPool = EVENTS.filter((e) => !e.chainId);
  const triggeredEvent = tryTriggerEvent(nextState, randomPool);
  if (triggeredEvent && store.activeEvent === null) {
    // 写入冷却到期日（基于触发当天的 day），修复 BUG#2：事件可冷却后再次触发
    const eventCooldowns = { ...nextState.eventCooldowns };
    const expiry = nextCooldownDay(nextState, triggeredEvent);
    if (expiry !== undefined) eventCooldowns[triggeredEvent.id] = expiry;
    set({ ...nextState, activeEvent: triggeredEvent, gamePhase: 'event', eventCooldowns });
    return;
  }

  // 剧情链按序推进：取身份绑定链上的下一个可用事件，stage 升序、可重复触发
  const chainEvent = driveChainEvent(nextState, nextState.activeChainId, EVENTS);
  if (chainEvent && store.activeEvent === null) {
    const eventCooldowns = { ...nextState.eventCooldowns };
    const expiry = nextCooldownDay(nextState, chainEvent);
    if (expiry !== undefined) eventCooldowns[chainEvent.id] = expiry;
    set({ ...nextState, activeEvent: chainEvent, gamePhase: 'event', eventCooldowns });
    return;
  }

  // 新手引导完成奖励：完成 4 步（有货 / 有单 / 发过货 / 升到 Lv.2）且未发奖时一次性 +$500
  if (
    !nextState.onboardingRewardClaimed &&
    nextState.inventory.some((i) => i.quantity > 0) &&
    nextState.orders.some((o) => o.status !== 'pending') &&
    nextState.player.shopLevel >= 2
  ) {
    nextState = {
      ...nextState,
      onboardingRewardClaimed: true,
      player: { ...nextState.player, gold: Math.round((nextState.player.gold + 500) * 100) / 100 },
    };
    fxBus.emit('gold', '🎁 新手引导完成 +$500');
  }

  // 自动存档
  SaveSystem.autoSave(nextState).catch(() => {});
  set(nextState);
}
