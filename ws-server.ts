import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';

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
function createWSServer(port: number): WebSocketServer {
  const shouldLog = process.env.NODE_ENV !== "test";
  const server = http.createServer();
  const wss = new WebSocketServer({ server });

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

    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
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
  function handleJoinMessage(ws: WebSocket & { id: string }, message: WebSocketMessage): void {
    if (!message.name) return;
    
    // Attribuer une couleur au joueur
    const playerColor = assignPlayerColor(ws.id);
    
    // Ajouter le joueur à la liste
    connectedPlayers.set(ws.id, {
      id: ws.id,
      name: message.name,
      position: message.position || 1,
      color: playerColor
    });

    // Répondre aux autres clients avec le message de join
    wss.clients.forEach(client => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: "join", name: message.name }));
      }
    });

    // Si c'est le premier joueur, lui donner le tour
    if (connectedPlayers.size === 1 && currentTurnPlayerId === null) {
      currentTurnPlayerId = ws.id;
    }

    // Diffuser la liste mise à jour des joueurs et l'état du jeu
    broadcastGameState();
  }

  /**
   * Gère les messages de type 'move'
   */
  function handleMoveMessage(ws: WebSocket & { id: string }, message: WebSocketMessage): void {
    if (!message.position || message.position === undefined) return;
    
    // Vérifier que c'est bien le tour de ce joueur
    if (ws.id === currentTurnPlayerId) {
      // Mettre à jour la position du joueur
      const player = connectedPlayers.get(ws.id);
      if (player) {
        player.position = message.position;
        connectedPlayers.set(ws.id, player);

        // Diffuser le move aux autres clients
        wss.clients.forEach(client => {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ 
              type: "move", 
              position: message.position,
              playerId: ws.id
            }));
          }
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
      ws.send(
        JSON.stringify({
          type: "error",
          message: "Ce n'est pas votre tour",
          currentTurnPlayerId,
        })
      );
    }
  }

  wss.on("connection", (ws: WebSocket) => {
    if (shouldLog) console.log("Client connecté");

    // Étendre l'objet WebSocket avec un ID
    const extendedWs = ws as WebSocket & { id: string };
    
    // Assigner un ID temporaire au client
    extendedWs.id = Date.now().toString();

    extendedWs.on("message", (data) => {
      try {
        const message = JSON.parse(data.toString()) as WebSocketMessage;

        // Gérer les différents types de messages
        if (message.type === "join") {
          handleJoinMessage(extendedWs, message);
        } else if (message.type === "move") {
          handleMoveMessage(extendedWs, message);
        } else if (message.type === "get_game_state") {
          // Demande explicite d'état de jeu
          extendedWs.send(
            JSON.stringify({
              type: "game_state",
              players: Array.from(connectedPlayers.values()),
              currentTurnPlayerId,
            })
          );
        }
      } catch (e) {
        if (shouldLog) console.error("Erreur de parsing JSON:", e);
      }
    });

    extendedWs.on("close", () => {
      // Vérifier si c'était le tour de ce joueur
      const wasThisTurn = currentTurnPlayerId === extendedWs.id;

      // Supprimer le joueur de la liste
      connectedPlayers.delete(extendedWs.id);

      // Si c'était le tour de ce joueur, passer au joueur suivant
      if (wasThisTurn) {
        setNextPlayerTurn();
      } else {
        // Sinon, juste mettre à jour la liste des joueurs
        broadcastGameState();
      }

      if (shouldLog) console.log("Client déconnecté");
    });
  });

  server.listen(port, () => {
    if (shouldLog) {
      console.log(`WebSocket server listening on ws://localhost:${port}`);
    }
  });

  return wss;
}

const PORT = 4000;
createWSServer(PORT);

export default createWSServer;
