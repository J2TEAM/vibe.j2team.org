import type { BlindMazeStats, MazeCell, MazeData, MazeEvent, MazePoint, TodayResult } from './types'

class SeededRandom {
  constructor(private seed: number) {}

  next(): number {
    let t = (this.seed += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }

  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min)) + min
  }

  shuffle<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = this.nextInt(0, i + 1)
      const current = array[i]
      const target = array[j]
      if (current === undefined || target === undefined) continue
      array[i] = target
      array[j] = current
    }
    return array
  }
}

function parseDateInput(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number)
  return new Date(year ?? 2026, (month ?? 1) - 1, day ?? 1)
}

function getDailySeed(dateString: string | null = null): number {
  const baseDate = parseDateInput('2026-01-01')
  const targetDate = dateString ? parseDateInput(dateString) : new Date()
  targetDate.setHours(0, 0, 0, 0)
  baseDate.setHours(0, 0, 0, 0)
  return Math.floor((targetDate.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24))
}

export function getMazeNumber(dateString: string | null = null): number {
  return getDailySeed(dateString) + 1
}

export function getDateKey(dateString: string | null = null): string {
  const date = dateString ? parseDateInput(dateString) : new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function createCells(width: number, height: number): MazeCell[][] {
  return Array.from({ length: height }, () =>
    Array.from({ length: width }, () => ({
      walls: { north: true, east: true, south: true, west: true },
      visited: false,
    })),
  )
}

function carveMaze(cells: MazeCell[][], x: number, y: number, rng: SeededRandom): void {
  const row = cells[y]
  const cell = row?.[x]
  if (!cell) return

  cell.visited = true

  const directions = rng.shuffle([
    { dx: 0, dy: -1, wall: 'north', opposite: 'south' },
    { dx: 1, dy: 0, wall: 'east', opposite: 'west' },
    { dx: 0, dy: 1, wall: 'south', opposite: 'north' },
    { dx: -1, dy: 0, wall: 'west', opposite: 'east' },
  ] as const)

  for (const dir of directions) {
    const nx = x + dir.dx
    const ny = y + dir.dy
    const nextCell = cells[ny]?.[nx]

    if (!nextCell || nextCell.visited) continue

    cell.walls[dir.wall] = false
    nextCell.walls[dir.opposite] = false
    carveMaze(cells, nx, ny, rng)
  }
}

function pickEndPoint(width: number, height: number, rng: SeededRandom) {
  const minDistance = Math.floor((width + height) * 0.45)

  for (let i = 0; i < 24; i++) {
    const point = {
      x: rng.nextInt(0, width),
      y: rng.nextInt(0, height),
    }

    if (point.x === 0 && point.y === 0) continue

    const distance = point.x + point.y
    if (distance >= minDistance) return point
  }

  return { x: width - 1, y: height - 1 }
}

function getPointKey(point: MazePoint): string {
  return `${point.x},${point.y}`
}

function getManhattanDistance(from: MazePoint, to: MazePoint): number {
  return Math.abs(from.x - to.x) + Math.abs(from.y - to.y)
}

function pickEventPoints(
  width: number,
  height: number,
  rng: SeededRandom,
  start: MazePoint,
  end: MazePoint,
  total: number,
): MazePoint[] {
  const candidates: MazePoint[] = []
  const reserved = new Set([getPointKey(start), getPointKey(end)])
  const startThreshold = Math.floor((width + height) * 0.22)
  const endThreshold = Math.floor((width + height) * 0.12)

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const point = { x, y }
      const key = getPointKey(point)
      if (reserved.has(key)) continue
      if (x <= 2 && y <= 2) continue
      if (getManhattanDistance(start, point) < startThreshold) continue
      if (getManhattanDistance(end, point) < endThreshold) continue
      candidates.push(point)
    }
  }

  rng.shuffle(candidates)
  return candidates.slice(0, total)
}

function createEventMap(
  width: number,
  height: number,
  rng: SeededRandom,
  start: MazePoint,
  end: MazePoint,
): Record<string, MazeEvent> {
  const eventPoints = pickEventPoints(width, height, rng, start, end, 9)
  const events: Record<string, MazeEvent> = {}
  const assignEvent = (point: MazePoint | undefined, event: MazeEvent) => {
    if (!point) return
    events[getPointKey(point)] = event
  }

  const pairA1 = eventPoints[0]
  const pairA2 = eventPoints[1]
  const pairB1 = eventPoints[2]
  const pairB2 = eventPoints[3]
  const mysteryA = eventPoints[4]
  const beacon = eventPoints[5]
  const snare = eventPoints[6]
  const echo = eventPoints[7]
  const support = eventPoints[8]

  if (pairA1 && pairA2) {
    assignEvent(pairA1, { type: 'teleport-pair', pairId: 'A', target: pairA2 })
    assignEvent(pairA2, { type: 'teleport-pair', pairId: 'A', target: pairA1 })
  }

  if (pairB1 && pairB2) {
    assignEvent(pairB1, { type: 'teleport-pair', pairId: 'B', target: pairB2 })
    assignEvent(pairB2, { type: 'teleport-pair', pairId: 'B', target: pairB1 })
  }

  const mysteryTargets = eventPoints.filter(
    (point) => point && point !== mysteryA && getManhattanDistance(point, mysteryA ?? start) >= 12,
  )
  if (mysteryA && mysteryTargets.length) {
    assignEvent(mysteryA, {
      type: 'teleport-mystery',
      target: mysteryTargets[0],
      used: false,
    })
  }

  assignEvent(beacon, { type: 'beacon' })
  assignEvent(snare, { type: 'snare' })
  assignEvent(echo, { type: 'echo' })

  if (support) {
    assignEvent(support, rng.next() > 0.5 ? { type: 'trail-refresh' } : { type: 'surge' })
  }

  return events
}

export function getTodaysMaze(dateString: string | null = null): MazeData {
  const seed = getDailySeed(dateString)
  const rng = new SeededRandom(seed + 12345)
  const sizeVariant = seed % 21
  const width = 40 + sizeVariant
  const height = 40 + sizeVariant
  const cells = createCells(width, height)
  const start = { x: 0, y: 0 }
  const end = pickEndPoint(width, height, rng)

  carveMaze(cells, start.x, start.y, rng)
  const events = createEventMap(width, height, rng, start, end)

  return {
    cells,
    width,
    height,
    start,
    end,
    mazeNumber: getMazeNumber(dateString),
    events,
  }
}

export function createDefaultStats(): BlindMazeStats {
  return {
    mazesPlayed: 0,
    mazesWon: 0,
    bestMoves: null,
    bestTime: null,
    lastPlayedDate: null,
    history: [],
  }
}

export function createTodayResult(
  won: boolean,
  moves: number,
  time: number,
  mazeNumber: number,
  dateString: string | null = null,
): TodayResult {
  return {
    date: getDateKey(dateString),
    won,
    moves,
    time,
    mazeNumber,
  }
}
