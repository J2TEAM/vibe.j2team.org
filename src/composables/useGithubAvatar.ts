const AVATAR_COLORS = [
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

const GITHUB_USERNAME_RE = /^[a-zA-Z0-9-]+$/
const GITHUB_URL_RE = /github\.com/i

export const isLikelyGitHubUsername = (name: string) => GITHUB_USERNAME_RE.test(name)
export const isGitHubUrl = (url: string) => GITHUB_URL_RE.test(url)

/**
 * Shared avatar URL cache — keyed by author name.
 * `string` = resolved GitHub URL, `null` = failed / not a GitHub username.
 * Shared across all AuthorAvatar instances to avoid duplicate refs and requests.
 */
const avatarCache = new Map<string, string | null>()

function resolveAvatarUrl(author: string): string | null {
  if (avatarCache.has(author)) return avatarCache.get(author)!
  const url = isLikelyGitHubUsername(author) ? `https://github.com/${author}.png` : null
  avatarCache.set(author, url)
  return url
}

function hashColor(author: string): string {
  let hash = 0
  for (let i = 0; i < author.length; i++) {
    hash = author.charCodeAt(i) + ((hash << 5) - hash)
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]!
}

const initialAvatarCache = new Map<string, string>()

/**
 * Generate a data-URL avatar with the author's initial on a colored background.
 * Uses an OffscreenCanvas (or regular canvas) and caches results.
 */
export function generateInitialAvatar(author: string, size = 200): string {
  const cached = initialAvatarCache.get(author)
  if (cached) return cached

  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = hashColor(author)
  ctx.fillRect(0, 0, size, size)
  ctx.fillStyle = '#ffffff'
  ctx.font = `bold ${size * 0.45}px sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(author.charAt(0).toUpperCase(), size / 2, size / 2)
  const dataUrl = canvas.toDataURL('image/png')
  initialAvatarCache.set(author, dataUrl)
  return dataUrl
}

/**
 * useGithubAvatar — returns GitHub avatar URL using the `.png` trick
 * (https://github.com/{username}.png) which avoids API calls and rate limits.
 *
 * Uses a shared module-level cache so that repeated calls for the same author
 * return the same resolved URL without creating extra reactive refs.
 *
 * For non-GitHub usernames or failed loads, falls back to a colored initial avatar.
 */
export function useGithubAvatar(author: string) {
  const avatarUrl = resolveAvatarUrl(author)

  function onAvatarError() {
    avatarCache.set(author, null)
  }

  return {
    avatarUrl,
    avatarColor: hashColor(author),
    initial: author.charAt(0).toUpperCase(),
    onAvatarError,
  }
}
