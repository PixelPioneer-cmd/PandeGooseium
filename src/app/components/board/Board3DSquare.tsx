import React from 'react';
import { Text } from '@react-three/drei';
import { getSquareColor, isSpecial, specialSquares } from './SpecialSquares';

interface Board3DSquareProps {
  num: number;
  pos: { col: number; row: number };
  spacing: number;
  getHeight: (num: number) => number;
}

export const Board3DSquare: React.FC<Board3DSquareProps> = ({
  num,
  pos,
  spacing,
  getHeight
}) => {
  const h = getHeight(num);
  const x = pos.col * spacing;
  const z = pos.row * spacing;
  const color = getSquareColor(num);
  const isSpecialSquare = isSpecial(num);

  return (
    <group>
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
};
