# 《TokShop Simulator》全流程内容设计

> 配套 `plans/Execution_Plan.md`(Sprint 3 内容阶段)。
> **目标**:覆盖跨境小店**全流程**,每个业务节点以"故事化"方式巧妙插入。
> 所有系统通过 Sprint 0 的 `DayProcessor` / `EffectBus` / `StoryEngine` 接入(新增系统 = 注册一个 processor + 加一份 data,核心零改动)。

## 一、办证系统 `CertificateSystem`

### 1.1 两层证件模型
- **L0 开店前置证件**:开店必经,作为"筹备开店"剧情链的一部分(也是新手引导)。
- **L1 运营进阶证件**:运营中由事件/邮件触发办理。

### 1.2 L0 开店前置证件(全类别覆盖 + 身份差异化 + 难度可选)

**基础必备(所有跨境店铺)**:`SELLER_VERIFY` 入驻资质、`BUSINESS_LICENSE` 营业执照、`RECEIVING_ACCOUNT` 收款账户、`CUSTOMS_REG` 海关备案/进出口权。

**品类特定资质(依主营品类动态生成,确保全类别覆盖)**:
| 主营品类 | 所需额外资质 |
|---|---|
| 食品 `snacks` | 食品经营许可证 / 食品安全备案 |
| 美妆 `beauty` | 化妆品备案(药监局)、成分合规声明 |
| 电子 `electronics` | 质检报告 / 3C 或 CE·FCC(按区域) |
| 玩具 `toys` | 儿童产品安全认证(CPC / EN71) |
| 宠物 `pets` | 宠物食品/用品合规 |
| 家居/时尚/运动/配件 | 基础质检 + 材质合规声明 |

> 玩家选定主营品类即决定要办的证,L0 清单 = **基础必备 + 品类资质 − 角色已持有**,体现"真实开店"的复杂度。

**身份差异化(L0 动态减项,让玩家感同身受)**:
| 身份 | 已自带资质 | L0 额外步骤 |
|---|---|---|
| 辞职创业者 | 营业执照(企业) | 入驻 + 收款 + 海关 |
| 国内电商老手 | 海关备案 + 供应链关系(采购 9 折) | 入驻 + 收款 |
| 大学生创业 | 无 | 先办个体工商户营业执照 + 入驻 + 收款 + 海关 |

**难度设置(决定"是否卡开业")**:
- **简单**:先开业、后补办(边经营边被催办,宽松)
- **普通**:核心证件(入驻 + 收款)必须,其余可补办
- **困难**:全部 L0 办完才正式开业(严格仪式感)

### 1.3 L1 运营进阶证件
对齐现有 `Product.certifications` 字段(部分商品已标注 CE/FCC/FDA)与区域合规难度(SEA 2 → UK 6 → US 9)。

| 证件 | 适用区域 | 费用 | 时长 | 解锁的能力(故事化回报) |
|---|---|---|---|---|
| `CE` | UK/EU 类(电子/美妆/家居) | $200 | 7天 | 标 CE 商品免"缺证"违规;UK 合规难度↓ |
| `FCC` | US 无线/电子 | $150 | 5天 | 同上(US 类) |
| `FDA` | US 食品/美妆 | $300 | 10天 | 免医疗词检测 |
| `VAT` | UK | $100 | 7天 | 合法申报,否则每笔 UK 订单有稽查罚款风险 |
| `TRADEMARK` 商标备案 | 全区域 | $250 | 14天 | 合法使用品牌词(降假货误判)、提升信任 |
| `BRAND_AUTH` 品牌授权 | counterfeit 品 | $500+ | 14天 | 山寨洗白为授权分销(高风险高回报) |

### 1.4 数据模型(示意)
```ts
type CertId =
  | 'SELLER_VERIFY' | 'BUSINESS_LICENSE' | 'RECEIVING_ACCOUNT' | 'CUSTOMS_REG'
  | 'CE' | 'FCC' | 'FDA' | 'VAT' | 'TRADEMARK' | 'BRAND_AUTH';
interface Certificate {
  id: CertId; name: string; layer: 'L0' | 'L1';
  region?: RegionId; cost: number; leadTimeDays: number;
  status: 'none' | 'applying' | 'active' | 'expired';
  appliedDay?: number; grantedDay?: number;
  unlocks: string[];                 // 人类可读的能力描述
}
```

