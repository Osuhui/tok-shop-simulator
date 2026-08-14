import React from 'react';
import { motion } from 'framer-motion';

interface PanelProps {
  title: string;
  children: React.ReactNode;
  onClose?: () => void;
  className?: string;
  headerRight?: React.ReactNode;
}

export const Panel: React.FC<PanelProps> = ({
  title,
  children,
  onClose,
  className = '',
  headerRight,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className={`backdrop-blur-xl bg-slate-900/80 border border-slate-700/40 rounded-2xl overflow-hidden shadow-card ${className}`}
    >
      <div className="gradient-border flex items-center justify-between px-5 py-3.5">
        <h3 className="text-base font-bold text-slate-100">{title}</h3>
        <div className="flex items-center gap-2">
          {headerRight}
          {onClose && (
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-700/50 hover:bg-slate-600/80 text-slate-400 hover:text-white transition-all cursor-pointer text-sm"
            >
              ✕
            </button>
          )}
        </div>
      </div>
      <div className="p-5">{children}</div>
    </motion.div>
  );
};
