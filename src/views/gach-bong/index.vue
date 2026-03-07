<script setup lang="ts">
import { ref, computed } from 'vue'
import { useWasmEngine } from './composables/useWasmEngine'
import { useGameState } from './composables/useGameState'

import GameMenu from './components/GameMenu.vue'
import ScoreBoard from './components/ScoreBoard.vue'
import GameBoard from './components/GameBoard.vue'
import GameOverModal from './components/GameOverModal.vue'
import MusicVideo from './components/MusicVideo.vue'
import MusicVideoHoaChanh from './components/MusicVideoHoaChanh.vue'

const { engine, loading, error } = useWasmEngine()
const { state, startGame, selectTile, requestHint, requestShuffle, tick, backToMenu, clearMatchAnimation } =
  useGameState(engine)

const mode = ref<'launcher' | 'game' | 'mv-intro' | 'mv-hoa-chanh'>('launcher')
const TILE_SIZE = 48

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

// Watch status để quản lý timer
import { watch } from 'vue'
watch(
  () => state.value.status,
  (newStatus, oldStatus) => {
    if (newStatus === 'playing' && oldStatus !== 'playing') {
      startTimer()
    } else if (newStatus !== 'playing' && oldStatus === 'playing') {
      stopTimer()
    }
  },
)

function handleStartGame(difficulty: Parameters<typeof startGame>[0]) {
  startGame(difficulty)
  mode.value = 'game'
}

function handleMvIntro() {
  mode.value = 'mv-intro'
}

function handleMvHoaChanh() {
  mode.value = 'mv-hoa-chanh'
}

function handleBackToLauncher() {
  backToMenu()
  mode.value = 'launcher'
}

const showGameOver = computed(() => state.value.status === 'won' || state.value.status === 'lost')
</script>

<template>
  <div class="min-h-screen bg-bg-deep text-text-primary selection:bg-accent-coral/30">
    <!-- Header/Nav -->
    <header class="border-b border-border-default bg-bg-surface/80 px-6 py-4 backdrop-blur-md sticky top-0 z-40">
      <div class="mx-auto flex max-w-7xl items-center justify-between">
        <RouterLink
          to="/"
          class="group flex items-center gap-2 font-display text-sm font-bold tracking-widest text-text-primary transition hover:text-accent-coral"
        >
          <span class="opacity-50 transition group-hover:-translate-x-1 group-hover:opacity-100">←</span>
          VỀ TRANG CHỦ
        </RouterLink>

        <!-- Trạng thái load engine -->
        <div v-if="loading" class="flex flex-col items-center">
          <div class="loading-spinner mb-2 h-6 w-6 rounded-full border-2 border-accent-coral/30 border-t-accent-coral animate-spin" />
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
        <MusicVideoHoaChanh
          :engine="engine!"
          @back="handleBackToLauncher"
        />
      </template>

      <!-- Content -->
      <template v-else>
        <div class="mt-8">
          <!-- Launcher Menu -->
          <GameMenu
            v-if="state.status === 'menu'"
            @start-game="handleStartGame"
            @mv-intro="handleMvIntro"
            @mv-hoa-chanh="handleMvHoaChanh"
          />

          <!-- Game Interface -->
          <div v-else class="mx-auto max-w-3xl animate-fade-in">
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
                  <span class="font-display text-[10px] sm:text-xs font-bold tracking-wider text-text-secondary group-hover:text-text-primary uppercase">Thoát</span>
                </button>

                <button
                  class="group flex flex-col items-center justify-center gap-1.5 border border-border-default bg-bg-elevated py-2 transition hover:border-accent-amber"
                  @click="requestHint"
                >
                  <span class="text-accent-amber text-xl leading-none transition group-hover:scale-110">💡</span>
                  <span class="font-display text-[10px] sm:text-xs font-bold tracking-wider">GỢI Ý (-20đ)</span>
                </button>

                <button
                  class="group flex flex-col items-center justify-center gap-1.5 border border-border-default bg-bg-elevated py-2 transition hover:border-blue-400"
                  @click="requestShuffle"
                >
                  <span class="text-blue-400 text-xl leading-none transition group-hover:rotate-180">🔀</span>
                  <span class="font-display text-[10px] sm:text-xs font-bold tracking-wider">XÁO BÀI (-50đ)</span>
                </button>
              </div>
            </div>

            <!-- Game Board -->
            <div class="flex justify-center border border-border-default bg-bg-surface p-6 shadow-2xl">
              <GameBoard
                :key="`board-${state.boardVersion}`"
                :engine="engine!"
                :tile-size="TILE_SIZE"
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
    </main>
  </div>
</template>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.4s ease-out;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
