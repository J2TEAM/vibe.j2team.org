<script setup lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any */
import { ref, onMounted, onUnmounted } from 'vue'

const videoRef = ref<HTMLVideoElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const isLoading = ref(true)
const isDetecting = ref(false)
const status = ref('Đang khởi tạo...')
let faceLandmarker: any = null
let animationFrameId: number

onMounted(async () => {
  try {
    // @ts-expect-error - CDN import
    const vision = await import('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/+esm')
    const { FaceLandmarker, FilesetResolver } = vision

    status.value = 'Đang tải gói WASM...'
    const filesetResolver = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
    )
    
    status.value = 'Đang tải mô hình AI...'
    faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
      baseOptions: {
        modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
        delegate: "GPU"
      },
      outputFaceBlendshapes: false,
      runningMode: "VIDEO",
      numFaces: 1
    })
    
    isLoading.value = false
    status.value = 'Sẵn sàng'
  } catch (err) {
    console.error(err)
    status.value = 'Tải MediaPipe thất bại'
  }
})

onUnmounted(() => {
  if (animationFrameId) cancelAnimationFrame(animationFrameId)
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
    status.value = "Truy cập camera bị từ chối"
  }
}

let lastVideoTime = -1
const detectFrame = () => {
  if (!faceLandmarker || !videoRef.value || !isDetecting.value || !canvasRef.value) return
  
  const video = videoRef.value
  const canvas = canvasRef.value
  const ctx = canvas.getContext('2d')!

  if (video.currentTime !== lastVideoTime) {
    lastVideoTime = video.currentTime
    const results = faceLandmarker.detectForVideo(video, performance.now())
    
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    if (results.faceLandmarks) {
      for (const landmarks of results.faceLandmarks) {
        ctx.fillStyle = '#10b981' // Emerald
        for (const landmark of landmarks) {
          const x = landmark.x * canvas.width
          const y = landmark.y * canvas.height
          ctx.beginPath()
          ctx.arc(x, y, 1.5, 0, 2 * Math.PI)
          ctx.fill()
        }
        
        // Draw cyber-punk connecting lines for the face oval
        ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)'
        ctx.lineWidth = 1
        ctx.beginPath()
        // Simple heuristic: just connect a few points to make it look cool
        for (let i = 0; i < landmarks.length - 1; i += 5) {
            ctx.moveTo(landmarks[i].x * canvas.width, landmarks[i].y * canvas.height)
            ctx.lineTo(landmarks[i+1].x * canvas.width, landmarks[i+1].y * canvas.height)
        }
        ctx.stroke()
      }
    }
  }
  
  animationFrameId = requestAnimationFrame(detectFrame)
}
</script>

<template>
  <div class="h-full flex flex-col gap-6 animate-fade-in">
    <div class="grid grid-cols-1 gap-6 flex-1">
      <div class="flex flex-col gap-3 items-center">
        <span class="text-[10px] font-mono uppercase text-text-secondary">Theo dõi khuôn mặt (MediaPipe WebGPU/WASM)</span>
        <div class="relative bg-black rounded-lg border border-white/10 overflow-hidden shadow-2xl">
          <video ref="videoRef" autoplay muted playsinline class="w-full max-w-2xl h-auto" style="transform: scaleX(-1);"></video>
          <canvas ref="canvasRef" class="absolute top-0 left-0 w-full h-full pointer-events-none" style="transform: scaleX(-1);"></canvas>
          <div v-if="!isDetecting" class="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm gap-4">
             <div v-if="isLoading" class="text-accent-coral animate-pulse">{{ status }}</div>
             <button v-else @click="startCamera" class="wasm-btn px-12 py-4 text-lg">
               MỞ CAMERA
             </button>
          </div>
        </div>
        <p class="text-[10px] text-text-secondary italic text-center mt-2">
          Theo dõi 478 điểm trên khuôn mặt ở tốc độ 60FPS bằng WebGPU/WASM. Dữ liệu xử lý 100% trên thiết bị.
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>@import "../styles.css";</style>
