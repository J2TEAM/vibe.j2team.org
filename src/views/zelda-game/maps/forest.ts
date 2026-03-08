import type { TileMap, TileType, Vec2, PatrolRoute } from "../utils/types";
import { TILE_SIZE } from "../utils/constants";

const CHAR_MAP: Record<string, TileType> = {
  ".": "ground",
  "#": "wall",
  T: "tree",
  B: "bush",
  W: "water",
  C: "chest",
  G: "gate",
  " ": "empty",
};

function parseMap(rows: string[]): TileMap {
  const tiles = rows.map((row) => [...row].map((ch) => CHAR_MAP[ch] ?? "empty"));
  const width = tiles[0]?.length ?? 0;
  if (width === 0 || !tiles.every((row) => row.length === width)) {
    throw new Error(`Map rows must all be ${width} chars wide`);
  }
  return { width, height: tiles.length, tiles };
}

export function createForestMap(): TileMap {
  return parseMap([
    "TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT", // Row  0
    "T.....T...T...............T.......T", // Row  1
    "T..C..T...T...............T.......T", // Row  2 — chest at col 3
    "T.....G...T....T..........T.....T.T", // Row  3
    "T.....G.......T...BB.........T..T.T", // Row  4
    "TGGGGG........T...BB......T.....T.T", // Row  5 — gate at cols 3-5
    "T.....T..BB............T........T.T", // Row  6
    "T........BB.....T.......T.......T.T", // Row  7
    "T......T......T.......T.........T.T", // Row  8
    "T......T...T...........BB.......T.T", // Row  9
    "T..BB......T...........BB...T...T.T", // Row 10
    "T..BB..T.............T..........T.T", // Row 11
    "T......T........T.......T.......T.T", // Row 12
    "T..T.......T..........T..BB.....T.T", // Row 13
    "T.....T..........T........BB....T.T", // Row 14 — key Bokoblin at col 28
    "T........BB.....T.......TTTTTTT.T.T", // Row 15
    "T..T.....BB.............T.......T.T", // Row 16
    "T......T.......T........T.......T.T", // Row 17
    "T..BB.....T..........T.........T..T", // Row 18
    "T..BB.T........T......T..BB.....T.T", // Row 19
    "T..........T.........T...BB.....T.T", // Row 20
    "T....T..........T.............T.T.T", // Row 21
    "T......T..BB............T.......T.T", // Row 22
    "T.........BB.....T..........BB..T.T", // Row 23
    "T..T.........T..........T...BB..T.T", // Row 24
    "T......T.............T..........T.T", // Row 25
    "T...........T...............T...T.T", // Row 26 — player spawn at col 16
    "TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT", // Row 27
  ]);
}

const tp = (col: number, row: number): Vec2 => ({ x: col * TILE_SIZE, y: row * TILE_SIZE });

export const PLAYER_SPAWN = tp(16, 26);
export const KEY_BOKOBLIN_SPAWN = tp(28, 14);
export const CHEST_POS = tp(3, 2);
export const GATE_POSITIONS: Vec2[] = [tp(3, 5), tp(4, 5), tp(5, 5)];

export const PATROL_CONFIGS: Array<{ spawn: Vec2; route: PatrolRoute }> = [
  { spawn: tp(4, 6), route: [tp(4, 6), tp(14, 6), tp(14, 7), tp(4, 7)] },
  { spawn: tp(20, 4), route: [tp(20, 4), tp(20, 11), tp(22, 11), tp(22, 4)] },
  { spawn: tp(5, 19), route: [tp(5, 19), tp(14, 19), tp(14, 23), tp(5, 23)] },
  { spawn: tp(8, 3), route: [tp(8, 3), tp(8, 8), tp(3, 8), tp(3, 3)] },
  { spawn: tp(25, 8), route: [tp(25, 8), tp(25, 16), tp(28, 16), tp(28, 8)] },
  { spawn: tp(22, 20), route: [tp(22, 20), tp(30, 20), tp(30, 25), tp(22, 25)] },
];
