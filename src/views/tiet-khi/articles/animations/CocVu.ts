/// <reference lib="dom" />
// @ts-nocheck

export function initAnimation(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
  let width, height

  const drops = []

  function resize() {
    width = window.innerWidth
    height = window.innerHeight
    canvas.width = width
    canvas.height = height
  }
  window.addEventListener('resize', resize)
  resize()

  class Drop {
    constructor() {
      this.x = Math.random() * width
      this.y = Math.random() * height - height
      this.length = Math.random() * 20 + 15 // Longer for heavy rain
      this.speed = Math.random() * 5 + 5 // Faster
      this.opacity = Math.random() * 0.3 + 0.1
      this.color = `rgba(31, 64, 104, ${this.opacity})`
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
        this.y = -20
        this.x = Math.random() * width
      }
    }
    draw() {
      ctx.beginPath()
      ctx.moveTo(this.x, this.y)
      ctx.lineTo(this.x, this.y + this.length)
      ctx.strokeStyle = this.color
      ctx.lineWidth = 1.5 // Thicker
      ctx.lineCap = 'round'
      ctx.stroke()
    }
  }

  for (let i = 0; i < 150; i++) drops.push(new Drop()) // More drops

  function animate() {
    ctx.clearRect(0, 0, width, height)
    drops.forEach((d) => {
      d.update()
      d.draw()
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
