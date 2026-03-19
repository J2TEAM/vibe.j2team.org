import type { InputState } from '../utils/types'

export class Input {
  private keysDown = new Set<string>()
  private keysJustPressed = new Set<string>()

  // Touch state
  private touchDirection = { x: 0, y: 0 }
  private touchActions = {
    attack: false,
    block: false,
    ranged: false,
    interact: false,
    pause: false,
  }
  private touchActionsJust = {
    attack: false,
    block: false,
    ranged: false,
    interact: false,
    pause: false,
  }

  constructor() {
    window.addEventListener('keydown', this.onKeyDown)
    window.addEventListener('keyup', this.onKeyUp)
  }

  destroy(): void {
    window.removeEventListener('keydown', this.onKeyDown)
    window.removeEventListener('keyup', this.onKeyUp)
  }

  private onKeyDown = (e: KeyboardEvent): void => {
    // Prevent default for game keys (but not F12/devtools)
    if (this.isGameKey(e.code)) {
      e.preventDefault()
    }
    if (!this.keysDown.has(e.code)) {
      this.keysJustPressed.add(e.code)
    }
    this.keysDown.add(e.code)
  }

  private onKeyUp = (e: KeyboardEvent): void => {
    this.keysDown.delete(e.code)
  }

  private isGameKey(code: string): boolean {
    return [
      'Space',
      'ShiftLeft',
      'ShiftRight',
      'KeyE',
      'KeyF',
      'KeyW',
      'KeyA',
      'KeyS',
      'KeyD',
      'ArrowUp',
      'ArrowDown',
      'ArrowLeft',
      'ArrowRight',
      'Escape',
      'KeyP',
    ].includes(code)
  }

  /** Call at END of each frame to clear just-pressed state */
  update(): void {
    this.keysJustPressed.clear()
    // Clear touch just-pressed
    this.touchActionsJust.attack = false
    this.touchActionsJust.block = false
    this.touchActionsJust.ranged = false
    this.touchActionsJust.interact = false
    this.touchActionsJust.pause = false
  }

  /** Get current input state snapshot */
  getState(): InputState {
    return {
      up: this.isDown('KeyW') || this.isDown('ArrowUp') || this.touchDirection.y < -0.3,
      down: this.isDown('KeyS') || this.isDown('ArrowDown') || this.touchDirection.y > 0.3,
      left: this.isDown('KeyA') || this.isDown('ArrowLeft') || this.touchDirection.x < -0.3,
      right: this.isDown('KeyD') || this.isDown('ArrowRight') || this.touchDirection.x > 0.3,
      attack: this.isDown('Space') || this.touchActions.attack,
      block: this.isDown('ShiftLeft') || this.isDown('ShiftRight') || this.touchActions.block,
      ranged: this.isDown('KeyE') || this.touchActions.ranged,
      interact: this.isDown('KeyF') || this.touchActions.interact,
      pause: this.isDown('Escape') || this.isDown('KeyP') || this.touchActions.pause,
      attackJustPressed: this.justPressed('Space') || this.touchActionsJust.attack,
      blockJustPressed:
        this.justPressed('ShiftLeft') ||
        this.justPressed('ShiftRight') ||
        this.touchActionsJust.block,
      rangedJustPressed: this.justPressed('KeyE') || this.touchActionsJust.ranged,
      interactJustPressed: this.justPressed('KeyF') || this.touchActionsJust.interact,
      pauseJustPressed:
        this.justPressed('Escape') || this.justPressed('KeyP') || this.touchActionsJust.pause,
    }
  }

  private isDown(code: string): boolean {
    return this.keysDown.has(code)
  }

  private justPressed(code: string): boolean {
    return this.keysJustPressed.has(code)
  }

  // --- Touch API (called from Vue template event handlers) ---

  setTouchDirection(x: number, y: number): void {
    this.touchDirection.x = x
    this.touchDirection.y = y
  }

  setTouchAction(
    action: 'attack' | 'block' | 'ranged' | 'interact' | 'pause',
    pressed: boolean,
  ): void {
    this.touchActions[action] = pressed
    if (pressed) {
      this.touchActionsJust[action] = true
    }
  }

  // --- Haptic Feedback (Red Team #13: 200ms debounce prevents battery drain) ---

  private static lastVibrateTime = 0

  /** Trigger haptic feedback if supported. Debounced at 200ms to prevent flooding. */
  static vibrate(pattern: number | number[]): void {
    const now = performance.now()
    if (now - Input.lastVibrateTime < 200) return
    Input.lastVibrateTime = now
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(pattern)
      } catch {
        // Silently fail — some browsers throw on vibrate
      }
    }
  }

  clearAllTouchActions(): void {
    this.touchActions.attack = false
    this.touchActions.block = false
    this.touchActions.ranged = false
    this.touchActions.interact = false
    this.touchActions.pause = false
    this.touchActionsJust.attack = false
    this.touchActionsJust.block = false
    this.touchActionsJust.ranged = false
    this.touchActionsJust.interact = false
    this.touchActionsJust.pause = false
  }
}
