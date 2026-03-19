import { ref } from 'vue'

/**
 * useGithubAvatar — fetches GitHub avatar for a given author username.
 *
 * Cache strategy:
 * - Avatar URLs are cached PERMANENTLY in localStorage under 'vibebook-github-avatars'.
 *   Once fetched, the same author will always show their cached avatar without re-fetching.
 * - GitHub API rate limit is shared across all instances via 'vibebook-rate-limit'.
 *   If the API returns 403/429, all instances skip fetching for the reset window (~1 hour).
 * - Non-GitHub usernames (containing special characters) are skipped silently.
 * - On network failure, silently falls back to the color+initial avatar.
 */

const AVATAR_CACHE_KEY = 'vibebook-github-avatars'
const RATE_LIMIT_KEY = 'vibebook-rate-limit'

function getAvatarCache(): Record<string, string> {
  try {
    const cached = localStorage.getItem(AVATAR_CACHE_KEY)
    return cached ? JSON.parse(cached) : {}
  } catch {
    return {}
  }
}

function setAvatarCache(cache: Record<string, string>) {
  localStorage.setItem(AVATAR_CACHE_KEY, JSON.stringify(cache))
}

function getRateLimitInfo(): { until: number } {
  try {
    const data = localStorage.getItem(RATE_LIMIT_KEY)
    return data ? JSON.parse(data) : { until: 0 }
  } catch {
    return { until: 0 }
  }
}

function setRateLimit(until: number) {
  localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify({ until }))
}

function isRateLimited(): boolean {
  const { until } = getRateLimitInfo()
  return Date.now() < until
}

export function useGithubAvatar(author: string) {
  const avatarUrl = ref<string | null>(null)

  async function fetchAvatar() {
    const cache = getAvatarCache()

    // Check cache first
    const cachedUrl = cache[author]
    if (cachedUrl) {
      avatarUrl.value = cachedUrl
      return
    }

    // Check rate limit
    if (isRateLimited()) {
      return
    }

    const isLikelyGitHubUsername = /^[a-zA-Z0-9-]+$/.test(author)
    if (!isLikelyGitHubUsername) return

    try {
      const res = await fetch(`https://api.github.com/users/${author}`)

      if (res.status === 403 || res.status === 429) {
        const resetTime = res.headers.get('X-RateLimit-Reset')
        const until = resetTime ? parseInt(resetTime) * 1000 : Date.now() + 60 * 60 * 1000
        setRateLimit(until)
        return
      }

      if (res.ok) {
        const data = await res.json()
        avatarUrl.value = data.avatar_url
        cache[author] = data.avatar_url
        setAvatarCache(cache)
      }
    } catch {
      // Silent fail
    }
  }

  const avatarColor = (() => {
    const colors = [
      '#f87171',
      '#fb923c',
      '#fbbf24',
      '#a3e635',
      '#34d399',
      '#22d3ee',
      '#60a5fa',
      '#818cf8',
      '#c084fc',
      '#f472b6',
    ]
    let hash = 0
    for (let i = 0; i < author.length; i++) {
      hash = author.charCodeAt(i) + ((hash << 5) - hash)
    }
    return colors[Math.abs(hash) % colors.length]
  })()

  const initial = author.charAt(0).toUpperCase()

  fetchAvatar()

  return {
    avatarUrl,
    avatarColor,
    initial,
  }
}
