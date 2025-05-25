// Test simple de connexion Socket.IO
import { io } from 'socket.io-client';

console.log('🧪 Test de connexion Socket.IO simple');

const socket = io('http://localhost:4000', { // Retour au port 4000 pour le serveur WebSocket séparé
  transports: ['websocket', 'polling'],
  forceNew: true
});

socket.on('connect', () => {
  console.log('✅ Connecté avec ID:', socket.id);
  
  // Tester le join
  console.log('🎮 Tentative de join avec nom "TestPlayer"...');
  socket.emit('join', {
    type: 'join',
    name: 'TestPlayer',
    position: 1
  });
});

socket.on('game_state', (data) => {
  console.log('📊 game_state reçu:', data);
  
  if (data.players && data.players.length > 0) {
    console.log('👥 Joueurs dans le game_state:');
    data.players.forEach(player => {
      console.log(`  - ID: ${player.id}, Nom: "${player.name}", Position: ${player.position}`);
    });
  }
  
  socket.disconnect();
  process.exit(0);
});

socket.on('connect_error', (error) => {
  console.error('❌ Erreur de connexion:', error);
  process.exit(1);
});

socket.on('joined', (data) => {
  console.log('✅ Joined confirmé:', data);
});

// Timeout de sécurité
setTimeout(() => {
  console.log('⏰ Timeout du test');
  socket.disconnect();
  process.exit(1);
}, 5000);
