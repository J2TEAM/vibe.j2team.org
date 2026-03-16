/**
 * Segment definitions for 7-segment display
 *
 * Standard 7-segment layout in local coordinate system:
 *      a (0,0,h)
 *    ┌─────┐
 *  f │     │ b
 * (0,0,v) (1,0,v)
 *    ├──g──┤ (0,1,h)
 *  e │     │ c
 * (0,1,v) (1,1,v)
 *    └─────┘
 *      d (0,2,h)
 *
 * Each segment is defined in piece's local coordinate system
 * where (0,0) is the top-left corner of the piece's bounding box
 */

import type { PieceNumber, Segment } from '../types'

/**
 * Color mapping for each piece number
 */
export const PIECE_COLORS: Record<PieceNumber, string> = {
  0: '#cf101d',
  1: '#db8e26',
  2: '#f7da18',
  3: '#95b93b',
  4: '#238f5b',
  5: '#9ed2f0',
  6: '#1e9cdc',
  7: '#1e5fa3',
  8: '#7f257d',
  9: '#d16ea4',
}

/**
 * Base segment patterns for each number in local coordinates
 * These are the segments before any rotation is applied
 */
export const SEGMENT_PATTERNS: Record<PieceNumber, Segment[]> = {
  0: [
    { x: 0, y: 0, orientation: 'horizontal' }, // a
    { x: 1, y: 0, orientation: 'vertical' }, // b
    { x: 0, y: 1, orientation: 'horizontal' }, // g
    { x: 0, y: 0, orientation: 'vertical' }, // f
  ],
  1: [
    { x: 1, y: 0, orientation: 'vertical' }, // b
    { x: 1, y: 1, orientation: 'vertical' }, // c
  ],
  2: [
    { x: 0, y: 0, orientation: 'horizontal' }, // a
    { x: 1, y: 0, orientation: 'vertical' }, // b
    { x: 0, y: 1, orientation: 'horizontal' }, // g
    { x: 0, y: 1, orientation: 'vertical' }, // e
    { x: 0, y: 2, orientation: 'horizontal' }, // d
  ],
  3: [
    { x: 0, y: 0, orientation: 'horizontal' }, // a
    { x: 1, y: 0, orientation: 'vertical' }, // b
    { x: 0, y: 1, orientation: 'horizontal' }, // g
    { x: 1, y: 1, orientation: 'vertical' }, // c
    { x: 0, y: 2, orientation: 'horizontal' }, // d
  ],
  4: [
    { x: 0, y: 0, orientation: 'vertical' }, // f
    { x: 0, y: 1, orientation: 'horizontal' }, // g
    { x: 1, y: 0, orientation: 'vertical' }, // b
    { x: 1, y: 1, orientation: 'vertical' }, // c
  ],
  5: [
    { x: 0, y: 0, orientation: 'horizontal' }, // a
    { x: 0, y: 0, orientation: 'vertical' }, // f
    { x: 0, y: 1, orientation: 'horizontal' }, // g
    { x: 1, y: 1, orientation: 'vertical' }, // c
    { x: 0, y: 2, orientation: 'horizontal' }, // d
  ],
  6: [
    { x: 0, y: 0, orientation: 'horizontal' }, // a
    { x: 0, y: 0, orientation: 'vertical' }, // f
    { x: 0, y: 1, orientation: 'horizontal' }, // g
    { x: 0, y: 1, orientation: 'vertical' }, // e
    { x: 0, y: 2, orientation: 'horizontal' }, // d
    { x: 1, y: 1, orientation: 'vertical' }, // c
  ],
  7: [
    { x: 0, y: 0, orientation: 'horizontal' }, // a
    { x: 1, y: 0, orientation: 'vertical' }, // b
    { x: 1, y: 1, orientation: 'vertical' }, // c
  ],
  8: [
    { x: 0, y: 0, orientation: 'horizontal' }, // a
    { x: 1, y: 0, orientation: 'vertical' }, // b
    { x: 1, y: 1, orientation: 'vertical' }, // c
    { x: 0, y: 2, orientation: 'horizontal' }, // d
    { x: 0, y: 1, orientation: 'vertical' }, // e
    { x: 0, y: 0, orientation: 'vertical' }, // f
    { x: 0, y: 1, orientation: 'horizontal' }, // g
  ],
  9: [
    { x: 0, y: 0, orientation: 'horizontal' }, // a
    { x: 1, y: 0, orientation: 'vertical' }, // b
    { x: 1, y: 1, orientation: 'vertical' }, // c
    { x: 0, y: 2, orientation: 'horizontal' }, // d
    { x: 0, y: 0, orientation: 'vertical' }, // f
    { x: 0, y: 1, orientation: 'horizontal' }, // g
  ],
}

/**
 * Convert segment to unique ID string
 */
export function segmentToId(segment: Segment): string {
  const orient = segment.orientation === 'horizontal' ? 'h' : 'v'
  return `${segment.x},${segment.y},${orient}`
}

/**
 * Get all 49 segments on the board
 */
export function getAllBoardSegments(): Segment[] {
  const segments: Segment[] = []

  // Horizontal segments: 5 rows (y=0 to 4) × 5 segments each (x=0 to 4)
  for (let y = 0; y <= 4; y++) {
    for (let x = 0; x < 5; x++) {
      segments.push({ x, y, orientation: 'horizontal' })
    }
  }

  // Vertical segments: 6 columns (x=0 to 5) × 4 segments each (y=0 to 3)
  for (let x = 0; x <= 5; x++) {
    for (let y = 0; y < 4; y++) {
      segments.push({ x, y, orientation: 'vertical' })
    }
  }

  return segments
}
