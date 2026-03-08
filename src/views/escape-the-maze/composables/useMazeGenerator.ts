import { type Cell } from '../types'

function createEmptyGrid(size: number): Cell[][] {
  const grid: Cell[][] = []
  for (let y = 0; y < size; y++) {
    grid[y] = []
    for (let x = 0; x < size; x++) {
      grid[y]![x] = {
        x,
        y,
        visited: false,
        walls: {
          top: true,
          right: true,
          bottom: true,
          left: true,
        },
      }
    }
  }
  return grid
}

function getUnvisitedNeighbors(grid: Cell[][], cell: Cell): Cell[] {
  const neighbors: Cell[] = []
  const { x, y } = cell
  const size = grid.length

  if (y > 0 && !grid[y - 1]![x]!.visited) neighbors.push(grid[y - 1]![x]!) // top
  if (x < size - 1 && !grid[y]![x + 1]!.visited) neighbors.push(grid[y]![x + 1]!) // right
  if (y < size - 1 && !grid[y + 1]![x]!.visited) neighbors.push(grid[y + 1]![x]!) // bottom
  if (x > 0 && !grid[y]![x - 1]!.visited) neighbors.push(grid[y]![x - 1]!) // left

  return neighbors
}

function removeWalls(current: Cell, next: Cell): void {
  const dx = next.x - current.x
  const dy = next.y - current.y

  if (dx === 1) {
    current.walls.right = false
    next.walls.left = false
  } else if (dx === -1) {
    current.walls.left = false
    next.walls.right = false
  } else if (dy === 1) {
    current.walls.bottom = false
    next.walls.top = false
  } else if (dy === -1) {
    current.walls.top = false
    next.walls.bottom = false
  }
}

export function useMazeGenerator() {
  function generateMaze(size: number): Cell[][] {
    const grid = createEmptyGrid(size)
    const stack: Cell[] = []
    let current = grid[0]![0]!
    current.visited = true

    while (true) {
      const unvisited = getUnvisitedNeighbors(grid, current)

      if (unvisited.length > 0) {
        const next = unvisited[Math.floor(Math.random() * unvisited.length)]!
        stack.push(current)
        removeWalls(current, next)
        next.visited = true
        current = next
      } else if (stack.length > 0) {
        current = stack.pop()!
      } else {
        break
      }
    }

    return grid
  }

  return {
    generateMaze,
  }
}
