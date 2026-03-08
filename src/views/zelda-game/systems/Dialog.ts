import {
  COLORS,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  DIALOG_SLIDE_IN,
  DIALOG_SLIDE_OUT,
} from '../utils/constants'
import type { DialogLine, InputState } from '../utils/types'

const CHARS_PER_SEC = 30
const BLINK_PERIOD = 0.5 // seconds per blink cycle

export class Dialog {
  private queue: DialogLine[] = []
  private currentIndex = 0
  private charIndex = 0
  private charTimer = 0
  private autoTimer = 0
  private active = false
  private onComplete?: () => void

  private blinkTimer = 0
  private blinkVisible = true
  private justSkipped = false

  // Slide animation state
  private slideProgress = 0 // 0 = hidden below, 1 = fully visible
  private slideDir: 'in' | 'out' | 'none' = 'none'
  private slideCallback?: () => void

  show(lines: DialogLine[], onComplete?: () => void): void {
    if (this.slideDir === 'out') return // reject show() during active slide-out
    this.queue = [...lines]
    this.currentIndex = 0
    this.charIndex = 0
    this.charTimer = 0
    this.autoTimer = 0
    this.active = true
    this.onComplete = onComplete
    this.blinkTimer = 0
    this.blinkVisible = true
    this.justSkipped = false
    this.slideProgress = 0
    this.slideDir = 'in'
  }

  /** Returns true while visible OR animating (blocks game input during slide-out). */
  isActive(): boolean {
    return this.active || this.slideDir !== 'none'
  }

  skip(): void {
    const line = this.queue[this.currentIndex]
    if (line) this.charIndex = line.text.length
  }

  update(dt: number, input: InputState): void {
    // Process slide-in animation
    if (this.slideDir === 'in') {
      this.slideProgress = Math.min(1, this.slideProgress + dt / DIALOG_SLIDE_IN)
      if (this.slideProgress >= 1) this.slideDir = 'none'
    }

    // Process slide-out animation — blocks all dialog logic until complete
    if (this.slideDir === 'out') {
      this.slideProgress = Math.max(0, this.slideProgress - dt / DIALOG_SLIDE_OUT)
      if (this.slideProgress <= 0) {
        this.slideDir = 'none'
        this.active = false
        this.slideCallback?.()
        this.slideCallback = undefined
      }
      return // skip typewriter / auto-advance / input during slide-out
    }

    if (!this.active) return

    const line = this.queue[this.currentIndex]
    if (!line) {
      this.active = false
      this.onComplete?.()
      return
    }

    const textLength = line.text.length
    const typewriterDone = this.charIndex >= textLength

    this.blinkTimer += dt
    if (this.blinkTimer >= BLINK_PERIOD) {
      this.blinkTimer -= BLINK_PERIOD
      this.blinkVisible = !this.blinkVisible
    }

    if (!typewriterDone) {
      if (input.interactJustPressed) {
        // Instantly reveal text — do NOT advance on this frame
        this.charIndex = textLength
        this.justSkipped = true
      } else {
        this.charTimer += dt
        const charsToReveal = Math.floor(this.charTimer * CHARS_PER_SEC)
        if (charsToReveal > 0) {
          this.charIndex = Math.min(textLength, this.charIndex + charsToReveal)
          this.charTimer -= charsToReveal / CHARS_PER_SEC
        }
      }
    } else if (this.justSkipped) {
      // One-frame guard: don't advance the line on the same frame as skip
      this.justSkipped = false
    } else if (line.autoAdvanceDelay !== undefined) {
      this.autoTimer += dt
      if (this.autoTimer >= line.autoAdvanceDelay) {
        this.advance()
      }
    } else if (input.interactJustPressed) {
      this.advance()
    }
  }

  private advance(): void {
    this.currentIndex++
    if (this.currentIndex >= this.queue.length) {
      // Slide out instead of instantly deactivating
      this.slideDir = 'out'
      this.slideCallback = this.onComplete
      this.onComplete = undefined
    } else {
      this.charIndex = 0
      this.charTimer = 0
      this.autoTimer = 0
      this.justSkipped = false
    }
  }

  draw(
    ctx: CanvasRenderingContext2D,
    canvasWidth = CANVAS_WIDTH,
    canvasHeight = CANVAS_HEIGHT,
  ): void {
    if (!this.active && this.slideDir === 'none') return

    const line = this.queue[this.currentIndex]
    if (!line) return

    // Ease-out cubic for smooth deceleration on slide-in / natural slide-out
    const t = 1 - Math.pow(1 - this.slideProgress, 3)

    const BOX_W = canvasWidth * 0.8
    const BOX_H = 90
    const BOX_X = (canvasWidth - BOX_W) / 2
    const finalY = canvasHeight - BOX_H - 16
    const offscreenY = canvasHeight + 10
    const BOX_Y = offscreenY + (finalY - offscreenY) * t
    const PADDING = 14

    ctx.save()
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.globalAlpha = t

    // Semi-transparent background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
    ctx.fillRect(BOX_X, BOX_Y, BOX_W, BOX_H)

    // Gold border
    ctx.strokeStyle = COLORS.accentAmber || '#FFB830'
    ctx.lineWidth = 2
    ctx.strokeRect(BOX_X, BOX_Y, BOX_W, BOX_H)

    // Speaker name (top-left, amber, bold)
    if (line.speaker) {
      ctx.fillStyle = COLORS.accentAmber || '#FFB830'
      ctx.font = 'bold 12px monospace'
      ctx.textAlign = 'left'
      ctx.textBaseline = 'top'
      ctx.fillText(line.speaker + ':', BOX_X + PADDING, BOX_Y + PADDING)
    }

    // Progress indicator (top-right)
    ctx.fillStyle = COLORS.textSecondary || '#8B9DB5'
    ctx.font = '11px monospace'
    ctx.textAlign = 'right'
    ctx.textBaseline = 'top'
    ctx.fillText(
      `${this.currentIndex + 1}/${this.queue.length}`,
      BOX_X + BOX_W - PADDING,
      BOX_Y + PADDING,
    )

    // Typewriter text
    const displayText = line.text.substring(0, this.charIndex)
    ctx.fillStyle = COLORS.textPrimary || '#F0EDE6'
    ctx.font = '14px monospace'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    const textY = BOX_Y + BOX_H / 2 + (line.speaker ? 6 : 0)
    ctx.fillText(displayText, BOX_X + PADDING, textY)

    // Advance prompt (blinking, bottom-right) — only when typewriter is done and no auto-advance
    const typewriterDone = this.charIndex >= line.text.length
    if (
      typewriterDone &&
      line.autoAdvanceDelay === undefined &&
      this.blinkVisible &&
      this.slideDir !== 'out'
    ) {
      ctx.fillStyle = COLORS.textSecondary || '#8B9DB5'
      ctx.font = '11px monospace'
      ctx.textAlign = 'right'
      ctx.textBaseline = 'bottom'
      ctx.fillText('Nhấn F để tiếp tục ▶', BOX_X + BOX_W - PADDING, BOX_Y + BOX_H - PADDING)
    }

    ctx.globalAlpha = 1
    ctx.textAlign = 'start'
    ctx.textBaseline = 'alphabetic'
    ctx.restore()
  }
}
