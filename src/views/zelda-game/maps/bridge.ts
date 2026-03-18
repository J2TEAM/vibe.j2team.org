import type { TileMap, TileType, Vec2, WaveConfig } from '../utils/types'
import { TILE_SIZE } from '../utils/constants'

const CHAR_MAP: Record<string, TileType> = {
  '.': 'ground',
  '#': 'wall',
  W: 'water',
}

function parseMap(rows: string[]): TileMap {
  const tiles = rows.map((row) => Array.from(row).map((ch) => CHAR_MAP[ch] ?? 'empty'))
  const width = tiles[0]?.length ?? 0
  if (width === 0 || !tiles.every((row) => row.length === width)) {
    throw new Error(`Map rows must all be ${width} chars wide`)
  }
  return { width, height: tiles.length, tiles }
}

// Bridge layout: 60 cols × 19 rows (1920×608px)
//
// Columns:
//   0-3   : entry platform (all ground, rows 3-15)
//   4-37  : combat corridor (walls rows 3-4 and 14-15, ground rows 5-13)
//   38-56 : boss arena (all ground, rows 3-15; pillars at cols 42,52 rows 6,12)
//   57-59 : exit platform (all ground, rows 3-15)
//
// Rows:
//   0-2   : water (chasm — impassable)
//   3-4   : wall railing (except entry/boss/exit columns)
//   5-13  : ground (walkable bridge surface; boss arena adds 2 extra wall rows)
//   14-15 : wall railing (except entry/boss/exit columns)
//   16-18 : water (chasm — impassable)

export function createBridgeMap(): TileMap {
  const map = parseMap([
    'WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW', // Row  0
    'WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW', // Row  1
    'WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW', // Row  2
    '....##################################......................', // Row  3 — railing (cols 4-37)
    '....##################################......................', // Row  4 — railing (cols 4-37)
    '............................................................', // Row  5 — ground
    '..........................................#.........#.......', // Row  6 — ground + pillars (cols 42, 52)
    '............................................................', // Row  7 — ground
    '............................................................', // Row  8 — ground
    '............................................................', // Row  9 — ground (player spawn row)
    '............................................................', // Row 10 — ground
    '............................................................', // Row 11 — ground
    '..........................................#.........#.......', // Row 12 — ground + pillars (cols 42, 52)
    '............................................................', // Row 13 — ground
    '....##################################......................', // Row 14 — railing (cols 4-37)
    '....##################################......................', // Row 15 — railing (cols 4-37)
    'WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW', // Row 16
    'WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW', // Row 17
    'WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW', // Row 18
  ])
  map.theme = 'bridge'
  return map
}

const tp = (col: number, row: number): Vec2 => ({ x: col * TILE_SIZE, y: row * TILE_SIZE })

export const BRIDGE_PLAYER_SPAWN: Vec2 = tp(2, 9)

export const BRIDGE_BOSS_SPAWN: Vec2 = tp(47, 9)

/** Random integer in [min, max] inclusive */
function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

/** Wave config ranges: { bokoblins: [min, max], archers: [min, max], triggerX } */
const WAVE_RANGES = [
  { bokoblins: [4, 6] as const, archers: [0, 1] as const, triggerX: 10 * TILE_SIZE },
  { bokoblins: [4, 6] as const, archers: [2, 3] as const, triggerX: 20 * TILE_SIZE },
  { bokoblins: [5, 8] as const, archers: [3, 4] as const, triggerX: 30 * TILE_SIZE },
]

/** Generate randomized wave configs each game start */
export function generateRandomWaveConfigs(): WaveConfig[] {
  return WAVE_RANGES.map(({ bokoblins, archers, triggerX }) => ({
    bokoblins: randInt(bokoblins[0], bokoblins[1]),
    archers: randInt(archers[0], archers[1]),
    triggerX,
  }))
}

/** Column ranges for each wave's spawn zone */
const WAVE_COL_RANGES = [
  { min: 11, max: 17 },
  { min: 21, max: 27 },
  { min: 31, max: 37 },
]

/** Walkable rows in the bridge corridor (rows 5-13) */
const WALKABLE_ROWS = [5, 6, 7, 8, 9, 10, 11, 12, 13]

/** Generate dynamic spawn positions for a wave based on enemy count */
export function generateWaveSpawnPositions(waveIndex: number, count: number): Vec2[] {
  const colRange = WAVE_COL_RANGES[waveIndex]!
  const positions: Vec2[] = []
  const usedKeys = new Set<string>()

  for (let i = 0; i < count; i++) {
    let col: number, row: number, key: string
    let attempts = 0
    do {
      col = randInt(colRange.min, colRange.max)
      row = WALKABLE_ROWS[randInt(0, WALKABLE_ROWS.length - 1)]!
      key = `${col},${row}`
      attempts++
    } while (usedKeys.has(key) && attempts < 30)
    usedKeys.add(key)
    positions.push(tp(col, row))
  }
  return positions
}

/** Generate a simple horizontal patrol route for an archer near its spawn */
export function generateArcherPatrolRoute(spawn: Vec2, waveIndex: number): Vec2[] {
  const colRange = WAVE_COL_RANGES[waveIndex]!
  const spawnCol = Math.round(spawn.x / TILE_SIZE)
  const spawnRow = Math.round(spawn.y / TILE_SIZE)
  const left = Math.max(colRange.min, spawnCol - 3)
  const right = Math.min(colRange.max, spawnCol + 3)
  return [tp(left, spawnRow), tp(right, spawnRow)]
}

// Keep legacy export for backward compatibility (used if anyone references it)
export const BRIDGE_WAVE_CONFIGS: WaveConfig[] = [
  { bokoblins: 3, archers: 0, triggerX: 10 * TILE_SIZE },
  { bokoblins: 2, archers: 2, triggerX: 20 * TILE_SIZE },
  { bokoblins: 1, archers: 3, triggerX: 30 * TILE_SIZE },
]

/** Enemy spawn positions per wave — top and bottom edges of the bridge corridor */
export const BRIDGE_WAVE_SPAWN_POSITIONS: Vec2[][] = [
  // Wave 1 — near cols 12-15
  [
    tp(12, 5),
    tp(15, 5), // top edge
    tp(12, 13),
    tp(15, 13), // bottom edge
  ],
  // Wave 2 — near cols 22-25
  [tp(22, 5), tp(25, 5), tp(22, 13), tp(25, 13)],
  // Wave 3 — near cols 32-35
  [tp(32, 5), tp(35, 5), tp(32, 13), tp(35, 13)],
]

/** Per-wave patrol routes for archers (index matches archer spawn order within the wave) */
export const BRIDGE_WAVE_ARCHER_PATROL_ROUTES: Vec2[][][] = [
  // Wave 1 — no archers
  [],
  // Wave 2 — 2 archers (spawned at tp(22,13) and tp(25,13))
  [
    [tp(20, 13), tp(26, 13)], // archer 0: back-and-forth along bottom row
    [tp(23, 13), tp(28, 13)], // archer 1: offset patrol on bottom row
  ],
  // Wave 3 — 3 archers (spawned at tp(35,5), tp(32,13), tp(35,13))
  [
    [tp(33, 5), tp(37, 5)], // archer 0: top row
    [tp(30, 13), tp(34, 13)], // archer 1: bottom row left
    [tp(33, 13), tp(37, 13)], // archer 2: bottom row right
  ],
]

export const BRIDGE_PILLAR_POSITIONS: Vec2[] = [tp(42, 6), tp(52, 6), tp(42, 12), tp(52, 12)]
