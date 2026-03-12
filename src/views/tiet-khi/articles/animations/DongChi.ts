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
      this.size = Math.random() * 2
      this.speedY = Math.random() * -0.5 - 0.1 // Rise up
      this.opacity = Math.random() * 0.5
      this.color = '#FFB703' // Hope Gold
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
      this.y += this.speedY
      this.opacity -= 0.002
      if (this.opacity <= 0) {
        this.reset()
      }
    }
    reset() {
      this.y = height
      this.x = Math.random() * width
      this.opacity = Math.random() * 0.5
    }
    draw() {
      ctx.beginPath()
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(255, 183, 3, ${this.opacity})`
      ctx.shadowBlur = 10
      ctx.shadowColor = '#FFB703'
      ctx.fill()
      ctx.shadowBlur = 0
    }
  }

  for (let i = 0; i < 60; i++) particles.push(new Particle())

  function animate() {
    ctx.clearRect(0, 0, width, height)
    // Vignette effect for "Darkness"
    const gradient = ctx.createRadialGradient(
      width / 2,
      height / 2,
      width / 4,
      width / 2,
      height / 2,
      width,
    )
    gradient.addColorStop(0, 'rgba(11, 9, 10, 0)')
    gradient.addColorStop(1, 'rgba(11, 9, 10, 0.8)')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, height)

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
