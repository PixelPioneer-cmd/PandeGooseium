import { renderHook, act } from '@testing-library/react';
import { useWebSocket } from '../../src/hooks/useWebSocket';

// Définir un type explicite pour io
interface MockSocket {
  on: (event: string, callback: (...args: unknown[]) => void) => void;
  emit: (event: string, ...args: unknown[]) => void;
  disconnect: () => void;
  connected: boolean;
  id: string;
}

// Ajouter une déclaration de type pour window.io
declare global {
  interface Window {
    io: () => MockSocket;
  }
}

// Test simple pour useWebSocket sans mocking avancé
describe('useWebSocket hook', () => {
  // Mock simple pour éviter les erreurs réseau
  beforeAll(() => {
    // Mock basique de io si pas déjà défini
    if (typeof window !== 'undefined') {
      window.io = (): MockSocket => ({
        on: () => {},
        emit: () => {},
        disconnect: () => {},
        connected: false,
        id: 'test'
      });
    }
  });

  it('sets local player in solo mode', () => {
    const { result } = renderHook(() => useWebSocket(false, 'Solo', 1));
    
    expect(result.current.localPlayer).toEqual({
      id: 'local', 
      name: 'Solo', 
      position: 1, 
      color: '#FFD700'
    });
    expect(result.current.isMyTurn).toBe(true);
    expect(result.current.connectedPlayers).toEqual([]);
  });

  it('provides chat function in multiplayer mode', () => {
    const { result } = renderHook(() => useWebSocket(true, 'TestPlayer', 1));
    
    // Vérifier que les fonctions de base existent
    expect(result.current.localPlayer).toBeDefined();
    expect(typeof result.current.sendChat).toBe('function');
    expect(Array.isArray(result.current.connectedPlayers)).toBe(true);
  });

  it('handles chat messages without errors', () => {
    const { result } = renderHook(() => useWebSocket(true, 'ChatTester', 1));
    
    // Test simplifié - vérifier que sendChat ne plante pas
    expect(() => {
      act(() => {
        result.current.sendChat('Test message');
      });
    }).not.toThrow();
  });
});
