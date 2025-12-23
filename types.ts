
export interface GameConfig {
  horseCount: number;
  trackLength: number;
  cardsPerHorse: number;
  drawCount: number;
  mode: 'single' | 'tournament';
  totalRounds: number;
}

export interface Horse {
  id: number;
  name: string;
  color: string;
  position: number;
  drawnCards: number[];
  finishRank?: number; // 1, 2, or 3
  tournamentPoints: number;
}

export type GameStatus = 'setup' | 'playing' | 'round_finished' | 'tournament_finished';

export interface PendingTurn {
  drawnIds: number[];
  commentary: string;
}

export interface GameState {
  config: GameConfig;
  horses: Horse[];
  deck: number[];
  currentTurn: number;
  currentRound: number;
  status: GameStatus;
  finishers: number[]; // Array of horse IDs who finished in order
  lastDrawn: number[];
  pendingTurn: PendingTurn | null;
}
