export type WishRarity = 3 | 4 | 5
export type WishItemType = 'Nhân vật' | 'Vũ khí'
export type WishBannerKey = 'character' | 'weapon'

export interface WishItem {
  id: string
  name: string
  rarity: WishRarity
  type: WishItemType
  isRateUp: boolean
  visualSeed: number
}

export interface WishBannerInfo {
  key: WishBannerKey
  name: string
  title: string
  subtitle: string
  rateUp5Names: string[]
  rateUp4Names: string[]
}

export interface WishBannerPool {
  threeStarPool: readonly WishItem[]
  fourStarRateUpPool: readonly WishItem[]
  fourStarStandardPool: readonly WishItem[]
  fiveStarRateUpPool: readonly WishItem[]
  fiveStarStandardPool: readonly WishItem[]
}

export interface WishResult {
  rollNumber: number
  timestamp: number
  item: WishItem
  rarity: WishRarity
  isRateUp: boolean
  usedGuarantee5: boolean
  pityBefore5: number
  pityBefore4: number
}

export interface WishHistoryEntry {
  id: string
  rollNumber: number
  timestamp: number
  itemName: string
  rarity: WishRarity
  itemType: WishItemType
  isRateUp: boolean
  visualSeed: number
  pityBefore5: number
  pityBefore4: number
}

export interface WishStats {
  totalRolls: number
  total4Star: number
  total5Star: number
  total5StarRateUp: number
}

export interface WishState {
  pity5: number
  pity4: number
  guaranteedRateUp5: boolean
  stats: WishStats
  history: WishHistoryEntry[]
}

export type WishStateByBanner = Record<WishBannerKey, WishState>
