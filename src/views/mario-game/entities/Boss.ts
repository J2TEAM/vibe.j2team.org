import { TILE_SIZE, type AABB, overlaps } from '../engine/Physics'
import type { Level } from '../world/Level'
import type { SoundFX } from '../audio/SoundFX'

interface Fireball {
  x: number
  y: number
  vx: number
  vy: number
  active: boolean
}

export class Boss {
  x: number
  y: number
  vx = 0
  vy = 0
  width = 56
  height = 56
  hp = 3
  maxHp = 3
  phase = 1
  active = false
  defeated = false
  facing: 'left' | 'right' = 'left'
  state: 'idle' | 'walking' | 'charging' | 'stunned' | 'fireball' | 'ground_pound' = 'idle'
  stateTimer = 0
  stunTimer = 0
  fireballs: Fireball[] = []
  invincible = 0
  animFrame = 0
  animTimer = 0
  defeatTimer = 0
  shakeIntensity = 0

  constructor() {
    this.x = 0
    this.y = 0
  }

  get aabb(): AABB {
    return { x: this.x, y: this.y, width: this.width, height: this.height }
  }

  spawn(x: number, y: number) {
    this.x = x * TILE_SIZE
    this.y = y * TILE_SIZE - this.height + TILE_SIZE
    this.active = true
    this.hp = 3
    this.phase = 1
    this.state = 'walking'
    this.stateTimer = 120
    this.vx = -1.5
  }

  get isVulnerable(): boolean {
    return this.invincible <= 0
  }

  get isStunned(): boolean {
    return this.state === 'stunned'
  }

  hit(sfx: SoundFX): boolean {
    if (!this.isVulnerable) return false
    this.hp--
    this.invincible = 60
    this.phase = this.maxHp - this.hp + 1
    sfx.bossHit()

    if (this.hp <= 0) {
      this.defeated = true
      this.defeatTimer = 120
      this.vx = 0
      this.vy = 0
      sfx.bossDefeat()
      return true
    }

    this.state = 'walking'
    this.stateTimer = 90
    return false
  }

  update(level: Level, playerX: number, playerY: number, sfx: SoundFX) {
    if (!this.active) return
    if (this.defeated) {
      this.defeatTimer--
      this.vy += 0.3
      this.y += this.vy
      this.shakeIntensity = Math.max(0, this.shakeIntensity - 0.1)
      return
    }

    if (this.invincible > 0) this.invincible--

    // Face player
    this.facing = playerX < this.x ? 'left' : 'right'

    // Phase-based speed multiplier
    const speedMult = 1 + (this.phase - 1) * 0.3

    this.stateTimer--

    switch (this.state) {
      case 'walking':
        this.vx = (this.facing === 'left' ? -1.5 : 1.5) * speedMult
        if (this.stateTimer <= 0) {
          // Decide next action — charge available in all phases
          const roll = Math.random()
          const chargeChance = this.phase >= 3 ? 0.4 : this.phase >= 2 ? 0.3 : 0.25
          if (roll < chargeChance) {
            this.state = 'charging'
            this.stateTimer = 60
            sfx.bossRoar()
          } else if (this.phase >= 2 && roll < chargeChance + 0.25) {
            this.state = 'ground_pound'
            this.stateTimer = 40
            this.vy = -12
            sfx.bossRoar()
          } else {
            this.state = 'fireball'
            this.stateTimer = this.phase >= 3 ? 20 : 40
          }
        }
        break

      case 'fireball':
        this.vx = 0
        if (this.stateTimer <= 0) {
          this.shootFireball(sfx)
          if (this.phase >= 3) {
            // Rapid fire in phase 3
            this.shootFireball(sfx)
          }
          this.state = 'walking'
          this.stateTimer = 60 / speedMult
        }
        break

      case 'charging':
        this.vx = (this.facing === 'left' ? -5 : 5) * speedMult
        if (this.stateTimer <= 0) {
          // Charge into wall = stunned
          this.state = 'stunned'
          this.stunTimer = 90
          this.stateTimer = 90
          this.vx = 0
          this.shakeIntensity = 3
          sfx.bump()
        }
        break

      case 'ground_pound':
        if (this.stateTimer <= 0 && this.vy >= 0) {
          // Landing
          this.state = 'walking'
          this.stateTimer = 60
          this.shakeIntensity = 5
        }
        break

      case 'stunned':
        this.vx = 0
        this.stunTimer--
        if (this.stunTimer <= 0) {
          this.state = 'walking'
          this.stateTimer = 60
        }
        break
    }

    // Gravity
    this.vy += 0.5
    if (this.vy > 10) this.vy = 10

    // Move
    this.x += this.vx
    this.y += this.vy

    // Floor collision
    const footRow = Math.floor((this.y + this.height) / TILE_SIZE)
    for (
      let col = Math.floor(this.x / TILE_SIZE);
      col <= Math.floor((this.x + this.width) / TILE_SIZE);
      col++
    ) {
      if (level.isSolidAt(col, footRow)) {
        this.y = footRow * TILE_SIZE - this.height
        this.vy = 0
      }
    }

    // Wall collision
    const leftCol = Math.floor(this.x / TILE_SIZE)
    const rightCol = Math.floor((this.x + this.width) / TILE_SIZE)
    const midRow = Math.floor((this.y + this.height / 2) / TILE_SIZE)

    if (level.isSolidAt(leftCol, midRow) && this.vx < 0) {
      this.x = (leftCol + 1) * TILE_SIZE
      if (this.state === 'charging') {
        this.state = 'stunned'
        this.stunTimer = 90
        this.stateTimer = 90
        this.shakeIntensity = 5
        sfx.bump()
      }
      this.vx = 0
    }
    if (level.isSolidAt(rightCol, midRow) && this.vx > 0) {
      this.x = rightCol * TILE_SIZE - this.width
      if (this.state === 'charging') {
        this.state = 'stunned'
        this.stunTimer = 90
        this.stateTimer = 90
        this.shakeIntensity = 5
        sfx.bump()
      }
      this.vx = 0
    }

    // Update fireballs
    for (const fb of this.fireballs) {
      if (!fb.active) continue
      fb.x += fb.vx
      fb.y += fb.vy
      fb.vy += 0.15

      // Check if fireball is out of bounds or hits solid
      const fc = Math.floor(fb.x / TILE_SIZE)
      const fr = Math.floor(fb.y / TILE_SIZE)
      if (
        level.isSolidAt(fc, fr) ||
        fb.x < 0 ||
        fb.x > level.pixelWidth ||
        fb.y > level.pixelHeight
      ) {
        fb.active = false
      }
    }

    this.fireballs = this.fireballs.filter((f) => f.active)

    // Shake decay
    this.shakeIntensity = Math.max(0, this.shakeIntensity - 0.05)

    // Animation
    this.animTimer++
    if (this.animTimer > 12) {
      this.animTimer = 0
      this.animFrame = (this.animFrame + 1) % 2
    }
  }

  private shootFireball(sfx: SoundFX) {
    const dir = this.facing === 'left' ? -1 : 1
    this.fireballs.push({
      x: this.x + (dir > 0 ? this.width : -16),
      y: this.y + this.height / 2 - 8,
      vx: dir * 4,
      vy: -1,
      active: true,
    })
    sfx.fireball()
  }

  fireballHitsPlayer(playerAABB: AABB): boolean {
    for (const fb of this.fireballs) {
      if (!fb.active) continue
      const fbBox: AABB = { x: fb.x, y: fb.y, width: 16, height: 16 }
      if (overlaps(fbBox, playerAABB)) {
        fb.active = false
        return true
      }
    }
    return false
  }
}
