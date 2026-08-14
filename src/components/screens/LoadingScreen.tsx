import React, { useEffect, useState } from 'react';
import { ProgressBar } from '../ui/ProgressBar';

interface Props {
  onComplete: () => void;
}

export const LoadingScreen: React.FC<Props> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [tip, setTip] = useState('');

  const tips = [
    '💡 选品是关键：热门品类竞争大但利润高，冷门品类竞争小但流量少',
    '⚠️ 注意合规：使用品牌词会导致店铺扣分甚至封店',
    '🤝 达人合作：佣金越高成功率越大，但别忘了算利润',
    '📦 及时发货：超时未发货会扣除店铺健康分和罚款',
    '🌍 不同区域有不同的规则和客单价，选择合适的市场',
    '💰 现金流管理：爆单时资金链断裂是新卖家的头号杀手',
    '🏪 店铺等级影响解锁新区域和更多商品',
  ];

  useEffect(() => {
    const tipInterval = setInterval(() => {
      setTip(tips[Math.floor(Math.random() * tips.length)]);
    }, 2000);

    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          clearInterval(tipInterval);
          setTimeout(onComplete, 300);
          return 100;
        }
        return prev + Math.random() * 30 + 5;
      });
    }, 300);

    // 初始提示
    setTip(tips[0]);

    return () => {
      clearInterval(tipInterval);
      clearInterval(progressInterval);
    };
  }, [onComplete, tips]);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="text-center max-w-md w-full px-6">
        <div className="text-5xl mb-6">🛍️</div>
        <h1 className="text-2xl font-bold text-white mb-2">TokShop Simulator</h1>
        <p className="text-slate-500 text-sm mb-8">正在为你准备跨境小店...</p>

        <div className="mb-6">
          <ProgressBar
            value={progress}
            max={100}
            color="#a855f7"
            height="h-2"
          />
        </div>

        <p className="text-xs text-slate-600 animate-pulse">{tip}</p>
      </div>
    </div>
  );
};
