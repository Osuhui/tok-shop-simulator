// ============================================================
// TokShop Simulator — 核心类型定义
// ============================================================

/** 区域ID */
export type RegionId = 'SEA' | 'UK' | 'US';

/** 商品风险等级 */
export type RiskLevel = 'genuine' | 'whiteLabel' | 'counterfeit';

/** 订单状态 */
export type OrderStatus =
  | 'pending'
  | 'processing'
  | 'shipped'
  | 'inTransit'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

/** 物流方式 */
export type ShippingType = 'self' | 'overseas';

/** 达人层级 */
export type InfluencerTier = 'nano' | 'micro' | 'mid' | 'macro' | 'mega';

/** 达人状态 */
export type InfluencerStatus = 'available' | 'negotiating' | 'contracted' | 'coolingDown' | 'poached';

/** 事件类型 */
export type EventType = 'risk' | 'opportunity' | 'neutral';

/** 效果目标 */
export type EffectTarget =
  | 'gold'
  | 'healthScore'
  | 'reputation'
  | 'inventory'
  | 'order'
  | 'unlock';

/** 游戏指令:统一效果总线,支持状态修改与剧情/系统触发(由 EffectBus 分发) */
export type GameCommand =
  | { type: 'gold'; value: number; target?: string; description?: string }
  | { type: 'healthScore'; value: number; target?: string; description?: string }
  | { type: 'reputation'; value: number; target?: string; description?: string }
  | { type: 'inventory'; target: string; value: number; description?: string }
  | { type: 'startStoryChain'; chainId: string; description?: string }
  | { type: 'grantCertificate'; certId: string; description?: string }
  | { type: 'unlockTask'; taskId: string; description?: string }
  | { type: 'influencerRelation'; id: string; delta: number; description?: string }
  | { type: 'sendMessage'; from: string; title: string; body: string; description?: string };

/** 游戏速度 */
export type GameSpeed = 'pause' | '1x' | '2x' | '4x';

/** 游戏阶段 */
export type GamePhase = 'menu' | 'playing' | 'event' | 'gameOver' | 'victory';

/** 仓库类型 */
export type WarehouseType = 'self' | 'overseas';

// ============================================================
// 玩家
// ============================================================

export interface PlayerState {
  gold: number;
  shopLevel: number;
  healthScore: number;
  reputation: number;
  currentRegion: RegionId;
  unlockedRegions: RegionId[];
  day: number;
  totalOrdersCompleted: number;
  totalRevenue: number;
  totalFines: number;
}

// ============================================================
// 商品 & 库存
// ============================================================

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  cost: number;
  basePrice: number;
  volume: number;
  weight: number;
  riskLevel: RiskLevel;
  certifications: string[];
  /** 选品趋势：影响自然流量系数与达人匹配意愿 */
  trend?: 'rising' | 'peak' | 'declining' | 'dead';
  regionAvailability: RegionId[];
  tags: string[];
  modelPath?: string;
  description: string;
  /** 采购到货天数（按区域） */
  sourcingLeadTime: Record<RegionId, number>;
}

export type ProductCategory =
  | 'electronics'
  | 'fashion'
  | 'beauty'
  | 'home'
  | 'toys'
  | 'snacks'
  | 'accessories'
  | 'sports'
  | 'pets';

export interface InventoryItem {
  productId: string;
  quantity: number;
  inboundQuantity: number;
  warehouseType: WarehouseType;
  storageFeePerDay?: number;
  /** 到货日期（游戏day） */
  arrivalDay?: number;
  /** 是否已上架（开张营业）：自然流量仅从已上架库存产生 */
  isListed?: boolean;
  /** 上架时使用的标题（用于展示） */
  listedTitle?: string;
}

// ============================================================
// 订单
// ============================================================

export interface Order {
  orderId: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  shippingCost: number;
  platformFeeRate: number;
  status: OrderStatus;
  shippingType: ShippingType;
  region: RegionId;
  createdAt: number;
  deadline: number;
  influencerId?: string;
  influencerCommission?: number;
  isCOD: boolean;
  expectedPaymentDay: number;
  /** 是否已结算（回款+成本计入 P&L 后标记，避免每日重复计入） */
  paid?: boolean;
}

// ============================================================
// 达人
// ============================================================

