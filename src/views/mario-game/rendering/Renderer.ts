import { TILE_SIZE } from '../engine/Physics'
import type { Camera } from '../engine/Camera'
import type { Level } from '../world/Level'
import type { Player } from '../entities/Player'
import type { Enemy } from '../entities/Enemy'
import type { Boss } from '../entities/Boss'
import type { Item } from '../entities/Item'
import { Sprites } from './Sprites'
import {
  GROUND,
  BRICK,
  QUESTION_COIN,
  QUESTION_MUSH,
  QUESTION_STAR,
  PIPE_TOP,
  PIPE_BODY,
  FLAG,
  LAVA,
} from '../world/Tile'

export class Renderer {
  private ctx: CanvasRenderingContext2D
  private sprites: Sprites
  width: number
  height: number

  constructor(ctx: CanvasRenderingContext2D, width: number, height: number) {
    this.ctx = ctx
    this.width = width
    this.height = height
    this.sprites = new Sprites()
  }

  clear(color = '#5C94FC') {
    this.ctx.fillStyle = color
    this.ctx.fillRect(0, 0, this.width, this.height)
  }

  drawLevel(level: Level, camera: Camera) {
    const startCol = Math.floor(camera.x / TILE_SIZE)
    const endCol = Math.ceil((camera.x + camera.width) / TILE_SIZE)
    const startRow = Math.floor(camera.y / TILE_SIZE)
    const endRow = Math.ceil((camera.y + camera.height) / TILE_SIZE)

    for (let row = startRow; row <= endRow && row < level.height; row++) {
      for (let col = startCol; col <= endCol && col < level.width; col++) {
        const tile = level.getTile(col, row)
        if (tile === 0) continue

        const sx = col * TILE_SIZE - camera.x
        const sy = row * TILE_SIZE - camera.y
        let sprite: HTMLCanvasElement | null = null

        if (level.isUsedQuestion(tile)) {
          sprite = this.sprites.tile('question_used')
        } else {
          switch (tile) {
            case GROUND:
              sprite = this.sprites.tile('ground')
              break
            case BRICK:
              sprite = this.sprites.tile('brick')
              break
            case QUESTION_COIN:
            case QUESTION_MUSH:
            case QUESTION_STAR:
              sprite = this.sprites.tile('question')
              break
            case PIPE_TOP:
              sprite = this.sprites.tile('pipe_top')
              break
            case PIPE_BODY:
              sprite = this.sprites.tile('pipe')
              break
            case FLAG:
              sprite = this.sprites.tile('flag')
              break
            case LAVA:
              sprite = this.sprites.tile('lava')
              break
          }
        }

        if (sprite) {
          this.ctx.drawImage(sprite, sx, sy, TILE_SIZE, TILE_SIZE)
        }
      }
    }
  }

  drawPlayer(player: Player, camera: Camera) {
    if (player.dead && player.deathTimer <= 0) return

    // Blinking when invincible
    if (player.invincible > 0 && Math.floor(player.invincible / 3) % 2 === 0) return

    const flip = player.facing === 'left'
    const sx = player.x - camera.x
    const sy = player.y - camera.y

    // Star power glow
    if (player.starPower > 0) {
      this.ctx.save()
      const colors = ['#FFD700', '#FF6600', '#00FF00', '#FF0000']
      this.ctx.shadowColor = colors[Math.floor(Date.now() / 100) % colors.length]!
      this.ctx.shadowBlur = 15
    }

    let sprite: HTMLCanvasElement
    if (player.big) {
      sprite = this.sprites.marioBigStand(flip)
      this.ctx.drawImage(sprite, sx, sy, TILE_SIZE, TILE_SIZE * 2)
    } else {
      if (!player.grounded) {
        sprite = this.sprites.marioSmallJump(flip)
      } else if (Math.abs(player.vx) > 0.5) {
        sprite =
          player.animFrame === 0
            ? this.sprites.marioSmallRun(flip)
            : this.sprites.marioSmallStand(flip)
      } else {
        sprite = this.sprites.marioSmallStand(flip)
      }
      this.ctx.drawImage(sprite, sx, sy, TILE_SIZE, TILE_SIZE)
    }

    if (player.starPower > 0) {
      this.ctx.restore()
    }
  }

  drawEnemies(enemies: Enemy[], camera: Camera) {
    for (const e of enemies) {
      if (!e.active) continue
      const sx = e.x - camera.x
      const sy = e.y - camera.y

      if (sx < -TILE_SIZE || sx > this.width + TILE_SIZE) continue

      let sprite: HTMLCanvasElement

      if (e.type === 'goomba') {
        if (e.state === 'stomped') {
          sprite = this.sprites.goombaFlat()
        } else {
          sprite = this.sprites.goomba(e.animFrame)
        }
      } else {
        // Koopa
        if (e.state === 'shell' || e.state === 'shell_moving') {
          sprite = this.sprites.koopaShell()
        } else {
          sprite = this.sprites.koopa(e.facing === 'left')
        }
      }

      this.ctx.drawImage(sprite, sx, sy, TILE_SIZE, TILE_SIZE)
    }
  }

  drawBoss(boss: Boss, camera: Camera) {
    if (!boss.active) return

    const sx = boss.x - camera.x
    const sy = boss.y - camera.y

    // Flash when invincible
    if (boss.invincible > 0 && Math.floor(boss.invincible / 3) % 2 === 0) return

    // Stunned visual
    if (boss.state === 'stunned') {
      this.ctx.save()
      this.ctx.globalAlpha = 0.7 + Math.sin(Date.now() / 50) * 0.3
    }

    // Charging glow
    if (boss.state === 'charging') {
      this.ctx.save()
      this.ctx.shadowColor = '#FF0000'
      this.ctx.shadowBlur = 20
    }

    const sprite = this.sprites.bowser(boss.animFrame)

    if (boss.facing === 'left') {
      this.ctx.drawImage(sprite, sx, sy, TILE_SIZE * 2, TILE_SIZE * 2)
    } else {
      this.ctx.save()
      this.ctx.translate(sx + TILE_SIZE * 2, sy)
      this.ctx.scale(-1, 1)
      this.ctx.drawImage(sprite, 0, 0, TILE_SIZE * 2, TILE_SIZE * 2)
      this.ctx.restore()
    }

    if (boss.state === 'stunned' || boss.state === 'charging') {
      this.ctx.restore()
    }

    // Draw fireballs
    const fbSprite = this.sprites.tile('fireball')
    for (const fb of boss.fireballs) {
      if (!fb.active) continue
      this.ctx.drawImage(fbSprite, fb.x - camera.x, fb.y - camera.y, 16, 16)
    }
  }

  drawItems(items: Item[], camera: Camera) {
    const coinSprite = this.sprites.tile('coin')
    for (const item of items) {
      if (!item.active) continue
      const sx = item.x - camera.x
      const sy = item.y - camera.y + Math.sin(item.floatOffset) * 3
      this.ctx.drawImage(coinSprite, sx, sy, 20, 20)
    }
  }

  drawScreenShake(intensity: number): { x: number; y: number } {
    if (intensity <= 0) return { x: 0, y: 0 }
    const x = (Math.random() - 0.5) * intensity * 2
    const y = (Math.random() - 0.5) * intensity * 2
    this.ctx.save()
    this.ctx.translate(x, y)
    return { x, y }
  }

  restoreShake() {
    this.ctx.restore()
  }
}
