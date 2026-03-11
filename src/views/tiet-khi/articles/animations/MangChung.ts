/// <reference lib="dom" />
// @ts-nocheck

export function initAnimation(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
  let width, height

  const grains = []

  function resize() {
    width = window.innerWidth
    height = window.innerHeight
    canvas.width = width
    canvas.height = height
  }
  window.addEventListener('resize', resize)
  resize()

  class Grain {
    constructor() {
      this.x = Math.random() * width
      this.y = Math.random() * height - height
      this.size = Math.random() * 3 + 1
      this.speed = Math.random() * 2 + 1
      this.opacity = Math.random() * 0.5 + 0.1
      this.color = `rgba(244, 162, 97, ${this.opacity})` // Harvest Gold
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
      if (this.y > height) {
        this.y = -10
        this.x = Math.random() * width
      }
    }
    draw() {
      ctx.beginPath()
      ctx.ellipse(this.x, this.y, this.size, this.size * 2, 0, 0, Math.PI * 2)
      ctx.fillStyle = this.color
      ctx.fill()
    }
  }

  for (let i = 0; i < 50; i++) grains.push(new Grain())

  function animate() {
    ctx.clearRect(0, 0, width, height)
    grains.forEach((g) => {
      g.update()
      g.draw()
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
