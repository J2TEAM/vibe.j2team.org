import { COLS, GRID_CELL_SIZE, GRID_COLS } from '../constants/gridConfig'

/**
 * Spatial grid composable for fast empty region detection
 * Divides the canvas into 256x256 blocks and tracks which blocks contain pixels and how many.
 */
export function useSpatialGrid() {
  const spatialGrid = new Map<number, number>() // Map of grid indices to pixel counts

  /**
   * Initialize spatial grid from an existing set of checked indices
   */
  function rebuildSpatialGrid(checkedSet: Set<number>) {
    spatialGrid.clear()
    for (const index of checkedSet) {
      const row = Math.floor(index / COLS)
      const col = index % COLS
      const gridRow = Math.floor(row / GRID_CELL_SIZE)
      const gridCol = Math.floor(col / GRID_CELL_SIZE)
      const gridIndex = gridRow * GRID_COLS + gridCol
      spatialGrid.set(gridIndex, (spatialGrid.get(gridIndex) || 0) + 1)
    }
  }

  /**
   * Update spatial grid when a pixel is added or removed
   */
  function updateSpatialGrid(index: number, isAdding: boolean) {
    const row = Math.floor(index / COLS)
    const col = index % COLS
    const gridRow = Math.floor(row / GRID_CELL_SIZE)
    const gridCol = Math.floor(col / GRID_CELL_SIZE)
    const gridIndex = gridRow * GRID_COLS + gridCol

    const count = spatialGrid.get(gridIndex) || 0
    if (isAdding) {
      spatialGrid.set(gridIndex, count + 1)
    } else {
      if (count <= 1) {
        spatialGrid.delete(gridIndex)
      } else {
        spatialGrid.set(gridIndex, count - 1)
      }
    }
  }

  return {
    spatialGrid,
    rebuildSpatialGrid,
    updateSpatialGrid,
  }
}
