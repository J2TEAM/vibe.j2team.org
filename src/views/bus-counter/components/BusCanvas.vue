<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, type Ref } from 'vue'
import type { Passenger } from '../types'
import { useBusRenderer } from '../composables/useBusRenderer'
import { useRafFn } from '@vueuse/core'

const props = defineProps<{
  passengers: Passenger[]
  isDoorOpen: boolean
  isTransit: boolean
}>()

const canvasRef = ref<HTMLCanvasElement | null>(null)
const containerRef = ref<HTMLElement | null>(null)

const passengersRef = ref(props.passengers) as Ref<Passenger[]>

watch(
  () => props.passengers,
  (val) => {
    passengersRef.value = val
  },
)

let renderer: ReturnType<typeof useBusRenderer> | null = null

onMounted(() => {
  if (canvasRef.value) {
    renderer = useBusRenderer(canvasRef as Ref<HTMLCanvasElement | null>, passengersRef)
    resizeCanvas()
  }
})

watch(
  () => props.isDoorOpen,
  (val) => {
    if (renderer) renderer.setDoorOpen(val)
  },
)

watch(
  () => props.isTransit,
  (val) => {
    if (renderer) renderer.setTransit(val)
  },
)

const { pause: stopRaf } = useRafFn(() => {
  if (renderer) renderer.draw()
})

function resizeCanvas() {
  if (!canvasRef.value || !containerRef.value || !renderer) return
  const containerW = containerRef.value.clientWidth
  const scale = Math.min(containerW / renderer.CANVAS_BASE_W, 2.5)
  canvasRef.value.width = renderer.CANVAS_BASE_W * scale
  canvasRef.value.height = renderer.CANVAS_BASE_H * scale
}

const resizeObserver = new ResizeObserver(() => {
  resizeCanvas()
})

onMounted(() => {
  if (containerRef.value) {
    resizeObserver.observe(containerRef.value)
  }
})

onUnmounted(() => {
  stopRaf()
  resizeObserver.disconnect()
})
</script>

<template>
  <div ref="containerRef" class="relative w-full">
    <canvas ref="canvasRef" class="mx-auto block" :style="{ maxWidth: '100%', height: 'auto' }" />
  </div>
</template>
