export type Player = 'X' | 'O'
export type CellValue = Player | null
export type GameStatus = 'setup' | 'playing' | 'playerWins' | 'aiWins' | 'draw'
export type Difficulty = 'easy' | 'medium' | 'hard'

export interface BoardConfig {
  rows: number
  cols: number
}

export interface Score {
  wins: number
  losses: number
  draws: number
}
