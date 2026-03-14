import { COLORS, CANVAS_WIDTH, CANVAS_HEIGHT } from '../utils/constants'
import { StarfieldBackground } from './starfield-background'

const TITLE_TEXT = 'ZELDA ADVENTURE'
const SUBTITLE_TEXT = 'The Legend of Hyrule'
const PROMPT_TEXT = 'Nhấn phím bất kỳ để bắt đầu'
const TOUCH_HINT = 'Chạm màn hình để bắt đầu'
const KB_HINT = 'WASD: di chuyển  |  Space: tấn công  |  E: cung  |  F: tương tác'
const SOUND_HINT = 'M: tắt/bật âm thanh'

// Vertical layout anchors (canvas-height-relative)
const TITLE_BASE_Y = CANVAS_HEIGHT * 0.28
const SUBTITLE_OFFSET_Y = 52
const DIVIDER_OFFSET_Y = 76
const PROMPT_Y = CANVAS_HEIGHT * 0.62
const HINT_Y = CANVAS_HEIGHT - 80
const SECONDARY_HINT_Y = CANVAS_HEIGHT - 56
const SOUND_HINT_Y = 20

/** Renders the animated dark-fantasy title screen onto the game canvas. */
export class StartScreenRenderer {
  private starfield = new StarfieldBackground(80)

  /**
   * Draw the start screen.
   * @param ctx   Canvas 2D context
   * @param time  Elapsed time in seconds (e.g. performance.now() / 1000)
   * @param isTouchDevice  Optional — show touch or keyboard control hints
   */
  draw(ctx: CanvasRenderingContext2D, time: number, isTouchDevice = false): void {
    const w = CANVAS_WIDTH
    const h = CANVAS_HEIGHT

    // --- Background ---
    ctx.fillStyle = '#0A0F1A'
    ctx.fillRect(0, 0, w, h)

    // Starfield layer
    this.starfield.draw(ctx, time)

    // Subtle vignette for depth
    const vignette = ctx.createRadialGradient(w / 2, h / 2, w * 0.2, w / 2, h / 2, w * 0.75)
    vignette.addColorStop(0, 'rgba(10, 15, 26, 0.0)')
    vignette.addColorStop(1, 'rgba(0, 0, 0, 0.70)')
    ctx.fillStyle = vignette
    ctx.fillRect(0, 0, w, h)

    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    // --- Title with glow + vertical bob ---
    const titleY = TITLE_BASE_Y + Math.sin(time * 0.8) * 4
    ctx.save()
    ctx.shadowColor = '#FFB830'
    ctx.shadowBlur = 16 + Math.sin(time) * 4
    ctx.fillStyle = '#FFB830'
    ctx.font = 'bold 42px monospace'
    ctx.fillText(TITLE_TEXT, w / 2, titleY)
    ctx.restore()

    // --- Subtitle ---
    ctx.globalAlpha = 0.85
    ctx.fillStyle = COLORS.textSecondary
    ctx.font = '16px monospace'
    ctx.fillText(SUBTITLE_TEXT, w / 2, TITLE_BASE_Y + SUBTITLE_OFFSET_Y)
    ctx.globalAlpha = 1

    // --- Decorative divider ---
    ctx.strokeStyle = COLORS.accentAmber
    ctx.globalAlpha = 0.3
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(w / 2 - 130, TITLE_BASE_Y + DIVIDER_OFFSET_Y)
    ctx.lineTo(w / 2 + 130, TITLE_BASE_Y + DIVIDER_OFFSET_Y)
    ctx.stroke()
    ctx.globalAlpha = 1

    // --- Blinking "press any key" prompt (~1 Hz smooth blink) ---
    const blinkAlpha = 0.5 + 0.5 * Math.sin(time * Math.PI)
    ctx.globalAlpha = blinkAlpha
    ctx.fillStyle = COLORS.textPrimary
    ctx.font = '14px monospace'
    ctx.fillText(PROMPT_TEXT, w / 2, PROMPT_Y)
    ctx.globalAlpha = 1

    // --- Touch / keyboard control hint ---
    ctx.globalAlpha = 0.45
    ctx.fillStyle = COLORS.textSecondary
    ctx.font = '12px monospace'
    ctx.fillText(isTouchDevice ? TOUCH_HINT : KB_HINT, w / 2, HINT_Y)
    ctx.globalAlpha = 1

    // --- Secondary touch hint (joystick reminder for touch) ---
    if (isTouchDevice) {
      ctx.globalAlpha = 0.3
      ctx.fillStyle = COLORS.textSecondary
      ctx.font = '11px monospace'
      ctx.fillText(
        'Joystick: di chuyển  |  Nút A: tấn công  |  Nút B: cung',
        w / 2,
        SECONDARY_HINT_Y,
      )
      ctx.globalAlpha = 1
    }

    // --- Sound toggle hint (top-right, small + dim) ---
    ctx.globalAlpha = 0.35
    ctx.fillStyle = COLORS.textSecondary
    ctx.font = '11px monospace'
    ctx.textAlign = 'right'
    ctx.fillText(SOUND_HINT, w - 12, SOUND_HINT_Y)
    ctx.globalAlpha = 1

    // Reset canvas state
    ctx.textAlign = 'start'
    ctx.textBaseline = 'alphabetic'
    ctx.shadowBlur = 0
    ctx.shadowColor = 'transparent'
  }
}
