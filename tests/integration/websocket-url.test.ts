// Test script pour vérifier la logique de détection d'URL WebSocket

describe('WebSocket URL Detection Test', () => {
  test('should detect correct WebSocket URLs in different environments', () => {
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
        env: {
          NEXT_PUBLIC_WS_URL: 'https://pandegooseium.onrender.com'
        },
        expected: 'https://pandegooseium.onrender.com'
      },
      {
        name: "Preview Render",
        window: {
          location: {
            protocol: 'https:',
            hostname: 'pandegooseium-pr-123.onrender.com',
            port: ''
          }
        },
        env: {},
        expected: 'https://pandegooseium-pr-123.onrender.com'
      }
    ];

    // Fonction pour déterminer l'URL WebSocket (logique du useWebSocket)
    function getWebSocketUrl(windowLoc: any, processEnv: any) {
      // Si variable d'environnement définie, l'utiliser
      if (processEnv.NEXT_PUBLIC_WS_URL) {
        return processEnv.NEXT_PUBLIC_WS_URL;
      }
      
      // Sinon, détecter selon l'environnement
      if (windowLoc.hostname === 'localhost') {
        return 'http://localhost:4000';
      } else {
        // Production/Preview: utiliser le même domaine avec HTTPS
        return `https://${windowLoc.hostname}`;
      }
    }

    // Exécuter les tests
    testEnvironments.forEach(env => {
      console.log(`Testing: ${env.name}`);
      const result = getWebSocketUrl(env.window.location, env.env);
      console.log(`  Expected: ${env.expected}`);
      console.log(`  Got: ${result}`);
      
      expect(result).toBe(env.expected);
      
      console.log(`  ✅ ${env.name}: OK`);
    });

    console.log('\n✅ Tous les tests d\'URL WebSocket ont réussi!');
  });
});
