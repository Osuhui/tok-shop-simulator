// ============================================================
// 随机事件库 — 至少15个事件
// ============================================================
import type { GameEvent } from '../types';

export const EVENTS: GameEvent[] = [
  // ===== 风险事件 =====
  {
    id: 'evt_fake_goods',
    title: '⚠️ 假货小黑屋',
    description: '系统检测到你售卖的 "Stan-Up Mega Cup" 与某知名保温杯品牌外观高度相似，平台已发出警告。',
    type: 'risk',
    triggerCondition: {
      region: 'US',
      minDay: 5,
      hasProductId: 'prod_stanup_cup',
      probability: 0.08,
    },
    choices: [
      {
        id: 'submit_fake',
        text: 'A. 提交虚假授权书（5%概率通过，95%永久封店）',
        successRate: 0.05,
        successEffects: [
          { type: 'healthScore', target: 'player', value: 0.5, description: '侥幸通过，健康分+0.5' },
        ],
        failEffects: [
          { type: 'gold', target: 'player', value: -99999, description: '永久封店！游戏结束' },
        ],
      },
      {
        id: 'accept_fine',
        text: 'B. 认罚下架并缴纳 $500 罚款',
        successRate: 1.0,
        cost: 500,
        successEffects: [
          { type: 'healthScore', target: 'player', value: -0.5, description: '健康分 -0.5' },
          { type: 'gold', target: 'player', value: -500, description: '罚款 $500' },
        ],
        failEffects: [],
      },
      {
        id: 'find_service',
        text: 'C. 找服务商"强开链接"（$800，可能遭遇连带欺诈）',
        successRate: 0.4,
        cost: 800,
        successEffects: [
          { type: 'gold', target: 'player', value: -800, description: '花费 $800，链接恢复' },
        ],
        failEffects: [
          { type: 'gold', target: 'player', value: -1500, description: '遭遇欺诈，损失 $1500' },
          { type: 'healthScore', target: 'player', value: -1.0, description: '健康分 -1.0' },
        ],
      },
    ],
    cooldownDays: 20,
  },
  {
    id: 'evt_bad_quality',
    title: '🚫 货不对板差评风暴',
    description: '供应链工厂在批量发货时偷工减料，大批用户收到货后给出一星差评。店铺健康分暴跌！',
    type: 'risk',
    triggerCondition: {
      minDay: 10,
      minPendingOrders: 5,
      probability: 0.06,
    },
    choices: [
      {
        id: 'refund_all',
        text: 'A. 全额退款+赔偿（每单 $5，恢复部分声誉）',
        successRate: 1.0,
        successEffects: [
          { type: 'healthScore', target: 'player', value: 0.8, description: '主动担责，健康分+0.8' },
          { type: 'reputation', target: 'player', value: 10, description: '声誉+10' },
        ],
        failEffects: [],
      },
      {
        id: 'ignore',
        text: 'B. 忽略差评，继续销售',
        successRate: 1.0,
        successEffects: [
          { type: 'healthScore', target: 'player', value: -1.5, description: '健康分 -1.5' },
          { type: 'reputation', target: 'player', value: -20, description: '声誉 -20' },
        ],
        failEffects: [],
      },
    ],
    cooldownDays: 15,
  },
  {
    id: 'evt_customs_seizure',
    chainId: 'COMPLIANCE_CHAIN',
    chainStage: 0,
    title: '🛃 海关扣货',
    description: '一批发往英国的商品被海关扣留，原因是缺少 CE 认证文件。',
    type: 'risk',
    triggerCondition: {
      region: 'UK',
      minDay: 8,
      probability: 0.07,
    },
    choices: [
      {
        id: 'pay_tariff',
        text: 'A. 补交关税和罚款（$300）',
        successRate: 1.0,
        cost: 300,
        successEffects: [
          { type: 'gold', target: 'player', value: -300, description: '支付 $300 关税和罚款' },
        ],
        failEffects: [],
      },
      {
        id: 'abandon',
        text: 'B. 弃货（损失库存，但避免更大损失）',
        successRate: 1.0,
        successEffects: [
          { type: 'reputation', target: 'player', value: -10, description: '声誉 -10（延迟发货）' },
        ],
        failEffects: [],
      },
    ],
    cooldownDays: 12,
  },
  {
    id: 'evt_shipping_delay',
    title: '🌧️ 物流暴雨延误',
    description: '东南亚地区遭遇暴雨，所有运输中的订单将延迟 3 天到达。',
    type: 'risk',
    triggerCondition: {
      region: 'SEA',
      minDay: 3,
      probability: 0.10,
    },
    choices: [
      {
        id: 'wait',
        text: 'A. 耐心等待（发货截止时间延长）',
        successRate: 1.0,
        successEffects: [],
        failEffects: [],
      },
      {
        id: 'express',
        text: 'B. 改发加急物流（$200 紧急处理费）',
        successRate: 1.0,
        cost: 200,
        successEffects: [
          { type: 'reputation', target: 'player', value: 5, description: '快速响应，声誉+5' },
        ],
        failEffects: [],
      },
    ],
    cooldownDays: 10,
  },
  {
    id: 'evt_competitor_attack',
    title: '👎 竞品恶意差评',
    description: '竞争对手在你的店铺刷了多条恶意一星差评，平台已标记你的店铺进行审查。',
    type: 'risk',
    triggerCondition: {
      minShopLevel: 3,
      minDay: 15,
      probability: 0.05,
    },
    choices: [
      {
        id: 'report',
        text: 'A. 向平台申诉（70%概率成功）',
        successRate: 0.7,
        successEffects: [
          { type: 'healthScore', target: 'player', value: 0.3, description: '申诉成功，差评移除' },
        ],
        failEffects: [
          { type: 'healthScore', target: 'player', value: -0.8, description: '申诉失败，审查扣分' },
        ],
      },
      {
        id: 'ignore_attack',
        text: 'B. 不予理会，专注做好服务',
        successRate: 1.0,
        successEffects: [
          { type: 'healthScore', target: 'player', value: -0.3, description: '轻微影响' },
        ],
        failEffects: [],
      },
    ],
    cooldownDays: 20,
  },

  // ===== 机会事件 =====
  {
    id: 'evt_viral_video',
    title: '🔥 超级爆单危机！',
    description: '某合作的万粉达人视频突然进入系统流量池，单日播放量破 500 万，瞬间产生大量订单！但你的现金流可能无法支撑垫资采购。',
    type: 'opportunity',
    triggerCondition: {
      minDay: 7,
      minShopLevel: 2,
      probability: 0.04,
    },
    choices: [
      {
        id: 'borrow_loan',
        text: 'A. 向"极速贷"借高利贷（借 $5000，30天后还 $7000）',
        successRate: 1.0,
        successEffects: [
          { type: 'gold', target: 'player', value: 5000, description: '获得 $5000 贷款' },
          { type: 'reputation', target: 'player', value: 15, description: '成功履约，声誉大涨 +15' },
        ],
        failEffects: [],
      },
      {
        id: 'find_investor',
        text: 'B. 寻找投资人让出 20% 店铺股份（获得 $10000，永久降低 20% 收入）',
        successRate: 0.8,
        successEffects: [
          { type: 'gold', target: 'player', value: 10000, description: '获得 $10000 投资' },
          { type: 'reputation', target: 'player', value: 30, description: '成功扩张，声誉大涨 +30' },
        ],
        failEffects: [
          { type: 'healthScore', target: 'player', value: -2.0, description: '投资人撤资，店铺崩溃' },
        ],
      },
      {
        id: 'cancel_orders',
        text: 'C. 取消超额订单（安全但损失巨大）',
        successRate: 1.0,
        successEffects: [
          { type: 'healthScore', target: 'player', value: -1.0, description: '健康分 -1.0（大量取消）' },
          { type: 'reputation', target: 'player', value: -25, description: '声誉 -25' },
        ],
        failEffects: [],
      },
    ],
    cooldownDays: 25,
  },
  {
    id: 'evt_free_promotion',
    title: '🌟 网红自发带货',
    description: '一位小网红自发购买了你的产品并在社交媒体上发布了正面评价，带来了额外流量！',
    type: 'opportunity',
    triggerCondition: {
      minDay: 3,
      minHealthScore: 3.5,
      probability: 0.08,
    },
    choices: [
      {
        id: 'boost',
        text: 'A. 趁机投流推广（$300 广告费，放大效果）',
        successRate: 0.85,
        cost: 300,
        successEffects: [
          { type: 'reputation', target: 'player', value: 20, description: '声誉 +20' },
          { type: 'gold', target: 'player', value: 800, description: '额外收入 $800' },
        ],
        failEffects: [
          { type: 'gold', target: 'player', value: -300, description: '广告效果不佳' },
        ],
      },
      {
        id: 'organic_growth',
        text: 'B. 顺其自然（免费获得小幅增长）',
        successRate: 1.0,
        successEffects: [
          { type: 'reputation', target: 'player', value: 5, description: '声誉 +5' },
        ],
        failEffects: [],
      },
    ],
    cooldownDays: 10,
  },
  {
    id: 'evt_supplier_discount',
    title: '🏭 供应商限时折扣',
    description: '你的主要供应商正在清仓，所有商品采购价 7 折，仅限今日！',
    type: 'opportunity',
    triggerCondition: {
      minDay: 5,
      probability: 0.06,
    },
    choices: [
      {
        id: 'bulk_buy',
        text: 'A. 趁折扣大量采购（投入 $1000-$5000 任意金额）',
        successRate: 1.0,
        successEffects: [
          { type: 'gold', target: 'player', value: 500, description: '节省了 $500 采购成本（等价收益）' },
        ],
        failEffects: [],
      },
      {
        id: 'skip_discount',
        text: 'B. 不采购，保持现金流',
        successRate: 1.0,
        successEffects: [],
        failEffects: [],
      },
    ],
    cooldownDays: 15,
  },
  {
    id: 'evt_platform_feature',
    title: '🏆 平台首页推荐',
    description: '你的店铺因优质服务被平台选中，将在首页"新锐店铺"板块展示 3 天！',
    type: 'opportunity',
    triggerCondition: {
      minHealthScore: 4.5,
      minDay: 10,
      probability: 0.05,
    },
    choices: [
      {
        id: 'prepare_stock',
        text: 'A. 紧急备货以应对流量（建议库存 > 100件）',
        successRate: 1.0,
        successEffects: [
          { type: 'reputation', target: 'player', value: 15, description: '声誉 +15' },
          { type: 'gold', target: 'player', value: 1200, description: '推荐期额外收入 $1200' },
        ],
        failEffects: [],
      },
      {
        id: 'no_action',
        text: 'B. 不做额外准备',
        successRate: 1.0,
        successEffects: [
          { type: 'reputation', target: 'player', value: 5, description: '小幅增长' },
          { type: 'gold', target: 'player', value: 300, description: '额外收入 $300' },
        ],
        failEffects: [],
      },
    ],
    cooldownDays: 20,
  },
  {
    id: 'evt_currency_boost',
    title: '💱 汇率利好',
    description: '美元兑人民币汇率突然上涨 5%，你的跨境收入将获得额外收益！',
    type: 'opportunity',
    triggerCondition: {
      region: 'US',
      minDay: 5,
      probability: 0.06,
    },
    choices: [
      {
        id: 'cash_out',
        text: 'A. 提前回笼资金（加速回款 $1000）',
        successRate: 1.0,
        successEffects: [
          { type: 'gold', target: 'player', value: 1050, description: '汇率优势 +$1050' },
        ],
        failEffects: [],
      },
      {
        id: 'wait_normal',
        text: 'B. 正常结算',
        successRate: 1.0,
        successEffects: [
          { type: 'gold', target: 'player', value: 200, description: '小幅汇率收益 +$200' },
        ],
        failEffects: [],
      },
    ],
    cooldownDays: 12,
  },

  // ===== 中性事件 =====
  {
    id: 'evt_platform_policy',
    chainId: 'COMPLIANCE_CHAIN',
    chainStage: 1,
    title: '📜 平台政策突变',
    description: '平台突然宣布将东南亚区平台佣金率从 5% 提高到 8%，同时新增了商品类目限制。',
    type: 'neutral',
    triggerCondition: {
      region: 'SEA',
      minDay: 12,
      probability: 0.06,
    },
    choices: [
      {
        id: 'comply',
        text: 'A. 接受新规（调整定价策略）',
        successRate: 1.0,
        successEffects: [
          { type: 'reputation', target: 'player', value: 5, description: '合规经营，声誉+5' },
        ],
        failEffects: [],
      },
      {
        id: 'switch_region',
        text: 'B. 转向其他区域市场（如果已解锁）',
        successRate: 1.0,
        successEffects: [
          { type: 'healthScore', target: 'player', value: -0.2, description: '切换成本，健康分微降' },
        ],
        failEffects: [],
      },
    ],
    cooldownDays: 18,
  },
  {
    id: 'evt_logistics_price_hike',
    title: '📦 物流商涨价',
    description: '"兔子速递"宣布跨境运费上涨 15%，理由是燃油附加费增加。',
    type: 'neutral',
    triggerCondition: {
      minDay: 8,
      probability: 0.07,
    },
    choices: [
      {
        id: 'accept_hike',
        text: 'A. 接受涨价（每单成本增加）',
        successRate: 1.0,
        successEffects: [],
        failEffects: [],
      },
      {
        id: 'switch_carrier',
        text: 'B. 更换物流商（$500 切换费，但运费降低 20%）',
        successRate: 0.7,
        cost: 500,
        successEffects: [
          { type: 'gold', target: 'player', value: -500, description: '切换费用 $500' },
        ],
        failEffects: [
          { type: 'gold', target: 'player', value: -500, description: '切换失败，费用不退' },
          { type: 'reputation', target: 'player', value: -5, description: '切换期间延迟' },
        ],
      },
    ],
    cooldownDays: 15,
  },
  {
    id: 'evt_influencer_poach',
    title: '🔄 达人跳单',
    description: '一位已合作的达人被竞品以更高佣金挖走，正在履约中的订单可能受影响。',
    type: 'neutral',
    triggerCondition: {
      minDay: 6,
      probability: 0.05,
    },
    choices: [
      {
        id: 'match_offer',
        text: 'A. 匹配竞品佣金（提高至 30%）',
        successRate: 0.7,
        successEffects: [
          { type: 'reputation', target: 'player', value: 5, description: '达人回心转意' },
        ],
        failEffects: [
          { type: 'gold', target: 'player', value: -300, description: '谈判成本' },
        ],
      },
      {
        id: 'let_go',
        text: 'B. 放手，另找新达人',
        successRate: 1.0,
        successEffects: [],
        failEffects: [],
      },
    ],
    cooldownDays: 12,
  },
  {
    id: 'evt_new_trend',
    title: '📈 新品类爆火',
    description: '社交媒体上突然兴起了一股新的消费潮流，与你的部分商品品类高度相关！',
    type: 'neutral',
    triggerCondition: {
      minDay: 4,
      probability: 0.08,
    },
    choices: [
      {
        id: 'chase_trend',
        text: 'A. 快速跟进潮流（采购相关品类商品）',
        successRate: 0.65,
        successEffects: [
          { type: 'gold', target: 'player', value: 600, description: '抓住红利 +$600' },
          { type: 'reputation', target: 'player', value: 10, description: '潮流先锋 +10' },
        ],
        failEffects: [
          { type: 'gold', target: 'player', value: -300, description: '潮流已过，库存积压' },
        ],
      },
      {
        id: 'stay_course',
        text: 'B. 保持现有策略',
        successRate: 1.0,
        successEffects: [],
        failEffects: [],
      },
    ],
    cooldownDays: 14,
  },

  // ===== 税务剧情 =====
  {
    id: 'evt_tax_filing_reminder',
    chainId: 'TAX_CHAIN',
    chainStage: 0,
    title: '📅 申报期提醒',
    description: '你的税务申报周期已临近，系统提示：按时申报可清零稽查风险，长期拖延不仅招致稽查，还会加收滞纳金。',
    type: 'neutral',
    triggerCondition: {
      minDay: 10,
      probability: 0.06,
    },
    choices: [
      {
        id: 'file_now',
        text: 'A. 立即前往"税务"面板申报缴纳',
        successRate: 1.0,
        successEffects: [
          { type: 'reputation', target: 'player', value: 3, description: '合规经营，声誉+3' },
        ],
        failEffects: [],
      },
      {
        id: 'later',
        text: 'B. 暂缓，先忙别的',
        successRate: 1.0,
        successEffects: [],
        failEffects: [],
      },
    ],
    cooldownDays: 12,
  },
  {
    id: 'evt_tax_audit',
    chainId: 'TAX_CHAIN',
    chainStage: 1,
    title: '🧾 税务稽查上门',
    description: '税务局稽查人员找上门，称你长期未申报流转税，怀疑存在偷逃税行为。账目会被彻查，后果严重。',
    type: 'risk',
    triggerCondition: {
      minDay: 20,
      minAuditRisk: 0.5,
      probability: 0.5,
    },
    choices: [
      {
        id: 'cooperate',
        text: 'A. 配合稽查并补税罚款（$1500）',
        successRate: 1.0,
        cost: 1500,
        successEffects: [
          { type: 'healthScore', target: 'player', value: -0.5, description: '健康分 -0.5' },
        ],
        failEffects: [],
      },
      {
        id: 'evade',
        text: 'B. 抗拒稽查，销毁账目（高风险）',
        successRate: 0.1,
        successEffects: [
          { type: 'reputation', target: 'player', value: 5, description: '暂时蒙混过关' },
        ],
        failEffects: [
          { type: 'gold', target: 'player', value: -99999, description: '账户被冻结，游戏结束' },
        ],
      },
    ],
    cooldownDays: 30,
  },
  {
    id: 'evt_tax_audit_aftermath',
    chainId: 'TAX_CHAIN',
    chainStage: 2,
    title: '🚨 稽查后续：补缴与整改',
    description: '稽查人员留下限期补缴通知，并加收罚款与滞纳金。若继续拖延，下一次稽查可能直接冻结账户。',
    type: 'risk',
    triggerCondition: {
      minDay: 20,
      minAuditRisk: 0.5,
      probability: 0.5,
    },
    choices: [
      {
        id: 'remediate',
        text: 'A. 立即补缴+整改（罚款 $2000，健康分-0.5、声誉-10，务必尽快申报）',
        successRate: 1.0,
        cost: 2000,
        successEffects: [
          { type: 'healthScore', target: 'player', value: -0.5, description: '整改压力，健康分-0.5' },
          { type: 'reputation', target: 'player', value: -10, description: '声誉-10' },
          { type: 'sendMessage', from: '税务局', title: '稽查整改通知', body: '已记录你的补缴与整改，请务必在申报期内完成税款缴纳，否则将面临更严稽查。' },
        ],
        failEffects: [],
      },
      {
        id: 'stall',
        text: 'B. 拖延不理（健康分-1.0、声誉-15，风险持续累积）',
        successRate: 1.0,
        successEffects: [
          { type: 'healthScore', target: 'player', value: -1.0, description: '健康分-1.0' },
          { type: 'reputation', target: 'player', value: -15, description: '声誉-15' },
        ],
        failEffects: [],
      },
    ],
    cooldownDays: 25,
  },

  // ===== 身份专属剧情：创业者·供应链链 =====
  {
    id: 'evt_ent_supplier_breach',
    chainId: 'chain_supply_chain',
    chainStage: 0,
    title: '🏭 工厂突然毁约',
    description: '你初创店铺的主力货源工厂因环保整顿突然停工，已下定的 200 件商品无法交付，买家催单在即。',
    type: 'risk',
    triggerCondition: {
      identityId: 'entrepreneur',
      minDay: 6,
      probability: 0.09,
    },
    choices: [
      {
        id: 'rush_source',
        text: 'A. 连夜找备用工厂加价赶工（$600，保住订单）',
        successRate: 0.8,
        cost: 600,
        successEffects: [
          { type: 'gold', target: 'player', value: -600, description: '紧急调货 $600' },
          { type: 'reputation', target: 'player', value: 8, description: '履约口碑 +8' },
        ],
        failEffects: [
          { type: 'healthScore', target: 'player', value: -1.0, description: '还是延期了，健康分 -1' },
        ],
      },
      {
        id: 'refund_buyers',
        text: 'B. 退款认栽，另寻长期货源',
        successRate: 1.0,
        successEffects: [
          { type: 'healthScore', target: 'player', value: -0.5, description: '健康分 -0.5' },
        ],
        failEffects: [],
      },
    ],
    cooldownDays: 18,
  },
  {
    id: 'evt_ent_logistics_partner',
    chainId: 'chain_supply_chain',
    chainStage: 1,
    title: '🤝 物流商抛来橄榄枝',
    description: '一家区域性物流商看中你的增长潜力，愿意以低于市场 20% 的运费长期合作，但需预付季度保证金。',
    type: 'opportunity',
    triggerCondition: {
      identityId: 'entrepreneur',
      minDay: 20,
      minShopLevel: 2,
      probability: 0.07,
    },
    choices: [
      {
        id: 'sign_deal',
        text: 'A. 签约锁定优惠运费（预付 $800）',
        successRate: 0.9,
        cost: 800,
        successEffects: [
          { type: 'gold', target: 'player', value: -800, description: '预付保证金 $800' },
          { type: 'reputation', target: 'player', value: 5, description: '供应链更稳定 +5' },
        ],
        failEffects: [
          { type: 'gold', target: 'player', value: -800, description: '物流商跑路，保证金打水漂' },
        ],
      },
      {
        id: 'stay_flexible',
        text: 'B. 保持灵活，不签长约',
        successRate: 1.0,
        successEffects: [],
        failEffects: [],
      },
    ],
    cooldownDays: 20,
  },

  // ===== 身份专属剧情：老手卖家·规模化增长链 =====
  {
    id: 'evt_vet_scale_bottleneck',
    chainId: 'chain_business_growth',
    chainStage: 0,
    title: '📊 增长瓶颈期',
    description: '你带着多年经验入场，但团队管理开始吃力：客服响应慢、库存周转卡顿，规模不增反降。',
    type: 'neutral',
    triggerCondition: {
      identityId: 'veteran',
      minDay: 8,
      minShopLevel: 2,
      probability: 0.09,
    },
    choices: [
      {
        id: 'hire_team',
        text: 'A. 招募员工（客服/运营/打包）分担压力',
        successRate: 1.0,
        successEffects: [
          { type: 'reputation', target: 'player', value: 6, description: '服务升级，声誉 +6' },
        ],
        failEffects: [],
      },
      {
        id: 'solo_grind',
        text: 'B. 自己硬扛，省下成本',
        successRate: 1.0,
        successEffects: [
          { type: 'gold', target: 'player', value: 300, description: '省下薪资 +$300' },
        ],
        failEffects: [
          { type: 'healthScore', target: 'player', value: -0.4, description: '精力透支，健康分 -0.4' },
        ],
      },
    ],
    cooldownDays: 16,
  },
  {
    id: 'evt_vet_brand_deal',
    chainId: 'chain_business_growth',
    chainStage: 1,
    title: '🏷️ 品牌收购邀约',
    description: '一个成熟品牌方看中你的运营能力，提出由你代运营其东南亚旗舰店，分成 30%，但需先注册商标防跟卖。',
    type: 'opportunity',
    triggerCondition: {
      identityId: 'veteran',
      minDay: 25,
      minShopLevel: 4,
      probability: 0.06,
    },
    choices: [
      {
        id: 'register_then_deal',
        text: 'A. 先注册商标，再签代运营（$800 注册费）',
        successRate: 0.85,
        cost: 800,
        successEffects: [
          { type: 'gold', target: 'player', value: 2000, description: '代运营首笔分成 +$2000' },
          { type: 'reputation', target: 'player', value: 12, description: '品牌背书，声誉 +12' },
        ],
        failEffects: [
          { type: 'gold', target: 'player', value: -800, description: '商标驳回，注册费不退' },
        ],
      },
      {
        id: 'decline_deal',
        text: 'B. 婉拒，专注自有店铺',
        successRate: 1.0,
        successEffects: [
          { type: 'reputation', target: 'player', value: 3, description: '稳健经营 +3' },
        ],
        failEffects: [],
      },
    ],
    cooldownDays: 25,
  },

  // ===== 身份专属剧情：学生党·校园创业链 =====
  {
    id: 'evt_stu_campus_fair',
    chainId: 'chain_campus',
    chainStage: 0,
    title: '🎓 校园创业市集',
    description: '学校创业园办市集，邀请你摆摊卖货攒人气。摊位免费，但会占用你两天复习时间。',
    type: 'opportunity',
    triggerCondition: {
      identityId: 'student',
      minDay: 5,
      probability: 0.1,
    },
    choices: [
      {
        id: 'set_up_booth',
        text: 'A. 摆摊！线上线下联动引流',
        successRate: 0.9,
        successEffects: [
          { type: 'reputation', target: 'player', value: 10, description: '校园知名度 +10' },
          { type: 'gold', target: 'player', value: 200, description: '现场零售 +$200' },
        ],
        failEffects: [
          { type: 'healthScore', target: 'player', value: -0.3, description: '耽误复习，状态 -0.3' },
        ],
      },
      {
        id: 'study_first',
        text: 'B. 先备考，下回再说',
        successRate: 1.0,
        successEffects: [],
        failEffects: [],
      },
    ],
    cooldownDays: 15,
  },
  {
    id: 'evt_stu_classmate_partner',
    chainId: 'chain_campus',
    chainStage: 1,
    title: '👯 同学想入伙',
    description: '一位学设计的同学看你生意不错，提出用课余时间帮你做详情页和短视频，换取少量分成。',
    type: 'neutral',
    triggerCondition: {
      identityId: 'student',
      minDay: 18,
      probability: 0.08,
    },
    choices: [
      {
        id: 'team_up',
        text: 'A. 组队！用分成换设计支持',
        successRate: 1.0,
        successEffects: [
          { type: 'reputation', target: 'player', value: 8, description: '内容升级，声誉 +8' },
        ],
        failEffects: [],
      },
      {
        id: 'stay_solo',
        text: 'B. 自己来，不分股份',
        successRate: 1.0,
        successEffects: [
          { type: 'gold', target: 'player', value: 150, description: '省下分成 +$150' },
        ],
        failEffects: [],
      },
    ],
    cooldownDays: 18,
  },

  // ===== 筹备开店链（OPENING_CHAIN）：把"办齐开业证件"剧情化，弹窗一键申请 =====
  {
    id: 'evt_open_seller_verify',
    chainId: 'OPENING_CHAIN',
    chainStage: 0,
    title: '🪪 平台邀你实名开店',
    description: 'TokShop 招商经理发来开店邀请：先完成卖家实名认证——这是解锁收款与清关的前提，也是跨境经营的第一步。',
    type: 'neutral',
    triggerCondition: { openingCert: 'SELLER_VERIFY', minDay: 1, probability: 0.95 },
    choices: [
      {
        id: 'apply',
        text: 'A. 立即实名认证（免费 · 1 天办结）',
        successRate: 1.0,
        successEffects: [
          { type: 'applyCertificate', certId: 'SELLER_VERIFY', description: '已提交实名认证申请' },
        ],
        failEffects: [],
      },
    ],
    cooldownDays: 2,
  },
  {
    id: 'evt_open_business_license',
    chainId: 'OPENING_CHAIN',
    chainStage: 1,
    title: '📄 营业执照待办提醒',
    description: '实名已过，下一步是跨境主体营业执照。它提升店铺可信度，也是正规清关与平台活动的敲门砖。',
    type: 'neutral',
    triggerCondition: { openingCert: 'BUSINESS_LICENSE', minDay: 1, probability: 0.95 },
    choices: [
      {
        id: 'apply',
        text: 'A. 立即申请营业执照（$200 · 5 天办结）',
        successRate: 1.0,
        successEffects: [
          { type: 'applyCertificate', certId: 'BUSINESS_LICENSE', description: '已提交营业执照申请' },
        ],
        failEffects: [],
      },
    ],
    cooldownDays: 2,
  },
  {
    id: 'evt_open_receiving_account',
    chainId: 'OPENING_CHAIN',
    chainStage: 2,
    title: '🏦 跨境收款账户待开通',
    description: '要收到海外买家的货款，得先绑定跨境收款账户（如 Payoneer / 万里汇）。这一步免费，当天就能搞定。',
    type: 'neutral',
    triggerCondition: { openingCert: 'RECEIVING_ACCOUNT', minDay: 1, probability: 0.95 },
    choices: [
      {
        id: 'apply',
        text: 'A. 立即开通收款账户（免费 · 1 天办结）',
        successRate: 1.0,
        successEffects: [
          { type: 'applyCertificate', certId: 'RECEIVING_ACCOUNT', description: '已提交收款账户开通申请' },
        ],
        failEffects: [],
      },
    ],
    cooldownDays: 2,
  },
  {
    id: 'evt_open_customs_reg',
    chainId: 'OPENING_CHAIN',
    chainStage: 3,
    title: '🛃 海关进出口备案待办',
    description: '最后一步：海关进出口收发货人备案。正规清关的前提，办齐它你的跨境小店就能正式开门营业了。',
    type: 'neutral',
    triggerCondition: { openingCert: 'CUSTOMS_REG', minDay: 1, probability: 0.95 },
    choices: [
      {
        id: 'apply',
        text: 'A. 立即办理海关备案（$100 · 3 天办结）',
        successRate: 1.0,
        successEffects: [
          { type: 'applyCertificate', certId: 'CUSTOMS_REG', description: '已提交海关备案申请' },
        ],
        failEffects: [],
      },
    ],
    cooldownDays: 2,
  },
];
