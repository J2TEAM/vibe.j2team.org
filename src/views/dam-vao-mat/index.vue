<script setup lang="ts">
import { ref, onMounted, onUnmounted, watchEffect } from 'vue'
import { Icon } from '@iconify/vue'
import { useUserMedia, useRafFn } from '@vueuse/core'

/**
 * FACE PUNCHER 🥊
 * Một sub-app sử dụng MediaPipe Face Detection để đấm vào mặt người dùng.
 */

// --- Types ---
interface Punch {
  id: string
  x: number
  y: number
  startX: number
  startY: number
  startScale: number
  rotation: number
  flipX: boolean
  timestamp: number
  hasHit: boolean
  displayLabel: string
}

// MediaPipe globals (loaded via script tag)
declare global {
  interface Window {
    tasksVision: unknown
  }
}

// --- Audio Logic ---
let audioCtx: AudioContext | null = null

const initAudio = () => {
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (AudioContextClass) {
      audioCtx = new AudioContextClass()
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume()
  }
}

const playPunchSound = () => {
  try {
    initAudio()
    if (!audioCtx) return

    const now = audioCtx.currentTime

    // Thud (âm trầm khi đấm trúng)
    const osc = audioCtx.createOscillator()
    const gainNode = audioCtx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(150, now)
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.15)
    gainNode.gain.setValueAtTime(2, now)
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15)
    osc.connect(gainNode)
    gainNode.connect(audioCtx.destination)
    osc.start()
    osc.stop(now + 0.15)

    // Smack (âm thanh va chạm)
    const bufferSize = audioCtx.sampleRate * 0.1
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1
    }
    const noise = audioCtx.createBufferSource()
    noise.buffer = buffer
    const noiseFilter = audioCtx.createBiquadFilter()
    noiseFilter.type = 'bandpass'
    noiseFilter.frequency.value = 1000
    const noiseGain = audioCtx.createGain()
    noiseGain.gain.setValueAtTime(1.5, now)
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.1)
    noise.connect(noiseFilter)
    noiseFilter.connect(noiseGain)
    noiseGain.connect(audioCtx.destination)
    noise.start()
  } catch (e) {
    console.error('Audio play failed', e)
  }
}

// --- State ---
const videoRef = ref<HTMLVideoElement | null>(null)
const containerRef = ref<HTMLDivElement | null>(null)
const isModelLoaded = ref(false)
const punches = ref<Punch[]>([])
const lastPunchTime = ref(0)
let faceDetector: {
  detectForVideo: (
    video: HTMLVideoElement,
    timestamp: number,
  ) => {
    detections: {
      boundingBox: { originX: number; originY: number; width: number; height: number }
    }[]
  }
  close: () => void
} | null = null

// --- Camera Setup ---
const { stream, enabled } = useUserMedia({
  constraints: {
    video: {
      facingMode: 'user',
      width: { ideal: 1280 },
      height: { ideal: 720 },
    },
    audio: false,
  },
})

// Mặc định bật camera
onMounted(() => {
  enabled.value = true
})

// Gán stream vào video element khi sẵn sàng
watchEffect(() => {
  if (stream.value && videoRef.value) {
    videoRef.value.srcObject = stream.value
  }
})

const initMediaPipe = async () => {
  try {
    const vision = await import('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/+esm')

    const filesetResolver = await vision.FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm',
    )

    faceDetector = await vision.FaceDetector.createFromOptions(filesetResolver, {
      baseOptions: {
        modelAssetPath:
          'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite',
        delegate: 'GPU',
      },
      runningMode: 'VIDEO',
    })

    isModelLoaded.value = true
  } catch (error) {
    console.error('Failed to load face detector model:', error)
  }
}

onMounted(() => {
  initMediaPipe()
})

onUnmounted(() => {
  if (faceDetector) {
    faceDetector.close()
  }
})

const isFlashing = ref(false)

