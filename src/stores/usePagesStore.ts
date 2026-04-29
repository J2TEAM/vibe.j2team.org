import { ref, computed, shallowRef } from 'vue'
import { defineStore } from 'pinia'
import type { PageInfo } from '@/types/page'

export const usePagesStore = defineStore('pages', () => {
  const pages = shallowRef<PageInfo[]>([])
  const isReady = ref(false)

  const featuredPages = computed(() => pages.value.filter((p) => p.featured))
  const pageByPath = computed(() => new Map(pages.value.map((p) => [p.path, p])))

  async function init(): Promise<void> {
    if (isReady.value) return
    const data = await fetchPages()
    pages.value = data
    isReady.value = true
  }

  return { pages, featuredPages, pageByPath, isReady, init }
})

// Module-level promise cache — ensures a single network request
let _fetchPromise: Promise<PageInfo[]> | null = null
let _cache: PageInfo[] | null = null

function fetchPages(): Promise<PageInfo[]> {
  if (_cache) return Promise.resolve(_cache)
  if (_fetchPromise) return _fetchPromise
  _fetchPromise = fetch('/data/pages.json')
    .then((r) => r.json() as Promise<PageInfo[]>)
    .then((data) => {
      _cache = data
      return data
    })
    .catch((err) => {
      _fetchPromise = null // allow retry on next call
      throw err
    })
  return _fetchPromise
}

/** Async access to raw pages — reusable by sub-views that need their own transforms */
export function fetchRawPages(): Promise<PageInfo[]> {
  return fetchPages()
}

/** Sync access to pages — only valid after fetchPages() has resolved */
export function getPagesCacheSync(): PageInfo[] {
  if (!_cache) {
    console.error('Pages not loaded yet. Ensure router guard has completed.')
    return []
  }
  return _cache
}
