import type { IdiomCategoryId } from './categories'

export interface Idiom {
  id: string
  phrase: string
  literal_vi: string
  meaning_vi: string
  funny_context: string
  example_en: string
  example_vi: string
  category: IdiomCategoryId
  difficulty: 'easy' | 'medium' | 'hard'
  emoji: string
  wrong_answers: [string, string, string]
}

export type BadgeId = 'newbie' | 'streak-7' | 'brain-50' | 'perfect-quiz' | 'spin-10' | 'master'

export interface Badge {
  id: BadgeId
  name: string
  description: string
  emoji: string
  condition: (progress: UserProgress) => boolean
}

export interface UserProgress {
  learnedIds: string[]
  quizScores: QuizRecord[]
  streak: {
    current: number
    longest: number
    lastActiveDate: string
  }
  xp: number
  unlockedBadges: BadgeId[]
  spinHistory: string[]
}

export interface QuizRecord {
  date: string
  score: number
  total: number
  mode: 'classic' | 'time-attack'
  category: IdiomCategoryId | 'all'
}

export const LEVELS = [
  { min: 0, label: '🐣 Newbie Mơ Tây' },
  { min: 100, label: '📚 Đang Vào Số' },
  { min: 300, label: '🧠 Não Đang Nở' },
  { min: 600, label: '💬 Nói Được Đôi Câu' },
  { min: 1000, label: '🔥 Cháy Với Tiếng Anh' },
  { min: 2000, label: '👑 Người Việt Nói Tiếng Anh Như Tây' },
] as const
