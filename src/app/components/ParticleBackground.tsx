"use client";
import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

type ParticleBackgroundProps = { count?: number; color?: string; size?: number; speed?: number };

function Particles({ count = 200, color = '#ffffff', size = 0.5, speed = 0.1 }: ParticleBackgroundProps) {
  const mesh = useRef<THREE.Points>(null!);
  const positions = useMemo(() => {
    const pts = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i++) {
      pts[i] = (Math.random() - 0.5) * 50;
    }
    return pts;
  }, [count]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() * speed;
    if (mesh.current) mesh.current.rotation.y = t;
  });

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute
          attach='attributes-position'
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial color={color} size={size} sizeAttenuation />
    </points>
  );
}

export default function ParticleBackground() {
  return (
    <Canvas
      className='absolute inset-0 -z-20 pointer-events-none'
      camera={{ position: [0, 0, 20], fov: 75 }}
    >
      <ambientLight intensity={0.3} />
      <Particles count={800} color='#ff4444' size={0.3} speed={0.02} />
      <Particles count={500} color='#ffffff' size={0.6} speed={0.1} />
    </Canvas>
  );
}