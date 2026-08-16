// ============================================================
// 任务 / 证件系统：把"办证"做成可推进的纯函数
// - startCertificateApplication：发起申请（写入 certificates 为 applying）
// - advanceCertificatesProcessor：可注册为 DayProcessor，到期待审自动转 active
// ============================================================
import type { CertId, Certificate, GameState } from '../types';
import type { DayProcessor } from '../engine/DayProcessor';
import { CERT_DEFINITION_MAP } from '../data/certificates';

/** 发起证件申请：扣办理费、置为 applying，并计算预计下发日。
 *  - 证件不存在 / 办理中或已持有 / 资金不足 → error（同 takeLoan 的 { state, error } 惯例）
 *  - 防重复申请：旧实现会覆盖 applying 记录并重置 grantedDay，等同免费延期 */
export function startCertificateApplication(
  state: GameState,
  certId: CertId,
): { state: GameState; error?: string } {
  const def = CERT_DEFINITION_MAP[certId];
  if (!def) return { state, error: '证件不存在' };

  const existing = state.certificates.find((c) => c.id === certId);
  if (existing && (existing.status === 'applying' || existing.status === 'active')) {
    return { state, error: '该证件办理中或已持有' };
  }
  if (state.player.gold < def.cost) {
    return { state, error: '资金不足' };
  }

  const appliedDay = state.player.day;
  const grantedDay = appliedDay + def.leadTimeDays;

  const cert: Certificate = {
    id: def.id,
    name: def.name,
    layer: def.layer,
    region: def.region,
    cost: def.cost,
    leadTimeDays: def.leadTimeDays,
    status: 'applying',
    appliedDay,
    grantedDay,
    unlocks: def.unlocks,
  };

  const others = state.certificates.filter((c) => c.id !== certId);
  return {
    state: {
      ...state,
      certificates: [...others, cert],
      player: {
        ...state.player,
        gold: Math.round((state.player.gold - def.cost) * 100) / 100,
      },
    },
  };
}

/** 每日推进证件：到期待审的 applying -> active（可挂到 DayProcessor 注册表） */
export const advanceCertificatesProcessor: DayProcessor = (ctx) => {
  const certificates = ctx.state.certificates.map((c) =>
    c.status === 'applying' && c.grantedDay !== undefined && ctx.day >= c.grantedDay
      ? { ...c, status: 'active' as const }
      : c,
  );
  const vatActive = certificates.some((c) => c.status === 'active' && c.unlocks.includes('uk_vat_filing'));
  const tax = vatActive ? { ...ctx.state.tax, vatRegistered: true } : ctx.state.tax;
  return { ...ctx, state: { ...ctx.state, certificates, tax } };
};
