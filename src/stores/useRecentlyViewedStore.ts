import { computed } from 'vue'
import { defineStore } from 'pinia'
import { useLocalStorage } from '@vueuse/core'
import { usePagesStore } from '@/stores/usePagesStore'
import type { PageInfo } from '@/types/page'

interface RecentEntry {
  path: string
  timestamp: number
}

const MAX_RECENT = 20

export const useRecentlyViewedStore = defineStore('recently-viewed', () => {
  const recentEntries = useLocalStorage<RecentEntry[]>('vibe-recently-viewed', [])

  function addVisit(path: string) {
    if (recentEntries.value[0]?.path === path) return

    const filtered = recentEntries.value.filter((e) => e.path !== path)
    filtered.unshift({ path, timestamp: Date.now() })
    recentEntries.value = filtered.slice(0, MAX_RECENT)
  }

  const pagesStore = usePagesStore()

  const recentPages = computed<PageInfo[]>(() => {
    return recentEntries.value.flatMap((entry) => {
      const page = pagesStore.pageByPath.get(entry.path)
      return page ? [page] : []
    })
  })

  function clearHistory() {
    recentEntries.value = []
  }

  return { recentEntries, recentPages, addVisit, clearHistory }
})
