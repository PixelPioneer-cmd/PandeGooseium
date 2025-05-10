import React, { useState, useRef, useEffect } from 'react';
import { Player } from '../../hooks/useWebSocket';

interface ChatMessage {
  playerId: string;
  name: string;
  message: string;
  color?: string;
  timestamp?: number; // Ajout du timestamp pour mieux identifier les messages
}

interface ChatProps {
  chatMessages: ChatMessage[];
  sendChat: (message: string) => void;
  connectedPlayers: Player[]; 
  localName: string;
}

export default function Chat({ chatMessages, sendChat, connectedPlayers, localName }: ChatProps) {
  const [message, setMessage] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      sendChat(message.trim());
      setMessage('');
    }
  };

  // Trouver la couleur d'un joueur par son nom
  const getPlayerColor = (name: string): string => {
    const player = connectedPlayers.find(p => p.name === name);
    return player?.color || "#3B82F6"; // Fallback à bleu si joueur non trouvé
  };

  // Effet pour scroll vers le bas quand de nouveaux messages arrivent
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  return (
    <div className="bg-gray-800/80 p-3 rounded-lg flex flex-col h-64 overflow-hidden shadow-lg border border-gray-700">
      <h2 className="text-lg font-bold mb-2">Chat</h2>
      
      {/* Zone d'affichage des messages */}
      <div className="flex-1 overflow-y-auto mb-2 pr-1">
        {chatMessages.length === 0 ? (
          <p className="text-gray-400 italic text-sm">Pas de messages...</p>
        ) : (
          chatMessages.map((chat, i) => {
            const isLocal = chat.name === localName;
            // Priorité: 1) couleur du message, 2) couleur du joueur dans la liste, 3) bleu par défaut
            const playerColor = chat.color || getPlayerColor(chat.name);
            
            // Clé unique basée sur le timestamp et l'index si disponible
            const key = chat.timestamp ? `${chat.playerId}-${chat.timestamp}` : i;
            
            return (
              <div key={key} className="mb-1 break-words">
                <span 
                  className="font-bold"
                  style={{ 
                    color: playerColor,
                    textShadow: `0 0 5px ${playerColor}` 
                  }}
                >
                  {chat.name}{isLocal ? " (Vous)" : ""}:
                </span>{' '}
                <span className="text-white">{chat.message}</span>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>
      
      {/* Formulaire d'envoi */}
      <form onSubmit={handleSubmit} className="flex mt-auto">
        <input
          type="text"
          className="flex-1 p-1 rounded-l bg-gray-700 text-white focus:outline-none"
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="Message..."
        />
        <button 
          type="submit" 
          className="px-3 bg-blue-600 rounded-r hover:bg-blue-500 transition-colors"
        >
          Envoyer
        </button>
      </form>
    </div>
  );
}
