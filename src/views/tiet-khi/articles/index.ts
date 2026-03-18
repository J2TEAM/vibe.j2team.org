// Lazy-load bài luận (articles) theo tiết khí.
// Sử dụng import.meta.glob để Vite tách mỗi article thành chunk riêng,
// chỉ tải khi người dùng mở tab "Khai tâm (Đọc sâu)".
import type { Article } from './types'
import { termFileMap } from '../data/termFileMap'

// Dùng negative pattern thay cho exclude (tương thích Vite 5+)
const articleModules = import.meta.glob<{ [key: string]: Article }>([
  './*.ts',
  '!./index.ts',
  '!./types.ts',
])

// Cache để không tải lại lần thứ 2
const cache = new Map<string, Article>()

/**
 * Tải lazy một bài luận theo tên tiết khí.
 * Trả về null nếu không tìm thấy.
 */
export async function getArticle(termName: string): Promise<Article | null> {
  if (cache.has(termName)) return cache.get(termName)!

  const fileName = termFileMap[termName]
  if (!fileName) return null

  const modulePath = `./${fileName}.ts`
  const loader = articleModules[modulePath]
  if (!loader) return null

  try {
    const mod = await loader()
    const exportKey = `${fileName}Article`
    const article = mod[exportKey]
    if (article) cache.set(termName, article)
    return article ?? null
  } catch (err) {
    console.error(`Lỗi tải bài luận ${termName}:`, err)
    return null
  }
}

export type { Article, ArticleSection } from './types'
