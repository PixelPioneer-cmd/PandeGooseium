import { Server as SocketIOServer } from 'socket.io';
import { io } from 'socket.io-client';
import createWSServer from '../../ws-server';

// Port unique pour éviter les conflits avec d'autres tests
const PORT = 5006;

describe('Cohérence des couleurs entre joueurs', () => {
  let ioServer: SocketIOServer;

  beforeAll(() => {
    ioServer = createWSServer(PORT);
  });

  afterAll((done) => {
    ioServer.close(() => {
      console.log('Server closed');
      done();
    });
  });

  test('Chaque joueur reçoit une couleur unique et cohérente', (done) => {
    // Créer deux clients Socket.IO
    const clientA = io(`http://localhost:${PORT}`, { transports: ['websocket'] });
    const clientB = io(`http://localhost:${PORT}`, { transports: ['websocket'] });
    
    // Données des joueurs
    const playerAName = 'Alice';
    const playerBName = 'Bob';
    
    let playerAColor: string | null = null;
    let playerBColor: string | null = null;
    let playerDataReceived = 0;
    let timeoutId: NodeJS.Timeout | null = null;
    
    const cleanup = () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (clientA.connected) clientA.disconnect();
      if (clientB.connected) clientB.disconnect();
    };
    
    // Fonction pour vérifier si le test est terminé
    function checkTestComplete() {
      if (playerDataReceived >= 2 && playerAColor && playerBColor) {
        try {
          // Vérifier que les couleurs sont attribuées
          expect(playerAColor).not.toBeNull();
          expect(playerBColor).not.toBeNull();
          
          // Vérifier que les couleurs sont différentes
          expect(playerAColor).not.toEqual(playerBColor);
          
          console.log(`✅ Test couleurs: ${playerAName}=${playerAColor}, ${playerBName}=${playerBColor}`);
          
          cleanup();
          done();
        } catch (error) {
          cleanup();
          done(error);
        }
      }
    }
    
    // Timeout de sécurité
    timeoutId = setTimeout(() => {
      cleanup();
      done(new Error(`Test timeout - playerDataReceived: ${playerDataReceived}, playerAColor: ${playerAColor}, playerBColor: ${playerBColor}`));
    }, 8000);

    // Connecter le client A
    clientA.on('connect', () => {
      clientA.emit('join', { type: 'join', name: playerAName });
    });

    // Connecter le client B
    clientB.on('connect', () => {
      clientB.emit('join', { type: 'join', name: playerBName });
    });

    // Écouter les mises à jour d'état du jeu pour le client A
    clientA.on('game_state', (data: any) => {
      const msg = typeof data === 'string' ? JSON.parse(data) : data;
      
      // Trouver le joueur A dans la liste
      const playerA = msg.players.find((p: { name: string }) => p.name === playerAName);
      if (playerA && playerA.color && !playerAColor) {
        playerAColor = playerA.color;
        playerDataReceived++;
        console.log(`Player A (${playerAName}) reçu couleur: ${playerAColor}`);
        checkTestComplete();
      }
    });

    // Écouter les mises à jour d'état du jeu pour le client B
    clientB.on('game_state', (data: any) => {
      const msg = typeof data === 'string' ? JSON.parse(data) : data;
      
      // Trouver le joueur B dans la liste
      const playerB = msg.players.find((p: { name: string }) => p.name === playerBName);
      if (playerB && playerB.color && !playerBColor) {
        playerBColor = playerB.color;
        playerDataReceived++;
        console.log(`Player B (${playerBName}) reçu couleur: ${playerBColor}`);
        checkTestComplete();
      }
    });
  }, 10000);
});
