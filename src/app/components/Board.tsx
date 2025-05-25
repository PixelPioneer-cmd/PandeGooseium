import React, { useState, useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import { Player } from '../../hooks/useWebSocket';
import * as THREE from 'three';

import styles from './Board.module.css';

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

const specialSquares = {
  oie: new Set([5,9,14,18,23,27,32,36,41,45,50,54,59]),
  pont: new Set([6]), 
  hotel: new Set([19]), 
  puits: new Set([31]), 
  labyrinthe: new Set([42]), 
  prison: new Set([52]), 
  mort: new Set([58])
};
function isSpecial(num: number): boolean {
  return Object.values(specialSquares).some(set => set.has(num));
}

interface BoardProps {
  localPlayer: Player | null;
  remotePlayers: Player[];
  onRoll?: () => void;
  lastRoll?: number;
  disabled?: boolean;
  isMulti: boolean;
  toggleMode: () => void;
  is3D: boolean;
  toggleView: () => void;
  isMyTurn?: boolean;
  currentTurnPlayerId?: string | null;
  connectedPlayers?: Player[];
  feedback?: string;
  position?: number;
}

// Hook to capture previous value
function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>(value);
  useEffect(() => { ref.current = value; }, [value]);
  return ref.current;
}

// Composant pour afficher les feedbacks
function FeedbackDisplay({ feedback, position }: { feedback?: string; position?: number }) {
  const [isVisible, setIsVisible] = useState(false);
  const [feedbackType, setFeedbackType] = useState<'success' | 'error' | 'info'>('info');
  const [displayMessage, setDisplayMessage] = useState('');

  useEffect(() => {
    if (feedback) {
      // Déterminer le type de feedback basé sur le contenu
      const lowerFeedback = feedback.toLowerCase();
      if (lowerFeedback.includes('bravo') || lowerFeedback.includes('correct') || lowerFeedback.includes('bonne') || lowerFeedback.includes('gagné')) {
        setFeedbackType('success');
      } else if (lowerFeedback.includes('faux') || lowerFeedback.includes('incorrecte') || lowerFeedback.includes('erreur') || lowerFeedback.includes('perdu')) {
        setFeedbackType('error');
      } else {
        setFeedbackType('info');
      }

      setDisplayMessage(feedback);
      setIsVisible(true);

      // Auto-hide après 4 secondes
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [feedback]);

  // Ajout d'un message de victoire
  useEffect(() => {
    if (position === 40) {
      setFeedbackType('success');
      setDisplayMessage('🎉 Félicitations ! Vous avez gagné ! 🎉');
      setIsVisible(true);
    }
  }, [position]);

  if (!isVisible || !displayMessage) return null;

  const getIcon = () => {
    switch (feedbackType) {
      case 'success': return '✅';
      case 'error': return '❌';
      default: return 'ℹ️';
    }
  };

  return (
    <div className={`${styles.feedbackOverlay} ${styles[feedbackType]}`}>
      <p className={styles.feedbackMessage}>
        <span className={styles.feedbackIcon}>{getIcon()}</span>
        {displayMessage}
      </p>
    </div>
  );
}

// Animated player for 2D board with jump animation
interface AnimatedPlayer2DProps {
  currentPosition: number;
  targetPosition: number;
  color: string;
  offset: number;
  spacing: number;
  getHeight: (num: number) => number;
  spiralPositions: { row: number; col: number }[];
}
function AnimatedPlayer2D({ currentPosition, targetPosition, color, offset, spacing, getHeight, spiralPositions }: AnimatedPlayer2DProps) {
  const prev = usePrevious(currentPosition) ?? currentPosition;
  const [animatedPos, setAnimatedPos] = useState(prev);
  const [animating, setAnimating] = useState(false);
  const groupRef = useRef<THREE.Group>(null!);

  // Trigger cell-to-cell jump when target changes
  useEffect(() => {
    if (currentPosition !== targetPosition && !animating) {
      setAnimating(true);
      const path: number[] = [];
      const step = currentPosition < targetPosition ? 1 : -1;
      for (let p = currentPosition; p !== targetPosition; p += step) {
        path.push(p + step);
      }
      (async () => {
        for (const pos of path) {
          setAnimatedPos(pos);
          await new Promise(r => setTimeout(r, 400));
        }
        setAnimating(false);
      })();
    }
  }, [currentPosition, targetPosition, animating]);

  // Jump animation frame updates
  useFrame(state => {
    if (animating && groupRef.current) {
      const t = state.clock.elapsedTime;
      const heightOffset = Math.abs(Math.sin(t * Math.PI)) * 0.2;
      const baseY = getHeight(animatedPos) + 0.5;
      groupRef.current.position.y = baseY + heightOffset;
    }
  });

  // Determine X,Z base
  const pos = spiralPositions[animatedPos - 1] || { row: 0, col: 0 };
  const x = pos.col * spacing;
  const z = pos.row * spacing;
  const baseY = getHeight(animatedPos) + 0.5;

  return (
    <group ref={groupRef} position={[x + offset, baseY, z]}> 
      <mesh>
        <cylinderGeometry args={[0.15, 0.15, 0.8, 16]} />
        <meshStandardMaterial color={color} roughness={0.2} metalness={0.8} />
      </mesh>
      <mesh position={[0, 0.4, 0]}> 
        <cylinderGeometry args={[0.18, 0.15, 0.1, 16]} />
        <meshStandardMaterial color={color} roughness={0.1} metalness={0.9} emissive={color} emissiveIntensity={0.1} />
      </mesh>
    </group>
  );
}

export default function Board({ localPlayer, remotePlayers, onRoll, lastRoll, disabled, isMulti, toggleMode, is3D, toggleView, isMyTurn, currentTurnPlayerId, connectedPlayers, feedback, position }: BoardProps) {
  const spacing = 1.2;
  const getHeight = (num: number) => isSpecial(num) ? 0.4 : 0.2;
  // Color mapping for special squares
  const getSquareColor = (num: number) => {
    if (specialSquares.oie.has(num)) return '#FFD700';
    if (specialSquares.pont.has(num)) return '#8B4513';
    if (specialSquares.hotel.has(num)) return '#FF6B6B';
    if (specialSquares.puits.has(num)) return '#4ECDC4';
    if (specialSquares.labyrinthe.has(num)) return '#9B59B6';
    if (specialSquares.prison.has(num)) return '#95A5A6';
    if (specialSquares.mort.has(num)) return '#2C3E50';
    return '#8b4513';
  };
  // Track previous positions for animation
  const [prevLocalPos, setPrevLocalPos] = useState(localPlayer?.position || 1);
  const [prevRemotePos, setPrevRemotePos] = useState<Record<string, number>>({});
  useEffect(() => {
    if (localPlayer?.position && localPlayer.position !== prevLocalPos) {
      setPrevLocalPos(localPlayer.position);
    }
  }, [localPlayer?.position, prevLocalPos]);
  useEffect(() => {
    const updated = { ...prevRemotePos };
    let changed = false;
    remotePlayers.forEach(p => {
      if (p.position && p.position !== prevRemotePos[p.id]) {
        updated[p.id] = p.position;
        changed = true;
      }
    });
    if (changed) setPrevRemotePos(updated);
  }, [remotePlayers, prevRemotePos]);

  return (
    <div className={styles.board3DContainer}>
      {/* Controls bar with title and all buttons */}
      <div className={styles.controlsBar}>
        <h2 className={styles.gameTitle}>L&apos;Oie des Enfers</h2>
        {isMulti && (
          <div className={styles.turnStatus}>
            <span className={`${styles.turnIndicator} ${isMyTurn ? styles.myTurn : styles.waitingTurn}`}>
              {isMyTurn 
                ? "🟢 À votre tour" 
                : `⏳ Tour de ${connectedPlayers?.find(p => p.id === currentTurnPlayerId)?.name || '...'}`
              }
            </span>
          </div>
        )}
        <div className={styles.buttonGroup}>
          <button onClick={toggleMode} className={styles.controlButton}>
            Mode: {isMulti ? 'Multi' : 'Solo'}
          </button>
          <button onClick={toggleView} className={styles.controlButton}>
            Vue: {is3D ? '3D' : '2D'}
          </button>
          {onRoll && (
            <button className={styles.rollButton} onClick={onRoll} disabled={disabled}>
              {lastRoll ? `🎲 ${lastRoll}` : '🎲 Lancer'}
            </button>
          )}
        </div>
      </div>
      <Canvas 
        camera={{ position: [4.5, 6, 10], fov: 50 }} 
        style={{ width: '100%', height: '100%' }}
        shadows
      >
        <ambientLight intensity={0.4} />
        <directionalLight 
          position={[5, 10, 5]} 
          intensity={1} 
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <pointLight position={[-5, 5, -5]} intensity={0.3} color="#FFD700" />
        
        <OrbitControls 
          target={[4.2, 0, 4.2]}
          enablePan 
          enableRotate 
          enableZoom 
          maxDistance={20}
          minDistance={5}
          maxPolarAngle={Math.PI / 2}
        />
        
        {/* Sol du plateau (centered) */}
        <mesh position={[4.2, -0.1, 4.2]} receiveShadow>
          <boxGeometry args={[10, 0.2, 10]} />
          <meshStandardMaterial color="#2C3E50" />
        </mesh>
        
        {/* Cases du plateau */}
        {spiralPositions.map((pos, i) => {
          const num = i + 1;
          const h = getHeight(num);
          const x = pos.col * spacing;
          const z = pos.row * spacing;
          const color = getSquareColor(num);
          
          return (
            <group key={num}>
              {/* Case principale */}
              <mesh position={[x, h/2, z]} castShadow receiveShadow>
                <boxGeometry args={[0.9, h, 0.9]} />
                <meshStandardMaterial 
                  color={color} 
                  roughness={0.3}
                  metalness={0.1}
                />
              </mesh>
              
              {/* Numéro de la case */}
              <Text
                position={[x, h + 0.05, z]}
                rotation={[-Math.PI/2, 0, 0]}
                fontSize={0.2}
                color='#fff'
                anchorX="center"
                anchorY="middle"
              >
                {num}
              </Text>
              
              {/* Bordure lumineuse pour les cases spéciales */}
              {isSpecial(num) && (
                <mesh position={[x, h/2, z]}>
                  <boxGeometry args={[1, h + 0.02, 1]} />
                  <meshStandardMaterial 
                    color={color}
                    transparent
                    opacity={0.3}
                    emissive={color}
                    emissiveIntensity={0.2}
                  />
                </mesh>
              )}
            </group>
          );
        })}
        
        {/* Pions des joueurs animés */}
        {spiralPositions.map((pos, i) => {
           const num = i + 1;
           // Collect players on this cell
           const playersAtNum: Array<{ key: string; color: string; position: number; isLocal: boolean; id?: string; offset?: number }> = [];
           if (localPlayer?.position === num) {
             playersAtNum.push({ key: `local-${num}`, color: localPlayer.color || '#FFD700', position: num, isLocal: true });
           }
           remotePlayers.forEach((p, idx) => {
             if (p.position === num) {
               playersAtNum.push({ key: `remote-${p.id}-${num}`, color: p.color || `hsl(${(idx+1)*60},70%,50%)`, position: num, isLocal: false, id: p.id });
             }
           });
           if (!playersAtNum.length) return null;
           // Compute symmetric offsets
           const offsetSpacing = 0.25;
           const count = playersAtNum.length;
           playersAtNum.forEach((p, idx) => {
             p.offset = (idx - (count - 1) / 2) * offsetSpacing;
           });
           return playersAtNum.map(p => (
             <AnimatedPlayer2D
               key={p.key}
               currentPosition={p.isLocal ? prevLocalPos : prevRemotePos[p.id!] || 1}
               targetPosition={p.position}
               color={p.color}
               offset={p.offset!}
               spacing={spacing}
               getHeight={getHeight}
               spiralPositions={spiralPositions}
             />
           ));
         })}
      </Canvas>
      <FeedbackDisplay feedback={feedback} position={position} />
    </div>
  );
}