<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'

interface Color {
  r: number
  g: number
  b: number
  string: string
}

const score = ref(0)
const highScore = ref(parseInt(localStorage.getItem('color-guessing-high-score') || '0'))
const lives = ref(3)
const targetColor = ref<Color | null>(null)
const options = ref<Color[]>([])
const status = ref<'playing' | 'correct' | 'wrong' | 'game_over'>('playing')
const selectedIndex = ref<number | null>(null)

function generateRandomColor(): Color {
  const r = Math.floor(Math.random() * 256)
  const g = Math.floor(Math.random() * 256)
  const b = Math.floor(Math.random() * 256)
  return { r, g, b, string: `rgb(${r}, ${g}, ${b})` }
}

function startNewRound() {
  status.value = 'playing'
  selectedIndex.value = null

  const correct = generateRandomColor()
  targetColor.value = correct

  const newOptions: Color[] = [correct]
  while (newOptions.length < 6) {
    const random = generateRandomColor()
    // Avoid duplicates
    if (!newOptions.some((opt) => opt.string === random.string)) {
      newOptions.push(random)
    }
  }

  // Shuffle options
  options.value = newOptions.sort(() => Math.random() - 0.5)
}

function handleGuess(index: number) {
  if (status.value !== 'playing') return

  selectedIndex.value = index
  const selected = options.value[index]
  if (!selected) return

  if (selected.string === targetColor.value?.string) {
    status.value = 'correct'
    score.value++
    if (score.value > highScore.value) {
      highScore.value = score.value
      localStorage.setItem('color-guessing-high-score', highScore.value.toString())
    }
    setTimeout(startNewRound, 1000)
  } else {
    status.value = 'wrong'
    lives.value--
    if (lives.value <= 0) {
      setTimeout(() => {
        status.value = 'game_over'
      }, 500)
    } else {
      setTimeout(() => {
        status.value = 'playing'
        selectedIndex.value = null
      }, 800)
    }
  }
}

function resetGame() {
  score.value = 0
  lives.value = 3
  startNewRound()
}

onMounted(() => {
  startNewRound()
})
</script>

