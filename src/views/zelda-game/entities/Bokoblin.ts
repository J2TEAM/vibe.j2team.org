import type { Vec2, TileMap, PatrolRoute } from '../utils/types'
import {
  ENEMY_SIZE,
  ENEMY_SPEED,
  ENEMY_SPRITE_SIZE,
  BOKOBLIN_HP,
  SPRITE_SIZE,
} from '../utils/constants'
import { Enemy } from './Enemy'
import { AnimationController } from '../engine/AnimationController'
import { getBokoblinAnimations, getBokoblinKeySprite, drawDeathPoof } from '../utils/sprites'
import type { Player } from './Player'

export class Bokoblin extends Enemy {
  isKeyCarrier: boolean
  floatTimer = 0

  constructor(spawnPos: Vec2, patrolRoute: PatrolRoute, isKeyCarrier = false) {
    super(spawnPos, patrolRoute, ENEMY_SPEED, BOKOBLIN_HP, { x: ENEMY_SIZE, y: ENEMY_SIZE })
    // MUST be first after super() — BaseEntity.animation uses definite assignment assertion
    this.animation = new AnimationController(getBokoblinAnimations(), 'idle', 'down')
    this.isKeyCarrier = isKeyCarrier
  }

  updateAI(dt: number, player: Player, map: TileMap): void {
    this.floatTimer += dt * 3

    if (this.isKeyCarrier) {
      this.animation.update(dt)
      return
    }

    super.updateAI(dt, player, map)
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (this.isFullyDead()) return

    // Death animation
    if (this.isDying()) {
      const progress = this.getDeathProgress()
      ctx.save()
      ctx.globalAlpha = Math.max(0, 1 - progress)
      this.drawSprite(ctx)
      ctx.restore()

      const c = this.getCenter()
      drawDeathPoof(ctx, c.x, c.y, progress)
      return
    }

    this.drawWithBlink(ctx, (c) => {
      this.drawSprite(c)
    })
  }

  private drawSprite(ctx: CanvasRenderingContext2D): void {
    if (this.isKeyCarrier) {
      const sprite = getBokoblinKeySprite()
      const offset = (SPRITE_SIZE - ENEMY_SIZE) / 2
      ctx.drawImage(sprite, this.pos.x - offset, this.pos.y - offset, SPRITE_SIZE, SPRITE_SIZE)
    } else {
      const frame = this.animation.getCurrentFrame()
      if (!frame) return
      const offset = (ENEMY_SPRITE_SIZE - ENEMY_SIZE) / 2
      frame.draw(ctx, this.pos.x - offset, this.pos.y - offset, ENEMY_SPRITE_SIZE, this.direction)
    }
  }
}
