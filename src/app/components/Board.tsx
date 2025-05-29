// filepath: /Users/ho.lesnault/git/perso/PandeGooseium/src/app/components/Board.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Player } from '../../hooks/useWebSocket';
import * as THREE from 'three';

import styles from './Board.module.css';
import styles2D from './Board2D.module.css';

// Refactored components and utilities
import { BoardProps } from './board/BoardTypes';
import { Board2D } from './board/Board2D';
import { Board3D } from './board/Board3D';
import { isSpecial } from './board/SpecialSquares';

// Generate spiral positions for 8x8 board, 63 cells
function generateSpiralPositions(size: number, total: number) {
  const spiral: {row: number; col: number}[] = [];
  let minRow = 0, maxRow = size - 1, minCol = 0, maxCol = size - 1;
  let n = 1;
  while (n <= total) {
    for (let c = minCol; c <= maxCol && n <= total; c++) { spiral.push({ row: minRow, col: c }); n++; }
    minRow++;
    for (let r = minRow; r <= maxRow && n <= total; r++) { spiral.push({ row: r, col: maxCol }); n++; }
    maxCol--;
    for (let c = maxCol; c >= minCol && n <= total; c--) { spiral.push({ row: maxRow, col: c }); n++; }
    maxRow--;
    for (let r = maxRow; r >= minRow && n <= total; r--) { spiral.push({ row: r, col: minCol }); n++; }
    minCol++;
  }
  return spiral;
}
const spiralPositions = generateSpiralPositions(8, 63);

interface MainBoardProps {
  localPlayer: Player | null;
  remotePlayers: Player[];
  onRoll?: () => void;
  lastRoll?: number;
  disabled?: boolean;
  isMulti: boolean;
  toggleMode: () => void;
  is3D: boolean;
  toggleView: () => void;
  isMyTurn: boolean;
  currentTurnPlayerId?: string | null;
  connectedPlayers?: Array<{ id: string; name?: string; color?: string }>;
  feedback?: string;
  position?: number;
  showChat: boolean;
}

// Feedback display component
function FeedbackDisplay({ feedback, position, is2D }: { feedback?: string; position?: number; is2D?: boolean }) {
  if (!feedback) return null;
  
  const displayText = position ? `Case ${position}: ${feedback}` : feedback;
  const className = is2D ? styles2D.feedback : styles.feedback;
  
  return <div className={className}>{displayText}</div>;
}

// Animated player component for 3D board
interface AnimatedPlayer2DProps {
  currentPosition: number;
  targetPosition: number;
  color: string;
  offset: number;
  spacing: number;
  getHeight: (num: number) => number;
  spiralPositions: Array<{ row: number; col: number }>;
}

function AnimatedPlayer2D({ currentPosition, targetPosition, color, offset, spacing, getHeight, spiralPositions }: AnimatedPlayer2DProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [animatedPos, setAnimatedPos] = useState(currentPosition);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (currentPosition !== targetPosition) {
      setAnimating(true);
      const duration = Math.abs(targetPosition - currentPosition) * 200;
      const startTime = Date.now();
      const startPos = animatedPos;
      
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        
        const newPos = startPos + (targetPosition - startPos) * easeProgress;
        setAnimatedPos(newPos);
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setAnimating(false);
        }
      };
      animate();
    }
  }, [currentPosition, targetPosition, animatedPos]);

  useFrame(state => {
    if (!meshRef.current) return;
    
    if (animating) {
      const jumpHeight = 0.3;
      const jumpProgress = Math.sin(state.clock.elapsedTime * 8) * 0.5 + 0.5;
      meshRef.current.position.y += jumpHeight * jumpProgress * 0.1;
    }
  });

  const pos = spiralPositions[Math.floor(animatedPos) - 1] || { row: 0, col: 0 };
  const x = pos.col * spacing + offset;
  const z = pos.row * spacing;
  const baseY = getHeight(Math.floor(animatedPos)) + 0.5;

  return (
    <mesh ref={meshRef} position={[x, baseY, z]} castShadow>
      <cylinderGeometry args={[0.15, 0.15, 0.3, 16]} />
      <meshStandardMaterial 
        color={color}
        roughness={0.3}
        metalness={0.7}
        emissive={color}
        emissiveIntensity={0.2}
      />
    </mesh>
  );
}

export default function Board(props: MainBoardProps) {
  const spacing = 1.2;
  const getHeight = (num: number) => isSpecial(num) ? 0.4 : 0.2;

  // Convert props to match BoardProps interface
  const boardProps: BoardProps = {
    ...props,
    localPlayer: props.localPlayer || undefined,
  };

  if (!props.is3D) {
    return (
      <Board2D
        {...boardProps}
        spiralPositions={spiralPositions}
        styles2D={styles2D}
        FeedbackDisplay={FeedbackDisplay}
      />
    );
  }

  return (
    <Board3D
      {...boardProps}
      spiralPositions={spiralPositions}
      spacing={spacing}
      getHeight={getHeight}
      styles={styles}
      FeedbackDisplay={FeedbackDisplay}
      AnimatedPlayer2D={AnimatedPlayer2D}
    />
  );
}
