import type { BlockShape } from '../types'

// Define all block shapes as matrices
export const BLOCK_SHAPES: Record<string, BlockShape> = {
  // Square (2x2)
  square: [
    [1, 1],
    [1, 1],
  ],
  // Line (1x4)
  lineH: [[1, 1, 1, 1]],
  // Line (4x1)
  lineV: [[1], [1], [1], [1]],
  // L-shape
  lShape: [
    [1, 0],
    [1, 0],
    [1, 1],
  ],
  // L-shape rotated
  lShapeRot: [
    [1, 1, 1],
    [1, 0, 0],
  ],
  // T-shape
  tShape: [
    [1, 1, 1],
    [0, 1, 0],
  ],
  // Z-shape
  zShape: [
    [1, 1, 0],
    [0, 1, 1],
  ],
  // S-shape
  sShape: [
    [0, 1, 1],
    [1, 1, 0],
  ],
  // Small line (1x2)
  line2: [[1, 1]],
  // Small line (2x1)
  line2V: [[1], [1]],
  // L-shape small
  lShapeSmall: [
    [1, 0],
    [1, 1],
  ],
}

// Available colors for blocks (using design system colors)
export const BLOCK_COLORS = [
  '#FF6B4A', // coral
  '#FFB830', // amber
  '#38BDF8', // sky
  '#A78BFA', // purple (subtle)
  '#34D399', // emerald
  '#F87171', // rose
  '#60A5FA', // blue
  '#FBBF24', // yellow
]

/**
 * Get a random block shape
 */
export function getRandomBlockShape(): BlockShape {
  const shapes = Object.values(BLOCK_SHAPES)
  const shape = shapes[Math.floor(Math.random() * shapes.length)]
  if (!shape) throw new Error('No block shapes available')
  return structuredClone(shape)
}

/**
 * Get a random block color
 */
export function getRandomBlockColor(): string {
  const color = BLOCK_COLORS[Math.floor(Math.random() * BLOCK_COLORS.length)]
  if (!color) throw new Error('No block colors available')
  return color
}

/**
 * Count the number of filled cells in a shape
 */
export function countShapeCells(shape: BlockShape): number {
  return shape.reduce((sum, row) => sum + row.filter((cell) => cell === 1).length, 0)
}

/**
 * Get the bounding box of a shape
 */
export function getShapeBounds(shape: BlockShape): { width: number; height: number } {
  return {
    height: shape.length,
    width: shape[0]?.length || 0,
  }
}

/**
 * Get all filled cell coordinates in a shape (relative to top-left)
 */
export function getShapeCells(shape: BlockShape): Array<{ row: number; col: number }> {
  const cells: Array<{ row: number; col: number }> = []
  shape.forEach((row, r) => {
    row.forEach((cell, c) => {
      if (cell === 1) {
        cells.push({ row: r, col: c })
      }
    })
  })
  return cells
}
