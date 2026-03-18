import type { Grid, Tile, MoveResult, Direction } from '../types'

export const GRID_SIZE = 4
let nextId = 1

export const createEmptyGrid = (): Grid => {
  return Array.from({ length: GRID_SIZE }, () => Array.from({ length: GRID_SIZE }, () => null))
}

export const getEmptyCells = (grid: Grid): { x: number; y: number }[] => {
  const cells: { x: number; y: number }[] = []
  if (!Array.isArray(grid)) return cells
  for (let y = 0; y < GRID_SIZE; y++) {
    const row = grid[y]
    if (!Array.isArray(row)) continue
    for (let x = 0; x < GRID_SIZE; x++) {
      if (!row[x]) {
        cells.push({ x, y })
      }
    }
  }
  return cells
}

export const syncNextId = (grid: Grid) => {
  let maxId = 0
  if (!Array.isArray(grid)) return

  grid.forEach((row) => {
    if (!Array.isArray(row)) return
    row.forEach((tile) => {
      if (tile && typeof tile === 'object' && 'id' in tile) {
        const numericId =
          typeof tile.id === 'string' ? parseInt(tile.id as string, 10) : Number(tile.id)
        if (!isNaN(numericId) && numericId > maxId) {
          maxId = numericId
        }
      }
    })
  })
  nextId = maxId + 1
}

export const addRandomTile = (grid: Grid): Grid => {
  const emptyCells = getEmptyCells(grid)
  if (emptyCells.length === 0) return grid

  const cell = emptyCells[Math.floor(Math.random() * emptyCells.length)]
  if (!cell) return grid

  const { x, y } = cell
  const value = Math.random() < 0.9 ? 2 : 4
  const newGrid = grid.map((row) => (Array.isArray(row) ? [...row] : Array(GRID_SIZE).fill(null)))
  const row = newGrid[y]
  if (row) {
    row[x] = {
      id: nextId++,
      value,
      x,
      y,
    }
  }

  return newGrid
}

export const move = (grid: Grid, direction: Direction): MoveResult => {
  let score = 0
  let changed = false
  const newGrid = createEmptyGrid()
  if (!Array.isArray(grid)) return { grid: newGrid, score, changed }

  // Soft-clean prev grid to drop lingering mergedFrom structures from last move
  const cleanGrid = grid.map((row) => {
    if (!Array.isArray(row)) return Array(GRID_SIZE).fill(null)
    return row.map((tile) => {
      if (tile && typeof tile === 'object') {
        const cleanTile = { ...tile }
        delete cleanTile.mergedFrom
        return cleanTile
      }
      return null
    })
  })

  // Helper to get tiles in a specific direction row/column
  const getLine = (index: number) => {
    const line: { tile: Tile; pos: number }[] = []
    for (let i = 0; i < GRID_SIZE; i++) {
      const actualX =
        direction === 'left' || direction === 'right'
          ? direction === 'left'
            ? i
            : GRID_SIZE - 1 - i
          : index
      const actualY =
        direction === 'up' || direction === 'down'
          ? direction === 'up'
            ? i
            : GRID_SIZE - 1 - i
          : index

      const row = cleanGrid[actualY]
      if (Array.isArray(row)) {
        const tile = row[actualX]
        if (tile) {
          line.push({ tile, pos: i })
        }
      }
    }
    return line
  }

  for (let i = 0; i < GRID_SIZE; i++) {
    const tiles = getLine(i)
    const newLine: (Tile | null)[] = Array(GRID_SIZE).fill(null)

    const processResults: Tile[] = []
    for (let j = 0; j < tiles.length; j++) {
      const current = tiles[j]!.tile
      if (j + 1 < tiles.length && current.value === tiles[j + 1]!.tile.value) {
        // Merge
        const next = tiles[j + 1]!.tile
        const mergedTile: Tile = {
          id: nextId++,
          value: current.value * 2,
          x: 0,
          y: 0,
          mergedFrom: [current, next],
        }
        processResults.push(mergedTile)
        score += mergedTile.value
        changed = true
        j++
      } else {
        processResults.push({ ...current })
      }
    }

    // Map processResults back to newLine
    processResults.forEach((tile, index) => {
      newLine[index] = tile
    })

    // Check if changed
    if (tiles.length !== processResults.length) changed = true
    else {
      // Check if positions changed
      for (let j = 0; j < tiles.length; j++) {
        if (tiles[j]?.pos !== j) {
          changed = true
          break
        }
      }
    }

    // Set new coordinates and put into newGrid
    for (let j = 0; j < GRID_SIZE; j++) {
      const tile = newLine[j]
      if (tile) {
        const actualX =
          direction === 'left' || direction === 'right'
            ? direction === 'left'
              ? j
              : GRID_SIZE - 1 - j
            : i
        const actualY =
          direction === 'up' || direction === 'down'
            ? direction === 'up'
              ? j
              : GRID_SIZE - 1 - j
            : i
        tile.x = actualX
        tile.y = actualY
        newGrid[actualY]![actualX] = tile

        if (tile.mergedFrom) {
          tile.mergedFrom[0]!.x = actualX
          tile.mergedFrom[0]!.y = actualY
          tile.mergedFrom[1]!.x = actualX
          tile.mergedFrom[1]!.y = actualY
        }
      }
    }
  }

  return { grid: newGrid, score, changed }
}

export const isGameOver = (grid: Grid): boolean => {
  if (!Array.isArray(grid)) return true
  if (getEmptyCells(grid).length > 0) return false

  for (let y = 0; y < GRID_SIZE; y++) {
    const row = grid[y]
    if (!Array.isArray(row)) continue

    for (let x = 0; x < GRID_SIZE; x++) {
      const current = row[x]
      if (!current) continue

      // Check right
      const nextRight = row[x + 1]
      if (x + 1 < GRID_SIZE && nextRight?.value === current.value) return false

      // Check down
      const nextDownRow = grid[y + 1]
      if (
        Array.isArray(nextDownRow) &&
        y + 1 < GRID_SIZE &&
        nextDownRow[x]?.value === current.value
      )
        return false
    }
  }

  return true
}
