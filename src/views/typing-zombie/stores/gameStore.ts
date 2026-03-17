import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Zombie, GameStatus, PixelEffect } from '../types'
import { getRandomWord } from '../wordList'

let nextId = 0
let nextEffectId = 0

export const useGameStore = defineStore('typing-zombie', () => {
  const score = ref(0)
  const health = ref(3)
  const maxHealth = ref(3)
  const zombies = ref<Zombie[]>([])
  const effects = ref<PixelEffect[]>([])
  const typedText = ref('')
  const status = ref<GameStatus>('idle')
  const difficulty = ref(1)
  const highScore = ref(0)

  const isPlaying = computed(() => status.value === 'playing')
  const isPaused = computed(() => status.value === 'paused')
  const isGameOver = computed(() => status.value === 'gameover')

  function spawnZombie() {
    const word = getRandomWord(difficulty.value)
    const zombie: Zombie = {
      id: `z-${nextId++}`,
      word,
      x: 100,
      y: 15 + Math.random() * 65,
      speed: 0.08 + difficulty.value * 0.012 + Math.random() * 0.03,
      active: false,
    }
    zombies.value.push(zombie)
  }

  function removeZombie(id: string) {
    zombies.value = zombies.value.filter((z) => z.id !== id)
  }

  function spawnExplosion(x: number, y: number) {
    const id = `e-${nextEffectId++}`
    effects.value.push({ id, x, y, kind: 'explode' })
    window.setTimeout(() => {
      effects.value = effects.value.filter((e) => e.id !== id)
    }, 240)
  }

  function handleInput(text: string) {
    typedText.value = text

    const activeZombie = zombies.value.find((z) => z.active)
    if (activeZombie) {
      if (activeZombie.word === text) {
        killZombie(activeZombie.id)
      }
      return
    }

    // Find the first zombie whose word starts with the typed text
    const match = zombies.value.sort((a, b) => a.x - b.x).find((z) => z.word.startsWith(text))

    if (match) {
      match.active = true
      if (match.word === text) {
        killZombie(match.id)
      }
    }
  }

  function killZombie(id: string) {
    const z = zombies.value.find((zombie) => zombie.id === id)
    if (z) spawnExplosion(z.x, z.y)
    removeZombie(id)
    score.value += 10 * difficulty.value
    typedText.value = ''
  }

  function zombieReachedPlayer(id: string) {
    removeZombie(id)
    health.value -= 1
    if (health.value <= 0) {
      gameOver()
    }
  }

  function gameOver() {
    status.value = 'gameover'
    if (score.value > highScore.value) {
      highScore.value = score.value
    }
  }

  function resetGameState() {
    score.value = 0
    health.value = maxHealth.value
    zombies.value = []
    effects.value = []
    typedText.value = ''
    difficulty.value = 1
    nextId = 0
    nextEffectId = 0
  }

  function startGame() {
    resetGameState()
    status.value = 'playing'
  }

  function pauseGame() {
    if (status.value !== 'playing') return
    status.value = 'paused'
  }

  function resumeGame() {
    if (status.value !== 'paused') return
    status.value = 'playing'
  }

  function returnToMenu() {
    resetGameState()
    status.value = 'idle'
  }

  function increaseDifficulty() {
    difficulty.value += 1
  }

  function updateZombiePositions() {
    for (const zombie of zombies.value) {
      zombie.x -= zombie.speed
    }
    // Check which zombies reached the player (left side threshold ~8%)
    const reached = zombies.value.filter((z) => z.x <= 8)
    for (const z of reached) {
      zombieReachedPlayer(z.id)
    }
  }

  return {
    score,
    health,
    maxHealth,
    zombies,
    effects,
    typedText,
    status,
    difficulty,
    highScore,
    isPlaying,
    isPaused,
    isGameOver,
    spawnZombie,
    handleInput,
    startGame,
    pauseGame,
    resumeGame,
    returnToMenu,
    increaseDifficulty,
    updateZombiePositions,
    gameOver,
  }
})
