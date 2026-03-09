export type CategoryId = 'game' | 'tool' | 'fun' | 'learn' | 'spiritual' | 'connect' | 'other'

export interface Category {
  readonly id: CategoryId
  readonly label: string
}

export const categories: readonly Category[] = [
  { id: 'game', label: 'Game' },
  { id: 'tool', label: 'Công cụ' },
  { id: 'fun', label: 'Giải trí' },
  { id: 'learn', label: 'Học tập & Năng suất' },
  { id: 'spiritual', label: 'Tâm linh' },
  { id: 'connect', label: 'Kết nối' },
  { id: 'other', label: 'Khác' },
]

const categoryLabelMap = Object.fromEntries(categories.map((c) => [c.id, c.label]))

export function getCategoryLabel(id: CategoryId): string {
  return categoryLabelMap[id] ?? id
}