export interface Influencer {
  id: string;
  name: string;
  avatar: string;
  region: RegionId;
  followers: number;
  tier: InfluencerTier;
  categoryTags: string[];
  baseCommission: number;
  baseWillingness: number;
  minHealthRequired: number;
  bio: string;
  recentPerformance: number;
  baseOrderVolume: number;
  status: InfluencerStatus;
  cooldownRemaining: number;
}

// ============================================================
// 区域
// ============================================================

export interface RegionConfig {
  id: RegionId;
  name: string;
  nameCN: string;
  unlockRequirement: {
    shopLevel: number;
    totalRevenue: number;
  };
  customerPriceRange: [number, number];
  logisticsSpeed: number;
  paymentCycle: number;
  codRejectRate: number;
  returnRate: number;
  complianceDifficulty: number;
  hotCategories: string[];
  platformFeeRate: number;
  dailyOrganicTraffic: number;
  supportsCOD: boolean;
  requiresOverseasWarehouse: boolean;
  /** 跨境运费率（每kg / 每m³） */
  shippingRates: {
    perKg: number;
    perCubic: number;
  };
  /** 海外仓仓储费 / 件 / 天 */
  overseasStorageFee: number;
}

// ============================================================
// 随机事件
// ============================================================

export interface GameEvent {
  id: string;
  title: string;
  description: string;
  type: EventType;
  triggerCondition: EventCondition;
  choices: EventChoice[];
  cooldownDays: number;
  chainId?: string;
  chainStage?: number;
}

/** 证件 ID(L0 开店前置 / L1 运营进阶) */
export type CertId =
  | 'SELLER_VERIFY' | 'BUSINESS_LICENSE' | 'RECEIVING_ACCOUNT' | 'CUSTOMS_REG'
  | 'CE' | 'FCC' | 'FDA' | 'VAT' | 'TRADEMARK' | 'BRAND_AUTH';

/** 证件状态 */
export interface Certificate {
  id: CertId;
  name: string;
  layer: 'L0' | 'L1';
  region?: RegionId;
  cost: number;
  leadTimeDays: number;
  status: 'none' | 'applying' | 'active' | 'expired';
  appliedDay?: number;
  grantedDay?: number;
  unlocks: string[];
}

export interface EventCondition {
  region?: RegionId;
  minDay?: number;
  maxDay?: number;
  minHealthScore?: number;
  maxHealthScore?: number;
  minShopLevel?: number;
  hasProductId?: string;
  minPendingOrders?: number;
  minAuditRisk?: number; // 稽查风险达到阈值才触发（税务稽查事件）
  identityId?: string; // 仅特定身份可见（身份专属剧情）
  probability: number;
}

export interface EventChoice {
  id: string;
  text: string;
  successRate: number;
  cost?: number;
  successEffects: GameEffect[];
  failEffects: GameEffect[];
}

export type GameEffect = GameCommand;

// ============================================================
// 税务
// ============================================================
export interface TaxRule {
  region: RegionId;
  type: 'VAT' | 'SALES_TAX' | 'GST';
  rate: number;
  filingCycleDays: number;
}

export interface PlayerTaxState {
  taxOwed: number;
  lastFilingDay: number;
  vatRegistered: boolean;
  auditRisk: number; // 0..1 漏报累计稽查风险
  lastAuditDay: number;
}

// ============================================================
// 竞争对手
// ============================================================
export type CompetitorTier = 'budget' | 'mid' | 'premium';

export interface Competitor {
  id: string;
  name: string;
  tier: CompetitorTier;
  mainCategory: ProductCategory;
  priceStrategy: 'low' | 'mid' | 'premium';
  marketShare: number; // 0..1
  aggressive: number;  // 0..1
  poachedInfluencerIds: string[];
}

// ============================================================
// 员工
// ============================================================
export type EmployeeRole = 'cs' | 'ops' | 'packer';

export interface Employee {
  id: string;
  role: EmployeeRole;
  name: string;
  salary: number;
  hiredDay: number;
}

// ============================================================
// 营销
// ============================================================
export type CampaignType = 'ads' | 'seo' | 'social' | 'platformEvent';

export interface MarketingCampaign {
  id: string;
  type: CampaignType;
  spend: number;
  startedDay: number;
  durationDays: number;
  monthly: boolean;
}

// ============================================================
// 贷款
// ============================================================
export type LoanType = 'payday' | 'bank';

export interface Loan {
  id: string;
  type: LoanType;
  principal: number;
  repayAmount: number;
  dueDay: number;
  takenDay: number;
}

// ============================================================
// 物流承运商
// ============================================================
export type CarrierId = 'rabbit' | 'eagle' | 'whale';

