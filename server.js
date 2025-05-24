import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server as SocketIOServer } from 'socket.io';

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

// Variables globales pour Socket.IO
let io = null;
const connectedPlayers = new Map();
let currentTurnPlayerId = null;

const availableColors = [
  "#FFD700", "#3B82F6", "#EF4444", "#10B981",
  "#F59E0B", "#8B5CF6", "#EC4899", "#06B6D4"
];

function getRandomColor() {
  const usedColors = new Set(Array.from(connectedPlayers.values()).map(p => p.color));
  const availableColorsFiltered = availableColors.filter(color => !usedColors.has(color));
  
  if (availableColorsFiltered.length === 0) {
    return availableColors[Math.floor(Math.random() * availableColors.length)];
  }
  
  return availableColorsFiltered[Math.floor(Math.random() * availableColorsFiltered.length)];
}

function setNextPlayerTurn() {
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

function broadcastGameState() {
  if (!io) return;
  
  const playersArray = Array.from(connectedPlayers.values());
  
  io.emit('game_state', {
    type: 'game_state',
    players: playersArray,
    currentTurnPlayerId: currentTurnPlayerId
  });
}

function setupSocketIO(server) {
  io = new SocketIOServer(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      credentials: true
    },
    transports: ['websocket', 'polling'],
    allowEIO3: true
  });

  io.on('connection', (socket) => {
    console.log('Nouveau client Socket.IO connecté:', socket.id);

    socket.on('join', (data) => {
      const playerName = data.name;
      const initialPosition = data.position || 0;
      
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

    socket.on('move', (data) => {
      const player = connectedPlayers.get(socket.id);
      if (!player) {
        socket.emit('error', { type: 'error', message: 'Joueur non trouvé' });
        return;
      }

      if (currentTurnPlayerId !== socket.id) {
        socket.emit('error', { type: 'error', message: 'Ce n\'est pas votre tour' });
        return;
      }

      const newPosition = data.position;
      if (typeof newPosition === 'number' && newPosition >= 0) {
        player.position = newPosition;
        connectedPlayers.set(socket.id, player);

        io.emit('player_moved', {
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

    socket.on('chat', (data) => {
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

      io.emit('chat', chatData);
      console.log(`Chat de ${player.name}: ${data.message}`);
    });

    socket.on('disconnect', () => {
      const player = connectedPlayers.get(socket.id);
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

  return io;
}

// Préparer l'application Next.js
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  // Créer le serveur HTTP
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  // Initialiser Socket.IO sur le serveur HTTP
  setupSocketIO(server);

  // Démarrer le serveur
  server.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
    console.log(`> Socket.IO server running on the same port`);
  });

  // Gestion propre de l'arrêt
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    server.close(() => {
      console.log('Process terminated');
    });
  });
});
