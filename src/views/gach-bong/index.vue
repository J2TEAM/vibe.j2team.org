<script setup lang="ts">
import { ref, computed, watch, defineAsyncComponent, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useWasmEngine } from './composables/useWasmEngine'
import { useGameState } from './composables/useGameState'
import { DIFFICULTY_CONFIGS } from './composables/types'
import type { Difficulty } from './composables/types'
import { saveHighScore } from './composables/useHighScores'

import GameMenu from './components/GameMenu.vue'
import ScoreBoard from './components/ScoreBoard.vue'
import GameBoard from './components/GameBoard.vue'
import GameOverModal from './components/GameOverModal.vue'
import ScoreHistoryModal from './components/ScoreHistoryModal.vue'

const MusicVideo = defineAsyncComponent(() => import('./components/MusicVideo.vue'))
const MusicVideoHoaChanh = defineAsyncComponent(() => import('./components/MusicVideoHoaChanh.vue'))

const route = useRoute()
const router = useRouter()
const { engine, loading, error } = useWasmEngine()
const {
  state,
  startGame,
  selectTile,
  requestHint,
  requestShuffle,
  tick,
  backToMenu,
  clearMatchAnimation,
} = useGameState(engine)

const mode = ref<'launcher' | 'game' | 'mv-intro' | 'mv-hoa-chanh'>('launcher')
const showHistory = ref(false)

// Dynamic tile size based on screen and difficulty
const windowWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 800)
const windowHeight = ref(typeof window !== 'undefined' ? window.innerHeight : 600)

const tileSize = computed(() => {
  // Use smaller tile in menu for the logo area
  if (state.value.status === 'menu') return 60

  const config = DIFFICULTY_CONFIGS[state.value.difficulty]
  const maxBoardWidth = Math.min(windowWidth.value - 32, 800)
  const maxBoardHeight = windowHeight.value * 0.55
  const sizeByWidth = Math.floor(maxBoardWidth / config.cols)
  const sizeByHeight = Math.floor(maxBoardHeight / config.rows)
  return Math.min(sizeByWidth, sizeByHeight, 80)
})

function handleResize() {
  windowWidth.value = window.innerWidth
  windowHeight.value = window.innerHeight
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
  checkUrlForLevel()
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})

// Timer logic
const timerId = ref<ReturnType<typeof setInterval> | null>(null)

function startTimer() {
  if (timerId.value) clearInterval(timerId.value)
  timerId.value = setInterval(() => {
    tick()
  }, 1000)
}

function stopTimer() {
  if (timerId.value) {
    clearInterval(timerId.value)
    timerId.value = null
  }
}

// Watch status to manage timer
watch(
  () => state.value.status,
  (newStatus, oldStatus) => {
    if (newStatus === 'playing' && oldStatus !== 'playing') {
      startTimer()
    } else if (newStatus !== 'playing' && oldStatus === 'playing') {
      stopTimer()
    }

    // Save high score when game is won
    if (newStatus === 'won') {
      saveHighScore(state.value.score, state.value.difficulty)
    }
  },
)

// Watch URL query param for browser back/forward navigation
watch(
  () => route.query.level,
  (newLevel) => {
    if (!newLevel || newLevel === '') {
      // No level in URL - go back to menu
      if (state.value.status !== 'menu') {
        backToMenu()
        mode.value = 'launcher'
      }
    } else if (['easy', 'medium', 'hard'].includes(newLevel as string)) {
      // Level in URL - start game if not already playing
      if (state.value.status === 'menu' && engine.value && !loading.value) {
        startGame(newLevel as Difficulty)
        mode.value = 'game'
      }
    }
  },
)

function handleStartGame(difficulty: Difficulty) {
  startGame(difficulty)
  mode.value = 'game'
  // Update URL with level query param
  router.push({ query: { level: difficulty } })
}

// Check for level in URL query on mount
function checkUrlForLevel() {
  const level = route.query.level as string
  if (level && ['easy', 'medium', 'hard'].includes(level)) {
    // Wait for engine to load, then start game
    const checkAndStart = setInterval(() => {
      if (!loading.value && engine.value) {
        clearInterval(checkAndStart)
        handleStartGame(level as Difficulty)
      }
    }, 100)
  }
}

function handleMvIntro() {
  mode.value = 'mv-intro'
}

function handleMvHoaChanh() {
  mode.value = 'mv-hoa-chanh'
}

function handleShowHistory() {
  showHistory.value = true
}

function handleBackToLauncher() {
  backToMenu()
  mode.value = 'launcher'
  // Clear query param - browser back will now work correctly
  router.push({ query: {} })
}

function handleBackButton() {
  if (route.query.level) {
    // Đang chơi game → về menu game
    handleBackToLauncher()
  } else {
    // Đang ở menu → về trang chủ
    router.push('/')
  }
}

const showGameOver = computed(() => state.value.status === 'won' || state.value.status === 'lost')
</script>

