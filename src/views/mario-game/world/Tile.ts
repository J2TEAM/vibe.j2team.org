// Tile type constants
export const EMPTY = 0
export const GROUND = 1
export const BRICK = 2
export const QUESTION_COIN = 3 // Question block with coin
export const QUESTION_MUSH = 4 // Question block with mushroom
export const PIPE_TOP = 5
export const PIPE_BODY = 6
export const FLAG = 7
export const LAVA = 8
export const QUESTION_STAR = 9

export type TileType = number

export function isSolid(tile: TileType): boolean {
  return tile === GROUND || tile === BRICK || tile === PIPE_TOP || tile === PIPE_BODY
}

export function isQuestion(tile: TileType): boolean {
  return tile === QUESTION_COIN || tile === QUESTION_MUSH || tile === QUESTION_STAR
}

export function isLethal(tile: TileType): boolean {
  return tile === LAVA
}
