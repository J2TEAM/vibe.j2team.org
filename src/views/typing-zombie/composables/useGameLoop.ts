import { onUnmounted, ref, watch } from 'vue'
import { useGameStore } from '../stores/gameStore'

/**
 * Core game loop: handles frame updates, zombie spawning, and difficulty scaling.
 * Uses requestAnimationFrame for smooth 60fps updates.
 */
export function useGameLoop() {
  const store = useGameStore()
  const animFrameId = ref(0)
  const running = ref(false)
  const lastTs = ref<number | null>(null)

  function frame(ts: number) {
    if (!store.isPlaying) return
    const prev = lastTs.value ?? ts
    const rawDt = ts - prev
    lastTs.value = ts

    // Clamp dt to keep gameplay stable after tab-switch/sleep
    const dt = Math.max(0, Math.min(50, rawDt))
    store.tick(dt)
    animFrameId.value = requestAnimationFrame(frame)
  }

  function start() {
    stop()
    lastTs.value = null
    store.unlockAudio()
    store.startGame()
    running.value = true
    animFrameId.value = requestAnimationFrame(frame)
  }

  function resume() {
    if (running.value) return
    if (store.status !== 'playing') return
    running.value = true
    lastTs.value = null
    animFrameId.value = requestAnimationFrame(frame)
  }

  function stop() {
    cancelAnimationFrame(animFrameId.value)
    running.value = false
    lastTs.value = null
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
