"use client";
import React from 'react';
import { Canvas } from '@react-three/fiber';
import { MeshDistortMaterial } from '@react-three/drei';

export default function BackgroundNova() {
  return (
    <Canvas className="absolute inset-0 -z-10 pointer-events-none" camera={{ position: [0, 0, 5], fov: 75 }}>
      <ambientLight intensity={0.5} />
      <mesh>
        <sphereGeometry args={[10, 128, 128]} />
        <MeshDistortMaterial color="#220000" distort={0.3} speed={0.5} />
      </mesh>
    </Canvas>
  );
}