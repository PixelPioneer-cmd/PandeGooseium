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

interface ChatMessage {
  playerId: string;
  name: string;
  message: string;
  color?: string; // Couleur du joueur (optionnelle)
  timestamp?: number; // Timestamp pour identifier les messages
}

interface UseWebSocketReturn {
  connectedPlayers: Player[];
  localPlayer: Player | null;
  isMyTurn: boolean;
  currentTurnPlayerId: string | null;
  sendMessage: (message: WebSocketMessage) => void;
  feedback: string;
  setFeedback: (message: string) => void;
  chatMessages: ChatMessage[];
  sendChat: (messageText: string) => void;
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
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  const wsRef = useRef<WebSocket | null>(null);
  const myIdRef = useRef<string | null>(null);

  // Pour filtrer les messages de chat en doublon
  const processedChatTimestamps = useRef<Set<number>>(new Set());

  // URL du serveur WebSocket, défini via .env
  const WS_SERVER = process.env.NEXT_PUBLIC_WS_SERVER || 'ws://localhost:4000';

  // Fonction pour envoyer des messages au serveur WebSocket
  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  const sendChat = useCallback((messageText: string) => {
    if (!localName || !myIdRef.current) return;
    
    console.log("Envoi d'un message chat:", messageText);
    
    // Générer un timestamp pour identifier ce message de façon unique
    const msgTimestamp = Date.now();
    
    // Ne pas inclure la couleur dans le message client
    // On laisse le serveur gérer la couleur pour garantir la cohérence
    sendMessage({ 
      type: 'chat', 
      message: messageText,
      name: localName,
      timestamp: msgTimestamp
    });
    
    // On n'ajoute plus de message localement pour éviter les doublons
  }, [localName, sendMessage]);

  // Gestionnaire de messages du serveur WebSocket
  const handleWebSocketMessage = useCallback((event: MessageEvent) => {
    try {
      const msg = JSON.parse(event.data);

      switch (msg.type) {
        case 'game_state': {
          const players = msg.players as Player[];
          // Mettre à jour directement la liste des joueurs avec leurs couleurs serveur
          setConnectedPlayers(players);

          // Mettre à jour notre joueur local
          const myPlayer = players.find(p => p.name === localName);
          if (myPlayer) {
            myIdRef.current = myPlayer.id;
            setLocalPlayer(myPlayer);
          }

          // Mettre à jour l'ID du joueur dont c'est le tour et le flag
          setCurrentTurnPlayerId(msg.currentTurnPlayerId as string);
          setIsMyTurn(msg.currentTurnPlayerId === myIdRef.current);
          break;
        }

        case 'error': {
          setFeedback(msg.message);
          // Demander une mise à jour de l'état du jeu
          sendMessage({ type: 'get_game_state' });
          break;
        }
        
        case 'chat': {
          const ts = msg.timestamp as number;
          if (!ts) break;
          // Filtrer les doublons
          if (processedChatTimestamps.current.has(ts)) break;
          processedChatTimestamps.current.add(ts);

          // Ajouter le message
          setChatMessages(prev => [...prev, { 
            playerId: msg.playerId as string,
            name: msg.name as string,
            message: msg.message as string,
            color: msg.color as string | undefined,
            timestamp: ts
          }]);
          break;
        }
        
        default:
          console.log("Type de message non reconnu:", msg.type);
      }
    } catch (e) {
      console.error("Erreur lors du traitement du message WebSocket:", e);
    }
  }, [localName, sendMessage]);

  useEffect(() => {
    if (!isMulti) return;

    // Créer une nouvelle connexion WebSocket
    const ws = new WebSocket(WS_SERVER);
    
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
          const newWs = new WebSocket(WS_SERVER);
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
  }, [isMulti, localName, initialPosition, handleWebSocketMessage, WS_SERVER]);

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
    setFeedback,
    chatMessages,
    sendChat
  };
}