### 1.5 故事化触发链
- **L0 开店**:角色创建(Sprint 2)→ `sendMessage` 平台"入驻须知" → 任务链"筹备开店"(提交资料 / 绑账户 / 备案)→ 全部 `active` → 正式开业。
- **L1 运营**:现有 `evt_customs_seizure`(UK 缺 CE 被扣货)改写 → 海关邮件警告 + `unlockTask`"办理 CE 认证" → 申请扣费计时 → `certificate` DayProcessor 到期置 `active` → EffectBus `grantCertificate` 解锁能力(影响 ListingSystem 检测 & 合规难度)。

### 1.6 接入点
`systems/CertificateSystem.ts` + `data/certificates.ts` + `certificate` DayProcessor + `applyCommand` 的 `grantCertificate` / `sendMessage` / `unlockTask`。

## 二、税务系统 `TaxSystem`(细化)

### 2.1 税种与区域税率
| 区域 | 税种 | 税率 | 申报周期(天) | 起征点 |
|---|---|---|---|---|
| UK | VAT | 20% | 30 | 全征 |
| US | Sales Tax | 8% | 30 | 全征 |
| SEA | GST | 0% | 30 | 跨境小包豁免 |

> 税率/周期存于 `data/taxRules.ts`,按区域查表。流转税基于**销售额**(`order.totalAmount`)。

### 2.2 数据模型(示意)
```ts
interface TaxRule { region: RegionId; type: 'VAT'|'SALES_TAX'|'GST'; rate: number; filingCycleDays: number; }
interface PlayerTaxState {
  taxOwed: number;        // 累计未缴流转税
  lastFilingDay: number;  // 上次申报日
  vatRegistered: boolean; // 是否已持 VAT 证件(影响稽查概率)
  auditRisk: number;      // 漏报累积的稽查风险 0..1
}
```

### 2.3 结算逻辑
- **产生(accrual)**:每笔订单 `taxOwed += order.totalAmount * rule.rate`(商家代收,法理属税务局)。
- **缴纳(filing)**:周期到,玩家在税务面板点"申报缴纳" → `gold -= taxOwed` → 清零、`lastFilingDay = day`、`auditRisk = 0`。
- **漏报(default)**:周期到未缴 → `auditRisk += 0.25`;达阈值(≥0.5)按概率触发 `evt_tax_audit`。
- **稽查** `evt_tax_audit`:选"配合补缴"(`gold -= taxOwed*1.5` 含滞纳金 + 健康分 -0.5)或"抗拒"(重罚/关店风险)。

### 2.4 与证件系统联动
UK 玩家需先持有 L1 证件 `VAT` 才能走"合法申报"通道;**未持证时每笔 UK 订单稽查概率 ×3**,呼应 L1 VAT 解锁描述。税务合规依赖办证进度,两系统串联。

### 2.5 故事化
- 每月初:邮件"税务申报季来临,请于 X 日前申报缴纳 £XXX VAT" + 申报任务。
- 首次触及税务:触发"税务科普"新手剧情,解释代收代缴机制。
- 漏报:稽查员来信(`sendMessage`)→ `evt_tax_audit` 抉择。

### 2.6 接入点
`systems/TaxSystem.ts`(`accrueTax` / `fileTax` / `checkAudit`)+ `data/taxRules.ts` + `tax` DayProcessor(每日累计 + 周期任务 + 稽查检查)+ `player.taxOwed` / `vatRegistered` / `lastFilingDay` / `auditRisk`。

### 2.7 伪代码
```
taxProcessor(day):
  for o in newOrdersToday: taxOwed += o.totalAmount * rate(o.region)
  if day - lastFilingDay >= cycle:
    sendMessage(申报提醒); unlockTask(申报)
  if day - lastFilingDay >= cycle && taxOwed > 0 && not filed:
    auditRisk += 0.25
    if auditRisk >= 0.5 && roll(): startEvent('evt_tax_audit')
fileTax(): gold -= taxOwed; taxOwed = 0; lastFilingDay = day; auditRisk = 0
```

### 2.8 企业所得税(简述)
基于季度净利润 15%,由 `FinanceSystem` 季度结算时计算扣除(与流转税代收代缴分离)。本系统主责流转税,所得税作为财务结算的一部分。

## 三、竞争对手 AI `CompetitionSystem`(细化)

