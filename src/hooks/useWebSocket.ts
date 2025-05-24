import { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

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

  const socketRef = useRef<Socket | null>(null);
  const myIdRef = useRef<string | null>(null);

  // Pour filtrer les messages de chat en doublon
  const processedChatTimestamps = useRef<Set<number>>(new Set());

  // URL du serveur WebSocket - configuration intelligente selon l'environnement
  const getWebSocketURL = () => {
    // Si une URL explicite est fournie via .env, l'utiliser
    if (process.env.NEXT_PUBLIC_WS_SERVER) {
      console.log('🔗 URL WebSocket depuis .env:', process.env.NEXT_PUBLIC_WS_SERVER);
      return process.env.NEXT_PUBLIC_WS_SERVER;
    }
    
    // En production, utiliser la même URL que l'application web
    if (typeof window !== 'undefined') {
      const { protocol, hostname, port } = window.location;
      console.log('🌍 Détection environnement:', { protocol, hostname, port });
      
      // Sur Render, l'app web et le WebSocket partagent le même port
      if (hostname.includes('onrender.com')) {
        const wsProtocol = protocol === 'https:' ? 'https:' : 'http:';
        const wsUrl = `${wsProtocol}//${hostname}`;
        console.log('🚀 URL WebSocket Render:', wsUrl);
        return wsUrl;
      }
    }
    
    // Fallback pour le développement local
    console.log('🏠 URL WebSocket local:', 'http://localhost:4000');
    return 'http://localhost:4000';
  };

  const WS_SERVER = getWebSocketURL();

  // Fonction pour envoyer des messages au serveur WebSocket
  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (socketRef.current?.connected) {
      // Avec Socket.IO, on émet sur le type du message plutôt que d'envoyer un objet JSON
      socketRef.current.emit(message.type, message);
    }
  }, []);

  const sendChat = useCallback((messageText: string) => {
    if (!localName) {
      console.log("⚠️ Pas de nom local défini, impossible d'envoyer le chat");
      return;
    }
    
    if (!socketRef.current?.connected) {
      console.log("⚠️ Socket non connecté, impossible d'envoyer le chat");
      return;
    }
    
    console.log("📤 Envoi d'un message chat:", messageText, "de", localName);
    
    // Avec Socket.IO, on émet directement l'événement 'chat'
    socketRef.current.emit('chat', { 
      type: 'chat', 
      message: messageText,
      name: localName,
      timestamp: Date.now()
    });
  }, [localName]);

  useEffect(() => {
    if (!isMulti) return;

    console.log('Tentative de connexion à:', WS_SERVER);
    
    // Créer une nouvelle connexion Socket.IO avec configuration robuste pour Render
    const socket = io(WS_SERVER, {
      transports: ['websocket', 'polling'], // WebSocket d'abord, polling en fallback
      upgrade: true,                        // Permettre l'upgrade vers WebSocket
      reconnectionAttempts: 10,             // Plus de tentatives pour les réseaux instables
      reconnectionDelay: 1000,              // Délai entre tentatives
      timeout: 20000,                       // Timeout plus long
      forceNew: true,                       // Force une nouvelle connexion
      autoConnect: true                     // Connexion automatique
    });
    
    socket.on('connect', () => {
      console.log('Socket.IO connecté, ID:', socket.id);
      console.log('Transport utilisé:', socket.io.engine.transport.name);
      
      // Joindre la partie avec notre nom et position
      socket.emit('join', { 
        type: 'join', 
        name: localName, 
        position: initialPosition 
      });
    });
    
    socket.on('connect_error', (error) => {
      console.error('Erreur de connexion Socket.IO:', error);
      setFeedback(`Erreur de connexion: ${error.message}`);
    });
    
    // Écouter les messages game_state
    socket.on('game_state', (data) => {
      console.log('📊 Reçu game_state:', data);
      
      // Le serveur peut envoyer une chaîne JSON ou un objet
      const parsed = typeof data === 'string' ? JSON.parse(data) : data;
      const players = parsed.players as Player[];
      
      console.log('👥 Joueurs mis à jour:', players);
      
      // Mettre à jour la liste des joueurs
      setConnectedPlayers(players);

      // Mettre à jour notre joueur local
      const myPlayer = players.find(p => p.name === localName);
      if (myPlayer) {
        console.log('🤵 Joueur local trouvé dans game_state:', myPlayer);
        myIdRef.current = myPlayer.id;
        setLocalPlayer(myPlayer);
        console.log('🤵 Joueur local mis à jour via game_state:', myPlayer);
      } else {
        console.log('⚠️ Joueur local non trouvé dans game_state, nom cherché:', localName);
      }

      // Mettre à jour l'ID du joueur dont c'est le tour et le flag
      setCurrentTurnPlayerId(parsed.currentTurnPlayerId);
      
      // Utiliser soit myIdRef.current (si défini) soit myPlayer.id pour déterminer le tour
      const myCurrentId = myIdRef.current || myPlayer?.id;
      setIsMyTurn(parsed.currentTurnPlayerId === myCurrentId);
      console.log('🎲 Tour actuel:', parsed.currentTurnPlayerId, 'Mon ID:', myCurrentId, 'Mon tour:', parsed.currentTurnPlayerId === myCurrentId);
    });
    
    // Écouter la confirmation de join
    socket.on('joined', (data) => {
      console.log('Rejoint avec succès:', data);
      myIdRef.current = data.playerId;
      setLocalPlayer(data.player);
      setCurrentTurnPlayerId(data.currentTurnPlayerId);
      setIsMyTurn(data.currentTurnPlayerId === data.playerId);
    });
    
    // Écouter les messages d'erreur
    socket.on('error', (msg) => {
      console.error('Erreur du serveur:', msg);
      setFeedback(msg.message);
      socket.emit('get_game_state');
    });
    
    // Écouter les messages de chat
    socket.on('chat', (msg) => {
      console.log('💬 Message chat reçu:', msg);
      const ts = msg.timestamp as number;
      if (!ts) {
        console.log('⚠️ Message chat sans timestamp ignoré');
        return;
      }
      
      // Filtrer les doublons
      if (processedChatTimestamps.current.has(ts)) {
        console.log('🔄 Message chat doublon ignoré:', ts);
        return;
      }
      processedChatTimestamps.current.add(ts);

      // Ajouter le message
      const newMessage = { 
        playerId: msg.playerId,
        name: msg.name,
        message: msg.message,
        color: msg.color,
        timestamp: ts
      };
      console.log('✅ Ajout message chat:', newMessage);
      setChatMessages(prev => [...prev, newMessage]);
    });
    
    socket.on('join', (msg) => {
      console.log('Nouveau joueur rejoint:', msg);
    });
    
    socket.on('player_moved', (msg) => {
      console.log('Joueur déplacé:', msg);
      // Actualiser l'état du jeu quand un joueur bouge
      setFeedback(`${msg.player.name} s'est déplacé à la case ${msg.newPosition}`);
    });
    
    socket.on('move', (msg) => {
      console.log('Mouvement reçu:', msg);
    });
    
    socket.on('disconnect', () => {
      console.log('Socket.IO déconnecté, tentative de reconnexion...');
    });
    
    socketRef.current = socket;
    
    // Nettoyage à la désinscription
    return () => {
      console.log('Nettoyage de la connexion Socket.IO');
      socket.disconnect();
    };
  }, [isMulti, localName, initialPosition, WS_SERVER]);

  // Effet pour initialiser le joueur local en mode solo
  useEffect(() => {
    if (!isMulti) {
      setLocalPlayer({ id: 'local', name: localName || 'Vous', position: initialPosition, color: '#FFD700' });
      setIsMyTurn(true);
    }
  }, [isMulti, initialPosition, localName]);

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
