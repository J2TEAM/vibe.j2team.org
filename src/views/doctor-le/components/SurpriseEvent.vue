<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'

defineEmits<{ release: [] }>()

// Đường dẫn tới assets thật — bạn đặt file vào public/images/doctor-le/ và public/sounds/doctor-le/
const SCARE_IMAGE = '/images/doctor-le/smile.png' // ảnh jumpscare
const SCREAM_AUDIO = '/sounds/doctor-le/smile.mp3' // âm thanh scream

const hasImage = ref(false)
const audioRef = ref<HTMLAudioElement | null>(null)

// Kiểm tra ảnh có tồn tại không bằng cách fetch HEAD
async function checkImage() {
  try {
    const res = await fetch(SCARE_IMAGE, { method: 'HEAD' })
    hasImage.value = res.ok
  } catch {
    hasImage.value = false
  }
}

function playScream() {
  // Thử dùng file mp3 trước
  const audio = new Audio(SCREAM_AUDIO)
  audio.volume = 1.0
  audioRef.value = audio
  audio.play().catch(() => {
    // Fallback: Web Audio API noise burst
    playFallbackScream()
  })
}

function playFallbackScream() {
  try {
    const ctx = new AudioContext()
    const bufferSize = ctx.sampleRate * 0.8
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.15))
    }
    const source = ctx.createBufferSource()
    source.buffer = buffer
    const gainNode = ctx.createGain()
    gainNode.gain.setValueAtTime(1.5, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8)
    const distortion = ctx.createWaveShaper()
    const curve = new Float32Array(256)
    for (let i = 0; i < 256; i++) {
      const x = (i * 2) / 256 - 1
      curve[i] = ((Math.PI + 400) * x) / (Math.PI + 400 * Math.abs(x))
    }
    distortion.curve = curve
    source.connect(distortion)
    distortion.connect(gainNode)
    gainNode.connect(ctx.destination)
    source.start()
    setTimeout(() => ctx.close(), 1000)
  } catch {
    // Audio not supported
  }
}

onMounted(() => {
  checkImage()
  playScream()
})

onUnmounted(() => {
  if (audioRef.value) {
    audioRef.value.pause()
    audioRef.value = null
  }
})
</script>

<template>
  <div
    class="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black cursor-pointer"
    @mouseup="$emit('release')"
    @touchend.prevent="$emit('release')"
  >
    <!-- Flash effect -->
    <div class="absolute inset-0 bg-white scare-flash pointer-events-none"></div>

    <!-- Scary content -->
    <div class="relative z-10 flex flex-col items-center select-none">
      <!-- Ảnh thật nếu có, fallback về emoji -->
      <div class="scare-face mb-4">
        <img
          v-if="hasImage"
          :src="SCARE_IMAGE"
          alt="jumpscare"
          class="w-64 h-64 sm:w-80 sm:h-80 object-cover"
        />
        <span v-else class="text-[160px] sm:text-[200px] leading-none block">👻</span>
      </div>

      <div
        class="font-display font-black text-white text-4xl sm:text-6xl tracking-widest uppercase scare-text text-center px-4"
      >
        BOO!
      </div>
      <div
        class="font-display text-red-500 text-lg sm:text-xl tracking-wide uppercase mt-3 scare-text-2"
      >
        Ớ Ớ Ớ ĐỪNG DỪNG LẠI?
      </div>
    </div>

    <!-- Corner decorations -->
    <div
      class="absolute top-4 left-4 font-display text-xs tracking-widest text-red-500/60 uppercase"
    >
      ● REC
    </div>
    <div
      class="absolute top-4 right-4 font-display text-xs tracking-widest text-white/30 uppercase"
    >
      THẢ TAY ĐỂ TIẾP TỤC
    </div>
    <div
      class="absolute bottom-4 left-0 right-0 text-center font-display text-xs tracking-widest text-white/30 uppercase"
    >
      Doctor Le Clinic · Tap / Release to continue
    </div>
  </div>
</template>

<style scoped>
.scare-flash {
  animation: flash 0.15s ease-out forwards;
}

@keyframes flash {
  0% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
}

.scare-face {
  animation: scare-pop 0.25s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
}

.scare-text {
  animation: scare-pop 0.3s cubic-bezier(0.36, 0.07, 0.19, 0.97) 0.05s both;
}

.scare-text-2 {
  animation: scare-pop 0.3s cubic-bezier(0.36, 0.07, 0.19, 0.97) 0.1s both;
}

@keyframes scare-pop {
  0% {
    opacity: 0;
    transform: scale(0.3) rotate(-5deg);
  }
  60% {
    transform: scale(1.1) rotate(2deg);
  }
  100% {
    opacity: 1;
    transform: scale(1) rotate(0deg);
  }
}
</style>
