import type { GameState, AchievementDef } from '../types';
import { getProduct } from './products';

/** 全部成就定义（纯观测：condition 只读 state，不改写任何经济字段） */
export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'first_sale',
    name: '第一桶金',
    description: '完成你的第一笔订单回款',
    category: 'business',
    icon: '💰',
    condition: (s) => s.orders.some((o) => o.paid),
  },
  {
    id: 'first_employee',
    name: '组建团队',
    description: '雇佣你的第一位员工',
    category: 'business',
    icon: '🧑‍💼',
    condition: (s) => s.employees.length > 0,
  },
  {
    id: 'cert_L0',
    name: '合规启航',
    description: '集齐 4 张开业 L0 证件（实名 / 执照 / 收款 / 海关）',
    category: 'compliance',
    icon: '📜',
    condition: (s) =>
      ['SELLER_VERIFY', 'BUSINESS_LICENSE', 'RECEIVING_ACCOUNT', 'CUSTOMS_REG'].every((id) =>
        s.certificates.some((c) => c.id === id && c.status === 'active'),
      ),
  },
  {
    id: 'vat_registered',
    name: '跨境合规',
    description: '完成 VAT 登记，解锁 UK 合法申报通道',
    category: 'compliance',
    icon: '🇬🇧',
    condition: (s) => s.tax.vatRegistered,
  },
  {
    id: 'day_30',
    name: '满月经营',
    description: '坚持经营满 30 天',
    category: 'growth',
    icon: '📅',
    condition: (s) => s.player.day >= 30,
  },
  {
    id: 'shop_lv3',
    name: '小有规模',
    description: '店铺升至 Lv.3',
    category: 'growth',
    icon: '🏪',
    condition: (s) => s.player.shopLevel >= 3,
  },
  {
    id: 'shop_lv5',
    name: '中坚卖家',
    description: '店铺升至 Lv.5',
    category: 'growth',
    icon: '🏬',
    condition: (s) => s.player.shopLevel >= 5,
  },
  {
    id: 'networth_10k',
    name: '小有积蓄',
    description: '净资产突破 $10,000',
    category: 'finance',
    icon: '🪙',
    condition: (s) => computeNetWorth(s) >= 10000,
  },
  {
    id: 'networth_50k',
    name: '跨境巨头',
    description: '净资产突破 $50,000',
    category: 'finance',
    icon: '💎',
    condition: (s) => computeNetWorth(s) >= 50000,
  },
  {
    id: 'first_campaign',
    name: '营销初体验',
    description: '发起你的首个营销活动',
    category: 'social',
    icon: '📣',
    condition: (s) => s.campaigns.length > 0,
  },
  {
    id: 'marketing_master',
    name: '营销大师',
    description: '同时运营 3 个营销活动',
    category: 'social',
    icon: '🎯',
    condition: (s) => s.campaigns.length >= 3,
  },
  {
    id: 'first_review',
    name: '口碑初成',
    description: '收到买家的首个评价',
    category: 'reputation',
    icon: '⭐',
    condition: (s) => s.reviews.length > 0,
  },
];

export const ACHIEVEMENT_MAP: Record<string, AchievementDef> = Object.fromEntries(
  ACHIEVEMENTS.map((a) => [a.id, a]),
);

/** 净资产：gold + 库存成本估值 − 未还贷款（与 gameStore 通关判定口径一致） */
export function computeNetWorth(state: GameState): number {
  const invValue = state.inventory.reduce(
    (sum, it) => sum + (getProduct(it.productId)?.cost ?? 0) * it.quantity,
    0,
  );
  const debt = state.loans.reduce((sum, l) => sum + l.repayAmount, 0);
  return Math.round((state.player.gold + invValue - debt) * 100) / 100;
}
