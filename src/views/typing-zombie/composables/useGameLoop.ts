import { ref, onUnmounted, watch } from 'vue'
import { useGameStore } from '../stores/gameStore'

/**
 * Core game loop: handles frame updates, zombie spawning, and difficulty scaling.
 * Uses requestAnimationFrame for smooth 60fps updates.
 */
export function useGameLoop() {
  const store = useGameStore()
  const animFrameId = ref(0)
  const spawnTimerId = ref(0)
  const difficultyTimerId = ref(0)
  const running = ref(false)

  function gameLoop() {
    if (!store.isPlaying) return
    store.updateZombiePositions()
    animFrameId.value = requestAnimationFrame(gameLoop)
  }

  function startSpawning() {
    const interval = Math.max(1200, 3000 - store.difficulty * 200)
    clearInterval(spawnTimerId.value)
    spawnTimerId.value = window.setInterval(() => {
      if (!store.isPlaying) return
      store.spawnZombie()
    }, interval)
  }

  function startDifficultyTimer() {
    clearInterval(difficultyTimerId.value)
    difficultyTimerId.value = window.setInterval(() => {
      if (!store.isPlaying) return
      store.increaseDifficulty()
      startSpawning()
    }, 15000)
  }

  function start() {
    stop()
    store.startGame()
    store.spawnZombie()
    running.value = true
    animFrameId.value = requestAnimationFrame(gameLoop)
    startSpawning()
    startDifficultyTimer()
  }

  function resume() {
    if (running.value) return
    if (store.status !== 'playing') return
    running.value = true
    animFrameId.value = requestAnimationFrame(gameLoop)
    startSpawning()
    startDifficultyTimer()
  }

  function stop() {
    cancelAnimationFrame(animFrameId.value)
    clearInterval(spawnTimerId.value)
    clearInterval(difficultyTimerId.value)
    running.value = false
  }

  // Auto-stop when not playing (pause/menu/gameover)
  watch(
    () => store.status,
    (val) => {
      if (val !== 'playing') stop()
    },
  )

  onUnmounted(() => stop())

  return { start, resume, stop }
}
