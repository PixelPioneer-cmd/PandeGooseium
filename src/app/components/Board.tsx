import React from 'react';
import styles from './Board.module.css';

// Nouvelle fonction pour générer une spirale compacte 63 cases (sans cases perdues)
function generateSpiralPositions(size: number, total: number) {
  const spiral: {row: number, col: number}[] = [];
  let minRow = 0, maxRow = size-1, minCol = 0, maxCol = size-1;
  let n = 1;
  while (n <= total) {
    for (let c = minCol; c <= maxCol && n <= total; c++) { spiral.push({row: minRow, col: c}); n++; }
    minRow++;
    for (let r = minRow; r <= maxRow && n <= total; r++) { spiral.push({row: r, col: maxCol}); n++; }
    maxCol--;
    for (let c = maxCol; c >= minCol && n <= total; c--) { spiral.push({row: maxRow, col: c}); n++; }
    maxRow--;
    for (let r = maxRow; r >= minRow && n <= total; r--) { spiral.push({row: r, col: minCol}); n++; }
    minCol++;
  }
  return spiral;
}

const spiralPositions = generateSpiralPositions(8, 63);

// Générer une grille 8x8 vide puis placer les cases de la spirale
const grid = Array.from({length: 8}, () => Array(8).fill(null));
spiralPositions.forEach((pos, i) => {
  grid[pos.row][pos.col] = i+1;
});

const specialSquares = {
  oie: [5, 9, 14, 18, 23, 27, 32, 36, 41, 45, 50, 54, 59],
  pont: [6], hotel: [19], puits: [31], labyrinthe: [42], prison: [52], mort: [58]
};

type Player = { position: number };

type BoardProps = {
  localPlayer: Player | null;
  remotePlayer: Player | null;
};

function getSquareType(num: number): string | null {
  if (specialSquares.oie.includes(num)) return 'oie';
  if (specialSquares.pont.includes(num)) return 'pont';
  if (specialSquares.hotel.includes(num)) return 'hotel';
  if (specialSquares.puits.includes(num)) return 'puits';
  if (specialSquares.labyrinthe.includes(num)) return 'labyrinthe';
  if (specialSquares.prison.includes(num)) return 'prison';
  if (specialSquares.mort.includes(num)) return 'mort';
  return null;
}

function getSquareClass(num: number): string {
  const type = getSquareType(num);
  switch (type) {
    case 'oie': return styles.oieSquare;
    case 'pont': return styles.pontSquare;
    case 'hotel': return styles.hotelSquare;
    case 'puits': return styles.puitsSquare;
    case 'labyrinthe': return styles.labyrintheSquare;
    case 'prison': return styles.prisonSquare;
    case 'mort': return styles.mortSquare;
    default:
      if (num <= 9) return styles.redDarkSquare;
      if (num <= 29) return styles.redMidSquare;
      return styles.redLightSquare;
  }
}

export default function Board({ localPlayer, remotePlayer, onRoll, lastRoll, disabled }: BoardProps & {onRoll?: () => void, lastRoll?: number, disabled?: boolean}) {
  const position = localPlayer?.position || 1;
  const remotePosition = remotePlayer?.position;

  return (
    <div className={styles.boardContainer}>
      {/* Bouton lancer le dé (optionnel) */}
      {onRoll && (
        <div style={{display:'flex', justifyContent:'center', marginBottom: '1rem'}}>
          <button onClick={onRoll} disabled={disabled} style={{padding:'0.7em 1.5em', fontWeight:'bold', fontSize:'1.1em', borderRadius:8, background:'#FFD700', color:'#222', border:'none', boxShadow:'0 2px 8px #0003', cursor: disabled?'not-allowed':'pointer', opacity: disabled?0.6:1}}>
            {lastRoll ? `Dernier dé : ${lastRoll}` : 'Lancer le dé'}
          </button>
        </div>
      )}
      <div className={styles.spiralBoard}>
        {grid.map((row, rowIdx) => row.map((num, colIdx) => (
          num ? (
            <div key={`cell-${num}-${rowIdx}-${colIdx}`} className={`${styles.spiralSquare} ${getSquareClass(num)} ${getSquareType(num) ? styles.specialSquare : ''}`}
              style={{position:'relative'}}>
              <div className={styles.squareFront}>
                <span>{num}</span>
                {/* Icône case spéciale */}
                {getSquareType(num) && (
                  <span style={{fontSize:'1.2em',marginLeft:4}}>
                    {getSquareType(num)==='oie' && '🪿'}
                    {getSquareType(num)==='pont' && '🌉'}
                    {getSquareType(num)==='hotel' && '🏨'}
                    {getSquareType(num)==='puits' && '⛲'}
                    {getSquareType(num)==='labyrinthe' && '🧩'}
                    {getSquareType(num)==='prison' && '🔒'}
                    {getSquareType(num)==='mort' && '💀'}
                  </span>
                )}
              </div>
              {/* Pion local */}
              {position === num && (
                <div className={styles.gamePiece} style={{background: '#FFD700', borderRadius:'30% 30% 50% 50%/40% 40% 60% 60%', boxShadow:'0 4px 12px #0008'}}></div>
              )}
              {/* Pion distant */}
              {remotePosition === num && (
                <div className={styles.gamePiece} style={{background: '#3B82F6', borderRadius:'30% 30% 50% 50%/40% 40% 60% 60%', boxShadow:'0 4px 12px #0008'}}></div>
              )}
            </div>
          ) : (
            <div key={`empty-${rowIdx}-${colIdx}`} className={styles.emptySquare}></div>
          )
        )))}
      </div>
    </div>
  );
}