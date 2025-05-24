import http from 'http';
import express from 'express';
import { Server as SocketIOServer, Socket } from 'socket.io';

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

/**
 * Crée un serveur WebSocket pour le jeu de l'oie
 * @param port Port sur lequel le serveur doit écouter
 * @returns Instance WebSocketServer
 */
function createWSServer(port: number): SocketIOServer {
  const shouldLog = process.env.NODE_ENV !== 'test';
  const app = express();
  const server = http.createServer(app);
  
  // Configuration CORS plus complète pour Render
  const io = new SocketIOServer(server, { 
    cors: { 
      origin: "*",
      methods: ["GET", "POST"],
      credentials: true
    },
    transports: ['websocket', 'polling'], // Support des deux transports
    allowEIO3: true // Compatibilité avec les anciennes versions
  });

  // Liste des joueurs connectés
  const connectedPlayers = new Map<string, Player>();

  // Gestion des tours - null au départ, puis contient l'ID du joueur actif
  let currentTurnPlayerId: string | null = null;
  
  // Liste des couleurs disponibles pour les joueurs
  const availableColors = [
    "#FFD700", // Or (jaune plus vif)
    "#3B82F6", // Bleu vif
    "#EF4444", // Rouge vif
    "#10B981", // Vert vif
    "#8B5CF6", // Violet vif
    "#F97316", // Orange vif
    "#EC4899", // Rose vif
    "#64748B", // Slate-500 (gris plus foncé et visible)
  ];

  // Map pour suivre les couleurs déjà attribuées
  const usedColors = new Map<string, string>();
  
  /**
   * Attribue une couleur unique à un joueur
   * @param playerId ID du joueur
   * @returns Couleur attribuée
   */
  function assignPlayerColor(playerId: string): string {
    // Si ce joueur a déjà une couleur, la réutiliser
    if (usedColors.has(playerId)) {
      return usedColors.get(playerId)!;
    }
    
    // Chercher une couleur disponible
    const usedColorsSet = new Set(usedColors.values());
    let availableColor = availableColors.find(color => !usedColorsSet.has(color));
    
    // Si toutes les couleurs sont utilisées, prendre la première
    if (!availableColor) {
      availableColor = availableColors[0];
    }
    
    // Enregistrer la couleur attribuée
    usedColors.set(playerId, availableColor);
    
    if (shouldLog) console.log(`Couleur attribuée à ${playerId}: ${availableColor}`);
    
    return availableColor;
  }

  /**
   * Diffuse l'état actuel du jeu à tous les clients connectés
   */
  function broadcastGameState(): void {
    const playersList = Array.from(connectedPlayers.values());
    const message = JSON.stringify({
      type: "game_state",
      players: playersList,
      currentTurnPlayerId,
    });

    io.emit('game_state', message);
  }

  /**
   * Passe au joueur suivant dans l'ordre des tours
   */
  function setNextPlayerTurn(): void {
    const playerIds = Array.from(connectedPlayers.keys());
    
    if (playerIds.length === 0) {
      currentTurnPlayerId = null;
      return;
    }

    if (!currentTurnPlayerId || !connectedPlayers.has(currentTurnPlayerId)) {
      // Premier tour ou joueur actuel déconnecté, on prend le premier joueur
      currentTurnPlayerId = playerIds[0];
    } else {
      // Trouver l'index du joueur actuel
      const currentIndex = playerIds.indexOf(currentTurnPlayerId);
      // Passer au joueur suivant (ou revenir au premier)
      const nextIndex = (currentIndex + 1) % playerIds.length;
      currentTurnPlayerId = playerIds[nextIndex];
    }

    if (shouldLog) {
      console.log(
        `Tour de joueur: ${connectedPlayers.get(currentTurnPlayerId)?.name}`
      );
    }

    // Informer tous les clients du changement de tour
    broadcastGameState();
  }

  /**
   * Gère les messages de type 'join'
   */
  function handleJoinMessage(socket: Socket, message: WebSocketMessage): void {
    if (!message.name) return;
    
    // Vérifier si un joueur avec ce nom existe déjà
    const existingPlayer = Array.from(connectedPlayers.values()).find(
      p => p.name === message.name
    );
    
    if (existingPlayer) {
      // Si le joueur existe déjà mais avec un autre ID, c'est probablement une reconnexion
      // Nous allons mettre à jour l'ID et garder les autres infos
      if (existingPlayer.id !== socket.id) {
        if (shouldLog) console.log(`Joueur ${message.name} reconnecté avec nouvel ID ${socket.id}`);
        // Récupérer l'ancienne couleur
        const existingColor = usedColors.get(existingPlayer.id);
        // Supprimer l'ancienne entrée
        connectedPlayers.delete(existingPlayer.id);
        usedColors.delete(existingPlayer.id);
        
        // Réutiliser la même couleur pour ce joueur
        if (existingColor) {
          usedColors.set(socket.id, existingColor);
        }
      } else {
        // Même joueur, même ID - ne rien faire
        if (shouldLog) console.log('Joueur', message.name, 'déjà connecté avec ID', socket.id);
        return;
      }
    }
    
    // Attribuer une couleur au joueur (ou réutiliser l'existante)
    const playerColor = assignPlayerColor(socket.id);
    
    // Ajouter le joueur à la liste
    connectedPlayers.set(socket.id, {
      id: socket.id,
      name: message.name,
      position: message.position || 1,
      color: playerColor
    });

    // Répondre aux autres clients avec le message de join
    socket.broadcast.emit('join', { name: message.name });

    // Si c'est le premier joueur, lui donner le tour
    if (connectedPlayers.size === 1 && currentTurnPlayerId === null) {
      currentTurnPlayerId = socket.id;
    }

    // Diffuser la liste mise à jour des joueurs et l'état du jeu
    broadcastGameState();
  }

  /**
   * Gère les messages de type 'move'
   */
  function handleMoveMessage(socket: Socket, message: WebSocketMessage): void {
    if (!message.position || message.position === undefined) return;
    
    // Vérifier que c'est bien le tour de ce joueur
    if (socket.id === currentTurnPlayerId) {
      // Mettre à jour la position du joueur
      const player = connectedPlayers.get(socket.id);
      if (player) {
        player.position = message.position;
        connectedPlayers.set(socket.id, player);

        // Diffuser le move aux autres clients
        socket.broadcast.emit('move', { 
          position: message.position,
          playerId: socket.id
        });

        // Passer au joueur suivant
        setNextPlayerTurn();
      }
    } else {
      // Ce n'est pas le tour de ce joueur, ignorer la demande
      if (shouldLog) {
        console.log(
          `Mouvement ignoré: ce n'est pas le tour de ${message.name}`
        );
      }

      // Informer le client que ce n'est pas son tour
      socket.emit('error', {
        message: "Ce n'est pas votre tour",
        currentTurnPlayerId,
      });
    }
  }

  io.on('connection', (socket: Socket) => {
    if (shouldLog) console.log('Client connecté', socket.id);

    // Utiliser socket.id comme identifiant unique

    // Gérer les events Socket.IO
    socket.on('join', (message: WebSocketMessage) => handleJoinMessage(socket, message));
    socket.on('move', (message: WebSocketMessage) => handleMoveMessage(socket, message));
    socket.on('get_game_state', () => {
      socket.emit('game_state', {
        players: Array.from(connectedPlayers.values()),
        currentTurnPlayerId,
      });
    });
    socket.on('chat', (msg: WebSocketMessage) => {
      if (shouldLog) console.log('Chat reçu de', msg.name, msg.message);
      const player = connectedPlayers.get(socket.id);
      if (!player) return;
      const payload = {
        type: 'chat',
        playerId: socket.id,
        name: player.name,
        message: msg.message as string,
        color: player.color,
        timestamp: Date.now(),
      };
      io.emit('chat', payload);
    });

    socket.on('disconnect', () => {
      const wasThisTurn = currentTurnPlayerId === socket.id;
      connectedPlayers.delete(socket.id);
      if (wasThisTurn) {
        setNextPlayerTurn();
      } else {
        broadcastGameState();
      }
      if (shouldLog) console.log('Client déconnecté', socket.id);
    });
  });

  server.listen(port, '0.0.0.0', () => {
    if (shouldLog) console.log(`Socket.IO server listening on port ${port} (${process.env.NODE_ENV || 'development'})`);
  });
  return io;
}

// Utiliser le port fourni par Render ou un port par défaut
const PORT = parseInt(process.env.PORT || '4000', 10);

// Ne créer le serveur que si ce fichier est exécuté directement
if (import.meta.url === `file://${process.argv[1]}`) {
  createWSServer(PORT);
}

export default createWSServer;
