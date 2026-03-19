const LOVE_LETTERS = ['L', 'O', 'V', 'E', 'S'] as const

type LoveLetter = (typeof LOVE_LETTERS)[number]

type LetterCounts = Record<LoveLetter, number>

export const STEP_DELAY_MS = {
  input: 1500,
  count: 2000,
  initialSequence: 1500,
  combine: 1200,
  beforeResult: 1500,
} as const

export const buildLoveText = (maleName: string, femaleName: string): string => {
  return `${maleName.toUpperCase()} LOVES ${femaleName.toUpperCase()}`
}

export const countLoveLetters = (text: string): LetterCounts => {
  const counts: LetterCounts = { L: 0, O: 0, V: 0, E: 0, S: 0 }
  const upperText = text.toUpperCase().replace(/\s/g, '')

  LOVE_LETTERS.forEach((letter) => {
    const regex = new RegExp(letter, 'g')
    const match = upperText.match(regex)
    counts[letter] = match ? match.length : 0
  })

  return counts
}

export const formatCountSummary = (counts: LetterCounts): string => {
  return LOVE_LETTERS.map((letter) => `${letter}: ${counts[letter]}`).join(' | ')
}

export const buildCountDisplayItems = (counts: LetterCounts): string[] => {
  return LOVE_LETTERS.map((letter) => `${letter}: ${counts[letter]}`)
}

export const buildInitialSequence = (counts: LetterCounts): string => {
  return LOVE_LETTERS.map((letter) => counts[letter]).join('')
}

export const buildNextSequence = (sequence: string): string => {
  const digits = sequence.split('').map(Number)
  let newSequence = ''

  for (let index = 0; index < digits.length - 1; index++) {
    newSequence += (digits[index]! + digits[index + 1]!).toString()
  }

  return newSequence
}

export const extractPercentage = (sequence: string): number => {
  return parseInt(sequence.slice(0, 2), 10)
}
