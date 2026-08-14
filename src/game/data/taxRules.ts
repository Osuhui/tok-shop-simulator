// ============================================================
// 税务规则（按区域查表）
// ============================================================
import type { RegionId, TaxRule } from '../types';

export const TAX_RULES: Record<RegionId, TaxRule> = {
  UK: { region: 'UK', type: 'VAT', rate: 0.2, filingCycleDays: 30 },
  US: { region: 'US', type: 'SALES_TAX', rate: 0.08, filingCycleDays: 30 },
  SEA: { region: 'SEA', type: 'GST', rate: 0, filingCycleDays: 30 },
};

export function getTaxRule(region: RegionId): TaxRule {
  return TAX_RULES[region];
}
