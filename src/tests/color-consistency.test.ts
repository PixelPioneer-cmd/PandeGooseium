import { Server as SocketIOServer } from 'socket.io';
import { io } from 'socket.io-client';
import createWSServer from '../../ws-server';

// Augmenter le timeout pour tous les tests dans ce fichier
jest.setTimeout(30000);

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
    
    // Données du joueur A
    const playerAName = 'Alice';
    let playerAColor: string | null = null;
    
    // Données du joueur B
    const playerBName = 'Bob';
    let playerBColor: string | null = null;

    // Compteur pour gérer l'asynchronisme
    let playerDataReceived = 0;
    
    // Fonction pour vérifier si le test est terminé
    function checkTestComplete() {
      if (playerDataReceived >= 2) {
        // Vérifier que les couleurs sont attribuées
        expect(playerAColor).not.toBeNull();
        expect(playerBColor).not.toBeNull();
        
        // Vérifier que les couleurs sont différentes
        expect(playerAColor).not.toEqual(playerBColor);
        
        // Vérifier la cohérence des couleurs lors d'une reconnexion
        // Créer un nouveau client avec le même nom que A
        const clientARejoin = io(`http://localhost:${PORT}`, { transports: ['websocket'] });
        
        clientARejoin.on('connect', () => {
          clientARejoin.emit('join', { type: 'join', name: playerAName });
        });
        
        clientARejoin.on('game_state', (data) => {
          const msg = typeof data === 'string' ? JSON.parse(data) : data;
          
          // Trouver le joueur correspondant
          const samePlayer = msg.players.find((p: { name: string }) => p.name === playerAName);
          
          // Vérifier que le nouveau joueur a la même couleur que l'ancien
          expect(samePlayer).toBeTruthy();
          expect(samePlayer.color).toEqual(playerAColor);
          
          // Fermer tous les clients
          clientA.disconnect();
          clientB.disconnect();
          clientARejoin.disconnect();
          
          // Test terminé
          done();
        });
      }
    }

    // Connecter le client A
    clientA.on('connect', () => {
      clientA.emit('join', { type: 'join', name: playerAName });
    });

    // Connecter le client B
    clientB.on('connect', () => {
      clientB.emit('join', { type: 'join', name: playerBName });
    });

    // Écouter les mises à jour d'état du jeu pour le client A
    clientA.on('game_state', (data) => {
      const msg = typeof data === 'string' ? JSON.parse(data) : data;
      
      // Trouver le joueur A dans la liste
      const playerA = msg.players.find((p: { name: string }) => p.name === playerAName);
      if (playerA) {
        playerAColor = playerA.color;
        playerDataReceived++;
        checkTestComplete();
      }
    });

    // Écouter les mises à jour d'état du jeu pour le client B
    clientB.on('game_state', (data) => {
      const msg = typeof data === 'string' ? JSON.parse(data) : data;
      
      // Trouver le joueur B dans la liste
      const playerB = msg.players.find((p: { name: string }) => p.name === playerBName);
      if (playerB) {
        playerBColor = playerB.color;
        playerDataReceived++;
        checkTestComplete();
      }
    });
  });
});
