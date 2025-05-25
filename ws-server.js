// Serveur WebSocket simple pour le développement local
import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

const app = express();
const server = createServer(app);

// Configuration Socket.IO
const io = new SocketIOServer(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true
});

// État du jeu
const connectedPlayers = new Map();
let currentTurnPlayerId = null;

// Couleurs aléatoires pour les joueurs
const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];
function getRandomColor() {
  return colors[Math.floor(Math.random() * colors.length)];
}

function setNextPlayerTurn() {
  const playerIds = Array.from(connectedPlayers.keys());
  if (playerIds.length === 0) {
    currentTurnPlayerId = null;
    return;
  }
  if (playerIds.length === 1) {
    currentTurnPlayerId = playerIds[0];
    return;
  }
  if (!currentTurnPlayerId || !connectedPlayers.has(currentTurnPlayerId)) {
    currentTurnPlayerId = playerIds[0];
  } else {
    const currentIndex = playerIds.indexOf(currentTurnPlayerId);
    const nextIndex = (currentIndex + 1) % playerIds.length;
    currentTurnPlayerId = playerIds[nextIndex];
  }
}

function broadcastGameState() {
  const playersArray = Array.from(connectedPlayers.values());
  
  console.log('🎮 Diffusion game_state avec joueurs:', playersArray.map(p => ({
    id: p.id,
    name: p.name,
    nameLength: p.name.length,
    position: p.position,
    color: p.color
  })));
  
  io.emit('game_state', {
    type: 'game_state',
    players: playersArray,
    currentTurnPlayerId: currentTurnPlayerId
  });
}

io.on('connection', (socket) => {
  console.log('Nouveau client Socket.IO connecté:', socket.id);

  socket.on('join', (data) => {
    const playerName = data.name?.trim();
    const initialPosition = data.position || 0;
    
    console.log('🔍 Tentative de join avec:', {
      name: playerName,
      nameType: typeof playerName,
      nameLength: playerName ? playerName.length : 'undefined',
      rawData: data
    });
    
    if (!playerName) {
      socket.emit('error', { type: 'error', message: 'Nom de joueur requis' });
      return;
    }

    const newPlayer = {
      id: socket.id,
      name: playerName,
      position: initialPosition,
      color: getRandomColor()
    };

    connectedPlayers.set(socket.id, newPlayer);
    
    console.log('👤 Joueur ajouté:', {
      id: newPlayer.id,
      name: `"${newPlayer.name}"`,
      nameLength: newPlayer.name.length,
      position: newPlayer.position,
      color: newPlayer.color
    });

    if (currentTurnPlayerId === null && connectedPlayers.size === 1) {
      currentTurnPlayerId = socket.id;
    }

    socket.emit('joined', {
      type: 'joined',
      playerId: socket.id,
      player: newPlayer,
      currentTurnPlayerId: currentTurnPlayerId
    });

    broadcastGameState();
    console.log(`Joueur ${playerName} rejoint (${socket.id})`);
  });

  socket.on('disconnect', () => {
    const player = connectedPlayers.get(socket.id);
    if (player) {
      console.log(`Joueur ${player.name} déconnecté (${socket.id})`);
      connectedPlayers.delete(socket.id);
      
      if (currentTurnPlayerId === socket.id) {
        setNextPlayerTurn();
      }
      
      broadcastGameState();
    }
  });
});

const PORT = 4000;
server.listen(PORT, () => {
  console.log(`🚀 Serveur WebSocket en écoute sur le port ${PORT}`);
});
