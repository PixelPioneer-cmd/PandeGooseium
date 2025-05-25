"use client";
import React, { useState, useEffect } from 'react';
import Board from './components/Board';
import Die from './components/Die';
import PlayerList from './components/PlayerList';
import QuestionModal from './components/QuestionModal';
import { useWebSocket, Player } from '../hooks/useWebSocket';
import { useGameLogic } from '../hooks/useGameLogic';
import Chat from './components/Chat';

export default function Home() {
  // État pour le mode de jeu
  const [isMulti, setIsMulti] = useState<boolean>(false);
  const [localName, setLocalName] = useState<string>('');
  const [currentOpponent, setCurrentOpponent] = useState<Player | null>(null);
  
  // Utilisation des hooks personnalisés
  const {
    connectedPlayers,
    localPlayer,
    isMyTurn,
    currentTurnPlayerId,
    sendMessage,
    feedback,
    setFeedback,
    chatMessages, 
    sendChat
  } = useWebSocket(isMulti, localName, 1);
  
  // Log pour le débogage
  console.log('Page - localPlayer:', localPlayer);
  console.log('Page - connectedPlayers:', connectedPlayers); 
  console.log('Page - currentOpponent:', currentOpponent);
  
  const {
    position,
    setPosition,
    lastRoll,
    currentCase,
    question,
    level,
    input,
    setInput,
    modalOpen,
    rollDie,
    submitAnswer
  } = useGameLogic(isMulti, isMyTurn, localName, sendMessage, setFeedback);
  
  // Gestionnaire pour basculer entre les modes solo et multijoueur
  const toggleMode = () => {
    setIsMulti((m) => !m);
    setPosition(1);
    setLocalName('');
    setCurrentOpponent(null);
  };
  
  // Demander le nom lors du passage en mode multijoueur
  useEffect(() => {
    if (isMulti && !localName) {
      const name = prompt('Entrez votre nom') || `Joueur${Math.floor(Math.random()*1000)}`;
      console.log('🏷️ Nom saisi par l\'utilisateur:', `"${name}"`);
      console.log('🏷️ Longueur du nom:', name.length);
      console.log('🏷️ Type du nom:', typeof name);
      setLocalName(name);
      console.log('🏷️ localName défini dans state:', `"${name}"`);
    }
  }, [isMulti, localName]);
  
  return (
    <div className="min-h-screen text-white p-4">
      <div className="flex flex-col-reverse lg:flex-row gap-4">
        {/* Section principale du jeu */}
        <div className="lg:w-3/4 flex flex-col">
          <div className="flex items-center mb-4">
            <button
              onClick={toggleMode}
              className="mr-4 px-4 py-2 bg-gray-700 rounded hover:bg-gray-600 transition-colors"
            >
              Mode: {isMulti ? 'Multijoueur' : 'Solo'}
            </button>
            
            {isMulti && (
              <p className={`font-bold ${isMyTurn ? 'text-yellow-400 text-glow-yellow' : 'text-gray-400'}`}>
                {isMyTurn 
                  ? "C'est votre tour de jouer" 
                  : `En attente du tour de ${connectedPlayers.find(p => p.id === currentTurnPlayerId)?.name || '...'}`
                }
              </p>
            )}
          </div>
          
          <h1 className="text-3xl mb-4 glow-text">L&#39;Oie des Enfers</h1>
          
          <Board 
            localPlayer={isMulti ? localPlayer : { id: 'local', name: 'Vous', position, color: '#FFD700' }}
            remotePlayer={
              isMulti && currentOpponent 
                ? connectedPlayers.find(p => p.id === currentOpponent.id) || null 
                : null
            }
          />
          
          <div className="mt-4">
            <Die 
              onRoll={rollDie} 
              lastRoll={lastRoll} 
              disabled={modalOpen || position === 40 || (isMulti && !isMyTurn)} 
            />
          </div>
          
          {feedback && <p className="mt-2 text-yellow-300">{feedback}</p>}
          {position === 40 && <p className="mt-4 text-2xl text-green-400">Vous avez gagné ! 🎉</p>}
        </div>
        
        {/* Liste des joueurs et chat (sur le côté en desktop, en bas en mobile) */}
        {isMulti && (
          <div className="lg:w-1/4 flex flex-col gap-4">
            <PlayerList
              localName={localName}
              isMyTurn={isMyTurn}
              connectedPlayers={connectedPlayers}
              currentTurnPlayerId={currentTurnPlayerId}
              currentOpponent={currentOpponent}
              setCurrentOpponent={setCurrentOpponent}
            />
            <Chat 
              chatMessages={chatMessages} 
              sendChat={sendChat} 
              connectedPlayers={connectedPlayers}
              localName={localName}
            />
          </div>
        )}
      </div>

      {/* Modale de question */}
      {modalOpen && (
        <QuestionModal
          currentCase={currentCase}
          level={level}
          question={question}
          input={input}
          setInput={setInput}
          submitAnswer={submitAnswer}
        />
      )}
    </div>
  );
}
