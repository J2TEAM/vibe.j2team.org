import type { Piece } from './engine/vchess-engine'

const IMG = '/vchess/images'

export function getPieceImageSrc(piece: Piece): string {
  const red = piece.side === 'red'
  switch (piece.kind) {
    case 'rook':
      return red ? `${IMG}/rook_red.png` : `${IMG}/rook_black.png`
    case 'knight':
      return red ? `${IMG}/knight_red.png` : `${IMG}/knight_black.png`
    case 'elephant':
      return red ? `${IMG}/elephant_red.png` : `${IMG}/elephant_black.png`
    case 'gunner':
      return red ? `${IMG}/gunner_red.png` : `${IMG}/gunner_black.png`
    case 'king':
      return red ? `${IMG}/crown_red.png` : `${IMG}/crown_black.png`
    case 'pawn':
      return red ? `${IMG}/pawn_red.png` : `${IMG}/pawn_black.png`
    case 'assassin':
      return red ? `${IMG}/assassin_red.png` : `${IMG}/assassin_black.png`
    case 'eagle':
      if (piece.eagleMode === 'flying') {
        return red ? `${IMG}/eagle_fly_red.png` : `${IMG}/eagle_fly_black.png`
      }
      return red ? `${IMG}/eagle_red.png` : `${IMG}/eagle_black.png`
  }
}
