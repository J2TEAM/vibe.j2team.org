<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRafFn } from '@vueuse/core'

const props = withDefaults(
  defineProps<{
    opacity?: number
  }>(),
  { opacity: 0.15 },
)

const canvasRef = ref<HTMLCanvasElement | null>(null)

const CHARS =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%^&*()_+-=[]{}|;:,.<>?ｦｧｨｩｪｫｬｭｮｯｰｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ'
const FONT_SIZE = 14
let columns = 0
const drops: number[] = []

function initCanvas() {
  const canvas = canvasRef.value
  if (!canvas) return
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
  columns = Math.floor(canvas.width / FONT_SIZE)
  drops.length = 0
  for (let i = 0; i < columns; i++) {
    drops[i] = Math.random() * -100
  }
}

const { pause, resume } = useRafFn(() => {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  ctx.fillStyle = 'rgba(0, 0, 0, 0.05)'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  ctx.fillStyle = '#00ff41'
  ctx.font = `${FONT_SIZE}px monospace`

  for (let i = 0; i < drops.length; i++) {
    const char = CHARS[Math.floor(Math.random() * CHARS.length)]
    if (char !== undefined) {
      ctx.fillText(char, i * FONT_SIZE, (drops[i] ?? 0) * FONT_SIZE)
    }

    if ((drops[i] ?? 0) * FONT_SIZE > canvas.height && Math.random() > 0.975) {
      drops[i] = 0
    }
    drops[i] = (drops[i] ?? 0) + 1
  }
})

function handleResize() {
  initCanvas()
}

onMounted(() => {
  initCanvas()
  resume()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  pause()
  window.removeEventListener('resize', handleResize)
})
</script>

<template>
  <canvas
    ref="canvasRef"
    class="pointer-events-none fixed inset-0"
    :style="{ opacity: props.opacity }"
  />
</template>
