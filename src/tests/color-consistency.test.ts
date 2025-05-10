import WebSocket, { WebSocketServer } from 'ws';
import createWSServer from '../../ws-server';

// Mock pour éviter l'erreur de réassignation de NODE_ENV
jest.mock('process', () => ({
  ...process,
  env: {
    ...process.env,
    NODE_ENV: 'test'
  }
}));

// Port unique pour éviter les conflits avec d'autres tests
const PORT = 5002;

describe('Cohérence des couleurs entre joueurs', () => {
  let wss: WebSocketServer;

  beforeAll(() => {
    wss = createWSServer(PORT);
  });

  afterAll((done) => {
    wss.close(() => done());
  });

  test('Chaque joueur reçoit une couleur unique et cohérente', (done) => {
    // Créer deux clients
    const clientA = new WebSocket(`ws://localhost:${PORT}`);
    const clientB = new WebSocket(`ws://localhost:${PORT}`);
    
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
        const clientARejoin = new WebSocket(`ws://localhost:${PORT}`);
        
        clientARejoin.on('open', () => {
          clientARejoin.send(JSON.stringify({ type: 'join', name: playerAName }));
        });
        
        clientARejoin.on('message', (data) => {
          const msg = JSON.parse(data.toString());
          if (msg.type === 'game_state') {
            // Trouver le joueur correspondant
            const samePlayer = msg.players.find((p: { name: string }) => p.name === playerAName);
            
            // Vérifier que le nouveau joueur a la même couleur que l'ancien
            expect(samePlayer).toBeTruthy();
            expect(samePlayer.color).toEqual(playerAColor);
            
            // Fermer tous les clients
            clientA.close();
            clientB.close();
            clientARejoin.close();
            
            // Test terminé
            done();
          }
        });
      }
    }

    // Gestion des messages pour le client A
    clientA.on('open', () => {
      clientA.send(JSON.stringify({ type: 'join', name: playerAName }));
    });
    
    clientA.on('message', (data) => {
      const msg = JSON.parse(data.toString());
      if (msg.type === 'game_state') {
        // Trouver le joueur A dans la liste
        const playerA = msg.players.find((p: { name: string }) => p.name === playerAName);
        if (playerA) {
          playerAColor = playerA.color;
          playerDataReceived++;
          checkTestComplete();
        }
      }
    });

    // Gestion des messages pour le client B
    clientB.on('open', () => {
      clientB.send(JSON.stringify({ type: 'join', name: playerBName }));
    });
    
    clientB.on('message', (data) => {
      const msg = JSON.parse(data.toString());
      if (msg.type === 'game_state') {
        // Trouver le joueur B dans la liste
        const playerB = msg.players.find((p: { name: string }) => p.name === playerBName);
        if (playerB) {
          playerBColor = playerB.color;
          playerDataReceived++;
          checkTestComplete();
        }
      }
    });
  }, 10000); // Timeout plus long pour les tests de WebSocket
});