// --- Detection & Action Loop ---
const { resume } = useRafFn(() => {
  if (!videoRef.value || !faceDetector || !isModelLoaded.value || videoRef.value.readyState < 2) {
    return
  }

  const video = videoRef.value
  const now = Date.now()
  const startTimeMs = performance.now()

  // Chạy nhận diện khuôn mặt
  const result = faceDetector.detectForVideo(video, startTimeMs)
  const detections = result.detections

  if (detections.length > 0) {
    // Cooldown giữa các lần đấm (400ms)
    if (now - lastPunchTime.value > 400) {
      // Chọn ngẫu nhiên một khuôn mặt
      const face = detections[Math.floor(Math.random() * detections.length)]
      const containerRect = containerRef.value?.getBoundingClientRect()

      if (containerRect && face.boundingBox) {
        const videoWidth = video.videoWidth
        const videoHeight = video.videoHeight
        const videoRatio = videoWidth / videoHeight
        const containerRatio = containerRect.width / containerRect.height

        // Tính toán vị trí render dựa trên object-cover
        let renderWidth = containerRect.width
        let renderHeight = containerRect.height
        let offsetX = 0
        let offsetY = 0

        if (videoRatio > containerRatio) {
          renderHeight = containerRect.height
          renderWidth = renderHeight * videoRatio
          offsetX = (renderWidth - containerRect.width) / 2
        } else {
          renderWidth = containerRect.width
          renderHeight = renderWidth / videoRatio
          offsetY = (renderHeight - containerRect.height) / 2
        }

        const scaleX = renderWidth / videoWidth
        const scaleY = renderHeight / videoHeight

        const faceCenterX = face.boundingBox.originX + face.boundingBox.width / 2
        const faceCenterY = face.boundingBox.originY + face.boundingBox.height / 2

        let displayX = faceCenterX * scaleX - offsetX
        const displayY = faceCenterY * scaleY - offsetY

        // Lật X vì video được mirror
        displayX = containerRect.width - displayX

        // Tạo hiệu ứng đấm: Từ phía trước và nhiều hướng khác nhau
        const angle = Math.random() * Math.PI * 2
        const distance = 300 + Math.random() * 500 // Khoảng cách bay tới
        const startX = Math.cos(angle) * distance
        const startY = Math.sin(angle) * distance
        const startScale = Math.random() * 1 // Bắt đầu rất to (cảm giác bay từ gần cam vào mặt)
        const rotation = (Math.random() - 0.5) * 60
        const flipX = startX < 0
        const label = ['BAM!', 'POW!', 'WHACK!', 'SMASH!', 'CHẾT MÀY NÈ!'][
          Math.floor(Math.random() * 5)
        ]

        const id = Math.random().toString(36).substring(7)
        const newPunch: Punch = {
          id,
          x: displayX,
          y: displayY,
          startX,
          startY,
          startScale,
          rotation,
          flipX,
          timestamp: now,
          hasHit: false,
          displayLabel: label,
        }

        punches.value.push(newPunch)
        lastPunchTime.value = now

        // Kích hoạt hiệu ứng va chạm sau 150ms (khớp với thời gian bay)
        setTimeout(() => {
          const p = punches.value.find((punch) => punch.id === id)
          if (p) {
            p.hasHit = true
            isFlashing.value = true
            playPunchSound()
            setTimeout(() => {
              isFlashing.value = false
            }, 100)
          }
        }, 150)
      }
    }
  }

  // Dọn dẹp các phát đấm cũ sau 800ms
  punches.value = punches.value.filter((p) => now - p.timestamp < 1000)
})

// --- Visibility Handling ---
onMounted(() => {
  resume()
})
</script>

