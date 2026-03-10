<script setup lang="ts">
import { ref, onUnmounted } from 'vue'

const props = defineProps<{ selectedTime: number }>()
const emit = defineEmits<{
  startScan: []
  releaseMouse: []
}>()

const isHolding = ref(false)
const progress = ref(0)
let progressInterval: ReturnType<typeof setInterval> | null = null

function startHold() {
  isHolding.value = true
  progress.value = 0
  progressInterval = setInterval(() => {
    progress.value = Math.min(100, progress.value + 100 / (props.selectedTime * 10))
  }, 100)
  emit('startScan')
}

function endHold() {
  if (!isHolding.value) return
  isHolding.value = false
  if (progressInterval) {
    clearInterval(progressInterval)
    progressInterval = null
  }
  emit('releaseMouse')
}

onUnmounted(() => {
  if (progressInterval) clearInterval(progressInterval)
})
</script>

<template>
  <div class="flex flex-col items-center text-center px-4 animate-fade-up">
    <!-- Header -->
    <div
      class="mb-6 inline-flex items-center gap-2 border border-accent-coral/30 bg-accent-coral/10 px-4 py-1.5 text-xs font-display tracking-widest text-accent-coral uppercase"
    >
      <span class="w-1.5 h-1.5 rounded-full bg-accent-coral animate-pulse inline-block"></span>
      Đang đo nhịp tim
    </div>

    <h2
      class="font-display text-3xl sm:text-4xl font-bold text-text-primary mb-2 animate-fade-up animate-delay-1"
    >
      Bước 2 / 2
    </h2>
    <p class="text-text-secondary text-sm mb-8 animate-fade-up animate-delay-2">
      Giữ nút bên dưới trong <strong class="text-text-primary">{{ selectedTime }} giây</strong>
    </p>

    <!-- Divider -->
    <div class="flex gap-1.5 mb-8">
      <span v-for="n in 20" :key="n" class="w-1 h-1 rounded-full bg-border-default" />
    </div>

    <!-- Monitor display -->
    <div
      class="w-full max-w-sm border border-border-default bg-bg-surface p-4 mb-6 animate-fade-up animate-delay-3"
    >
      <div class="flex items-center justify-between mb-2">
        <span class="text-xs font-display tracking-widest text-text-dim uppercase"
          >ECG Monitor</span
        >
        <span
          :class="isHolding ? 'text-accent-coral' : 'text-text-dim'"
          class="text-xs font-display tracking-wide transition-colors"
        >
          {{ isHolding ? '● RECORDING' : '○ STANDBY' }}
        </span>
      </div>
      <!-- Fake ECG line -->
      <svg class="w-full h-12" viewBox="0 0 300 48" preserveAspectRatio="none">
        <polyline
          v-if="!isHolding"
          points="0,24 60,24 80,24 100,24 120,24 140,24 160,24 180,24 200,24 220,24 240,24 260,24 280,24 300,24"
          fill="none"
          stroke="#253549"
          stroke-width="2"
        />
        <polyline
          v-else
          points="0,24 20,24 30,24 40,8 50,40 60,16 70,32 80,24 100,24 120,24 130,24 140,8 150,40 160,16 170,32 180,24 200,24 220,24 230,24 240,8 250,40 260,16 270,32 280,24 300,24"
          fill="none"
          stroke="#FF6B4A"
          stroke-width="2"
          class="ecg-animate"
        />
      </svg>
      <!-- Progress bar -->
      <div class="mt-3 h-1 bg-bg-elevated w-full">
        <div
          class="h-1 bg-accent-coral transition-all duration-100"
          :style="{ width: `${progress}%` }"
        ></div>
      </div>
    </div>

    <!-- Hold Button -->
    <button
      :class="[
        'w-full max-w-sm select-none touch-manipulation font-display font-bold tracking-widest uppercase transition-all duration-200',
        isHolding
          ? 'border-2 border-accent-coral bg-accent-coral text-bg-deep py-6 text-lg shadow-lg shadow-accent-coral/30 scale-95'
          : 'border-2 border-accent-coral/60 bg-accent-coral/10 text-accent-coral py-6 text-lg hover:border-accent-coral hover:bg-accent-coral/20 active:scale-95',
      ]"
      @mousedown="startHold"
      @mouseup="endHold"
      @mouseleave="endHold"
      @touchstart.prevent="startHold"
      @touchend.prevent="endHold"
    >
      <span v-if="!isHolding">▼ GIỮ ĐỂ ĐO NHỊP TIM ▼</span>
      <span v-else class="flex items-center justify-center gap-3">
        <span class="w-2 h-2 rounded-full bg-bg-deep animate-ping inline-block"></span>
        ĐANG ĐO...
        <span
          class="w-2 h-2 rounded-full bg-bg-deep animate-ping inline-block"
          style="animation-delay: 150ms"
        ></span>
      </span>
    </button>

    <p class="mt-4 text-xs text-text-dim animate-fade-up animate-delay-4">
      Thả tay bất cứ lúc nào để dừng
    </p>
  </div>
</template>

<style scoped>
.ecg-animate {
  stroke-dasharray: 600;
  stroke-dashoffset: 600;
  animation: ecg-draw 1.5s linear infinite;
}

@keyframes ecg-draw {
  0% {
    stroke-dashoffset: 600;
  }
  100% {
    stroke-dashoffset: 0;
  }
}
</style>
