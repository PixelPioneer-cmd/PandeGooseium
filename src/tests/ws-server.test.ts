jest.setTimeout(10000);
import WebSocket, { WebSocketServer } from 'ws';
import createWSServer from '../../ws-server.js';

// Mock pour éviter l'erreur de réassignation de NODE_ENV
jest.mock('process', () => ({
  ...process,
  env: {
    ...process.env,
    NODE_ENV: 'test'
  }
}));

describe('WebSocket Server', () => {
  let wss: WebSocketServer;
  const PORT = 5001;

  beforeAll(() => {
    wss = createWSServer(PORT);
  });

  afterAll((done) => {
    wss.close(() => done());
  });

  test('broadcast join message to other clients', (done) => {
    const clientA = new WebSocket(`ws://localhost:${PORT}`);
    const clientB = new WebSocket(`ws://localhost:${PORT}`);
    let openCount = 0;
    function trySend() {
      if (openCount === 2) {
        clientA.send(JSON.stringify({ type: 'join', name: 'Alice' }));
      }
    }
    clientA.on('open', () => { openCount++; trySend(); });
    clientB.on('open', () => { openCount++; trySend(); });
    clientB.on('message', (data) => {
      const msg = JSON.parse(data.toString());
      if (msg.type === 'join') {
        expect(msg).toEqual({ type: 'join', name: 'Alice' });
        clientA.close();
        clientB.close();
        done();
      }
    });
  });

  test('broadcast game state with player colors after join', (done) => {
    const clientA = new WebSocket(`ws://localhost:${PORT}`);
    
    clientA.on('open', () => {
      clientA.send(JSON.stringify({ type: 'join', name: 'Charlie' }));
    });
    
    clientA.on('message', (data) => {
      const msg = JSON.parse(data.toString());
      if (msg.type === 'game_state') {
        expect(msg.players).toBeDefined();
        expect(Array.isArray(msg.players)).toBe(true);
        
        // Vérifier que le nouveau joueur a une couleur assignée
        const player = msg.players.find((p: { name: string }) => p.name === 'Charlie');
        expect(player).toBeDefined();
        expect(player.color).toBeDefined();
        
        clientA.close();
        done();
      }
    });
  });

  test('broadcast move message to other clients', (done) => {
    const clientA = new WebSocket(`ws://localhost:${PORT}`);
    const clientB = new WebSocket(`ws://localhost:${PORT}`);
    let joinCompleted = false;
    
    const setupTest = () => {
      if (joinCompleted) {
        clientA.send(JSON.stringify({ 
          type: 'move', 
          position: 5, 
          name: 'David' 
        }));
      }
    };
    
    // Enregistrer le joueur A
    clientA.on('open', () => {
      clientA.send(JSON.stringify({ type: 'join', name: 'David' }));
    });
    
    // Enregistrer le joueur B et tester le mouvement
    clientB.on('open', () => {
      clientB.send(JSON.stringify({ type: 'join', name: 'Emma' }));
    });
    
    // Attendre la confirmation de l'état du jeu avant de tester le mouvement
    clientA.on('message', (data) => {
      const msg = JSON.parse(data.toString());
      if (msg.type === 'game_state' && !joinCompleted) {
        joinCompleted = true;
        setupTest();
      }
    });
    
    // Vérifier que le client B reçoit le message de mouvement
    clientB.on('message', (data) => {
      const msg = JSON.parse(data.toString());
      if (msg.type === 'move') {
        expect(msg.position).toEqual(5);
        clientA.close();
        clientB.close();
        done();
      }
    });
  });
});