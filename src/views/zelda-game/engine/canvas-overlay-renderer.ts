/**
 * canvas-overlay-renderer.ts
 * Canvas-rendered overlays for pause, game_over, and victory states.
 * Replaces Vue HTML overlays with pure Canvas 2D equivalents.
 */

import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from '../utils/constants'
import type { VictoryStats } from '../utils/types'
import { CanvasMenuRenderer } from './canvas-menu-renderer'
import type { MenuButton } from './canvas-menu-renderer'

export class CanvasOverlayRenderer {
  constructor() {}

  /** Pause screen: dark backdrop + centered menu box + 3 buttons */
  drawPause(
    ctx: CanvasRenderingContext2D,
    buttons: MenuButton[],
    selectedIdx: number,
    t: number,
  ): void {
    CanvasMenuRenderer.drawBackdrop(ctx, 0.85)

    const bw = 280
    const bh = 200
    const bx = CANVAS_WIDTH / 2 - bw / 2
    const by = CANVAS_HEIGHT / 2 - bh / 2

    CanvasMenuRenderer.drawMenuBox(ctx, bx, by, bw, bh)

    // Title
    CanvasMenuRenderer.drawTitle(ctx, '\u23F8 T\u1EA0M D\u1EEBNG', by + 38)

    // Buttons
    for (let i = 0; i < buttons.length; i++) {
      const btn = buttons[i]
      if (!btn) continue
      const state = i === selectedIdx ? 'hover' : 'normal'
      CanvasMenuRenderer.drawButton(ctx, btn, state, i === 0)
    }

    // Blinking cursor on selected button
    if (selectedIdx >= 0 && selectedIdx < buttons.length) {
      const btn = buttons[selectedIdx]
      if (btn) CanvasMenuRenderer.drawBlinkingCursor(ctx, btn.x - 14, btn.y + btn.h / 2, t)
    }
  }

  /** Game Over screen: near-black backdrop + red title + 2 buttons */
  drawGameOver(
    ctx: CanvasRenderingContext2D,
    buttons: MenuButton[],
    selectedIdx: number,
    t: number,
  ): void {
    CanvasMenuRenderer.drawBackdrop(ctx, 0.9)

    const cx = CANVAS_WIDTH / 2
    const cy = CANVAS_HEIGHT / 2

    // Title
    ctx.save()
    ctx.font = 'bold 36px monospace'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.shadowBlur = 12
    ctx.shadowColor = '#EF4444'
    ctx.fillStyle = '#EF4444'
    ctx.fillText('TR\u00D2 CH\u01A0I K\u1EBET TH\u00DAC', cx, cy - 60)
    ctx.shadowBlur = 0
    ctx.restore()

    // Subtitle
    CanvasMenuRenderer.drawText(ctx, 'Link \u0111\u00E3 ng\u00E3 xu\u1ED1ng...', cx, cy - 22, {
      color: COLORS.textSecondary,
      font: '14px monospace',
      align: 'center',
    })

    // Buttons
    for (let i = 0; i < buttons.length; i++) {
      const btn = buttons[i]
      if (!btn) continue
      const state = i === selectedIdx ? 'hover' : 'normal'
      CanvasMenuRenderer.drawButton(ctx, btn, state, i === 0)
    }

    if (selectedIdx >= 0 && selectedIdx < buttons.length) {
      const btn = buttons[selectedIdx]
      if (btn) CanvasMenuRenderer.drawBlinkingCursor(ctx, btn.x - 14, btn.y + btn.h / 2, t)
    }
  }

  /** Victory screen: semi-dark backdrop + amber box + stats + 2 buttons */
  drawVictory(
    ctx: CanvasRenderingContext2D,
    stats: VictoryStats,
    buttons: MenuButton[],
    selectedIdx: number,
    t: number,
  ): void {
    CanvasMenuRenderer.drawBackdrop(ctx, 0.82)

    const cx = CANVAS_WIDTH / 2
    const cy = CANVAS_HEIGHT / 2

    const bw = 360
    const bh = 320
    const bx = cx - bw / 2
    const by = cy - bh / 2

    CanvasMenuRenderer.drawMenuBox(ctx, bx, by, bw, bh)

    // Title with glow
    ctx.save()
    ctx.font = 'bold 30px monospace'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.shadowBlur = 16
    ctx.shadowColor = COLORS.accentAmber
    ctx.fillStyle = COLORS.accentAmber
    ctx.fillText('\u{1F3C6} CHI\u1EECN TH\u1EAENG!', cx, by + 44)
    ctx.shadowBlur = 0
    ctx.restore()

    // Subtitle
    CanvasMenuRenderer.drawText(
      ctx,
      'Hyrule \u0111\u00E3 \u0111\u01B0\u1EE3c c\u1EE9u!',
      cx,
      by + 78,
      {
        color: COLORS.accentCoral,
        font: '15px monospace',
        align: 'center',
      },
    )

    // Stats grid (3 cols)
    const statsY = by + 115
    const colW = bw / 3
    const statsCols = [
      {
        icon: '\u23F1',
        value: CanvasOverlayRenderer.formatTime(stats.totalTime),
        label: 'TH\u1EDEI GIAN',
      },
      { icon: '\u2694', value: String(stats.enemiesDefeated), label: 'TI\u00CAU DI\u1EC6T' },
      {
        icon: '\uD83D\uDC94',
        value: String(stats.damageTaken),
        label: 'S\u00C1T TH\u01B0\u01A0NG',
      },
    ]

    for (let i = 0; i < statsCols.length; i++) {
      const col = statsCols[i]
      if (!col) continue
      const colX = bx + colW * i + colW / 2

      CanvasMenuRenderer.drawText(ctx, col.icon, colX, statsY, {
        font: '20px monospace',
        align: 'center',
        color: COLORS.accentAmber,
      })
      CanvasMenuRenderer.drawText(ctx, col.value, colX, statsY + 30, {
        font: 'bold 16px monospace',
        align: 'center',
        color: COLORS.textPrimary,
      })
      CanvasMenuRenderer.drawText(ctx, col.label, colX, statsY + 52, {
        font: '11px monospace',
        align: 'center',
        color: COLORS.textSecondary,
      })
    }

    // Divider
    ctx.save()
    ctx.strokeStyle = COLORS.accentAmber
    ctx.globalAlpha = 0.25
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(bx + 16, statsY + 70)
    ctx.lineTo(bx + bw - 16, statsY + 70)
    ctx.stroke()
    ctx.restore()

    // Buttons
    for (let i = 0; i < buttons.length; i++) {
      const btn = buttons[i]
      if (!btn) continue
      const state = i === selectedIdx ? 'hover' : 'normal'
      CanvasMenuRenderer.drawButton(ctx, btn, state, i === 0)
    }

    if (selectedIdx >= 0 && selectedIdx < buttons.length) {
      const btn = buttons[selectedIdx]
      if (btn) CanvasMenuRenderer.drawBlinkingCursor(ctx, btn.x - 14, btn.y + btn.h / 2, t)
    }
  }

  /** Format seconds to m:ss */
  static formatTime(sec: number): string {
    const m = Math.floor(sec / 60)
    const s = Math.floor(sec % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }
}
