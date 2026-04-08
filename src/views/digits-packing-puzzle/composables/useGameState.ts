import { defineStore } from 'pinia'
import type { GameState, Piece, BoardPosition, PieceNumber } from '../types'
import { SEGMENT_PATTERNS, segmentToId } from '../utils/segments'
import { rotatePiece, getPieceSegments } from '../utils/rotation'

/**
 * Get initial game state
 */
function getInitialState(): GameState {
  // Create 10 pieces (0-9) with no rotation
  const inventory: Piece[] = []
  for (let i = 0; i <= 9; i++) {
    const number = i as PieceNumber
    inventory.push({
      id: `piece-${i}`,
      number,
      rotation: 0,
      segments: SEGMENT_PATTERNS[number],
    })
  }

  return {
    board: {
      placedPieces: [],
      occupiedSegments: new Set(),
      gridWidth: 5,
      gridHeight: 4,
      totalSegments: 49,
    },
    inventory,
    dragState: null,
  }
}

/**
 * Get absolute segment positions for a piece at a given board position
 */
function getPieceSegmentPositions(
  piece: Piece,
  position: BoardPosition,
): Array<{ x: number; y: number; orientation: 'horizontal' | 'vertical' }> {
  const segments = getPieceSegments(piece)
  return segments.map((seg) => ({
    x: position.x + seg.x,
    y: position.y + seg.y,
    orientation: seg.orientation,
  }))
}

/**
 * Check if placing a piece would cause collision
 */
function checkCollision(
  piece: Piece,
  position: BoardPosition,
  occupiedSegments: Set<string>,
): boolean {
  const pieceSegments = getPieceSegmentPositions(piece, position)

  for (const segment of pieceSegments) {
    const id = segmentToId(segment)
    if (occupiedSegments.has(id)) {
      return true
    }

    // Also check if segment is out of bounds
    if (segment.orientation === 'horizontal') {
      if (segment.x < 0 || segment.x >= 5 || segment.y < 0 || segment.y > 4) {
        return true
      }
    } else {
      if (segment.x < 0 || segment.x > 5 || segment.y < 0 || segment.y >= 4) {
        return true
      }
    }
  }

  return false
}

/**
 * Update occupied segments set
 */
function updateOccupiedSegments(
  occupiedSegments: Set<string>,
  piece: Piece,
  position: BoardPosition,
  operation: 'add' | 'remove',
): Set<string> {
  const newSet = new Set(occupiedSegments)
  const segments = getPieceSegmentPositions(piece, position)

  for (const segment of segments) {
    const id = segmentToId(segment)
    if (operation === 'add') {
      newSet.add(id)
    } else {
      newSet.delete(id)
    }
  }

  return newSet
}

