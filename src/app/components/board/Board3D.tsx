import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { BoardProps, CSSModuleClasses, AnimatedPlayer2DProps } from './BoardTypes';
import { ControlsBar } from './ControlsBar';
import { Board3DSquare } from './Board3DSquare';
import { usePlayerPositions } from './usePlayerPositions';
import { getPlayersAtPosition } from './PlayerUtils';

interface Board3DProps extends BoardProps {
  spiralPositions: Array<{ row: number; col: number }>;
  spacing: number;
  getHeight: (num: number) => number;
  styles: CSSModuleClasses;
  FeedbackDisplay: React.ComponentType<{ feedback?: string; position?: number; is2D?: boolean }>;
  AnimatedPlayer2D: React.ComponentType<AnimatedPlayer2DProps>;
}

export const Board3D: React.FC<Board3DProps> = ({
  localPlayer,
  remotePlayers,
  onRoll,
  lastRoll,
  disabled,
  isMulti,
  toggleMode,
  is3D,
  toggleView,
  isMyTurn,
  currentTurnPlayerId,
  connectedPlayers,
  feedback,
  position,
  spiralPositions,
  spacing,
  getHeight,
  styles,
  FeedbackDisplay,
  AnimatedPlayer2D
}) => {
  const { prevLocalPos, prevRemotePos } = usePlayerPositions(localPlayer, remotePlayers);

  return (
    <div className={styles.board3DContainer}>
      <ControlsBar
        gameTitle="L'Oie des Enfers"
        isMulti={isMulti}
        isMyTurn={isMyTurn}
        currentTurnPlayerId={currentTurnPlayerId}
        connectedPlayers={connectedPlayers}
        toggleMode={toggleMode}
        is3D={is3D}
        toggleView={toggleView}
        onRoll={onRoll}
        lastRoll={lastRoll}
        disabled={disabled}
        styles={styles}
      />
      
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
        
        {/* Sol du plateau */}
        <mesh position={[4.2, -0.1, 4.2]} receiveShadow>
          <boxGeometry args={[10, 0.2, 10]} />
          <meshStandardMaterial color="#2C3E50" />
        </mesh>
        
        {/* Cases du plateau */}
        {spiralPositions.map((pos, i) => {
          const num = i + 1;
          return (
            <Board3DSquare
              key={num}
              num={num}
              pos={pos}
              spacing={spacing}
              getHeight={getHeight}
            />
          );
        })}
        
        {/* Pions des joueurs animés */}
        {spiralPositions.map((pos, i) => {
          const num = i + 1;
          const playersAtNum = getPlayersAtPosition(num, localPlayer, remotePlayers, connectedPlayers);
          
          if (!playersAtNum.length) return null;
          
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
};
