// Types for the board components
export interface BoardProps {
  localPlayer?: { id?: string; position: number; color?: string; name?: string };
  remotePlayers: Array<{ id: string; position: number; color?: string; name?: string }>;
  onRoll?: () => void;
  lastRoll?: number;
  disabled?: boolean;
  isMulti: boolean;
  toggleMode: () => void;
  is3D: boolean;
  toggleView: () => void;
  isMyTurn: boolean;
  currentTurnPlayerId?: string | null;
  connectedPlayers?: Array<{ id: string; name?: string; color?: string }>;
  feedback?: string;
  position?: number;
  showChat: boolean;
}

export interface CSSModuleClasses {
  readonly [key: string]: string;
}

export interface Player {
  id: string;
  position: number;
  color?: string;
  name?: string;
}

export interface LocalPlayer {
  id?: string;
  position: number;
  color?: string;
  name?: string;
}

export interface SpiralPosition {
  row: number;
  col: number;
}

export interface PlayerAtPosition {
  key: string;
  color: string;
  position: number;
  isLocal: boolean;
  id?: string;
  offset?: number;
  name?: string;
}

export interface AnimatedPlayer2DProps {
  currentPosition: number;
  targetPosition: number;
  color: string;
  offset: number;
  spacing: number;
  getHeight: (num: number) => number;
  spiralPositions: Array<{ row: number; col: number }>;
}