### 3.1 数据模型(示意)
```ts
interface Competitor {
  id: string; name: string;
  tier: 'budget'|'mid'|'premium';
  mainCategory: ProductCategory;
  priceStrategy: 'low'|'mid'|'premium';
  marketShare: number;        // 0..1,玩家+竞品之和=1
  aggressive: number;         // 攻击性 0..1(影响价格战/抢达人频率)
  poachedInfluencerIds: string[];
}
```

### 3.2 初始化
同区域生成 2–3 个竞品,`mainCategory` 取该区域 `hotCategories`,`marketShare` 初始各 0.1–0.25,玩家初始份额 = 1 − 竞品总和。

### 3.3 行为规则
- **价格战**:竞品定期调价(尤其同类目),压制玩家该类目自然订单。影响系数 `categoryPenalty = competitor.marketShare * competitor.aggressive`;玩家该类目自然流量 ×(1 − categoryPenalty)。
- **抢达人**:每日概率(∝ aggressive)对高价值达人(tier≥mid)触发 `tryPoach` → 达人状态变 `poached`(需扩展 `InfluencerStatus` 加 `poached` / `exclusive`)。玩家可"匹配报价"抢回(EffectBus `influencerRelation` 或对话)。
- **恶意差评**:竞品行动偶发 → 玩家健康分 −0.2~0.5 / 触发差评事件。
- **份额演化**:玩家份额随经营(健康分 / 营收)升,竞品反之;每周重算。

### 3.4 接入现有系统
- 自然流量:`FinanceSystem.generateOrganicOrders` 乘以竞争系数(需改造,读取 `state.competitors`)。
- 达人:`AffiliateSystem` 读取 `poached` 状态,被挖走的不可合作。

### 3.5 故事化
- 每 7 天"市场周报"邮件:玩家份额 + 各竞品动态(降价 / 抢人 / 恶评)。
- 竞品动作以"对手来信 / 行业传闻"(`sendMessage`)呈现。
- 达人被挖:私信通知"XX 达人已被竞品签走"。

### 3.6 接入点
`systems/CompetitionSystem.ts`(`evolveCompetitors` / `weeklyReport` / `tryPoach` / `priceWarImpact`)+ `competition` DayProcessor + `state.competitors: Competitor[]`。

### 3.7 伪代码
```
competitionProcessor(day):
  for c in competitors: c.marketShare += drift(基于玩家表现)
  priceWarImpact() -> 更新各品类自然流量系数
  if roll(aggressive): tryPoach(高价值达人) -> poached
  if day % 7 == 0: weeklyReport() -> sendMessage(份额 + 动态)
```

## 四、员工系统 `EmployeeSystem`(细化)

### 4.1 数据模型(示意)
```ts
type EmployeeRole = 'cs'|'ops'|'packer';
interface Employee { id: string; role: EmployeeRole; name: string; salary: number; hiredDay: number; }
const EMPLOYEE_DEFS: Record<EmployeeRole, {name:string; salary:number; desc:string}> = {
  cs:    { name:'客服专员', salary:200, desc:'退货率 -2~5%' },
  ops:   { name:'运营专员', salary:300, desc:'自然流量 +20~50%' },
  packer:{ name:'打包员',   salary:150, desc:'自动发货(替代手动)' },
};
```

### 4.2 解锁与招聘
- Lv.3 解锁招聘面板(依赖 `ShopSystem` 升级)。
- 招聘:面板选角色 → 扣首月薪资 → 加入 `state.employees`。

### 4.3 效果应用
- **客服(cs)**:每日订单退货率 ×(0.95~0.98)。
- **运营(ops)**:自然流量 ×(1.2~1.5)。
- **打包员(packer)**:每日自动处理 pending 订单(调用 `LogisticsSystem.shipOrder`),无需手动。

### 4.4 薪资结算
`payroll` DayProcessor:每月(每 30 天)从 `gold` 扣各员工 `salary`;余额不足 → 员工离职(吐槽信)。

### 4.5 故事化
- 招聘启事:"人才市场周更邮件"推送。
- 入职欢迎信、离职吐槽信(`sendMessage`)。
- 打包员自动发货带来"省心"叙事;运营带来流量增长反馈。

### 4.6 接入点
`systems/EmployeeSystem.ts`(`hire` / `payroll` / `applyEmployeeEffects`)+ `payroll` DayProcessor(每月扣薪)+ `state.employees: Employee[]`。

### 4.7 伪代码
```
hire(role): gold -= def.salary; employees.push({role, hiredDay:day})
payrollProcessor(day): if day % 30 == 0: for e in employees: gold -= e.salary (不足则 remove + 离职信)
applyEmployeeEffects(state): for e: cs->退货率↓; ops->自然流量↑; packer->自动发货
```

