export type CategoryId = 'game' | 'tool' | 'fun' | 'learn' | 'spiritual' | 'connect' | 'other'

export interface Category {
  readonly id: CategoryId
  readonly label: string
  readonly icon: string
}

export const categories: readonly Category[] = [
  { id: 'game', label: 'Game', icon: 'lucide:gamepad-2' },
  { id: 'tool', label: 'Công cụ', icon: 'lucide:wrench' },
  { id: 'fun', label: 'Giải trí', icon: 'lucide:party-popper' },
  { id: 'learn', label: 'Học tập & Năng suất', icon: 'lucide:graduation-cap' },
  { id: 'spiritual', label: 'Tâm linh', icon: 'lucide:sparkles' },
  { id: 'connect', label: 'Kết nối', icon: 'lucide:users' },
  { id: 'other', label: 'Khác', icon: 'lucide:layout-grid' },
]

const categoryLabelMap = Object.fromEntries(categories.map((c) => [c.id, c.label]))
const categoryIconMap = Object.fromEntries(categories.map((c) => [c.id, c.icon]))

export function getCategoryLabel(id: CategoryId): string {
  return categoryLabelMap[id] ?? id
}

export function getCategoryIcon(id: CategoryId): string {
  return categoryIconMap[id] ?? 'lucide:layout-grid'
}
