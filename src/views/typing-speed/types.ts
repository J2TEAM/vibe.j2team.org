/** Trạng thái màn hình game */
export type GameState = 'idle' | 'playing' | 'finished'

/** Trạng thái từng từ */
export type WordStatus = 'pending' | 'correct' | 'incorrect' | 'active'

export interface WordItem {
  word: string
  status: WordStatus
  /** Nội dung user đã gõ cho từ đã xong */
  typed: string
}

export interface TypingRecord {
  wpm: number
  accuracy: number
  correct: number
  incorrect: number
  durationSeconds: number
  date: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

export const TIME_OPTIONS = [15, 30, 45, 60] as const
export const WORD_COUNT = 150
export const HISTORY_STORAGE_KEY = 'typing-speed-history'
export const HISTORY_MAX = 20
export const ROW_HEIGHT_THRESHOLD = 12