## 五、其余系统细化

### 5.1 #8 选品趋势 / 生命周期(扩展 `SourcingSystem`)
- **商品热度**:`Product.trend: 'rising'|'peak'|'declining'|'dead'`,影响自然流量系数(`1.3/1.0/0.7/0.3`)与达人匹配意愿;每日按概率演化。
- **新品上线**:每 14 天随机上新 3–5 个(随机品类 / 价格带),进入货盘。
- **下架旧品**:`dead` 商品从货盘移除(已购库存仍可售,但不再有新订单)。
- **季节性**:按游戏天数模拟季节(如 Day1–30 夏季→防晒/墨镜热;Day60–90 冬季→家居/宠物热),影响品类需求与价格。
- **数据**:`Product` 加 `trend`;新增 `data/seasonConfig.ts`。
- **故事化**:供应商来信推荐当季新品。
- **接入**:`sourcing` DayProcessor(演化 trend / 上新 / 季节)、改造 `FinanceSystem.generateOrganicOrders` 与 `AffiliateSystem` 读取 trend。

### 5.2 #9 合规认证 + 法务(扩展 `ListingSystem`)
- **认证办理**:花费 + 等待获取 FDA/CE —— 即 L1 证件(`CertificateSystem`),此处强调"合规策略层"接入 `ListingSystem`(持证免对应检测)。
- **法务月费订阅**:月费制,自动过滤部分轻/中违规(检测概率 ×0.5);重度仍需手动。
- **擦边策略**:允许"XX同款""媲美XX"等灰表表述,有概率被平台抽查 → 按中度违规处理。
- **故事化**:法务顾问订阅信;擦边策略走风险 `StoryChain`(侥幸 / 被罚分支)。
- **接入**:`ListingSystem` 改造(读 certificates / 法务状态)、`legal` DayProcessor(法务续费)、`compliance` StoryChain。

### 5.3 #10 营销多渠道(新 `MarketingSystem`)
- **投流广告**:投入 $100–$1000 → 曝光 → 额外订单;ROI 不确定,受商品 trend / 素材质量影响。
- **SEO 优化**:每月固定投入 → 自然流量 +10–30%。
- **社媒运营**:玩家选"自运营账号",投入冷却天数换免费流量。
- **平台活动**:限时大促(如"双11")作为 `StoryChain` 事件,参与需满足门槛。
- **数据**:`MarketingCampaign { id; type; spend; startedDay; duration; }`。
- **故事化**:大促限时事件;投流"赌一把"叙事(可能亏 / 赚)。
- **接入**:`systems/MarketingSystem.ts` + `marketing` DayProcessor + `StoryChain` 大促事件。

### 5.4 #13 物流商 + 保险(扩展 `LogisticsSystem`)
- **多物流商**:兔子速递(便宜2天慢)、飞鹰物流(贵1天快)、鲸鱼海运(最便宜但7天慢,仅 UK/US);不同区域可用不同商。
- **物流保险**:订单金额 3% 购买,途中丢失 / 损坏全额赔付。
- **旺季爆仓**:节假日特定物流商暂停 / 大幅涨价。
- **故事化**:物流商推销邮件;保险作为高价值订单可选保障。
- **接入**:`LogisticsSystem` 改造(选物流商 / 保险)、`logistics` DayProcessor(旺季)、顺带修 BUG#7(一键发货库存检查 silent fail)。

### 5.5 #14 贷款 + 现金流(扩展 `FinanceSystem`)
- **短期贷款**:极速贷(高利贷,30天还本息130%)、银行经营贷(Lv.5 解锁,低息需审核)。
- **账期管理**:与供应商协商延长付款周期(以降低采购折扣为代价)。
- **现金流预测面板**:未来 7 天预计回款 / 支出 / 余额曲线。
- **故事化**:"极速贷"催贷来电(`sendMessage`)。
- **接入**:`FinanceSystem` 扩展 `takeLoan` / `repayLoan` action、`finance` DayProcessor(还款)、UI 预测面板;顺带修 BUG#3(采购成本计入 `sourcingCost`)。