export const useGameStore = defineStore('digits-game', {
  state: (): GameState => getInitialState(),

  actions: {
    pickUpPiece(piece: Piece, source: 'inventory' | 'board', position?: BoardPosition) {
      // For both inventory and board, just set drag state
      // Don't remove piece yet - it will be removed/moved on successful drop
      // For board pieces, we need to temporarily remove from occupied segments
      // so collision detection works correctly
      if (source === 'board' && position) {
        const newOccupiedSegments = updateOccupiedSegments(
          this.board.occupiedSegments,
          piece,
          position,
          'remove',
        )

        this.board.occupiedSegments = newOccupiedSegments
        this.dragState = {
          piece,
          sourceType: source,
          sourcePosition: position,
          sourcePiece: piece,
        }
      } else {
        // For inventory, just set drag state
        this.dragState = { piece, sourceType: source }
      }
    },

    dropPiece(position: BoardPosition) {
      if (!this.dragState) return

      const { piece, sourceType, sourcePosition, sourcePiece } = this.dragState

      // Check collision
      if (checkCollision(piece, position, this.board.occupiedSegments)) {
        // Return to source
        if (sourceType === 'inventory') {
          // Piece is still in inventory, just clear drag state
          this.dragState = null
        } else if (sourcePosition) {
          // Return occupied segments for original position
          const restorePiece = sourcePiece ?? piece
          const newOccupiedSegments = updateOccupiedSegments(
            this.board.occupiedSegments,
            restorePiece,
            sourcePosition,
            'add',
          )
          this.board.occupiedSegments = newOccupiedSegments
          this.dragState = null
        }
        return
      }

      // Place on board successfully
      const newOccupiedSegments = updateOccupiedSegments(
        this.board.occupiedSegments,
        piece,
        position,
        'add',
      )

      // Handle different source types
      if (sourceType === 'inventory') {
        // Remove from inventory and add to board
        this.inventory = this.inventory.filter((p) => p.id !== piece.id)
        this.board.placedPieces.push({ piece, position })
        this.board.occupiedSegments = newOccupiedSegments
      } else if (sourcePosition) {
        // Moving from board to board - update position
        const pieceIndex = this.board.placedPieces.findIndex((p) => p.piece.id === piece.id)
        if (pieceIndex !== -1) {
          this.board.placedPieces[pieceIndex] = { piece, position }
        }
        this.board.occupiedSegments = newOccupiedSegments
      }

      this.dragState = null
    },

    cancelDrag() {
      if (!this.dragState) return

      const { piece, sourceType, sourcePosition, sourcePiece } = this.dragState

      // Return to source
      if (sourceType === 'inventory') {
        // Piece is still in inventory, just clear drag state
        this.dragState = null
      } else if (sourcePosition) {
        // Restore occupied segments for original position
        const restorePiece = sourcePiece ?? piece
        const newOccupiedSegments = updateOccupiedSegments(
          this.board.occupiedSegments,
          restorePiece,
          sourcePosition,
          'add',
        )
        this.board.occupiedSegments = newOccupiedSegments
        this.dragState = null
      }
    },

    rotatePiece(pieceId: string, direction: 'clockwise' | 'counterclockwise') {
      // Rotate piece in inventory (if present)
      const inventoryIndex = this.inventory.findIndex((p) => p.id === pieceId)

      if (inventoryIndex !== -1) {
        const piece = this.inventory[inventoryIndex]
        if (piece) {
          const rotatedPiece = rotatePiece(piece, direction)
          this.inventory[inventoryIndex] = rotatedPiece
        }
      }

      // Rotate piece in dragState (if currently being dragged)
      if (this.dragState?.piece.id === pieceId) {
        const rotatedDragPiece = rotatePiece(this.dragState.piece, direction)
        this.dragState = {
          ...this.dragState,
          piece: rotatedDragPiece,
        }
      }
    },

    returnToInventory(piece: Piece) {
      // Check if piece is being dragged and came from inventory
      // If so, just cancel the drag without duplicating
      if (this.dragState?.sourceType === 'inventory') {
        this.dragState = null
        return
      }

      // Remove from board if it's there
      const placedPieceIndex = this.board.placedPieces.findIndex((p) => p.piece.id === piece.id)

      if (placedPieceIndex !== -1) {
        const placedPiece = this.board.placedPieces[placedPieceIndex]
        if (placedPiece) {
          this.board.placedPieces.splice(placedPieceIndex, 1)

          // Remove occupied segments
          const newOccupiedSegments = updateOccupiedSegments(
            this.board.occupiedSegments,
            placedPiece.piece,
            placedPiece.position,
            'remove',
          )
          this.board.occupiedSegments = newOccupiedSegments
        }
      }

      // Add to inventory only if it's not already there
      const isAlreadyInInventory = this.inventory.some((p) => p.id === piece.id)

      if (!isAlreadyInInventory) {
        this.inventory.push(piece)
      }

      this.dragState = null
    },

    resetBoard() {
      const initialState = getInitialState()
      this.$patch(initialState)
    },

    loadState(state: GameState) {
      this.$patch(state)
    },
  },
})
