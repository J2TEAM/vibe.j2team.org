import { useIntervalFn } from '@vueuse/core'
import type { Ref } from 'vue'
import { ref } from 'vue'
import type { GameStatus, Side } from '../engine/vchess-engine'

/**
 * Đồng hồ dùng interval + performance.now() thay vì requestAnimationFrame:
 * RAF có thể bị throttle / không đều khi worker tốn CPU hoặc trình duyệt ưu tiên repaint,
 * khiến lượt máy (Đen) trông như “đứng” trong lúc tìm nước.
 */
const TICK_MS = 100
const MAX_DELTA_MS = 2500

export function useVchessClock(options: {
  enabled: Ref<boolean>
  gameStatus: Ref<GameStatus>
  turn: Ref<Side>
  initialMinutes: Ref<number>
  incrementSeconds: Ref<number>
}) {
  const redMs = ref(0)
  const blackMs = ref(0)
  const timeoutLoser = ref<Side | null>(null)
  /** Mốc wall-clock cho lần trừ tiếp theo — không phụ thuộc số khung hình. */
  const lastTickAt = ref<number | null>(null)

  function reset() {
    const initial = Math.max(0, options.initialMinutes.value) * 60 * 1000
    redMs.value = initial
    blackMs.value = initial
    timeoutLoser.value = null
    lastTickAt.value = performance.now()
  }

  /** Gọi sau mỗi nước đi hợp lệ (turn đã đổi sang bên kia). */
  function applyIncrementAfterMove() {
    const mover: Side = options.turn.value === 'red' ? 'black' : 'red'
    const inc = Math.max(0, options.incrementSeconds.value) * 1000
    if (mover === 'red') redMs.value += inc
    else blackMs.value += inc
  }

  /** Hoàn nước: trừ increment đã cộng cho phe vừa bị bỏ nước. */
  function revertIncrementForMover(mover: Side) {
    const inc = Math.max(0, options.incrementSeconds.value) * 1000
    if (mover === 'red') redMs.value = Math.max(0, redMs.value - inc)
    else blackMs.value = Math.max(0, blackMs.value - inc)
  }

  useIntervalFn(
    () => {
      if (!options.enabled.value) {
        lastTickAt.value = null
        return
      }
      if (options.gameStatus.value !== 'playing') return
      if (timeoutLoser.value) return

      const now = performance.now()
      if (lastTickAt.value === null) {
        lastTickAt.value = now
        return
      }

      const d = Math.min(MAX_DELTA_MS, Math.max(0, now - lastTickAt.value))
      lastTickAt.value = now

      if (options.turn.value === 'red') {
        redMs.value -= d
        if (redMs.value <= 0) {
          redMs.value = 0
          timeoutLoser.value = 'red'
        }
      } else {
        blackMs.value -= d
        if (blackMs.value <= 0) {
          blackMs.value = 0
          timeoutLoser.value = 'black'
        }
      }
    },
    TICK_MS,
    { immediate: true },
  )

  return {
    redMs,
    blackMs,
    timeoutLoser,
    reset,
    applyIncrementAfterMove,
    revertIncrementForMover,
  }
}
