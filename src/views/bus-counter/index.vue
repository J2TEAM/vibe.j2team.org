<script setup lang="ts">
import { computed, onUnmounted } from 'vue'
import { RouterLink } from 'vue-router'
import { Icon } from '@iconify/vue'
import TitleScreen from './components/TitleScreen.vue'
import GameScreen from './components/GameScreen.vue'
import ResultScreen from './components/ResultScreen.vue'
import { useGameEngine } from './composables/useGameEngine'
import type { HighScoreEntry } from './types'

const engine = useGameEngine()

const screen = computed(() => {
  const p = engine.phase.value
  if (p === 'IDLE') return 'title'
  if (p === 'GAMEOVER' || p === 'COMPLETE') return 'result'
  return 'game'
})

function handleStart() {
  engine.startGame()
}

function handleRestart() {
  engine.startGame()
}

function handleQuit() {
  engine.quitGame()
}

function handleSaveScore(entry: HighScoreEntry) {
  engine.scoreEngine.addHighScore(entry)
}

onUnmounted(() => {
  engine.cleanup()
})
</script>

<template>
  <div class="bg-bg-deep text-text-primary font-body min-h-screen">
    <!-- Back to home — only on title/result screens to avoid HUD overlap -->
    <RouterLink
      v-if="screen !== 'game'"
      to="/"
      class="border-border-default hover:border-accent-coral hover:text-text-primary text-text-dim fixed top-3 left-3 z-50 flex items-center gap-1 border bg-transparent px-2 py-1 text-xs transition"
    >
      <Icon icon="lucide:arrow-left" class="size-3" />
      Trang chủ
    </RouterLink>

    <!-- Title Screen -->
    <TitleScreen
      v-if="screen === 'title'"
      :high-scores="engine.scoreEngine.highScores.value"
      @start="handleStart"
    />

    <!-- Game Screen -->
    <GameScreen v-else-if="screen === 'game'" :engine="engine" @quit="handleQuit" />

    <!-- Result Screen -->
    <ResultScreen
      v-else-if="screen === 'result'"
      :is-complete="engine.phase.value === 'COMPLETE'"
      :score="engine.scoreEngine.score.value"
      :stops-completed="engine.currentStopIndex.value + 1"
      :total-stops="engine.totalStops.value"
      :total-time="engine.totalTime.value"
      :high-scores="engine.scoreEngine.highScores.value"
      @restart="handleRestart"
      @save-score="handleSaveScore"
    />
  </div>
</template>
