import { directions } from '../../constants'
import type { Direction, Point, SearchNode, Tile } from '../../types'

function inBounds(x: number, y: number, cols: number, rows: number): boolean {
  return x >= 0 && x < cols && y >= 0 && y < rows
}

function inExtendedBounds(x: number, y: number, cols: number, rows: number): boolean {
  return x >= -1 && x <= cols && y >= -1 && y <= rows
}

function getTile(grid: Tile[][], y: number, x: number): Tile | null {
  const row = grid[y]
  if (!row) {
    return null
  }
  return row[x] ?? null
}

function shuffle<T>(array: T[]): T[] {
  const result = [...array]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const temp = result[i] as T
    result[i] = result[j] as T
    result[j] = temp
  }
  return result
}

function obstacleCountByDifficulty(totalCells: number, level: number): number {
  if (level <= 0) {
    return 0
  }
  const density = Math.min(0.04 + level * 0.02, 0.2)
  return Math.floor(totalCells * density)
}

function linearIndex(x: number, y: number, cols: number): number {
  return y * cols + x
}

function isOpenAreaConnected(rows: number, cols: number, walls: Set<number>): boolean {
  const totalCells = rows * cols
  const openCells = totalCells - walls.size
  if (openCells <= 1) {
    return false
  }

  let start = -1
  for (let i = 0; i < totalCells; i++) {
    if (!walls.has(i)) {
      start = i
      break
    }
  }

  if (start < 0) {
    return false
  }

  const stack: number[] = [start]
  const visited = new Set<number>([start])

  while (stack.length > 0) {
    const current = stack.pop()
    if (current === undefined) {
      break
    }
    const y = Math.floor(current / cols)
    const x = current % cols

    const neighbors: Array<readonly [number, number]> = [
      [x + 1, y],
      [x - 1, y],
      [x, y + 1],
      [x, y - 1],
    ]
    for (const [nx, ny] of neighbors) {
      if (nx < 0 || nx >= cols || ny < 0 || ny >= rows) {
        continue
      }
      const idx = linearIndex(nx, ny, cols)
      if (walls.has(idx) || visited.has(idx)) {
        continue
      }
      visited.add(idx)
      stack.push(idx)
    }
  }

  return visited.size === openCells
}

function generateConnectedWalls(rows: number, cols: number, targetWalls: number): Set<number> {
  const walls = new Set<number>()
  const candidates = shuffle(
    Array.from({ length: rows * cols }, (_, index) => ({
      x: index % cols,
      y: Math.floor(index / cols),
      index,
    })),
  )

  for (const candidate of candidates) {
    if (walls.size >= targetWalls) {
      break
    }
    walls.add(candidate.index)
    if (!isOpenAreaConnected(rows, cols, walls)) {
      walls.delete(candidate.index)
    }
  }

  return walls
}

function isWalkable(x: number, y: number, from: Tile, to: Tile, grid: Tile[][], rows: number, cols: number): boolean {
  if ((x === from.x && y === from.y) || (x === to.x && y === to.y)) {
    return true
  }

  if (!inBounds(x, y, cols, rows)) {
    return true
  }

  const tile = getTile(grid, y, x)
  if (!tile || tile.kind === 'wall') {
    return false
  }

  return !tile.isVisible
}

function reconstructPath(nodes: SearchNode[], endIndex: number): Point[] {
  const points: Point[] = []
  let cursor = endIndex

  while (cursor >= 0) {
    const node = nodes[cursor]
    if (!node) {
      break
    }
    points.push({ x: node.x + 1, y: node.y + 1 })
    cursor = node.parent
  }

  return points.reverse()
}

function compressPath(points: Point[]): Point[] {
  if (points.length <= 2) {
    return points
  }

  const compact: Point[] = [points[0] as Point]
  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1] as Point
    const cur = points[i] as Point
    const next = points[i + 1] as Point

    const dx1 = cur.x - prev.x
    const dy1 = cur.y - prev.y
    const dx2 = next.x - cur.x
    const dy2 = next.y - cur.y

    if (dx1 * dy2 !== dy1 * dx2) {
      compact.push(cur)
    }
  }
  compact.push(points[points.length - 1] as Point)
  return compact
}

export function buildBoard(rows: number, cols: number, difficulty: number, iconSet: ReadonlyArray<string>): Tile[][] {
  const totalCells = rows * cols

  let obstacles = Math.min(obstacleCountByDifficulty(totalCells, difficulty), Math.max(0, totalCells - 2))
  if ((totalCells - obstacles) % 2 !== 0) {
    obstacles = Math.max(0, obstacles - 1)
  }

  let playableCells = totalCells - obstacles
  if (playableCells < 2) {
    playableCells = 2
    obstacles = totalCells - playableCells
  }

  const walls = generateConnectedWalls(rows, cols, obstacles)
  if ((totalCells - walls.size) % 2 !== 0) {
    const removable = Array.from(walls)
    const removed = removable[removable.length - 1]
    if (removed !== undefined) {
      walls.delete(removed)
    }
  }

  playableCells = totalCells - walls.size
  const pairs = playableCells / 2
  const iconTypes: number[] = []
  for (let i = 0; i < pairs; i++) {
    const type = Math.floor(Math.random() * iconSet.length)
    iconTypes.push(type, type)
  }
  const shuffledIcons = shuffle(iconTypes)

  const next: Tile[][] = []
  let id = 0
  let iconCursor = 0

  for (let y = 0; y < rows; y++) {
    const row: Tile[] = []
    for (let x = 0; x < cols; x++) {
      const index = linearIndex(x, y, cols)
      const isWall = walls.has(index)
      const iconType = isWall ? -1 : (shuffledIcons[iconCursor] ?? 0)
      if (!isWall) {
        iconCursor += 1
      }
      row.push({
        id,
        kind: isWall ? 'wall' : 'icon',
        type: iconType,
        icon: isWall ? '' : (iconSet[iconType] ?? ''),
        x,
        y,
        isVisible: true,
      })
      id++
    }
    next.push(row)
  }

  return next
}

