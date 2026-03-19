export type TripType = 'friends' | 'family' | 'date' | 'solo' | 'team'

export const TRIP_TYPE_LABELS: Record<TripType, string> = {
  friends: 'Bạn bè',
  family: 'Gia đình',
  date: 'Hẹn hò',
  solo: 'Một mình',
  team: 'Nhóm / Team',
}

export const TRIP_TYPE_ICONS: Record<TripType, string> = {
  friends: 'lucide:users',
  family: 'lucide:home',
  date: 'lucide:heart',
  solo: 'lucide:user',
  team: 'lucide:briefcase',
}

export interface Member {
  id: string
  name: string
  avatar: string
}

export interface Activity {
  id: string
  time: string
  title: string
  location: string
  note: string
  icon: string
  done: boolean
}

export interface BudgetItem {
  id: string
  label: string
  amount: number
  paidBy: string
}

export interface ChecklistItem {
  id: string
  text: string
  checked: boolean
}

export interface TripPlan {
  id: string
  title: string
  description: string
  type: TripType
  date: string
  coverEmoji: string
  members: Member[]
  activities: Activity[]
  budget: BudgetItem[]
  checklist: ChecklistItem[]
  createdAt: number
}

export type AppView = 'list' | 'create' | 'detail'

export const ACTIVITY_ICONS: { icon: string; label: string }[] = [
  { icon: 'lucide:coffee', label: 'Cafe' },
  { icon: 'lucide:utensils', label: 'Ăn uống' },
  { icon: 'lucide:map-pin', label: 'Địa điểm' },
  { icon: 'lucide:camera', label: 'Chụp ảnh' },
  { icon: 'lucide:shopping-bag', label: 'Mua sắm' },
  { icon: 'lucide:music', label: 'Giải trí' },
  { icon: 'lucide:bike', label: 'Di chuyển' },
  { icon: 'lucide:tent', label: 'Cắm trại' },
  { icon: 'lucide:waves', label: 'Biển' },
  { icon: 'lucide:mountain', label: 'Núi' },
  { icon: 'lucide:gamepad-2', label: 'Chơi game' },
  { icon: 'lucide:sparkles', label: 'Khác' },
]

export const COVER_EMOJIS = [
  '🏖️',
  '🏕️',
  '🎢',
  '🎭',
  '🍕',
  '☕',
  '🎵',
  '🚗',
  '✈️',
  '🏔️',
  '🎯',
  '🎮',
  '🌸',
  '🌙',
  '🔥',
  '💫',
]
