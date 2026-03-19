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
