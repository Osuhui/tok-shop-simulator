import React from 'react';

export const Lighting: React.FC = () => {
  return (
    <>
      {/* 环境光 */}
      <ambientLight intensity={0.4} color="#8ea4c8" />
      {/* 主方向光（模拟太阳） */}
      <directionalLight
        position={[10, 15, 5]}
        intensity={0.8}
        color="#fff5e6"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-far={50}
        shadow-camera-left={-15}
        shadow-camera-right={15}
        shadow-camera-top={15}
        shadow-camera-bottom={-15}
      />
      {/* 补光 */}
      <directionalLight position={[-5, 5, -5]} intensity={0.2} color="#b8c8ff" />
      {/* 半球光（天空/地面） */}
      <hemisphereLight args={['#87CEEB', '#3d2b1f', 0.3]} />
    </>
  );
};
