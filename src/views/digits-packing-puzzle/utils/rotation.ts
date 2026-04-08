/**
 * Rotation utilities for pieces and segments
 */

import type { Piece, Segment, Rotation } from '../types'
import { SEGMENT_PATTERNS } from './segments'

/**
 * Get bounding box of segments
 */
function getBoundingBox(segments: Segment[]): {
  minX: number
  minY: number
  maxX: number
  maxY: number
} {
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity

  segments.forEach((seg) => {
    minX = Math.min(minX, seg.x)
    minY = Math.min(minY, seg.y)

    if (seg.orientation === 'horizontal') {
      maxX = Math.max(maxX, seg.x + 1)
      maxY = Math.max(maxY, seg.y)
    } else {
      maxX = Math.max(maxX, seg.x)
      maxY = Math.max(maxY, seg.y + 1)
    }
  })

  return { minX, minY, maxX, maxY }
}

/**
 * Rotate a single segment 90 degrees clockwise
 * For a segment at (x, y):
 * - Horizontal segment: becomes vertical at (y, -x-1)
 * - Vertical segment: becomes horizontal at (y, -x)
 */
function rotateSegment90Clockwise(segment: Segment): Segment {
  const { x, y, orientation } = segment

  if (orientation === 'horizontal') {
    // Horizontal segment from (x, y) to (x+1, y)
    // After rotation: vertical segment from (y, -x-1) to (y, -x)
    return {
      x: y,
      y: -x - 1,
      orientation: 'vertical',
    }
  } else {
    // Vertical segment from (x, y) to (x, y+1)
    // After rotation: horizontal segment from (y, -x) to (y+1, -x)
    return {
      x: y,
      y: -x,
      orientation: 'horizontal',
    }
  }
}

/**
 * Normalize segments to start from (0, 0)
 */
function normalizeSegments(segments: Segment[]): Segment[] {
  const bbox = getBoundingBox(segments)

  return segments.map((seg) => ({
    x: seg.x - bbox.minX,
    y: seg.y - bbox.minY,
    orientation: seg.orientation,
  }))
}

/**
 * Rotate segments by the given rotation angle
 */
export function rotateSegments(segments: Segment[], rotation: Rotation): Segment[] {
  if (rotation === 0) return segments

  let rotated = segments
  const times = rotation / 90

  // Apply 90° rotation multiple times
  for (let i = 0; i < times; i++) {
    rotated = rotated.map(rotateSegment90Clockwise)
  }

  // Normalize to start from (0, 0)
  return normalizeSegments(rotated)
}

/**
 * Rotate a piece by 90 degrees in the specified direction
 */
export function rotatePiece(piece: Piece, direction: 'clockwise' | 'counterclockwise'): Piece {
  const delta = direction === 'clockwise' ? 90 : -90
  const newRotation = ((piece.rotation + delta + 360) % 360) as Rotation

  // Get base segments for this number
  const baseSegments = SEGMENT_PATTERNS[piece.number]

  // Apply new rotation to base segments
  const rotatedSegments = rotateSegments(baseSegments, newRotation)

  return {
    ...piece,
    rotation: newRotation,
    segments: rotatedSegments,
  }
}

/**
 * Get segments for a piece with its current rotation applied
 */
export function getPieceSegments(piece: Piece): Segment[] {
  const baseSegments = SEGMENT_PATTERNS[piece.number]
  return rotateSegments(baseSegments, piece.rotation)
}
