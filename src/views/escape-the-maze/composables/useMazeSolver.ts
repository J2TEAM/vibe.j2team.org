import { type Cell, type Position } from '../types'

export function useMazeSolver() {
  function findFarthestCell(grid: Cell[][], start: Position): { cell: Position; distance: number } {
    const size = grid.length
    const visited = new Set<string>()
    const queue: { pos: Position; dist: number }[] = [{ pos: start, dist: 0 }]
    let farthest = { cell: start, distance: 0 }

    visited.add(`${start.x},${start.y}`)

    while (queue.length > 0) {
      const { pos, dist } = queue.shift()!
      const cell = grid[pos.y]![pos.x]!

      if (dist > farthest.distance) {
        farthest = { cell: pos, distance: dist }
      }

      // Check all directions
      const neighbors: Array<{ pos: Position; wall: keyof Cell['walls'] }> = [
        { pos: { x: pos.x, y: pos.y - 1 }, wall: 'top' },
        { pos: { x: pos.x + 1, y: pos.y }, wall: 'right' },
        { pos: { x: pos.x, y: pos.y + 1 }, wall: 'bottom' },
        { pos: { x: pos.x - 1, y: pos.y }, wall: 'left' },
      ]

      for (const { pos: nextPos, wall } of neighbors) {
        if (
          nextPos.x >= 0 &&
          nextPos.x < size &&
          nextPos.y >= 0 &&
          nextPos.y < size &&
          !cell.walls[wall] &&
          !visited.has(`${nextPos.x},${nextPos.y}`)
        ) {
          visited.add(`${nextPos.x},${nextPos.y}`)
          queue.push({ pos: nextPos, dist: dist + 1 })
        }
      }
    }

    return farthest
  }

  return {
    findFarthestCell,
  }
}
