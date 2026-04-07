export interface BusStop {
  id: number
  name: string
  difficulty: number
  boardMin: number
  boardMax: number
  alightMin: number
  alightMax: number
}

export interface Passenger {
  id: string
  color: string
  seatIndex: number
  x: number
  y: number
  targetX: number
  targetY: number
  state: 'seated' | 'boarding' | 'alighting' | 'standing'
}

export type GamePhase =
  | 'IDLE'
  | 'TRANSIT'
  | 'BOARDING'
  | 'COUNTING'
  | 'SCORING'
  | 'GAMEOVER'
  | 'COMPLETE'

export interface GameState {
  phase: GamePhase
  currentStopIndex: number
  passengers: Passenger[]
  lives: number
  score: number
  lastBoarded: number
  lastAlighted: number
  startTime: number
  totalTime: number
}

export interface HighScoreEntry {
  name: string
  score: number
  stopsCompleted: number
  totalTime: number
}
