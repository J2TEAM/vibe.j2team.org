export type BlockShape = number[][]

export interface Block {
  id: string
  shape: BlockShape
  color: string
}

export interface GameState {
  board: number[][]
  blocks: Block[]
  score: number
  isGameOver: boolean
  clearedLines: number
  combo: number
}

export type CellState = 0 | number
