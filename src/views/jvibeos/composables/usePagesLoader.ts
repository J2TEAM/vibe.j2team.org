import { ref, onMounted } from 'vue'
import type { PageInfo, AppItem } from './useApps'
import { processPages } from './useApps'

let cachedPages: AppItem[] | null = null
let fetchPromise: Promise<AppItem[]> | null = null

async function loadPages(): Promise<AppItem[]> {
  if (cachedPages) return cachedPages
  if (!fetchPromise) {
    fetchPromise = fetch('/data/pages.json')
      .then((res) => res.json() as Promise<PageInfo[]>)
      .then((raw) => {
        cachedPages = processPages(raw)
        return cachedPages
      })
  }
  return fetchPromise
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
