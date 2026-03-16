// Lazy-load the dictionary (~510 kB) via JSON fetch,
// only fetched when the user actually visits the Word Chain page. Cached after first load.
type WordData = Record<string, string[]>

let _data: WordData | null = null

async function loadData(): Promise<WordData> {
  if (_data) return _data
  const response = await fetch('/data/word-chain-king.json')
  _data = (await response.json()) as WordData
  return _data
}

function normalizeWord(word: string): string {
  return word.toLowerCase().trim().replace(/\s+/g, ' ')
}

function getLastSyllable(word: string): string {
  const parts = normalizeWord(word).split(' ')
  return parts[parts.length - 1] ?? ''
}

async function wordExistsInDict(word: string): Promise<boolean> {
  const data = await loadData()
  const normalized = normalizeWord(word)
  if (normalized in data) return true
  const parts = normalized.split(' ')
  if (parts.length >= 2) {
    const firstPart = parts.slice(0, -1).join(' ')
    const lastPart = parts[parts.length - 1] ?? ''
    const values = data[firstPart]
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

async function getChainableWords(word: string, usedWords?: Set<string>): Promise<string[]> {
  const data = await loadData()
  const lastSyllable = getLastSyllable(word)
  const results: string[] = []

  const directValues = data[lastSyllable]
  if (directValues) {
    for (const val of directValues) {
      const compound = normalizeWord(`${lastSyllable} ${val}`)
      if (!usedWords || !usedWords.has(compound)) {
        results.push(compound)
      }
    }
  }

  for (const key of Object.keys(data)) {
    if (key.startsWith(lastSyllable + ' ') || key.startsWith(lastSyllable + '-')) {
      const values = data[key]
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

async function botPickWord(previousWord: string, usedWords?: Set<string>): Promise<string | null> {
  const candidates = await getChainableWords(previousWord, usedWords)
  if (candidates.length === 0) return null
  const idx = Math.floor(Math.random() * candidates.length)
  return candidates[idx] ?? null
}

async function getRandomStartWord(usedWords?: Set<string>): Promise<string> {
  const data = await loadData()
  const keys = Object.keys(data)
  for (let attempt = 0; attempt < 50; attempt++) {
    const randomKey = keys[Math.floor(Math.random() * keys.length)] ?? 'an'
    const values = data[randomKey]
    if (!values || values.length === 0) continue
    const randomVal = values[Math.floor(Math.random() * values.length)] ?? values[0]
    const startWord = `${randomKey} ${randomVal}`
    if (usedWords && usedWords.has(normalizeWord(startWord))) continue
    const followUps = await getChainableWords(startWord, usedWords)
    if (followUps.length > 0) return startWord
  }
  return 'an khang'
}

export function useWordChain() {
  return {
    loadData,
    normalizeWord,
    getLastSyllable,
    wordExistsInDict,
    isValidChain,
    getChainableWords,
    botPickWord,
    getRandomStartWord,
  }
}
