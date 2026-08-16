import React, { useState, useEffect, useCallback } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { SaveSystem } from '../../game/systems/SaveSystem';
import { Button } from '../ui/Button';
import { IDENTITIES } from '../../game/data/identities';
import { GOALS } from '../../game/data/goals';
import type { IdentityId, DifficultyId, RegionId } from '../../game/types';

const IDENTITY_CARDS: Record<string, { icon: string; color: string; tags: string[] }> = {
  entrepreneur: { icon: '🚀', color: 'from-purple-500/20 to-orange-500/10', tags: ['$7k启动金', 'Lv.2起步', '自带营业执照'] },
  veteran: { icon: '🏭', color: 'from-cyan-500/20 to-blue-500/10', tags: ['$5k启动金', '采购9折', '海关已备案'] },
  student: { icon: '🎓', color: 'from-emerald-500/20 to-teal-500/10', tags: ['$3.5k启动金', 'Lv.1起步', '达人合作+20%'] },
};

const DIFFICULTY_OPTS: { id: DifficultyId; label: string; desc: string; icon: string }[] = [
  { id: 'easy', label: '轻松', desc: '先开业后补证 · 资金×1.3', icon: '🌱' },
  { id: 'normal', label: '标准', desc: '核心证件必须 · 资金×1.0', icon: '⚖️' },
  { id: 'hard', label: '硬核', desc: '全证才能开业 · 资金×0.9', icon: '🔥' },
];

const REGION_OPTS: { id: RegionId; name: string; desc: string; icon: string }[] = [
  { id: 'SEA', name: '东南亚', desc: 'GST 免税 · 新手友好', icon: '🌏' },
  { id: 'UK', name: '英国', desc: 'VAT 20% · 合规必修课', icon: '🇬🇧' },
  { id: 'US', name: '美国', desc: '高客单价 · 大市场', icon: '🇺🇸' },
];

// 背景动画粒子
const Particles: React.FC = () => {
  const [dots] = useState(() =>
    Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 1 + Math.random() * 2,
      delay: Math.random() * 5,
      duration: 4 + Math.random() * 6,
    }))
  );
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {dots.map(d => (
        <div
          key={d.id}
          className="absolute rounded-full bg-purple-400/20 animate-float"
          style={{
            left: `${d.x}%`, top: `${d.y}%`,
            width: d.size, height: d.size,
            animationDelay: `${d.delay}s`,
            animationDuration: `${d.duration}s`,
          }}
        />
      ))}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-glow-purple rounded-full opacity-30 blur-3xl" />
    </div>
  );
};

