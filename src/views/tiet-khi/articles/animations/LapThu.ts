/// <reference lib="dom" />
// @ts-nocheck

export function initAnimation(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
  let width, height

  const leaves = []

  function resize() {
    width = window.innerWidth
    height = window.innerHeight
    canvas.width = width
    canvas.height = height
  }
  window.addEventListener('resize', resize)
  resize()

  class Leaf {
    constructor() {
      this.x = Math.random() * width
      this.y = Math.random() * height - height
      this.size = Math.random() * 8 + 5
      this.speedY = Math.random() * 1 + 0.5
      this.speedX = Math.random() * 2 - 1
      this.angle = Math.random() * 360
      this.spin = Math.random() * 2 - 1
      this.color = Math.random() > 0.5 ? '#D4AF37' : '#CC5500' // Gold or Orange
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
      this.x += Math.sin(this.y * 0.01) + this.speedX * 0.5
      this.angle += this.spin
      if (this.y > height) {
        this.y = -20
        this.x = Math.random() * width
      }
    }
    draw() {
      ctx.save()
      ctx.translate(this.x, this.y)
      ctx.rotate((this.angle * Math.PI) / 180)
      ctx.fillStyle = this.color
      ctx.beginPath()
      // Simple leaf shape
      ctx.ellipse(0, 0, this.size, this.size / 2, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    }
  }

  for (let i = 0; i < 40; i++) leaves.push(new Leaf())

  function animate() {
    ctx.clearRect(0, 0, width, height)
    leaves.forEach((l) => {
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
