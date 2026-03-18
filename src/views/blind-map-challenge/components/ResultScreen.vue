<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import type { GameResult, GameConfig } from '../types'
import { provinces } from '../data/provinces'
import { useLocalStorage } from '../composables/useLocalStorage'

const props = defineProps<{
  config: GameConfig
}>()

const emit = defineEmits<{
  (e: 'play-again'): void
  (e: 'change-mode'): void
}>()

const storage = useLocalStorage()
const showConfetti = ref(false)

// Get the latest result from history
const latestResult = computed<GameResult | null>(() => {
  const history = storage.getHistory()
  return history.length > 0 ? (history[0] ?? null) : null
})

const result = computed(() => latestResult.value)

// Grade
const grade = computed(() => {
  if (!result.value) return 'F'
  const acc = result.value.accuracy
  if (acc >= 95) return 'S'
  if (acc >= 85) return 'A'
  if (acc >= 70) return 'B'
  if (acc >= 50) return 'C'
  return 'F'
})

const gradeColor = computed(() => {
  switch (grade.value) {
    case 'S': return 'text-accent-amber'
    case 'A': return 'text-accent-sky'
    case 'B': return 'text-accent-coral'
    case 'C': return 'text-text-secondary'
    default: return 'text-text-dim'
  }
})

const gradeLabel = computed(() => {
  switch (grade.value) {
    case 'S': return 'Xuất sắc!'
    case 'A': return 'Giỏi lắm!'
    case 'B': return 'Khá tốt!'
    case 'C': return 'Tạm được'
    default: return 'Cần cải thiện'
  }
})

// Format time
function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

// Wrong provinces details
const wrongProvincesDetails = computed(() => {
  if (!result.value) return []
  return result.value.wrongProvinces.map(id => {
    const p = provinces.find(prov => prov.id === id)
    return p ? { id: p.id, name: p.name, zone: p.zone, region: p.region } : null
  }).filter(Boolean)
})

const correctCount = computed(() => {
  if (!result.value) return 0
  const total = props.config.mode === 'daily' ? 10
    : props.config.mode === 'region' ? provinces.filter(p => p.zone === props.config.regionFilter).length
    : 63
  return total - (result.value.wrongProvinces?.length || 0)
})

const totalCount = computed(() => {
  if (props.config.mode === 'daily') return 10
  if (props.config.mode === 'region') {
    return provinces.filter(p => p.zone === props.config.regionFilter).length
  }
  return 63
})

// Show confetti for grade S or A
onMounted(() => {
  if (grade.value === 'S' || grade.value === 'A') {
    showConfetti.value = true
    setTimeout(() => { showConfetti.value = false }, 4000)
  }
})
</script>

<template>
  <div class="min-h-screen bg-bg-deep text-text-primary font-body flex flex-col items-center
              justify-center px-4 py-8 relative overflow-hidden">

    <!-- Confetti effect -->
    <div v-if="showConfetti" class="confetti-container">
      <div v-for="i in 50" :key="i" class="confetti-piece"
           :style="{
             left: Math.random() * 100 + '%',
             animationDelay: Math.random() * 3 + 's',
             backgroundColor: ['#FF6B4A', '#FFB830', '#38BDF8', '#F0EDE6'][Math.floor(Math.random() * 4)],
           }" />
    </div>

    <div class="max-w-lg w-full">
      <!-- Grade -->
      <div class="text-center mb-8 animate-fade-up">
        <div class="inline-block mb-4">
          <span
            class="font-display text-8xl md:text-9xl font-bold"
            :class="gradeColor"
            style="text-shadow: 0 0 40px currentColor"
          >
            {{ grade }}
          </span>
        </div>
        <h1 class="font-display text-2xl md:text-3xl font-bold" :class="gradeColor">
          {{ gradeLabel }}
        </h1>
      </div>

      <!-- Stats -->
      <div
        v-if="result"
        class="border border-border-default bg-bg-surface p-5 mb-6 animate-fade-up animate-delay-1"
      >
        <div class="grid grid-cols-2 gap-4">
          <div class="text-center">
            <p class="text-text-dim text-xs font-display tracking-wide mb-1">TỔNG ĐIỂM</p>
            <p class="font-display text-2xl font-bold text-accent-coral">{{ result.score }}đ</p>
          </div>
          <div class="text-center">
            <p class="text-text-dim text-xs font-display tracking-wide mb-1">ĐỘ CHÍNH XÁC</p>
            <p class="font-display text-2xl font-bold text-accent-sky">{{ result.accuracy }}%</p>
          </div>
          <div class="text-center">
            <p class="text-text-dim text-xs font-display tracking-wide mb-1">SỐ TỈNH ĐÚNG</p>
            <p class="font-display text-2xl font-bold text-text-primary">
              {{ correctCount }}/{{ totalCount }}
            </p>
          </div>
          <div class="text-center">
            <p class="text-text-dim text-xs font-display tracking-wide mb-1">THỜI GIAN</p>
            <p class="font-display text-2xl font-bold text-accent-amber">
              {{ formatTime(result.timeUsed) }}
            </p>
          </div>
        </div>
      </div>

      <!-- Wrong provinces list -->
      <div
        v-if="wrongProvincesDetails.length > 0"
        class="border border-border-default bg-bg-surface p-4 mb-6 animate-fade-up animate-delay-2"
      >
        <h3 class="font-display text-sm font-semibold mb-3 flex items-center gap-2">
          <span class="text-accent-coral text-sm">//</span>
          Tỉnh chưa gắn đúng ({{ wrongProvincesDetails.length }})
        </h3>
        <div class="flex flex-wrap gap-1.5">
          <span
            v-for="wp in wrongProvincesDetails"
            :key="wp!.id"
            class="border border-accent-coral/30 bg-accent-coral/5 px-2 py-1 text-xs
                   font-display text-accent-coral"
          >
            {{ wp!.name }}
          </span>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex flex-col sm:flex-row gap-3 animate-fade-up animate-delay-3">
        <button
          class="flex-1 py-3 bg-accent-coral text-bg-deep font-display font-bold text-sm
                 tracking-wide transition-all duration-200
                 hover:bg-accent-amber hover:-translate-y-0.5"
          @click="emit('play-again')"
        >
          🔄 Chơi lại
        </button>
        <button
          class="flex-1 py-3 border border-border-default bg-bg-surface font-display
                 text-sm text-text-secondary transition-all duration-200
                 hover:border-accent-sky hover:text-text-primary"
          @click="emit('change-mode')"
        >
          ⚙️ Đổi chế độ
        </button>
        <RouterLink
          to="/"
          class="flex-1 py-3 border border-border-default bg-bg-surface font-display
                 text-sm text-text-secondary text-center transition-all duration-200
                 hover:border-accent-coral hover:text-text-primary"
        >
          ← Trang chủ
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<style scoped>
.confetti-container {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 100;
  overflow: hidden;
}

.confetti-piece {
  position: absolute;
  top: -10px;
  width: 8px;
  height: 8px;
  animation: confetti-fall 3.5s linear forwards;
}

@keyframes confetti-fall {
  0% {
    transform: translateY(0) rotate(0deg);
    opacity: 1;
  }
  100% {
    transform: translateY(100vh) rotate(720deg);
    opacity: 0;
  }
}
</style>
