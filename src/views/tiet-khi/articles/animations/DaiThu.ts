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

  class Firefly {
    constructor() {
      this.x = Math.random() * width
      this.y = Math.random() * height
      this.radius = Math.random() * 2 + 1
      this.vx = Math.random() * 1 - 0.5
      this.vy = Math.random() * -1 - 0.2 // Rise up
      this.alpha = Math.random()
      this.fadeSpeed = Math.random() * 0.02 + 0.005
      this.color = `255, 186, 8` // Ginger Gold
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
      this.x += this.vx + Math.sin(this.y * 0.01) * 0.5
      this.y += this.vy
      this.alpha -= this.fadeSpeed

      if (this.alpha <= 0 || this.y < 0) {
        this.reset()
      }
    }
    reset() {
      this.y = height + 10
      this.x = Math.random() * width
      this.alpha = 1
      this.vx = Math.random() * 1 - 0.5
    }
    draw() {
      ctx.beginPath()
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(${this.color}, ${this.alpha})`
      ctx.shadowBlur = 10
      ctx.shadowColor = `rgba(${this.color}, 1)`
      ctx.fill()
      ctx.shadowBlur = 0
    }
  }

  for (let i = 0; i < 60; i++) particles.push(new Firefly())

  function animate() {
    ctx.clearRect(0, 0, width, height)
    // Heat haze effect overlay (optional, subtle red tint)
    // ctx.fillStyle = 'rgba(208, 0, 0, 0.02)';
    // ctx.fillRect(0, 0, width, height);

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
