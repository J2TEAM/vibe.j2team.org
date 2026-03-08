<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { RouterLink } from 'vue-router'

const TOTAL_SECONDS = 150 // 2 phút
const secondsLeft = ref(TOTAL_SECONDS)
const isCounting = ref(false)
const isDone = ref(false)
const videoRef = ref<HTMLVideoElement | null>(null)
const audioRef = ref<HTMLAudioElement | null>(null)
const birdSoundUrl = '/sounds/birds.mp3'
let intervalId: ReturnType<typeof setInterval> | null = null
let audioContext: AudioContext | null = null
let birdTimeoutId: ReturnType<typeof setTimeout> | null = null

function playNote(
  ctx: AudioContext,
  freq: number,
  startTime: number,
  duration: number,
  volume: number,
): void {
  const osc = ctx.createOscillator()
  const osc2 = ctx.createOscillator()
  const gain = ctx.createGain()
  const gain2 = ctx.createGain()
  osc.type = 'sine'
  osc2.type = 'sine'
  osc.frequency.value = freq
  osc2.frequency.value = freq * 2.2
  gain2.gain.value = 0.25
  osc.connect(gain)
  osc2.connect(gain2)
  gain2.connect(gain)
  gain.connect(ctx.destination)
  gain.gain.setValueAtTime(0, startTime)
  gain.gain.linearRampToValueAtTime(volume, startTime + 0.015)
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration)
  osc.start(startTime)
  osc.stop(startTime + duration)
  osc2.start(startTime)
  osc2.stop(startTime + duration)
}

function playChirp(ctx: AudioContext): void {
  const baseFreq = 1800 + Math.random() * 1600
  const numNotes = 2 + Math.floor(Math.random() * 3)
  const now = ctx.currentTime
  for (let i = 0; i < numNotes; i++) {
    const f = baseFreq + (Math.random() - 0.5) * 400
    playNote(ctx, f, now + i * 0.06, 0.08 + Math.random() * 0.06, 0.1)
  }
}

function scheduleNextChirp(): void {
  if (!audioContext || audioContext.state !== 'running') return
  playChirp(audioContext)
  const next = 0.8 + Math.random() * 2.2
  birdTimeoutId = setTimeout(scheduleNextChirp, next * 1000)
}

function createAndPlayBirdSound(): void {
  try {
    const ctx = new AudioContext()
    audioContext = ctx
    scheduleNextChirp()
  } catch {}
}

function stopBirdSound(): void {
  if (birdTimeoutId) {
    clearTimeout(birdTimeoutId)
    birdTimeoutId = null
  }
  audioContext = null
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function resetTimer(): void {
  if (!isCounting.value || isDone.value) return
  secondsLeft.value = TOTAL_SECONDS
}

async function start(): Promise<void> {
  isCounting.value = true
  isDone.value = false
  secondsLeft.value = TOTAL_SECONDS
  videoRef.value?.play().catch(() => {})
  const audio = audioRef.value
  if (audio) {
    audio.volume = 1
    audio.play().catch(() => createAndPlayBirdSound())
  } else {
    createAndPlayBirdSound()
  }
  await nextTick()
  if (intervalId) clearInterval(intervalId)
  intervalId = setInterval(() => {
    secondsLeft.value -= 1
    if (secondsLeft.value <= 0) {
      if (intervalId) clearInterval(intervalId)
      intervalId = null
      isCounting.value = false
      isDone.value = true
      audioRef.value?.pause()
      stopBirdSound()
      videoRef.value?.pause()
    }
  }, 1000)
}

function handleInteraction(): void {
  if (isCounting.value && !isDone.value) {
    resetTimer()
  }
}

onMounted(() => {
  window.addEventListener('mousemove', handleInteraction)
  window.addEventListener('keydown', handleInteraction)
  window.addEventListener('touchstart', handleInteraction)
})

onUnmounted(() => {
  window.removeEventListener('mousemove', handleInteraction)
  window.removeEventListener('keydown', handleInteraction)
  window.removeEventListener('touchstart', handleInteraction)
  if (intervalId) clearInterval(intervalId)
  audioRef.value?.pause()
  stopBirdSound()
})
</script>

<template>
  <div class="relative min-h-screen flex flex-col overflow-hidden">
    <!-- Video rừng / chim full màn hình -->
    <video
      ref="videoRef"
      class="absolute inset-0 w-full h-full object-cover"
      autoplay
      loop
      muted
      playsinline
      aria-hidden="true"
    >
      <source src="https://assets.mixkit.co/videos/16937/16937-720.mp4" type="video/mp4" />
    </video>
    <!-- Lớp phủ tối nhẹ để chữ dễ đọc -->
    <div
      class="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/50"
      aria-hidden="true"
    />

    <!-- Nội dung -->
    <div class="relative flex-1 flex flex-col items-center justify-center px-4 py-12">
      <!-- Trước khi bắt đầu -->
      <template v-if="!isCounting && !isDone">
        <h1
          class="font-display text-2xl sm:text-3xl font-semibold text-white/95 text-center animate-fade-up"
        >
          Đừng làm gì cả
        </h1>
        <p class="mt-4 text-white/80 text-center max-w-md text-sm sm:text-base">
          Chỉ cần thư giãn và lắng nghe. Đừng chạm chuột hay bàn phím.
        </p>
        <p class="mt-2 text-white/60 text-xs">Bật loa khi bấm Bắt đầu.</p>
        <button
          type="button"
          class="mt-8 font-display font-semibold text-bg-deep bg-accent-amber px-8 py-3 border-0 cursor-pointer transition opacity-90 hover:opacity-100 animate-fade-up animate-delay-2"
          @click="start"
        >
          Bắt đầu
        </button>
      </template>

      <!-- Đang đếm ngược -->
      <template v-else-if="isCounting">
        <p class="font-display text-6xl sm:text-7xl font-bold text-white mt-4 tabular-nums">
          {{ formatTime(secondsLeft) }}
        </p>
      </template>

      <!-- Xong 2 phút -->
      <template v-else>
        <p
          class="font-display text-2xl sm:text-3xl font-semibold text-white text-center animate-fade-up"
        >
          Bạn đã làm được.
        </p>
        <p class="mt-3 text-white/80 text-center animate-fade-up animate-delay-1">
          2 phút không làm gì cả. Thật đấy.
        </p>
        <RouterLink
          to="/"
          class="mt-8 inline-flex items-center gap-2 border-2 border-white/50 bg-white/10 px-6 py-3 text-white font-display text-sm transition hover:bg-white/20 hover:border-white animate-fade-up animate-delay-2"
        >
          &larr; Về trang chủ
        </RouterLink>
      </template>

      <!-- Link về trang chủ khi chưa bắt đầu -->
      <RouterLink
        v-if="!isCounting && !isDone"
        to="/"
        class="absolute top-4 left-4 text-white/70 hover:text-white text-sm font-display transition"
      >
        &larr; Trang chủ
      </RouterLink>
    </div>

    <!-- Tiếng chim thật: file trong public/sounds/ (dùng :src để Vite không resolve thành import) -->
    <audio ref="audioRef" loop preload="metadata">
      <source :src="birdSoundUrl" type="audio/mpeg" />
    </audio>
  </div>
</template>