export const MainMenu: React.FC = () => {
  const [saves, setSaves] = useState<{ slot: number; slotName: string; timestamp: number; day: number }[]>([]);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'home' | 'setup'>('home');
  const [selIdentity, setSelIdentity] = useState<IdentityId>('entrepreneur');
  const [selDifficulty, setSelDifficulty] = useState<DifficultyId>('normal');
  const [selRegion, setSelRegion] = useState<RegionId>('UK');
  const initNewGame = useGameStore(s => s.initNewGame);
  const loadGame = useGameStore(s => s.loadGame);

  useEffect(() => { SaveSystem.listSaves().then(setSaves); }, []);

  const handleStart = useCallback(() => {
    initNewGame({ identityId: selIdentity, difficultyId: selDifficulty, region: selRegion });
  }, [selIdentity, selDifficulty, selRegion, initNewGame]);

  const handleLoadGame = useCallback(async (slot: number) => {
    setLoading(true);
    const ok = await loadGame(slot);
    setLoading(false);
    if (!ok) alert('存档加载失败');
  }, [loadGame]);

  const goal = GOALS[selDifficulty];

  // ===== 设置页 =====
  if (step === 'setup') {
    return (
      <div className="min-h-screen bg-hero-gradient flex items-center justify-center p-4">
        <Particles />
        <div className="relative z-10 max-w-2xl w-full">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-purple-400">开局设置</h1>
            <button onClick={() => setStep('home')} className="text-slate-500 hover:text-white text-sm cursor-pointer transition-colors">← 返回</button>
          </div>

          {/* 身份选择 */}
          <div className="glass-panel mb-5">
            <h3 className="text-sm font-bold text-slate-400 mb-3">① 选择身份</h3>
            <div className="grid grid-cols-1 gap-3">
              {(Object.keys(IDENTITIES) as IdentityId[]).map(id => {
                const card = IDENTITY_CARDS[id];
                const active = selIdentity === id;
                return (
                  <button
                    key={id}
                    onClick={() => setSelIdentity(id)}
                    className={`text-left p-4 rounded-xl border transition-all cursor-pointer group ${
                      active
                        ? 'border-purple-500 bg-gradient-to-r ' + card.color + ' shadow-glow-purple'
                        : 'border-slate-700/50 bg-slate-900/40 hover:border-slate-500'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{card.icon}</span>
                      <div className="flex-1">
                        <span className="font-bold text-slate-100">{IDENTITIES[id].name}</span>
                        <div className="flex gap-2 mt-1">
                          {card.tags.map(t => (
                            <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800/60 text-slate-400">{t}</span>
                          ))}
                        </div>
                      </div>
                      {active && <span className="text-purple-400 text-lg">✓</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 难度 + 地区 */}
          <div className="grid grid-cols-2 gap-4 mb-5">
            <div className="glass-panel">
              <h3 className="text-sm font-bold text-slate-400 mb-3">② 难度</h3>
              <div className="space-y-2">
                {DIFFICULTY_OPTS.map(o => (
                  <button
                    key={o.id}
                    onClick={() => setSelDifficulty(o.id)}
                    className={`w-full text-left p-3 rounded-lg border transition-all cursor-pointer ${
                      selDifficulty === o.id ? 'border-purple-500 bg-purple-500/10' : 'border-slate-700/50 bg-slate-900/40 hover:border-slate-500'
                    }`}
                  >
                    <span className="text-sm font-medium text-slate-200">{o.icon} {o.label}</span>
                    <p className="text-[11px] text-slate-500 mt-0.5">{o.desc}</p>
                  </button>
                ))}
              </div>
            </div>
            <div className="glass-panel">
              <h3 className="text-sm font-bold text-slate-400 mb-3">③ 地区</h3>
              <div className="space-y-2">
                {REGION_OPTS.map(o => (
                  <button
                    key={o.id}
                    onClick={() => setSelRegion(o.id)}
                    className={`w-full text-left p-3 rounded-lg border transition-all cursor-pointer ${
                      selRegion === o.id ? 'border-purple-500 bg-purple-500/10' : 'border-slate-700/50 bg-slate-900/40 hover:border-slate-500'
                    }`}
                  >
                    <span className="text-sm font-medium text-slate-200">{o.icon} {o.name}</span>
                    <p className="text-[11px] text-slate-500 mt-0.5">{o.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 目标预览 */}
          <div className="glass-panel mb-4 bg-gradient-to-r from-emerald-500/5 to-purple-500/5">
            <p className="text-xs text-slate-500 mb-1">🏁 本局目标</p>
            <p className="text-sm text-emerald-300 font-medium">{goal.label}</p>
          </div>
          <Button variant="primary" size="lg" className="w-full" onClick={handleStart}>
            🚀 进入游戏
          </Button>
        </div>
      </div>
    );
  }

  // ===== 主页 =====
  const hasAutosave = saves.some(s => s.slot === 0);
  const hasManualSaves = saves.some(s => s.slot !== 0);
  return (
    <div className="min-h-screen bg-hero-gradient flex items-center justify-center p-4">
      <Particles />
      <div className="relative z-10 text-center max-w-md w-full">
        {/* Hero */}
        <div className="mb-10 animate-float">
          <div className="text-7xl mb-5 drop-shadow-lg">🛍️</div>
          <h1 className="text-5xl font-extrabold mb-3 bg-gradient-to-r from-purple-400 via-fuchsia-400 to-orange-400 text-transparent bg-clip-text leading-tight">
            TokShop
          </h1>
          <p className="text-lg text-slate-400 font-light">跨境小店模拟器</p>
          <p className="text-xs text-slate-600 mt-2">从零打造你的电商帝国</p>
        </div>

        {/* 操作按钮 */}
        <div className="space-y-3">
          <Button variant="primary" size="lg" className="w-full text-base" onClick={() => setStep('setup')} disabled={loading}>
            🚀 新游戏
          </Button>
          {hasAutosave && (
            <Button variant="secondary" size="lg" className="w-full" onClick={() => handleLoadGame(0)} disabled={loading}>
              ▶️ 继续游戏
            </Button>
          )}
        </div>

        {/* 存档管理 */}
        {hasManualSaves && (
          <div className="mt-8 text-left">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">存档管理</h3>
            <div className="space-y-1.5">
              {saves.filter(s => s.slot !== 0).map(save => (
                <div key={save.slot} className="flex items-center justify-between glass px-4 py-2.5">
                  <div className="text-left">
                    <p className="text-sm text-slate-300">{save.slotName}</p>
                    <p className="text-[11px] text-slate-500">Day {save.day} · {new Date(save.timestamp).toLocaleString('zh-CN')}</p>
                  </div>
                  <div className="flex gap-1.5">
                    <Button size="sm" variant="ghost" onClick={() => handleLoadGame(save.slot)} disabled={loading}>读取</Button>
                    <Button size="sm" variant="ghost" onClick={async () => {
                      if (!confirm('确定删除此存档？')) return;
                      await SaveSystem.delete(save.slot);
                      setSaves(await SaveSystem.listSaves());
                    }}>🗑</Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="text-[10px] text-slate-700 mt-16">TokShop Simulator v2.1.0</p>
      </div>
    </div>
  );
};
