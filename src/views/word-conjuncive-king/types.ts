export type GameMode = 'normal' | 'solo'

export type GameScreen = 'welcome' | 'playing' | 'gameover'

export type ComboLevel = 0 | 1 | 2 | 3 | 4

export interface ComboConfig {
  minStreak: number
  multiplier: number
  duration: number
  color: string
  label: string
}

export interface LeaderboardEntry {
  score: number
  maxCombo: number
  wordsCount: number
  date: string
}

export interface WordHistoryItem {
  word: string
  isBot: boolean
  isCorrect: boolean
}
