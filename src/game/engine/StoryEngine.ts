// ============================================================
// 叙事引擎：事件冷却闸门 + 剧情链（chainId / chainStage）推进
// ============================================================
import type { GameEvent, GameState } from '../types';

/**
 * 判断事件当前是否可触发：
 * - eventCooldowns[eventId] 未设置 → 从未触发过，可触发
 * - 已设置 → 表示冷却到期 day；玩家 day 达到/超过该 day 才可再次触发
 */
export function isEventAvailable(state: GameState, event: GameEvent): boolean {
  const expiryDay = state.eventCooldowns[event.id];
  if (expiryDay === undefined) return true;
  return state.player.day >= expiryDay;
}

/** 计算事件触发后应写入的冷却到期 day（无 cooldownDays 则永不锁定） */
export function nextCooldownDay(state: GameState, event: GameEvent): number | undefined {
  if (!event.cooldownDays) return undefined;
  return state.player.day + event.cooldownDays;
}

/**
 * 取某剧情链的下一个可触发事件：按 chainStage 升序，跳过仍在冷却中的节点。
 * 用于让"海关扣货 → 办 CE 证 → 解锁通关能力"这类剧情按序、可重复推进。
 */
export function getNextChainEvent(
  state: GameState,
  chainId: string,
  pool: GameEvent[],
): GameEvent | null {
  const chainEvents = pool
    .filter((e) => e.chainId === chainId)
    .sort((a, b) => (a.chainStage ?? 0) - (b.chainStage ?? 0));

  for (const ev of chainEvents) {
    if (isEventAvailable(state, ev)) return ev;
  }
  return null;
}
