import { describe, it, expect } from 'vitest';
import { startCertificateApplication } from './TaskSystem';
import { createTestState } from '../testFixtures';

describe('startCertificateApplication（扣费 / 防重复 / grantedDay）', () => {
  it('成功申请：扣办理费并置 applying，grantedDay = day + leadTime', () => {
    const s = createTestState({ player: { ...createTestState().player, day: 3, gold: 2000 } });
    const { state, error } = startCertificateApplication(s, 'BUSINESS_LICENSE'); // $200 / 5 天
    expect(error).toBeUndefined();
    expect(state.player.gold).toBe(1800);
    const c = state.certificates.find((x) => x.id === 'BUSINESS_LICENSE')!;
    expect(c.status).toBe('applying');
    expect(c.grantedDay).toBe(8);
  });

  it('免费证件不扣费', () => {
    const s = createTestState({ player: { ...createTestState().player, gold: 100 } });
    const { state, error } = startCertificateApplication(s, 'SELLER_VERIFY');
    expect(error).toBeUndefined();
    expect(state.player.gold).toBe(100);
  });

  it('资金不足返回 error 且不写记录', () => {
    const s = createTestState({ player: { ...createTestState().player, gold: 50 } });
    const { state, error } = startCertificateApplication(s, 'BUSINESS_LICENSE');
    expect(error).toBe('资金不足');
    expect(state.certificates).toHaveLength(0);
  });

  it('办理中或已持有返回 error（防覆盖 grantedDay）', () => {
    const applying = createTestState({
      player: { ...createTestState().player, gold: 2000 },
      certificates: [{
        id: 'BUSINESS_LICENSE', name: '营业执照', layer: 'L0',
        cost: 200, leadTimeDays: 5, status: 'applying' as const, grantedDay: 8, unlocks: [],
      }],
    });
    const { state, error } = startCertificateApplication(applying, 'BUSINESS_LICENSE');
    expect(error).toBe('该证件办理中或已持有');
    expect(state.certificates[0].grantedDay).toBe(8); // 未被重置
  });

  it('未知证件返回 error', () => {
    const { state, error } = startCertificateApplication(createTestState(), 'NOPE' as never);
    expect(error).toBe('证件不存在');
    expect(state.certificates).toHaveLength(0);
  });
});
