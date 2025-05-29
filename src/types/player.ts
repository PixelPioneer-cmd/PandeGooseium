export interface Player {
  id: string;
  name: string;
  position: number;
  color: string;
  isConnected?: boolean;
}

export interface ConnectedPlayer extends Player {
  socketId?: string;
  isOnline: boolean;
}

export interface PlayerPosition {
  x: number;
  y: number;
  z?: number;
}

export interface AnimatedPlayerProps {
  currentPosition: number;
  targetPosition: number;
  color: string;
  offset: number;
  spacing: number;
  getHeight: (num: number) => number;
  spiralPositions: Array<{row: number; col: number}>;
}
