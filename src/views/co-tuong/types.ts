export type PieceType = 'K' | 'A' | 'E' | 'H' | 'R' | 'C' | 'P'
export type PieceColor = 'red' | 'black'
export type GameMode = 'menu' | 'local' | 'ai' | 'online-setup' | 'online-play' | 'spectator'
export type AiDifficulty = 'medium'
export type ConnectionState =
  | 'idle'
  | 'creating-offer'
  | 'waiting-answer'
  | 'joining'
  | 'spectator-joining'
  | 'connected'
export type Turn = 'red' | 'black'

export interface Piece {
  type: PieceType
  color: PieceColor
}
export type Board = (Piece | null)[][]
export interface Move {
  from: [number, number]
  to: [number, number]
  piece: Piece
  captured: Piece | null
}