<template>
  <div
    class="min-h-screen bg-bg-deep flex flex-col items-center justify-center p-4 font-body text-text-primary overflow-hidden select-none"
    @click="initAudio"
  >
    <!-- Background Decor -->
    <div class="fixed inset-0 pointer-events-none overflow-hidden opacity-20">
      <div
        class="absolute top-[-10%] right-[-10%] w-[40%] aspect-square bg-accent-coral/20 rounded-full blur-[120px]"
      />
      <div
        class="absolute bottom-[-10%] left-[-10%] w-[40%] aspect-square bg-accent-amber/20 rounded-full blur-[120px]"
      />
    </div>

    <div class="relative z-10 max-w-4xl w-full flex flex-col items-center gap-8 md:gap-12">
      <!-- Header Section -->
      <header class="text-center space-y-4 animate-fade-up">
        <h1
          class="text-5xl md:text-7xl font-display font-black tracking-tighter text-white flex flex-wrap items-center justify-center gap-x-4"
        >
          <span class="text-accent-coral drop-shadow-[0_5px_15px_rgba(255,107,74,0.4)]">ĐẤM</span>
          <span class="text-white relative">
            VÀO MẶT
            <div
              class="absolute -bottom-2 left-0 w-full h-1 bg-accent-amber transform -skew-x-12"
            />
          </span>
          <span class="inline-block animate-bounce-slow">🥊</span>
        </h1>
        <p
          class="text-text-secondary text-lg max-w-lg mx-auto flex items-center justify-center gap-3"
        >
          <Icon icon="lucide:volume-2" class="text-accent-amber animate-pulse shrink-0" />
          <span>Click để bật âm thanh, giơ mặt để nhận đấm!</span>
        </p>
      </header>

      <!-- Main Interaction Area -->
      <div
        ref="containerRef"
        class="relative w-full max-w-3xl aspect-video bg-bg-surface border-4 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] overflow-hidden group transition-all duration-300 animate-fade-up animate-delay-2"
        :class="[
          isFlashing
            ? 'border-accent-coral shadow-[0_0_40px_rgba(255,107,74,0.8)] animate-damage-shake'
            : 'border-border-default',
        ]"
      >
        <!-- Permission Check (Simple approach) -->
        <div
          v-if="!stream"
          class="absolute inset-0 flex flex-col items-center justify-center bg-bg-deep p-8 z-50 text-center"
        >
          <Icon icon="lucide:camera-off" class="w-16 h-16 text-text-dim mb-4" />
          <h2 class="text-xl font-display font-bold text-white mb-2">Đang đợi Camera...</h2>
          <p class="text-text-dim text-sm">Vui lòng cho phép quyền truy cập camera.</p>
        </div>

        <!-- AI Loading State -->
        <div
          v-if="!isModelLoaded && stream"
          class="absolute inset-0 flex flex-col items-center justify-center bg-bg-surface/90 backdrop-blur-xl z-40 transition-opacity duration-500"
        >
          <div class="relative">
            <Icon icon="lucide:loader-2" class="w-16 h-16 text-accent-sky animate-spin" />
            <div class="absolute inset-0 blur-xl bg-accent-sky/30 animate-pulse" />
          </div>
          <p
            class="mt-8 text-text-primary font-display font-bold tracking-[0.3em] uppercase animate-pulse"
          >
            Booting OS... Detection System Online
          </p>
        </div>

        <!-- Camera Feed -->
        <video
          ref="videoRef"
          autoplay
          playsinline
          muted
          class="w-full h-full object-cover grayscale-[0.3] contrast-[1.1] brightness-[0.9]"
          style="transform: scaleX(-1)"
        />

        <!-- Overlay Effects (Retro Vibe) -->
        <div class="absolute inset-0 pointer-events-none z-10">
          <!-- Scanlines -->
          <div
            class="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.02),rgba(0,255,0,0.01),rgba(0,0,255,0.02))] bg-[length:100%_4px,4px_100%]"
          />
          <!-- Vignette -->
          <div class="absolute inset-0 shadow-[inset_0_0_100px_rgba(0,0,0,0.5)]" />
          <!-- HUD Corners -->
          <div class="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-accent-sky/50" />
          <div class="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-accent-sky/50" />
          <div
            class="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-accent-sky/50"
          />
          <div
            class="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-accent-sky/50"
          />
        </div>

        <!-- Punches Layer -->
        <TransitionGroup name="punch">
          <div
            v-for="punch in punches"
            :key="punch.id"
            class="absolute pointer-events-none z-30 flex items-center justify-center"
            :style="{
              left: `${punch.x}px`,
              top: `${punch.y}px`,
              transform: `translate(calc(-50% + ${punch.hasHit ? 0 : punch.startX}px), calc(-50% + ${punch.hasHit ? 0 : punch.startY}px)) rotate(${punch.rotation}deg) scale(${punch.hasHit ? 1.3 : punch.startScale})`,
              transition: 'all 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
              opacity: punch.hasHit ? 1 : 0.5,
            }"
          >
            <!-- Glove -->
            <div
              class="text-[120px] drop-shadow-[0_25px_50px_rgba(0,0,0,0.9)] transition-transform duration-200 z-41"
              :style="{ transform: punch.flipX ? 'scaleX(-1)' : 'none' }"
            >
              🥊
            </div>

            <!-- Impact Label -->
            <transition name="impact">
              <div
                v-if="punch.hasHit"
                class="absolute inset-0 flex items-center justify-center whitespace-nowrap text-4xl font-black italic text-accent-amber z-40"
                style="
                  text-shadow:
                    0 0 30px rgba(255, 107, 74, 1),
                    5px 5px 0 #000,
                    -2px -2px 0 #000;
                "
              >
                {{ punch.displayLabel }}
              </div>
            </transition>
          </div>
        </TransitionGroup>
      </div>

      <!-- Control Bar / Status -->
      <footer class="flex flex-col sm:flex-row items-center gap-8 animate-fade-up animate-delay-3">
        <div
          class="flex items-center gap-6 px-6 py-3 bg-bg-surface/50 border border-border-default rounded-full backdrop-blur-md"
        >
          <div class="flex items-center gap-2">
            <div
              class="w-3 h-3 rounded-full animate-pulse shadow-[0_0_10px_currentColor]"
              :class="
                isModelLoaded ? 'bg-green-500 text-green-500' : 'bg-accent-coral text-accent-coral'
              "
            ></div>
            <span
              class="text-[10px] uppercase font-display font-bold tracking-widest text-text-secondary"
              >AI Brain</span
            >
          </div>
          <div class="w-px h-4 bg-border-default" />
          <div class="flex items-center gap-2">
            <div
              class="w-3 h-3 rounded-full animate-pulse shadow-[0_0_10px_currentColor]"
              :class="stream ? 'bg-green-500 text-green-500' : 'bg-accent-coral text-accent-coral'"
            ></div>
            <span
              class="text-[10px] uppercase font-display font-bold tracking-widest text-text-secondary"
              >Sensors</span
            >
          </div>
        </div>

        <RouterLink
          to="/"
          class="flex items-center gap-3 px-8 py-3 bg-accent-coral text-white font-display font-black tracking-tighter hover:bg-white hover:text-accent-coral transition-all duration-300 transform hover:scale-105 active:scale-95 group shadow-[0_10px_20px_-5px_rgba(255,107,74,0.4)]"
        >
          <Icon
            icon="lucide:arrow-left"
            class="w-5 h-5 group-hover:-translate-x-1 transition-transform"
          />
          VỀ TRANG CHỦ
        </RouterLink>
      </footer>
    </div>
  </div>
