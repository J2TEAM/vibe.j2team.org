export type CategoryId =
  | 'game'
  | 'tool'
  | 'creative'
  | 'fun'
  | 'learn'
  | 'health'
  | 'finance'
  | 'spiritual'
  | 'connect'
  | 'other'

export interface Category {
  readonly id: CategoryId
  readonly label: string
  readonly icon: string
  readonly description: string
}

export const categories: readonly Category[] = [
  {
    id: 'game',
    label: 'Game',
    icon: 'lucide:gamepad-2',
    description: 'Game giải trí, thử thách, đối kháng, puzzle...',
  },
  {
    id: 'fun',
    label: 'Giải trí',
    icon: 'lucide:party-popper',
    description: 'Ứng dụng vui vẻ, hài hước, giải trí nhẹ nhàng...',
  },
  {
    id: 'tool',
    label: 'Công cụ',
    icon: 'lucide:wrench',
    description: 'Tiện ích lập trình, chuyển đổi, xử lý dữ liệu, generator...',
  },
  {
    id: 'learn',
    label: 'Học tập & Năng suất',
    icon: 'lucide:graduation-cap',
    description: 'Flashcard, ngoại ngữ, toán/logic, quản lý thời gian...',
  },
  {
    id: 'spiritual',
    label: 'Tâm linh',
    icon: 'lucide:sparkles',
    description: 'Tử vi, phong thủy, tarot, cung hoàng đạo, ngũ hành...',
  },
  {
    id: 'creative',
    label: 'Sáng tạo & Nghệ thuật',
    icon: 'lucide:palette',
    description: 'Làm nhạc, vẽ pixel art, tạo thơ/lyrics, thiết kế màu sắc...',
  },
  {
    id: 'connect',
    label: 'Xã hội & Kết nối',
    icon: 'lucide:users',
    description: 'Chat, quiz nhiều người, phòng ảo, chia sẻ ẩn danh, cộng tác...',
  },
  {
    id: 'health',
    label: 'Sức khỏe & Lối sống',
    icon: 'lucide:heart-pulse',
    description: 'Tracker nước uống, bài tập tại nhà, dinh dưỡng, giấc ngủ...',
  },
  {
    id: 'finance',
    label: 'Tài chính',
    icon: 'lucide:wallet',
    description: 'Chia bill nhóm, tracker chi tiêu, tính lãi suất, đổi tiền...',
  },
  {
    id: 'other',
    label: 'Khác',
    icon: 'lucide:layout-grid',
    description: 'Những thứ không fit vào đâu cả — hãy sáng tạo theo ý bạn!',
  },
]

const categoryLabelMap = Object.fromEntries(categories.map((c) => [c.id, c.label]))
const categoryIconMap = Object.fromEntries(categories.map((c) => [c.id, c.icon]))

export function getCategoryLabel(id: CategoryId): string {
  return categoryLabelMap[id] ?? id
}

export function getCategoryIcon(id: CategoryId): string {
  return categoryIconMap[id] ?? 'lucide:layout-grid'
}
