export type Tile = {
  id: number
  value: number
  x: number
  y: number
  mergedFrom?: [Tile, Tile]
}

export type Grid = (Tile | null)[][]

export type MoveResult = {
  grid: Grid
  score: number
  changed: boolean
}

export type Direction = 'up' | 'down' | 'left' | 'right'
