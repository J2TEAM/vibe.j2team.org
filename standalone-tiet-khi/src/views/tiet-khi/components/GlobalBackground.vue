<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'

const props = defineProps<{
  season: string
}>()

const canvasRef = ref<HTMLCanvasElement | null>(null)
let ctx: CanvasRenderingContext2D | null = null
let animationId: number | null = null

interface Particle {
  x: number
  y: number
  size: number
  speedX: number
  speedY: number
  opacity: number
  color: string
  rotation: number
  rotationSpeed: number
  type: 'petal' | 'leaf' | 'snow' | 'sunbeam'
}

const particles = ref<Particle[]>([])
const particleCount = 60

const createParticle = (isInit = false): Particle => {
  const season = props.season
  const typeMap: Record<string, Particle['type']> = {
    Xuân: 'petal',
    Thu: 'leaf',
    Đông: 'snow',
    Hạ: 'sunbeam',
  }
  const type = typeMap[season] || 'snow'

  return {
    x: Math.random() * window.innerWidth,
    y: isInit ? Math.random() * window.innerHeight : -20,
    size: type === 'snow' ? Math.random() * 3 + 1 : Math.random() * 10 + 5,
    speedX: (Math.random() - 0.5) * 1.5,
    speedY: Math.random() * 2 + 0.5,
    opacity: Math.random() * 0.5 + 0.2,
    color: getSeasonColor(season, type),
    rotation: Math.random() * Math.PI * 2,
    rotationSpeed: (Math.random() - 0.5) * 0.05,
    type,
  }
}

const getSeasonColor = (season: string, type: string) => {
  if (type === 'petal') return '#FBCFE8' // Light pink
  if (type === 'leaf') return '#FCD34D' // Amber/Gold
  if (type === 'snow') return '#FFFFFF' // White
  if (type === 'sunbeam') return '#FEF3C7' // Very light yellow
  return '#FFFFFF'
}

const initParticles = () => {
  particles.value = Array.from({ length: particleCount }, () => createParticle(true))
}

const drawParticle = (p: Particle) => {
  if (!ctx) return
  ctx.save()
  ctx.translate(p.x, p.y)
  ctx.rotate(p.rotation)
  ctx.globalAlpha = p.opacity
  ctx.fillStyle = p.color

  if (p.type === 'snow') {
    ctx.beginPath()
    ctx.arc(0, 0, p.size, 0, Math.PI * 2)
    ctx.fill()
  } else if (p.type === 'petal' || p.type === 'leaf') {
    // Draw an oval/leaf shape
    ctx.beginPath()
    ctx.ellipse(0, 0, p.size, p.size / 2, 0, 0, Math.PI * 2)
    ctx.fill()
  } else if (p.type === 'sunbeam') {
    // Sunbeams are more like glowing flares
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, p.size * 5)
    gradient.addColorStop(0, p.color)
    gradient.addColorStop(1, 'transparent')
    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(0, 0, p.size * 5, 0, Math.PI * 2)
    ctx.fill()
  }

  ctx.restore()
}

interface MouseParticle {
  x: number
  y: number
  size: number
  opacity: number
  vx: number
  vy: number
  life: number
  color: string
}

const mouseParticles = ref<MouseParticle[]>([])

const createMouseParticle = (x: number, y: number): MouseParticle => {
  const season = props.season
  const colors: Record<string, string> = {
    Xuân: '#FBCFE8',
    Hạ: '#FEF3C7',
    Thu: '#FCD34D',
    Đông: '#FFFFFF',
  }
  return {
    x,
    y,
    size: Math.random() * 3 + 1,
    opacity: 1,
    vx: (Math.random() - 0.5) * 2,
    vy: (Math.random() - 0.5) * 2,
    life: 1.0,
    color: colors[season] || '#FFFFFF',
  }
}

const mouseX = ref(0)
const mouseY = ref(0)

const handleMouseMove = (e: MouseEvent) => {
  mouseX.value = (e.clientX - window.innerWidth / 2) / 100
  mouseY.value = (e.clientY - window.innerHeight / 2) / 100

  // Create trail particles
  for (let i = 0; i < 2; i++) {
    mouseParticles.value.push(createMouseParticle(e.clientX, e.clientY))
  }
}

const update = () => {
  if (!ctx || !canvasRef.value) return
  ctx.clearRect(0, 0, canvasRef.value.width, canvasRef.value.height)

  // Draw main seasonal particles
  particles.value.forEach((p, index) => {
    if (!p) return
    // Add mouse parallax influence
    const targetX = p.x + p.speedX + mouseX.value * (p.size / 5)
    const targetY = p.y + p.speedY + mouseY.value * (p.size / 5)

    p.x = targetX
    p.y = targetY
    p.rotation += p.rotationSpeed

    if (p.y > window.innerHeight + 20) {
      particles.value[index] = createParticle()
    }
    if (p.x > window.innerWidth + 20) p.x = -20
    if (p.x < -20) p.x = window.innerWidth + 20

    drawParticle(p)
  })

  // Draw mouse trail particles
  for (let i = mouseParticles.value.length - 1; i >= 0; i--) {
    const p = mouseParticles.value[i]
    if (!p) continue

    p.x += p.vx
    p.y += p.vy
    p.life -= 0.02
    p.opacity = p.life

    if (p.life <= 0) {
      mouseParticles.value.splice(i, 1)
    } else {
      ctx.save()
      ctx.globalAlpha = p.opacity * 0.6
      ctx.fillStyle = p.color
      ctx.shadowBlur = 10
      ctx.shadowColor = p.color
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    }
  }

  animationId = requestAnimationFrame(update)
}

const handleResize = () => {
  if (canvasRef.value) {
    canvasRef.value.width = window.innerWidth
    canvasRef.value.height = window.innerHeight
    initParticles()
  }
}

watch(
  () => props.season,
  () => {
    initParticles()
  },
)

onMounted(() => {
  if (canvasRef.value) {
    ctx = canvasRef.value.getContext('2d')
    handleResize()
    window.addEventListener('resize', handleResize)
    window.addEventListener('mousemove', handleMouseMove)
    update()
  }
})

onUnmounted(() => {
  if (animationId) cancelAnimationFrame(animationId)
  window.removeEventListener('resize', handleResize)
  window.removeEventListener('mousemove', handleMouseMove)
})
</script>

<template>
  <canvas
    ref="canvasRef"
    class="fixed inset-0 pointer-events-none z-0 opacity-40 transition-opacity duration-1000"
  ></canvas>
</template>

<style scoped>
canvas {
  filter: blur(1px);
}
</style>
