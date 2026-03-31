import type { CategoryId } from '@/data/categories'
import type { PageInfo } from '@/types/page'
import type { AuthorPageData } from '@/data/authors'
import { getCategoryLabel, getCategoryIcon } from '@/data/categories'

export interface Badge {
  readonly id: string
  readonly label: string
  readonly icon: string
  readonly description: string
}

export interface CategoryBreakdown {
  readonly id: CategoryId
  readonly label: string
  readonly icon: string
  readonly count: number
}

function buildCategoryCounts(apps: PageInfo[]): Map<CategoryId, number> {
  const counts = new Map<CategoryId, number>()
  for (const app of apps) {
    if (app.category) counts.set(app.category, (counts.get(app.category) ?? 0) + 1)
  }
  return counts
}

const badgeDefinitions: ReadonlyArray<{
  badge: Badge
  check: (author: AuthorPageData) => boolean
}> = [
  {
    badge: {
      id: 'pioneer',
      label: 'Tiên phong',
      icon: 'lucide:rocket',
      description: 'Tạo ứng dụng đầu tiên trên vibe',
    },
    check: (a) => a.apps.length >= 1,
  },
  {
    badge: {
      id: 'five-apps',
      label: '5 ứng dụng',
      icon: 'lucide:flame',
      description: 'Đạt mốc 5 ứng dụng',
    },
    check: (a) => a.apps.length >= 5,
  },
  {
    badge: {
      id: 'ten-apps',
      label: '10 ứng dụng',
      icon: 'lucide:zap',
      description: 'Đạt mốc 10 ứng dụng',
    },
    check: (a) => a.apps.length >= 10,
  },
  {
    badge: {
      id: 'prolific',
      label: 'Xuất sắc',
      icon: 'lucide:crown',
      description: 'Lọt top 10 bảng xếp hạng',
    },
    check: (a) => a.rank !== undefined && a.rank <= 10,
  },
  {
    badge: {
      id: 'specialist',
      label: 'Chuyên gia',
      icon: 'lucide:target',
      description: 'Có 3+ ứng dụng trong một thể loại',
    },
    check: (a) => Array.from(buildCategoryCounts(a.apps).values()).some((c) => c >= 3),
  },
  {
    badge: {
      id: 'diversified',
      label: 'Đa dạng',
      icon: 'lucide:compass',
      description: 'Phát triển ứng dụng ở 5+ thể loại',
    },
    check: (a) => a.categories.length >= 5,
  },
]

export function getAuthorBadges(author: AuthorPageData): Badge[] {
  return badgeDefinitions.filter(({ check }) => check(author)).map(({ badge }) => badge)
}

export function getCategoryBreakdown(author: AuthorPageData): CategoryBreakdown[] {
  return Array.from(buildCategoryCounts(author.apps).entries())
    .map(([id, count]) => ({
      id,
      label: getCategoryLabel(id),
      icon: getCategoryIcon(id),
      count,
    }))
    .sort((a, b) => b.count - a.count)
}