export function findConnectionPath(from: Tile, to: Tile, grid: Tile[][], rows: number, cols: number): Point[] | null {
  if (from.kind !== 'icon' || to.kind !== 'icon' || from.type < 0 || to.type < 0 || from.type !== to.type || from.id === to.id) {
    return null
  }

  const queue: SearchNode[] = [{ x: from.x, y: from.y, dir: -1, turns: 0, parent: -1 }]
  const visited = new Map<string, number>()
  let head = 0

  while (head < queue.length) {
    const current = queue[head]
    if (!current) {
      break
    }
    const currentIndex = head
    head++

    for (let i = 0; i < directions.length; i++) {
      const dir = i as Direction
      const vector = directions[dir] as readonly [number, number]
      const nextTurns = current.dir === -1 || current.dir === dir ? current.turns : current.turns + 1
      if (nextTurns > 2) {
        continue
      }

      let nx = current.x + vector[0]
      let ny = current.y + vector[1]

      while (inExtendedBounds(nx, ny, cols, rows) && isWalkable(nx, ny, from, to, grid, rows, cols)) {
        const key = `${nx},${ny},${dir}`
        const seenTurns = visited.get(key)

        if (seenTurns === undefined || seenTurns > nextTurns) {
          visited.set(key, nextTurns)
          queue.push({ x: nx, y: ny, dir, turns: nextTurns, parent: currentIndex })
          const nodeIndex = queue.length - 1

          if (nx === to.x && ny === to.y) {
            return compressPath(reconstructPath(queue, nodeIndex))
          }
        }

        nx += vector[0]
        ny += vector[1]
      }
    }
  }

  return null
}

export function findHintPath(grid: Tile[][]): { first: Tile; second: Tile; path: Point[] } | null {
  const grouped = new Map<number, Tile[]>()
  const rows = grid.length
  const cols = grid[0]?.length ?? 0

  for (const row of grid) {
    for (const tile of row) {
      if (tile.kind !== 'icon' || !tile.isVisible || tile.type < 0) {
        continue
      }

      const list = grouped.get(tile.type)
      if (list) {
        list.push(tile)
      } else {
        grouped.set(tile.type, [tile])
      }
    }
  }

  for (const [, list] of grouped) {
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const a = list[i] as Tile
        const b = list[j] as Tile
        const path = findConnectionPath(a, b, grid, rows, cols)
        if (path !== null) {
          return { first: a, second: b, path }
        }
      }
    }
  }

  return null
}

export function hasAnyValidMove(grid: Tile[][]): boolean {
  return findHintPath(grid) !== null
}

export function reshuffleVisibleBoard(grid: Tile[][]): void {
  const activeTiles: Tile[] = []
  const items: Array<{ kind: 'icon' | 'wall'; type: number; icon: string }> = []

  for (const row of grid) {
    for (const tile of row) {
      if (tile.kind === 'wall') {
        activeTiles.push(tile)
        items.push({ kind: 'wall', type: -1, icon: '' })
      } else if (tile.isVisible && tile.type >= 0) {
        activeTiles.push(tile)
        items.push({ kind: 'icon', type: tile.type, icon: tile.icon })
      }
    }
  }

  const shuffled = shuffle(items)
  for (let i = 0; i < activeTiles.length; i++) {
    const tile = activeTiles[i] as Tile
    const item = shuffled[i]
    tile.kind = item?.kind ?? tile.kind
    tile.type = item?.type ?? tile.type
    tile.icon = item?.icon ?? tile.icon
    tile.isVisible = true
  }
}

export function applyGravityToBoard(grid: Tile[][]): void {
  const rows = grid.length
  if (rows === 0) {
    return
  }

  const cols = grid[0]?.length ?? 0
  for (let x = 0; x < cols; x++) {
    let segmentEnd = rows - 1

    while (segmentEnd >= 0) {
      const endTile = grid[segmentEnd]?.[x]
      if (!endTile || endTile.kind === 'wall') {
        segmentEnd -= 1
        continue
      }

      let segmentStart = segmentEnd
      while (segmentStart >= 0) {
        const tile = grid[segmentStart]?.[x]
        if (!tile || tile.kind === 'wall') {
          break
        }
        segmentStart -= 1
      }
      segmentStart += 1

      const visibleStack: Array<{ type: number; icon: string }> = []
      for (let y = segmentStart; y <= segmentEnd; y++) {
        const tile = grid[y]?.[x]
        if (!tile || tile.kind !== 'icon') {
          continue
        }
        if (tile.isVisible && tile.type >= 0) {
          visibleStack.push({ type: tile.type, icon: tile.icon })
        }
      }

      let stackIndex = visibleStack.length - 1
      for (let y = segmentEnd; y >= segmentStart; y--) {
        const tile = grid[y]?.[x]
        if (!tile || tile.kind !== 'icon') {
          continue
        }

        const item = visibleStack[stackIndex]
        if (item) {
          tile.isVisible = true
          tile.type = item.type
          tile.icon = item.icon
          stackIndex -= 1
        } else {
          tile.isVisible = false
          tile.type = -1
          tile.icon = ''
        }
      }

      segmentEnd = segmentStart - 2
    }
  }
}
