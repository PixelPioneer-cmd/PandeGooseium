// Test file to simulate multiplayer game with two players
import { io } from 'socket.io-client';

console.log('🎮 Starting multiplayer simulation test...');

// Create two players
const player1 = io('http://localhost:4000', {
  transports: ['websocket', 'polling'],
  autoConnect: true
});

const player2 = io('http://localhost:4000', {
  transports: ['websocket', 'polling'],
  autoConnect: true
});

let player1Connected = false;
let player2Connected = false;

// Player 1 setup
player1.on('connect', () => {
  console.log('👤 Player 1 connected:', player1.id);
  player1Connected = true;
  
  // Join as player 1
  player1.emit('join', {
    type: 'join',
    name: 'Alice',
    position: 1
  });
});

player1.on('game_state', (data) => {
  console.log('👤 Player 1 received game state:', JSON.stringify(data, null, 2));
});

// Player 2 setup
player2.on('connect', () => {
  console.log('👥 Player 2 connected:', player2.id);
  player2Connected = true;
  
  // Join as player 2
  player2.emit('join', {
    type: 'join',
    name: 'Bob',
    position: 1
  });
});

player2.on('game_state', (data) => {
  console.log('👥 Player 2 received game state:', JSON.stringify(data, null, 2));
});

// Test movement after both players connect
setTimeout(() => {
  if (player1Connected && player2Connected) {
    console.log('\n🎲 Testing player movement...');
    
    // Player 1 moves
    player1.emit('move', {
      type: 'move',
      position: 5
    });
    
    setTimeout(() => {
      // Player 2 moves
      player2.emit('move', {
        type: 'move', 
        position: 3
      });
    }, 1000);
  }
}, 2000);

// Clean up after 8 seconds
setTimeout(() => {
  console.log('\n🔌 Test completed, disconnecting...');
  player1.disconnect();
  player2.disconnect();
  process.exit(0);
}, 8000);
