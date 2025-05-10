import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import styles from './Board.module.css';
import { Player } from '../../hooks/useWebSocket';

type BoardProps = {
  localPlayer: Player | null;
  remotePlayer: Player | null;
};

interface SpecialSquareTypes {
  [key: string]: number[];
}

export default function Board({ localPlayer, remotePlayer }: BoardProps) {
  const position = localPlayer?.position || 1;
  const remotePosition = remotePlayer?.position;
  const squares = Array.from({ length: 40 }, (_, i) => i + 1);
  
  // Cases spéciales du jeu de l'oie
  const specialSquares: SpecialSquareTypes = {
    oie: [5, 9, 14, 18, 23, 27, 32, 36], // Cases oies
    pont: [6],                           // Case pont
    hotel: [19],                         // Case hôtel
    puits: [31],                         // Case puits
    labyrinthe: [42],                    // Case labyrinthe
    prison: [52],                        // Case prison
    mort: [58]                           // Case mort
  };
  
  // État pour suivre la case qui vient d'être activée
  const [lastActiveSquare, setLastActiveSquare] = useState<number | null>(null);
  
  // Effet pour détecter les changements de position et animer la case
  useEffect(() => {
    if (position) {
      setLastActiveSquare(position);
      const timer = setTimeout(() => setLastActiveSquare(null), 1000);
      return () => clearTimeout(timer);
    }
  }, [position]);
  
  // Fonction pour déterminer le type de case spéciale
  const getSquareType = (num: number): string | null => {
    if (specialSquares.oie.includes(num)) return 'oie';
    if (specialSquares.pont.includes(num)) return 'pont';
    if (specialSquares.hotel.includes(num)) return 'hotel';
    if (specialSquares.puits.includes(num)) return 'puits';
    if (specialSquares.labyrinthe.includes(num)) return 'labyrinthe';
    if (specialSquares.prison.includes(num)) return 'prison';
    if (specialSquares.mort.includes(num)) return 'mort';
    return null;
  };
  
  // Fonction pour obtenir la classe CSS en fonction du type de case
  const getSquareClass = (num: number): string => {
    const type = getSquareType(num);
    switch (type) {
      case 'oie':
        return 'bg-green-700/80 border-green-300 border-2';
      case 'pont':
        return 'bg-blue-700/60 border-blue-300';
      case 'hotel':
        return 'bg-purple-700/60 border-purple-300';
      case 'puits':
        return 'bg-indigo-700/60 border-indigo-300';
      case 'labyrinthe':
        return 'bg-orange-700/60 border-orange-300';
      case 'prison':
        return 'bg-gray-700/60 border-gray-300';
      case 'mort':
        return 'bg-black border-white';
      default:
        return num <= 9 ? 'bg-red-900/60' : num <= 29 ? 'bg-red-700/60' : 'bg-red-500/60';
    }
  };
  
  return (
    <div className="grid grid-cols-4 sm:grid-cols-8 gap-1 sm:gap-2 p-2 sm:p-4 bg-black/20 backdrop-blur-sm rounded-lg">
      {squares.map((num) => {
        const squareType = getSquareType(num);
        
        return (
          <div
            key={num}
            className={`
              relative flex items-center justify-center w-10 h-10 sm:w-16 sm:h-16 md:w-20 md:h-20 border-2 rounded 
              ${getSquareClass(num)}
              ${position === num ? `ring-4` : ''}
              ${remotePosition === num ? `ring-4` : ''}
              ${lastActiveSquare === num ? styles.moveAnimation : ''}
              ${position === num || remotePosition === num ? styles.hotSquare : ''}
              overflow-hidden transition-all duration-300
            `}
            style={{
              borderColor: position === num ? (localPlayer?.color || "#FFD700") : 
                           remotePosition === num ? (remotePlayer?.color || "#3B82F6") : undefined,
              boxShadow: position === num ? `0 0 10px ${localPlayer?.color || "#FFD700"}` :
                         remotePosition === num ? `0 0 10px ${remotePlayer?.color || "#3B82F6"}` : undefined,
            }}
          >
            {/* Effet de flamme sur toutes les cases */}
            <div className={`absolute inset-0 z-0 opacity-40 ${styles.flame}`}>
              <Image 
                src="/assets/flame.svg" 
                alt="flame" 
                width={50} 
                height={50} 
                className="w-full h-full object-cover"
              />
            </div>
            
            {/* Icônes pour les cases spéciales */}
            {squareType && (
              <div className="absolute inset-0 flex items-center justify-center z-5 opacity-70">
                <div className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10">
                  {squareType === 'oie' && (
                    <Image 
                      src="/assets/goose.svg" 
                      alt="Case oie" 
                      width={30} 
                      height={30}
                      className={`w-full h-full object-contain ${styles.gooseSquare}`}
                      style={{ filter: "drop-shadow(0 0 8px rgba(103, 232, 249, 0.8))" }}
                    />
                  )}
                  {squareType === 'pont' && (
                    <span className="text-blue-200 text-xs">🌉</span>
                  )}
                  {squareType === 'hotel' && (
                    <span className="text-purple-200 text-xs">🏨</span>
                  )}
                  {squareType === 'puits' && (
                    <span className="text-indigo-200 text-xs">⛲</span>
                  )}
                  {squareType === 'labyrinthe' && (
                    <span className="text-orange-200 text-xs">🧩</span>
                  )}
                  {squareType === 'prison' && (
                    <span className="text-gray-200 text-xs">🔒</span>
                  )}
                  {squareType === 'mort' && (
                    <span className="text-white text-xs">💀</span>
                  )}
                </div>
              </div>
            )}
            
            {/* Numéro de la case */}
            <span className="text-xs sm:text-sm md:text-base font-bold text-white z-10">{num}</span>
            
            {/* Pion local avec couleur dynamique */}
            {position === num && (
              <div className="absolute inset-0 flex items-center justify-center z-30 transform scale-75">
                <div className={`w-7 h-7 sm:w-9 sm:h-9 md:w-11 md:h-11 overflow-visible transition-all duration-500 ${styles.floatingGoose}`}>
                  <div className="relative w-full h-full">
                    <Image 
                      src="/assets/goose.svg" 
                      alt="Votre pion" 
                      width={40} 
                      height={40}
                      className="w-full h-full object-contain"
                      style={{ 
                        filter: `brightness(1.2) drop-shadow(0 0 12px ${localPlayer?.color || "#FFD700"})`,
                        color: localPlayer?.color || "#FFD700"
                      }}
                    />
                    <div 
                      className="absolute inset-0 opacity-70 mix-blend-overlay rounded-full"
                      style={{ backgroundColor: localPlayer?.color || "#FFD700" }}
                    ></div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Pion distant avec couleur dynamique */}
            {remotePosition === num && (
              <div className="absolute inset-0 flex items-center justify-center z-20 transform scale-65">
                <div className={`w-7 h-7 sm:w-9 sm:h-9 md:w-11 md:h-11 overflow-visible transition-all duration-500 ${styles.floatingGoose}`}>
                  <div className="relative w-full h-full">
                    <Image 
                      src="/assets/goose.svg" 
                      alt="Pion adversaire" 
                      width={40} 
                      height={40}
                      className="w-full h-full object-contain"
                      style={{ 
                        filter: `brightness(1.2) drop-shadow(0 0 12px ${remotePlayer?.color || "#3B82F6"})`,
                        color: remotePlayer?.color || "#3B82F6"
                      }}
                    />
                    <div 
                      className="absolute inset-0 opacity-70 mix-blend-overlay rounded-full"
                      style={{ backgroundColor: remotePlayer?.color || "#3B82F6" }}
                    ></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