<template>
  <div class="min-h-screen bg-bg-deep text-text-primary selection:bg-accent-coral/30">
    <!-- Header/Nav -->
    <header
      class="border-b border-border-default bg-bg-surface/80 px-6 py-4 backdrop-blur-md sticky top-0 z-40"
    >
      <div class="mx-auto flex max-w-7xl items-center justify-between">
        <button
          class="group flex items-center gap-2 font-display text-sm font-bold tracking-widest text-text-primary transition hover:text-accent-coral"
          @click="handleBackButton"
        >
          <span class="opacity-50 transition group-hover:-translate-x-1 group-hover:opacity-100"
            >←</span
          >
          VỀ MENU
        </button>

        <!-- Trạng thái load engine -->
        <div v-if="loading" class="flex flex-col items-center">
          <div
            class="loading-spinner mb-2 h-6 w-6 rounded-full border-2 border-accent-coral/30 border-t-accent-coral animate-spin"
          />
          <span class="text-sm text-text-secondary">Đang tải WebAssembly Core...</span>
        </div>
        <div v-else-if="error" class="text-accent-coral font-medium flex items-center gap-2">
          <span>⚠️</span> {{ error }}
        </div>
        <div v-else class="h-6"></div>
      </div>
    </header>

    <main class="mx-auto max-w-7xl px-4 py-8">
      <!-- Fullscreen MVs -->
      <template v-if="mode === 'mv-intro'">
        <MusicVideo
          :engine="engine!"
          @back="handleBackToLauncher"
          @play-next="mode = 'mv-hoa-chanh'"
        />
      </template>
      <template v-else-if="mode === 'mv-hoa-chanh'">
        <MusicVideoHoaChanh :engine="engine!" @back="handleBackToLauncher" />
      </template>

      <!-- Content -->
      <template v-else>
        <div class="mt-8">
          <!-- Launcher Menu -->
          <GameMenu
            v-if="state.status === 'menu' && engine"
            :engine="engine"
            @start-game="handleStartGame"
            @mv-intro="handleMvIntro"
            @mv-hoa-chanh="handleMvHoaChanh"
            @show-history="handleShowHistory"
          />

          <!-- Game Interface -->
          <div v-else class="mx-auto animate-fade-in w-full max-w-[min(100%,800px)]">
            <!-- Score & Controls -->
            <div class="mb-6 flex flex-col gap-4">
              <ScoreBoard
                :score="state.score"
                :time-left="state.timeLeft"
                :remaining-tiles="state.remainingTiles"
                :combo="state.combo"
              />

              <!-- Toolbar -->
              <div class="grid grid-cols-3 gap-2 bg-bg-surface border border-border-default p-2">
                <button
                  class="group flex flex-col items-center justify-center gap-1.5 border border-border-default bg-bg-elevated py-2 transition hover:border-text-primary"
                  @click="handleBackToLauncher"
                >
                  <span class="text-xl leading-none transition group-hover:scale-110">🏠</span>
                  <span
                    class="font-display text-[10px] sm:text-xs font-bold tracking-wider text-text-secondary group-hover:text-text-primary uppercase"
                    >Thoát</span
                  >
                </button>

                <button
                  class="group flex flex-col items-center justify-center gap-1.5 border border-border-default bg-bg-elevated py-2 transition hover:border-accent-amber"
                  @click="requestHint"
                >
                  <span
                    class="text-accent-amber text-xl leading-none transition group-hover:scale-110"
                    >💡</span
                  >
                  <span class="font-display text-[10px] sm:text-xs font-bold tracking-wider"
                    >GỢI Ý (-20đ)</span
                  >
                </button>

                <button
                  class="group flex flex-col items-center justify-center gap-1.5 border border-border-default bg-bg-elevated py-2 transition hover:border-blue-400"
                  @click="requestShuffle"
                >
                  <span class="text-blue-400 text-xl leading-none transition group-hover:rotate-180"
                    >🔀</span
                  >
                  <span class="font-display text-[10px] sm:text-xs font-bold tracking-wider"
                    >XÁO BÀI (-50đ)</span
                  >
                </button>
              </div>
            </div>

            <!-- Game Board -->
            <div
              v-if="engine"
              class="flex justify-center items-center overflow-auto border border-border-default bg-bg-surface p-0 sm:p-6 shadow-2xl"
            >
              <GameBoard
                :key="`board-${state.boardVersion}`"
                :engine="engine"
                :tile-size="tileSize"
                :status="state.status"
                :remaining-tiles="state.remainingTiles"
                :board-version="state.boardVersion"
                :selected-tile="state.selected"
                :hint-tiles="state.hintTiles"
                :match-path="state.matchPath"
                @tile-click="selectTile"
                @animation-done="clearMatchAnimation"
              />
            </div>
          </div>
        </div>
      </template>

      <GameOverModal
        v-if="showGameOver"
        :key="`game-over-${state.boardVersion}`"
        :won="state.status === 'won'"
        :score="state.score"
        :time-left="state.timeLeft"
        :hints-used="state.hintsUsed"
        :shuffles-used="state.shufflesUsed"
        @play-again="handleStartGame(state.difficulty)"
        @back-to-menu="handleBackToLauncher"
      />

      <ScoreHistoryModal :visible="showHistory" @close="showHistory = false" />
    </main>
  </div>
</template>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.4s ease-out;
}
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
