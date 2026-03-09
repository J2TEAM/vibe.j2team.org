import { data } from '../data'
import type { WordData } from '../data'

function normalizeWord(word: string): string {
  return word.toLowerCase().trim().replace(/\s+/g, ' ')
}

function getLastSyllable(word: string): string {
  const parts = normalizeWord(word).split(' ')
  return parts[parts.length - 1] ?? ''
}

function wordExistsInDict(word: string): boolean {
  const normalized = normalizeWord(word)
  if (normalized in (data as WordData)) return true
  const parts = normalized.split(' ')
  if (parts.length >= 2) {
    const firstPart = parts.slice(0, -1).join(' ')
    const lastPart = parts[parts.length - 1] ?? ''
    const values = (data as WordData)[firstPart]
    if (values && values.includes(lastPart)) return true
  }
  return false
}

function isValidChain(previousWord: string, currentWord: string): boolean {
  const lastSyllable = getLastSyllable(previousWord)
  const normalized = normalizeWord(currentWord)
  return normalized.startsWith(lastSyllable + ' ') || normalized === lastSyllable
}

function getChainableWords(word: string): string[] {
  const lastSyllable = getLastSyllable(word)
  const results: string[] = []

  for (const key of Object.keys(data as WordData)) {
    if (
      key === lastSyllable ||
      key.startsWith(lastSyllable + ' ') ||
      key.startsWith(lastSyllable + '-')
    ) {
      const values = (data as WordData)[key]
      if (values) {
        for (const val of values) {
          results.push(`${key} ${val}`)
        }
      }
    }
  }

  const directValues = (data as WordData)[lastSyllable]
  if (directValues) {
    for (const val of directValues) {
      results.push(`${lastSyllable} ${val}`)
    }
  }

  return [...new Set(results)]
}
function botPickWord(previousWord: string): string | null {
  const candidates = getChainableWords(previousWord)
  if (candidates.length === 0) return null
  const idx = Math.floor(Math.random() * candidates.length)
  return candidates[idx] ?? null
}

function getRandomStartWord(): string {
  const keys = Object.keys(data as WordData)
  const randomKey = keys[Math.floor(Math.random() * keys.length)] ?? 'an'
  const values = (data as WordData)[randomKey]
  if (values && values.length > 0) {
    const randomVal = values[Math.floor(Math.random() * values.length)] ?? values[0]
    return `${randomKey} ${randomVal}`
  }
  return randomKey
}

export function useWordChain() {
  return {
    normalizeWord,
    getLastSyllable,
    wordExistsInDict,
    isValidChain,
    getChainableWords,
    botPickWord,
    getRandomStartWord,
  }
}
