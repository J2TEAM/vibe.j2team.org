<template>
  <main class="heart-page">
    <canvas ref="canvasRef" aria-label="Hiệu ứng trái tim"></canvas>
    <h1 class="heart-message">I Love You</h1>
    <button class="home" type="button" @click="goHome">Không yêu trả dép bố về</button>
  </main>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useEventListener } from '@vueuse/core'
import { useRouter } from 'vue-router'

const router = useRouter()
const canvasRef = ref<HTMLCanvasElement | null>(null)

function goHome() {
  router.push('/')
}
const settings = {
  particles: {
    length: 500,
    duration: 2,
    velocity: 100,
    effect: -0.75,
    size: 30,
  },
}

class Point {
  x: number
  y: number

  constructor(x = 0, y = 0) {
    this.x = x
    this.y = y
  }

  clone() {
    return new Point(this.x, this.y)
  }

  length(length?: number) {
    if (length === undefined) {
      return Math.sqrt(this.x * this.x + this.y * this.y)
    }

    this.normalize()
    this.x *= length
    this.y *= length
    return this
  }

  normalize() {
    const pointLength = this.length()
    this.x /= pointLength
    this.y /= pointLength
    return this
  }
}

class Particle {
  position = new Point()
  velocity = new Point()
  acceleration = new Point()
  age = 0

  initialize(x: number, y: number, velocityX: number, velocityY: number) {
    this.position.x = x
    this.position.y = y
    this.velocity.x = velocityX
    this.velocity.y = velocityY
    this.acceleration.x = velocityX * settings.particles.effect
    this.acceleration.y = velocityY * settings.particles.effect
    this.age = 0
  }

  update(deltaTime: number) {
    this.position.x += this.velocity.x * deltaTime
    this.position.y += this.velocity.y * deltaTime
    this.velocity.x += this.acceleration.x * deltaTime
    this.velocity.y += this.acceleration.y * deltaTime
    this.age += deltaTime
  }

  draw(context: CanvasRenderingContext2D, image: HTMLImageElement) {
    const ease = (value: number) => --value * value * value + 1
    const size = image.width * ease(this.age / settings.particles.duration)
    context.globalAlpha = 1 - this.age / settings.particles.duration
    context.drawImage(image, this.position.x - size / 2, this.position.y - size / 2, size, size)
  }
}

class ParticlePool {
  private readonly particles: Particle[]
  private firstActive = 0
  private firstFree = 0
  private readonly duration = settings.particles.duration

  constructor(length: number) {
    this.particles = Array.from({ length }, () => new Particle())
  }

  add(x: number, y: number, velocityX: number, velocityY: number) {
    this.particles[this.firstFree]!.initialize(x, y, velocityX, velocityY)
    this.firstFree++

    if (this.firstFree === this.particles.length) this.firstFree = 0
    if (this.firstActive === this.firstFree) this.firstActive++
    if (this.firstActive === this.particles.length) this.firstActive = 0
  }

  update(deltaTime: number) {
    if (this.firstActive < this.firstFree) {
      for (let index = this.firstActive; index < this.firstFree; index++) {
        this.particles[index]!.update(deltaTime)
      }
    }

    if (this.firstFree < this.firstActive) {
      for (let index = this.firstActive; index < this.particles.length; index++) {
        this.particles[index]!.update(deltaTime)
      }
      for (let index = 0; index < this.firstFree; index++) {
        this.particles[index]!.update(deltaTime)
      }
    }

    while (
      this.particles[this.firstActive]!.age >= this.duration &&
      this.firstActive !== this.firstFree
    ) {
      this.firstActive++
      if (this.firstActive === this.particles.length) this.firstActive = 0
    }
  }

  draw(context: CanvasRenderingContext2D, image: HTMLImageElement) {
    if (this.firstActive < this.firstFree) {
      for (let index = this.firstActive; index < this.firstFree; index++) {
        this.particles[index]!.draw(context, image)
      }
    }

    if (this.firstFree < this.firstActive) {
      for (let index = this.firstActive; index < this.particles.length; index++) {
        this.particles[index]!.draw(context, image)
      }
      for (let index = 0; index < this.firstFree; index++) {
        this.particles[index]!.draw(context, image)
      }
    }
  }
}

