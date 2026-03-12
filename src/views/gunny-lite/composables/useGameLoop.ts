import { ref, onUnmounted } from 'vue'
import { useRafFn } from '@vueuse/core'

const FALL_GRAVITY = 600 // px/s²
const FALL_MAX_VY = 800

export function useGameLoop(onTick: (dt: number) => void) {
  const running = ref(false)
  let lastTime = 0

  const { pause, resume } = useRafFn(
    (args) => {
      if (!running.value) return
      const now = args.timestamp
      if (lastTime === 0) {
        lastTime = now
        return
      }
      const dt = Math.min((now - lastTime) / 1000, 0.05) // cap at 50ms
      lastTime = now
      onTick(dt)
    },
    { immediate: false },
  )

  function start() {
    lastTime = 0
    running.value = true
    resume()
  }

  function stop() {
    running.value = false
    pause()
  }

  onUnmounted(stop)

  return { running, start, stop }
}

/** Helpers for falling entity physics */
export function stepFall(vy: number, dt: number): number {
  return Math.min(vy + FALL_GRAVITY * dt, FALL_MAX_VY)
}
