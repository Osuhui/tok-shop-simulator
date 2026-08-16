import { describe, it, expect } from 'vitest';
import { writeFileSync } from 'fs';
import { useGameStore } from '../stores/gameStore';
import { runDay } from './engine/DayProcessor';
import { EVENTS } from './data/events';
import { tryTriggerEvent, driveChainEvent, resolveEventChoice } from './engine/EventEngine';
import { applyCommands } from './engine/EffectBus';
import { nextCooldownDay } from './engine/StoryEngine';
import { LogisticsSystem } from './systems/LogisticsSystem';
import { SourcingSystem } from './systems/SourcingSystem';
import { shippingMultiplier } from './systems/CarriersSystem';
import { getProduct } from './data/products';
import { INFLUENCERS } from './data/influencers';
import { AffiliateSystem } from './systems/AffiliateSystem';
import { takeLoan, repayLoan } from './systems/LoanSystem';
import { hireEmployee } from './systems/EmployeeSystem';
import { fileTax } from './systems/TaxSystem';
import { getUpgradeRequirement, canUpgrade, applyUpgrade } from './systems/ShopSystem';
import { getRequiredCertIds, isShopOpen } from './systems/OpeningSystem';
import { startCertificateApplication } from './systems/TaskSystem';
import { CERT_DEFINITION_MAP } from './data/certificates';
import type { GameState, IdentityId, DifficultyId, RegionId, GameEvent, EventChoice } from './types';

const REGION: RegionId = 'UK';

function playerAct(state: GameState, day: number): GameState {
  let s = state;
  // 0) 办证：难度要求的开业证件缺一即申请（并行办理，到期待审自动激活）
  for (const certId of getRequiredCertIds(s.difficultyId)) {
    const existing = s.certificates.find((c) => c.id === certId);
    if (!existing || existing.status === 'none') {
      if (s.player.gold >= CERT_DEFINITION_MAP[certId].cost) {
        const { state: next } = startCertificateApplication(s, certId);
        s = next;
      }
    }
  }
  // 1) 发货：把所有有库存的待发货订单发出
  for (const o of s.orders) {
    if (o.status === 'pending') {
      const inv = s.inventory.find((i) => i.productId === o.productId);
      if (inv && inv.quantity >= o.quantity) {
        const { result, updatedInventory } = LogisticsSystem.shipOrder(o, s.inventory, day);
        if (result.success) {
          const mult = shippingMultiplier(s, day);
          const sc = Math.round((result.shippingCost ?? 0) * mult * 100) / 100;
          s = {
            ...s,
            inventory: updatedInventory,
            orders: s.orders.map((x) => (x.orderId === o.orderId ? { ...x, status: 'shipped' as const, shippingCost: sc } : x)),
            player: { ...s.player, gold: Math.round((s.player.gold - sc) * 100) / 100 },
          };
        }
      }
    }
  }
  // 2) 补货：在途也算库存水位；备货目标随店铺等级扩张（为接大达人单囤货）
  const totalQty = s.inventory.reduce((a, i) => a + i.quantity + i.inboundQuantity, 0);
  const stockTarget = Math.min(150 + s.player.shopLevel * 80, 800);
  if (totalQty < stockTarget && s.player.gold > 300) {
    const prod = getProduct('prod_stanup_cup')!;
    // 单次采购不超过流动资金的一半
    const affordQty = Math.floor((s.player.gold * 0.5) / prod.cost);
    const buyQty = Math.min(stockTarget - totalQty, affordQty);
    if (buyQty > 0) {
      const res = SourcingSystem.purchase(prod, buyQty, s.player.gold, 'self', s.player.currentRegion, day);
      if (res.success) {
        const newInv = [...s.inventory];
        const idx = newInv.findIndex((i) => i.productId === prod.id && i.warehouseType === 'self');
        if (idx >= 0)
          newInv[idx] = {
            ...newInv[idx],
            inboundQuantity: newInv[idx].inboundQuantity + res.inventoryItem.inboundQuantity,
            // 保留最早到货日：与 gameStore.purchaseProduct 的修复保持一致
            arrivalDay: Math.min(newInv[idx].arrivalDay ?? Infinity, res.inventoryItem.arrivalDay ?? Infinity),
          };
        else newInv.push(res.inventoryItem);
        s = { ...s, player: { ...s.player, gold: Math.round((s.player.gold - res.cost) * 100) / 100 }, inventory: newInv };
      }
    }
  }
  // 2.5) 上架：开业后将新到货/新采购的库存上架，自然流量才会认它
  if (isShopOpen(s)) {
    s = {
      ...s,
      inventory: s.inventory.map(i =>
        i.isListed ? i : { ...i, isListed: true, listedTitle: getProduct(i.productId)?.name ?? i.productId },
      ),
    };
  }
  // 3) 达人合作（每15天）：在"库存接得住"的达人中挑预估单量最大的（囤货接大单）
  if (isShopOpen(s) && day % 15 === 0) {
    const prod = getProduct('prod_stanup_cup')!;
    const stock = s.inventory.find((i) => i.productId === prod.id && i.warehouseType === 'self')?.quantity ?? 0;
    const avail = INFLUENCERS.filter(
      (i) => i.status === 'available' && i.region === s.player.currentRegion && s.player.healthScore >= i.minHealthRequired,
    );
    const candidates = avail
      .map((inf) => ({ inf, est: AffiliateSystem.getEstimation(inf, prod, 0.2, s.player).estimatedOrders }))
      .filter((c) => c.est <= stock);
    if (candidates.length) {
      const best = candidates.reduce((a, b) => (b.est > a.est ? b : a));
      const r = AffiliateSystem.initiateCooperation(best.inf, prod, 0.2, s);
      if (r.success) {
        s = {
          ...s,
          orders: [...s.orders, ...r.ordersGenerated],
          influencers: s.influencers.map((i) => (i.id === best.inf.id ? { ...i, status: 'coolingDown' as const, cooldownRemaining: 14 } : i)),
        };
      }
    }
  }
  // 4) 报税
  if (s.tax.taxOwed > 0 && day % 20 === 0) {
    const nt = fileTax(s, day);
    s = { ...s, tax: nt.tax, player: nt.player };
  }
  // 4.5) 还款：临近到期或已逾期且现金充足时偿还，避免罚息螺旋
  for (const loan of [...s.loans]) {
    if (s.player.day >= loan.dueDay - 10 && s.player.gold >= loan.repayAmount + 500) {
      const { state: ns, error } = repayLoan(s, loan.id);
      if (!error) s = ns;
    }
  }
  // 5) 升级店铺：满足条件即升（等级带来自然流量增益，长期正投资）
  const req = getUpgradeRequirement(s.player.shopLevel);
  if (canUpgrade(s.player, req)) s = applyUpgrade(s);
  // 5.5) 雇员工：D30 后雇客服（UK 退货率高），D45 后雇运营（+25% 流量）
  const hasRole = (role: string) => s.employees.some((e) => e.role === role);
  if (day >= 30 && !hasRole('cs') && s.player.gold > 2000) {
    const r = hireEmployee(s, 'cs', day);
    if (r.state) s = r.state;
  }
  if (day >= 45 && !hasRole('ops') && s.player.gold > 3000) {
    const r = hireEmployee(s, 'ops', day);
    if (r.state) s = r.state;
  }
  // 6) 缺钱借极速贷
  if (s.player.gold < 150) {
    const r = takeLoan(s, 'payday', day);
    if (r.state) s = r.state;
  }
  return s;
}

