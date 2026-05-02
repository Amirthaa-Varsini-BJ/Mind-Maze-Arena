
import { Grid, TileType, Position, Cell, GameState, PlayerClassification } from './types';

export const GRID_SIZE = 12;
export const MAX_CHANCE_WALL = 0.25;

export const createEmptyGrid = (size: number): Grid => {
  return Array.from({ length: size }, (_, y) =>
    Array.from({ length: size }, (_, x) => ({
      type: 'EMPTY',
      id: `${x}-${y}`,
    }))
  );
};

export const getRandomPosition = (size: number): Position => {
  return {
    x: Math.floor(Math.random() * size),
    y: Math.floor(Math.random() * size),
  };
};

export const generateMaze = (level: number): Grid => {
  const grid = createEmptyGrid(GRID_SIZE);
  
  // Basic random walls with level difficulty
  const wallChance = Math.min(0.22 + level * 0.03, 0.4);
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      // Avoid blocking start and end immediately
      if ((x < 2 && y < 2) || (x > GRID_SIZE - 3 && y > GRID_SIZE - 3)) continue;
      
      if (Math.random() < wallChance) {
        grid[y][x].type = 'WALL';
      }
    }
  }

  // Ensure start is empty
  grid[0][0].type = 'EMPTY';
  
  // Place Exit
  grid[GRID_SIZE - 1][GRID_SIZE - 1].type = 'EXIT';
  
  // Add some traps if level > 1
  if (level >= 2) {
    for (let i = 0; i < 3 + level; i++) {
        const x = Math.floor(Math.random() * GRID_SIZE);
        const y = Math.floor(Math.random() * GRID_SIZE);
        if (grid[y][x].type === 'EMPTY' && (x !== 0 || y !== 0) && (x !== GRID_SIZE - 1 || y !== GRID_SIZE - 1)) {
            grid[y][x].type = 'TRAP';
        }
    }
  }

  // Add Teleport tiles if level > 3
  if (level >= 3) {
      for (let i = 0; i < level - 2; i++) {
          const x = Math.floor(Math.random() * GRID_SIZE);
          const y = Math.floor(Math.random() * GRID_SIZE);
          if (grid[y][x].type === 'EMPTY' && (x !== 0 || y !== 0)) {
              grid[y][x].type = 'TELEPORT';
          }
      }
  }

  // Add Illusion tiles if level >= 4
  if (level >= 4) {
      for (let i = 0; i < level; i++) {
          const x = Math.floor(Math.random() * GRID_SIZE);
          const y = Math.floor(Math.random() * GRID_SIZE);
          if (grid[y][x].type === 'EMPTY' && (x !== 0 || y !== 0) && (x !== GRID_SIZE - 1 || y !== GRID_SIZE - 1)) {
              grid[y][x].type = 'ILLUSION';
          }
      }
  }

  return grid;
};

export const calculateClassification = (history: any[]): PlayerClassification => {
    if (history.length < 5) return 'NEUTRAL';
    
    // Check for repetitive moves or cautious behavior
    // For simplicity, we define:
    // Aggressive: Short intervals, direct paths (not easily tracked without goal comparison)
    // Defensive: Stays near borders or retreats
    // Explorer: High variety in directions
    
    const directions = history.map(h => h.direction);
    const uniqueDirs = new Set(directions).size;
    
    if (uniqueDirs >= 3) return 'EXPLORER';
    if (uniqueDirs <= 2) return 'AGGRESSIVE'; // Pushing in one or two directions mostly
    
    return 'DEFENSIVE';
};

export const getNextPosition = (pos: Position, dir: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT'): Position => {
    switch (dir) {
        case 'UP': return { ...pos, y: Math.max(0, pos.y - 1) };
        case 'DOWN': return { ...pos, y: Math.min(GRID_SIZE - 1, pos.y + 1) };
        case 'LEFT': return { ...pos, x: Math.max(0, pos.x - 1) };
        case 'RIGHT': return { ...pos, x: Math.min(GRID_SIZE - 1, pos.x + 1) };
    }
};

export const canMoveTo = (grid: Grid, pos: Position): boolean => {
    const tile = grid[pos.y][pos.x];
    return tile.type !== 'WALL';
};
