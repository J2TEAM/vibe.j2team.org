import { computed } from 'vue'
import { idioms } from '../data/idioms'

export function useIdiomOfDay() {
  const idiomOfDay = computed(() => {
    const now = new Date()
    const start = new Date(now.getFullYear(), 0, 0)
    const diff = now.getTime() - start.getTime()
    const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24))
    const index = dayOfYear % idioms.length
    return idioms[index]!
  })

  return { idiomOfDay }
}
