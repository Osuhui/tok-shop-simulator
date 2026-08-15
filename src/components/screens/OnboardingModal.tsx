import React from 'react';
import { Modal } from '../ui/Modal';
import { ONBOARDING_STEPS } from '../onboardingSteps';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const OnboardingModal: React.FC<Props> = ({ isOpen, onClose }) => (
  <Modal isOpen={isOpen} onClose={onClose} title="👋 欢迎来到 TokShop！" maxWidth="max-w-lg">
    <p className="text-sm text-slate-300 mb-4">
      你即将经营一家跨境 TikTok 店铺。跟着下面 4 步走完第一个循环，全部完成后奖励{' '}
      <span className="text-emerald-400 font-semibold">+$500</span> 启动资金：
    </p>
    <div className="space-y-2 mb-5">
      {ONBOARDING_STEPS.map((s, i) => (
        <div key={s.id} className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-800/40">
          <span className="w-7 h-7 rounded-full bg-purple-500/15 text-purple-300 flex items-center justify-center text-sm shrink-0">
            {s.icon}
          </span>
          <div>
            <p className="text-sm text-slate-200 font-medium">
              {i + 1}. {s.title}
            </p>
            <p className="text-[11px] text-slate-500">{s.desc}</p>
          </div>
        </div>
      ))}
    </div>
    <button
      onClick={onClose}
      className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2.5 px-3 rounded-lg text-sm font-medium cursor-pointer transition-colors"
    >
      开始经营 🚀
    </button>
  </Modal>
);
