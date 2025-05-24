import { renderHook, act } from '@testing-library/react';
import { useWebSocket } from '../hooks/useWebSocket';
import * as socketIO from 'socket.io-client';

// Mock pour socket.io-client
jest.mock('socket.io-client', () => {
  const mockSocket = {
    on: jest.fn(),
    emit: jest.fn(),
    disconnect: jest.fn(),
    connected: true,
    id: 'mock-socket-id-12345'
  };
  return {
    io: jest.fn(() => mockSocket)
  };
});

// Mock pour process.env
const originalEnv = process.env;
beforeEach(() => {
  jest.resetModules();
  process.env = { ...originalEnv, NEXT_PUBLIC_WS_SERVER: 'ws://localhost:5001' };
});

afterEach(() => {
  process.env = originalEnv;
});

describe('useWebSocket hook', () => {
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

  it('initializes Socket.IO connection in multiplayer mode', () => {
    const ioMock = (socketIO.io as jest.Mock);
    
    // Rendu du hook en mode multijoueur
    renderHook(() => useWebSocket(true, 'TestPlayer', 1));
    
    // Vérifier que io() a été appelé avec les bons paramètres
    expect(ioMock).toHaveBeenCalledWith('http://localhost:5001', expect.any(Object));
  });

  it('sends chat messages through Socket.IO', () => {
    const ioMock = (socketIO.io as jest.Mock);
    const mockSocket = ioMock();
    
    const { result } = renderHook(() => useWebSocket(true, 'ChatTester', 1));
    
    // Simuler que le socket est connecté et que le joueur a un ID
    Object.defineProperty(mockSocket, 'connected', { value: true });
    
    // Appeler la fonction sendChat
    act(() => {
      result.current.sendChat('Test message');
    });
    
    // Vérifier que emit a été appelé avec les bons paramètres
    expect(mockSocket.emit).toHaveBeenCalledWith('chat', expect.objectContaining({
      type: 'chat',
      message: 'Test message',
      name: 'ChatTester'
    }));
  });
});