export interface Carrier {
  id: CarrierId;
  name: string;
  speedDays: number;
  costMultiplier: number;
  reliability: number;
  regions: RegionId[];
}

// ============================================================
// 评价 / 复购
// ============================================================
export type ReviewSentiment = 'positive' | 'neutral' | 'negative';

export interface Review {
  id: string;
  orderId: string;
  sentiment: ReviewSentiment;
  day: number;
  comment: string;
}

// ============================================================
// 身份 / 难度
// ============================================================
export type IdentityId = 'entrepreneur' | 'veteran' | 'student';
export type DifficultyId = 'easy' | 'normal' | 'hard';

export interface IdentityConfig {
  id: IdentityId;
  name: string;
  startGold: number;
  startShopLevel: number;
  startReputation: number;
  loan?: { amount: number; dueInDays: number; repay: number };
  purchaseDiscount?: number;
  influencerWillingnessBonus?: number;
  preownedCerts: CertId[];
  storyChainId: string;
}

export interface DifficultyConfig {
  id: DifficultyId;
  blockOpening: boolean;
  requiredBeforeOpening: CertId[];
  gracePeriodDays: number;
  startGoldMultiplier: number;
  penaltyMultiplier: number;
}

// ============================================================
// 通知
// ============================================================

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'danger';
  timestamp: number;
  read: boolean;
}

// ============================================================
// 经营目标（按难度配置，用于看板进度与通关判定）
// ============================================================
export interface GameGoal {
  day: number;                 // 目标天数（在该天前达成等级+净资产即通关）
  shopLevel: number;           // 目标店铺等级
  netWorth: number;            // 目标净资产（现金+库存-待还贷款）
  label: string;               // 目标一句话描述
}

// ============================================================
// 全局游戏状态
// ============================================================

export interface GameState {
  player: PlayerState;
  inventory: InventoryItem[];
  orders: Order[];
  influencers: Influencer[];
  notifications: Notification[];
  gameSpeed: GameSpeed;
  gamePhase: GamePhase;
  activePanel: string | null;
  activeScene: string;
  todayRevenue: number;
  todayExpenses: number;
  todayOrdersCount: number;
  eventCooldowns: Record<string, number>;   // eventId -> 可再次触发（冷却到期）的游戏 day
  certificates: Certificate[];               // 已办理 / 办理中的证件
  competitors: Competitor[];                 // 竞争对手 AI
  competitionPressure: number;                 // 自然流量受竞品压制系数(0..1)
  employees: Employee[];                    // 员工
  tax: PlayerTaxState;                      // 税务状态
  campaigns: MarketingCampaign[];           // 营销活动
  loans: Loan[];                            // 贷款
  reviews: Review[];                        // 评价 / 复购
  carrierId: CarrierId;                     // 当前物流承运商
  legalSubscribed: boolean;                 // 法务月费订阅
  season: number;                           // 当前季节索引（由天数推导）
  hotCategories: ProductCategory[];         // 当季热门品类（趋势 / 季节驱动）
  identityId?: IdentityId;
  difficultyId?: DifficultyId;
  mainCategory?: ProductCategory;
  goal?: GameGoal;                        // 当前档位的经营目标（用于进度展示与通关判定）
  activeChainId?: string;                 // 玩家当前身份绑定的剧情链（用于按序推进）
  netWorthHistory?: number[];             // 近 7 日净资产快照（用于看板"预计剩余天数"推算）
}

// ============================================================
// 存档
// ============================================================

export interface SaveData {
  version: string;
  timestamp: number;
  slotName: string;
  state: GameState;
}

// ============================================================
// 初始状态常量
// ============================================================

export const INITIAL_PLAYER_STATE: PlayerState = {
  gold: 2000,
  shopLevel: 1,
  healthScore: 5.0,
  reputation: 50,
  currentRegion: 'SEA',
  unlockedRegions: ['SEA'],
  day: 1,
  totalOrdersCompleted: 0,
  totalRevenue: 0,
  totalFines: 0,
};

export const SPEED_LABELS: Record<GameSpeed, string> = {
  pause: '⏸️ 暂停',
  '1x': '▶️ 1x',
  '2x': '⏩ 2x',
  '4x': '⏩⏩ 4x',
};

export const SPEED_DAY_DURATION_MS: Record<Exclude<GameSpeed, 'pause'>, number> = {
  '1x': 30_000,
  '2x': 15_000,
  '4x': 7_500,
};
