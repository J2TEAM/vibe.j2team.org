<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useIntervalFn } from '@vueuse/core'

defineProps<{ target: string }>()

const cctvCanvas = ref<HTMLCanvasElement | null>(null)
let ctx: CanvasRenderingContext2D | null = null
const isStatic = ref(true)

// Fake face tracking squares
const faces = ref([
  { x: 30, y: 40, w: 40, h: 40, color: '#ff3333', name: 'UNKNOWN' },
  { x: 60, y: 50, w: 35, h: 35, color: '#00ff41', name: 'TARGET' },
])

const { pause } = useIntervalFn(() => {
  if (!ctx || !cctvCanvas.value) return

  const w = cctvCanvas.value.width
  const h = cctvCanvas.value.height

  if (isStatic.value) {
    // Draw static noise
    const imgData = ctx.createImageData(w, h)
    const buf = new Uint32Array(imgData.data.buffer)
    for (let i = 0; i < buf.length; i++) {
      buf[i] = (255 << 24) | (Math.random() > 0.5 ? 0xffffff : 0x000000)
    }
    ctx.putImageData(imgData, 0, 0)
  } else {
    // Draw fake night vision / cyber scene
    ctx.fillStyle = '#102a1a' // Slightly brighter green base
    ctx.fillRect(0, 0, w, h)

    // Draw grid
    ctx.strokeStyle = '#00ff4140'
    ctx.lineWidth = 1
    for (let i = 0; i < w; i += 30) {
      ctx.beginPath()
      ctx.moveTo(i, 0)
      ctx.lineTo(i, h)
      ctx.stroke()
    }
    for (let i = 0; i < h; i += 30) {
      ctx.beginPath()
      ctx.moveTo(0, i)
      ctx.lineTo(w, i)
      ctx.stroke()
    }

    // Scanline
    const lineY = (Date.now() / 20) % h
    ctx.fillStyle = '#00ff4120'
    ctx.fillRect(0, lineY, w, 2)

    // Randomly move faces slightly
    faces.value.forEach((f) => {
      f.x += (Math.random() - 0.5) * 0.5
      f.y += (Math.random() - 0.5) * 0.5
      // Bound
      if (f.x < 10) f.x = 10
      if (f.x > 80) f.x = 80
      if (f.y < 10) f.y = 10
      if (f.y > 70) f.y = 70
    })
  }
}, 50)

onMounted(() => {
  if (cctvCanvas.value) {
    ctx = cctvCanvas.value.getContext('2d') as unknown as CanvasRenderingContext2D
  }
  // Transition from static to clear feed after 1.8s
  setTimeout(() => {
    isStatic.value = false
  }, 1800)
})

onUnmounted(() => {
  pause()
})
</script>

<template>
  <div class="cctv-wrap">
    <div class="cctv-header">
      <span class="rec-dot"></span>
      REC // CAM-{{ target }} // FEED ACTIVE
    </div>
    <div class="cctv-feed">
      <canvas ref="cctvCanvas" width="400" height="250" class="cctv-canvas" />

      <!-- Overlays -->
      <div v-if="!isStatic" class="overlays">
        <div
          v-for="(f, i) in faces"
          :key="i"
          class="face-box"
          :style="{
            left: f.x + '%',
            top: f.y + '%',
            width: f.w + 'px',
            height: f.h + 'px',
            borderColor: f.color,
          }"
        >
          <span class="face-label" :style="{ color: f.color }"
            >{{ f.name }} // ID: {{ Math.floor(Math.random() * 9999) }}</span
          >
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.cctv-wrap {
  display: flex;
  flex-direction: column;
  background: #000;
  border: 1px solid rgba(0, 255, 65, 0.4);
}
.cctv-header {
  padding: 6px 12px;
  background: rgba(0, 255, 65, 0.1);
  color: #00ff41;
  font-family: 'Courier New', monospace;
  font-size: 11px;
  display: flex;
  align-items: center;
  gap: 8px;
  border-bottom: 1px solid rgba(0, 255, 65, 0.2);
}
.rec-dot {
  width: 8px;
  height: 8px;
  background: #ff3333;
  border-radius: 50%;
  animation: blink 1s infinite alternate;
}
.cctv-feed {
  position: relative;
  width: 100%;
  height: 250px;
  overflow: hidden;
}
.cctv-canvas {
  width: 100%;
  height: 100%;
  display: block;
}
.overlays {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
}
.face-box {
  position: absolute;
  border: 2px solid;
  transition: all 0.2s ease-out;
}
.face-box::before,
.face-box::after {
  content: '';
  position: absolute;
  width: 6px;
  height: 6px;
  border: 2px solid currentColor;
}
.face-box::before {
  top: -2px;
  left: -2px;
  border-right: none;
  border-bottom: none;
}
.face-box::after {
  bottom: -2px;
  right: -2px;
  border-left: none;
  border-top: none;
}

.face-label {
  position: absolute;
  bottom: -18px;
  left: 0;
  font-size: 9px;
  font-family: 'Courier New', monospace;
  white-space: nowrap;
  background: rgba(0, 0, 0, 0.6);
  padding: 1px 4px;
}
@keyframes blink {
  0% {
    opacity: 0.3;
  }
  100% {
    opacity: 1;
  }
}
</style>
