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
      this.y = Math.random() * height - height
      this.isLeaf = Math.random() > 0.8 // 20% leaves
      this.size = this.isLeaf ? Math.random() * 8 + 5 : Math.random() * 2 + 1
      this.speedY = Math.random() * 1 + 0.5
      this.speedX = Math.random() * 2 - 1
      this.angle = Math.random() * 360
      this.spin = Math.random() * 2 - 1
      this.color = this.isLeaf ? '#9D0208' : '#F0F8FF' // Red or White
      this.opacity = this.isLeaf ? 0.8 : 0.5
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
      this.x += Math.sin(this.y * 0.01) + this.speedX * 0.2
      if (this.isLeaf) this.angle += this.spin

      if (this.y > height) {
        this.y = -20
        this.x = Math.random() * width
      }
    }
    draw() {
      ctx.save()
      ctx.translate(this.x, this.y)
      if (this.isLeaf) {
        ctx.rotate((this.angle * Math.PI) / 180)
        ctx.fillStyle = this.color
        ctx.beginPath()
        ctx.ellipse(0, 0, this.size, this.size / 2, 0, 0, Math.PI * 2)
        ctx.fill()
      } else {
        ctx.fillStyle = `rgba(240, 248, 255, ${this.opacity})`
        ctx.beginPath()
        ctx.arc(0, 0, this.size, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.restore()
    }
  }

  for (let i = 0; i < 60; i++) particles.push(new Particle())

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
