import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useUIStore } from '../../stores/uiStore';
import type { Toast } from '../../stores/uiStore';

const toastStyle: Record<Toast['type'], { border: string; bg: string; icon: string }> = {
  info:    { border: 'border-l-blue-500', bg: 'bg-blue-500/5', icon: '🔵' },
  success: { border: 'border-l-emerald-500', bg: 'bg-emerald-500/5', icon: '🟢' },
  warning: { border: 'border-l-amber-500', bg: 'bg-amber-500/5', icon: '🟡' },
  danger:  { border: 'border-l-red-500', bg: 'bg-red-500/5', icon: '🔴' },
};

export const NotificationToast: React.FC = () => {
  const toasts = useUIStore(s => s.toasts);
  const removeToast = useUIStore(s => s.removeToast);

  return (
    <div className="fixed top-14 right-3 z-50 flex flex-col gap-1.5 max-w-xs">
      <AnimatePresence>
        {toasts.map((toast, i) => {
          const s = toastStyle[toast.type];
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 60, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 60, scale: 0.9, transition: { duration: 0.2 } }}
              transition={{ duration: 0.25, delay: i * 0.05 }}
              className={`glass border-l-4 ${s.border} ${s.bg} pl-3 pr-4 py-2.5 cursor-pointer`}
              onClick={() => removeToast(toast.id)}
            >
              <p className="text-xs text-slate-200 leading-relaxed">
                <span className="mr-1.5">{s.icon}</span>
                {toast.message}
              </p>
              {/* 自动消失进度条 */}
              <div className="mt-1.5 h-0.5 bg-slate-700/50 rounded-full overflow-hidden">
                <div className="h-full bg-slate-500/40 rounded-full animate-[shrink_3s_linear_forwards]" />
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
