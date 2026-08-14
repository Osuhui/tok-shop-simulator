// ============================================================
// 统一效果总线:GameCommand 判别联合的纯函数分发器
// 所有系统/事件/剧情链施加效果都经此一处,保证"加一个剧情能真影响状态"
// ============================================================
import type { GameState, GameCommand, CertId } from '../types';

/** 应用单条指令,返回新状态(纯函数,不修改入参) */
export function applyCommand(state: GameState, cmd: GameCommand): GameState {
  switch (cmd.type) {
    case 'gold':
      return {
        ...state,
        player: { ...state.player, gold: Math.round((state.player.gold + cmd.value) * 100) / 100 },
      };

    case 'healthScore':
      return {
        ...state,
        player: { ...state.player, healthScore: clamp(state.player.healthScore + cmd.value, 0, 5) },
      };

    case 'reputation':
      return {
        ...state,
        player: { ...state.player, reputation: clamp(state.player.reputation + cmd.value, 0, 100) },
      };

    case 'inventory': {
      const inventory = state.inventory.map(i =>
        i.productId === cmd.target ? { ...i, quantity: Math.max(0, i.quantity + cmd.value) } : i,
      );
      return { ...state, inventory };
    }

    case 'grantCertificate': {
      const certs = state.certificates.map(c =>
        c.id === cmd.certId ? { ...c, status: 'active' as const, grantedDay: state.player.day } : c,
      );
      if (!certs.some(c => c.id === cmd.certId)) {
        certs.push({
          id: cmd.certId as CertId,
          name: cmd.certId,
          layer: 'L1',
          cost: 0,
          leadTimeDays: 0,
          status: 'active',
          unlocks: [],
        });
      }
      return { ...state, certificates: certs };
    }

    case 'sendMessage': {
      const notification = {
        id: `msg-${state.player.day}-${Math.random().toString(36).slice(2, 7)}`,
        title: cmd.title,
        message: cmd.body,
        type: 'info' as const,
        timestamp: Date.now(),
        read: false,
      };
      return { ...state, notifications: [notification, ...state.notifications].slice(0, 50) };
    }

    // 以下由 StoryEngine / TaskSystem 在后续 Sprint 接入,本 Sprint 先占位
    case 'startStoryChain':
    case 'unlockTask':
    case 'influencerRelation':
    default:
      return state;
  }
}

/** 顺序应用多条指令 */
export function applyCommands(state: GameState, cmds: GameCommand[]): GameState {
  return cmds.reduce((s, cmd) => applyCommand(s, cmd), state);
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}
