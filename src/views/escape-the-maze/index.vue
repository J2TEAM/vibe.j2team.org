<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { RouterLink } from 'vue-router'
import type { Cell, Difficulty, GameState, Position, GameStats, BestRecord } from './types'
import { difficultyConfig, STORAGE_KEY, trollThreshold } from './config'
import { useMazeGenerator } from './composables/useMazeGenerator'
import { useMazeSolver } from './composables/useMazeSolver'
import { usePlayer } from './composables/usePlayer'
import { useTimer } from './composables/useTimer'
import { useLanguage } from './composables/useLanguage'
import LanguageToggle from './components/LanguageToggle.vue'
import DifficultySelect from './components/DifficultySelect.vue'
import MazeCanvas from './components/MazeCanvas.vue'
import GameHUD from './components/GameHUD.vue'
import MobileControls from './components/MobileControls.vue'
import ResultModal from './components/ResultModal.vue'
import TrollMessage from './components/TrollMessage.vue'

const { t } = useLanguage()
const { generateMaze } = useMazeGenerator()
const { findFarthestCell } = useMazeSolver()
const { position, steps, reset: resetPlayer, move } = usePlayer()
const {
  elapsedTime,
  formattedTime,
  start: startTimer,
  stop: stopTimer,
  reset: resetTimer,
} = useTimer()

const gameState = ref<GameState>('idle')
const selectedDifficulty = ref<Difficulty>('noob')
const maze = ref<Cell[][]>([])
const exitPosition = ref<Position>({ x: 0, y: 0 })
const gameStats = ref<GameStats | null>(null)
const isNewRecord = ref(false)
const showTrollMessage = ref(false)

const bestRecord = computed<BestRecord | null>(() => {
  const key = `${STORAGE_KEY.BEST_NOOB}`.replace('noob', selectedDifficulty.value)
  const stored = localStorage.getItem(key)
  return stored ? JSON.parse(stored) : null
})

function startGame(difficulty: Difficulty) {
  selectedDifficulty.value = difficulty
  const size = difficultyConfig[difficulty]

  maze.value = generateMaze(size)
  const start: Position = { x: 0, y: 0 }
  const { cell: exit } = findFarthestCell(maze.value, start)

  exitPosition.value = exit
  resetPlayer()
  resetTimer()
  showTrollMessage.value = false
  gameState.value = 'playing'
  startTimer()

  // Show troll message after threshold
  const threshold = trollThreshold[difficulty]
  setTimeout(() => {
    if (gameState.value === 'playing') {
      showTrollMessage.value = true
    }
  }, threshold)
}

function handleMove(direction: 'up' | 'down' | 'left' | 'right') {
  if (gameState.value !== 'playing') return

  const moved = move(maze.value, direction)
  if (!moved) return

  if (position.value.x === exitPosition.value.x && position.value.y === exitPosition.value.y) {
    finishGame()
  }
}

function finishGame() {
  stopTimer()
  showTrollMessage.value = false
  gameState.value = 'finished'

  const efficiency = ((exitPosition.value.x + exitPosition.value.y + 2) / steps.value) * 100

  gameStats.value = {
    time: elapsedTime.value,
    steps: steps.value,
    efficiency,
    optimalSteps: exitPosition.value.x + exitPosition.value.y + 2,
  }

  const storageKey = `${STORAGE_KEY.BEST_NOOB}`.replace('noob', selectedDifficulty.value)
  const currentBest = bestRecord.value

  if (!currentBest || elapsedTime.value < currentBest.time) {
    isNewRecord.value = true
    const newRecord: BestRecord = {
      time: elapsedTime.value,
      steps: steps.value,
      efficiency,
      date: new Date().toISOString(),
    }
    localStorage.setItem(storageKey, JSON.stringify(newRecord))
  } else {
    isNewRecord.value = false
  }
}

function playAgain() {
  startGame(selectedDifficulty.value)
}

function changeDifficulty() {
  gameState.value = 'idle'
  gameStats.value = null
}

function handleKeyDown(e: KeyboardEvent) {
  if (gameState.value !== 'playing') return

  const keyMap: Record<string, 'up' | 'down' | 'left' | 'right'> = {
    ArrowUp: 'up',
    ArrowDown: 'down',
    ArrowLeft: 'left',
    ArrowRight: 'right',
    w: 'up',
    s: 'down',
    a: 'left',
    d: 'right',
  }

  const direction = keyMap[e.key.toLowerCase()]
  if (direction) {
    e.preventDefault()
    handleMove(direction)
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
})
</script>

<template>
  <div class="min-h-screen bg-bg-deep text-text-primary p-4">
    <div class="max-w-5xl mx-auto">
      <!-- Header -->
      <div class="flex justify-between items-center mb-8 animate-fade-up">
        <RouterLink
          to="/"
          class="text-text-secondary hover:text-accent-coral transition-colors duration-200 font-display"
        >
          {{ t.backToHome }}
        </RouterLink>
        <LanguageToggle />
      </div>

      <!-- Title -->
      <div class="text-center mb-12 animate-fade-up animate-delay-2">
        <h1 class="font-display text-5xl md:text-6xl font-bold text-text-primary mb-4">
          <span class="text-accent-coral">//</span> {{ t.title }}
        </h1>
        <p class="text-text-secondary text-lg">{{ t.subtitle }}</p>
      </div>

      <!-- Difficulty Selection -->
      <div v-if="gameState === 'idle'" class="animate-fade-up animate-delay-3">
        <DifficultySelect :best-records="bestRecord" @start="startGame" />
      </div>

      <!-- Game Area -->
      <div v-else-if="gameState === 'playing'" class="space-y-6">
        <GameHUD
          :time="formattedTime"
          :steps="steps"
          :best-time="bestRecord?.time"
          class="animate-fade-up"
        />

        <div class="flex flex-col lg:flex-row gap-6 items-start">
          <div class="flex-1 w-full animate-fade-up animate-delay-2">
            <MazeCanvas :maze="maze" :player-position="position" :exit-position="exitPosition" />
          </div>

          <div class="lg:w-64 w-full animate-fade-up animate-delay-3">
            <div class="bg-bg-surface border border-border-default p-6 space-y-6">
              <div>
                <h3 class="font-display text-sm text-accent-amber mb-3">
                  {{ t.keyboardControls }}
                </h3>
                <div class="text-text-secondary text-sm space-y-1">
                  <div class="grid grid-cols-4 gap-2 text-center font-mono">
                    <div class="bg-bg-elevated border border-border-default px-2 py-1">W ↑</div>
                    <div class="bg-bg-elevated border border-border-default px-2 py-1">A ←</div>
                    <div class="bg-bg-elevated border border-border-default px-2 py-1">S ↓</div>
                    <div class="bg-bg-elevated border border-border-default px-2 py-1">D →</div>
                  </div>
                </div>
              </div>

              <div class="block md:hidden">
                <h3 class="font-display text-sm text-accent-amber mb-3">
                  {{ t.mobileControls }}
                </h3>
                <MobileControls @move="handleMove" />
              </div>

              <TrollMessage :visible="showTrollMessage" />
            </div>
          </div>
        </div>
      </div>

      <!-- Result Modal -->
      <ResultModal
        v-if="gameState === 'finished' && gameStats"
        :stats="gameStats"
        :difficulty="selectedDifficulty"
        :is-new-record="isNewRecord"
        @play-again="playAgain"
        @change-difficulty="changeDifficulty"
      />
    </div>
  </div>
</template>
