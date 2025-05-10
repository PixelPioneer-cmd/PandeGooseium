import React from 'react';
import { Player } from '../../hooks/useWebSocket';

interface PlayerListProps {
  localName: string;
  isMyTurn: boolean;
  connectedPlayers: Player[];
  currentTurnPlayerId: string | null;
  currentOpponent: Player | null;
  setCurrentOpponent: (player: Player) => void;
}

/**
 * Composant pour afficher la liste des joueurs connectés
 */
export default function PlayerList({
  localName,
  isMyTurn,
  connectedPlayers,
  currentTurnPlayerId,
  currentOpponent,
  setCurrentOpponent
}: PlayerListProps) {
  // Logs de débogage
  console.log('PlayerList - localName:', localName);
  console.log('PlayerList - connectedPlayers:', connectedPlayers);
  console.log('PlayerList - joueur local trouvé:', connectedPlayers.find(p => p.name === localName));
  
  return (
    <div className="lg:w-1/4 p-3 bg-gray-800/80 rounded-lg h-fit lg:h-auto lg:max-h-screen overflow-y-auto shadow-lg border border-gray-700">
      <h2 className="text-lg font-bold mb-2 text-center lg:text-left">Joueurs connectés:</h2>
      
      <div className="flex flex-wrap lg:flex-col gap-2">
        {/* Joueur local - utilise la couleur attribuée par le serveur */}
        {connectedPlayers.find(p => p.name === localName) ? (
          <div 
            className={`p-2 m-1 rounded-md w-full border-2`}
            style={{
              backgroundColor: isMyTurn 
                ? `${connectedPlayers.find(p => p.name === localName)?.color || "#FFD700"}22` 
                : 'rgba(55, 65, 81, 0.8)', // bg-gray-700/80
              borderColor: connectedPlayers.find(p => p.name === localName)?.color || "#FFD700"
            }}
          >
            <span 
              className="font-bold"
              style={{ 
                color: connectedPlayers.find(p => p.name === localName)?.color || "#FFD700",
                textShadow: `0 0 10px ${connectedPlayers.find(p => p.name === localName)?.color || "#FFD700"}`
              }}
            >
              {localName}
            </span> <span className="text-white">(Vous) {isMyTurn ? '🎲' : ''}</span>
          </div>
        ) : localName ? (
          // Joueur local en attente de synchronisation
          <div 
            className="p-2 m-1 rounded-md w-full border-2"
            style={{
              backgroundColor: 'rgba(55, 65, 81, 0.8)', // bg-gray-700/80
              borderColor: "#FFD700"
            }}
          >
            <span 
              className="font-bold"
              style={{ 
                color: "#FFD700",
                textShadow: "0 0 10px #FFD700"
              }}
            >
              {localName}
            </span> <span className="text-white">(Vous) {isMyTurn ? '🎲' : ''}</span>
          </div>
        ) : null}
        
        {/* Autres joueurs connectés - utilisant leurs couleurs spécifiques */}
        {connectedPlayers.filter(p => p.name !== localName).map(player => (
          <div 
            key={player.id}
            className={`p-2 m-1 border-2 rounded-md cursor-pointer w-full`}
            style={{
              backgroundColor: currentTurnPlayerId === player.id 
                ? `${player.color || "#3B82F6"}22` 
                : currentOpponent?.id === player.id 
                  ? `${player.color || "#3B82F6"}15`
                  : 'rgba(55, 65, 81, 0.8)', // bg-gray-700/80
              borderColor: player.color || "#3B82F6"
            }}
            onClick={() => setCurrentOpponent(player)}
          >
            <span 
              className="font-bold"
              style={{ 
                color: player.color || "#3B82F6",
                textShadow: `0 0 10px ${player.color || "#3B82F6"}`
              }}
            >
              {player.name}
            </span>
            <span className="text-white">
              {currentTurnPlayerId === player.id && " 🎲"}
              {currentOpponent?.id === player.id && " 👁️"}
            </span>
          </div>
        ))}
      </div>
      
      {/* Légende */}
      <div className="mt-2 text-xs text-gray-400">
        <span className="mr-2">🎲 = Tour de jouer</span>
        <span>👁️ = Suivi</span>
      </div>
    </div>
  );
}
