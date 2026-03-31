export type Rarity = 'white' | 'blue' | 'purple' | 'gold'
export type Rank = 'F' | 'E' | 'D' | 'C' | 'B' | 'A' | 'S' | 'SS'
export type QuestCategory =
  | 'study'
  | 'physical'
  | 'life'
  | 'mental'
  | 'social'
  | 'creative'
  | 'finance'
  | 'adventure'

export interface QuestTemplate {
  id: string
  name: string
  description: string
  category: QuestCategory
  icon: string
  baseExp: number
  baseGold: number
  baseDurationMinutes: number
  baseHpRestore: number
}

export interface Quest {
  uid: string
  templateId: string
  name: string
  description: string
  category: QuestCategory
  icon: string
  rarity: Rarity
  exp: number
  gold: number
  durationMinutes: number
  hpRestore: number
}

export interface ActiveQuest extends Quest {
  acceptedAt: number
  endTime: number
  isBoss: boolean
}

export interface PlayerState {
  hp: number
  maxHp: number
  exp: number
  gold: number
  rank: Rank
  completedCount: number
  skippedCount: number
  bossesDefeated: number
  expBoostCharges: number
  maxActiveQuests: number
  freeSkipCharges: number
  bigExpScrollCharges: number
  ssLastBossTriggerExp: number
  shopPurchases: Record<string, number>
}

export interface ShopItem {
  id: string
  name: string
  description: string
  price: number
  icon: string
  maxOwned?: number // optional purchase limit
  effect:
    | 'hp_potion'
    | 'exp_scroll'
    | 'dragon_heart'
    | 'quest_slot'
    | 'big_hp_potion'
    | 'gold_scroll'
    | 'free_skip'
    | 'big_exp_scroll'
    | 'big_gold'
    | 'time_extend'
    | 'warrior_gauntlet'
    | 'instant_exp'
}

export interface RarityConfig {
  label: string
  weight: number
  expMult: number
  goldMult: number
  timeMult: number
  hpRestoreMult: number
  borderClass: string
  bgClass: string
  textClass: string
  badgeClass: string
  shadowClass: string
  pinClass: string
}

export interface RankConfig {
  label: Rank
  minExp: number
  nextExp: number | null
  title: string
}

export interface Notification {
  id: string
  type: 'success' | 'fail' | 'warning' | 'boss' | 'levelup'
  message: string
}

export interface BossConfig {
  name: string
  description: string
  icon: string
  goldReward: number
  durationMinutes: number
  failHpLossPercent: number
}
