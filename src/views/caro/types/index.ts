export enum PlayerEnum {
  X = 'X',
  O = 'O',
}

export interface IPosition {
  row: number
  col: number
}

export type Direction = [number, number]

export type ScoresByDirection = Record<string, number[]>

/** Score key có thể là number (0-5) hoặc '-1', khi for..in trả về string */
export type SumCol = Record<string, Record<string, number>>

export type FinalScores = Record<string, number>

export type Board = (PlayerEnum | null)[][]

export type GameResult = 'win' | 'lose' | 'draw'

export interface IGameState {
  board: Board
  currentPlayer: PlayerEnum
  winCondition: number
  lastMovePosition?: IPosition
}
