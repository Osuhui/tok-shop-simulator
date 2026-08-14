import React from 'react';
import { useGameStore } from '../../stores/gameStore';

/**
 * 办公室场景 - Phase 0 简化版本
 * 包含：地板、墙壁、电脑桌、打包台、货架
 */
export const Office: React.FC = () => {
  const setActivePanel = useGameStore(s => s.setActivePanel);
  const activePanel = useGameStore(s => s.activePanel);
  const orders = useGameStore(s => s.orders);
  const pendingCount = orders.filter(o => o.status === 'pending').length;

  const handleClick = (panelId: string) => (e: any) => {
    e.stopPropagation();
    setActivePanel(activePanel === panelId ? null : panelId);
  };

  return (
    <group>
      {/* ===== 地板 ===== */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[16, 12]} />
        <meshStandardMaterial color="#1a1a2e" roughness={0.9} />
      </mesh>

      {/* ===== 后墙 ===== */}
      <mesh position={[0, 2.5, -6]} receiveShadow>
        <boxGeometry args={[16, 5, 0.3]} />
        <meshStandardMaterial color="#2a2a3e" roughness={0.8} />
      </mesh>

      {/* ===== 电脑桌 ===== */}
      <group position={[-3, 0, -1]}>
        {/* 桌面 */}
        <mesh position={[0, 0.85, 0]} castShadow>
          <boxGeometry args={[2.4, 0.08, 1.2]} />
          <meshStandardMaterial color="#3d2b1f" roughness={0.6} />
        </mesh>
        {/* 桌腿 */}
        <mesh position={[-1, 0.4, -0.5]}>
          <cylinderGeometry args={[0.06, 0.06, 0.8, 16]} />
          <meshStandardMaterial color="#2a2a2a" metalness={0.5} roughness={0.5} />
        </mesh>
        <mesh position={[1, 0.4, -0.5]}>
          <cylinderGeometry args={[0.06, 0.06, 0.8, 16]} />
          <meshStandardMaterial color="#2a2a2a" metalness={0.5} roughness={0.5} />
        </mesh>
        <mesh position={[-1, 0.4, 0.5]}>
          <cylinderGeometry args={[0.06, 0.06, 0.8, 16]} />
          <meshStandardMaterial color="#2a2a2a" metalness={0.5} roughness={0.5} />
        </mesh>
        <mesh position={[1, 0.4, 0.5]}>
          <cylinderGeometry args={[0.06, 0.06, 0.8, 16]} />
          <meshStandardMaterial color="#2a2a2a" metalness={0.5} roughness={0.5} />
        </mesh>
        {/* 显示器 */}
        <mesh position={[0, 1.3, -0.35]} castShadow onClick={handleClick('dashboard')}>
          <boxGeometry args={[1.2, 0.75, 0.05]} />
          <meshStandardMaterial color="#0a0a1a" emissive="#1a1a3a" emissiveIntensity={0.5} />
        </mesh>
        {/* 屏幕发光 */}
        <mesh position={[0, 1.3, -0.38]}>
          <planeGeometry args={[1.1, 0.65]} />
          <meshBasicMaterial color="#1e3a5f" />
        </mesh>
        {/* 底座 */}
        <mesh position={[0, 0.9, -0.35]}>
          <cylinderGeometry args={[0.15, 0.18, 0.08, 16]} />
          <meshStandardMaterial color="#1a1a1a" />
        </mesh>
      </group>

      {/* ===== 打包台 ===== */}
      <group position={[3, 0, -1]}>
        <mesh position={[0, 0.9, 0]} castShadow>
          <boxGeometry args={[2.5, 0.1, 1.5]} />
          <meshStandardMaterial color="#4a3728" roughness={0.7} />
        </mesh>
        {[-1, 1].map(x =>
          [-0.6, 0.6].map(z => (
            <mesh key={`${x}-${z}`} position={[x, 0.45, z]}>
              <cylinderGeometry args={[0.07, 0.07, 0.9, 16]} />
              <meshStandardMaterial color="#3a3a3a" metalness={0.6} roughness={0.4} />
            </mesh>
          ))
        )}
        {/* 包裹堆叠（动态数量） */}
        {pendingCount > 0 && Array.from({ length: Math.min(pendingCount, 5) }).map((_, i) => (
          <mesh
            key={`parcel-${i}`}
            position={[0.3 * i - 0.6, 1.05 + i * 0.15, 0.2 * (i % 2)]}
            onClick={handleClick('logistics')}
            castShadow
          >
            <boxGeometry args={[0.25, 0.2, 0.3]} />
            <meshStandardMaterial
              color={['#d4844a', '#c4a35a', '#b8845a', '#d4945a', '#c4743a'][i]}
              roughness={0.8}
            />
          </mesh>
        ))}
      </group>

      {/* ===== 货架 ===== */}
      <group position={[3, 0, 3]}>
        {[0, 1.2, 2.4].map((y, i) => (
          <mesh key={`shelf-${i}`} position={[0, 0.5 + y, 0]} castShadow>
            <boxGeometry args={[2, 0.06, 0.8]} />
            <meshStandardMaterial color="#4a4a4a" metalness={0.8} roughness={0.3} />
          </mesh>
        ))}
        {/* 侧板 */}
        {[-1.05, 1.05].map(x => (
          <mesh key={`side-${x}`} position={[x, 1.7, 0]}>
            <boxGeometry args={[0.06, 3.4, 0.8]} />
            <meshStandardMaterial color="#3a3a3a" metalness={0.7} roughness={0.3} />
          </mesh>
        ))}
      </group>

      {/* ===== 白板 ===== */}
      <group position={[-5, 1.5, -3]}>
        <mesh position={[0, 0, 0]} castShadow>
          <boxGeometry args={[1.8, 1.2, 0.05]} />
          <meshStandardMaterial color="#f8f8f8" roughness={0.2} />
        </mesh>
        <mesh position={[0, 0, -0.05]}>
          <boxGeometry args={[2, 1.4, 0.03]} />
          <meshStandardMaterial color="#4a4a4a" metalness={0.9} roughness={0.2} />
        </mesh>
      </group>
    </group>
  );
};
