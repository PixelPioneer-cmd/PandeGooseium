import React, { useState, useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import { Player } from '../../hooks/useWebSocket';
import * as THREE from 'three';

import styles from './Board.module.css';
import styles2D from './Board2D.module.css';

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
  showChat?: boolean;
}

// Hook to capture previous value
function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>(value);
  useEffect(() => { ref.current = value; }, [value]);
  return ref.current;
}

// Composant pour afficher les feedbacks
function FeedbackDisplay({ feedback, position, is2D }: { feedback?: string; position?: number; is2D?: boolean }) {
  const [isVisible, setIsVisible] = useState(false);
  const [feedbackType, setFeedbackType] = useState<'success' | 'error' | 'info'>('info');
  const [displayMessage, setDisplayMessage] = useState('');
  
  const cssStyles = is2D ? styles2D : styles;

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
    <div className={`${cssStyles.feedbackOverlay} ${cssStyles[feedbackType]}`}>
      <p className={cssStyles.feedbackMessage}>
        <span className={cssStyles.feedbackIcon}>{getIcon()}</span>
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

export default function Board({ localPlayer, remotePlayers, onRoll, lastRoll, disabled, isMulti, toggleMode, is3D, toggleView, isMyTurn, currentTurnPlayerId, connectedPlayers, feedback, position, showChat }: BoardProps) {
  const spacing = 1.2;
  const getHeight = (num: number) => isSpecial(num) ? 0.4 : 0.2;
  
  // Color mapping for special squares (for CSS class names in 2D mode)
  const getSquareClass = (num: number) => {
    if (specialSquares.oie.has(num)) return 'oieSquare';
    if (specialSquares.pont.has(num)) return 'pontSquare';
    if (specialSquares.hotel.has(num)) return 'hotelSquare';
    if (specialSquares.puits.has(num)) return 'puitsSquare';
    if (specialSquares.labyrinthe.has(num)) return 'labyrintheSquare';
    if (specialSquares.prison.has(num)) return 'prisonSquare';
    if (specialSquares.mort.has(num)) return 'mortSquare';
    return '';
  };

  // Color mapping for special squares (for 3D mode)
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

  // Render 2D board
  if (!is3D) {
    return (
      <div className={`${styles2D.boardContainer} ${showChat ? styles2D.withChat : ''}`}>
        {/* Board wrapper for flex layout */}
        <div className={styles2D.board2DWrapper}>
          {/* Controls bar */}
          <div className={styles2D.controlsBar}>
            <h2 className={styles2D.gameTitle}>L&apos;Oie des Enfers</h2>
            {isMulti && (
              <div className={styles2D.turnStatus}>
                <span className={`${styles2D.turnIndicator} ${isMyTurn ? styles2D.myTurn : styles2D.waitingTurn}`}>
                  {isMyTurn 
                    ? "🟢 À votre tour" 
                    : `⏳ Tour de ${connectedPlayers?.find(p => p.id === currentTurnPlayerId)?.name || '...'}`
                  }
                </span>
              </div>
            )}
            <div className={styles2D.buttonGroup}>
              <button onClick={toggleMode} className={styles2D.controlButton}>
                Mode: {isMulti ? 'Multi' : 'Solo'}
              </button>
              <button onClick={toggleView} className={styles2D.controlButton}>
                Vue: {is3D ? '3D' : '2D'}
              </button>
              {onRoll && (
                <button className={styles2D.rollButton} onClick={onRoll} disabled={disabled}>
                  {lastRoll ? `🎲 ${lastRoll}` : '🎲 Lancer'}
                </button>
              )}
            </div>
          </div>

          {/* 2D Board Grid */}
          <div className={styles2D.boardGrid}>
            <div className={styles2D.spiralBoard}>
              {spiralPositions.map((pos, i) => {
                const num = i + 1;
                const squareClass = getSquareClass(num);
                const isCurrentPlayerHere = localPlayer?.position === num;
                const remotePlayersHere = remotePlayers.filter(p => p.position === num);
                const hasPlayers = isCurrentPlayerHere || remotePlayersHere.length > 0;

                return (
                  <div
                    key={num}
                    className={`${styles2D.boardSquare} ${squareClass ? styles2D[squareClass] : ''} ${hasPlayers ? styles2D.hotSquare : ''}`}
                    style={{
                      gridColumn: pos.col + 1,
                      gridRow: pos.row + 1,
                    }}
                  >
                    <div className={styles2D.squareFront}>
                      {num}
                      {specialSquares.oie.has(num) && <span className={styles2D.specialIcon}>🪿</span>}
                      {specialSquares.pont.has(num) && <span className={styles2D.specialIcon}>🌉</span>}
                      {specialSquares.hotel.has(num) && <span className={styles2D.specialIcon}>🏨</span>}
                      {specialSquares.puits.has(num) && <span className={styles2D.specialIcon}>🏚️</span>}
                      {specialSquares.labyrinthe.has(num) && <span className={styles2D.specialIcon}>🌀</span>}
                      {specialSquares.prison.has(num) && <span className={styles2D.specialIcon}>⛓️</span>}
                      {specialSquares.mort.has(num) && <span className={styles2D.specialIcon}>💀</span>}
                    </div>

                    {/* Local player piece */}
                    {isCurrentPlayerHere && (
                      <div 
                        className={`${styles2D.gamePiece} ${styles2D.localTower}`}
                        style={{ 
                          marginLeft: remotePlayersHere.length > 0 ? '-0.5rem' : undefined 
                        }}
                      >
                        J1
                      </div>
                    )}

                    {/* Remote players pieces */}
                    {remotePlayersHere.map((player, idx) => (
                      <div 
                        key={player.id}
                        className={`${styles2D.gamePiece} ${styles2D.remoteTower}`}
                        style={{ 
                          marginLeft: `${0.5 + idx * 0.3}rem`,
                          marginTop: `${-1 - idx * 0.1}rem`
                        }}
                      >
                        J{idx + 2}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>

          <FeedbackDisplay feedback={feedback} position={position} is2D={true} />
        </div>
      </div>
    );
  }

  // Render 3D board
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
        <ambientLight intensity={0.3} />
        <directionalLight 
          position={[5, 10, 5]} 
          intensity={0.8} 
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-near={0.1}
          shadow-camera-far={50}
          shadow-camera-left={-10}
          shadow-camera-right={10}
          shadow-camera-top={10}
          shadow-camera-bottom={-10}
        />
        <pointLight position={[-5, 5, -5]} intensity={0.4} color="#FFD700" />
        <pointLight position={[5, 5, -5]} intensity={0.3} color="#4ECDC4" />
        <pointLight position={[-5, 5, 5]} intensity={0.3} color="#9B59B6" />
        <pointLight position={[4, 8, 4]} intensity={0.5} color="#FF6B6B" />
        
        {/* Lumière d'ambiance pour les cases spéciales */}
        <spotLight
          position={[4, 12, 4]}
          angle={Math.PI / 3}
          penumbra={0.5}
          intensity={0.6}
          color="#ffffff"
          castShadow
        />
        
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
        
        {/* Cases du plateau avec effets améliorés */}
        {spiralPositions.map((pos, i) => {
          const num = i + 1;
          const h = getHeight(num);
          const x = pos.col * spacing;
          const z = pos.row * spacing;
          const color = getSquareColor(num);
          const isSpecialSquare = isSpecial(num);
          
          return (
            <group key={num}>
              {/* Base de la case avec effet de profondeur */}
              <mesh position={[x, h/2 - 0.02, z]} castShadow receiveShadow>
                <boxGeometry args={[0.95, h + 0.04, 0.95]} />
                <meshStandardMaterial 
                  color="#1a1a1a"
                  roughness={0.8}
                  metalness={0.2}
                />
              </mesh>
              
              {/* Case principale avec matériau avancé */}
              <mesh position={[x, h/2, z]} castShadow receiveShadow>
                <boxGeometry args={[0.9, h, 0.9]} />
                <meshStandardMaterial 
                  color={color} 
                  roughness={isSpecialSquare ? 0.1 : 0.4}
                  metalness={isSpecialSquare ? 0.6 : 0.2}
                  emissive={isSpecialSquare ? color : '#000000'}
                  emissiveIntensity={isSpecialSquare ? 0.1 : 0}
                />
              </mesh>
              
              {/* Bordure décorative pour toutes les cases */}
              <mesh position={[x, h + 0.001, z]}>
                <boxGeometry args={[0.92, 0.002, 0.92]} />
                <meshStandardMaterial 
                  color={isSpecialSquare ? '#ffffff' : '#444444'}
                  transparent
                  opacity={isSpecialSquare ? 0.8 : 0.3}
                  emissive={isSpecialSquare ? '#ffffff' : '#000000'}
                  emissiveIntensity={isSpecialSquare ? 0.2 : 0}
                />
              </mesh>
              
              {/* Numéro de la case avec effet de relief */}
              <Text
                position={[x, h + 0.06, z]}
                rotation={[-Math.PI/2, 0, 0]}
                fontSize={0.18}
                color={isSpecialSquare ? '#ffffff' : '#cccccc'}
                anchorX="center"
                anchorY="middle"
              >
                {num}
              </Text>
              
              {/* Effets spéciaux pour cases spéciales */}
              {isSpecialSquare && (
                <>
                  {/* Aura lumineuse pulsante */}
                  <mesh position={[x, h/2, z]}>
                    <boxGeometry args={[1.1, h + 0.1, 1.1]} />
                    <meshStandardMaterial 
                      color={color}
                      transparent
                      opacity={0.15}
                      emissive={color}
                      emissiveIntensity={0.3}
                    />
                  </mesh>
                  
                  {/* Particules flottantes pour les cases OIE */}
                  {specialSquares.oie.has(num) && (
                    <>
                      <mesh position={[x + 0.2, h + 0.3, z + 0.2]}>
                        <sphereGeometry args={[0.02, 8, 8]} />
                        <meshStandardMaterial 
                          color="#FFD700"
                          emissive="#FFD700"
                          emissiveIntensity={0.5}
                          transparent
                          opacity={0.8}
                        />
                      </mesh>
                      <mesh position={[x - 0.2, h + 0.4, z - 0.1]}>
                        <sphereGeometry args={[0.015, 8, 8]} />
                        <meshStandardMaterial 
                          color="#FFD700"
                          emissive="#FFD700"
                          emissiveIntensity={0.7}
                          transparent
                          opacity={0.6}
                        />
                      </mesh>
                    </>
                  )}
                  
                  {/* Effet de cristal pour la PRISON */}
                  {specialSquares.prison.has(num) && (
                    <mesh position={[x, h + 0.2, z]}>
                      <boxGeometry args={[0.3, 0.4, 0.3]} />
                      <meshStandardMaterial 
                        color="#95A5A6"
                        transparent
                        opacity={0.3}
                        roughness={0.1}
                        metalness={0.9}
                        emissive="#95A5A6"
                        emissiveIntensity={0.2}
                      />
                    </mesh>
                  )}
                  
                  {/* Flammes pour la MORT */}
                  {specialSquares.mort.has(num) && (
                    <>
                      <mesh position={[x, h + 0.25, z]}>
                        <coneGeometry args={[0.15, 0.3, 8]} />
                        <meshStandardMaterial 
                          color="#ff4444"
                          emissive="#ff4444"
                          emissiveIntensity={0.6}
                          transparent
                          opacity={0.8}
                        />
                      </mesh>
                      <mesh position={[x + 0.1, h + 0.2, z + 0.1]}>
                        <coneGeometry args={[0.08, 0.2, 6]} />
                        <meshStandardMaterial 
                          color="#ff6666"
                          emissive="#ff6666"
                          emissiveIntensity={0.5}
                          transparent
                          opacity={0.6}
                        />
                      </mesh>
                    </>
                  )}
                  
                  {/* Eau pour le PUITS */}
                  {specialSquares.puits.has(num) && (
                    <mesh position={[x, h + 0.05, z]}>
                      <cylinderGeometry args={[0.25, 0.25, 0.05, 16]} />
                      <meshStandardMaterial 
                        color="#4ECDC4"
                        transparent
                        opacity={0.7}
                        roughness={0.1}
                        metalness={0.1}
                        emissive="#4ECDC4"
                        emissiveIntensity={0.2}
                      />
                    </mesh>
                  )}
                </>
              )}
              
              {/* Coins décoratifs pour toutes les cases */}
              {[
                [x + 0.4, h + 0.02, z + 0.4] as [number, number, number],
                [x - 0.4, h + 0.02, z + 0.4] as [number, number, number],
                [x + 0.4, h + 0.02, z - 0.4] as [number, number, number],
                [x - 0.4, h + 0.02, z - 0.4] as [number, number, number]
              ].map((cornerPos, idx) => (
                <mesh key={idx} position={cornerPos}>
                  <boxGeometry args={[0.05, 0.02, 0.05]} />
                  <meshStandardMaterial 
                    color={isSpecialSquare ? color : '#666666'}
                    roughness={0.3}
                    metalness={0.7}
                    emissive={isSpecialSquare ? color : '#000000'}
                    emissiveIntensity={isSpecialSquare ? 0.1 : 0}
                  />
                </mesh>
              ))}
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
      <FeedbackDisplay feedback={feedback} position={position} is2D={false} />
    </div>
  );
}