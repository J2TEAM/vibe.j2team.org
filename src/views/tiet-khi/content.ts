// Lazy-load each solar term's HTML content (24 files, ~896 kB total).
// Uses import.meta.glob() so Vite splits each term into its own chunk,
// only fetched when the user clicks to view details. Cached after first load.
import { termFileMap } from './data/termFileMap'

const termModules = import.meta.glob<{ [key: string]: string }>('./terms/*.ts')

const cache = new Map<string, string>()

export async function getTermContent(termName: string): Promise<string | null> {
  if (cache.has(termName)) return cache.get(termName)!

  const fileName = termFileMap[termName]
  if (!fileName) return null

  const modulePath = `./terms/${fileName}.ts`
  const loader = termModules[modulePath]
  if (!loader) return null

  try {
    const mod = await loader()
    const content = mod[fileName]
    if (content) cache.set(termName, content)
    return content ?? null
  } catch (err) {
    console.error(`Lỗi tải nội dung ${termName}:`, err)
    return null
  }
}
