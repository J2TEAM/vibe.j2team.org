import { GRAVITY, TILE_SIZE, type AABB } from '../engine/Physics'
import type { Input } from '../engine/Input'
import type { Level } from '../world/Level'
import type { SoundFX } from '../audio/SoundFX'

export class Player {
  x: number
  y: number
  vx = 0
  vy = 0
  width = 28
  height = 30
  big = false
  lives = 3
  score = 0
  coins = 0
  facing: 'left' | 'right' = 'right'
  grounded = false
  dead = false
  invincible = 0 // invincibility frames after hit
  starPower = 0 // star invincibility timer
  animFrame = 0
  animTimer = 0
  deathTimer = 0
  private jumpHeld = false
  private jumpTime = 0
  private maxJumpTime = 12
  private coyoteFrames = 0 // frames since last grounded, allows late jump
  private jumpBuffered = false // buffer jump input for a few frames
  private jumpBufferTimer = 0

  constructor(x: number, y: number) {
    this.x = x * TILE_SIZE
    this.y = y * TILE_SIZE
  }

  get aabb(): AABB {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
    }
  }

  reset(x: number, y: number) {
    this.x = x * TILE_SIZE
    this.y = y * TILE_SIZE
    this.vx = 0
    this.vy = 0
    this.dead = false
    this.big = false
    this.height = 30
    this.invincible = 0
    this.starPower = 0
    this.deathTimer = 0
    this.grounded = false
    this.coyoteFrames = 0
    this.jumpBuffered = false
    this.jumpBufferTimer = 0
    this.jumpHeld = false
  }

  makeBig() {
    if (!this.big) {
      const oldHeight = this.height
      this.big = true
      this.height = 60
      // Keep feet at the same position
      this.y -= this.height - oldHeight
    }
  }

  takeDamage(sfx: SoundFX): boolean {
    if (this.invincible > 0 || this.starPower > 0) return false
    if (this.big) {
      this.big = false
      this.height = 30
      this.invincible = 90
      sfx.hurt()
      return false
    }
    this.die(sfx)
    return true
  }

  die(sfx: SoundFX) {
    this.dead = true
    this.vy = -10
    this.vx = 0
    this.deathTimer = 60
    this.lives--
    sfx.death()
  }

  addScore(points: number) {
    this.score += points
  }

  addCoin(sfx: SoundFX) {
    this.coins++
    this.score += 100
    if (this.coins >= 100) {
      this.coins = 0
      this.lives++
    }
    sfx.coin()
  }

  update(input: Input, level: Level, sfx: SoundFX) {
    if (this.dead) {
      this.vy += GRAVITY
      this.y += this.vy
      this.deathTimer--
      return
    }

    if (this.invincible > 0) this.invincible--
    if (this.starPower > 0) this.starPower--

    // Horizontal movement
    const accel = 0.4
    const maxSpeed = 4.5
    const friction = 0.85

    if (input.left) {
      this.vx -= accel
      this.facing = 'left'
    } else if (input.right) {
      this.vx += accel
      this.facing = 'right'
    } else {
      this.vx *= friction
      if (Math.abs(this.vx) < 0.1) this.vx = 0
    }

    if (this.vx > maxSpeed) this.vx = maxSpeed
    if (this.vx < -maxSpeed) this.vx = -maxSpeed

    // Coyote time: allow jumping a few frames after leaving ground
    if (this.grounded) {
      this.coyoteFrames = 6
    } else {
      if (this.coyoteFrames > 0) this.coyoteFrames--
    }

    // Jump buffer: remember jump press for a few frames
    if (input.jumpJustPressed) {
      this.jumpBuffered = true
      this.jumpBufferTimer = 8
    }
    if (this.jumpBufferTimer > 0) {
      this.jumpBufferTimer--
    } else {
      this.jumpBuffered = false
    }

    // Jumping - variable height with coyote time + buffer
    const canJump = this.grounded || this.coyoteFrames > 0
    if (this.jumpBuffered && canJump) {
      this.vy = -10
      this.jumpHeld = true
      this.jumpTime = 0
      this.grounded = false
      this.coyoteFrames = 0
      this.jumpBuffered = false
      sfx.jump()
    }

    if (this.jumpHeld && input.jump && this.jumpTime < this.maxJumpTime) {
      this.vy -= 0.5
      this.jumpTime++
    } else {
      this.jumpHeld = false
    }

    if (!input.jump) {
      this.jumpHeld = false
    }

    // Gravity
    this.vy += GRAVITY
    if (this.vy > 12) this.vy = 12

    // Move X and resolve collisions
    this.x += this.vx
    this.resolveCollisionX(level)

    // Move Y and resolve collisions
    this.y += this.vy
    this.grounded = false
    this.resolveCollisionY(level, sfx)

    // Check lethal tiles
    const cx = Math.floor((this.x + this.width / 2) / TILE_SIZE)
    const cy = Math.floor((this.y + this.height) / TILE_SIZE)
    if (level.isLethalAt(cx, cy) || level.isLethalAt(cx, cy - 1)) {
      this.die(sfx)
    }

    // Fall off screen
    if (this.y > level.pixelHeight + 100) {
      this.die(sfx)
    }

    // Clamp to level bounds
    if (this.x < 0) {
      this.x = 0
      this.vx = 0
    }
    if (this.x + this.width > level.pixelWidth) {
      this.x = level.pixelWidth - this.width
      this.vx = 0
    }

    // Animation
    this.animTimer++
    if (this.animTimer > 8) {
      this.animTimer = 0
      this.animFrame = (this.animFrame + 1) % 2
    }
  }

  private resolveCollisionX(level: Level) {
    const box = this.aabb
    const top = Math.floor(box.y / TILE_SIZE)
    const bottom = Math.floor((box.y + box.height - 1) / TILE_SIZE)
    const left = Math.floor(box.x / TILE_SIZE)
    const right = Math.floor((box.x + box.width - 1) / TILE_SIZE)

    for (let row = top; row <= bottom; row++) {
      for (let col = left; col <= right; col++) {
        if (level.isSolidAt(col, row)) {
          if (this.vx > 0) {
            this.x = col * TILE_SIZE - this.width
            this.vx = 0
          } else if (this.vx < 0) {
            this.x = (col + 1) * TILE_SIZE
            this.vx = 0
          }
        }
      }
    }
  }

  private resolveCollisionY(level: Level, sfx: SoundFX) {
    const box = this.aabb
    const top = Math.floor(box.y / TILE_SIZE)
    const bottom = Math.floor((box.y + box.height - 1) / TILE_SIZE)
    const left = Math.floor(box.x / TILE_SIZE)
    const right = Math.floor((box.x + box.width - 1) / TILE_SIZE)

    for (let row = top; row <= bottom; row++) {
      for (let col = left; col <= right; col++) {
        if (level.isSolidAt(col, row)) {
          if (this.vy > 0) {
            // Landing on top
            this.y = row * TILE_SIZE - this.height
            this.vy = 0
            this.grounded = true
          } else if (this.vy < 0) {
            // Hitting head on block
            this.y = (row + 1) * TILE_SIZE
            this.vy = 0

            // Check question blocks
            const result = level.hitQuestion(col, row)
            if (result === 'coin') {
              this.addCoin(sfx)
            } else if (result === 'mushroom') {
              sfx.powerUp()
              this.makeBig()
            } else if (result === 'star') {
              sfx.powerUp()
              this.starPower = 600 // 10 seconds at 60fps
            } else if (this.big) {
              // Big Mario breaks bricks
              if (level.breakBrick(col, row)) {
                sfx.brickBreak()
                this.addScore(50)
              } else {
                sfx.bump()
              }
            } else {
              sfx.bump()
            }
          }
        }
      }
    }
  }
}
