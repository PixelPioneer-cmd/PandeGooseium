// Test script pour vérifier la logique de détection d'URL WebSocket

// Simuler différents environnements
const testEnvironments = [
  {
    name: "Développement local",
    window: {
      location: {
        protocol: 'http:',
        hostname: 'localhost',
        port: '3000'
      }
    },
    env: {},
    expected: 'http://localhost:4000'
  },
  {
    name: "Production Render",
    window: {
      location: {
        protocol: 'https:',
        hostname: 'pandegooseium.onrender.com',
        port: ''
      }
    },
    env: {},
    expected: 'https://pandegooseium.onrender.com'
  },
  {
    name: "Avec variable d'environnement explicite",
    window: {
      location: {
        protocol: 'https:',
        hostname: 'pandegooseium.onrender.com',
        port: ''
      }
    },
    env: { NEXT_PUBLIC_WS_SERVER: 'wss://custom-server.com' },
    expected: 'wss://custom-server.com'
  }
];

// Fonction de test basée sur notre logique
function getWebSocketURL(windowObj, processEnv) {
  // Si une URL explicite est fournie via .env, l'utiliser
  if (processEnv.NEXT_PUBLIC_WS_SERVER) {
    return processEnv.NEXT_PUBLIC_WS_SERVER;
  }
  
  // En production, utiliser la même URL que l'application web
  if (windowObj) {
    const { protocol, hostname } = windowObj.location;
    
    // Sur Render, l'app web et le WebSocket partagent le même port
    if (hostname.includes('onrender.com')) {
      const wsProtocol = protocol === 'https:' ? 'https:' : 'http:';
      return `${wsProtocol}//${hostname}`;
    }
  }
  
  // Fallback pour le développement local
  return 'http://localhost:4000';
}

// Exécuter les tests
console.log('🧪 Test de la logique de détection d\'URL WebSocket\n');

testEnvironments.forEach((env, index) => {
  const result = getWebSocketURL(env.window, env.env);
  const success = result === env.expected;
  
  console.log(`${index + 1}. ${env.name}`);
  console.log(`   Attendu: ${env.expected}`);
  console.log(`   Obtenu:  ${result}`);
  console.log(`   ✅ ${success ? 'RÉUSSI' : '❌ ÉCHEC'}\n`);
});

console.log('🎯 Tous les tests de logique WebSocket sont terminés !');
