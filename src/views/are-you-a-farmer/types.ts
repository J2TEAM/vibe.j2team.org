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
  hasBug: boolean // TÍNH NĂNG MỚI: Bị sâu ăn
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
  type: 'harvest' | 'water' | 'earn'
  targetId?: string
  target: number
  progress: number
  reward: number
  isClaimed: boolean
}
