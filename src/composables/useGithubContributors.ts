import { shallowRef, ref } from 'vue'

export interface GitHubContributor {
  login: string
  avatar_url: string
  contributions: number
}

const CACHE_KEY = 'vibe-github-contributors'
const CACHE_TTL_MS = 6 * 60 * 60 * 1000 // 6 hours
const REPO = 'J2TEAM/vibe.j2team.org'

interface CachedData {
  timestamp: number
  contributors: GitHubContributor[]
}

function readCache(): GitHubContributor[] | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const cached: CachedData = JSON.parse(raw)
    if (Date.now() - cached.timestamp > CACHE_TTL_MS) return null
    return cached.contributors
  } catch {
    return null
  }
}

function writeCache(contributors: GitHubContributor[]) {
  try {
    const data: CachedData = { timestamp: Date.now(), contributors }
    localStorage.setItem(CACHE_KEY, JSON.stringify(data))
  } catch {
    // localStorage full or unavailable — silently ignore
  }
}

// Module-level deduplication
let _fetchPromise: Promise<GitHubContributor[]> | null = null

async function fetchAllContributors(): Promise<GitHubContributor[]> {
  const cached = readCache()
  if (cached) return cached

  if (_fetchPromise) return _fetchPromise

  _fetchPromise = (async () => {
    const all: GitHubContributor[] = []
    let page = 1

    // GitHub API paginates at 100 per page
    while (true) {
      const res = await fetch(
        `https://api.github.com/repos/${REPO}/contributors?per_page=100&page=${page}`,
        { headers: { Accept: 'application/vnd.github.v3+json' } },
      )

      if (!res.ok) {
        // Rate limited or other error — return what we have
        console.warn(`[useGithubContributors] GitHub API ${res.status}: ${res.statusText}`)
        break
      }

      const data: GitHubContributor[] = await res.json()
      if (data.length === 0) break

      all.push(...data)

      // If less than 100 results, we've reached the last page
      if (data.length < 100) break
      page++
    }

    if (all.length > 0) {
      writeCache(all)
    }

    return all
  })()

  _fetchPromise.catch(() => {
    _fetchPromise = null // allow retry on next call
  })

  return _fetchPromise
}

export function useGithubContributors() {
  const contributors = shallowRef<GitHubContributor[]>([])
  const isLoading = ref(true)

  // Try cache synchronously first for instant render
  const cached = readCache()
  if (cached) {
    contributors.value = cached
    isLoading.value = false
  }

  // Always fetch (will return cache if still valid)
  fetchAllContributors()
    .then((data) => {
      contributors.value = data
    })
    .catch((err) => {
      console.warn('[useGithubContributors] Failed to fetch:', err)
    })
    .finally(() => {
      isLoading.value = false
    })

  return { contributors, isLoading }
}
