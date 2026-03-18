export interface Particle {
  type: 'feather' | 'debris' | 'spark'
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  color: string
  size: number
  rotation: number
  vRot: number
}

export interface Shockwave {
  x: number
  y: number
  radius: number
  maxRadius: number
  life: number
  maxLife: number
  color: string
}

export class VFXEngine {
  canvas: HTMLCanvasElement | null = null
  ctx: CanvasRenderingContext2D | null = null
  particles: Particle[] = []
  shockwaves: Shockwave[] = []

  init(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
  }

  spawnFeathers(x: number, y: number, color: string) {
    for (let i = 0; i < 20; i++) {
      this.particles.push({
        type: 'feather',
        x,
        y,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10 - 2,
        life: 1,
        maxLife: 40 + Math.random() * 20,
        color,
        size: 4 + Math.random() * 6,
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.4,
      })
    }
  }

  spawnDebris(x: number, y: number, color: string) {
    for (let i = 0; i < 25; i++) {
      this.particles.push({
        type: 'debris',
        x,
        y,
        vx: (Math.random() - 0.5) * 12,
        vy: (Math.random() - 0.5) * 12,
        life: 1,
        maxLife: 30 + Math.random() * 20,
        color,
        size: 3 + Math.random() * 5,
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.2,
      })
    }
  }

  spawnExplosion(x: number, y: number, color: string, isGiant = false) {
    const count = isGiant ? 80 : 30
    const speed = isGiant ? 18 : 8

    this.shockwaves.push({
      x,
      y,
      radius: 10,
      maxRadius: isGiant ? 250 : 80,
      life: 1,
      maxLife: isGiant ? 40 : 20,
      color,
    })

    for (let i = 0; i < count; i++) {
      this.particles.push({
        type: 'spark',
        x,
        y,
        vx: (Math.random() - 0.5) * speed,
        vy: (Math.random() - 0.5) * speed,
        life: 1,
        maxLife: (isGiant ? 50 : 25) + Math.random() * 20,
        color,
        size: isGiant ? 5 : 3,
        rotation: 0,
        vRot: 0,
      })
    }
  }

  updateAndDraw(width: number, height: number) {
    if (!this.ctx) return
    this.ctx.clearRect(0, 0, width, height)

    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i]
      if (!sw) continue
      sw.life++
      sw.radius += (sw.maxRadius - sw.radius) * 0.15
      const alpha = 1 - sw.life / sw.maxLife
      if (alpha <= 0) {
        this.shockwaves.splice(i, 1)
        continue
      }

      this.ctx.beginPath()
      this.ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2)
      this.ctx.strokeStyle = sw.color
      this.ctx.globalAlpha = alpha
      this.ctx.lineWidth = 4
      this.ctx.stroke()
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i]
      if (!p) continue
      p.life++
      p.x += p.vx
      p.y += p.vy
      p.rotation += p.vRot

      if (p.type === 'feather') p.vy += 0.15
      if (p.type === 'debris') p.vy += 0.3

      p.vx *= 0.95
      if (p.type === 'spark') p.vy *= 0.95

      const alpha = Math.max(0, 1 - p.life / p.maxLife)
      if (alpha <= 0) {
        this.particles.splice(i, 1)
        continue
      }

      this.ctx.save()
      this.ctx.translate(p.x, p.y)
      this.ctx.rotate(p.rotation)
      this.ctx.globalAlpha = alpha
      this.ctx.fillStyle = p.color

      if (p.type === 'feather') {
        this.ctx.beginPath()
        this.ctx.ellipse(0, 0, p.size, p.size / 2.5, 0, 0, Math.PI * 2)
        this.ctx.fill()
      } else if (p.type === 'debris') {
        this.ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size)
      } else if (p.type === 'spark') {
        this.ctx.beginPath()
        this.ctx.arc(0, 0, p.size, 0, Math.PI * 2)
        this.ctx.fill()
      }
      this.ctx.restore()
    }
    this.ctx.globalAlpha = 1
  }
}

export const vfx = new VFXEngine()
