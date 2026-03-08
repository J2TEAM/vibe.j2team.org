import { ref, computed } from 'vue'

export function useTimer() {
  const startTime = ref<number>(0)
  const elapsedTime = ref<number>(0)
  const isRunning = ref(false)
  let animationFrameId: number | null = null

  const formattedTime = computed(() => {
    const seconds = Math.floor(elapsedTime.value / 1000)
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    const milliseconds = Math.floor((elapsedTime.value % 1000) / 10)

    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds
      .toString()
      .padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`
  })

  function update() {
    if (isRunning.value) {
      elapsedTime.value = performance.now() - startTime.value
      animationFrameId = requestAnimationFrame(update)
    }
  }

  function start() {
    startTime.value = performance.now()
    elapsedTime.value = 0
    isRunning.value = true
    update()
  }

  function stop() {
    isRunning.value = false
    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId)
      animationFrameId = null
    }
  }

  function reset() {
    stop()
    elapsedTime.value = 0
  }

  return {
    elapsedTime,
    formattedTime,
    isRunning,
    start,
    stop,
    reset,
  }
}
