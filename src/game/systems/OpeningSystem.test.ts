import { describe, it, expect } from 'vitest';
import {
  getRequiredCertIds,
  isShopOpen,
  getMissingCerts,
  getOpeningProgress,
  gracePeriodDays,
  penaltyMultiplier,
} from './OpeningSystem';
import { createTestState } from '../testFixtures';
import type { CertId, Certificate } from '../types';

const cert = (id: CertId, status: Certificate['status'] = 'active'): Certificate => ({
  id, name: id, layer: 'L0', cost: 0, leadTimeDays: 1, status, unlocks: [],
});

describe('OpeningSystem', () => {
  it('getRequiredCertIds：easy 无要求 / normal 两证 / hard 四证 / 缺失难度无要求', () => {
    expect(getRequiredCertIds('easy')).toEqual([]);
    expect(getRequiredCertIds('normal')).toEqual(['SELLER_VERIFY', 'RECEIVING_ACCOUNT']);
    expect(getRequiredCertIds('hard')).toEqual([
      'SELLER_VERIFY', 'BUSINESS_LICENSE', 'RECEIVING_ACCOUNT', 'CUSTOMS_REG',
    ]);
    expect(getRequiredCertIds(undefined)).toEqual([]);
  });

  it('isShopOpen：无难度要求默认开业；applying 不算持有', () => {
    expect(isShopOpen(createTestState())).toBe(true); // 无 difficultyId（旧存档/夹具）默认已开业
    const normal = createTestState({ difficultyId: 'normal' });
    expect(isShopOpen(normal)).toBe(false);
    expect(isShopOpen({
      ...normal,
      certificates: [cert('SELLER_VERIFY', 'applying'), cert('RECEIVING_ACCOUNT', 'active')],
    })).toBe(false);
    expect(isShopOpen({
      ...normal,
      certificates: [cert('SELLER_VERIFY'), cert('RECEIVING_ACCOUNT')],
    })).toBe(true);
  });

  it('hard：四证缺一即未开业', () => {
    const s = createTestState({
      difficultyId: 'hard',
      certificates: [cert('SELLER_VERIFY'), cert('BUSINESS_LICENSE'), cert('RECEIVING_ACCOUNT')],
    });
    expect(isShopOpen(s)).toBe(false);
    expect(getMissingCerts(s)).toEqual(['CUSTOMS_REG']);
    expect(getOpeningProgress(s)).toEqual({ done: 3, total: 4 });
  });

  it('grace/penalty：三档取值正确，difficultyId 缺失按 easy 最宽松兜底', () => {
    expect(gracePeriodDays(createTestState({ difficultyId: 'hard' }))).toBe(0);
    expect(penaltyMultiplier(createTestState({ difficultyId: 'hard' }))).toBe(1.3);
    expect(gracePeriodDays(createTestState({ difficultyId: 'normal' }))).toBe(7);
    expect(penaltyMultiplier(createTestState({ difficultyId: 'normal' }))).toBe(1.0);
    expect(gracePeriodDays(createTestState({ difficultyId: 'easy' }))).toBe(14);
    expect(penaltyMultiplier(createTestState({ difficultyId: 'easy' }))).toBe(0.7);
    expect(gracePeriodDays(createTestState())).toBe(14);
    expect(penaltyMultiplier(createTestState())).toBe(0.7);
  });
});
