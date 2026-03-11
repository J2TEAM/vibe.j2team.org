/// <reference lib="dom" />
// @ts-nocheck

export function initAnimation(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
  let width, height

  const pulses = []

  function resize() {
    width = window.innerWidth
    height = window.innerHeight
    canvas.width = width
    canvas.height = height
  }
  window.addEventListener('resize', resize)
  resize()

  class Pulse {
    constructor() {
      this.x = Math.random() * width
      this.y = Math.random() * height
      this.radius = 0
      this.maxRadius = Math.random() * 100 + 50
      this.speed = Math.random() * 2 + 1
      this.opacity = 0.5
      this.color = `rgba(244, 211, 94, ${this.opacity})` // Energy Yellow
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
      this.radius += this.speed
      this.opacity -= 0.01
      if (this.opacity <= 0) {
        this.opacity = 0.5
        this.radius = 0
        this.x = Math.random() * width
        this.y = Math.random() * height
      }
    }
    draw() {
      ctx.beginPath()
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2)
      ctx.strokeStyle = `rgba(244, 211, 94, ${this.opacity})`
      ctx.lineWidth = 1
      ctx.stroke()
    }
  }

  for (let i = 0; i < 5; i++) pulses.push(new Pulse())

  function animate() {
    ctx.clearRect(0, 0, width, height)
    pulses.forEach((p) => {
      p.update()
      p.draw()
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
