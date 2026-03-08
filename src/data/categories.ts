export interface Category {
  id: string
  label: string
}

export const categories: Category[] = [
  { id: 'game', label: 'Game' },
  { id: 'tool', label: 'Công cụ' },
  { id: 'fun', label: 'Giải trí' },
  { id: 'learn', label: 'Học tập & Năng suất' },
  { id: 'spiritual', label: 'Tâm linh' },
  { id: 'connect', label: 'Kết nối' },
]

const categoryLabelMap = Object.fromEntries(categories.map((c) => [c.id, c.label]))

export function getCategoryLabel(id: string): string {
  return categoryLabelMap[id] ?? id
}
