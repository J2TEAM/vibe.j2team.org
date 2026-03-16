/**
 * Core type definitions for Digits packing puzzle
 *
 * Key concept: Segments are EDGES in a grid, not cells
 * - Board has 49 segments (edges in a 5x4 grid)
 * - Pieces are made of segments that must align with board segments
 */

export type PieceNumber = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9
export type Rotation = 0 | 90 | 180 | 270

/**
 * A segment is an edge in the grid
 * Position is defined by the grid point at the start of the segment
 * Orientation determines the direction of the segment
 */
export interface Segment {
  x: number // Grid x coordinate (0-5 for vertical, 0-4 for horizontal)
  y: number // Grid y coordinate (0-4 for horizontal, 0-3 for vertical)
  orientation: 'horizontal' | 'vertical'
}

/**
 * A segment ID is a unique string identifier for a segment on the board
 * Format: "x,y,orientation" (e.g., "2,1,h" or "3,0,v")
 */
export type SegmentId = string

/**
 * A piece represents a number (0-9) made of segments
 */
export interface Piece {
  id: string // Unique identifier
  number: PieceNumber
  rotation: Rotation
  segments: Segment[] // Segments in piece's local coordinate system
}

/**
 * Position on the board (grid coordinates, not pixels)
 */
export interface BoardPosition {
  x: number
  y: number
}

/**
 * A piece placed on the board
 */
export interface PlacedPiece {
  piece: Piece
  position: BoardPosition // Anchor position (top-left of piece's bounding box)
}

/**
 * Board state
 */
export interface BoardState {
  placedPieces: PlacedPiece[]
  occupiedSegments: Set<SegmentId> // Set of segment IDs that are occupied
  gridWidth: 5 // 5 units wide
  gridHeight: 4 // 4 units tall
  totalSegments: 49 // Total segments on board
}

/**
 * Drag state
 */
export interface DragState {
  piece: Piece
  sourceType: 'inventory' | 'board'
  sourcePosition?: BoardPosition // If dragging from board
  sourcePiece?: Piece // Snapshot of piece from board before dragging/rotation
}

/**
 * Game state
 */
export interface GameState {
  board: BoardState
  inventory: Piece[]
  dragState: DragState | null
}
