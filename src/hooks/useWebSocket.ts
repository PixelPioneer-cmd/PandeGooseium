import { useState, useEffect, useRef, useCallback } from 'react';

export interface Player {
  id: string;
  name: string;
  position: number;
  color: string;
}

interface WebSocketMessage {
  type: string;
  [key: string]: unknown;
}

interface UseWebSocketReturn {
  connectedPlayers: Player[];
  localPlayer: Player | null;
  isMyTurn: boolean;
  currentTurnPlayerId: string | null;
  sendMessage: (message: WebSocketMessage) => void;
  feedback: string;
  setFeedback: (message: string) => void;
}

/**
 * Hook personnalisé pour gérer la communication WebSocket dans le jeu de l'oie
 */
export function useWebSocket(
  isMulti: boolean,
  localName: string,
  initialPosition: number
): UseWebSocketReturn {
  const [connectedPlayers, setConnectedPlayers] = useState<Player[]>([]);
  const [isMyTurn, setIsMyTurn] = useState<boolean>(false);
  const [currentTurnPlayerId, setCurrentTurnPlayerId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string>('');
  const [localPlayer, setLocalPlayer] = useState<Player | null>(null);
  
  const wsRef = useRef<WebSocket | null>(null);
  const myIdRef = useRef<string | null>(null);

  // Fonction pour envoyer des messages au serveur WebSocket
  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  // Gestionnaire de messages du serveur WebSocket
  const handleWebSocketMessage = useCallback((event: MessageEvent) => {
    const msg = JSON.parse(event.data);
    
    if (msg.type === 'game_state') {
      const players = msg.players as Player[];
      
      // Log pour le débogage
      console.log('Message game_state reçu:', players);
      
      // Identifier notre joueur pour obtenir notre ID et infos
      const myPlayer = players.find(p => p.name === localName);
      if (myPlayer) {
        console.log('Mon joueur trouvé:', myPlayer);
        myIdRef.current = myPlayer.id;
        setLocalPlayer(myPlayer);
      } else {
        console.log('Joueur local non trouvé dans la liste:', localName);
      }
      
      // Mettre à jour la liste complète des joueurs
      setConnectedPlayers(players);
      
      // Mettre à jour l'ID du joueur dont c'est le tour
      setCurrentTurnPlayerId(msg.currentTurnPlayerId);
      
      // Déterminer si c'est notre tour
      setIsMyTurn(msg.currentTurnPlayerId === myIdRef.current);
    } else if (msg.type === 'error') {
      setFeedback(msg.message);
      // Demander une mise à jour de l'état du jeu
      sendMessage({ type: 'get_game_state' });
    }
  }, [localName, sendMessage]);

  useEffect(() => {
    if (!isMulti) return;

    // Créer une nouvelle connexion WebSocket
    const ws = new WebSocket('ws://localhost:4000');
    
    ws.onopen = () => {
      // Joindre la partie avec notre nom et position
      ws.send(JSON.stringify({ 
        type: 'join', 
        name: localName, 
        position: initialPosition 
      }));
    };
    
    ws.onmessage = handleWebSocketMessage;
    
    ws.onerror = () => console.error('WebSocket error');
    
    ws.onclose = () => {
      console.log('WebSocket fermée, tentative de reconnexion...');
      // Tenter une reconnexion après un court délai
      setTimeout(() => {
        if (isMulti && localName) {
          const newWs = new WebSocket('ws://localhost:4000');
          newWs.onopen = () => {
            newWs.send(JSON.stringify({ 
              type: 'join', 
              name: localName,
              position: initialPosition 
            }));
          };
          wsRef.current = newWs;
        }
      }, 1000);
    };
    
    wsRef.current = ws;
    
    // Nettoyage à la désinscription
    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [isMulti, localName, initialPosition, handleWebSocketMessage]);

  // Effet pour initialiser le joueur local en mode solo
  useEffect(() => {
    if (!isMulti) {
      setLocalPlayer({ id: 'local', name: localName || 'Vous', position: initialPosition, color: '#FFD700' });
      setIsMyTurn(true);
    }
  }, [isMulti, initialPosition, localName]);

  // Suppression de l'effet temporaire pour multijoueur (le serveur fournira localPlayer via game_state)

  return {
    connectedPlayers,
    localPlayer,
    isMyTurn,
    currentTurnPlayerId,
    sendMessage,
    feedback,
    setFeedback
  };
}
