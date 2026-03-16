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
      this.speedX = Math.random() * 5 + 3 // Very fast wind
      this.speedY = Math.random() * 3 + 2 // Fast fall
      this.opacity = Math.random() * 0.7 + 0.3
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
      this.x += this.speedX
      this.y += this.speedY
      if (this.x > width) this.x = -5
      if (this.y > height) this.y = -5
    }
    draw() {
      ctx.beginPath()
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(220, 230, 240, ${this.opacity})`
      ctx.fill()
    }
  }

  for (let i = 0; i < 200; i++) snowflakes.push(new Snowflake()) // Dense storm

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
