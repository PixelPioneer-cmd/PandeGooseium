import React from 'react';
import { BoardProps, CSSModuleClasses } from './BoardTypes';
import { ControlsBar } from './ControlsBar';
import { Board2DSquare } from './Board2DSquare';
import { usePlayerPositions } from './usePlayerPositions';

interface Board2DProps extends BoardProps {
  spiralPositions: Array<{ row: number; col: number }>;
  styles2D: CSSModuleClasses;
  FeedbackDisplay: React.ComponentType<{ feedback?: string; position?: number; is2D?: boolean }>;
}

export const Board2D: React.FC<Board2DProps> = ({
  localPlayer,
  remotePlayers,
  onRoll,
  lastRoll,
  disabled,
  isMulti,
  toggleMode,
  is3D,
  toggleView,
  isMyTurn,
  currentTurnPlayerId,
  connectedPlayers,
  feedback,
  position,
  showChat,
  spiralPositions,
  styles2D,
  FeedbackDisplay
}) => {
  usePlayerPositions(localPlayer, remotePlayers);

  return (
    <div className={`${styles2D.boardContainer} ${showChat ? styles2D.withChat : ''}`}>
      <div className={styles2D.board2DWrapper}>
        <ControlsBar
          gameTitle="L'Oie des Enfers"
          isMulti={isMulti}
          isMyTurn={isMyTurn}
          currentTurnPlayerId={currentTurnPlayerId}
          connectedPlayers={connectedPlayers}
          toggleMode={toggleMode}
          is3D={is3D}
          toggleView={toggleView}
          onRoll={onRoll}
          lastRoll={lastRoll}
          disabled={disabled}
          styles={styles2D}
        />

        <div className={styles2D.boardGrid}>
          <div className={styles2D.spiralBoard}>
            {spiralPositions.map((pos, i) => {
              const num = i + 1;
              return (
                <Board2DSquare
                  key={num}
                  num={num}
                  pos={pos}
                  localPlayer={localPlayer}
                  remotePlayers={remotePlayers}
                  connectedPlayers={connectedPlayers}
                  isMulti={isMulti}
                  styles={styles2D}
                />
              );
            })}
          </div>
        </div>

        <FeedbackDisplay feedback={feedback} position={position} is2D={true} />
      </div>
    </div>
  );
};
