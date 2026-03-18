import { computed, ref } from 'vue'
import { useLocalStorage, useNow } from '@vueuse/core'
import type { DailyBarPoint, DailyHealthEntry } from '../types'

const STORAGE_KEY = 'daily-health-checkin.entries.v1'

function pad2(value: number): string {
  return String(value).padStart(2, '0')
}

function toLocalDateKey(value: Date): string {
  const year = value.getFullYear()
  const month = pad2(value.getMonth() + 1)
  const day = pad2(value.getDate())
  return `${year}-${month}-${day}`
}

function getDateLabel(dateKey: string): string {
  const date = new Date(`${dateKey}T00:00:00`)
  const weekdays = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
  return weekdays[date.getDay()] ?? '?'
}

function shiftDate(base: Date, days: number): Date {
  const next = new Date(base)
  next.setDate(next.getDate() + days)
  return next
}

function metricCount(entry: DailyHealthEntry | undefined): number {
  if (!entry) {
    return 0
  }

  let count = 0
  if (entry.sleepHours !== null) count++
  if (entry.waterMl !== null) count++
  if (entry.moveMinutes !== null) count++
  if (entry.moodScore !== null) count++
  return count
}

function toNullableNumber(raw: number | null): number | null {
  if (raw === null || Number.isNaN(raw)) {
    return null
  }
  return raw
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function roundToStep(value: number, step: number): number {
  return Math.round(value / step) * step
}

function normalizeSleepHours(raw: number | null): number | null {
  const value = toNullableNumber(raw)
  if (value === null) {
    return null
  }
  const rounded = roundToStep(value, 0.5)
  return clamp(rounded, 0, 24)
}

function normalizeWaterMl(raw: number | null): number | null {
  const value = toNullableNumber(raw)
  if (value === null) {
    return null
  }
  return Math.round(clamp(value, 0, 10000))
}

function normalizeMoveMinutes(raw: number | null): number | null {
  const value = toNullableNumber(raw)
  if (value === null) {
    return null
  }
  return Math.round(clamp(value, 0, 600))
}

function normalizeMoodScore(raw: number | null): number | null {
  const value = toNullableNumber(raw)
  if (value === null) {
    return null
  }
  return Math.round(clamp(value, 1, 5))
}

export function useDailyHealthCheckin() {
  const now = useNow({ interval: 60_000 })
  const entries = useLocalStorage<DailyHealthEntry[]>(STORAGE_KEY, [])

  const sleepHours = ref<number | null>(null)
  const waterMl = ref<number | null>(null)
  const moveMinutes = ref<number | null>(null)
  const moodScore = ref<number | null>(null)

  const todayKey = computed(() => toLocalDateKey(new Date(now.value)))

  const todayEntry = computed<DailyHealthEntry | undefined>(() => {
    return entries.value.find((item) => item.date === todayKey.value)
  })

  const yesterdayKey = computed(() => {
    return toLocalDateKey(shiftDate(new Date(now.value), -1))
  })

  const yesterdayEntry = computed<DailyHealthEntry | undefined>(() => {
    return entries.value.find((item) => item.date === yesterdayKey.value)
  })

  const lastUpdatedAt = computed(() => todayEntry.value?.updatedAt ?? null)

  const todayCompletion = computed(() => metricCount(todayEntry.value))

  const totalEntries = computed(() => entries.value.length)

  const sevenDaySeries = computed<DailyBarPoint[]>(() => {
    const base = new Date(now.value)
    const points: DailyBarPoint[] = []

    for (let offset = -6; offset <= 0; offset++) {
      const dateKey = toLocalDateKey(shiftDate(base, offset))
      const entry = entries.value.find((item) => item.date === dateKey)
      const completion = metricCount(entry)
      points.push({
        date: dateKey,
        label: getDateLabel(dateKey),
        completion,
        percent: Math.round((completion / 4) * 100),
      })
    }

    return points
  })

  const weeklyAverage = computed(() => {
    if (sevenDaySeries.value.length === 0) {
      return 0
    }

    const totalPercent = sevenDaySeries.value.reduce((sum, item) => sum + item.percent, 0)
    return Math.round(totalPercent / sevenDaySeries.value.length)
  })

  const streakDays = computed(() => {
    let streak = 0
    const base = new Date(now.value)

    for (let offset = 0; offset >= -90; offset--) {
      const dateKey = toLocalDateKey(shiftDate(base, offset))
      const entry = entries.value.find((item) => item.date === dateKey)
      if (!entry || metricCount(entry) === 0) {
        break
      }
      streak++
    }

    return streak
  })

  const suggestions = computed<string[]>(() => {
    const entry = todayEntry.value
    if (!entry) {
      return ['Bắt đầu check-in hôm nay để tạo baseline cho tuần này.']
    }

    const items: string[] = []

    if (entry.sleepHours !== null && entry.sleepHours < 6) {
      items.push('Ngủ dưới 6 giờ: thử đi ngủ sớm hơn 20-30 phút tối nay.')
    }
    if (entry.waterMl !== null && entry.waterMl < 1500) {
      items.push('Lượng nước còn thấp: chia 2 cốc nước cho buổi chiều/tối.')
    }
    if (entry.moveMinutes !== null && entry.moveMinutes < 20) {
      items.push('Vận động thấp: thêm 10-15 phút đi bộ nhẹ sau bữa tối.')
    }
    if (entry.moodScore !== null && entry.moodScore <= 2) {
      items.push('Tâm trạng thấp: thử nghỉ ngắn 5 phút thở sâu hoặc đi bộ chậm.')
    }

    if (items.length === 0) {
      items.push('Hôm nay đang cân bằng tốt, duy trì nhịp này thêm 2-3 ngày nữa.')
    }

    return items
  })

  function loadTodayDraft(): void {
    const entry = todayEntry.value
    sleepHours.value = entry?.sleepHours ?? null
    waterMl.value = entry?.waterMl ?? null
    moveMinutes.value = entry?.moveMinutes ?? null
    moodScore.value = entry?.moodScore ?? null
  }

  function saveTodayEntry(): DailyHealthEntry {
    const payload: DailyHealthEntry = {
      date: todayKey.value,
      sleepHours: normalizeSleepHours(sleepHours.value),
      waterMl: normalizeWaterMl(waterMl.value),
      moveMinutes: normalizeMoveMinutes(moveMinutes.value),
      moodScore: normalizeMoodScore(moodScore.value),
      updatedAt: Date.now(),
    }

    // Keep the in-form values aligned with normalized values after each save.
    sleepHours.value = payload.sleepHours
    waterMl.value = payload.waterMl
    moveMinutes.value = payload.moveMinutes
    moodScore.value = payload.moodScore

    const index = entries.value.findIndex((item) => item.date === todayKey.value)
    if (index >= 0) {
      const nextEntries = [...entries.value]
      nextEntries[index] = payload
      entries.value = nextEntries.sort((a, b) => a.date.localeCompare(b.date))
      return payload
    }

    entries.value = [...entries.value, payload].sort((a, b) => a.date.localeCompare(b.date))
    return payload
  }

  function clearAllEntries(): void {
    entries.value = []
    sleepHours.value = null
    waterMl.value = null
    moveMinutes.value = null
    moodScore.value = null
  }

  loadTodayDraft()

  return {
    sleepHours,
    waterMl,
    moveMinutes,
    moodScore,
    entries,
    todayKey,
    todayEntry,
    yesterdayKey,
    yesterdayEntry,
    lastUpdatedAt,
    todayCompletion,
    totalEntries,
    sevenDaySeries,
    weeklyAverage,
    streakDays,
    suggestions,
    loadTodayDraft,
    saveTodayEntry,
    clearAllEntries,
  }
}
