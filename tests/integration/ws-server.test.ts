import { Server as SocketIOServer } from 'socket.io';
import { io } from 'socket.io-client';
import createWSServer from '../../ws-server';

// Interface pour les données attendues du serveur
interface Player {
  id: string;
  name: string;
  position: number;
  color: string;
}

interface GameStateMessage {
  players: Player[];
  currentTurnPlayerId: string | null;
}

describe('WebSocket Server (Socket.IO)', () => {
  let ioServer: SocketIOServer;
  const PORT = 5005; // Utiliser un port différent pour éviter les conflits

  beforeEach(() => {
    // Tests prêts pour exécution
  });

  beforeAll(async () => {
    // Créer une nouvelle instance de serveur pour les tests
    ioServer = createWSServer(PORT);
  });

  afterAll(done => {
    // Fermer proprement le serveur après les tests
    if (ioServer) {
      ioServer.close(() => {
        console.log('Server closed');
        done();
      });
    } else {
      done();
    }
  });

  test('broadcast join message to other clients', done => {
    // Créer deux clients Socket.IO
    const clientA = io(`http://localhost:${PORT}`, { transports: ['websocket'] });
    const clientB = io(`http://localhost:${PORT}`, { transports: ['websocket'] });
    
    let connectedCount = 0;
    
    // Compter les connexions pour savoir quand on peut envoyer
    const checkReady = () => {
      connectedCount++;
      if (connectedCount === 2) {
        // Les deux clients sont connectés, envoyons le message de join
        clientA.emit('join', { type: 'join', name: 'Alice' });
      }
    };
    
    clientA.on('connect', checkReady);
    clientB.on('connect', checkReady);
    
    // Attendre le message de join sur le client B
    clientB.on('join', (msg: { name: string }) => {
      expect(msg).toEqual({ name: 'Alice' });
      
      // Nettoyer et terminer le test
      clientA.disconnect();
      clientB.disconnect();
      done();
    });
  });

  test('broadcast game_state with player colors after join', done => {
    const client = io(`http://localhost:${PORT}`, { transports: ['websocket'] });
    
    client.on('connect', () => {
      client.emit('join', { type: 'join', name: 'Charlie' });
    });
    
    client.on('game_state', (data: GameStateMessage | string) => {
      // Le serveur peut envoyer soit un JSON stringifié soit un objet direct
      const msg: GameStateMessage = typeof data === 'string' ? JSON.parse(data) : data;
      
      // Vérifier que players est un tableau
      expect(Array.isArray(msg.players)).toBe(true);
      
      // Trouver notre joueur et vérifier qu'il a une couleur
      const player = msg.players.find((p: Player) => p.name === 'Charlie');
      expect(player).toBeDefined();
      expect(player?.color).toBeDefined();
      
      // Nettoyer et terminer
      client.disconnect();
      done();
    });
  });

  test('broadcast move message to other clients', done => {
    const clientA = io(`http://localhost:${PORT}`, { transports: ['websocket'] });
    const clientB = io(`http://localhost:${PORT}`, { transports: ['websocket'] });
    let joinCompleted = false;
    let clientsConnected = 0;
    let timeoutId: NodeJS.Timeout | null = null;
    
    const cleanup = () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (clientA.connected) clientA.disconnect();
      if (clientB.connected) clientB.disconnect();
    };
    
    // Connecter les deux clients et les faire rejoindre la partie
    clientA.on('connect', () => {
      clientsConnected++;
      clientA.emit('join', { type: 'join', name: 'David' });
    });
    
    clientB.on('connect', () => {
      clientsConnected++;
      clientB.emit('join', { type: 'join', name: 'Emma' });
    });
    
    // Vérifier l'état du jeu et envoyer un mouvement
    clientA.on('game_state', () => {
      if (!joinCompleted && clientsConnected >= 2) {
        joinCompleted = true;
        // Attendre un peu pour s'assurer que tous les clients sont prêts
        setTimeout(() => {
          clientA.emit('move', { type: 'move', position: 5 });
        }, 100);
      }
    });
    
    // Le client B devrait recevoir le mouvement
    clientB.on('move', (payload: { position: number; playerId: string }) => {
      try {
        expect(payload.position).toEqual(5);
        cleanup();
        done();
      } catch (error) {
        cleanup();
        done(error);
      }
    });
    
    // Timeout de sécurité
    timeoutId = setTimeout(() => {
      cleanup();
      done(new Error('Test timeout'));
    }, 4000);
  }, 5000);
});