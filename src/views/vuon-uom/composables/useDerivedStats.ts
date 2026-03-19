import { computed } from 'vue'
import type { Ref } from 'vue'
import type { Stats, DerivedStats } from '../types'

export function useDerivedStats(stats: Ref<Stats>) {
  const derived = computed<DerivedStats>(() => {
    const { nature, human, economy, digital } = stats.value
    const values = [nature, human, economy, digital]
    const max = Math.max(...values)
    const min = Math.min(...values)

    return {
      harmony: Math.round(100 - (max - min)),
      sustainability: Math.round((nature + economy) / 2),
      connection: Math.round((human + digital) / 2),
    }
  })

  return { derived }
}
