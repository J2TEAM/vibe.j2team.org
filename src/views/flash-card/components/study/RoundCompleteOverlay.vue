<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const props = defineProps<{
  round: 1 | 2 | 3
}>()

const emit = defineEmits<{
  dismiss: []
}>()

const roundInfo: Record<number, { emoji: string; color: string }> = {
  1: { emoji: '⭐', color: 'text-accent-coral' },
  2: { emoji: '🌟', color: 'text-accent-amber' },
  3: { emoji: '🏆', color: 'text-accent-sky' },
}

const info = roundInfo[props.round] ?? roundInfo[1]!

// Confetti particles
interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  color: string
  rotation: number
  rotationSpeed: number
  opacity: number
}

const canvasRef = ref<HTMLCanvasElement | null>(null)
let animationId = 0
let particles: Particle[] = []

const colors = [
  '#ff6b6b',
  '#ffd93d',
  '#6bcb77',
  '#4d96ff',
  '#ff8fb1',
  '#a855f7',
  '#06b6d4',
  '#f97316',
]

function createParticles() {
  const count = 80
  particles = []
  for (let i = 0; i < count; i++) {
    particles.push({
      x: Math.random() * window.innerWidth,
      y: -20 - Math.random() * 200,
      vx: (Math.random() - 0.5) * 6,
      vy: Math.random() * 3 + 2,
      size: Math.random() * 8 + 4,
      color: colors[Math.floor(Math.random() * colors.length)]!,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 10,
      opacity: 1,
    })
  }
}

function animate() {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  canvas.width = window.innerWidth
  canvas.height = window.innerHeight

  ctx.clearRect(0, 0, canvas.width, canvas.height)

  let alive = false
  for (const p of particles) {
    if (p.opacity <= 0) continue
    alive = true

    p.x += p.vx
    p.vy += 0.08
    p.y += p.vy
    p.rotation += p.rotationSpeed
    p.vx *= 0.99

    if (p.y > canvas.height + 20) {
      p.opacity = 0
      continue
    }

    ctx.save()
    ctx.translate(p.x, p.y)
    ctx.rotate((p.rotation * Math.PI) / 180)
    ctx.globalAlpha = p.opacity
    ctx.fillStyle = p.color
    ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6)
    ctx.restore()
  }

  if (alive) {
    animationId = requestAnimationFrame(animate)
  }
}

onMounted(() => {
  createParticles()
  animationId = requestAnimationFrame(animate)
})

onUnmounted(() => {
  cancelAnimationFrame(animationId)
})
</script>

<template>
  <Teleport to="body">
    <!-- Confetti canvas -->
    <canvas ref="canvasRef" class="fixed inset-0 z-50 pointer-events-none" />

    <!-- Dialog backdrop + content -->
    <div class="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div class="absolute inset-0 bg-bg-deep/60" @click="emit('dismiss')" />
      <div
        class="relative z-10 max-w-sm w-full border border-border-default bg-bg-surface p-8 text-center animate-fade-up"
      >
        <div class="text-5xl mb-3">{{ info.emoji }}</div>
        <h3 class="font-display text-2xl font-bold mb-2" :class="info.color">
          Vòng {{ round }} hoàn thành!
        </h3>
        <p class="text-text-secondary text-sm mb-6">
          <template v-if="round === 1">Tất cả thẻ đã đạt Cấp 1. Tiếp tục luyện tập!</template>
          <template v-else-if="round === 2">Tất cả thẻ đã đạt Cấp 2. Gần thành thạo rồi!</template>
          <template v-else>Xuất sắc! Tất cả thẻ đã được ghi nhớ!</template>
        </p>
        <button
          class="px-6 py-3 text-sm border border-border-default bg-bg-surface text-text-primary font-semibold transition hover:border-accent-coral hover:text-accent-coral"
          @click="emit('dismiss')"
        >
          Tiếp tục
        </button>
      </div>
    </div>
  </Teleport>
</template>
