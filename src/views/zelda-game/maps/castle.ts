import type { TileMap, TileType, DestructiblePillar, Vec2 } from '../utils/types'
import { TILE_SIZE } from '../utils/constants'

const CHAR_MAP: Record<string, TileType> = {
  '#': 'wall',
  '.': 'ground',
  P: 'pillar',
  S: 'ground', // spawn markers are ground tiles
  G: 'ground',
  Z: 'ground',
}

// Castle throne room: 25 cols × 19 rows (800×608px)
// Row  0: north wall
// Row  1: Zelda crystal at col 12
// Row  2: wall with inner ground
// Row  3: Ganon spawn at col 12
// Row  5: pillars at cols 6 and 18
// Row 13: pillars at cols 6 and 18
// Row 16: player spawn at col 12
// Row 18: south wall
const MAP_DATA = `
#########################
##..........Z..........##
##.....................##
#...........G...........#
#.......................#
#.....P...........P.....#
#.......................#
#.......................#
#.......................#
#.......................#
#.......................#
#.......................#
#.......................#
#.....P...........P.....#
#.......................#
#.......................#
#...........S...........#
##.....................##
#########################
`.trim()

function parseMap(data: string): TileType[][] {
  const rows = data.split('\n')
  const tiles = rows.map((row) => Array.from(row).map((ch) => CHAR_MAP[ch] ?? 'empty'))
  const width = tiles[0]?.length ?? 0
  if (width === 0 || !tiles.every((row) => row.length === width)) {
    throw new Error(`Castle map rows must all be ${width} chars wide`)
  }
  return tiles
}

const tp = (col: number, row: number): Vec2 => ({
  x: col * TILE_SIZE + TILE_SIZE / 2,
  y: row * TILE_SIZE + TILE_SIZE / 2,
})

export const CASTLE_PLAYER_SPAWN: Vec2 = tp(12, 16)
export const CASTLE_GANON_SPAWN: Vec2 = tp(12, 3)
export const CASTLE_ZELDA_POSITION: Vec2 = tp(12, 1)

export const CASTLE_PILLAR_POSITIONS: DestructiblePillar[] = [
  { col: 6, row: 5, destroyed: false },
  { col: 18, row: 5, destroyed: false },
  { col: 6, row: 13, destroyed: false },
  { col: 18, row: 13, destroyed: false },
]

export function createCastleMap(): TileMap {
  const tiles = parseMap(MAP_DATA)
  return {
    width: tiles[0]?.length ?? 0,
    height: tiles.length,
    tiles,
    theme: 'castle',
  }
}

export function destroyPillar(map: TileMap, pillar: DestructiblePillar): void {
  if (!pillar.destroyed) {
    if (map.tiles[pillar.row]) {
      map.tiles[pillar.row]![pillar.col] = 'ground'
    }
    pillar.destroyed = true
  }
}
