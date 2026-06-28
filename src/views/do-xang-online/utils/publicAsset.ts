export function publicAssetUrl(absolutePathFromRoot: string): string {
  const base = import.meta.env.BASE_URL
  const normalizedBase = base.endsWith('/') ? base : `${base}/`
  const path = absolutePathFromRoot.startsWith('/')
    ? absolutePathFromRoot.slice(1)
    : absolutePathFromRoot
  return `${normalizedBase}${path}`
}
