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
    if (!newOptions.some(opt => opt.string === random.string)) {
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
  <div class="min-h-screen bg-bg-deep text-text-primary font-body flex flex-col items-center px-4 py-8 overflow-x-hidden">
    <!-- Header/Nav -->
    <div class="w-full max-w-2xl flex justify-between items-center mb-8">
      <RouterLink
        to="/"
        class="inline-flex items-center gap-2 border border-border-default bg-bg-surface px-4 py-2 text-sm text-text-secondary transition hover:border-accent-coral hover:text-text-primary rounded-lg"
      >
        &larr; Trang chủ
      </RouterLink>
      
      <div class="flex gap-4 items-center">
        <div class="bg-bg-surface border border-border-default px-4 py-2 rounded-lg">
          <span class="text-xs text-text-secondary block uppercase tracking-wider">Điểm</span>
          <span class="text-xl font-bold text-accent-coral">{{ score }}</span>
        </div>
        <div class="bg-bg-surface border border-border-default px-4 py-2 rounded-lg text-right">
          <span class="text-xs text-text-secondary block uppercase tracking-wider">Kỷ lục</span>
          <span class="text-xl font-bold">{{ highScore }}</span>
        </div>
      </div>
    </div>

    <!-- Game Container -->
    <div class="w-full max-w-2xl flex-1 flex flex-col items-center justify-center space-y-8">
      <!-- Lives Display -->
      <div class="flex gap-2">
        <div 
          v-for="n in 3" :key="n"
          class="transition-all duration-300"
          :class="n <= lives ? 'scale-110' : 'scale-90 opacity-20 grayscale'"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-accent-coral fill-current" viewBox="0 0 24 24">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
        </div>
      </div>

      <!-- Target Display -->
      <div class="text-center space-y-2 animate-fade-in">
        <h2 class="text-text-secondary uppercase tracking-[0.2em] text-sm">Tìm mã màu sau</h2>
        <div 
          class="font-mono text-4xl sm:text-5xl font-bold tracking-tight bg-bg-surface border border-border-default px-8 py-6 rounded-2xl shadow-xl transition-all duration-300"
          :class="{
            'border-green-500/50 text-green-500 shadow-green-500/10 scale-105': status === 'correct',
            'border-red-500/50 text-red-500 animate-shake': status === 'wrong'
          }"
        >
          {{ targetColor?.string || 'Cố lên!' }}
        </div>
      </div>

      <!-- Options Grid -->
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-4 w-full">
        <button
          v-for="(color, index) in options"
          :key="index"
          @click="handleGuess(index)"
          :disabled="status !== 'playing'"
          class="group relative aspect-square rounded-2xl shadow-md transition-all duration-300 hover:scale-105 active:scale-95 overflow-hidden border-4"
          :style="{ backgroundColor: color.string }"
          :class="[
            selectedIndex === index && status === 'correct' ? 'border-green-500 z-10' : 'border-transparent',
            selectedIndex === index && status === 'wrong' ? 'border-red-500 animate-shake' : '',
            status !== 'playing' && color.string !== targetColor?.string ? 'opacity-40 grayscale-[0.5] scale-90' : ''
          ]"
        >
          <div 
            class="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"
          ></div>
          <div 
            v-if="selectedIndex === index"
            class="absolute inset-0 flex items-center justify-center bg-black/20 text-white"
          >
            <svg v-if="status === 'correct'" class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
            </svg>
            <svg v-if="status === 'wrong'" class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        </button>
      </div>
    </div>

    <!-- Game Over Overlay -->
    <div 
      v-if="status === 'game_over'" 
      class="fixed inset-0 bg-bg-deep/90 backdrop-blur-md flex items-center justify-center z-50 animate-fade-in"
    >
      <div class="bg-bg-surface border border-border-default p-10 rounded-3xl shadow-2xl max-w-sm w-full text-center space-y-6">
        <h2 class="text-4xl font-bold font-display text-accent-coral">Game Over!</h2>
        <div class="space-y-1">
          <p class="text-text-secondary">Điểm số cuối cùng</p>
          <p class="text-5xl font-black text-text-primary">{{ score }}</p>
        </div>
        <div v-if="score === highScore && score > 0" class="text-green-500 font-bold animate-bounce">
          Kỷ lục mới! 🏆
        </div>
        <button 
          @click="resetGame"
          class="w-full py-4 bg-accent-coral text-white font-bold rounded-xl hover:bg-accent-coral/90 transition shadow-lg shadow-accent-coral/20"
        >
          Chơi lại
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes fade-in {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-8px); }
  75% { transform: translateX(8px); }
}

.animate-fade-in {
  animation: fade-in 0.5s ease-out forwards;
}

.animate-shake {
  animation: shake 0.2s ease-in-out infinite;
}
</style>
