// ============================================================
// 身份配置（影响起始资金 / 自带资质 / 剧情线）
// ============================================================
import type { IdentityConfig } from '../types';

export const IDENTITIES: Record<string, IdentityConfig> = {
  entrepreneur: {
    id: 'entrepreneur',
    name: '辞职创业者',
    startGold: 7000,
    startShopLevel: 2,
    startReputation: 50,
    loan: { amount: 3000, dueInDays: 90, repay: 3200 },
    preownedCerts: ['BUSINESS_LICENSE'],
    storyChainId: 'chain_supply_chain',
  },
  veteran: {
    id: 'veteran',
    name: '国内电商老手',
    startGold: 5000,
    startShopLevel: 1,
    startReputation: 50,
    purchaseDiscount: 0.9,
    preownedCerts: ['CUSTOMS_REG'],
    storyChainId: 'chain_business_growth',
  },
  student: {
    id: 'student',
    name: '大学生创业',
    startGold: 3500,
    startShopLevel: 1,
    startReputation: 50,
    influencerWillingnessBonus: 0.2,
    preownedCerts: [],
    storyChainId: 'chain_campus',
  },
};
