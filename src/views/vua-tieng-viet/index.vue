<script setup lang="ts">
import { ref, onUnmounted } from 'vue'
import { RouterLink } from 'vue-router'
import wordsRaw from './words.txt?raw'

// Trạng thái game
const gameState = ref<'start' | 'playing' | 'gameover'>('start')
const score = ref(0)
const timeLeft = ref(30)
const currentWord = ref('')
const scrambledWord = ref<string[]>([])
const userInput = ref('')
const message = ref('')
const isError = ref(false)
const guessesLeft = ref(3)

let timer: number | null = null

// Load danh sách từ
const words = wordsRaw.split('\n').map(w => w.trim()).filter(w => w.length > 0)

// Randomize array in-place using Durstenfeld shuffle algorithm
function shuffleArray<T>(array: T[]) {
  const original = [...array];
  let isSame = true;
  let attempts = 0;

  // If all elements are the same, no need to shuffle
  if (new Set(array).size <= 1) return;

  while (isSame && attempts < 10) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = array[i];
      array[i] = array[j] as T;
      array[j] = temp as T;
    }

    isSame = false;
    for (let i = 0; i < array.length; i++) {
      if (array[i] !== original[i]) {
        break;
      }
      if (i === array.length - 1) {
        isSame = true;
      }
    }
    attempts++;
  }
}


// Bắt đầu game
function startGame() {
  score.value = 0
  timeLeft.value = 30
  guessesLeft.value = 3
  gameState.value = 'playing'
  message.value = ''
  nextWord()

  if (timer) clearInterval(timer)
  timer = window.setInterval(() => {
    timeLeft.value--
    if (timeLeft.value <= 0) {
      endGame()
    }
  }, 1000)
}

// Chuyển sang từ tiếp theo
function nextWord() {
  // Lấy ngẫu nhiên 1 từ
  const randomIndex = Math.floor(Math.random() * words.length)
  currentWord.value = words[randomIndex] || ''

  // Tách thành các chữ cái (bỏ qua khoảng trắng) và trộn
  scrambledWord.value = currentWord.value.split('').filter(char => char.trim() !== '')

  shuffleArray(scrambledWord.value)
  userInput.value = ''
}

// Kết thúc game
function endGame() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
  gameState.value = 'gameover'
}