function pointOnHeart(angle: number) {
  return new Point(
    160 * Math.pow(Math.sin(angle), 3),
    130 * Math.cos(angle) -
      50 * Math.cos(2 * angle) -
      20 * Math.cos(3 * angle) -
      10 * Math.cos(4 * angle) +
      25,
  )
}

function resizeCanvas() {
  const canvas = canvasRef.value
  if (!canvas) return

  canvas.width = canvas.clientWidth
  canvas.height = canvas.clientHeight
}

useEventListener(window, 'resize', resizeCanvas)

let animationFrame = 0
let bootstrapTimer: number | undefined

onMounted(() => {
  const canvas = canvasRef.value
  const context = canvas?.getContext('2d')
  if (!canvas || !context) return

  const particles = new ParticlePool(settings.particles.length)
  const particleRate = settings.particles.length / settings.particles.duration
  let time: number | undefined

  const particleCanvas = document.createElement('canvas')
  const particleContext = particleCanvas.getContext('2d')
  if (!particleContext) return

  particleCanvas.width = settings.particles.size
  particleCanvas.height = settings.particles.size
  const toParticlePoint = (angle: number) => {
    const point = pointOnHeart(angle)
    point.x = settings.particles.size / 2 + (point.x * settings.particles.size) / 350
    point.y = settings.particles.size / 2 - (point.y * settings.particles.size) / 350
    return point
  }

  particleContext.beginPath()
  let angle = -Math.PI
  let point = toParticlePoint(angle)
  particleContext.moveTo(point.x, point.y)
  while (angle < Math.PI) {
    angle += 0.01
    point = toParticlePoint(angle)
    particleContext.lineTo(point.x, point.y)
  }
  particleContext.closePath()
  particleContext.fillStyle = '#e80c29'
  particleContext.fill()

  const particleImage = new Image()
  particleImage.src = particleCanvas.toDataURL()

  const render = () => {
    animationFrame = requestAnimationFrame(render)

    const newTime = Date.now() / 1000
    const deltaTime = newTime - (time ?? newTime)
    time = newTime

    context.clearRect(0, 0, canvas.width, canvas.height)

    const amount = particleRate * deltaTime
    for (let index = 0; index < amount; index++) {
      const particlePosition = pointOnHeart(Math.PI - 2 * Math.PI * Math.random())
      const direction = particlePosition.clone().length(settings.particles.velocity)
      particles.add(
        canvas.width / 2 + particlePosition.x,
        canvas.height / 2 - particlePosition.y,
        direction.x,
        -direction.y,
      )
    }

    particles.update(deltaTime)
    particles.draw(context, particleImage)
  }

  bootstrapTimer = window.setTimeout(() => {
    resizeCanvas()
    render()
  }, 10)
})

onUnmounted(() => {
  if (bootstrapTimer !== undefined) window.clearTimeout(bootstrapTimer)
  cancelAnimationFrame(animationFrame)
})
</script>

<style scoped>
.heart-page {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  background: #000;
}

canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.heart-message {
  position: relative;
  z-index: 1;
  margin: 0;
  padding-top: 39vh;
  color: #ff6b4a;
  text-align: center;
  font-family: 'Times New Roman', sans-serif;
  font-size: clamp(2rem, 6vw, 4rem);
  font-style: italic;
  opacity: 0;
  animation: blink-in 2s ease-out 1s forwards;
}
.home {
  position: fixed;
  bottom: 100px;
  left: 50%;
  transform: translateX(-50%);
  padding: 12px 24px;
  border: 2px solid #fc2e00;
  background: transparent;
  color: #fc2e00;
  text-align: center;
  font-family: 'Times New Roman', sans-serif;
  font-size: 30px;
  font-style: italic;
  cursor: pointer;
}
@keyframes blink-in {
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}
</style>
