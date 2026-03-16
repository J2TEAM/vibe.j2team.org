<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useIntervalFn } from '@vueuse/core'

// Canvas noise for fake camera grain
const canvasRef = ref<HTMLCanvasElement | null>(null)
const camId = `CAM-${Math.floor(Math.random() * 900 + 100)}`
const coords = ref({
  lat: (Math.random() * 180 - 90).toFixed(4),
  lng: (Math.random() * 360 - 180).toFixed(4),
})
const frameNum = ref(0)
const isDetecting = ref(false)
const detectionLabel = ref('')

const DETECTIONS = [
  'FACE DETECTED',
  'MOTION ALERT',
  'ANOMALY',
  'TARGET LOCKED',
  'THREAT LEVEL: LOW',
  'SCANNING...',
  'INTRUDER DETECTED',
]

let noiseCtx: CanvasRenderingContext2D | null = null
let animId = 0

function drawNoise() {
  const canvas = canvasRef.value
  if (!canvas || !noiseCtx) return
  const W = canvas.width
  const H = canvas.height
  const imageData = noiseCtx.createImageData(W, H)
  const data = imageData.data

  // Base green tint noise
  for (let i = 0; i < data.length; i += 4) {
    const val = Math.random() * 40 + 5
    data[i] = 0 // R
    data[i + 1] = Math.floor(val * 1.8) // G — green tint
    data[i + 2] = Math.floor(val * 0.4) // B
    data[i + 3] = 255
  }
  noiseCtx.putImageData(imageData, 0, 0)

  // Scanline overlay
  for (let y = 0; y < H; y += 3) {
    noiseCtx.fillStyle = 'rgba(0, 0, 0, 0.25)'
    noiseCtx.fillRect(0, y, W, 1)
  }

  // Vignette
  const gradient = noiseCtx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.8)
  gradient.addColorStop(0, 'rgba(0,0,0,0)')
  gradient.addColorStop(1, 'rgba(0,0,0,0.7)')
  noiseCtx.fillStyle = gradient
  noiseCtx.fillRect(0, 0, W, H)

  frameNum.value++
  animId = requestAnimationFrame(drawNoise)
}

onMounted(() => {
  const canvas = canvasRef.value
  if (!canvas) return
  canvas.width = canvas.offsetWidth || 220
  canvas.height = canvas.offsetHeight || 130
  noiseCtx = canvas.getContext('2d')
  drawNoise()
})

onUnmounted(() => {
  cancelAnimationFrame(animId)
})

// Random detections
useIntervalFn(() => {
  isDetecting.value = Math.random() > 0.55
  if (isDetecting.value) {
    detectionLabel.value = DETECTIONS[Math.floor(Math.random() * DETECTIONS.length)] ?? ''
  }
}, 2200)

// Update coords slightly for "movement"
useIntervalFn(() => {
  coords.value = {
    lat: (parseFloat(coords.value.lat) + (Math.random() - 0.5) * 0.001).toFixed(4),
    lng: (parseFloat(coords.value.lng) + (Math.random() - 0.5) * 0.001).toFixed(4),
  }
}, 3000)
</script>

<template>
  <div class="cam-wrap">
    <div class="cam-title">// SURVEILLANCE /// {{ camId }}</div>
    <div class="cam-viewport">
      <canvas ref="canvasRef" class="cam-canvas" />

      <!-- Corner brackets -->
      <span class="corner tl" />
      <span class="corner tr" />
      <span class="corner bl" />
      <span class="corner br" />

      <!-- REC indicator -->
      <div class="cam-rec">
        <span class="rec-dot" />
        <span class="rec-text">REC</span>
      </div>

      <!-- Frame counter -->
      <div class="cam-frame">FR: {{ String(frameNum % 9999).padStart(4, '0') }}</div>

      <!-- Detection overlay -->
      <div v-if="isDetecting" class="cam-detection">
        <span class="det-box" />
        <span class="det-label">{{ detectionLabel }}</span>
      </div>

      <!-- Coords -->
      <div class="cam-coords">{{ coords.lat }}° / {{ coords.lng }}°</div>
    </div>
  </div>
</template>

<style scoped>
.cam-wrap {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.cam-title {
  color: #00ff41;
  font-family: 'Courier New', monospace;
  font-size: 10px;
  letter-spacing: 2px;
  opacity: 0.8;
}
.cam-viewport {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  background: #000;
  overflow: hidden;
  border: 1px solid rgba(0, 255, 65, 0.2);
}
.cam-canvas {
  width: 100%;
  height: 100%;
  display: block;
  filter: contrast(1.1) brightness(0.9);
}

/* Corners */
.corner {
  position: absolute;
  width: 10px;
  height: 10px;
  border-color: #00ff41;
  border-style: solid;
  opacity: 0.7;
}
.tl {
  top: 5px;
  left: 5px;
  border-width: 1px 0 0 1px;
}
.tr {
  top: 5px;
  right: 5px;
  border-width: 1px 1px 0 0;
}
.bl {
  bottom: 5px;
  left: 5px;
  border-width: 0 0 1px 1px;
}
.br {
  bottom: 5px;
  right: 5px;
  border-width: 0 1px 1px 0;
}

/* REC */
.cam-rec {
  position: absolute;
  top: 7px;
  left: 20px;
  display: flex;
  align-items: center;
  gap: 4px;
}
.rec-dot {
  width: 6px;
  height: 6px;
  background: #ff3333;
  border-radius: 50%;
  animation: rec-blink 1s step-end infinite;
  box-shadow: 0 0 5px #ff3333;
}
@keyframes rec-blink {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0;
  }
}
.rec-text {
  color: #ff3333;
  font-family: 'Courier New', monospace;
  font-size: 9px;
  letter-spacing: 1px;
}

/* Frame */
.cam-frame {
  position: absolute;
  top: 7px;
  right: 20px;
  color: rgba(0, 255, 65, 0.5);
  font-family: 'Courier New', monospace;
  font-size: 9px;
}

/* Detection */
.cam-detection {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  animation: det-appear 0.2s ease;
}
@keyframes det-appear {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
.det-box {
  display: block;
  width: 45px;
  height: 45px;
  border: 1px solid #ff3333;
  box-shadow:
    0 0 10px rgba(255, 51, 51, 0.4),
    inset 0 0 10px rgba(255, 51, 51, 0.1);
  animation: det-pulse 0.8s ease infinite;
}
@keyframes det-pulse {
  0%,
  100% {
    border-color: #ff3333;
  }
  50% {
    border-color: #ffb830;
  }
}
.det-label {
  color: #ff3333;
  font-family: 'Courier New', monospace;
  font-size: 9px;
  letter-spacing: 2px;
  text-shadow: 0 0 6px #ff3333;
  animation: det-pulse 0.8s ease infinite;
}

/* Coords */
.cam-coords {
  position: absolute;
  bottom: 7px;
  left: 50%;
  transform: translateX(-50%);
  color: rgba(0, 255, 65, 0.5);
  font-family: 'Courier New', monospace;
  font-size: 8px;
  white-space: nowrap;
}
</style>
