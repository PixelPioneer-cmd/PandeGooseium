import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

type DieProps = { onRoll: () => void; lastRoll?: number; disabled?: boolean };

export default function Die({ onRoll, lastRoll, disabled }: DieProps) {
  const [animating, setAnimating] = useState(false);

  const handleClick = () => {
    if (disabled) return;
    setAnimating(true);
    
    // Ajouter un effet sonore ou visuel ici si désiré
    // Par exemple, un flash lumineux sur le plateau
    document.body.classList.add('dice-rolling');
  };

  useEffect(() => {
    if (animating) {
      const timer = setTimeout(() => {
        onRoll();
        setAnimating(false);
        document.body.classList.remove('dice-rolling');
      }, 2000); // durée d'animation augmentée pour plus d'effet
      return () => {
        clearTimeout(timer);
        document.body.classList.remove('dice-rolling');
      };
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
        // fond avec dégradé pour effet 3D
        const gradient = ctx.createLinearGradient(0, 0, size, size);
        gradient.addColorStop(0, '#FFFFFF');
        gradient.addColorStop(1, '#E0E0E0');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, size, size);
        ctx.strokeStyle = 'rgba(0,0,0,0.3)';
        ctx.lineWidth = 8;
        ctx.strokeRect(5, 5, size-10, size-10);
        // chiffre centré avec ombre
        ctx.fillStyle = 'black';
        ctx.shadowColor = 'rgba(0,0,0,0.3)';
        ctx.shadowBlur = 5;
        ctx.shadowOffsetX = 3;
        ctx.shadowOffsetY = 3;
        ctx.font = 'bold 150px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, size / 2, size / 2);
        return new THREE.MeshStandardMaterial({ map: new THREE.CanvasTexture(canvas) });
      });
    }, []);
    
    // Animation améliorée pour le dé
    useFrame((state, delta) => {
      if (animating) {
        // Rotation plus complexe et dynamique
        mesh.current.rotation.x += delta * (8 + Math.sin(state.clock.getElapsedTime() * 2));
        mesh.current.rotation.y += delta * (6 + Math.cos(state.clock.getElapsedTime() * 1.5));
        mesh.current.rotation.z += delta * (4 + Math.sin(state.clock.getElapsedTime() * 3));
        
        // Effet de rebond plus naturel
        const time = state.clock.getElapsedTime();
        const bounce = Math.abs(Math.sin(time * 6));
        const decay = Math.max(0, 1 - time/2); // Ralentissement progressif
        
        mesh.current.position.y = bounce * 0.8 * decay;
        
        // Léger mouvement horizontal pour plus de dynamisme
        mesh.current.position.x = Math.sin(time * 4) * 0.3 * decay;
        mesh.current.position.z = Math.cos(time * 3) * 0.3 * decay;
        
        // Mise à l'échelle pour effet de perspective
        const scale = 1.5 + (bounce * 0.1);
        mesh.current.scale.set(scale, scale, scale);
      }
    });
    
    return (
      <mesh ref={mesh} scale={[1.5, 1.5, 1.5]} material={materials}>
        <boxGeometry args={[1.5, 1.5, 1.5]} />
      </mesh>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2 relative z-10 transform-style-preserve-3d">
      {animating ? (
        <div className="w-24 h-24 sm:w-28 sm:h-28 backdrop-blur-sm bg-black/20 rounded-xl p-2 shadow-[0_0_25px_rgba(255,215,0,0.4)]">
          <Canvas camera={{ position: [3, 3, 3], fov: 50 }}>
            <ambientLight intensity={0.6} />
            <pointLight position={[10, 10, 10]} intensity={1.2} />
            <pointLight position={[-10, -10, -10]} intensity={0.5} color="#ffeb3b" />
            <Cube />
          </Canvas>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <button
            onClick={handleClick}
            disabled={disabled}
            className={`
              px-5 py-3 bg-gradient-to-t from-yellow-600 via-yellow-500 to-yellow-400 text-black font-extrabold rounded-lg 
              shadow-[0_5px_15px_rgba(0,0,0,0.5)] transform transition-all duration-300
              hover:scale-110 hover:shadow-[0_10px_25px_rgba(255,215,0,0.3)]
              hover:bg-gradient-to-t hover:from-yellow-500 hover:via-yellow-400 hover:to-yellow-300
              disabled:opacity-50 text-base sm:text-lg border-2 border-yellow-300 
              active:from-yellow-600 active:to-yellow-700
              ${!disabled ? 'animate-pulse-subtle shadow-[0_0_20px_rgba(255,215,0,0.4)]' : ''}
            `}
            style={{ 
              transform: 'translateZ(20px)',
              textShadow: '0 1px 0 rgba(255,255,255,0.4)',
              letterSpacing: '0.5px'
            }}
          >
            <span className="drop-shadow-[0_1px_1px_rgba(0,0,0,0.3)] relative">
              Lancer le dé
              {/* Effet de surlignage pour améliorer la lisibilité */}
              <span className="absolute inset-0 bg-gradient-to-t from-transparent to-white/10 z-0"></span>
            </span>
          </button>
          {lastRoll != null && (
            <div className="mt-3 flex flex-col items-center bg-black/40 backdrop-blur-md px-5 py-3 rounded-lg border border-yellow-500/30 shadow-[0_5px_15px_rgba(0,0,0,0.3)]">
              <span className="text-white text-sm sm:text-base font-semibold">Résultat:</span>
              <span className="text-yellow-300 text-3xl sm:text-4xl font-extrabold drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">{lastRoll}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}