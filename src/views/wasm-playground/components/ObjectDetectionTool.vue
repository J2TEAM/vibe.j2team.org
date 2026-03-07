<script setup lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any */
import { ref, onMounted } from 'vue'

const videoRef = ref<HTMLVideoElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const isLoading = ref(true)
const isDetecting = ref(false)
let model: any = null

onMounted(async () => {
  // Load TF.js and COCO-SSD via CDN
  const scripts = [
    'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs/dist/tf.min.js',
    'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-wasm/dist/tf-backend-wasm.js',
    'https://cdn.jsdelivr.net/npm/@tensorflow-models/coco-ssd'
  ]
  
  for (const src of scripts) {
    await new Promise((resolve) => {
      const script = document.createElement('script')
      script.src = src
      script.onload = resolve
      document.head.appendChild(script)
    })
  }

  const tf = (window as any).tf
  await tf.setBackend('wasm')
  model = await (window as any).cocoSsd.load()
  isLoading.value = false
})

const startCamera = async () => {
  if (!videoRef.value) return
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false })
    videoRef.value.srcObject = stream
    
    // Wait for video metadata to be loaded to get correct dimensions
    videoRef.value.onloadedmetadata = () => {
      if (canvasRef.value && videoRef.value) {
        canvasRef.value.width = videoRef.value.videoWidth
        canvasRef.value.height = videoRef.value.videoHeight
      }
      isDetecting.value = true
      detectFrame()
    }
  } catch (err) {
    console.error("Camera access failed", err)
  }
}

const detectFrame = async () => {
  if (!model || !videoRef.value || !isDetecting.value) return
  
  const predictions = await model.detect(videoRef.value)
  renderPredictions(predictions)
  requestAnimationFrame(detectFrame)
}

const renderPredictions = (predictions: any[]) => {
  if (!canvasRef.value || !videoRef.value) return
  const ctx = canvasRef.value.getContext('2d')!
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
  
  predictions.forEach(prediction => {
    const [x, y, width, height] = prediction.bbox
    ctx.strokeStyle = '#ff6f61'
    ctx.lineWidth = 4
    ctx.strokeRect(x, y, width, height)
    
    ctx.fillStyle = '#ff6f61'
    ctx.font = 'bold 16px monospace'
    ctx.fillText(`${prediction.class} (${Math.round(prediction.score * 100)}%)`, x, y > 20 ? y - 10 : 20)
  });
}
</script>

<template>
  <div class="h-full flex flex-col gap-6 animate-fade-in">
    <div class="grid grid-cols-1 gap-6 flex-1">
      <div class="flex flex-col gap-3 items-center">
        <span class="text-[10px] font-mono uppercase text-text-secondary">TensorFlow.js Object Detection (WASM Backend)</span>
        <div class="relative bg-black rounded-lg border border-white/10 overflow-hidden shadow-2xl">
          <video ref="videoRef" autoplay muted playsinline class="w-full max-w-2xl h-auto"></video>
          <canvas ref="canvasRef" width="640" height="480" class="absolute top-0 left-0 w-full h-full pointer-events-none"></canvas>
          <div v-if="!isDetecting" class="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
             <button @click="startCamera" :disabled="isLoading" class="wasm-btn px-12 py-4 text-lg">
               {{ isLoading ? 'LOADING AI MODELS...' : 'START CAMERA' }}
             </button>
          </div>
        </div>
        <p class="text-[10px] text-text-secondary italic text-center mt-2">
          Sử dụng TensorFlow.js với WASM backend để nhận diện vật thể thời gian thực qua webcam.
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>@import "../styles.css";</style>
