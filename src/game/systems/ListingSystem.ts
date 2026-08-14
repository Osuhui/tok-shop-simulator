// ============================================================
// 上架与合规检测系统
// ============================================================
import type { Product, RegionId } from '../types';
import { BRAND_BLACKLIST, ABSOLUTE_BLACKLIST, MEDICAL_BLACKLIST } from '../data/blacklists';

export interface ComplianceResult {
  passed: boolean;
  violations: string[];
  penaltyLevel: 'none' | 'light' | 'medium' | 'heavy';
  penaltyGold: number;
  penaltyHealthScore: number;
}

export const ListingSystem = {
  /** 合规检测 */
  checkCompliance(
    title: string,
    product: Product,
    _region: RegionId,
  ): ComplianceResult {
    const violations: string[] = [];

    // 1. 品牌词检测（大小写不敏感）
    for (const word of BRAND_BLACKLIST) {
      if (title.toLowerCase().includes(word.toLowerCase())) {
        if (!violations.some(v => v.includes('品牌词'))) {
          violations.push(`品牌词 "${word}"`);
        }
      }
    }

    // 2. 绝对化用语检测
    for (const word of ABSOLUTE_BLACKLIST) {
      if (title.includes(word)) {
        violations.push(`绝对化用语 "${word}"`);
      }
    }

    // 3. 医疗功效词检测（仅当产品无FDA或相关认证时）
    if (!product.certifications.includes('FDA')) {
      for (const word of MEDICAL_BLACKLIST) {
        if (title.includes(word)) {
          violations.push(`医疗功效词 "${word}"`);
        }
      }
    }

    // --- 判定 ---
    if (violations.length === 0) {
      return {
        passed: true,
        violations: [],
        penaltyLevel: 'none',
        penaltyGold: 0,
        penaltyHealthScore: 0,
      };
    }

    const hasBrandViolation = violations.some(v => v.includes('品牌词'));
    const isCounterfeit = product.riskLevel === 'counterfeit';

    // 重：山寨品 + 品牌词
    if (isCounterfeit && hasBrandViolation) {
      return {
        passed: false,
        violations,
        penaltyLevel: 'heavy',
        penaltyGold: 500,
        penaltyHealthScore: -1.0,
      };
    }

    // 中：2个以上违规 或 有品牌词
    if (violations.length >= 2 || hasBrandViolation) {
      return {
        passed: false,
        violations,
        penaltyLevel: 'medium',
        penaltyGold: 200,
        penaltyHealthScore: -0.3,
      };
    }

    // 轻
    return {
      passed: false,
      violations,
      penaltyLevel: 'light',
      penaltyGold: 0,
      penaltyHealthScore: 0,
    };
  },
};
