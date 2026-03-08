import { TILE_SIZE } from '../engine/Physics'
import type { LevelData } from './levels'
import {
  isSolid,
  isQuestion,
  isLethal,
  QUESTION_COIN,
  QUESTION_MUSH,
  QUESTION_STAR,
  EMPTY,
  GROUND,
} from './Tile'

// Used question blocks become GROUND+100 to mark them as "used"
const USED_OFFSET = 100

export class Level {
  tiles: number[][]
  width: number
  height: number
  data: LevelData

  constructor(data: LevelData) {
    this.data = data
    this.tiles = data.tiles.map((row) => [...row])
    this.height = this.tiles.length
    this.width = this.tiles[0]!.length
  }

  get pixelWidth(): number {
    return this.width * TILE_SIZE
  }

  get pixelHeight(): number {
    return this.height * TILE_SIZE
  }

  getTile(col: number, row: number): number {
    if (row < 0 || row >= this.height || col < 0 || col >= this.width) return GROUND
    return this.tiles[row]![col]!
  }

  setTile(col: number, row: number, value: number) {
    if (row >= 0 && row < this.height && col >= 0 && col < this.width) {
      this.tiles[row]![col] = value
    }
  }

  isSolidAt(col: number, row: number): boolean {
    const t = this.getTile(col, row)
    return isSolid(t) || isQuestion(t) || t >= USED_OFFSET
  }

  isLethalAt(col: number, row: number): boolean {
    return isLethal(this.getTile(col, row))
  }

  hitQuestion(col: number, row: number): 'coin' | 'mushroom' | 'star' | null {
    const t = this.getTile(col, row)
    if (!isQuestion(t)) return null

    this.setTile(col, row, USED_OFFSET + t)

    if (t === QUESTION_COIN) return 'coin'
    if (t === QUESTION_MUSH) return 'mushroom'
    if (t === QUESTION_STAR) return 'star'
    return null
  }

  breakBrick(col: number, row: number): boolean {
    const t = this.getTile(col, row)
    if (t === 2) {
      // BRICK
      this.setTile(col, row, EMPTY)
      return true
    }
    return false
  }

  isUsedQuestion(tile: number): boolean {
    return tile >= USED_OFFSET
  }

  tileToScreen(col: number, row: number): { x: number; y: number } {
    return { x: col * TILE_SIZE, y: row * TILE_SIZE }
  }
}
