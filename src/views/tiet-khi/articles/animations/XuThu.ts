/// <reference lib="dom" />
// @ts-nocheck

export function initAnimation(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
  let width, height

  const lanterns = []

  function resize() {
    width = window.innerWidth
    height = window.innerHeight
    canvas.width = width
    canvas.height = height
  }
  window.addEventListener('resize', resize)
  resize()

  class Lantern {
    constructor() {
      this.x = Math.random() * width
      this.y = Math.random() * height + height // Start below
      this.width = 15
      this.height = 20
      this.speed = Math.random() * 0.5 + 0.2
      this.sway = Math.random() * 0.5
      this.color = '#F4A261' // Lantern light
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
      this.y -= this.speed
      this.x += Math.sin(this.y * 0.01) * this.sway
      if (this.y < -50) {
        this.y = height + 50
        this.x = Math.random() * width
      }
    }
    draw() {
      ctx.save()
      ctx.translate(this.x, this.y)
      ctx.fillStyle = this.color
      ctx.shadowBlur = 15
      ctx.shadowColor = this.color

      // Simple lantern shape
      ctx.beginPath()
      ctx.rect(-this.width / 2, -this.height / 2, this.width, this.height)
      ctx.fill()

      ctx.restore()
    }
  }

  for (let i = 0; i < 12; i++) lanterns.push(new Lantern())

  function animate() {
    ctx.clearRect(0, 0, width, height)
    lanterns.forEach((l) => {
      l.update()
      l.draw()
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
