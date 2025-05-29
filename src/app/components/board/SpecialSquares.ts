// Special squares configuration and utilities
export const specialSquares = {
  oie: new Set([5, 9, 14, 18, 23, 27, 32, 36, 41, 45, 50, 54, 59]),
  pont: new Set([6, 12]),
  hotel: new Set([19, 31, 42, 52]),
  puits: new Set([31]),
  labyrinthe: new Set([42]),
  prison: new Set([52]),
  mort: new Set([58])
};

export const isSpecial = (num: number): boolean => {
  return Object.values(specialSquares).some(set => set.has(num));
};

// Color mapping for special squares (for CSS class names in 2D mode)
export const getSquareClass = (num: number): string => {
  if (specialSquares.oie.has(num)) return 'oieSquare';
  if (specialSquares.pont.has(num)) return 'pontSquare';
  if (specialSquares.hotel.has(num)) return 'hotelSquare';
  if (specialSquares.puits.has(num)) return 'puitsSquare';
  if (specialSquares.labyrinthe.has(num)) return 'labyrintheSquare';
  if (specialSquares.prison.has(num)) return 'prisonSquare';
  if (specialSquares.mort.has(num)) return 'mortSquare';
  return '';
};

// Color mapping for special squares (for 3D mode)
export const getSquareColor = (num: number): string => {
  if (specialSquares.oie.has(num)) return '#FFD700';
  if (specialSquares.pont.has(num)) return '#8B4513';
  if (specialSquares.hotel.has(num)) return '#FF6B6B';
  if (specialSquares.puits.has(num)) return '#4ECDC4';
  if (specialSquares.labyrinthe.has(num)) return '#9B59B6';
  if (specialSquares.prison.has(num)) return '#95A5A6';
  if (specialSquares.mort.has(num)) return '#2C3E50';
  return '#8b4513';
};

// Get special icon for a square
export const getSpecialIcon = (num: number): string => {
  if (specialSquares.oie.has(num)) return '🪿';
  if (specialSquares.pont.has(num)) return '🌉';
  if (specialSquares.hotel.has(num)) return '🏨';
  if (specialSquares.puits.has(num)) return '🏚️';
  if (specialSquares.labyrinthe.has(num)) return '🌀';
  if (specialSquares.prison.has(num)) return '⛓️';
  if (specialSquares.mort.has(num)) return '💀';
  return '';
};
