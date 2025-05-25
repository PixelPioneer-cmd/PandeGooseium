// Test automatisé pour reproduire le problème des joueurs invisibles
const { io } = require('socket.io-client');

async function testMultiplayerVisibility() {
  console.log('🧪 Test de visibilité des joueurs multijoueurs');
  console.log('=====================================\n');

  // Configuration
  const WS_URL = 'http://localhost:4000';
  const players = [
    { name: 'TestPlayer1', expectedName: 'TestPlayer1' },
    { name: 'TestPlayer2', expectedName: 'TestPlayer2' }
  ];

  const sockets = [];
  const gameStates = [];

  try {
    // Créer les connexions
    for (let i = 0; i < players.length; i++) {
      const player = players[i];
      console.log(`🔌 Connexion du joueur ${player.name}...`);
      
      const socket = io(WS_URL, {
        transports: ['websocket', 'polling'],
        forceNew: true
      });

      sockets.push(socket);

      // Promesse pour attendre la connexion
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error(`Timeout connexion ${player.name}`));
        }, 5000);

        socket.on('connect', () => {
          console.log(`✅ ${player.name} connecté (ID: ${socket.id})`);
          clearTimeout(timeout);
          resolve();
        });

        socket.on('connect_error', (error) => {
          console.error(`❌ Erreur connexion ${player.name}:`, error);
          clearTimeout(timeout);
          reject(error);
        });
      });

      // Écouter les game_state pour ce joueur
      socket.on('game_state', (data) => {
        console.log(`📊 ${player.name} reçoit game_state:`, {
          players: data.players.map(p => ({ id: p.id, name: p.name, position: p.position })),
          currentTurn: data.currentTurnPlayerId
        });
        
        gameStates[i] = data;
        
        // Vérifier si ce joueur se voit dans la liste
        const myPlayer = data.players.find(p => p.name === player.name);
        if (myPlayer) {
          console.log(`✅ ${player.name} se trouve dans la liste des joueurs`);
        } else {
          console.log(`❌ ${player.name} ne se trouve PAS dans la liste des joueurs`);
          console.log(`   Nom cherché: "${player.name}"`);
          console.log(`   Noms disponibles:`, data.players.map(p => `"${p.name}"`));
        }
      });

      // Rejoindre la partie
      console.log(`🎮 ${player.name} rejoint la partie...`);
      socket.emit('join', {
        type: 'join',
        name: player.name,
        position: 1
      });

      // Attendre un peu avant le joueur suivant
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Attendre que tous les game_state soient reçus
    console.log('\n⏳ Attente des mises à jour game_state...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Analyse des résultats
    console.log('\n📈 ANALYSE DES RÉSULTATS');
    console.log('========================');
    
    for (let i = 0; i < players.length; i++) {
      const player = players[i];
      const gameState = gameStates[i];
      
      console.log(`\n👤 ${player.name}:`);
      if (gameState) {
        console.log(`   - Reçoit game_state: ✅`);
        console.log(`   - Nombre de joueurs vus: ${gameState.players.length}`);
        console.log(`   - Joueurs vus:`, gameState.players.map(p => p.name));
        
        const canSeeHimself = gameState.players.some(p => p.name === player.name);
        console.log(`   - Se voit lui-même: ${canSeeHimself ? '✅' : '❌'}`);
        
        const canSeeOthers = gameState.players.filter(p => p.name !== player.name).length > 0;
        console.log(`   - Voit les autres: ${canSeeOthers ? '✅' : '❌'}`);
      } else {
        console.log(`   - Reçoit game_state: ❌`);
      }
    }

    // Test de visibilité croisée
    console.log('\n🔄 TEST DE VISIBILITÉ CROISÉE');
    console.log('=============================');
    
    if (gameStates[0] && gameStates[1]) {
      const player1CanSeePlayer2 = gameStates[0].players.some(p => p.name === players[1].name);
      const player2CanSeePlayer1 = gameStates[1].players.some(p => p.name === players[0].name);
      
      console.log(`${players[0].name} voit ${players[1].name}: ${player1CanSeePlayer2 ? '✅' : '❌'}`);
      console.log(`${players[1].name} voit ${players[0].name}: ${player2CanSeePlayer1 ? '✅' : '❌'}`);
      
      if (player1CanSeePlayer2 && player2CanSeePlayer1) {
        console.log('\n🎉 SUCCÈS: Les joueurs se voient mutuellement!');
      } else {
        console.log('\n❌ ÉCHEC: Les joueurs ne se voient pas mutuellement');
      }
    }

  } catch (error) {
    console.error('❌ Erreur durant le test:', error);
  } finally {
    // Nettoyer les connexions
    console.log('\n🧹 Nettoyage des connexions...');
    sockets.forEach(socket => {
      if (socket.connected) {
        socket.disconnect();
      }
    });
  }
}

// Exécuter le test
if (require.main === module) {
  testMultiplayerVisibility().then(() => {
    console.log('\n✅ Test terminé');
    process.exit(0);
  }).catch((error) => {
    console.error('❌ Test échoué:', error);
    process.exit(1);
  });
}

module.exports = { testMultiplayerVisibility };
