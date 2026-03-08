import { ref, computed } from 'vue'

const STORAGE_KEY = 'vibe-favorites'

function loadFavorites(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        return parsed.filter((p): p is string => typeof p === 'string')
      }
    }
  } catch {
    // corrupted data — start fresh
  }
  return []
}

function saveFavorites(paths: string[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(paths))
  } catch {
    // localStorage unavailable (e.g. private browsing)
  }
}

const favoritePaths = ref<string[]>(loadFavorites())
const favoriteSet = computed(() => new Set(favoritePaths.value))

export function useFavorites() {
  function toggleFavorite(path: string) {
    const index = favoritePaths.value.indexOf(path)
    if (index === -1) {
      favoritePaths.value.push(path)
    } else {
      favoritePaths.value.splice(index, 1)
    }
    saveFavorites(favoritePaths.value)
  }

  function isFavorite(path: string): boolean {
    return favoriteSet.value.has(path)
  }

  return { favoritePaths, toggleFavorite, isFavorite }
}
