/**
 * canvas-menu-renderer.ts
 * Shared Zelda-style (ALTTP/GBA) canvas menu primitives.
 * Pure Canvas 2D — zero external deps.
 */

import { COLORS, CANVAS_WIDTH, CANVAS_HEIGHT } from '../utils/constants'
import { toCanvasCoords } from './canvas-utils'

export interface MenuButton {
  x: number
  y: number
  w: number
  h: number
  label: string
  action: string
}

export type ButtonState = 'normal' | 'hover' | 'pressed'

export class CanvasMenuRenderer {
  /** Full-canvas dark semi-transparent overlay. */
  static drawBackdrop(ctx: CanvasRenderingContext2D, alpha = 0.85): void {
    ctx.save()
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.fillStyle = `rgba(15,25,35,${alpha})`
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
    ctx.restore()
  }

  /** Zelda-style bordered box: amber outline, pixel corner brackets, inner shadow. */
  static drawMenuBox(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
  ): void {
    ctx.save()
    ctx.imageSmoothingEnabled = false

    // Background
    ctx.globalAlpha = 0.9
    ctx.fillStyle = COLORS.bgDeep
    ctx.fillRect(x, y, w, h)
    ctx.globalAlpha = 1

    // Amber border
    ctx.strokeStyle = COLORS.accentAmber
    ctx.lineWidth = 2
    ctx.strokeRect(x + 1, y + 1, w - 2, h - 2)

    // Inner shadow
    ctx.strokeStyle = 'rgba(255,255,255,0.05)'
    ctx.lineWidth = 1
    ctx.strokeRect(x + 3, y + 3, w - 6, h - 6)

    // Corner L-brackets (6px arms)
    const A = 6
    ctx.strokeStyle = COLORS.accentAmber
    ctx.lineWidth = 2
    for (const [cx, cy, dx, dy] of [
      [x, y, 1, 1],
      [x + w, y, -1, 1],
      [x, y + h, 1, -1],
      [x + w, y + h, -1, -1],
    ] as [number, number, number, number][]) {
      ctx.beginPath()
      ctx.moveTo(cx + dx * A, cy)
      ctx.lineTo(cx, cy)
      ctx.lineTo(cx, cy + dy * A)
      ctx.stroke()
    }
    ctx.restore()
  }

  /** Button with label, state-based colors. isPrimary gives slightly brighter fill. */
  static drawButton(
    ctx: CanvasRenderingContext2D,
    btn: MenuButton,
    state: ButtonState,
    isPrimary = false,
  ): void {
    ctx.save()
    ctx.imageSmoothingEnabled = false
    const { x, w, h } = btn
    const y = btn.y + (state === 'pressed' ? 1 : 0)

    // Base fill
    ctx.globalAlpha = state === 'hover' ? 1.0 : isPrimary ? 0.9 : 0.8
    ctx.fillStyle = state === 'normal' && !isPrimary ? COLORS.bgSurface : COLORS.bgElevated
    ctx.fillRect(x, y, w, h)

    // Amber tint overlay
    if (state !== 'normal') {
      ctx.globalAlpha = state === 'pressed' ? 0.3 : 0.15
      ctx.fillStyle = COLORS.accentAmber
      ctx.fillRect(x, y, w, h)
    }
    ctx.globalAlpha = 1

    // Border
    ctx.strokeStyle = COLORS.accentAmber
    ctx.globalAlpha = state === 'normal' ? 0.5 : 1.0
    ctx.lineWidth = 1.5
    ctx.strokeRect(x + 0.75, y + 0.75, w - 1.5, h - 1.5)
    ctx.globalAlpha = 1

    // Centered label
    ctx.fillStyle = state === 'normal' ? COLORS.textSecondary : COLORS.textPrimary
    ctx.font = '14px monospace'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(btn.label, x + w / 2, y + h / 2)
    ctx.restore()
  }

  /** Centered title with amber glow. */
  static drawTitle(ctx: CanvasRenderingContext2D, text: string, y: number, size = 24): void {
    ctx.save()
    ctx.font = `bold ${size}px monospace`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.shadowBlur = 8
    ctx.shadowColor = COLORS.accentAmber
    ctx.fillStyle = COLORS.accentAmber
    ctx.fillText(text, CANVAS_WIDTH / 2, y)
    ctx.shadowBlur = 0
    ctx.restore()
  }

  /** ▶ selector cursor whose alpha oscillates via sin wave. */
  static drawBlinkingCursor(ctx: CanvasRenderingContext2D, x: number, y: number, t: number): void {
    ctx.save()
    ctx.globalAlpha = 0.4 + 0.6 * Math.abs(Math.sin(t * Math.PI))
    ctx.fillStyle = COLORS.accentAmber
    ctx.font = '14px monospace'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('▶', x, y)
    ctx.restore()
  }

  /** General text helper. */
  static drawText(
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    opts?: {
      color?: string
      font?: string
      align?: CanvasTextAlign
      baseline?: CanvasTextBaseline
      alpha?: number
    },
  ): void {
    ctx.save()
    ctx.fillStyle = opts?.color ?? COLORS.textPrimary
    ctx.font = opts?.font ?? '13px monospace'
    ctx.textAlign = opts?.align ?? 'left'
    ctx.textBaseline = opts?.baseline ?? 'middle'
    if (opts?.alpha !== undefined) ctx.globalAlpha = opts.alpha
    ctx.fillText(text, x, y)
    ctx.restore()
  }

  /** AABB hit-test: returns button index or -1. */
  static hitTest(buttons: MenuButton[], mx: number, my: number): number {
    for (let i = 0; i < buttons.length; i++) {
      const btn = buttons[i]
      if (!btn) continue
      const { x, y, w, h } = btn
      if (mx >= x && mx <= x + w && my >= y && my <= y + h) return i
    }
    return -1
  }
}

export { toCanvasCoords }
