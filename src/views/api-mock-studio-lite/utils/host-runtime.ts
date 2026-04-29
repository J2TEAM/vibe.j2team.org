export const DEFAULT_BROWSER_BASE_PATH = '/api-mock-studio-lite/mock'

export function normalizeHostBasePath(rawPath: string, fallbackPath: string): string {
  const value = rawPath.trim()
  if (!value) {
    return fallbackPath
  }

  const withLeadingSlash = value.startsWith('/') ? value : `/${value}`
  const noTrailingSlash = withLeadingSlash.replace(/\/+$/g, '')
  return noTrailingSlash || fallbackPath
}