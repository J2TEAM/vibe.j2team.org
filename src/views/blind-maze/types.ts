export interface CellWalls {
  north: boolean
  east: boolean
  south: boolean
  west: boolean
}

export interface MazeCell {
  walls: CellWalls
  visited: boolean
}

export interface MazePoint {
  x: number
  y: number
}

export interface MazeData {
  cells: MazeCell[][]
  width: number
  height: number
  start: MazePoint
  end: MazePoint
  mazeNumber: number
}

export interface TrailPoint extends MazePoint {
  time: number
}

export interface BlindMazeStats {
  mazesPlayed: number
  mazesWon: number
  bestMoves: number | null
  bestTime: number | null
  lastPlayedDate: string | null
  history: Array<{
    date: string
    won: boolean
    moves: number
    time: number
    mazeNumber: number
  }>
}

export interface TodayResult {
  date: string
  won: boolean
  moves: number
  time: number
  mazeNumber: number
}
