import type { Ref } from 'vue'
import type { Cell } from './useGrid'

export function usePathfinding(grid: Ref<Cell[][]>, rows: number, cols: number) {
  function heuristic(a: Cell, b: Cell) {
    return Math.abs(a.r - b.r) + Math.abs(a.c - b.c)
  }

  function neighbors(cell: Cell) {
    const dirs: [number, number][] = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]

    const list: Cell[] = []
    const g = grid.value

    for (const [dr, dc] of dirs) {
      const r = cell.r + dr
      const c = cell.c + dc

      if (r >= 0 && r < rows && c >= 0 && c < cols) {
        const n = g[r]?.[c]
        if (n !== undefined) list.push(n)
      }
    }

    return list
  }

  function sleep(ms: number) {
    return new Promise((r) => setTimeout(r, ms))
  }

  async function drawPath(cell: Cell, start: Cell, speed: number) {
    let cur = cell.parent

    while (cur && cur !== start) {
      cur.type = 'path'
      cur = cur.parent

      await sleep(speed)
    }
  }

  async function runAStar(start: Cell, end: Cell, speed: number, explored: { value: number }) {
    const open = [start]

    start.g = 0
    start.f = heuristic(start, end)

    while (open.length) {
      open.sort((a, b) => a.f - b.f)

      const current = open.shift()!

      explored.value++

      if (current === end) {
        await drawPath(current, start, speed)
        return
      }

      if (current.type !== 'start') current.type = 'visited'

      for (const n of neighbors(current)) {
        if (n.type === 'wall') continue

        const temp = current.g + 1

        if (temp < n.g) {
          n.g = temp
          n.f = temp + heuristic(n, end)
          n.parent = current

          if (!open.includes(n)) open.push(n)
        }
      }

      await sleep(speed)
    }
  }

  async function runBFS(
    start: Cell,
    end: Cell,
    speed: number,
    explored: { value: number },
    _onStep?: (line: number) => void,
  ) {
    const queue: Cell[] = []

    queue.push(start)

    const visited = new Set<Cell>()
    visited.add(start)

    while (queue.length) {
      const current = queue.shift()!

      explored.value++

      if (current === end) {
        await drawPath(current, start, speed)
        return
      }

      if (current.type !== 'start') {
        current.type = 'visited'
      }

      for (const n of neighbors(current)) {
        if (n.type === 'wall') continue

        if (!visited.has(n)) {
          visited.add(n)

          n.parent = current
          queue.push(n)
        }
      }

      await sleep(speed)
    }
  }

  async function runDFS(
    start: Cell,
    end: Cell,
    speed: number,
    explored: { value: number },
    onStep?: (line: number) => void,
  ) {
    const stack: Cell[] = []

    stack.push(start)
    onStep?.(2)
    const visited = new Set<Cell>()
    visited.add(start)

    while (stack.length) {
      onStep?.(4)
      const current = stack.pop()!
      onStep?.(6)
      explored.value++

      if (current === end) {
        onStep?.(8)
        await drawPath(current, start, speed)
        return
      }

      if (current.type !== 'start') current.type = 'visited'

      onStep?.(11)
      for (const n of neighbors(current)) {
        if (n.type === 'wall') continue

        if (!visited.has(n)) {
          onStep?.(13)
          visited.add(n)
          n.parent = current
          stack.push(n)
        }
        await sleep(speed)
      }

      await sleep(speed)
    }
  }

  async function runDijkstra(
    start: Cell,
    end: Cell,
    speed: number,
    explored: { value: number },
    _onStep?: (line: number) => void,
  ) {
    const open: Cell[] = []

    start.g = 0
    open.push(start)

    while (open.length) {
      open.sort((a, b) => a.g - b.g)

      const current = open.shift()!

      explored.value++

      if (current === end) {
        await drawPath(current, start, speed)
        return
      }

      if (current.type !== 'start') {
        current.type = 'visited'
      }

      for (const n of neighbors(current)) {
        if (n.type === 'wall') continue

        const temp = current.g + 1

        if (temp < n.g) {
          n.g = temp
          n.parent = current

          if (!open.includes(n)) {
            open.push(n)
          }
        }
      }

      await sleep(speed)
    }
  }

  async function runGreedy(
    start: Cell,
    end: Cell,
    speed: number,
    explored: { value: number },
    onStep?: (line: number) => void,
  ) {
    const open = [start]

    start.g = 0
    start.f = heuristic(start, end)
    onStep?.(2)
    await sleep(speed)

    while (open.length) {
      onStep?.(4)
      open.sort((a, b) => heuristic(a, end) - heuristic(b, end))

      const current = open.shift()!
      onStep?.(6)
      explored.value++

      if (current === end) {
        onStep?.(8)
        await drawPath(current, start, speed)
        return
      }

      if (current.type !== 'start') current.type = 'visited'

      onStep?.(11)
      for (const n of neighbors(current)) {
        if (n.type === 'wall') continue

        const temp = current.g + 1

        if (temp < n.g) {
          onStep?.(13)
          n.g = temp
          n.f = heuristic(n, end)
          n.parent = current

          if (!open.includes(n)) open.push(n)
        }

        await sleep(speed)
      }

      await sleep(speed)
    }
  }

  async function runPrim(
    start: Cell,
    end: Cell,
    speed: number,
    explored: { value: number },
    onStep?: (line: number) => void,
  ) {
    const inTree = new Set<Cell>()

    start.g = 0
    onStep?.(2)
    await sleep(speed)

    while (inTree.size < rows * cols) {
      onStep?.(4)

      let best: Cell | null = null
      let bestCost = Infinity

      for (const row of grid.value) {
        for (const cell of row) {
          if (cell.type === 'wall') continue
          if (inTree.has(cell)) continue
          if (cell.g < bestCost) {
            bestCost = cell.g
            best = cell
          }
        }
      }

      if (best === null || bestCost === Infinity) break

      inTree.add(best)
      onStep?.(6)
      explored.value++

      if (best === end) {
        onStep?.(8)
        await drawPath(best, start, speed)
        return
      }

      if (best.type !== 'start') best.type = 'visited'

      onStep?.(11)
      for (const n of neighbors(best)) {
        if (n.type === 'wall' || inTree.has(n)) continue

        const edgeCost = 1
        if (edgeCost < n.g) {
          onStep?.(13)
          n.g = edgeCost
          n.parent = best
        }

        await sleep(speed)
      }

      await sleep(speed)
    }
  }

  return { runAStar, runBFS, runDFS, runDijkstra, runGreedy, runPrim }
}
