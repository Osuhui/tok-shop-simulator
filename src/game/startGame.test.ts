import { describe, it, expect } from 'vitest';
import { useGameStore } from '../stores/gameStore';

describe('资深玩家试玩：开局流程', () => {
  it('点击「进入游戏」后游戏应成功开始（gamePhase=playing，不抛错）', () => {
    expect(() =>
      useGameStore
        .getState()
        .initNewGame({ identityId: 'entrepreneur', difficultyId: 'normal', region: 'UK' }),
    ).not.toThrow();

    const s = useGameStore.getState();
    expect(s.gamePhase).toBe('playing');
    expect(s.player.currentRegion).toBe('UK');
    expect(s.activePanel).toBe('dashboard');
    expect(s.goal).toBeDefined();
    expect(s.activeChainId).toBeDefined();
  });

  it('三种身份 + 三种难度 都能正常开局', () => {
    const identities = ['entrepreneur', 'veteran', 'student'] as const;
    const difficulties = ['easy', 'normal', 'hard'] as const;
    for (const id of identities) {
      for (const diff of difficulties) {
        expect(() =>
          useGameStore.getState().initNewGame({ identityId: id, difficultyId: diff, region: 'UK' }),
        ).not.toThrow();
        const s = useGameStore.getState();
        expect(s.gamePhase).toBe('playing');
        expect(s.identityId).toBe(id);
        expect(s.difficultyId).toBe(diff);
      }
    }
  });
});
