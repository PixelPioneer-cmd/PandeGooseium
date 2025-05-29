export interface BoardPosition {
  row: number;
  col: number;
}

export interface Player {
  id: string;
  position: number;
  color?: string;
  name?: string;
}

export interface ConnectedPlayer {
  id: string;
  name?: string;
  color?: string;
}

export interface BoardProps {
  localPlayer: Player | null;
  remotePlayers: Player[];
  onRoll?: () => void;
  lastRoll?: number;
  disabled?: boolean;
  isMulti: boolean;
  toggleMode: () => void;
  is3D: boolean;
  toggleView: () => void;
  isMyTurn?: boolean;
  currentTurnPlayerId?: string | null;
  connectedPlayers?: ConnectedPlayer[];
  feedback?: string;
  position?: number;
  showChat?: boolean;
}

export interface SpecialSquareType {
  id: string;
  positions: Set<number>;
  name: string;
  icon: string;
  color: string;
  effect?: string;
}

export interface BoardSquare {
  number: number;
  position: BoardPosition;
  isSpecial: boolean;
  specialType?: string;
  height: number;
  color: string;
}

export interface FeedbackDisplayProps {
  feedback?: string;
  position?: number;
  is2D?: boolean;
}
