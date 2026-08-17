import { describe, it, expect } from 'vitest';
import { eventConditionMet, driveChainEvent } from './EventEngine';
import { createTestState } from '../testFixtures';
import type { GameEvent, CertId, Certificate } from '../types';

const openEv = (certId: CertId, stage: number): GameEvent => ({
  id: `evt_open_${certId}`,
  title: 't',
  description: 'd',
  type: 'neutral',
  triggerCondition: { openingCert: certId, minDay: 1, probability: 1 },
  choices: [],
  cooldownDays: 0,
  chainId: 'OPENING_CHAIN',
  chainStage: stage,
});

const POOL: GameEvent[] = [
  openEv('SELLER_VERIFY', 0),
  openEv('BUSINESS_LICENSE', 1),
  openEv('RECEIVING_ACCOUNT', 2),
  openEv('CUSTOMS_REG', 3),
];

const cert = (id: CertId, status: Certificate['status']): Certificate => ({
  id, name: id, layer: 'L0', cost: 0, leadTimeDays: 1, status, unlocks: [],
});

describe('EventEngine · 筹备开店链', () => {
  it('openingCert 门控：仅本难度要求且未申请的证才引导', () => {
    const normal = createTestState({ difficultyId: 'normal' }); // 要求 SELLER_VERIFY + RECEIVING_ACCOUNT
    expect(eventConditionMet(normal, openEv('SELLER_VERIFY', 0))).toBe(true);
    expect(eventConditionMet(normal, openEv('RECEIVING_ACCOUNT', 2))).toBe(true);
    expect(eventConditionMet(normal, openEv('BUSINESS_LICENSE', 1))).toBe(false); // normal 不要求
    expect(eventConditionMet(normal, openEv('CUSTOMS_REG', 3))).toBe(false);

    const hard = createTestState({ difficultyId: 'hard' }); // 要求全部四证
    expect(eventConditionMet(hard, openEv('BUSINESS_LICENSE', 1))).toBe(true);
    expect(eventConditionMet(hard, openEv('CUSTOMS_REG', 3))).toBe(true);

    const easy = createTestState({ difficultyId: 'easy' }); // 无要求
    expect(eventConditionMet(easy, openEv('SELLER_VERIFY', 0))).toBe(false);
  });

  it('openingCert 门控：已申请 / 已持有的证不再引导（含身份自带 preowned）', () => {
    const active = createTestState({ difficultyId: 'normal', certificates: [cert('SELLER_VERIFY', 'active')] });
    expect(eventConditionMet(active, openEv('SELLER_VERIFY', 0))).toBe(false);
    const applying = createTestState({ difficultyId: 'normal', certificates: [cert('SELLER_VERIFY', 'applying')] });
    expect(eventConditionMet(applying, openEv('SELLER_VERIFY', 0))).toBe(false);
    const hardPreowned = createTestState({ difficultyId: 'hard', certificates: [cert('BUSINESS_LICENSE', 'active')] });
    expect(eventConditionMet(hardPreowned, openEv('BUSINESS_LICENSE', 1))).toBe(false);
  });

  it('driveChainEvent：未开业时返回最早未办要求证，跳过已持有 / 非要求节点', () => {
    const normal = createTestState({ difficultyId: 'normal' }); // 0/2
    const ev = driveChainEvent(normal, 'OPENING_CHAIN', POOL);
    expect(ev?.id).toBe('evt_open_SELLER_VERIFY');

    // 要求证全办齐 -> 无 met 节点 -> null（链结束，等待切回身份链）
    const normalDone = createTestState({
      difficultyId: 'normal',
      certificates: [cert('SELLER_VERIFY', 'active'), cert('RECEIVING_ACCOUNT', 'active')],
    });
    expect(driveChainEvent(normalDone, 'OPENING_CHAIN', POOL)).toBeNull();

    // hard 自带营业执照（preowned active）-> 跳过该节点，仍返回其它未办要求证
    const hardPreowned = createTestState({ difficultyId: 'hard', certificates: [cert('BUSINESS_LICENSE', 'active')] });
    const ev2 = driveChainEvent(hardPreowned, 'OPENING_CHAIN', POOL);
    expect(ev2).not.toBeNull();
    expect(ev2?.id).not.toBe('evt_open_BUSINESS_LICENSE');
  });
});
