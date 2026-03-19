import type { TileMap, TileType, Vec2, PatrolRoute } from '../utils/types'
import { TILE_SIZE } from '../utils/constants'

const CHAR_MAP: Record<string, TileType> = {
  '.': 'ground',
  '#': 'wall',
  T: 'tree',
  B: 'bush',
  W: 'water',
  C: 'chest',
  G: 'gate',
  ' ': 'empty',
}

function parseMap(rows: string[]): TileMap {
  const tiles = rows.map((row) => Array.from(row).map((ch) => CHAR_MAP[ch] ?? 'empty'))
  const width = tiles[0]?.length ?? 0
  if (width === 0 || !tiles.every((row) => row.length === width)) {
    throw new Error(`Map rows must all be ${width} chars wide`)
  }
  return { width, height: tiles.length, tiles }
}

export function createForestMap(): TileMap {
  return parseMap([
    'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT', // Row  0
    'T..C..TT...T...............TT.....T', // Row  1 — chest at col 2-3
    'T.....TT.B.T...BB..........TT.BB..T', // Row  2
    'T.....GG.B.T...BB...T......TT.BB..T', // Row  3 — gate
    'T.....GG...T..........T...........T', // Row  4
    'TGGGGGT..TTTTT..TTTTTT..TTTTT..TTTT', // Row  5 — gate + tree divider
    'T........T..........T.............T', // Row  6
    'T..BB..T.T..T..BB....T.T...BB..T..T', // Row  7
    'T..BB..T....T..BB........T..BB....T', // Row  8
    'T......T..T..........T............T', // Row  9
    'T..T.........T..T..........T..T...T', // Row 10
    'T........BB..........BB..T........T', // Row 11
    'T..T..T..BB..T.......BB.......T...T', // Row 12
    'T..........T....T...........T.....T', // Row 13
    'T..BB..T.........T......BB.T.....TT', // Row 14
    'T..BB.....T..T............BB.....TT', // Row 15
    'T......T..........T..T............T', // Row 16
    'T..T........T..T...........T......T', // Row 17
    'T.......T..BB...T...T....BB..T....T', // Row 18
    'T..BB..T...BB............T.BB.....T', // Row 19
    'T..BB..T..T..........T............T', // Row 20
    'T........T...T..T..........T..T...T', // Row 21
    'T..T..BB.T...............T..BB....T', // Row 22
    'T.....BB.....T...T..T.....BB..T...T', // Row 23
    'T..T.....T.............T..........T', // Row 24
    'T.......T..T....T...........T.....T', // Row 25
    'T...........T.................T...T', // Row 26 — player spawn
    'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT', // Row 27
  ])
}

const tp = (col: number, row: number): Vec2 => ({ x: col * TILE_SIZE, y: row * TILE_SIZE })

export const PLAYER_SPAWN = tp(16, 26)
export const CHEST_POS = tp(3, 1)
export const GATE_POSITIONS: Vec2[] = [tp(1, 5), tp(2, 5), tp(3, 5), tp(4, 5), tp(5, 5)]

// Bokoblin spawn positions (routes generated randomly at runtime)
export const BOKOBLIN_SPAWN_POSITIONS: Vec2[] = [
  tp(5, 7),
  tp(20, 6),
  tp(6, 19),
  tp(9, 10),
  tp(25, 9),
  tp(22, 20),
  tp(15, 13),
  tp(28, 17),
]

// Archer spawn positions
export const ARCHER_SPAWN_POSITIONS: Vec2[] = [tp(12, 11), tp(26, 15), tp(18, 22)]

/** Generate a random patrol route from a spawn point using walkable tiles */
export function generateRandomPatrolRoute(
  spawn: Vec2,
  map: TileMap,
  waypointCount = 4,
): PatrolRoute {
  const route: PatrolRoute = [{ ...spawn }]
  const maxRadius = 6 * TILE_SIZE

  for (let i = 1; i < waypointCount; i++) {
    let placed = false
    for (let attempt = 0; attempt < 30; attempt++) {
      const angle = Math.random() * Math.PI * 2
      const dist = (2 + Math.random() * 4) * TILE_SIZE
      if (dist > maxRadius) continue
      const x = spawn.x + Math.cos(angle) * dist
      const y = spawn.y + Math.sin(angle) * dist
      const col = Math.floor(x / TILE_SIZE)
      const row = Math.floor(y / TILE_SIZE)
      if (row < 1 || row >= map.height - 1 || col < 1 || col >= map.width - 1) continue
      const tile = map.tiles[row]?.[col]
      if (tile === 'ground' || tile === 'bush') {
        route.push({ x: col * TILE_SIZE, y: row * TILE_SIZE })
        placed = true
        break
      }
    }
    if (!placed) {
      // Fallback: use spawn position offset slightly
      route.push({ x: spawn.x + TILE_SIZE, y: spawn.y + TILE_SIZE })
    }
  }
  return route
}

/** Pick a random walkable position for the key Bokoblin, away from player spawn and chest */
export function getRandomKeyPosition(map: TileMap): Vec2 {
  const minPlayerDist = 8 * TILE_SIZE
  const minChestDist = 6 * TILE_SIZE
  const candidates: Vec2[] = []

  for (let row = 6; row < map.height - 2; row++) {
    for (let col = 1; col < map.width - 1; col++) {
      if (map.tiles[row]?.[col] !== 'ground') continue
      const pos = tp(col, row)
      const dpx = pos.x - PLAYER_SPAWN.x
      const dpy = pos.y - PLAYER_SPAWN.y
      const dcx = pos.x - CHEST_POS.x
      const dcy = pos.y - CHEST_POS.y
      if (
        Math.sqrt(dpx * dpx + dpy * dpy) >= minPlayerDist &&
        Math.sqrt(dcx * dcx + dcy * dcy) >= minChestDist
      ) {
        candidates.push(pos)
      }
    }
  }

  if (candidates.length === 0) return tp(28, 14) // fallback
  return candidates[Math.floor(Math.random() * candidates.length)]!
}
