import { ref } from 'vue'
import type { Cell, Position } from '../types'

export function usePlayer() {
  const position = ref<Position>({ x: 0, y: 0 })
  const steps = ref(0)

  function reset() {
    position.value = { x: 0, y: 0 }
    steps.value = 0
  }

  function canMove(grid: Cell[][], direction: 'up' | 'down' | 'left' | 'right'): boolean {
    const current = grid[position.value.y]![position.value.x]!

    switch (direction) {
      case 'up':
        return !current.walls.top
      case 'down':
        return !current.walls.bottom
      case 'left':
        return !current.walls.left
      case 'right':
        return !current.walls.right
    }
  }

  function move(grid: Cell[][], direction: 'up' | 'down' | 'left' | 'right'): boolean {
    if (!canMove(grid, direction)) return false

    switch (direction) {
      case 'up':
        position.value.y--
        break
      case 'down':
        position.value.y++
        break
      case 'left':
        position.value.x--
        break
      case 'right':
        position.value.x++
        break
    }

    steps.value++
    return true
  }

  return {
    position,
    steps,
    reset,
    move,
    canMove,
  }
}
