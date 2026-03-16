import { CANVAS_HEIGHT } from '../utils/constants'
import type { Input } from './Input'

interface TouchActionButton {
  cx: number
  cy: number
  r: number
  label: string
  action: string
  pressed: boolean
  touchId: number
}

// Joystick thumb visual radius (px)
const JOYSTICK_THUMB_RADIUS = 20

/** Renders virtual joystick + action buttons on canvas; handles touch events for mobile play. */
export class CanvasTouchControlsRenderer {
  private readonly joystick = {
    cx: 90,
    cy: CANVAS_HEIGHT - 90,
    outerRadius: 56,
    thumbX: 0,
    thumbY: 0,
    touchId: -1,
  }

  private buttons: TouchActionButton[]

  constructor(private input: Input) {
    this.buttons = this.buildButtons()
  }

  private buildButtons(): TouchActionButton[] {
    // Bottom-right, two rows: attack+ranged above, block+interact+pause below
    const btns: TouchActionButton[] = [
      { cx: 700, cy: 480, r: 26, label: '\u2694', action: 'attack', pressed: false, touchId: -1 },
      {
        cx: 752,
        cy: 480,
        r: 26,
        label: '\uD83C\uDFF9',
        action: 'ranged',
        pressed: false,
        touchId: -1,
      },
      {
        cx: 680,
        cy: 530,
        r: 26,
        label: '\uD83D\uDEE1',
        action: 'block',
        pressed: false,
        touchId: -1,
      },
      {
        cx: 730,
        cy: 530,
        r: 26,
        label: '\uD83D\uDCAC',
        action: 'interact',
        pressed: false,
        touchId: -1,
      },
      { cx: 775, cy: 530, r: 22, label: '\u23F8', action: 'pause', pressed: false, touchId: -1 },
    ]
    return btns
  }

  /** Draw joystick + action buttons onto ctx. hasWeapons controls whether weapon buttons show. */
  draw(ctx: CanvasRenderingContext2D, hasWeapons: boolean): void {
    this.drawJoystick(ctx)
    this.drawButtons(ctx, hasWeapons)
  }

  private drawJoystick(ctx: CanvasRenderingContext2D): void {
    const { cx, cy, outerRadius, thumbX, thumbY } = this.joystick
    ctx.save()
    // Outer ring
    ctx.beginPath()
    ctx.arc(cx, cy, outerRadius, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(255,255,255,0.06)'
    ctx.fill()
    ctx.strokeStyle = 'rgba(255,255,255,0.22)'
    ctx.lineWidth = 2
    ctx.stroke()
    // Thumb — offset from center by current drag delta
    const tx = cx + thumbX
    const ty = cy + thumbY
    ctx.beginPath()
    ctx.arc(tx, ty, JOYSTICK_THUMB_RADIUS, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(255,107,74,0.55)'
    ctx.fill()
    ctx.strokeStyle = 'rgba(255,255,255,0.3)'
    ctx.lineWidth = 1.5
    ctx.stroke()

    ctx.restore()
  }

  private drawButtons(ctx: CanvasRenderingContext2D, hasWeapons: boolean): void {
    ctx.save()
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    for (const btn of this.buttons) {
      const isWeaponBtn =
        btn.action === 'attack' || btn.action === 'block' || btn.action === 'ranged'
      if (isWeaponBtn && !hasWeapons) continue
      ctx.beginPath()
      ctx.arc(btn.cx, btn.cy, btn.r, 0, Math.PI * 2)
      ctx.fillStyle = btn.pressed ? 'rgba(255,107,74,0.52)' : 'rgba(0,0,0,0.38)'
      ctx.fill()
      ctx.strokeStyle = btn.pressed ? 'rgba(255,184,48,0.6)' : 'rgba(255,255,255,0.18)'
      ctx.lineWidth = 1.5
      ctx.stroke()
      ctx.font = `bold ${Math.round(btn.r * 0.65)}px monospace`
      ctx.fillStyle = btn.pressed ? '#FFFFFF' : 'rgba(255,255,255,0.75)'
      ctx.fillText(btn.label, btn.cx, btn.cy)
    }
    ctx.restore()
  }

  /** Returns true if touch (canvas-space cx/cy) was consumed by a control. */
  handleTouchStart(touchId: number, cx: number, cy: number): boolean {
    const j = this.joystick
    const dx = cx - j.cx
    const dy = cy - j.cy
    if (Math.sqrt(dx * dx + dy * dy) <= j.outerRadius) {
      j.touchId = touchId
      this.updateJoystickThumb(dx, dy)
      return true
    }

    for (const btn of this.buttons) {
      const bx = cx - btn.cx
      const by = cy - btn.cy
      if (Math.sqrt(bx * bx + by * by) <= btn.r) {
        btn.pressed = true
        btn.touchId = touchId
        this.input.setTouchAction(btn.action as Parameters<Input['setTouchAction']>[0], true)
        return true
      }
    }

    return false
  }

  /** Handle touch move. cx, cy are in canvas-space coordinates. */
  handleTouchMove(touchId: number, cx: number, cy: number): void {
    const j = this.joystick
    if (j.touchId === touchId) {
      const dx = cx - j.cx
      const dy = cy - j.cy
      this.updateJoystickThumb(dx, dy)
    }
  }

  /** Handle touch end or cancel. */
  handleTouchEnd(touchId: number): void {
    const j = this.joystick
    if (j.touchId === touchId) {
      j.touchId = -1
      j.thumbX = 0
      j.thumbY = 0
      this.input.setTouchDirection(0, 0)
    }

    for (const btn of this.buttons) {
      if (btn.touchId === touchId) {
        btn.pressed = false
        btn.touchId = -1
        this.input.setTouchAction(btn.action as Parameters<Input['setTouchAction']>[0], false)
      }
    }
  }

  private updateJoystickThumb(dx: number, dy: number): void {
    const j = this.joystick
    const dist = Math.sqrt(dx * dx + dy * dy)
    if (dist === 0) {
      j.thumbX = 0
      j.thumbY = 0
      this.input.setTouchDirection(0, 0)
      return
    }
    const nx = dx / dist
    const ny = dy / dist
    const clamp = Math.min(dist, j.outerRadius)
    j.thumbX = nx * clamp
    j.thumbY = ny * clamp
    this.input.setTouchDirection(nx, ny)
  }

  /** Reset all touch state (e.g. when game leaves playing state). */
  reset(): void {
    const j = this.joystick
    j.touchId = -1
    j.thumbX = 0
    j.thumbY = 0
    this.input.setTouchDirection(0, 0)
    for (const btn of this.buttons) {
      if (btn.pressed) {
        btn.pressed = false
        btn.touchId = -1
        this.input.setTouchAction(btn.action as Parameters<Input['setTouchAction']>[0], false)
      }
    }
  }
}
