import { computed } from 'vue'
import { defineStore } from 'pinia'
import { useLocalStorage } from '@vueuse/core'

export const useFavoritesStore = defineStore('favorites', () => {
  const favoritePaths = useLocalStorage<string[]>('vibe-favorites', [])
  const favoriteSet = computed(() => new Set(favoritePaths.value))

  function toggleFavorite(path: string) {
    const index = favoritePaths.value.indexOf(path)
    if (index === -1) {
      favoritePaths.value.push(path)
    } else {
      favoritePaths.value.splice(index, 1)
    }
  }

  function isFavorite(path: string): boolean {
    return favoriteSet.value.has(path)
  }

  return { favoritePaths, toggleFavorite, isFavorite }
})
