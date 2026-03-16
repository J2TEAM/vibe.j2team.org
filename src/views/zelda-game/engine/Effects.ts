import type { Particle, ParticleEmitConfig, ScreenEffect, DamagePopup } from '../utils/types'
import {
  MAX_PARTICLES,
  MAX_POPUPS,
  HIT_FREEZE_FRAMES,
  POPUP_RISE_SPEED,
  POPUP_LIFE,
  POPUP_FONT_SIZE,
} from '../utils/constants'

export class Effects {
  // --- Particle Pool ---
  private particles: Particle[]

  // --- Screen Effects Queue ---
  private screenEffects: ScreenEffect[] = []
  private freezeFrames = 0

  // --- Damage Popups ---
  private popups: DamagePopup[]

  private pendingReset = false

  constructor() {
    this.particles = Array.from({ length: MAX_PARTICLES }, () => ({
      active: false,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      life: 0,
      maxLife: 1,
      size: 0,
      color: '#fff',
      gravity: 0,
      alpha: 1,
      decay: 1,
      shrink: 0,
    }))

    this.popups = Array.from({ length: MAX_POPUPS }, () => ({
      active: false,
      x: 0,
      y: 0,
      vy: 0,
      text: '',
      color: '#fff',
      alpha: 1,
      life: 0,
      maxLife: 1,
    }))
  }

  // --- Public API ---

  emit(config: ParticleEmitConfig): void {
    const spread = config.spread ?? Math.PI * 2
    const baseAngle = config.baseAngle ?? 0
    let spawned = 0
    for (const p of this.particles) {
      if (spawned >= config.count) break
      if (p.active) continue
      const angle = baseAngle + (Math.random() - 0.5) * spread
      const speed = Math.random() * config.speed
      p.active = true
      p.x = config.x
      p.y = config.y
      p.vx = Math.cos(angle) * speed
      p.vy = Math.sin(angle) * speed
      p.life = config.life * (0.7 + Math.random() * 0.3)
      p.maxLife = p.life
      p.size = config.size * (0.6 + Math.random() * 0.4)
      p.color = config.colors[Math.floor(Math.random() * config.colors.length)] ?? '#fff'
      p.gravity = config.gravity ?? 0
      p.alpha = 1
      p.decay = 1 / p.maxLife
      p.shrink = config.shrink ?? 0
      p.tag = config.tag
      spawned++
    }
  }

  hitFreeze(frames = HIT_FREEZE_FRAMES): void {
    this.freezeFrames = Math.max(this.freezeFrames, frames)
  }

  screenFlash(color: string, duration: number): void {
    const existing = this.screenEffects.find((e) => e.type === 'flash' && e.color === color)
    if (existing) {
      existing.timer = 0
      existing.alpha = 1
      return
    }
    if (this.screenEffects.length >= 4) return
    this.screenEffects.push({
      type: 'flash',
      timer: 0,
      duration,
      color,
      alpha: 1,
      phase: 'out',
    })
  }

  screenFade(
    color: string,
    halfDuration: number,
    onMidpoint?: () => void,
    onComplete?: () => void,
  ): void {
    for (let i = this.screenEffects.length - 1; i >= 0; i--) {
      const effect = this.screenEffects[i]
      if (effect && effect.type === 'fade') {
        effect.onComplete?.()
        this.screenEffects.splice(i, 1)
      }
    }
    this.screenEffects.push({
      type: 'fade',
      timer: 0,
      duration: halfDuration * 2,
      color,
      alpha: 0,
      phase: 'in',
      onMidpoint,
      onComplete,
    })
  }

  spawnPopup(x: number, y: number, text: string, color = '#fff'): void {
    for (const p of this.popups) {
      if (p.active) continue
      p.active = true
      p.x = x + (Math.random() - 0.5) * 10
      p.y = y
      p.vy = -POPUP_RISE_SPEED
      p.text = text
      p.color = color
      p.alpha = 1
      p.life = POPUP_LIFE
      p.maxLife = POPUP_LIFE
      break
    }
  }

  consumeFreeze(): boolean {
    if (this.freezeFrames > 0) {
      this.freezeFrames--
      return true
    }
    return false
  }