/** 选项期望收益评分：成功率加权成功/失败金币效果 - 选择成本 */
function choiceScore(choice: EventChoice): number {
  const cost = choice.cost ?? 0;
  const goldOf = (fx: EventChoice['successEffects']) =>
    fx.reduce((a, e) => a + (e.type === 'gold' ? e.value : 0), 0);
  const sr = typeof choice.successRate === 'number' ? choice.successRate : 0.5;
  return sr * goldOf(choice.successEffects) + (1 - sr) * goldOf(choice.failEffects) - cost;
}

function resolveEvent(state: GameState, event: GameEvent): GameState {
  // 理性选择：取期望金币收益最高的选项
  const choice = event.choices.reduce(
    (best, c) => (choiceScore(c) > choiceScore(best) ? c : best),
    event.choices[0],
  );
  const { effects } = resolveEventChoice(choice);
  // 与 gameStore.resolveEvent 一致：先扣选择成本，再经 EffectBus 施加效果
  let next =
    choice.cost && choice.cost > 0
      ? { ...state, player: { ...state.player, gold: Math.round((state.player.gold - choice.cost) * 100) / 100 } }
      : state;
  next = applyCommands(next, effects);
  const expiry = nextCooldownDay(next, event);
  if (expiry !== undefined) next = { ...next, eventCooldowns: { ...next.eventCooldowns, [event.id]: expiry } };
  return next;
}

interface SimResult {
  reason: string;
  day: number;
  gold: number;
  level: number;
  netWorth: number;
  orders: number;
  events: number;
  reviews: number;
  health: number;
  rep: number;
  cash30: number;
  cash60: number;
  cash90: number;
  cash120: number;
}

function finish(reason: string, day: number, state: GameState, netWorth: number, events: number, cash: Record<number, number>): SimResult {
  const p = state.player;
  return {
    reason,
    day,
    gold: Math.round(p.gold),
    level: p.shopLevel,
    netWorth,
    orders: p.totalOrdersCompleted,
    events,
    reviews: state.reviews.length,
    health: Math.round(p.healthScore * 10) / 10,
    rep: Math.round(p.reputation),
    cash30: cash[30] ?? 0,
    cash60: cash[60] ?? 0,
    cash90: cash[90] ?? 0,
    cash120: cash[120] ?? 0,
  };
}

