<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'

const props = defineProps<{
  imageData: ImageData | null
  showOriginal: boolean
  originalData: ImageData | null
}>()

const canvasRef = ref<HTMLCanvasElement | null>(null)

function drawCanvas() {
  const canvas = canvasRef.value
  if (!canvas) return

  const data = props.showOriginal ? props.originalData : props.imageData
  if (!data) return

  canvas.width = data.width
  canvas.height = data.height
  const ctx = canvas.getContext('2d')!
  ctx.putImageData(data, 0, 0)
}

watch(() => [props.imageData, props.showOriginal, props.originalData], drawCanvas)
onMounted(drawCanvas)
</script>

<template>
  <div class="relative w-full border border-border-default bg-bg-surface overflow-hidden">
    <canvas
      v-show="imageData || originalData"
      ref="canvasRef"
      class="block w-full h-auto"
    />
    <div
      v-if="!imageData && !originalData"
      class="flex items-center justify-center h-64 text-text-dim text-sm font-display"
    >
      Chưa có ảnh
    </div>
    <div
      v-if="showOriginal && imageData"
      class="absolute top-3 left-3 bg-bg-elevated/90 px-2 py-1 text-xs font-display tracking-wide text-accent-amber"
    >
      GỐC
    </div>
  </div>
</template>
