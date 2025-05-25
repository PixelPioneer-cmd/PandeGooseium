import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Système de particules magiques pour l'ambiance
export function MagicalParticles() {
  const mesh = useRef<THREE.Points>(null);
  const count = 100;
  
  const particles = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const scales = new Float32Array(count);
    
    for (let i = 0; i < count; i++) {
      // Position aléatoire autour du plateau
      positions[i * 3] = (Math.random() - 0.5) * 25;
      positions[i * 3 + 1] = Math.random() * 20 + 2;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 25;
      
      // Couleurs dorées et bleues alternées
      const golden = Math.random() > 0.5;
      colors[i * 3] = golden ? 1 : 0.2;
      colors[i * 3 + 1] = golden ? 0.8 : 0.5;
      colors[i * 3 + 2] = golden ? 0 : 1;
      
      scales[i] = Math.random() * 0.5 + 0.5;
    }
    
    return { positions, colors, scales };
  }, []);

  useFrame((state) => {
    if (mesh.current) {
      const time = state.clock.elapsedTime;
      mesh.current.rotation.y = time * 0.02;
      
      // Animation des particules flottantes
      const positions = mesh.current.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < count; i++) {
        positions[i * 3 + 1] += Math.sin(time + i) * 0.01;
      }
      mesh.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={particles.positions}
          itemSize={3}
          args={[particles.positions, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          count={count}
          array={particles.colors}
          itemSize={3}
          args={[particles.colors, 3]}
        />
        <bufferAttribute
          attach="attributes-scale"
          count={count}
          array={particles.scales}
          itemSize={1}
          args={[particles.scales, 1]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        transparent
        opacity={0.8}
        vertexColors
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

// Effet de brouillard mystique
export function MysticFog() {
  const mesh = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (mesh.current && mesh.current.material instanceof THREE.MeshStandardMaterial) {
      mesh.current.rotation.y = state.clock.elapsedTime * 0.01;
      mesh.current.material.opacity = 0.1 + Math.sin(state.clock.elapsedTime * 0.5) * 0.05;
    }
  });

  return (
    <mesh ref={mesh} position={[3.5, 2, 3.5]}>
      <cylinderGeometry args={[15, 12, 8, 32, 1, true]} />
      <meshStandardMaterial
        color="#9B59B6"
        transparent
        opacity={0.15}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

// Lumières dynamiques pour créer l'ambiance
export function DynamicLights() {
  const lightRef1 = useRef<THREE.PointLight>(null);
  const lightRef2 = useRef<THREE.PointLight>(null);
  
  useFrame((state) => {
    const time = state.clock.elapsedTime;
    
    if (lightRef1.current) {
      lightRef1.current.position.x = Math.sin(time * 0.5) * 8;
      lightRef1.current.position.z = Math.cos(time * 0.5) * 8;
      lightRef1.current.intensity = 0.3 + Math.sin(time * 2) * 0.1;
    }
    
    if (lightRef2.current) {
      lightRef2.current.position.x = Math.cos(time * 0.3) * 10;
      lightRef2.current.position.z = Math.sin(time * 0.3) * 10;
      lightRef2.current.intensity = 0.4 + Math.cos(time * 1.5) * 0.1;
    }
  });

  return (
    <>
      <pointLight 
        ref={lightRef1}
        position={[0, 8, 0]} 
        intensity={0.3} 
        color="#FFD700"
        distance={20}
      />
      <pointLight 
        ref={lightRef2}
        position={[7, 6, 7]} 
        intensity={0.4} 
        color="#3B82F6"
        distance={15}
      />
    </>
  );
}
