import { computed } from 'vue'
import { useLocalStorage } from '@vueuse/core'

const favoritePaths = useLocalStorage<string[]>('vibe-favorites', [])
const favoriteSet = computed(() => new Set(favoritePaths.value))

export function useFavorites() {
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
}