function simulate(identityId: IdentityId, difficultyId: DifficultyId, trace = false, probe = false): SimResult {
  useGameStore.getState().initNewGame({ identityId, difficultyId, region: REGION });
  let state: GameState = useGameStore.getState();
  let events = 0;
  const cash: Record<number, number> = {};
  const traceLines: string[] = [];
  const traceDone = (r: SimResult) => {
    if (trace) writeFileSync('sim_diag.txt', traceLines.join('\n'));
    return r;
  };
  let netWorth = 0;
  for (let day = 2; day <= 365; day++) {
    state = playerAct(state, day);
    const ctx = runDay(state, day);
    let next: GameState = { ...ctx.state, orders: [...ctx.state.orders, ...ctx.newOrders] };
    const triggered = tryTriggerEvent(next, EVENTS.filter((e) => !e.chainId));
    if (triggered) {
      events++;
      next = resolveEvent(next, triggered);
    } else {
      const chainEv = driveChainEvent(next, next.activeChainId, EVENTS);
      if (chainEv) {
        events++;
        next = resolveEvent(next, chainEv);
      }
    }
    state = next;
    if (trace) {
      const pending = state.orders.filter((o) => o.status === 'pending').length;
      const invQty = state.inventory.reduce((a, i) => a + i.quantity, 0);
      traceLines.push(
        `D${day} gold=${Math.round(state.player.gold)} rev=${ctx.todayRevenue} exp=${ctx.todayExpenses} pend=${pending} invQty=${invQty} loans=${state.loans.length} overdue=${ctx.overdueCount}`,
      );
    }
    const p = state.player;
    const invValue = state.inventory.reduce((a, i) => a + (getProduct(i.productId)?.cost ?? 0) * i.quantity, 0);
    const debt = state.loans.reduce((a, l) => a + l.repayAmount, 0);
    netWorth = Math.round((p.gold + invValue - debt) * 100) / 100;
    if (p.gold <= -500) return traceDone(finish('bankruptcy', day, state, netWorth, events, cash));
    if (probe) {
      // 探针模式：忽略通关，仅记录净资产轨迹（用于目标数值标定）
      if ([60, 120, 180, 240, 300].includes(day)) {
        traceLines.push(`PROBE D${day} gold=${Math.round(p.gold)} Lv=${p.shopLevel} NW=${netWorth}`);
      }
    } else if (state.goal && p.shopLevel >= state.goal.shopLevel && netWorth >= state.goal.netWorth) {
      return traceDone(finish('victory', day, state, netWorth, events, cash));
    }
    if (day === 31) cash[30] = Math.round(p.gold);
    if (day === 61) cash[60] = Math.round(p.gold);
    if (day === 91) cash[90] = Math.round(p.gold);
    if (day === 121) cash[120] = Math.round(p.gold);
  }
  return traceDone(finish('timeout', 365, state, netWorth, events, cash));
}

describe('playtest simulation', () => {
  it('runs the economy headlessly and reports', () => {
    const identities: IdentityId[] = ['entrepreneur', 'veteran', 'student'];
    const difficulties: DifficultyId[] = ['easy', 'normal', 'hard'];
    const TRIALS = 3;
    const lines: string[] = [];
    lines.push('=== TokShop 试玩模拟（UK 区，每配置 3 局，理性活跃玩家策略，窗口 365 天）===');
    lines.push(
      '配置'.padEnd(16) +
        '结果'.padEnd(26) +
        '末金'.padEnd(8) +
        'Lv'.padEnd(4) +
        '净资产'.padEnd(9) +
        '订单'.padEnd(6) +
        '事件'.padEnd(5) +
        'D30/60/90/120现金',
    );
    for (const id of identities) {
      for (const diff of difficulties) {
        const rs = Array.from({ length: TRIALS }, (_, i) => simulate(id, diff, id === 'entrepreneur' && diff === 'normal' && i === 0));
        const outcome = rs.map((r) => r.reason).join('/');
        const avg = (k: keyof SimResult) => Math.round(rs.reduce((a, r) => a + (r[k] as number), 0) / TRIALS);
        const cash = `${rs[0].cash30}/${rs[0].cash60}/${rs[0].cash90}/${rs[0].cash120}`;
        lines.push(
          `${id}/${diff}`.padEnd(16) +
            outcome.padEnd(26) +
            String(avg('gold')).padEnd(8) +
            String(avg('level')).padEnd(4) +
            String(avg('netWorth')).padEnd(9) +
            String(avg('orders')).padEnd(6) +
            String(avg('events')).padEnd(5) +
            cash,
        );
        lines.push(
          `  每局: `.padEnd(16) +
            rs.map((r) => `${r.reason}@D${r.day}(Lv${r.level}/NW${r.netWorth}/rev${r.orders})`).join(' | '),
        );
      }
    }
    writeFileSync('sim_report.txt', lines.join('\n') + '\n');
    expect(true).toBe(true);
  });

  it('probe：净资产轨迹标定（entrepreneur/normal，忽略通关上限，300 天）', () => {
    // 输出到 sim_diag.txt（PROBE 行），供目标数值标定
    const r = simulate('entrepreneur', 'normal', true, true);
    expect(['victory', 'timeout', 'bankruptcy'].includes(r.reason)).toBe(true);
  });
});
