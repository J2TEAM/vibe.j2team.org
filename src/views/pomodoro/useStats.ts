import { ref, computed } from 'vue'

interface DailyRecord {
  date: string
  pomodoros: number
  focusMinutes: number
}

interface StatsData {
  history: DailyRecord[]
}

const STORAGE_KEY = 'pomodoro-stats'
const MAX_HISTORY_DAYS = 30

function todayKey(): string {
  return new Date().toISOString().slice(0, 10)
}

function loadStats(): StatsData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const data = JSON.parse(raw) as StatsData
      return data
    }
  } catch {
    /* corrupted data — start fresh */
  }
  return { history: [] }
}

function saveStats(data: StatsData) {
  const trimmed: StatsData = {
    history: data.history.slice(-MAX_HISTORY_DAYS),
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed))
}

export function useStats() {
  const stats = ref<StatsData>(loadStats())

  function getTodayRecord(): DailyRecord {
    const key = todayKey()
    let record = stats.value.history.find((r) => r.date === key)
    if (!record) {
      record = { date: key, pomodoros: 0, focusMinutes: 0 }
      stats.value.history.push(record)
    }
    return record
  }

  function recordPomodoro(minutes: number) {
    const record = getTodayRecord()
    record.pomodoros++
    record.focusMinutes += minutes
    saveStats(stats.value)
  }

  const todayPomodoros = computed(() => {
    const key = todayKey()
    const record = stats.value.history.find((r) => r.date === key)
    return record?.pomodoros ?? 0
  })

  const todayFocusMinutes = computed(() => {
    const key = todayKey()
    const record = stats.value.history.find((r) => r.date === key)
    return record?.focusMinutes ?? 0
  })

  const streak = computed(() => {
    const sorted = [...stats.value.history]
      .filter((r) => r.pomodoros > 0)
      .sort((a, b) => b.date.localeCompare(a.date))

    if (sorted.length === 0) return 0

    let count = 0
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    for (let i = 0; i < sorted.length; i++) {
      const expected = new Date(today)
      expected.setDate(expected.getDate() - i)
      const expectedKey = expected.toISOString().slice(0, 10)

      const entry = sorted[i]
      if (entry?.date === expectedKey) {
        count++
      } else {
        break
      }
    }

    return count
  })

  const weeklyData = computed(() => {
    const days: DailyRecord[] = []
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const key = date.toISOString().slice(0, 10)
      const record = stats.value.history.find((r) => r.date === key)
      days.push(record ?? { date: key, pomodoros: 0, focusMinutes: 0 })
    }

    return days
  })

  const weeklyMax = computed(() => {
    const max = Math.max(...weeklyData.value.map((d) => d.pomodoros))
    return max > 0 ? max : 1
  })

  return {
    recordPomodoro,
    todayPomodoros,
    todayFocusMinutes,
    streak,
    weeklyData,
    weeklyMax,
  }
}
