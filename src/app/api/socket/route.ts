import { Server as SocketIOServer } from 'socket.io';
import { Server as HttpServer } from 'http';

interface Player {
  id: string;
  name: string;
  position: number;
  color: string;
}

interface WebSocketMessage {
  type: string;
  name?: string;
  position?: number;
  [key: string]: unknown;
}

// Instance globale du serveur Socket.IO
let io: SocketIOServer | null = null;

// Liste des joueurs connectés
const connectedPlayers = new Map<string, Player>();

// Gestion des tours
let currentTurnPlayerId: string | null = null;

// Couleurs disponibles pour les joueurs
const availableColors = [
  "#FFD700", // Or
  "#3B82F6", // Bleu vif
  "#EF4444", // Rouge vif
  "#10B981", // Vert vif
  "#F59E0B", // Orange
  "#8B5CF6", // Violet
  "#EC4899", // Rose
  "#06B6D4", // Cyan
];

function getRandomColor(): string {
  const usedColors = new Set(Array.from(connectedPlayers.values()).map(p => p.color));
  const availableColorsFiltered = availableColors.filter(color => !usedColors.has(color));
  
  if (availableColorsFiltered.length === 0) {
    return availableColors[Math.floor(Math.random() * availableColors.length)];
  }
  
  return availableColorsFiltered[Math.floor(Math.random() * availableColorsFiltered.length)];
}

function setNextPlayerTurn(): void {
  const playerIds = Array.from(connectedPlayers.keys());
  if (playerIds.length === 0) {
    currentTurnPlayerId = null;
    return;
  }

  if (currentTurnPlayerId === null) {
    currentTurnPlayerId = playerIds[0];
  } else {
    const currentIndex = playerIds.indexOf(currentTurnPlayerId);
    const nextIndex = (currentIndex + 1) % playerIds.length;
    currentTurnPlayerId = playerIds[nextIndex];
  }
}

function broadcastGameState(): void {
  if (!io) return;
  
  const playersArray = Array.from(connectedPlayers.values());
  
  io.emit('players', {
    type: 'players',
    players: playersArray,
    currentTurn: currentTurnPlayerId
  });
}

function initializeSocketIO(server: HttpServer): SocketIOServer {
  const socketIO = new SocketIOServer(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      credentials: true
    },
    transports: ['websocket', 'polling'],
    allowEIO3: true
  });

  socketIO.on('connection', (socket) => {
    console.log('Nouveau client Socket.IO connecté:', socket.id);

    socket.on('join', (data: WebSocketMessage) => {
      const playerName = data.name as string;
      const initialPosition = (data.position as number) || 0;
      
      if (!playerName) {
        socket.emit('error', { type: 'error', message: 'Nom de joueur requis' });
        return;
      }

      const newPlayer: Player = {
        id: socket.id,
        name: playerName,
        position: initialPosition,
        color: getRandomColor()
      };

      connectedPlayers.set(socket.id, newPlayer);

      if (currentTurnPlayerId === null && connectedPlayers.size === 1) {
        currentTurnPlayerId = socket.id;
      }

      socket.emit('joined', {
        type: 'joined',
        playerId: socket.id,
        player: newPlayer,
        currentTurn: currentTurnPlayerId
      });

      broadcastGameState();
      console.log(`Joueur ${playerName} rejoint (${socket.id})`);
    });

    socket.on('move', (data: WebSocketMessage) => {
      const player = connectedPlayers.get(socket.id);
      if (!player) {
        socket.emit('error', { type: 'error', message: 'Joueur non trouvé' });
        return;
      }

      if (currentTurnPlayerId !== socket.id) {
        socket.emit('error', { type: 'error', message: 'Ce n\'est pas votre tour' });
        return;
      }

      const newPosition = data.position as number;
      if (typeof newPosition === 'number' && newPosition >= 0) {
        player.position = newPosition;
        connectedPlayers.set(socket.id, player);

        socketIO.emit('player_moved', {
          type: 'player_moved',
          playerId: socket.id,
          newPosition: newPosition,
          player: player
        });

        setNextPlayerTurn();
        broadcastGameState();
        console.log(`Joueur ${player.name} déplacé à la position ${newPosition}`);
      }
    });

    socket.on('chat', (data: WebSocketMessage) => {
      const player = connectedPlayers.get(socket.id);
      if (!player) return;

      const chatData = {
        type: 'chat',
        playerId: socket.id,
        name: player.name,
        message: data.message,
        color: player.color,
        timestamp: data.timestamp || Date.now()
      };

      socketIO.emit('chat', chatData);
      console.log(`Chat de ${player.name}: ${data.message}`);
    });

    socket.on('disconnect', () => {
      const wasThisTurn = currentTurnPlayerId === socket.id;

      connectedPlayers.delete(socket.id);
      
      if (wasThisTurn) {
        setNextPlayerTurn();
      } else {
        broadcastGameState();
      }
      
      console.log('Client déconnecté', socket.id);
    });
  });

  return socketIO;
}

export async function GET(/*request: NextRequest*/) {
  // Cette route est utilisée pour initialiser Socket.IO côté client
  return new Response(JSON.stringify({ message: 'Socket.IO endpoint ready' }), {
    headers: { 'Content-Type': 'application/json' },
  });
}

// Fonction pour obtenir ou créer l'instance Socket.IO
export function getSocketIO(): SocketIOServer | null {
  return io;
}

// Fonction pour initialiser Socket.IO avec le serveur HTTP de Next.js
export function setupSocketIO(server: HttpServer): SocketIOServer {
  if (!io) {
    io = initializeSocketIO(server);
    console.log('Socket.IO server initialized on Next.js HTTP server');
  }
  return io;
}
