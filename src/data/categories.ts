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
