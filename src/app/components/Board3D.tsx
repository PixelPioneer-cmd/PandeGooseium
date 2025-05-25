import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Stars, Environment } from '@react-three/drei';
import { Player } from '../../hooks/useWebSocket';
import styles from './Board.module.css';
import * as THREE from 'three';
import { MagicalParticles, MysticFog, DynamicLights } from './Effects3D';

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

  if (!isVisible) return null;

  return (
    <div className={`${styles.feedbackOverlay} ${styles[feedbackType]}`}>
      <div className={styles.feedbackContent}>
        {displayMessage}
      </div>
    </div>
  );
}

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

// Composant pour les cases animées
function AnimatedSquare({ position, height, color, num, isSpecialSquare }: {
  position: [number, number, number];
  height: number;
  color: string;
  num: number;
  isSpecialSquare: boolean;
}) {
  const mesh = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (mesh.current && isSpecialSquare) {
      mesh.current.position.y = height/2 + Math.sin(state.clock.elapsedTime * 2 + num) * 0.05;
    }
  });

  return (
    <group>
      <mesh ref={mesh} position={position} castShadow receiveShadow>
        <boxGeometry args={[0.9, height, 0.9]} />
        <meshStandardMaterial 
          color={color} 
          roughness={0.3}
          metalness={0.1}
        />
      </mesh>
      
      {/* Numéro de la case */}
      <Text
        position={[position[0], position[1] + height/2 + 0.05, position[2]]}
        rotation={[-Math.PI/2, 0, 0]}
        fontSize={0.2}
        color='#fff'
        anchorX="center"
        anchorY="middle"
      >
        {num}
      </Text>
      
      {/* Bordure lumineuse pour les cases spéciales */}
      {isSpecialSquare && (
        <mesh position={position}>
          <boxGeometry args={[1, height + 0.02, 1]} />
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
}

// Composant pour les pions animés avec déplacement de case en case
function AnimatedPlayer({ 
  currentPosition, 
  targetPosition, 
  color, 
  offset, 
  spacing, 
  getHeight, 
  spiralPositions 
}: {
  currentPosition: number;
  targetPosition: number;
  color: string;
  offset: number;
  spacing: number;
  getHeight: (num: number) => number;
  spiralPositions: Array<{row: number; col: number}>;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const [animatedPosition, setAnimatedPosition] = useState(currentPosition);
  const [isAnimating, setIsAnimating] = useState(false);
  
  useEffect(() => {
    if (currentPosition !== targetPosition && !isAnimating) {
      setIsAnimating(true);
      animateToPosition(currentPosition, targetPosition);
    }
  }, [currentPosition, targetPosition, isAnimating]);
  
  const animateToPosition = async (from: number, to: number) => {
    if (from === to) {
      setIsAnimating(false);
      return;
    }
    
    // Créer un chemin de cases à parcourir
    const path = [];
    const step = from < to ? 1 : -1;
    for (let pos = from; pos !== to; pos += step) {
      path.push(pos + step);
    }
    
    // Animer case par case avec une pause plus longue pour voir le saut
    for (const position of path) {
      await new Promise<void>((resolve) => {
        setAnimatedPosition(position);
        // Temps d'animation plus long pour mieux voir le saut
        setTimeout(resolve, 600); // 600ms par case pour bien voir l'animation
      });
    }
    
    setIsAnimating(false);
  };
  
  // Obtenir la position 3D de la case actuelle
  const getPosition3D = (position: number) => {
    if (position < 1 || position > spiralPositions.length) {
      return { x: 0, z: 0, h: 0.2 };
    }
    const pos = spiralPositions[position - 1];
    const x = pos.col * spacing;
    const z = pos.row * spacing;
    const h = getHeight(position);
    return { x, z, h };
  };
  
  const { x, z, h } = getPosition3D(animatedPosition);
  
  // Animation de saut pendant le déplacement
  useFrame((state) => {
    if (groupRef.current && isAnimating) {
      const time = state.clock.elapsedTime;
      
      // Création d'une courbe de saut plus réaliste (parabole)
      const jumpCycle = (time * 3) % (Math.PI * 2); // Cycle de saut plus lent
      const jumpHeight = Math.sin(jumpCycle) * 1.2; // Saut plus haut (1.2 unités)
      
      // Position Y avec saut parabolique
      groupRef.current.position.y = h + 0.6 + Math.max(0, jumpHeight);
      
      // Rotation pendant le saut pour un effet dynamique
      groupRef.current.rotation.y = time * 3; // Rotation plus lente
      groupRef.current.rotation.x = Math.sin(time * 6) * 0.1; // Léger balancement
      
      // Échelle légèrement variable pour un effet de "rebond"
      const scale = 1 + Math.sin(jumpCycle) * 0.1;
      groupRef.current.scale.set(scale, scale, scale);
      
    } else if (groupRef.current) {
      // Position normale quand pas d'animation
      groupRef.current.position.y = h + 0.6;
      groupRef.current.rotation.set(0, 0, 0);
      groupRef.current.scale.set(1, 1, 1);
    }
  });
  
  return (
    <group ref={groupRef} position={[x + offset, h + 0.6, z]}>
      {/* Aura lumineuse sous le pion */}
      <mesh position={[0, -0.55, 0]} rotation={[-Math.PI/2, 0, 0]}>
        <circleGeometry args={[isAnimating ? 0.5 : 0.3, 32]} />
        <meshStandardMaterial 
          color={color}
          transparent
          opacity={isAnimating ? 0.9 : 0.4}
          emissive={color}
          emissiveIntensity={isAnimating ? 1.0 : 0.3}
        />
      </mesh>
      
      {/* Onde de choc pendant l'animation */}
      {isAnimating && (
        <mesh position={[0, -0.54, 0]} rotation={[-Math.PI/2, 0, 0]}>
          <ringGeometry args={[0.5, 0.8, 32]} />
          <meshStandardMaterial 
            color={color}
            transparent
            opacity={0.5}
            emissive={color}
            emissiveIntensity={0.8}
          />
        </mesh>
      )}
      
      {/* Pion principal */}
      <mesh position={[0, 0, 0]} castShadow>
        <cylinderGeometry args={[0.15, 0.18, 1, 16]} />
        <meshStandardMaterial 
          color={color}
          roughness={isAnimating ? 0.05 : 0.1}
          metalness={isAnimating ? 1 : 0.9}
          emissive={color}
          emissiveIntensity={isAnimating ? 0.5 : 0.1}
        />
      </mesh>
      
      {/* Couronne du pion */}
      <mesh position={[0, 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.15, 0.15, 8]} />
        <meshStandardMaterial 
          color={color}
          roughness={isAnimating ? 0.02 : 0.05}
          metalness={1}
          emissive={color}
          emissiveIntensity={isAnimating ? 0.6 : 0.2}
        />
      </mesh>
      
      {/* Point lumineux au sommet */}
      <pointLight 
        position={[0, 0.9, 0]} 
        intensity={isAnimating ? 1.2 : 0.3} 
        color={color}
        distance={isAnimating ? 3 : 2}
      />
      
      {/* Particules pendant l'animation */}
      {isAnimating && (
        <>
          {/* Aura de saut brillante */}
          <mesh position={[0, 0.5, 0]}>
            <sphereGeometry args={[0.4, 16, 16]} />
            <meshStandardMaterial 
              color={color}
              transparent
              opacity={0.3}
              emissive={color}
              emissiveIntensity={1.2}
            />
          </mesh>
          
          {/* Traînée de particules */}
          <mesh position={[0, -0.2, 0]}>
            <coneGeometry args={[0.2, 0.8, 8]} />
            <meshStandardMaterial 
              color={color}
              transparent
              opacity={0.6}
              emissive={color}
              emissiveIntensity={0.8}
            />
          </mesh>
          
          {/* Éclair de lumière au sommet */}
          <pointLight 
            position={[0, 1.5, 0]} 
            intensity={2} 
            color={color}
            distance={3}
          />
        </>
      )}
    </group>
  );
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

export default function Board3D({ localPlayer, remotePlayers, onRoll, lastRoll, disabled, isMulti, toggleMode, is3D, toggleView, isMyTurn, currentTurnPlayerId, connectedPlayers, feedback, position }: BoardProps) {
  const spacing = 1.2;
  const getHeight = (num: number) => isSpecial(num) ? 0.4 : 0.2;
  
  // État pour tracker les positions précédentes
  const [prevLocalPosition, setPrevLocalPosition] = useState(localPlayer?.position || 1);
  const [prevRemotePositions, setPrevRemotePositions] = useState<{[playerId: string]: number}>({});
  
  // Mettre à jour les positions précédentes quand les positions changent
  useEffect(() => {
    if (localPlayer?.position && localPlayer.position !== prevLocalPosition) {
      setPrevLocalPosition(localPlayer.position);
    }
  }, [localPlayer?.position, prevLocalPosition]);
  
  useEffect(() => {
    const newPositions = { ...prevRemotePositions };
    let hasChanged = false;
    
    remotePlayers.forEach(player => {
      if (player?.position && player.position !== prevRemotePositions[player.id]) {
        newPositions[player.id] = player.position;
        hasChanged = true;
      }
    });
    
    if (hasChanged) {
      setPrevRemotePositions(newPositions);
    }
  }, [remotePlayers, prevRemotePositions]);
  
  // Fonction pour obtenir la couleur des cases spéciales
  const getSquareColor = (num: number) => {
    if (specialSquares.oie.has(num)) return '#FFD700';
    if (specialSquares.pont.has(num)) return '#8B4513';
    if (specialSquares.hotel.has(num)) return '#FF6B6B';
    if (specialSquares.puits.has(num)) return '#4ECDC4';
    if (specialSquares.labyrinthe.has(num)) return '#9B59B6';
    if (specialSquares.prison.has(num)) return '#95A5A6';
    if (specialSquares.mort.has(num)) return '#2C3E50';
    return '#8b4513'; // Couleur par défaut
  };

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
        camera={{ position: [4.5, 8, 12], fov: 50 }} 
        style={{ width: '100%', height: '100%' }}
        shadows
        gl={{ antialias: true, alpha: false }}
      >
        {/* Éclairage avancé */}
        <ambientLight intensity={0.3} />
        <directionalLight 
          position={[10, 15, 10]} 
          intensity={1.2} 
          castShadow
          shadow-mapSize-width={4096}
          shadow-mapSize-height={4096}
          shadow-camera-far={50}
          shadow-camera-left={-20}
          shadow-camera-right={20}
          shadow-camera-top={20}
          shadow-camera-bottom={-20}
        />
        <pointLight position={[-5, 5, -5]} intensity={0.4} color="#FFD700" />
        <pointLight position={[15, 5, 15]} intensity={0.3} color="#3B82F6" />
        
        {/* Environnement et étoiles */}
        <Stars radius={300} depth={60} count={1000} factor={7} saturation={0} fade speed={1} />
        <Environment preset="night" />
        
        {/* Effets 3D avancés */}
        <MagicalParticles />
        <MysticFog />
        <DynamicLights />
        
        <OrbitControls 
          enablePan 
          enableRotate 
          enableZoom 
          maxDistance={25}
          minDistance={8}
          maxPolarAngle={Math.PI / 2.2}
          autoRotate
          autoRotateSpeed={0.5}
        />
        
        {/* Sol du plateau avec reflets */}
        <mesh position={[3.5, -0.1, 3.5]} receiveShadow>
          <boxGeometry args={[12, 0.3, 12]} />
          <meshStandardMaterial 
            color="#1a1a2e" 
            roughness={0.1}
            metalness={0.8}
          />
        </mesh>
        
        {/* Bordure décorative du plateau */}
        <mesh position={[3.5, 0.1, 3.5]}>
          <ringGeometry args={[8, 8.5, 32]} />
          <meshStandardMaterial 
            color="#FFD700" 
            transparent
            opacity={0.6}
            emissive="#FFD700"
            emissiveIntensity={0.2}
          />
        </mesh>
        
        {/* Cases du plateau avec animations */}
        {spiralPositions.map((pos, i) => {
          const num = i + 1;
          const h = getHeight(num);
          const x = pos.col * spacing;
          const z = pos.row * spacing;
          const color = getSquareColor(num);
          const isSpecialSquare = isSpecial(num);
          
          return (
            <AnimatedSquare 
              key={num}
              position={[x, h/2, z]}
              height={h}
              color={color}
              num={num}
              isSpecialSquare={isSpecialSquare}
            />
          );
        })}
        
        {/* Pions des joueurs avec offsets dynamiques */}
        {spiralPositions.map((pos, i) => {
          const num = i + 1;
          // Collecte des joueurs sur cette case
          const playersAtNum: Array<{ key: string; color: string; currentPos: number; targetPos: number; offset?: number }> = [];
          if (localPlayer?.position === num) {
            playersAtNum.push({
              key: `local-${num}`,
              color: localPlayer.color || '#FFD700',
              currentPos: prevLocalPosition,
              targetPos: localPlayer.position,
            });
          }
          remotePlayers.forEach((player, idx) => {
            if (player.position === num) {
              playersAtNum.push({
                key: `remote-${player.id}-${num}`,
                color: player.color || `hsl(${(idx + 1) * 60}, 70%, 50%)`,
                currentPos: prevRemotePositions[player.id] || 1,
                targetPos: player.position,
              });
            }
          });
          if (playersAtNum.length === 0) return null;
          // Calcul des offsets symétriques
          const offsetSpacing = 0.25;
          const count = playersAtNum.length;
          playersAtNum.forEach((p, idx) => {
            p.offset = (idx - (count - 1) / 2) * offsetSpacing;
          });
          return playersAtNum.map(p => (
            <AnimatedPlayer
              key={p.key}
              currentPosition={p.currentPos}
              targetPosition={p.targetPos}
              color={p.color}
              offset={p.offset!}
              spacing={spacing}
              getHeight={getHeight}
              spiralPositions={spiralPositions}
            />
          ));
        })}
      </Canvas>
      
      {/* Feedback Display */}
      <FeedbackDisplay feedback={feedback} position={position} />
    </div>
  );
}
