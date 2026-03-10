import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { useLocalStorage } from '@vueuse/core'
import rawData from '../data/corners.json'
import type {
  CornerDataFile,
  CornerFilters,
  CornerPreferences,
  CornerPredictionItem,
  CornerThresholdKey,
} from '../types'

const data = rawData as CornerDataFile

const DEFAULT_THRESHOLDS: CornerThresholdKey[] = ['8.5', '9.5', '10.5', '11.5', '12.5']

export const useCornerStore = defineStore('corner', () => {
  const predictions = ref<CornerPredictionItem[]>(data.predictions)

  const selectedIndex = ref(0)
  const selectedThreshold = ref<CornerThresholdKey | null>(null)

  const filters = ref<CornerFilters>({
    teamQuery: '',
    onlyFuture: false,
    bookmarkedOnly: false,
  })

  const bookmarks = useLocalStorage<number[]>('corner-bookmarks', [])

  const preferences = useLocalStorage<CornerPreferences>('corner-preferences', {
    confidenceThreshold: 0.52,
    showAdvancedStats: true,
  })

  const updatedAt = data.updatedAt
  const modelInfo = data.model

  const filteredPredictions = computed(() => {
    const query = filters.value.teamQuery.trim().toLowerCase()

    return predictions.value
      .map((item, index) => ({ item, index }))
      .filter(({ item, index }) => {
        if (filters.value.onlyFuture && !item.isFuture) return false
        if (filters.value.bookmarkedOnly && !bookmarks.value.includes(index)) return false
        if (!query) return true

        const text = `${item.homeTeam} ${item.awayTeam}`.toLowerCase()
        return text.includes(query)
      })
  })

  const selectedEntry = computed(() => {
    const list = filteredPredictions.value
    if (!list.length) return null

    const current = list.find((x) => x.index === selectedIndex.value)
    return current ?? list[0]
  })

  const thresholdsForSelected = computed(() => {
    if (!selectedEntry.value) return null

    const { thresholds } = selectedEntry.value.item
    const keys: CornerThresholdKey[] = DEFAULT_THRESHOLDS.filter((key) => thresholds[key])

    return keys.map((key) => ({
      key,
      detail: thresholds[key],
    }))
  })

  const summaryForSelected = computed(() => {
    if (!selectedEntry.value) {
      return null
    }

    const thresholds = thresholdsForSelected.value
    if (!thresholds || thresholds.length === 0) return null

    let overCount = 0
    let underCount = 0
    let noBetCount = 0

    let strongest = thresholds[0]

    for (const entry of thresholds) {
      const rec = entry.detail.recommendation
      if (rec === 'OVER') overCount++
      else if (rec === 'UNDER') underCount++
      else noBetCount++

      if (entry.detail.edge > strongest.detail.edge) {
        strongest = entry
      }
    }

    return {
      overCount,
      underCount,
      noBetCount,
      strongest,
    }
  })

  function setSelectedIndex(index: number) {
    selectedIndex.value = index
  }

  function toggleBookmark(index: number) {
    const current = new Set(bookmarks.value)
    if (current.has(index)) {
      current.delete(index)
    } else {
      current.add(index)
    }
    bookmarks.value = Array.from(current).sort((a, b) => a - b)
  }

  function updateFilters(partial: Partial<CornerFilters>) {
    filters.value = {
      ...filters.value,
      ...partial,
    }
  }

  function updatePreferences(partial: Partial<CornerPreferences>) {
    preferences.value = {
      ...preferences.value,
      ...partial,
    }
  }

  function setSelectedThreshold(key: CornerThresholdKey | null) {
    selectedThreshold.value = key
  }

  return {
    predictions,
    selectedIndex,
    selectedThreshold,
    filters,
    bookmarks,
    preferences,
    updatedAt,
    modelInfo,
    filteredPredictions,
    selectedEntry,
    thresholdsForSelected,
    summaryForSelected,
    setSelectedIndex,
    toggleBookmark,
    updateFilters,
    updatePreferences,
    setSelectedThreshold,
  }
})
