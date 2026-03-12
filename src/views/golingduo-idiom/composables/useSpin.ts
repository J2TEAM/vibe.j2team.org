import { ref, computed } from 'vue'
import { idiomCategories } from '../data/categories'
import { idioms } from '../data/idioms'
import type { Idiom } from '../data/types'

export function useSpin() {
  const isSpinning = ref(false)
  const rotation = ref(0)
  const resultIdiom = ref<Idiom | null>(null)
  const showResult = ref(false)

  const segments = computed(() =>
    idiomCategories.map((cat) => ({
      ...cat,
      idioms: idioms.filter((i) => i.category === cat.id),
    })),
  )

  function spin() {
    if (isSpinning.value) return

    isSpinning.value = true
    showResult.value = false
    resultIdiom.value = null

    // Random rotation: at least 3 full turns + random extra
    const extraDeg = Math.random() * 360
    const totalDeg = 360 * (3 + Math.floor(Math.random() * 3)) + extraDeg
    rotation.value += totalDeg

    // Determine which segment landed
    const segmentAngle = 360 / idiomCategories.length
    const normalizedAngle = rotation.value % 360
    const segmentIndex = Math.floor(normalizedAngle / segmentAngle)
    const category = idiomCategories[segmentIndex % idiomCategories.length]

    // Pick random idiom from that category after animation
    setTimeout(() => {
      if (category) {
        const catIdioms = idioms.filter((i) => i.category === category.id)
        const randomIdx = Math.floor(Math.random() * catIdioms.length)
        resultIdiom.value = catIdioms[randomIdx] ?? null
      }
      isSpinning.value = false
      showResult.value = true
    }, 3500)
  }

  function reset() {
    showResult.value = false
    resultIdiom.value = null
  }

  return {
    isSpinning,
    rotation,
    resultIdiom,
    showResult,
    segments,
    spin,
    reset,
  }
}
