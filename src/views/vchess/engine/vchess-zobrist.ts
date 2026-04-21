/**
 * Zobrist hashing cho vChess — dùng transposition table.
 * Export đủ internals để engine dùng incremental hashing.
 */

import type { Piece, VChessState } from './vchess-engine'

const BOARD_ROWS = 11
const BOARD_COLS = 9

const SQ = BOARD_ROWS * BOARD_COLS

export function zobristSquareIndex(row: number, col: number): number {
  return row * BOARD_COLS + col
}

export function pieceVariantIndex(p: Piece): number {
  const sideOff = p.side === 'red' ? 0 : 9
  switch (p.kind) {
    case 'rook':
      return sideOff + 0
    case 'knight':
      return sideOff + 1
    case 'elephant':
      return sideOff + 2
    case 'gunner':
      return sideOff + 3
    case 'king':
      return sideOff + 4
    case 'pawn':
      return sideOff + 5
    case 'assassin':
      return sideOff + 6
    case 'eagle':
      return sideOff + 7 + (p.eagleMode === 'flying' ? 1 : 0)
  }
}

const NUM_PIECE_KEYS = 20

function splitmix64(x: bigint): bigint {
  let z = (x + 0x9e3779b97f4a7c15n) & ((1n << 64n) - 1n)
  z = ((z ^ (z >> 30n)) * 0xbf58476d1ce4e5b9n) & ((1n << 64n) - 1n)
  z = ((z ^ (z >> 27n)) * 0x94d049bb133111ebn) & ((1n << 64n) - 1n)
  return z ^ (z >> 31n)
}

function makeSeeded(seed: bigint): () => bigint {
  let s = seed
  return () => {
    s = splitmix64(s)
    return s
  }
}

const rnd = makeSeeded(0x564348455353n)

export const zobristPiece: bigint[][] = Array.from({ length: SQ }, () =>
  Array.from({ length: NUM_PIECE_KEYS }, () => rnd()),
)

export const zobristSideToMove: bigint = rnd()
export const zobristKingTwoRed: bigint = rnd()
export const zobristKingTwoBlack: bigint = rnd()

/** XOR key cho một quân tại (row, col). */
export function zobristPieceKey(piece: Piece, row: number, col: number): bigint {
  const si = zobristSquareIndex(row, col)
  const pi = pieceVariantIndex(piece)
  return zobristPiece[si]![pi]!
}

/** Hash 64-bit đầy đủ — dùng khi tạo state ban đầu. */
export function computeHash(state: VChessState): bigint {
  let h = 0n
  for (let row = 0; row < BOARD_ROWS; row++) {
    for (let col = 0; col < BOARD_COLS; col++) {
      const piece = state.board[row]?.[col]
      if (!piece) continue
      h ^= zobristPieceKey(piece, row, col)
    }
  }
  if (state.turn === 'red') h ^= zobristSideToMove
  if (state.kingTwoStepAvailable.red) h ^= zobristKingTwoRed
  if (state.kingTwoStepAvailable.black) h ^= zobristKingTwoBlack
  return h
}
