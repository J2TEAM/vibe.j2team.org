import { ref, onMounted } from 'vue'
import type { AppItem } from './useApps'
import { processPages } from './useApps'
import { fetchRawPages } from '@/stores/usePagesStore'

let cachedPages: AppItem[] | null = null

async function loadPages(): Promise<AppItem[]> {
  if (cachedPages) return cachedPages
  const raw = await fetchRawPages()
  cachedPages = processPages(raw)
  return cachedPages
}

export function usePagesLoader() {
  const pagesData = ref<AppItem[]>([])
  const isLoading = ref(true)

  onMounted(async () => {
    pagesData.value = await loadPages()
    isLoading.value = false
  })

  return { pagesData, isLoading }
}
