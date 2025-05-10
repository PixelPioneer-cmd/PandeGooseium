import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

type DieProps = { onRoll: () => void; lastRoll?: number; disabled?: boolean };

export default function Die({ onRoll, lastRoll, disabled }: DieProps) {
  const [animating, setAnimating] = useState(false);

  const handleClick = () => {
    if (disabled) return;
    setAnimating(true);
  };

  useEffect(() => {
    if (animating) {
      const timer = setTimeout(() => {
        onRoll();
        setAnimating(false);
      }, 1500); // augmenter la durée à 1.5s
      return () => clearTimeout(timer);
    }
  }, [animating, onRoll]);

  function Cube() {
    const mesh = useRef<THREE.Mesh>(null!);
    // générer dynamiquement des textures pour chaque face avec Canvas
    const materials = useMemo(() => {
      const size = 256;
      const labels = ['1','2','3','4','5','6'];
      return labels.map((label) => {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d')!;
        // fond blanc avec bord noir
        ctx.fillStyle = 'white'; ctx.fillRect(0, 0, size, size);
        ctx.strokeStyle = 'black'; ctx.lineWidth = 10;
        ctx.strokeRect(0, 0, size, size);
        // chiffre centré
        ctx.fillStyle = 'black';
        ctx.font = 'bold 150px Arial';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(label, size / 2, size / 2);
        return new THREE.MeshStandardMaterial({ map: new THREE.CanvasTexture(canvas) });
      });
    }, []);
    useFrame((state, delta) => {
      mesh.current.rotation.x += delta * 2; // rotation plus lente
      mesh.current.rotation.y += delta * 2;
    });
    return (
      <mesh ref={mesh} scale={[1.5, 1.5, 1.5]} material={materials}>
        <boxGeometry args={[1.5, 1.5, 1.5]} />
      </mesh>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2">
      {animating ? (
        <div className="w-16 h-16 sm:w-32 sm:h-32">
          <Canvas camera={{ position: [3, 3, 3], fov: 50 }}>
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} />
            <Cube />
          </Canvas>
        </div>
      ) : (
        <>
          <button
            onClick={handleClick}
            disabled={disabled}
            className="px-3 py-1 sm:px-4 sm:py-2 bg-yellow-400 text-black font-bold rounded disabled:opacity-50 text-sm sm:text-base"
          >
            Lancer
          </button>
          {lastRoll != null && (
            <span className="text-white text-sm sm:text-base">Résultat: {lastRoll}</span>
          )}
        </>
      )}
    </div>
  );
}