/// <reference lib="dom" />
// @ts-nocheck

export function initAnimation(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
  let width, height

  const kites = []

  function resize() {
    width = window.innerWidth
    height = window.innerHeight
    canvas.width = width
    canvas.height = height
  }
  window.addEventListener('resize', resize)
  resize()

  class Kite {
    constructor() {
      this.x = Math.random() * width
      this.y = Math.random() * height + height // Start below screen
      this.size = Math.random() * 20 + 10
      this.speed = Math.random() * 1 + 0.5
      this.sway = Math.random() * 2
      this.color = `rgba(80, 200, 120, ${Math.random() * 0.3 + 0.1})` // Emerald tint
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
      ctx.rotate(Math.sin(this.y * 0.02) * 0.2) // Gentle rotation

      ctx.beginPath()
      ctx.moveTo(0, -this.size)
      ctx.lineTo(this.size / 1.5, 0)
      ctx.lineTo(0, this.size)
      ctx.lineTo(-this.size / 1.5, 0)
      ctx.closePath()

      ctx.fillStyle = this.color
      ctx.fill()

      // Tail
      ctx.beginPath()
      ctx.moveTo(0, this.size)
      ctx.quadraticCurveTo(10, this.size + 20, 0, this.size + 40)
      ctx.strokeStyle = this.color
      ctx.stroke()

      ctx.restore()
    }
  }

  for (let i = 0; i < 15; i++) kites.push(new Kite())

  function animate() {
    ctx.clearRect(0, 0, width, height)
    kites.forEach((k) => {
      k.update()
      k.draw()
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
