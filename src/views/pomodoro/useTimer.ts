import { ref, computed, onUnmounted } from 'vue'

type TimerMode = 'focus' | 'short-break' | 'long-break'

interface TimerConfig {
  focus: number
  shortBreak: number
  longBreak: number
}

const DEFAULT_CONFIG: TimerConfig = {
  focus: 25,
  shortBreak: 5,
  longBreak: 15,
}

const LONG_BREAK_INTERVAL = 4

export function useTimer(onComplete?: (mode: TimerMode) => void) {
  const config = ref<TimerConfig>({ ...DEFAULT_CONFIG })
  const mode = ref<TimerMode>('focus')
  const completedRounds = ref(0)
  const isRunning = ref(false)
  const isPaused = ref(false)

  const totalSeconds = computed(() => {
    const minutes =
      mode.value === 'focus'
        ? config.value.focus
        : mode.value === 'short-break'
          ? config.value.shortBreak
          : config.value.longBreak
    return minutes * 60
  })

  const remainingSeconds = ref(totalSeconds.value)

  let intervalId: ReturnType<typeof setInterval> | null = null

  function clearTimer() {
    if (intervalId !== null) {
      clearInterval(intervalId)
      intervalId = null
    }
  }

  function tick() {
    if (remainingSeconds.value <= 0) {
      clearTimer()
      isRunning.value = false
      isPaused.value = false
      onComplete?.(mode.value)

      if (mode.value === 'focus') {
        completedRounds.value++
      }

      return
    }
    remainingSeconds.value--
  }

  function start() {
    if (isRunning.value) return
    remainingSeconds.value = totalSeconds.value
    isRunning.value = true
    isPaused.value = false
    clearTimer()
    intervalId = setInterval(tick, 1000)
  }

  function pause() {
    if (!isRunning.value || isPaused.value) return
    clearTimer()
    isPaused.value = true
  }

  function resume() {
    if (!isPaused.value) return
    isPaused.value = false
    intervalId = setInterval(tick, 1000)
  }

  function switchMode(newMode: TimerMode) {
    clearTimer()
    mode.value = newMode
    isRunning.value = false
    isPaused.value = false
    remainingSeconds.value = totalSeconds.value
  }

  function skip() {
    clearTimer()
    isRunning.value = false
    isPaused.value = false

    if (mode.value === 'focus') {
      completedRounds.value++
      const isLongBreak = completedRounds.value % LONG_BREAK_INTERVAL === 0
      switchMode(isLongBreak ? 'long-break' : 'short-break')
    } else {
      switchMode('focus')
    }
  }

  function reset() {
    clearTimer()
    isRunning.value = false
    isPaused.value = false
    remainingSeconds.value = totalSeconds.value
  }

  function updateConfig(newConfig: Partial<TimerConfig>) {
    config.value = { ...config.value, ...newConfig }
    if (!isRunning.value) {
      remainingSeconds.value = totalSeconds.value
    }
  }

  const progress = computed(() => {
    if (totalSeconds.value === 0) return 0
    return 1 - remainingSeconds.value / totalSeconds.value
  })

  const displayMinutes = computed(() =>
    Math.floor(remainingSeconds.value / 60)
      .toString()
      .padStart(2, '0'),
  )

  const displaySeconds = computed(() =>
    (remainingSeconds.value % 60).toString().padStart(2, '0'),
  )

  onUnmounted(clearTimer)

  return {
    config,
    mode,
    completedRounds,
    isRunning,
    isPaused,
    remainingSeconds,
    totalSeconds,
    progress,
    displayMinutes,
    displaySeconds,
    start,
    pause,
    resume,
    skip,
    reset,
    switchMode,
    updateConfig,
  }
}
