// Vietnamese 5-character word list — sourced from github.com/Hugo0/wordle (MIT)
// Data is lazy-loaded from /wordle/words.json to avoid bundling ~30 kB into the main JS chunk.

interface WordData {
  answers: string[]
  valid: string[]
}

let _data: WordData | null = null

async function loadWords(): Promise<WordData> {
  if (_data) return _data
  const res = await fetch('/wordle/words.json')
  _data = (await res.json()) as WordData
  return _data
}

export async function getAnswerWords(): Promise<string[]> {
  return (await loadWords()).answers
}

export async function getValidWords(): Promise<string[]> {
  return (await loadWords()).valid
}

/**
 * Pick a deterministic daily word based on the current date.
 * Anchor: 2025-01-01. Cycles through answer pool.
 */
export async function getDailyWord(): Promise<string> {
  const epoch = new Date(2025, 0, 1)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const dayIndex = Math.floor((today.getTime() - epoch.getTime()) / 86_400_000)
  const pool = (await loadWords()).answers
  return (pool[Math.abs(dayIndex) % pool.length] ?? 'chung').normalize('NFC')
}

export function getTodayKey(): string {
  const d = new Date()
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
}

/**
 * Strip all Vietnamese diacritics (tone marks + vowel modifiers) for
 * base-character comparison so physical keyboard input (plain a-z) works.
 *
 *   ề → e   ở → o   ư → u   ă → a   â → a   đ → d
 */
export function toBase(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, (c) => (c === 'đ' ? 'd' : 'D'))
}
