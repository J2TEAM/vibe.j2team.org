export interface FoodItem {
  name: string
  group: FoodGroup
  gi: number
  carbs: number // per serving
  serving: number // gram
  alt: string // alternative food name
}

export type FoodGroup =
  | 'tinh-bot'
  | 'trai-cay'
  | 'rau-cu'
  | 'dau-hat'
  | 'sua'
  | 'do-uong'
  | 'gia-vi'
  | 'banh-keo'
  | 'thit-ca'

export interface FoodGroupInfo {
  key: FoodGroup
  label: string
  icon: string
}

export const FOOD_GROUPS: FoodGroupInfo[] = [
  { key: 'tinh-bot', label: 'Tinh bột', icon: 'lucide:wheat' },
  { key: 'trai-cay', label: 'Trái cây', icon: 'lucide:apple' },
  { key: 'rau-cu', label: 'Rau củ', icon: 'lucide:carrot' },
  { key: 'dau-hat', label: 'Đậu & Hạt', icon: 'lucide:bean' },
  { key: 'sua', label: 'Sữa', icon: 'lucide:milk' },
  { key: 'do-uong', label: 'Đồ uống', icon: 'lucide:cup-soda' },
  { key: 'gia-vi', label: 'Gia vị', icon: 'lucide:flame' },
  { key: 'banh-keo', label: 'Bánh kẹo', icon: 'lucide:cake-slice' },
  { key: 'thit-ca', label: 'Thịt & Cá', icon: 'lucide:drumstick' },
]

export type GILevel = 'low' | 'medium' | 'high'

export function getGILevel(gi: number): GILevel {
  if (gi <= 55) return 'low'
  if (gi <= 69) return 'medium'
  return 'high'
}

export function getGIColor(gi: number): string {
  if (gi <= 55) return '#22c55e'
  if (gi <= 69) return '#FFB830'
  return '#FF6B4A'
}

export function getGILabel(gi: number): string {
  if (gi <= 55) return 'Thấp'
  if (gi <= 69) return 'Trung bình'
  return 'Cao'
}

export function calcGL(gi: number, carbsPerServing: number): number {
  return Math.round((gi * carbsPerServing) / 100)
}

export function getGLLabel(gl: number): string {
  if (gl <= 10) return 'Thấp'
  if (gl <= 19) return 'Trung bình'
  return 'Cao'
}

export function getGLColor(gl: number): string {
  if (gl <= 10) return '#22c55e'
  if (gl <= 19) return '#FFB830'
  return '#FF6B4A'
}
