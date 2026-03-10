/// <reference lib="dom" />
// @ts-nocheck

export function initAnimation(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
  let width, height

  const particles = []

  function resize() {
    width = window.innerWidth
    height = window.innerHeight
    canvas.width = width
    canvas.height = height
  }
  window.addEventListener('resize', resize)
  resize()

  class Particle {
    constructor() {
      this.x = Math.random() * width
      this.y = Math.random() * height
      this.vx = Math.random() * 0.5 - 0.25
      this.vy = Math.random() * -1 - 0.5 // Rise up
      this.size = Math.random() * 3 + 1
      this.opacity = Math.random() * 0.3
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
      this.x += this.vx + Math.sin(this.y * 0.05) * 0.5 // Wavy motion
      this.y += this.vy
      if (this.y < 0) {
        this.y = height
        this.x = Math.random() * width
      }
    }
    draw() {
      ctx.beginPath()
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(251, 133, 0, ${this.opacity})` // Heat Orange
      ctx.fill()
    }
  }

  for (let i = 0; i < 50; i++) particles.push(new Particle())

  function animate() {
    ctx.clearRect(0, 0, width, height)
    particles.forEach((p) => {
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
