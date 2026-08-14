import React from 'react';
import { Modal } from '../ui/Modal';
import { useGameStore } from '../../stores/gameStore';

export const EventDialog: React.FC = () => {
  const activeEvent = useGameStore(s => s.activeEvent);
  const resolveEvent = useGameStore(s => s.resolveEvent);
  const dismissEvent = useGameStore(s => s.dismissEvent);
  const setGameSpeed = useGameStore(s => s.setGameSpeed);

  if (!activeEvent) return null;

  const handleChoice = (choiceId: string) => {
    resolveEvent(choiceId);
    // 恢复游戏
    setGameSpeed('1x');
  };

  const handleDismiss = () => {
    dismissEvent();
    setGameSpeed('1x');
  };

  const typeEmoji = activeEvent.type === 'risk' ? '🔴' : activeEvent.type === 'opportunity' ? '🟢' : '🔵';
  const typeColor = activeEvent.type === 'risk' ? 'text-red-400' : activeEvent.type === 'opportunity' ? 'text-emerald-400' : 'text-blue-400';

  return (
    <Modal isOpen={true} onClose={handleDismiss} title={`${typeEmoji} 突发事件`} maxWidth="max-w-lg">
      <div className="space-y-4">
        {/* 事件标题 */}
        <div>
          <h3 className={`text-lg font-bold ${typeColor}`}>{activeEvent.title}</h3>
          <p className="text-sm text-slate-400 mt-2">{activeEvent.description}</p>
        </div>

        {/* 选择 */}
        <div className="space-y-2">
          <p className="text-xs text-slate-500 font-medium">请做出选择：</p>
          {activeEvent.choices.map(choice => (
            <button
              key={choice.id}
              onClick={() => handleChoice(choice.id)}
              className="w-full text-left p-4 rounded-xl border border-slate-700 bg-slate-800/50 hover:border-purple-500 hover:bg-slate-800 cursor-pointer transition-all group"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="text-sm text-slate-200 group-hover:text-white">{choice.text}</span>
                <span className="text-xs text-slate-500 bg-slate-700 px-2 py-0.5 rounded whitespace-nowrap">
                  成功率 {(choice.successRate * 100).toFixed(0)}%
                </span>
              </div>
              {choice.cost && choice.cost > 0 && (
                <p className="text-xs text-amber-400 mt-1">💸 费用：${choice.cost}</p>
              )}
            </button>
          ))}
        </div>

        {/* 跳过按钮 */}
        <button
          onClick={handleDismiss}
          className="w-full text-center text-xs text-slate-600 hover:text-slate-400 py-2 cursor-pointer transition-colors"
        >
          忽略此事件（不推荐）
        </button>
      </div>
    </Modal>
  );
};