// Xử lý khi người dùng nhấn Enter
function checkAnswer() {
  if (!userInput.value.trim()) return

  if (userInput.value.trim().toLowerCase() === currentWord.value.toLowerCase()) {
    // Đúng
    score.value += 10
    timeLeft.value += 5 // Thưởng thêm 5 giây
    message.value = 'Tuyệt vời! +10 điểm, +5 giây'
    isError.value = false
    setTimeout(() => {
      message.value = ''
      nextWord()
    }, 1000)
  } else {
    // Sai
    guessesLeft.value--
    if (guessesLeft.value <= 0) {
      endGame()
    } else {
      message.value = `Sai rồi, bạn còn ${guessesLeft.value} lượt đoán!`
      isError.value = true
    }
  }
}

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<template>
  <div class="min-h-screen bg-bg-deep text-text-primary p-4 md:p-8 font-mono flex flex-col items-center justify-center">


    <div class="max-w-xl w-full mx-auto relative border border-white/20 p-8 bg-black/40 backdrop-blur-md shadow-2xl before:content-[''] before:absolute before:inset-0 before:border before:border-accent-coral/30 before:-m-2 before:pointer-events-none">

      <!-- Tiêu đề -->
      <h1 class="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-accent-coral to-white uppercase tracking-tighter mb-8 text-center" style="-webkit-text-stroke: 1px rgba(255,107,107,0.5);">
        Vua Tiếng Việt
      </h1>

      <!-- Màn hình bắt đầu -->
      <div v-if="gameState === 'start'" class="text-center space-y-8 flex flex-col items-center">
        <p class="text-text-muted text-lg uppercase tracking-widest">Sắp xếp các chữ/từ bị xáo trộn để tạo thành từ đúng.</p>

        <div class="text-left bg-white/5 border border-white/10 p-4 text-sm text-text-secondary w-full max-w-sm">
          <h3 class="text-accent-coral font-bold mb-2 uppercase tracking-wider text-xs">Luật chơi:</h3>
          <ul class="list-disc list-inside space-y-1">
            <li>Bắt đầu với 30 giây và 3 lượt đoán</li>
            <li>Đoán đúng: +10 điểm, +5 giây</li>
            <li>Hết giờ hoặc hết lượt đoán: Thua cuộc</li>
          </ul>
        </div>

        <button @click="startGame" class="relative group px-8 py-4 bg-transparent text-accent-coral font-bold uppercase tracking-widest overflow-hidden border border-accent-coral transition-all hover:bg-accent-coral hover:text-white w-full max-w-xs cursor-pointer">
          <span class="relative z-10 flex items-center justify-center gap-2">
            <span class="i-ph-play-fill text-xl"></span>
            Bắt đầu chơi
          </span>
          <div class="absolute inset-0 h-full w-full translate-y-full transform bg-accent-coral transition-transform duration-300 ease-in-out group-hover:translate-y-0 -z-0"></div>
        </button>
      </div>

      <!-- Màn hình chơi -->
      <div v-else-if="gameState === 'playing'" class="space-y-6">

        <!-- HUD -->
        <div class="flex justify-between items-center border-b border-white/10 pb-4 mb-6">
          <div class="flex items-center gap-2 text-xl font-bold">
            <span class="i-ph-star-fill text-yellow-400"></span>
            <span class="text-white">Điểm: {{ score }}</span>
          </div>
          <div class="flex items-center gap-2 text-xl font-bold text-white">
            <span class="i-ph-heart-fill text-accent-coral"></span>
            <span>{{ guessesLeft }}</span>
          </div>
          <div class="flex items-center gap-2 text-xl font-bold" :class="{'text-accent-coral animate-pulse': timeLeft <= 10, 'text-white': timeLeft > 10}">
            <span class="i-ph-timer-bold"></span>
            <span>{{ timeLeft }}s</span>
          </div>
        </div>

        <!-- Từ bị xáo trộn -->
        <div class="text-center py-8 bg-white/5 border border-white/10 flex flex-wrap justify-center gap-3 min-h-[120px] items-center p-4">
          <span v-for="(letter, index) in scrambledWord" :key="index" class="text-2xl md:text-3xl font-bold text-white uppercase bg-black/50 px-4 py-2 border border-white/20 shadow-[4px_4px_0px_rgba(255,107,107,0.5)]">
            {{ letter }}
          </span>
        </div>

        <!-- Input -->
        <div class="relative mt-8">
          <input
            v-model="userInput"
            @keyup.enter="checkAnswer"
            type="text"
            placeholder="Nhập đáp án và nhấn Enter..."
            class="w-full bg-black/50 border border-white/30 text-white px-4 py-4 text-xl text-center focus:outline-none focus:border-accent-coral transition-colors uppercase placeholder:normal-case placeholder:text-text-muted/50"
            autofocus
          />
        </div>

        <!-- Message -->
        <div class="h-8 text-center text-sm font-bold uppercase tracking-widest flex items-center justify-center">
          <span v-if="message" :class="isError ? 'text-accent-coral' : 'text-green-400'" class="animate-bounce">
            {{ message }}
          </span>
        </div>
      </div>

      <!-- Màn hình kết thúc -->
      <div v-else-if="gameState === 'gameover'" class="text-center space-y-8 flex flex-col items-center">
        <div class="text-accent-coral text-6xl mb-4">
          <span class="i-ph-skull-fill"></span>
        </div>
        <h2 class="text-3xl font-bold text-white uppercase tracking-widest">Hết giờ!</h2>
        <div class="bg-white/10 px-8 py-6 border border-white/20 w-full max-w-xs">
          <p class="text-text-muted uppercase tracking-wider text-sm mb-2">Điểm của bạn</p>
          <p class="text-5xl font-black text-accent-coral">{{ score }}</p>
        </div>

        <p class="text-text-secondary text-sm">
          Từ đúng là: <span class="font-bold text-white uppercase bg-black px-2 py-1">{{ currentWord }}</span>
        </p>

        <button @click="startGame" class="px-8 py-4 bg-accent-coral text-white font-bold uppercase tracking-widest hover:bg-accent-coral/80 transition-colors w-full max-w-xs flex items-center justify-center gap-2 cursor-pointer shadow-[4px_4px_0px_rgba(255,255,255,0.2)]">
          <span class="i-ph-arrows-clockwise-bold text-xl"></span>
          Chơi lại
        </button>
      </div>

    </div>

    <!-- Back to Home -->
    <RouterLink
      to="/"
      class="mt-8 inline-flex items-center gap-2 border border-border-default bg-bg-surface px-5 py-2.5 text-sm text-text-secondary transition hover:border-accent-coral hover:text-text-primary animate-fade-up animate-delay-3"
    >
      &larr; Về trang chủ
    </RouterLink>

  </div>
</template>

<style scoped>
/* Retro-futuristic touches */
button:active {
  transform: translate(2px, 2px);
  box-shadow: 2px 2px 0px rgba(255,255,255,0.2);
}
</style>
