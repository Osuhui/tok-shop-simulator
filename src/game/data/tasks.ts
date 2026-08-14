// ============================================================
// 任务目录（Sprint 0 占位骨架）
// 任务以"剧情触发"方式出现——例如海关扣货事件链会发放"补办 CE 认证"任务，
// 完成后经 EffectBus 解锁对应能力。后续内容 Sprint 在此细化条件与奖励。
// ============================================================
export interface TaskDefinition {
  id: string;
  title: string;
  description: string;
  /** 完成条件（占位，后续按系统细化） */
  requirement?: { type: string; target?: string; value?: number };
  /** 完成后的能力 / 剧情解锁（文案） */
  rewards: string[];
}

export const TASK_DEFINITIONS: TaskDefinition[] = [
  {
    id: 'task_apply_ce',
    title: '补办 CE 认证',
    description: '英国货物因缺少 CE 认证被海关扣留，尽快补办以恢复清关能力。',
    requirement: { type: 'certificate', target: 'CE' },
    rewards: ['解锁英国清关能力'],
  },
];
