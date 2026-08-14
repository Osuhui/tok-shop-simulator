# 《TokShop Simulator》执行计划

> 基于 `docs/TokShop_Analysis_Report.html`(2026-07-20)整理,关键结论已对照源码验证。
> **方向修正**:原报告按"功能优先级"(P0→P3)排序;本计划改为**架构优先**——先立可扩展骨架,再逐节点填内容。

## 〇、架构决策(已确认)

| 决策 | 结论 |
|---|---|
| 状态层拆分 | **温和**:保留单 Zustand store 作状态容器;把 `advanceOneDay` 与 action 的业务逻辑移入 `src/game/` 纯函数模块。不激进拆多 store |
| 执行顺序 | **架构优先**:先立 Sprint 0 骨架(DayProcessor + EffectBus + StoryEngine + 数据驱动层),再逐业务节点填内容 |
| 办证/资质 | **剧情任务触发**:证件办理作为剧情任务链的一环(邮件/事件触发 → 任务 → 获证解锁能力),不做独立资质中心面板 |

核心范式(延续项目已有设计):逻辑层 `src/game/` 纯函数无副作用,状态层 `src/stores/` thin wrapper,渲染层 `src/components/` 只订阅。新增业务 = 注册一个 `DayProcessor` + 加一份 `data/` 数据,核心代码零改动。

## 一、总览

| 项 | 内容 |
|---|---|
| 当前状态 | Phase 0 完成 + Phase 1–3 骨架约 60%,核心循环可跑通,但有 **2 个阻塞 BUG** |
| 目标路线 | 能跑 → **骨架就绪**(S0) → **能玩**(S1) → **有灵魂**(S2) → **全流程覆盖**(S3) → **成品级**(S4) |
| 架构约束 | 三层分离;新增 System 放 `src/game/systems/`,数据放 `src/game/data/`,UI 放 `src/components/panels/` |
| 最大前置依赖 | Sprint 0 必须先做(重构 `advanceOneDay`、补 EffectBus/StoryEngine),否则后续内容无法以"可插拔"方式接入 |

## 二、Sprint 任务清单

### Sprint 0 — 架构骨架(新增,前置,2–3 天)· 目标:立可扩展地基

本 Sprint **不新增玩法**,只搭骨架并顺势修重叠 BUG。这是"架构优先"的落地,所有后续内容都建立其上。