</template>

<style scoped>
/* Base Animations */
.animate-bounce-slow {
  animation: bounce-slow 2s infinite;
}
@keyframes bounce-slow {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

/* Punch Transitions */
.punch-enter-active {
  transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
.punch-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 1, 1);
}
.punch-enter-from {
  opacity: 0;
  /* Randomized via inline styles */
}
.punch-leave-to {
  opacity: 0;
  transform: translate(-50%, 150%) scale(0.3) rotate(30deg) !important;
}

/* Impact Label Pop */
.impact-enter-active {
  animation: impact-pop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
@keyframes impact-pop {
  0% {
    transform: scale(0) rotate(-25deg);
    opacity: 0;
  }
  40% {
    transform: scale(1.6) rotate(15deg);
    opacity: 1;
  }
  100% {
    transform: scale(1.4) rotate(0deg);
    opacity: 1;
  }
}

.impact-leave-active {
  transition: all 0.2s ease-in;
}
.impact-leave-to {
  opacity: 0;
  transform: scale(2.5) rotate(10deg);
}

/* Screen Shake Effect */
.animate-damage-shake {
  animation: damage-shake 0.15s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
}
@keyframes damage-shake {
  10%,
  90% {
    transform: translate3d(-1px, 0, 0);
  }
  20%,
  80% {
    transform: translate3d(2px, 0, 0);
  }
  30%,
  50%,
  70% {
    transform: translate3d(-4px, 0, 0);
  }
  40%,
  60% {
    transform: translate3d(4px, 0, 0);
  }
}

/* Scroll reveal emulation for headers */
.animate-fade-up {
  animation: fade-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) both;
}
@keyframes fade-up {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-delay-2 {
  animation-delay: 0.2s;
}
.animate-delay-3 {
  animation-delay: 0.4s;
}
</style>
