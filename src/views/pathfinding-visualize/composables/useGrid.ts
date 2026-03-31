import { ref } from 'vue'

export type CellType = 'empty' | 'start' | 'end' | 'wall' | 'visited' | 'path'

export interface Cell {
  r: number
  c: number
  type: CellType
  g: number
  f: number
  parent: Cell | null
}

export function useGrid(rows = 40, cols = 40) {
  function createGrid(): Cell[][] {
    return Array.from({ length: rows }, (_, r) =>
      Array.from({ length: cols }, (_, c) => ({
        r,
        c,
        type: 'empty',
        g: Infinity,
        f: Infinity,
        parent: null,
      })),
    )
  }

  const grid = ref<Cell[][]>(createGrid())

  const start = ref<Cell | null>(null)
  const end = ref<Cell | null>(null)

  function clearGrid() {
    grid.value = createGrid()
    start.value = null
    end.value = null
  }

  function toggleWall(cell: Cell) {
    if (cell.type === 'empty') cell.type = 'wall'
    else if (cell.type === 'wall') cell.type = 'empty'
  }

  function setWall(cell: Cell) {
    if (cell.type === 'empty') cell.type = 'wall'
  }

  function resetVisited() {
    for (const row of grid.value) {
      for (const cell of row) {
        if (cell.type === 'visited' || cell.type === 'path') cell.type = 'empty'

        cell.g = Infinity
        cell.f = Infinity
        cell.parent = null
      }
    }
  }

  function randomWalls(density = 0.25) {
    resetVisited()

    const startCell = start.value
    const endCell = end.value

    for (const row of grid.value) {
      for (const cell of row) {
        if (cell.type === 'wall') cell.type = 'empty'
        if (cell === startCell || cell === endCell) continue
        if (Math.random() < density) cell.type = 'wall'
      }
    }
  }

  return {
    grid,
    rows,
    cols,
    start,
    end,
    clearGrid,
    toggleWall,
    setWall,
    resetVisited,
    randomWalls,
  }
}
