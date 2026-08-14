// ============================================================
// 随机事件引擎
// ============================================================
import type { GameEvent, GameState, EventChoice, GameCommand } from '../types';
import { isEventAvailable, getNextChainEvent } from './StoryEngine';

/** 事件触发条件是否满足（区域/天数/健康/等级/商品/待处理/稽查风险/身份/冷却） */
export function eventConditionMet(state: GameState, event: GameEvent): boolean {
  const { player, orders, inventory } = state;
  const cond = event.triggerCondition;

  if (cond.region && cond.region !== player.currentRegion) return false;
  if (cond.minDay !== undefined && player.day < cond.minDay) return false;
  if (cond.maxDay !== undefined && player.day > cond.maxDay) return false;
  if (cond.minHealthScore !== undefined && player.healthScore < cond.minHealthScore) return false;
  if (cond.maxHealthScore !== undefined && player.healthScore > cond.maxHealthScore) return false;
  if (cond.minShopLevel !== undefined && player.shopLevel < cond.minShopLevel) return false;
  if (cond.hasProductId && !inventory.some((i) => i.productId === cond.hasProductId && i.quantity > 0)) return false;
  if (cond.minPendingOrders !== undefined) {
    const pendingCount = orders.filter((o) => o.status === 'pending').length;
    if (pendingCount < cond.minPendingOrders) return false;
  }
  if (cond.minAuditRisk !== undefined && state.tax.auditRisk < cond.minAuditRisk) return false;
  if (cond.identityId && state.identityId !== cond.identityId) return false;
  if (!isEventAvailable(state, event)) return false;
  return true;
}

/** 尝试触发事件。返回触发的事件（如果有），否则null。 */
export function tryTriggerEvent(state: GameState, eventPool: GameEvent[]): GameEvent | null {
  const candidates = eventPool.filter((event) => eventConditionMet(state, event));
  if (candidates.length === 0) return null;
  for (const event of candidates) {
    if (Math.random() < event.triggerCondition.probability) return event;
  }
  return null;
}

/**
 * 按剧情链顺序推进：取链上下一个可用（未冷却）事件，若条件满足则按概率触发。
 * 用于让身份/税务剧情链按 stage 升序、可重复推进，而非随机打乱。
 */
export function driveChainEvent(
  state: GameState,
  chainId: string | undefined,
  pool: GameEvent[],
): GameEvent | null {
  if (!chainId) return null;
  const ev = getNextChainEvent(state, chainId, pool);
  if (!ev) return null;
  if (!eventConditionMet(state, ev)) return null;
  if (Math.random() < ev.triggerCondition.probability) return ev;
  return null;
}

/** 处理事件选择结果 */
export function resolveEventChoice(
  choice: EventChoice,
): { success: boolean; effects: GameCommand[] } {
  const roll = Math.random();
  const success = roll < choice.successRate;
  return {
    success,
    effects: success ? choice.successEffects : choice.failEffects,
  };
}
