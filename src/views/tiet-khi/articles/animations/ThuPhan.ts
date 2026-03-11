/// <reference lib="dom" />
// @ts-nocheck

export function initAnimation(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
  let width, height

  const stars = []

  function resize() {
    width = window.innerWidth
    height = window.innerHeight
    canvas.width = width
    canvas.height = height
  }
  window.addEventListener('resize', resize)
  resize()

  class Star {
    constructor() {
      this.x = Math.random() * width
      this.y = Math.random() * height
      this.radius = Math.random() * 1.5
      this.alpha = Math.random()
      this.twinkleSpeed = Math.random() * 0.02 + 0.005
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
      this.alpha += this.twinkleSpeed
      if (this.alpha >= 1 || this.alpha <= 0) {
        this.twinkleSpeed = -this.twinkleSpeed
      }
    }
    draw() {
      ctx.beginPath()
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(255, 255, 255, ${Math.abs(this.alpha)})`
      ctx.fill()
    }
  }

  for (let i = 0; i < 150; i++) stars.push(new Star())

  function animate() {
    ctx.clearRect(0, 0, width, height)
    stars.forEach((s) => {
      s.update()
      s.draw()
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
