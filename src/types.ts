
export type TileType = 'EMPTY' | 'WALL' | 'TRAP' | 'SAFE' | 'TELEPORT' | 'EXIT' | 'ILLUSION';

export interface Position {
  x: number;
  y: number;
}

export interface PlayerStats {
  health: number;
  maxHealth: number;
  energy: number;
  maxEnergy: number;
  totalMoves: number;
  level: number;
}

export interface Cell {
  type: TileType;
  id: string;
}

export type Grid = Cell[][];

export type PlayerClassification = 'DEFENSIVE' | 'AGGRESSIVE' | 'EXPLORER' | 'NEUTRAL';

export interface MovementHistory {
  direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
  x: number;
  y: number;
  timestamp: number;
}

export interface AIState {
  directionFrequency: Record<'UP' | 'DOWN' | 'LEFT' | 'RIGHT', number>;
  classification: PlayerClassification;
  predictionScore: number;
  adaptationLevel: number;
  recentMoves: MovementHistory[];
}

export interface GameState {
  grid: Grid;
  playerPosition: Position;
  stats: PlayerStats;
  aiState: AIState;
  status: 'MENU' | 'PLAYING' | 'WON' | 'LOST';
  turnCount: number;
  message: string;
}
