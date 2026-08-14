import React from 'react';
import { Modal } from '../ui/Modal';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const STEPS = [
  { icon: '🛒', title: '采购初始库存', desc: '去「选品」购买商品，仓库才有得卖。' },
  { icon: '📨', title: '获得第一笔订单', desc: '等待自然流量，或去「达人」谈合作引流。' },
  { icon: '📦', title: '完成首单发货', desc: '去「物流」把待处理订单发出去，别超期被取消。' },
  { icon: '⬆️', title: '升级店铺至 Lv.2', desc: '攒够营收 / 订单 / 金币后升级，扩张经营。' },
];

export const OnboardingModal: React.FC<Props> = ({ isOpen, onClose }) => (
  <Modal isOpen={isOpen} onClose={onClose} title="👋 欢迎来到 TokShop！" maxWidth="max-w-lg">
    <p className="text-sm text-slate-300 mb-4">
      你即将经营一家跨境 TikTok 店铺。跟着下面 4 步走完第一个循环，全部完成后奖励{' '}
      <span className="text-emerald-400 font-semibold">+$500</span> 启动资金：
    </p>
    <div className="space-y-2 mb-5">
      {STEPS.map((s, i) => (
        <div key={s.title} className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-800/40">
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
