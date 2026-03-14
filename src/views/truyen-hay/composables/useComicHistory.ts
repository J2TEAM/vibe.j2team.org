import { computed } from 'vue'
import { useLocalStorage } from '@vueuse/core'
import type { HistoryComic, BookmarkComic } from '../types'

export function useComicHistory() {
  const watchHistory = useLocalStorage<HistoryComic[]>('truyen-hay-history', [])
  const bookmarks = useLocalStorage<BookmarkComic[]>('truyen-hay-bookmarks', [])

  const addToHistory = (comic: HistoryComic) => {
    const existingIndex = watchHistory.value.findIndex((m) => m.slug === comic.slug)
    if (existingIndex > -1) {
      watchHistory.value.splice(existingIndex, 1)
    }
    comic.last_watched = Date.now()
    watchHistory.value.unshift(comic)
    if (watchHistory.value.length > 50) {
      watchHistory.value = watchHistory.value.slice(0, 50)
    }
  }

  const removeFromHistory = (slug: string) => {
    watchHistory.value = watchHistory.value.filter((m) => m.slug !== slug)
  }

  const clearHistory = () => {
    watchHistory.value = []
  }

  const isBookmarked = (slug: string) =>
    computed(() => bookmarks.value.some((b) => b.slug === slug))

  const toggleBookmark = (comic: Omit<BookmarkComic, 'bookmarked_at'>) => {
    const existingIndex = bookmarks.value.findIndex((b) => b.slug === comic.slug)
    if (existingIndex > -1) {
      bookmarks.value.splice(existingIndex, 1)
    } else {
      bookmarks.value.unshift({
        ...comic,
        bookmarked_at: Date.now(),
      })
    }
  }

  return {
    watchHistory,
    bookmarks,
    addToHistory,
    removeFromHistory,
    clearHistory,
    isBookmarked,
    toggleBookmark,
  }
}
