import React from 'react';
import { CSSModuleClasses } from './BoardTypes';

interface ControlsBarProps {
  gameTitle: string;
  isMulti: boolean;
  isMyTurn: boolean;
  currentTurnPlayerId?: string | null;
  connectedPlayers?: Array<{ id: string; name?: string }>;
  toggleMode: () => void;
  is3D: boolean;
  toggleView: () => void;
  onRoll?: () => void;
  lastRoll?: number;
  disabled?: boolean;
  styles: CSSModuleClasses;
}

export const ControlsBar: React.FC<ControlsBarProps> = ({
  gameTitle,
  isMulti,
  isMyTurn,
  currentTurnPlayerId,
  connectedPlayers,
  toggleMode,
  is3D,
  toggleView,
  onRoll,
  lastRoll,
  disabled,
  styles
}) => {
  return (
    <div className={styles.controlsBar}>
      <h2 className={styles.gameTitle}>{gameTitle}</h2>
      {isMulti && (
        <div className={styles.turnStatus}>
          <span className={`${styles.turnIndicator} ${isMyTurn ? styles.myTurn : styles.waitingTurn}`}>
            {isMyTurn 
              ? "🟢 À votre tour" 
              : `⏳ Tour de ${connectedPlayers?.find(p => p.id === currentTurnPlayerId)?.name || '...'}`
            }
          </span>
        </div>
      )}
      <div className={styles.buttonGroup}>
        <button onClick={toggleMode} className={styles.controlButton}>
          Mode: {isMulti ? 'Multi' : 'Solo'}
        </button>
        <button onClick={toggleView} className={styles.controlButton}>
          Vue: {is3D ? '3D' : '2D'}
        </button>
        {onRoll && (
          <button className={styles.rollButton} onClick={onRoll} disabled={disabled}>
            {lastRoll ? `🎲 ${lastRoll}` : '🎲 Lancer'}
          </button>
        )}
      </div>
    </div>
  );
};
