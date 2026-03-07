export class Input {
  keys: Record<string, boolean> = {}
  private justPressedKeys: Set<string> = new Set()
  private previousKeys: Record<string, boolean> = {}

  // Touch controls state
  touchLeft = false
  touchRight = false
  touchJump = false
  private touchJumpJust = false

  constructor() {
    window.addEventListener('keydown', (e) => {
      if (!this.keys[e.code]) {
        this.justPressedKeys.add(e.code)
      }
      this.keys[e.code] = true
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault()
      }
    })
    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false
    })
  }

  isDown(code: string): boolean {
    return this.keys[code] || false
  }

  justPressed(code: string): boolean {
    return this.justPressedKeys.has(code)
  }

  get left(): boolean {
    return this.isDown('ArrowLeft') || this.isDown('KeyA') || this.touchLeft
  }

  get right(): boolean {
    return this.isDown('ArrowRight') || this.isDown('KeyD') || this.touchRight
  }

  get jump(): boolean {
    return this.isDown('ArrowUp') || this.isDown('KeyW') || this.isDown('Space') || this.touchJump
  }

  get jumpJustPressed(): boolean {
    return (
      this.justPressed('ArrowUp') ||
      this.justPressed('KeyW') ||
      this.justPressed('Space') ||
      this.touchJumpJust
    )
  }

  get enter(): boolean {
    return this.justPressed('Enter') || this.justPressed('Space')
  }

  setTouchJump(pressed: boolean) {
    if (pressed && !this.touchJump) {
      this.touchJumpJust = true
    }
    this.touchJump = pressed
  }

  update() {
    this.justPressedKeys.clear()
    this.touchJumpJust = false
    Object.assign(this.previousKeys, this.keys)
  }
}
