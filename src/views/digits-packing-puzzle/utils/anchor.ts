import type { Piece, PieceNumber } from '../types'
import { getPieceSegments } from './rotation'

// Per-digit tweak offsets (in grid units) to adjust the perceived center.
// Positive x moves right, positive y moves down.
export const PIECE_ANCHOR_OFFSETS: Record<PieceNumber, { x: number; y: number }> = {
  0: { x: 2, y: 2 },
  1: { x: 1, y: 1 },
  2: { x: 1.5, y: 1 },
  3: { x: 1, y: 1.5 },
  4: { x: 1.3, y: 1.2 },
  5: { x: 1.1, y: 1.5 },
  6: { x: 1.5, y: 1.5 },
  7: { x: 1.2, y: 1.5 },
  8: { x: 2, y: 1.4 },
  9: { x: 1.5, y: 1.5 },
}

// Compute piece anchor in piece-local grid coords: center of bounding box of segment midpoints + tweak offset.
export function getPieceAnchor(piece: Piece): { x: number; y: number } {
  const segments = getPieceSegments(piece)
  if (segments.length === 0) return { x: 0, y: 0 }

  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity

  for (const seg of segments) {
    const midX = seg.orientation === 'horizontal' ? seg.x + 0.5 : seg.x
    const midY = seg.orientation === 'horizontal' ? seg.y : seg.y + 0.5
    minX = Math.min(minX, midX)
    minY = Math.min(minY, midY)
    maxX = Math.max(maxX, midX)
    maxY = Math.max(maxY, midY)
  }

  const center = { x: (minX + maxX) / 2, y: (minY + maxY) / 2 }
  const offset = PIECE_ANCHOR_OFFSETS[piece.number]

  return { x: center.x + offset.x, y: center.y + offset.y }
}
