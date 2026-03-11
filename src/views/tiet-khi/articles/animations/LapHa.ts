/// <reference lib="dom" />
// @ts-nocheck

export function initAnimation(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
  let width, height

  const rays = []

  function resize() {
    width = window.innerWidth
    height = window.innerHeight
    canvas.width = width
    canvas.height = height
  }
  window.addEventListener('resize', resize)
  resize()

  class Ray {
    constructor() {
      this.angle = Math.random() * Math.PI * 2
      this.length = Math.max(width, height)
      this.width = Math.random() * 50 + 20
      this.speed = Math.random() * 0.002 + 0.001
      this.opacity = Math.random() * 0.1
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
      this.angle += this.speed
    }
    draw() {
      ctx.save()
      ctx.translate(width / 2, height / 2) // Center of sun
      ctx.rotate(this.angle)

      const gradient = ctx.createLinearGradient(0, 0, this.length, 0)
      gradient.addColorStop(0, `rgba(255, 183, 3, ${this.opacity})`) // Sun Yellow
      gradient.addColorStop(1, 'rgba(255, 183, 3, 0)')

      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.lineTo(this.length, -this.width / 2)
      ctx.lineTo(this.length, this.width / 2)
      ctx.fill()
      ctx.restore()
    }
  }

  for (let i = 0; i < 12; i++) rays.push(new Ray())

  function animate() {
    ctx.clearRect(0, 0, width, height)
    rays.forEach((r) => {
      r.update()
      r.draw()
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
