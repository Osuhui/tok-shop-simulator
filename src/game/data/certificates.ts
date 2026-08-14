// ============================================================
// 证件目录（L0 开店证件 + L1 运营证件）
// 完整类别支持：覆盖实名 / 执照 / 收款 / 海关备案 / CE / FCC / FDA / VAT / 商标 / 品牌授权
// 具体数值为 Sprint 0 占位，后续内容 Sprint 按难度 / 身份细化
// ============================================================
import type { CertId, RegionId } from '../types';

export interface CertDefinition {
  id: CertId;
  name: string;
  layer: 'L0' | 'L1';
  region?: RegionId;
  cost: number;
  leadTimeDays: number;
  /** 办下后解锁的能力 / 剧情标记 */
  unlocks: string[];
  description: string;
}

export const CERT_DEFINITIONS: CertDefinition[] = [
  // ===== L0 开店必备 =====
  {
    id: 'SELLER_VERIFY',
    name: '卖家实名认证',
    layer: 'L0',
    cost: 0,
    leadTimeDays: 1,
    unlocks: ['can_open_shop'],
    description: '平台实名认证，开店第一步。',
  },
  {
    id: 'BUSINESS_LICENSE',
    name: '营业执照',
    layer: 'L0',
    cost: 200,
    leadTimeDays: 5,
    unlocks: ['can_operate_legally'],
    description: '跨境主体营业执照，提升店铺可信度。',
  },
  {
    id: 'RECEIVING_ACCOUNT',
    name: '跨境收款账户',
    layer: 'L0',
    cost: 0,
    leadTimeDays: 1,
    unlocks: ['can_receive_payment'],
    description: '绑定第三方收款账户（如 Payoneer / 万里汇）。',
  },
  {
    id: 'CUSTOMS_REG',
    name: '海关进出口备案',
    layer: 'L0',
    cost: 100,
    leadTimeDays: 3,
    unlocks: ['can_customs_clear'],
    description: '进出口收发货人备案，正规清关前提。',
  },

  // ===== L1 运营 / 合规证件 =====
  {
    id: 'CE',
    name: 'CE 认证',
    layer: 'L1',
    region: 'UK',
    cost: 300,
    leadTimeDays: 7,
    unlocks: ['uk_clearance'],
    description: '欧盟 / 英国市场强制合规认证（电子、玩具等）。',
  },
  {
    id: 'FCC',
    name: 'FCC 认证',
    layer: 'L1',
    region: 'US',
    cost: 300,
    leadTimeDays: 7,
    unlocks: ['us_electronics'],
    description: '美国电磁兼容强制认证，电子类目必备。',
  },
  {
    id: 'FDA',
    name: 'FDA 认证',
    layer: 'L1',
    region: 'US',
    cost: 500,
    leadTimeDays: 14,
    unlocks: ['us_food_health'],
    description: '美国食品药品类目准入，周期较长。',
  },
  {
    id: 'VAT',
    name: 'VAT 增值税号',
    layer: 'L1',
    region: 'UK',
    cost: 150,
    leadTimeDays: 5,
    unlocks: ['uk_vat_filing'],
    description: '英国增值税登记号，合规申报与抵扣前提。',
  },
  {
    id: 'TRADEMARK',
    name: '商标注册',
    layer: 'L1',
    cost: 800,
    leadTimeDays: 20,
    unlocks: ['brand_protection'],
    description: '注册商标，防止被跟卖与恶意投诉。',
  },
  {
    id: 'BRAND_AUTH',
    name: '品牌授权书',
    layer: 'L1',
    cost: 0,
    leadTimeDays: 1,
    unlocks: ['sell_branded'],
    description: '销售品牌商品所需的授权链文件。',
  },
];

export const CERT_DEFINITION_MAP: Record<CertId, CertDefinition> = CERT_DEFINITIONS.reduce(
  (acc, d) => {
    acc[d.id] = d;
    return acc;
  },
  {} as Record<CertId, CertDefinition>,
);
