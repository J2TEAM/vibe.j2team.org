import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'
import { setActivePinia, createPinia } from 'pinia'

import type { useFavoritesStore as UseFavoritesStore } from '@/stores/useFavoritesStore'

describe('useFavoritesStore', () => {
  let useFavorites: typeof UseFavoritesStore

  beforeEach(async () => {
    vi.resetModules()
    vi.doMock('@vueuse/core', () => ({
      useLocalStorage: (_key: string, defaultValue: string[]) => ref([...defaultValue]),
    }))
    setActivePinia(createPinia())
    const mod = await import('@/stores/useFavoritesStore')
    useFavorites = mod.useFavoritesStore
  })

  it('starts with empty favoritePaths', () => {
    const store = useFavorites()
    expect(store.favoritePaths).toEqual([])
  })

  it('toggleFavorite adds a path when not present', () => {
    const store = useFavorites()
    store.toggleFavorite('/test-app')
    expect(store.favoritePaths).toEqual(['/test-app'])
  })

  it('toggleFavorite removes a path when already present', () => {
    const store = useFavorites()
    store.toggleFavorite('/test-app')
    store.toggleFavorite('/test-app')
    expect(store.favoritePaths).toEqual([])
  })

  it('isFavorite returns true after adding, false after removing', () => {
    const store = useFavorites()
    store.toggleFavorite('/app-a')
    expect(store.isFavorite('/app-a')).toBe(true)
    store.toggleFavorite('/app-a')
    expect(store.isFavorite('/app-a')).toBe(false)
  })

  it('toggle same path twice restores original state', () => {
    const store = useFavorites()
    store.toggleFavorite('/round-trip')
    store.toggleFavorite('/round-trip')
    expect(store.favoritePaths).toEqual([])
  })

  it('tracks multiple distinct paths independently', () => {
    const store = useFavorites()
    store.toggleFavorite('/app-a')
    store.toggleFavorite('/app-b')
    store.toggleFavorite('/app-c')

    expect(store.favoritePaths).toHaveLength(3)
    expect(store.isFavorite('/app-a')).toBe(true)
    expect(store.isFavorite('/app-b')).toBe(true)
    expect(store.isFavorite('/app-c')).toBe(true)

    store.toggleFavorite('/app-b')
    expect(store.isFavorite('/app-b')).toBe(false)
    expect(store.favoritePaths).toHaveLength(2)
  })

  it('multiple store calls share the same singleton state', () => {
    const first = useFavorites()
    const second = useFavorites()

    first.toggleFavorite('/shared')
    expect(second.isFavorite('/shared')).toBe(true)
    expect(second.favoritePaths).toEqual(['/shared'])
  })
})
