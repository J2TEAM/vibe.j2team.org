import { computed } from 'vue'
import { useLocalStorage } from '@vueuse/core'
import type { GratitudeEntry, MoodType } from '../types'

export function useGratitudeStore() {
  const entries = useLocalStorage<GratitudeEntry[]>('gratitude-journal-entries', [])

  function getToday(): string {
    const now = new Date()
    const y = now.getFullYear()
    const m = String(now.getMonth() + 1).padStart(2, '0')
    const d = String(now.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }

  function getEntryByDate(date: string): GratitudeEntry | undefined {
    return entries.value.find((e) => e.date === date)
  }

  function saveEntry(date: string, items: string[], mood: MoodType) {
    const existing = entries.value.findIndex((e) => e.date === date)
    const entry: GratitudeEntry = { date, items, mood, createdAt: Date.now() }
    if (existing >= 0) {
      entries.value[existing] = entry
    } else {
      entries.value.push(entry)
    }
    entries.value = [...entries.value]
  }

  function deleteEntry(date: string) {
    entries.value = entries.value.filter((e) => e.date !== date)
  }

  const totalEntries = computed(() => entries.value.length)

  const currentStreak = computed(() => {
    if (entries.value.length === 0) return 0

    const sortedDates = entries.value
      .map((e) => e.date)
      .sort()
      .reverse()

    const today = getToday()
    const yesterday = getDateString(-1)

    if (sortedDates[0] !== today && sortedDates[0] !== yesterday) return 0

    let streak = 1
    for (let i = 0; i < sortedDates.length - 1; i++) {
      const current = new Date(sortedDates[i]!)
      const prev = new Date(sortedDates[i + 1]!)
      const diffDays = Math.round((current.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24))
      if (diffDays === 1) {
        streak++
      } else {
        break
      }
    }
    return streak
  })

  const longestStreak = computed(() => {
    if (entries.value.length === 0) return 0

    const sortedDates = entries.value.map((e) => e.date).sort()

    let maxStreak = 1
    let current = 1

    for (let i = 1; i < sortedDates.length; i++) {
      const prev = new Date(sortedDates[i - 1]!)
      const curr = new Date(sortedDates[i]!)
      const diffDays = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24))
      if (diffDays === 1) {
        current++
        maxStreak = Math.max(maxStreak, current)
      } else if (diffDays > 1) {
        current = 1
      }
    }
    return maxStreak
  })

  function getMoodStats(startDate?: string, endDate?: string) {
    let filtered = entries.value
    if (startDate) filtered = filtered.filter((e) => e.date >= startDate)
    if (endDate) filtered = filtered.filter((e) => e.date <= endDate)

    const counts: Record<MoodType, number> = {
      amazing: 0,
      good: 0,
      okay: 0,
      sad: 0,
      awful: 0,
    }
    for (const entry of filtered) {
      counts[entry.mood]++
    }
    return { counts, total: filtered.length }
  }

  function getEntriesForMonth(year: number, month: number): GratitudeEntry[] {
    const prefix = `${year}-${String(month).padStart(2, '0')}`
    return entries.value.filter((e) => e.date.startsWith(prefix))
  }

  function getDateString(offsetDays: number): string {
    const d = new Date()
    d.setDate(d.getDate() + offsetDays)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }

  const todayEntry = computed(() => getEntryByDate(getToday()))
  const hasWrittenToday = computed(() => !!todayEntry.value)

  return {
    entries,
    totalEntries,
    currentStreak,
    longestStreak,
    todayEntry,
    hasWrittenToday,
    getToday,
    getEntryByDate,
    saveEntry,
    deleteEntry,
    getMoodStats,
    getEntriesForMonth,
  }
}
