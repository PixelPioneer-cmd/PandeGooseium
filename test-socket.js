// Test file to verify Socket.IO connection
import { io } from 'socket.io-client';

const socket = io('http://localhost:4000', {
  transports: ['websocket', 'polling'],
  autoConnect: true
});

socket.on('connect', () => {
  console.log('✅ Socket.IO connection successful!');
  console.log('Socket ID:', socket.id);
  console.log('Transport:', socket.io.engine.transport.name);
  
  // Test joining the game
  socket.emit('join', {
    type: 'join',
    name: 'TestPlayer',
    position: 1
  });
});

socket.on('connect_error', (error) => {
  console.error('❌ Connection failed:', error);
});

socket.on('game_state', (data) => {
  console.log('📦 Received game_state:', data);
});

socket.on('error', (error) => {
  console.error('❌ Socket error:', error);
});

// Clean disconnect after 5 seconds
setTimeout(() => {
  socket.disconnect();
  console.log('🔌 Test completed, disconnected');
  process.exit(0);
}, 5000);
