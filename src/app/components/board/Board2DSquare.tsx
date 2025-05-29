import React from 'react';
import { SpiralPosition, LocalPlayer, Player, CSSModuleClasses } from './BoardTypes';
import { getSquareClass, getSpecialIcon } from './SpecialSquares';
import { getPlayerColor, getPlayerName } from './PlayerUtils';

interface Board2DSquareProps {
  num: number;
  pos: SpiralPosition;
  localPlayer?: LocalPlayer;
  remotePlayers: Player[];
  connectedPlayers?: Array<{ id: string; name?: string; color?: string }>;
  isMulti: boolean;
  styles: CSSModuleClasses;
}

export const Board2DSquare: React.FC<Board2DSquareProps> = ({
  num,
  pos,
  localPlayer,
  remotePlayers,
  connectedPlayers,
  isMulti,
  styles
}) => {
  const squareClass = getSquareClass(num);
  const isCurrentPlayerHere = localPlayer?.position === num;
  const remotePlayersHere = remotePlayers.filter(p => p.position === num);
  const hasPlayers = isCurrentPlayerHere || remotePlayersHere.length > 0;
  const specialIcon = getSpecialIcon(num);

  return (
    <div
      className={`${styles.boardSquare} ${squareClass ? styles[squareClass] : ''} ${hasPlayers ? styles.hotSquare : ''}`}
      style={{
        gridColumn: pos.col + 1,
        gridRow: pos.row + 1,
      }}
    >
      <div className={styles.squareFront}>
        {num}
        {specialIcon && <span className={styles.specialIcon}>{specialIcon}</span>}
      </div>

      {/* Local player piece */}
      {isCurrentPlayerHere && (
        <div 
          className={`${styles.gamePiece} ${styles.localTower}`}
          style={{ 
            marginLeft: remotePlayersHere.length > 0 ? '-0.5rem' : undefined 
          }}
        >
          {isMulti && connectedPlayers && localPlayer?.id ? (
            <span
              className={styles.pieceLabel}
              style={{
                borderColor: localPlayer.color,
                boxShadow: `0 0 8px 2px ${localPlayer.color}66, 0 1px 8px 0 #000a`,
                textShadow: `0 0 8px ${localPlayer.color}, 0 0 2px #fff, 0 2px 8px #000, 0 0 1px ${localPlayer.color}, 0 0 16px ${localPlayer.color}`
              }}
            >
              {getPlayerName(localPlayer, connectedPlayers, 'J1')}
            </span>
          ) : 'J1'}
        </div>
      )}

      {/* Remote players pieces */}
      {remotePlayersHere.map((player, idx) => {
        const color = getPlayerColor(player, connectedPlayers, idx);
        const label = getPlayerName(player, connectedPlayers, `J${idx + 2}`);

        return (
          <div 
            key={player.id}
            className={`${styles.gamePiece} ${styles.remoteTower}`}
            style={{ 
              marginLeft: `${0.5 + idx * 0.6}rem`,
              marginTop: `${-1 - idx * 0.1}rem`
            }}
          >
            {isMulti && connectedPlayers ? (
              <span
                className={styles.pieceLabel}
                style={{
                  borderColor: color,
                  boxShadow: `0 0 8px 2px ${color}66, 0 1px 8px 0 #000a`,
                  textShadow: `0 0 8px ${color}, 0 0 2px #fff, 0 2px 8px #000, 0 0 1px ${color}, 0 0 16px ${color}`
                }}
              >
                {label}
              </span>
            ) : label}
          </div>
        );
      })}
    </div>
  );
};