  update(dt: number): void {
    for (const p of this.particles) {
      if (!p.active) continue
      p.life -= dt
      if (p.life <= 0) {
        p.active = false
        continue
      }
      p.vy += p.gravity * dt
      p.x += p.vx * dt
      p.y += p.vy * dt
      p.alpha = Math.max(0, p.life / p.maxLife)
      p.size = Math.max(0, p.size - p.shrink * dt)
    }

    for (const p of this.popups) {
      if (!p.active) continue
      p.life -= dt
      if (p.life <= 0) {
        p.active = false
        continue
      }
      p.y += p.vy * dt
      p.alpha = Math.max(0, p.life / p.maxLife)
    }

    for (let i = this.screenEffects.length - 1; i >= 0; i--) {
      const e = this.screenEffects[i]
      if (!e) continue
      e.timer += dt
      if (e.type === 'flash') {
        e.alpha = Math.max(0, 1 - e.timer / e.duration)
        if (e.timer >= e.duration) {
          e.onComplete?.()
          this.screenEffects.splice(i, 1)
        }
      } else if (e.type === 'fade') {
        const half = e.duration / 2
        if (e.phase === 'in') {
          e.alpha = Math.min(1, e.timer / half)
          if (e.timer >= half) {
            e.phase = 'out'
            e.onMidpoint?.()
            e.onMidpoint = undefined
          }
        } else {
          e.alpha = Math.max(0, 1 - (e.timer - half) / half)
          if (e.timer >= e.duration) {
            e.onComplete?.()
            this.screenEffects.splice(i, 1)
          }
        }
      }
    }

    if (this.pendingReset) this.applyReset()
  }

  drawWorld(ctx: CanvasRenderingContext2D): void {
    let anyActive = false
    for (const p of this.particles) {
      if (!p.active) continue
      anyActive = true
      ctx.globalAlpha = p.alpha
      ctx.fillStyle = p.color
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size)
    }
    if (anyActive) ctx.globalAlpha = 1
  }

  drawScreen(
    ctx: CanvasRenderingContext2D,
    canvasW: number,
    canvasH: number,
    cameraX = 0,
    cameraY = 0,
  ): void {
    let hasPopups = false
    for (const p of this.popups) {
      if (!p.active) continue
      hasPopups = true
      ctx.globalAlpha = p.alpha
      ctx.fillStyle = p.color
      ctx.font = `bold ${POPUP_FONT_SIZE}px monospace`
      ctx.textAlign = 'center'
      ctx.fillText(p.text, p.x - cameraX, p.y - cameraY)
    }
    if (hasPopups) {
      ctx.globalAlpha = 1
      ctx.textAlign = 'start'
    }

    for (const e of this.screenEffects) {
      if (e.type === 'freeze') continue
      ctx.globalAlpha = e.alpha
      ctx.fillStyle = e.color
      ctx.fillRect(0, 0, canvasW, canvasH)
    }
    ctx.globalAlpha = 1
  }

  isFading(): boolean {
    return this.screenEffects.some((e) => e.type === 'fade')
  }

  /** Returns ratio of active particles to pool size — for watermark checks */
  getPoolStats(): { active: number; total: number; popups: number; screenFx: number } {
    let active = 0
    for (const p of this.particles) {
      if (p.active) active++
    }
    let popups = 0
    for (const p of this.popups) {
      if (p.active) popups++
    }
    return { active, total: this.particles.length, popups, screenFx: this.screenEffects.length }
  }

  /**
   * Continuously replenish ambient particles in the camera viewport.
   * Uses tag='ambient' to count existing ambient particles (Red Team #15).
   * Spawns at most 2 per call to avoid burst.
   */
  emitAmbient(
    camera: { viewport: { x: number; y: number; width: number; height: number } },
    colors: string[],
    count: number,
    config: { speed?: number; life?: number; size?: number; gravity?: number; shrink?: number },
  ): void {
    // Count by tag — not by color, to avoid overlap with combat particles (Red Team #15)
    let active = 0
    for (const p of this.particles) {
      if (p.active && p.tag === 'ambient') active++
    }

    const deficit = count - active
    if (deficit <= 0) return

    const toSpawn = Math.min(deficit, 2)
    for (let i = 0; i < toSpawn; i++) {
      this.emit({
        x: camera.viewport.x + Math.random() * camera.viewport.width,
        y: camera.viewport.y + Math.random() * camera.viewport.height,
        count: 1,
        speed: config.speed ?? 15,
        life: config.life ?? 4 + Math.random() * 3,
        size: config.size ?? 2,
        colors,
        gravity: config.gravity ?? 0,
        shrink: config.shrink ?? 0,
        tag: 'ambient',
      })
    }
  }

  reset(): void {
    this.pendingReset = true
  }

  private applyReset(): void {
    for (const p of this.particles) p.active = false
    for (const p of this.popups) p.active = false
    this.screenEffects.length = 0
    this.freezeFrames = 0
    this.pendingReset = false
  }
}
