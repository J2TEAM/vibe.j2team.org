export interface Seed {
  id: string
  name: string
  cost: number
  reward: number
  growTime: number
  icon: string
}

export interface Plot {
  id: number
  seedId: string | null
  plantedAt: number | null
  watered: boolean
  isUnlocked: boolean
  unlockCost: number
  hasBug: boolean // Trạng thái bị sâu ăn
}

export interface Toast {
  id: number
  message: string
  type: 'success' | 'error' | 'info'
}

export interface Quest {
  id: string
  title: string
  description: string
  // TÍNH NĂNG MỚI: Thêm 'bug' vào type để làm nhiệm vụ diệt sâu
  type: 'harvest' | 'water' | 'earn' | 'bug'
  targetId?: string
  target: number
  progress: number
  reward: number
  isClaimed: boolean
}
