// Utility functions for letter selection and game rules

const VOWELS = ['A', 'E', 'I', 'O', 'U']
const ALL_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

/**
 * Get the number of banned letters for a given round
 * Formula: 2 + floor((round-1)/5)
 */
export function getBannedCount(round: number): number {
  return 2 + Math.floor((round - 1) / 5)
}

/**
 * Get minimum words required to pass a round
 * Formula: 3 + floor((round-1)/5)
 */
export function getMinWordsToPass(round: number): number {
  return 3 + Math.floor((round - 1) / 5)
}

/**
 * Select banned letters for a round with fairness rules
 * - Never ban all vowels (ensure at least 2 vowels remain)
 * - Try to avoid same letters as previous round (soft constraint)
 */
export function selectBannedLetters(round: number, previousBanned: string[] = []): string[] {
  const count = getBannedCount(round)
  const availableLetters = [...ALL_LETTERS]
  const banned: string[] = []

  const minVowelsRemaining = 2

  while (banned.length < count && availableLetters.length > 0) {
    const availableVowels = availableLetters.filter((l) => VOWELS.includes(l))
    const currentVowelsRemaining = availableVowels.length

    let candidatePool: string[]
    if (currentVowelsRemaining <= minVowelsRemaining) {
      candidatePool = availableLetters.filter((l) => !VOWELS.includes(l))
    } else {
      candidatePool = availableLetters
    }

    if (candidatePool.length === 0) {
      break
    }

    const notPreviousBanned = candidatePool.filter((l) => !previousBanned.includes(l))
    const pool = notPreviousBanned.length > 0 ? notPreviousBanned : candidatePool

    const randomIndex = Math.floor(Math.random() * pool.length)
    const selected = pool[randomIndex] as string

    banned.push(selected)

    const idx = availableLetters.indexOf(selected)
    if (idx > -1) {
      availableLetters.splice(idx, 1)
    }
  }

  return banned
}

/**
 * Check if a word contains any banned letters (case-insensitive)
 */
export function containsBannedLetter(word: string, bannedLetters: string[]): boolean {
  const upperWord = word.toUpperCase()
  return bannedLetters.some((letter) => upperWord.includes(letter))
}
