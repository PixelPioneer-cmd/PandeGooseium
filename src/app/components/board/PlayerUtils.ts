import { Player, LocalPlayer, PlayerAtPosition } from './BoardTypes';

export const getPlayerColor = (
  player: Player | LocalPlayer,
  connectedPlayers?: Array<{ id: string; color?: string }>,
  defaultIndex: number = 0
): string => {
  if (player.color) return player.color;
  
  if (connectedPlayers && player.id) {
    const found = connectedPlayers.find(p => p.id === player.id);
    if (found?.color) return found.color;
  }
  
  return `hsl(${(defaultIndex + 1) * 60}, 70%, 50%)`;
};

export const getPlayerName = (
  player: Player | LocalPlayer,
  connectedPlayers?: Array<{ id: string; name?: string }>,
  defaultName: string = 'Player'
): string => {
  if (player.name) {
    return player.name.length > 10 ? player.name.slice(0, 3) + '[...]' : player.name;
  }
  
  if (connectedPlayers && player.id) {
    const found = connectedPlayers.find(p => p.id === player.id);
    if (found?.name) {
      return found.name.length > 10 ? found.name.slice(0, 3) + '[...]' : found.name;
    }
  }
  
  return defaultName;
};

export const getPlayersAtPosition = (
  position: number,
  localPlayer?: LocalPlayer,
  remotePlayers: Player[] = [],
  connectedPlayers?: Array<{ id: string; name?: string; color?: string }>
): PlayerAtPosition[] => {
  const playersAtNum: PlayerAtPosition[] = [];
  
  if (localPlayer?.position === position) {
    playersAtNum.push({
      key: `local-${position}`,
      color: localPlayer.color || '#FFD700',
      position,
      isLocal: true,
      name: getPlayerName(localPlayer, connectedPlayers, 'J1')
    });
  }
  
  remotePlayers.forEach((p, idx) => {
    if (p.position === position) {
      playersAtNum.push({
        key: `remote-${p.id}-${position}`,
        color: getPlayerColor(p, connectedPlayers, idx),
        position,
        isLocal: false,
        id: p.id,
        name: getPlayerName(p, connectedPlayers, `J${idx + 2}`)
      });
    }
  });
  
  // Compute symmetric offsets
  const offsetSpacing = 0.25;
  const count = playersAtNum.length;
  playersAtNum.forEach((p, idx) => {
    p.offset = (idx - (count - 1) / 2) * offsetSpacing;
  });
  
  return playersAtNum;
};
