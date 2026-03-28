import { ref } from 'vue'
import type { Country, Question } from '../types'

// REST Countries API response shape (partial)
interface RestCountry {
  name: { common: string }
  cca2: string
  region: string
  translations?: { vie?: { common?: string } }
}

const API_URL = 'https://restcountries.com/v3.1/all?fields=name,cca2,region,translations'
const FALLBACK_URL = '/vibe-flag/countries.json'

// Exclude non-standard / disputed entries with no flag on flagcdn
const EXCLUDED_CODES = new Set(['AQ', 'BQ', 'CW', 'GG', 'IM', 'JE', 'SX', 'XK'])

function mapApiResponse(data: RestCountry[]): Country[] {
  return data
    .filter((c) => c.cca2 && !EXCLUDED_CODES.has(c.cca2))
    .map((c) => ({
      code: c.cca2,
      name: c.name.common,
      nameVi: c.translations?.vie?.common ?? c.name.common,
      continent: c.region || 'Other',
    }))
    .sort((a, b) => a.name.localeCompare(b.name))
}

const countries = ref<Country[]>([])
const isLoaded = ref(false)
const dataSource = ref<'api' | 'local' | null>(null)

export function useCountries() {
  async function loadCountries() {
    if (isLoaded.value) return

    // 1️⃣ Try REST Countries API
    try {
      const res = await fetch(API_URL, { signal: AbortSignal.timeout(5000) })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data: RestCountry[] = await res.json()
      countries.value = mapApiResponse(data)
      dataSource.value = 'api'
      isLoaded.value = true
      return
    } catch {
      // API failed — fall through to local fallback
    }

    // 2️⃣ Fallback to bundled countries.json
    try {
      const res = await fetch(FALLBACK_URL)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      countries.value = await res.json()
      dataSource.value = 'local'
      isLoaded.value = true
    } catch (err) {
      console.error('[vibe-flag] Failed to load country data:', err)
    }
  }

  function shuffle<T>(arr: T[]): T[] {
    const a = [...arr]
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      const tmp = a[i] as T
      a[i] = a[j] as T
      a[j] = tmp
    }
    return a
  }

  function getRandomCountries(exclude: string[] = [], count = 3): Country[] {
    const pool = countries.value.filter((c) => !exclude.includes(c.code))
    return shuffle(pool).slice(0, count)
  }

  function generateQuestion(usedCodes: string[] = []): Question | null {
    const pool = countries.value.filter((c) => !usedCodes.includes(c.code))
    if (pool.length === 0) return null

    const correct = shuffle(pool)[0]
    if (!correct) return null
    const distractors = getRandomCountries([correct.code], 3).filter(
      (c): c is Country => c !== undefined,
    )
    const options = shuffle([correct, ...distractors])

    return { correct, options }
  }

  function getCountryFlagUrl(code: string, size: 'w320' | 'w640' | 'w1280' = 'w320'): string {
    return `https://flagcdn.com/${size}/${code.toLowerCase()}.png`
  }

  return {
    countries,
    isLoaded,
    dataSource,
    loadCountries,
    generateQuestion,
    getCountryFlagUrl,
    shuffle,
  }
}
