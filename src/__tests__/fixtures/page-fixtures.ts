import type { PageInfo } from '@/types/page'

export function makePageInfo(
  overrides: Partial<PageInfo> & Pick<PageInfo, 'path' | 'name' | 'author'>,
): PageInfo {
  return {
    description: 'Test description',
    category: 'game',
    ...overrides,
  }
}
