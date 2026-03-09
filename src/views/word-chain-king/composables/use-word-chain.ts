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
  const parts = normalized.split(' ')
  if (parts.length < 2) return false
  return normalized.startsWith(lastSyllable + ' ')
}

function getChainableWords(word: string, usedWords?: Set<string>): string[] {
  const lastSyllable = getLastSyllable(word)
  const results: string[] = []

  const directValues = (data as WordData)[lastSyllable]
  if (directValues) {
    for (const val of directValues) {
      const compound = normalizeWord(`${lastSyllable} ${val}`)
      if (!usedWords || !usedWords.has(compound)) {
        results.push(compound)
      }
    }
  }

  for (const key of Object.keys(data as WordData)) {
    if (key.startsWith(lastSyllable + ' ') || key.startsWith(lastSyllable + '-')) {
      const values = (data as WordData)[key]
      if (values) {
        for (const val of values) {
          const compound = normalizeWord(`${key} ${val}`)
          if (!usedWords || !usedWords.has(compound)) {
            results.push(compound)
          }
        }
      }
    }
  }

  return [...new Set(results)]
}

function botPickWord(previousWord: string, usedWords?: Set<string>): string | null {
  const candidates = getChainableWords(previousWord, usedWords)
  if (candidates.length === 0) return null
  const idx = Math.floor(Math.random() * candidates.length)
  return candidates[idx] ?? null
}

function getRandomStartWord(usedWords?: Set<string>): string {
  const keys = Object.keys(data as WordData)
  for (let attempt = 0; attempt < 50; attempt++) {
    const randomKey = keys[Math.floor(Math.random() * keys.length)] ?? 'an'
    const values = (data as WordData)[randomKey]
    if (!values || values.length === 0) continue
    const randomVal = values[Math.floor(Math.random() * values.length)] ?? values[0]
    const startWord = `${randomKey} ${randomVal}`
    if (usedWords && usedWords.has(normalizeWord(startWord))) continue
    const followUps = getChainableWords(startWord, usedWords)
    if (followUps.length > 0) return startWord
  }
  return 'an khang'
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
