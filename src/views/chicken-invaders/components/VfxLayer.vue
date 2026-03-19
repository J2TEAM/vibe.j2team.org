<script setup lang="ts">
import { ref, onMounted, onUnmounted, inject, watch } from 'vue'
import { vfx } from '../utils/vfx'
import type { GameContext } from '../composables/useGame'

const { activeWidth, activeHeight, boardRotation, isRotating } = inject('game') as GameContext

const canvasRef = ref<HTMLCanvasElement | null>(null)
let rafId = 0

const loop = () => {
  if (canvasRef.value) {
    vfx.updateAndDraw(canvasRef.value.width, canvasRef.value.height)
  }
  rafId = requestAnimationFrame(loop)
}

onMounted(() => {
  if (canvasRef.value) {
    canvasRef.value.width = activeWidth.value
    canvasRef.value.height = activeHeight.value
    vfx.init(canvasRef.value)
    loop()
  }
})

watch([activeWidth, activeHeight], () => {
  if (canvasRef.value) {
    canvasRef.value.width = activeWidth.value
    canvasRef.value.height = activeHeight.value
  }
})

onUnmounted(() => {
  cancelAnimationFrame(rafId)
})
</script>

<template>
  <div
    class="absolute top-1/2 left-1/2 pointer-events-none z-60"
    :class="{ 'transition-transform duration-1000 ease-in-out': isRotating }"
    :style="{
      width: `${activeWidth}px`,
      height: `${activeHeight}px`,
      transform: `translate(-50%, -50%) rotate(${boardRotation}deg)`,
    }"
  >
    <canvas ref="canvasRef" class="w-full h-full"></canvas>
  </div>
</template>
