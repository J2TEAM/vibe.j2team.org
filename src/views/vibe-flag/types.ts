export interface Country {
  code: string
  name: string
  nameVi: string
  continent: string
}

export type GameMode = 'classic' | 'survival' | 'hard'
export type GameState = 'menu' | 'playing' | 'result'

export interface GameConfig {
  mode: GameMode
  totalQuestions: number
  timePerQuestion: number
  maxLives: number
}

export interface Question {
  correct: Country
  options: Country[]
}

export interface GameStats {
  score: number
  correct: number
  wrong: number
  streak: number
  maxStreak: number
  lives: number
  wrongCountries: Country[]
  timeBonus: number
}

export const GAME_CONFIGS: Record<GameMode, GameConfig> = {
  classic: {
    mode: 'classic',
    totalQuestions: 20,
    timePerQuestion: 10,
    maxLives: 99,
  },
  survival: {
    mode: 'survival',
    totalQuestions: 999,
    timePerQuestion: 8,
    maxLives: 3,
  },
  hard: {
    mode: 'hard',
    totalQuestions: 15,
    timePerQuestion: 12,
    maxLives: 99,
  },
}

export interface RankInfo {
  label: string
  emoji: string
  minScore: number
  color: string
}

export const RANKS: RankInfo[] = [
  { label: 'Vibe Legend', emoji: '👑', minScore: 90, color: 'text-accent-amber' },
  { label: 'Địa lý gia', emoji: '🌍', minScore: 70, color: 'text-accent-coral' },
  { label: 'Nhà thám hiểm', emoji: '🧭', minScore: 50, color: 'text-accent-sky' },
  { label: 'Tân binh', emoji: '🗺️', minScore: 30, color: 'text-text-secondary' },
  { label: 'Newbie Globe', emoji: '🌐', minScore: 0, color: 'text-text-dim' },
]
