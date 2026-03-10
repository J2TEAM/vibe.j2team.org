/// <reference lib="dom" />
// @ts-nocheck

export function initAnimation(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
  let width, height

  const snowflakes = []

  function resize() {
    width = window.innerWidth
    height = window.innerHeight
    canvas.width = width
    canvas.height = height
  }
  window.addEventListener('resize', resize)
  resize()

  class Snowflake {
    constructor() {
      this.x = Math.random() * width
      this.y = Math.random() * height
      this.size = Math.random() * 3 + 1
      this.speed = Math.random() * 1 + 0.5
      this.opacity = Math.random() * 0.5 + 0.3
      this.sway = Math.random() * 0.5 - 0.25
    }
    update() {
      // Interactive Physics
      if (
        typeof window !== 'undefined' &&
        window.tietkhiMouseX !== undefined &&
        window.tietkhiMouseY !== undefined
      ) {
        const dx = this.x - window.tietkhiMouseX
        const dy = this.y - window.tietkhiMouseY
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < 120) {
          const force = (120 - dist) / 120
          this.x += (dx / dist) * force * 5
          this.y += (dy / dist) * force * 5
        }
      }
      this.y += this.speed
      this.x += this.sway
      if (this.y > height) {
        this.y = -5
        this.x = Math.random() * width
      }
    }
    draw() {
      ctx.beginPath()
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(168, 218, 220, ${this.opacity})` // Ice Blue
      ctx.fill()
    }
  }

  for (let i = 0; i < 100; i++) snowflakes.push(new Snowflake())

  function animate() {
    ctx.clearRect(0, 0, width, height)
    snowflakes.forEach((s) => {
      s.update()
      s.draw()
    })
    window.animFrameId = requestAnimationFrame(animate)
  }
  animate()

  return {
    resize: (w: number, h: number) => {
      width = w
      height = h
      if (canvas) {
        canvas.width = w
        canvas.height = h
      }
      if (typeof resize === 'function') resize()
    },
    stop: () => {
      if (typeof window !== 'undefined' && window.animFrameId) {
        cancelAnimationFrame(window.animFrameId)
      }
    },
  }
}
