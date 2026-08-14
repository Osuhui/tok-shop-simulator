import React from 'react';
import { useGameStore } from './stores/gameStore';
import { MainMenu } from './components/screens/MainMenu';
import { GameScreen } from './components/screens/GameScreen';

const App: React.FC = () => {
  const gamePhase = useGameStore(s => s.gamePhase);

  switch (gamePhase) {
    case 'menu':
      return <MainMenu />;
    case 'playing':
    case 'event':
      return <GameScreen />;
    case 'gameOver':
      return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center">
          <div className="text-center px-6">
            <div className="text-6xl mb-4">💸</div>
            <h1 className="text-3xl font-bold text-red-400 mb-2">破产了！</h1>
            <p className="text-slate-400 mb-6">资金耗尽，你的跨境小店之旅暂告一段落。</p>
            <button
              onClick={() => {
                const store = useGameStore.getState();
                store.initNewGame();
              }}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-medium cursor-pointer transition-colors"
            >
              🔄 重新开始
            </button>
          </div>
        </div>
      );
    case 'victory':
      return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center">
          <div className="text-center px-6">
            <div className="text-6xl mb-4">🏆</div>
            <h1 className="text-3xl font-bold text-emerald-400 mb-2">通关达成！</h1>
            <p className="text-slate-400 mb-2">你达成了本档位的经营目标，跨境小店成长为真正的电商帝国！</p>
            <p className="text-slate-500 text-sm mb-6">Day {useGameStore.getState().player.day} · 店铺 Lv.{useGameStore.getState().player.shopLevel}</p>
            <button
              onClick={() => useGameStore.getState().initNewGame()}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-medium cursor-pointer transition-colors"
            >
              🔄 再玩一局
            </button>
          </div>
        </div>
      );
    default:
      return <MainMenu />;
  }
};

export default App;
