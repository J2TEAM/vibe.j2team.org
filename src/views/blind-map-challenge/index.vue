<script setup lang="ts">
import { ref, defineAsyncComponent } from 'vue'
import type { GameConfig } from './types'
import StartScreen from './components/StartScreen.vue'

const GameScreen = defineAsyncComponent(() => import('./components/GameScreen.vue'))
const ResultScreen = defineAsyncComponent(() => import('./components/ResultScreen.vue'))

type Screen = 'start' | 'game' | 'result'

const currentScreen = ref<Screen>('start')
const gameConfig = ref<GameConfig>({
  mode: 'classic',
  difficulty: 'easy',
})

// Force re-mount GameScreen by changing key
const gameKey = ref(0)

function handleStart(config: GameConfig) {
  gameConfig.value = config
  gameKey.value++
  currentScreen.value = 'game'
}

function handleGameOver() {
  currentScreen.value = 'result'
}

function handlePlayAgain() {
  gameKey.value++
  currentScreen.value = 'game'
}

function handleChangeMode() {
  currentScreen.value = 'start'
}

function handleBackToStart() {
  currentScreen.value = 'start'
}
</script>

<template>
  <Transition name="screen" mode="out-in">
    <StartScreen
      v-if="currentScreen === 'start'"
      key="start"
      @start="handleStart"
    />
    <GameScreen
      v-else-if="currentScreen === 'game'"
      :key="'game-' + gameKey"
      :config="gameConfig"
      @game-over="handleGameOver"
      @back-to-start="handleBackToStart"
    />
    <ResultScreen
      v-else-if="currentScreen === 'result'"
      key="result"
      :config="gameConfig"
      @play-again="handlePlayAgain"
      @change-mode="handleChangeMode"
    />
  </Transition>
</template>

<style scoped>
.screen-enter-active,
.screen-leave-active {
  transition: all 0.3s ease;
}
.screen-enter-from {
  opacity: 0;
  transform: translateX(20px);
}
.screen-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}
</style>
