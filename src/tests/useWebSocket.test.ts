import { renderHook } from '@testing-library/react-hooks';
import { useWebSocket } from '../hooks/useWebSocket';

describe('useWebSocket hook', () => {
  it('sets local player in solo mode', () => {
    const { result } = renderHook(() => useWebSocket(false, 'Solo', 1));
    expect(result.current.localPlayer).toEqual({ id: 'local', name: 'Solo', position: 1, color: '#FFD700' });
    expect(result.current.isMyTurn).toBe(true);
  });

  it('initial connectedPlayers is empty', () => {
    const { result } = renderHook(() => useWebSocket(false, 'Solo', 1));
    expect(result.current.connectedPlayers).toEqual([]);
  });
});
