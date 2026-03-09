import { ref, computed } from 'vue'
import type { ComboLevel, ComboConfig } from '../types'

const COMBO_CONFIGS: Record<ComboLevel, ComboConfig> = {
  0: { minStreak: 0, multiplier: 1, duration: 0, color: 'transparent', label: '' },
  1: { minStreak: 3, multiplier: 2, duration: 20000, color: '#22c55e', label: 'x2' },
  2: { minStreak: 10, multiplier: 3, duration: 12000, color: '#3b82f6', label: 'x3' },
  3: { minStreak: 15, multiplier: 4, duration: 8000, color: '#eab308', label: 'x4' },
  4: { minStreak: 20, multiplier: 5, duration: 5000, color: '#a855f7', label: 'x5' },
}

// lvMax(5s) → lv3(5s) → lv2(5s) → lv1(5s) → end
// lv3(8s) → lv2(7s) → lv1(6s) → end
// lv2(12s) → lv1(8s) → end
// lv1(20s) → end
const CASCADE_TIMES: Record<ComboLevel, number[]> = {
  0: [],
  1: [20000], // 20s lv1
  2: [12000, 8000], // 12s lv2, 8s lv1
  3: [8000, 7000, 6000], // 8s lv3, 7s lv2, 6s lv1
  4: [5000, 5000, 5000, 5000], // 5s lv4, 5s lv3, 5s lv2, 5s lv1
}

export function useCombo() {
  const streak = ref(0)
  const comboLevel = ref<ComboLevel>(0)
  const maxCombo = ref(0)

  const comboTimerStart = ref(0)
  const comboTimerDuration = ref(0)
  const comboTimerRemaining = ref(0)
  const cascadeIndex = ref(0)
  const peakLevel = ref<ComboLevel>(0)
  let comboInterval: ReturnType<typeof setInterval> | null = null

  const currentConfig = computed(() => COMBO_CONFIGS[comboLevel.value])

  const comboProgress = computed(() => {
    if (comboTimerDuration.value <= 0) return 1
    return comboTimerRemaining.value / comboTimerDuration.value
  })

  function calculateLevel(currentStreak: number): ComboLevel {
    if (currentStreak >= 20) return 4
    if (currentStreak >= 15) return 3
    if (currentStreak >= 10) return 2
    if (currentStreak >= 3) return 1
    return 0
  }

  function startCascadeTimer() {
    stopCascadeTimer()

    const cascadeTimes = CASCADE_TIMES[peakLevel.value]
    if (!cascadeTimes || cascadeTimes.length === 0) return

    function runCurrentCascade() {
      const times = CASCADE_TIMES[peakLevel.value]
      if (!times || cascadeIndex.value >= times.length) {
        comboLevel.value = 0
        comboTimerRemaining.value = 0
        comboTimerDuration.value = 0
        stopCascadeTimer()
        return
      }

      const duration = times[cascadeIndex.value] ?? 0
      const levelsFromPeak = cascadeIndex.value
      const currentLvl = Math.max(0, peakLevel.value - levelsFromPeak) as ComboLevel
      comboLevel.value = currentLvl
      comboTimerDuration.value = duration
      comboTimerStart.value = Date.now()
      comboTimerRemaining.value = duration

      comboInterval = setInterval(() => {
        const elapsed = Date.now() - comboTimerStart.value
        comboTimerRemaining.value = Math.max(0, duration - elapsed)

        if (comboTimerRemaining.value <= 0) {
          cascadeIndex.value++
          if (comboInterval) clearInterval(comboInterval)
          runCurrentCascade()
        }
      }, 50)
    }

    runCurrentCascade()
  }

  function stopCascadeTimer() {
    if (comboInterval) {
      clearInterval(comboInterval)
      comboInterval = null
    }
  }

  function incrementStreak() {
    streak.value++
    if (streak.value > maxCombo.value) {
      maxCombo.value = streak.value
    }

    const newLevel = calculateLevel(streak.value)
    if (newLevel > 0) {
      comboLevel.value = newLevel
      peakLevel.value = newLevel
      cascadeIndex.value = 0
      startCascadeTimer()
    }
  }

  function resetStreak() {}

  function resetCombo() {
    streak.value = 0
    comboLevel.value = 0
    peakLevel.value = 0
    cascadeIndex.value = 0
    comboTimerRemaining.value = 0
    comboTimerDuration.value = 0
    stopCascadeTimer()
  }

  function getMultiplier(): number {
    return COMBO_CONFIGS[comboLevel.value].multiplier
  }

  function dispose() {
    stopCascadeTimer()
  }

  return {
    streak,
    comboLevel,
    maxCombo,
    currentConfig,
    comboProgress,
    comboTimerRemaining,
    comboTimerDuration,
    incrementStreak,
    resetStreak,
    resetCombo,
    getMultiplier,
    dispose,
    COMBO_CONFIGS,
  }
}
