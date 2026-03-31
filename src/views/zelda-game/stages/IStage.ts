import type { Camera } from '../engine/Camera'
import type { Vec2, TileMap, InputState } from '../utils/types'
import type { Player } from '../entities/Player'
import type { Enemy } from '../entities/Enemy'
import type { Renderer } from '../engine/Renderer'
import type { Effects } from '../engine/Effects'

/** Shared interface for all stage implementations */
export interface IStage {
  readonly playerSpawn: Vec2
  update(
    dt: number,
    player: Player,
    map: TileMap,
    input: InputState,
    effects: Effects,
    camera: Camera,
  ): void
  draw(
    ctx: CanvasRenderingContext2D,
    renderer: Renderer,
    map: TileMap,
    effects: Effects,
    camera: Camera,
  ): void
  drawPrompts(ctx: CanvasRenderingContext2D, renderer: Renderer, playerCenter: Vec2): void
  isComplete(): boolean
  getEnemies(): Enemy[]
  getStatus(): Record<string, unknown>
  isItemGetActive(): boolean
  getStats?(): { enemiesDefeated: number; damageTaken: number }
}
