export interface DailyHealthEntry {
  date: string
  sleepHours: number | null
  waterMl: number | null
  moveMinutes: number | null
  moodScore: number | null
  updatedAt: number
}

export interface DailyBarPoint {
  date: string
  label: string
  completion: number
  percent: number
}