<template>
  <div
    class="min-h-screen bg-bg-deep text-text-primary font-body flex flex-col items-center px-6 py-12 overflow-x-hidden relative"
  >
    <!-- Decorative Issue Badge -->
    <div
      class="absolute top-10 -right-4 bg-accent-coral text-bg-deep font-display font-bold text-xs tracking-widest px-4 py-2 rotate-3 z-20 hidden md:block select-none"
    >
      VOL.01 / 2026
    </div>

    <!-- Header/Nav -->
    <div
      class="w-full max-w-3xl flex flex-wrap justify-between items-end gap-4 mb-8 animate-fade-up"
    >
      <RouterLink
        to="/"
        class="inline-flex items-center gap-2 border border-border-default bg-bg-surface px-4 py-2 text-sm text-text-secondary transition-all hover:border-accent-coral hover:text-text-primary"
      >
        <span class="text-accent-coral">&larr;</span> Trang chủ
      </RouterLink>

      <div class="flex gap-3 items-center">
        <div
          class="bg-bg-surface border border-border-default p-3 transition-all hover:border-accent-coral group"
        >
          <span
            class="text-[10px] text-text-dim block uppercase tracking-widest font-display mb-0.5 group-hover:text-accent-coral transition-colors"
          >
            <span class="text-accent-coral font-display text-[8px] tracking-widest mr-1">//</span>
            Điểm
          </span>
          <span class="text-xl font-bold font-display text-accent-coral">{{ score }}</span>
        </div>
        <div
          class="bg-bg-surface border border-border-default p-3 text-right transition-all hover:border-accent-amber group"
        >
          <span
            class="text-[10px] text-text-dim block uppercase tracking-widest font-display mb-0.5 group-hover:text-accent-amber transition-colors"
          >
            Kỷ lục
            <span class="text-accent-amber font-display text-[8px] tracking-widest ml-1">//</span>
          </span>
          <span class="text-xl font-bold font-display">{{ highScore }}</span>
        </div>
      </div>
    </div>

    <!-- Dot Divider -->
    <div class="w-full max-w-3xl flex gap-1.5 mb-12 animate-fade-up animate-delay-1">
      <span v-for="n in 24" :key="n" class="w-1 h-1 rounded-full bg-border-default/50" />
    </div>

    <!-- Game Container -->
    <div class="w-full max-w-3xl flex-1 flex flex-col items-center justify-center space-y-10">
      <!-- Lives Display -->
      <div class="flex gap-3 animate-fade-up animate-delay-2">
        <div
          v-for="n in 3"
          :key="n"
          class="transition-all duration-500"
          :class="n <= lives ? 'scale-100' : 'scale-90 opacity-10 grayscale'"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-8 w-8 text-accent-coral fill-current"
            viewBox="0 0 24 24"
          >
            <path
              d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
            />
          </svg>
        </div>
      </div>

      <!-- Target Display -->
      <div class="text-center space-y-3 animate-fade-up animate-delay-3 w-full max-w-xl">
        <h2
          class="font-display text-lg font-semibold text-text-primary flex items-center justify-center gap-3"
        >
          <span class="text-accent-coral font-display text-xs tracking-widest">//</span>
          TÌM MÃ MÀU
          <span class="text-accent-coral font-display text-xs tracking-widest">//</span>
        </h2>
        <div
          class="font-display text-4xl md:text-5xl font-bold tracking-tighter bg-bg-surface border border-border-default px-8 py-6 shadow-xl transition-all duration-300"
          :class="{
            'border-accent-coral text-accent-coral shadow-accent-coral/10 scale-105':
              status === 'correct',
            'border-red-500/50 text-red-500 animate-shake': status === 'wrong',
          }"
        >
          {{ targetColor?.string || 'READY' }}
        </div>
      </div>

      <!-- Options Grid -->
      <div class="grid grid-cols-2 md:grid-cols-3 gap-5 w-full animate-fade-up animate-delay-4">
        <button
          v-for="(color, index) in options"
          :key="index"
          @click="handleGuess(index)"
          :disabled="status !== 'playing'"
          class="group relative aspect-square transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-accent-coral/10 border border-border-default overflow-hidden bg-bg-surface"
          :style="{ backgroundColor: color.string }"
          :class="[
            selectedIndex === index && status === 'correct'
              ? 'border-accent-coral z-10 border-4 scale-105'
              : '',
            selectedIndex === index && status === 'wrong'
              ? 'border-red-500 animate-shake z-10 border-4'
              : '',
            status !== 'playing' && color.string !== targetColor?.string
              ? 'opacity-30 grayscale-[0.5] scale-95'
              : 'hover:border-accent-coral hover:border-2',
          ]"
        >
          <!-- Background Number -->
          <span
            class="absolute top-3 left-3 font-display text-6xl font-bold text-white/10 select-none pointer-events-none group-hover:text-white/20 transition-colors"
          >
            0{{ index + 1 }}
          </span>

          <div
            class="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"
          ></div>

          <div
            v-if="selectedIndex === index"
            class="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm text-white"
          >
            <svg
              v-if="status === 'correct'"
              class="w-12 h-12 text-white drop-shadow-lg"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="4"
                d="M5 13l4 4L19 7"
              />
            </svg>
            <svg
              v-if="status === 'wrong'"
              class="w-12 h-12 text-red-500 drop-shadow-lg"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="4"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
        </button>
      </div>
    </div>

    <!-- Game Over Overlay -->
    <div
      v-if="status === 'game_over'"
      class="fixed inset-0 bg-bg-deep/95 backdrop-blur-xl flex items-center justify-center z-50 p-6"
    >
      <div
        class="bg-bg-surface border border-accent-coral p-8 shadow-2xl max-w-sm w-full text-center space-y-6 relative overflow-hidden animate-fade-up"
      >
        <!-- Background Decor -->
        <span
          class="absolute -top-6 -right-6 font-display text-9xl font-bold text-accent-coral/5 select-none pointer-events-none"
        >
          !
        </span>

        <h2 class="text-4xl font-bold font-display text-accent-coral tracking-tighter italic">
          GAME OVER
        </h2>

        <div class="space-y-1.5 py-4 border-y border-border-default">
          <p class="text-text-dim font-display tracking-widest text-[10px] uppercase">
            Điểm số cuối cùng
          </p>
          <p class="text-5xl font-black text-text-primary font-display tracking-tighter">
            {{ score }}
          </p>
        </div>

        <div
          v-if="score === highScore && score > 0"
          class="bg-accent-amber/10 text-accent-amber px-3 py-2 font-display font-bold tracking-widest text-xs border border-accent-amber/20 animate-pulse"
        >
          // KỶ LỤC MỚI //
        </div>

        <button
          @click="resetGame"
          class="w-full py-4 bg-accent-coral text-bg-deep font-display font-bold text-base tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-accent-coral/20 uppercase"
        >
          Thử Lại
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes shake {
  0%,
  100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-10px);
  }
  75% {
    transform: translateX(10px);
  }
}

.animate-shake {
  animation: shake 0.2s ease-in-out 3;
}
</style>
