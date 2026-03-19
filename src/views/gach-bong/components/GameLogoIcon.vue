<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import type { GachBongModule, RenderOptions } from '../composables/types'

const props = defineProps<{
  engine: GachBongModule
}>()

const canvasRef = ref<HTMLCanvasElement | null>(null)
const animRef = ref<ReturnType<typeof setTimeout> | null>(null)

const RENDER_OPTIONS = {
  enableTexture: false,
  enableWear: false,
  enableBevel: true,
  bevelSize: 0.025,
  saturation: 0.85,
  brightness: 1.0,
  showGrout: true,
  groutWidth: 1,
  groutColor: { r: 245, g: 240, b: 230 },
}

onMounted(() => {
  const canvas = canvasRef.value
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const dpr = window.devicePixelRatio || 1
  const size = 80
  canvas.width = size * dpr
  canvas.height = size * dpr
  canvas.style.width = `${size}px`
  canvas.style.height = `${size}px`
  ctx.scale(dpr, dpr)

  const tileSize = size
  const cols = 1
  const rows = 1

  const render = () => {
    const patternIdx = Math.floor(Math.random() * 10)
    const paletteIdx = Math.floor(Math.random() * 10)

    try {
      props.engine.renderTessellation(
        ctx,
        patternIdx,
        paletteIdx,
        cols,
        rows,
        tileSize,
        RENDER_OPTIONS as RenderOptions,
      )
    } catch {
      ctx.fillStyle = '#F5F0E8'
      ctx.fillRect(0, 0, size, size)
    }

    const nextDelay = 200 + Math.random() * 600
    animRef.value = setTimeout(render, nextDelay)
  }

  render()
})

onUnmounted(() => {
  if (animRef.value) {
    clearTimeout(animRef.value)
  }
})
</script>

<template>
  <div class="flex justify-center">
    <canvas ref="canvasRef" class="rounded shadow-lg" />
  </div>
</template>
