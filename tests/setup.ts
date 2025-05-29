// Jest setup for global configuration
import '@testing-library/jest-dom';

// Mock global WebSocket pour éviter les erreurs de connexion
class MockWebSocket {
  url: string;
  readyState = 1;
  
  constructor(url: string) {
    this.url = url;
  }
  
  close = () => {};
  send = () => {};
  addEventListener = () => {};
  removeEventListener = () => {};
}

(global as any).WebSocket = MockWebSocket;

// Mock pour les variables d'environnement
if (!process.env.NEXT_PUBLIC_WS_SERVER) {
  process.env.NEXT_PUBLIC_WS_SERVER = 'ws://localhost:4000';
}

// Configuration globale pour les tests React/DOM
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => {},
    }),
  });
}