### 5.6 #15 评价 + 复购(新 `ReputationSystem`)
- **评价**:已签收订单概率产生好评 / 中评 / 差评,受 `riskLevel` 与物流时效影响。
- **差评处理**:退款 / 补偿 / 申诉操作(影响健康分与声誉)。
- **复购**:老客户概率再次下单(受满意度)。
- **自然转化**:好评积累 ↑ 转化率,差评 ↓。
- **故事化**:客户评价走消息;差评处理作为紧急任务。
- **接入**:`systems/ReputationSystem.ts` + `reputation` DayProcessor(生成评价 / 复购);顺带修 BUG#4(订单状态推进简化)。

## 六、与 Sprint 0 架构的衔接
所有内容系统均通过 Sprint 0 的:
- **DayProcessor**:注册每日逻辑(在途 / 订单 / 财务之外的扩展点)
- **EffectBus(GameCommand)**:统一施加效果(`startStoryChain` / `grantCertificate` / `unlockTask` / `influencerRelation` / `sendMessage`)
- **StoryEngine**:驱动 `chainId` / `chainStage` 剧情链与对话树

新增一个系统 = 注册一个 processor + 加一份 data,核心代码零改动。

## 七、身份与难度初始化参数(可编码)

### 7.1 身份配置 `IdentityConfig`
```ts
interface IdentityConfig {
  id: 'entrepreneur' | 'veteran' | 'student';
  name: string;
  startGold: number;
  startShopLevel: number;
  startReputation: number;
  loan?: { amount: number; dueInDays: number; repay: number };
  purchaseDiscount?: number;            // 0.9 = 9 折
  influencerWillingnessBonus?: number;   // 0.2 = +20%
  preownedCerts: CertId[];              // 已自带资质(L0 减项)
  storyChainId: string;                 // 对应剧情线
}
```

| 字段 | 辞职创业者 entrepreneur | 国内老手 veteran | 大学生 student |
|---|---|---|---|
| startGold | 5000 | 1500 | 800 |
| startShopLevel | 2 | 1 | 1 |
| startReputation | 50 | 50 | 50 |
| loan | 3000,30天还4000 | 无 | 无 |
| purchaseDiscount | 无 | 0.9 | 无 |
| influencerWillingnessBonus | 无 | 无 | 0.2 |
| preownedCerts | [BUSINESS_LICENSE] | [CUSTOMS_REG] | [] |
| storyChainId | chain_business_growth | chain_supply_chain | chain_campus |

### 7.2 难度配置 `DifficultyConfig`
```ts
interface DifficultyConfig {
  id: 'easy' | 'normal' | 'hard';
  blockOpening: boolean;                  // 是否卡开业
  requiredBeforeOpening: CertId[];        // 开业前必须办好的证件
  gracePeriodDays: number;                // 贷款宽限天数(宽限期内逾期不罚息)
  startGoldMultiplier: number;            // 起始资金倍率
  penaltyMultiplier: number;             // 逾期罚息倍率
}
```

| 字段 | 简单 easy | 普通 normal | 困难 hard |
|---|---|---|---|
| blockOpening | false | false | true |
| requiredBeforeOpening | [] | [SELLER_VERIFY, RECEIVING_ACCOUNT] | 全部 L0 |
| gracePeriodDays | 14 | 7 | 0 |
| startGoldMultiplier | 1.3 | 1.0 | 0.9 |
| penaltyMultiplier | 0.7 | 1.0 | 1.3 |

> 难度只调节"开业严格度 + 全局松紧",不删减内容(L0 全类别、身份差异始终生效)。
> hard `startGoldMultiplier` 已由 0.8 校准为 0.9（2026-08-15 难度校准，见 PLAYTEST_REPORT 迭代记录）。

### 7.3 初始化流程(伪代码)
> ✅ 已实现（2026-08-16）：`OpeningSystem.getRequiredCertIds` 即第 328 行三元；"筹备开店"以开业封锁 + 办证面板 + Dashboard 筹备卡的形式落地（完整 StoryChain 留待内容 Sprint）。
```
createGame(identity, difficulty, mainCategory):
  cfg = IDENTITIES[identity]; diff = DIFFICULTIES[difficulty]
  player.gold      = cfg.startGold * diff.startGoldMultiplier (+ loan if any)
  player.shopLevel = cfg.startShopLevel
  l0List = BASE_CERTS + CATEGORY_CERTS[mainCategory] - cfg.preownedCerts
  required = diff.blockOpening ? l0List : diff.requiredBeforeOpening
  if required 非空: 进入 "筹备开店" StoryChain(blockUntil: required)
  else:            立即开业; 其余证件成为 "补办" 任务(gracePeriod 内完成)
```