| # | 任务 | 关键产出 | 验收 |
|---|---|---|---|
| 1 | 提取每日处理器注册表 | `src/game/engine/DayProcessor.ts`,把 `advanceOneDay`(`gameStore.ts:471-612`)步骤拆为可插拔 `DayProcessor[]`(arrivals / orderStatus / overdue / finance / organic / influencerCooldown / certificate / tax / reputation / competition / storyTriggers / autosave) | 重构前后"新一天推进"结果一致(单测对账) |
| 2 | 统一指令总线 | `src/game/engine/EffectBus.ts`,`GameEffect` 升级为判别联合 `GameCommand`(含 `startStoryChain` / `grantCertificate` / `unlockTask` / `influencerRelation` / `sendMessage`),`applyCommand` 分发;store 的 `applyEffects` 改为调用它 | 事件可真正驱动状态(触发剧情/发证件) |
| 3 | 叙事引擎骨架 | `src/game/engine/StoryEngine.ts` + `data/storyChains.ts` / `data/dialogues.ts`;`GameEvent` 加 `chainId` + `chainStage`;`EventEngine` 冷却改"到期日"([BUG#2]) | 事件可按链序触发、可重复 |
| 4 | 业务 System 抽取 | 新增 `systems/ShopSystem.ts`(含 `upgradeShop`,修 [BUG#1])、`systems/TaskSystem.ts` 占位;`data/certificates.ts` / `tasks.ts` 占位 | 升级可触发、区域可解锁 |
| 5 | 状态层瘦身 | `gameStore.ts` 的 action 改为 thin wrapper 调用 `src/game/`;顺带修 [BUG#5 订单ID]、[BUG#6 事件暂停] | store 行数显著下降,逻辑可单测 |
| 6 | 测试基线 | Vitest 补 `DayProcessor` / `EffectBus` / `formulas` 核心单测 | 重构有回归保护 |

> 与 BUG 的关系:BUG#1/#2/#5/#6 与重构点重合,本 Sprint 一并解决;BUG#3/#4/#7/#8 留到对应内容 Sprint。

### Sprint 1 — 目标系统(P0,1–2 天)· 目标:从"能跑"到"能玩"
> 注:升级 BUG#1、事件冷却 BUG#2、订单ID BUG#5、事件暂停 BUG#6 已在 Sprint 0 架构重构中修复,本 Sprint 专注目标/任务系统。

| # | 任务 | 关键改动 | 验收 |
|---|---|---|---|
| 1 | 胜利条件 / 里程碑系统 [P0#2] | 基于 `TaskSystem` 实现 `MilestoneSystem`(周里程碑/中期目标/最终胜利) + `MilestonePanel` | 达成有奖励;最终目标触发胜利提示 |
| 2 | 每日/每周任务 [P0#3] | 任务生成器 + `TaskPanel`(combo 奖励),通过 EffectBus 发奖励 | 有可完成的短期目标 |
| 3 | 顺手修复 [BUG#3/#8] | 采购成本计入 `sourcingCost`;Lv.10 后隐藏升级块 | 财务真实、无 UI 异常 |

### Sprint 2 — 叙事层(P1,3–5 天)· 目标:给游戏注入灵魂

- **#4 角色创建**:3 种身份(辞职创业者 / 国内老手 / 大学生),不同初始条件 + 剧情方向;先定义 `PlayerProfile` 类型
- **#5 剧情事件链**:现有事件重组为 3–4 条链(知识产权 / 商业竞争 / 达人 / 企业成长),`StoryEngine` 按 `chainId`+`chainStage` 推进
- **#6 达人关系 + 对话**:好感度 0–100、关系等级、对话树邀约、合作历史面板(`dialogues.ts`)
- **#7 邮件/消息系统**:分类收件箱替代通知 Modal,部分可回复/可操作(走 EffectBus `sendMessage`)

### Sprint 3 — 全流程内容覆盖(P2,5–7 天)· 目标:每个节点有策略深度 + 故事化

按下方"内容节点 → 故事化"映射逐节点填充,每个机械系统都挂叙事包装:

`#8 选品趋势/生命周期` · `#9 合规认证+法务` · **办证系统(剧情任务触发)** · `#10 营销多渠道` · `#11 员工系统` · `#12 竞争对手 AI` · `#13 物流商+保险` · `#14 贷款+现金流预测` · **税务系统** · `#15 评价+复购`
(同步修 BUG#4 订单状态、BUG#7 一键发货库存检查)

### Sprint 4 — 体验打磨(P3,3–5 天)· 目标:成品级

`#16 新手引导` · `#17 3D 场景交互深化` · `#18 数据可视化` · `#19 成就系统` · 音效 + BGM · 数值平衡

## 三、内容节点 → 系统 → 故事化映射(全流程覆盖)

| 业务节点 | 系统 | 故事化包装 |
|---|---|---|
| 选品采购 | SourcingSystem(加趋势) | 供应商来信推荐当季新品 |
| 上架合规 | ListingSystem(加认证) | 平台通知"某类目需 CE"→ 触发办证任务 |
| **办证**(CE/FDA/VAT/商标/品牌备案) | **CertificateSystem(新)** | **海关/平台邮件 → 任务链 → 获证后解锁能力** |
| 达人 | AffiliateSystem(关系+对话) | 达人私信 + 对话树交涉 |
| 物流 | LogisticsSystem(多商+保险) | 物流商推销邮件 |
| 财务 | FinanceSystem(贷款/汇率) | "极速贷"来电 |
| **税务** | **TaxSystem(新)** | VAT 申报季 → 任务 + 漏报罚款风险 |
| 评价复购 | ReputationSystem(新) | 客户评价 / 差评处理 |
| 竞争 | CompetitionSystem(新) | 市场周报 + 竞品动作 |
| 店铺 | ShopSystem | 升级里程碑剧情 |

**"办证"故事化示例**:`evt_customs_seizure`(缺 CE 被扣货)不再只是弹窗罚款,而是 → 触发任务"办理 CE 认证"(耗时 N 天 + 费用)→ 完成后 `Certificate` 变 `active` → 永久解锁"该品类免医疗词检测"。枯燥的资质办理变成剧情推进的奖励。

## 四、BUG 修复映射

| BUG | 描述 | 位置 | 归属 Sprint |
|---|---|---|---|
| #1 | 升级按钮无 onClick / 无 `upgradeShop` action | `ShopPanel.tsx:68-78` + `gameStore.ts` | **S0** |
| #2 | 事件冷却不生效(`triggeredEventIds` 永久记录) | `EventEngine.ts:35` | **S0** |
| #3 | 采购成本未计入 `sourcingCost`(始终为 0) | `FinanceSystem.ts:92` | S1 |
| #4 | 订单状态推进过度简化(shipped/inTransit 合并) | `gameStore.ts:483-486` | S3 |
| #5 | 订单 ID 用 `Date.now()` 可能冲突 | `AffiliateSystem.ts:58` | **S0** |
| #6 | 事件期间未暂停 gameLoop | `gameStore.ts:570-593` | **S0** |
| #7 | 一键发货无库存检查(silent fail) | `LogisticsPanel.tsx:28-30` | S3 |
| #8 | Lv.10 后升级面板异常 | `ShopPanel.tsx:40-81` | S1 |

## 五、风险与建议

- **测试**:Vitest 已配置但 0 测试,Sprint 0 起补 `DayProcessor`/`EffectBus`/`formulas` 核心单测,避免重构引入回归。
- **架构债**:`gameStore.ts` 已 600+ 行,本计划通过 Sprint 0 的"状态层瘦身 + 业务逻辑外移"彻底解决。
- **依赖顺序**:Sprint 0 必须在所有内容 Sprint 之前;Sprint 2 的角色创建需先定义 `PlayerProfile` 类型。
- **范围风险**:Sprint 3 的 `#11 员工系统` / `#12 竞争对手 AI` 体量最大,若时间紧可降级为"轻量版"先上线。

## 六、已确认架构决策(原待决项)

- ✅ 状态层拆分:**温和**——保留单 store,逻辑外移,不激进拆多 store
- ✅ 执行顺序:**架构优先**——先 Sprint 0 骨架,再填内容
- ✅ 办证/资质:**剧情任务触发**,不做独立资质中心面板

### 后续仍可讨论
- Sprint 3 的 8 个 P2 功能是否要精简 / 重排(尤其竞争对手 AI、员工系统)
- `GameCommand` 的具体判别联合类型清单(设计期再定)
- 各内容节点的填充优先级与节奏
