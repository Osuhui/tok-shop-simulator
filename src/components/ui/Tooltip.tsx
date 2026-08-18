import React, { useState } from 'react';

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  /** 气泡出现位置，默认在上方（nav 等底部元素用 'top' 更安全） */
  side?: 'top' | 'bottom';
  /** 气泡最大宽度（Tailwind 宽度类），默认 w-52 */
  widthClass?: string;
}

/**
 * 轻量悬停/聚焦提示。零基础玩家把鼠标移到带 ⓘ 的标签上即可看到大白话解释，
 * 也可 Tab 聚焦触发（无障碍）。不依赖任何第三方库，纯 Tailwind。
 */
export const Tooltip: React.FC<TooltipProps> = ({ content, children, side = 'top', widthClass = 'w-52' }) => {
  const [show, setShow] = useState(false);
  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onFocus={() => setShow(true)}
      onBlur={() => setShow(false)}
      tabIndex={0}
    >
      {children}
      {show && (
        <span
          role="tooltip"
          className={`pointer-events-none absolute left-1/2 -translate-x-1/2 z-50 ${widthClass} p-2 text-xs leading-relaxed text-slate-200 bg-slate-800 border border-slate-600 rounded-lg shadow-xl ${
            side === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'
          }`}
        >
          {content}
        </span>
      )}
    </span>
  );
};
