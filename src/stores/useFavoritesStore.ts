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

  function exportFavorites(): boolean {
    if (favoritePaths.value.length === 0) return false

    const data = { version: 1, favorites: [...favoritePaths.value] }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `vibe-favorites-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    return true
  }

  function importFavorites(file: File): Promise<ImportResult | ImportError> {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = () => {
        try {
          const data = JSON.parse(reader.result as string)
          if (typeof data.version !== 'number' || !Array.isArray(data.favorites)) {
            resolve({ error: 'File không đúng định dạng' })
            return
          }
          const paths = (data.favorites as string[]).filter(
            (p) => typeof p === 'string' && p.trim() !== '',
          )
          let added = 0
          let skipped = 0
          for (const path of paths) {
            if (favoriteSet.value.has(path)) {
              skipped++
            } else {
              favoritePaths.value.push(path)
              added++
            }
          }
          resolve({ added, skipped, total: paths.length })
        } catch {
          resolve({ error: 'File không phải JSON hợp lệ' })
        }
      }
      reader.onerror = () => resolve({ error: 'Không thể đọc file' })
      reader.readAsText(file)
    })
  }

  return { favoritePaths, toggleFavorite, isFavorite, exportFavorites, importFavorites }
})

export interface ImportResult {
  added: number
  skipped: number
  total: number
}

export interface ImportError {
  error: string
}
