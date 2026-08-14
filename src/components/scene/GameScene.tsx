import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, PerspectiveCamera } from '@react-three/drei';
import { Office } from './Office';
import { Lighting } from './Lighting';
import { useGameStore } from '../../stores/gameStore';

export const GameScene: React.FC = () => {
  const activeScene = useGameStore(s => s.activeScene);

  return (
    <div className="absolute inset-0">
      <Canvas shadows dpr={[1, 2]} gl={{ antialias: true, alpha: false }}>
        <Suspense fallback={null}>
          <PerspectiveCamera makeDefault position={[8, 10, 8]} fov={50} />
          <Lighting />
          <Environment preset="city" />

          {activeScene === 'office' && <Office />}
          {/* 其他场景在后续Phase添加 */}
        </Suspense>
      </Canvas>

      {/* 加载提示 */}
      <div className="absolute bottom-24 left-1/2 -translate-x-1/2 text-xs text-slate-600">
        点击场景中的物体以交互 · 拖拽旋转视角 · 滚轮缩放
      </div>
    </div>
  );
};
