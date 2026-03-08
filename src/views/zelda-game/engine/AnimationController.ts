import type { AnimationDef, AnimationMap, Direction, SpriteFrame } from '../utils/types'

export class AnimationController {
  private animations: AnimationMap
  private currentName: string
  private currentDir: Direction
  private frameIndex = 0
  private elapsed = 0
  private finished = false

  constructor(animations: AnimationMap, defaultAnim = 'idle', defaultDir: Direction = 'down') {
    this.animations = animations
    this.currentName = defaultAnim
    this.currentDir = defaultDir
  }

  play(name: string, direction?: Direction): void {
    if (this.currentName !== name) {
      this.currentName = name
      this.frameIndex = 0
      this.elapsed = 0
      this.finished = false
    }
    if (direction !== undefined) {
      this.currentDir = direction
    }
  }

  setDirection(dir: Direction): void {
    this.currentDir = dir
  }

  update(dt: number): void {
    if (this.finished) return
    const def = this.resolveAnimDef()
    if (!def || def.frames.length === 0) return

    this.elapsed += dt
    let iterations = 0
    while (this.elapsed >= def.frameDuration && iterations < 10) {
      this.elapsed -= def.frameDuration
      this.frameIndex++
      if (this.frameIndex >= def.frames.length) {
        if (def.loop) {
          this.frameIndex = 0
        } else {
          this.frameIndex = def.frames.length - 1
          this.finished = true
          break
        }
      }
      iterations++
    }
  }

  getCurrentFrame(): SpriteFrame | null {
    const def = this.resolveAnimDef()
    if (!def || def.frames.length === 0) return null
    return def.frames[this.frameIndex] ?? null
  }

  isFinished(): boolean {
    return this.finished
  }

  get direction(): Direction {
    return this.currentDir
  }

  get animationName(): string {
    return this.currentName
  }

  private resolveAnimDef(): AnimationDef | undefined {
    const dirMap = this.animations[this.currentName]
    if (!dirMap) return undefined
    const def = dirMap[this.currentDir]
    if (def) return def
    const fallbackKey = Object.keys(dirMap)[0] as Direction | undefined
    return fallbackKey ? dirMap[fallbackKey] : undefined
  }
}
