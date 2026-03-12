export interface Platform {
  x: number
  y: number
  w: number
  h: number
  type: 'ground' | 'platform' | 'floating'
}

export interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  color: string
  size: number
}

export interface FloatingText {
  x: number
  y: number
  text: string
  color: string
  life: number
  vy: number
  size: number
}

export type MonsterType = 'slime' | 'skeleton' | 'demon' | 'boss' | 'bat' | 'ghost'

export interface Monster {
  x: number
  y: number
  vx: number
  vy: number
  w: number
  h: number
  hp: number
  maxHp: number
  type: MonsterType
  speed: number
  damage: number
  exp: number
  scoreValue: number
  onGround: boolean
  facing: number
  animFrame: number
  animTimer: number
  attackTimer: number
  attackCooldown: number
  state: 'idle' | 'chase' | 'attack' | 'hurt'
  hurtTimer: number
  color: string
  dead: boolean
  flying: boolean
}

export type WeaponType = 'sword' | 'dual_swords' | 'axe' | 'bow' | 'shuriken' | 'hammer'

export interface WeaponConfig {
  name: string
  damage: number
  range: number
  speed: number
  color: string
  icon: string
  description: string
}

// === PROJECTILE (mũi tên, phi tiêu, sóng xung kích) ===
export interface Projectile {
  x: number
  y: number
  vx: number
  vy: number
  w: number
  h: number
  damage: number
  life: number
  type: 'arrow' | 'shuriken_proj' | 'shockwave' | 'dash_slash' | 'ultimate'
  color: string
  rotation: number
  piercing: boolean
  hitTargets: Monster[]
}

// === SKILL SYSTEM ===
export type SkillType = 'dash' | 'heal' | 'ultimate'

export interface SkillConfig {
  name: string
  description: string
  manaCost: number
  cooldown: number // frames
  icon: string
  color: string
  key: string
}

// === EQUIPMENT SYSTEM ===
export type EquipSlot = 'head' | 'chest' | 'legs' | 'gloves' | 'boots' | 'accessory'
export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'

export type PassiveType =
  | 'lightning'
  | 'lifesteal'
  | 'thorns'
  | 'speed_aura'
  | 'mana_shield'
  | 'crit_burst'
  | 'none'

export interface EquipmentConfig {
  id: string
  uid: number // unique instance id for each drop
  name: string
  slot: EquipSlot
  rarity: Rarity
  icon: string
  level: number // 1-10
  stats: {
    hp?: number
    atk?: number
    def?: number
    speed?: number
    jumpPower?: number
    manaRegen?: number
    critChance?: number
  }
  passive: PassiveType
  passiveDesc?: string
  description: string
  color: string
}

export interface EquipmentDrop {
  x: number
  y: number
  vy: number
  w: number
  h: number
  equipment: EquipmentConfig
  life: number
  onGround: boolean
  animFrame: number
}

// === CONSUMABLE ITEMS ===
export type ConsumableType = 'hp_potion' | 'mp_potion' | 'exp_gem'

export interface ConsumableItem {
  type: ConsumableType
  count: number
}

// === PLAYER (extended) ===
export interface Player {
  x: number
  y: number
  vx: number
  vy: number
  w: number
  h: number
  speed: number
  jumpPower: number
  onGround: boolean
  facing: 1 | -1
  attacking: boolean
  attackTimer: number
  attackCooldown: number
  attackFrame: number
  invincible: number
  animFrame: number
  animTimer: number
  state: 'idle' | 'run' | 'jump' | 'attack'
  baseAtk: number
  atkBoost: number
  speedBoost: number
  shield: number
  jumpCount: number
  maxJumps: number
  weapon: WeaponType
  // Mana
  mp: number
  maxMp: number
  manaRegen: number
  // Skills cooldowns
  skillCooldowns: Record<SkillType, number>
  // Equipment
  equipment: Partial<Record<EquipSlot, EquipmentConfig | null>>
  // Defense from equipment
  defense: number
  // Crit
  critChance: number
  // Dash state
  dashing: boolean
  dashTimer: number
}

// === LEGACY (backward compat) ===
export type ItemType = 'hp_potion' | 'atk_boost' | 'speed_boost' | 'shield' | 'exp_gem'
export type DropType = ItemType | WeaponType

export interface Chest {
  x: number
  y: number
  w: number
  h: number
  opened: boolean
  openTimer: number
  item: ItemType
  animFrame: number
}

export interface WeaponDrop {
  x: number
  y: number
  vy: number
  w: number
  h: number
  weapon: WeaponType
  life: number
  onGround: boolean
  animFrame: number
}

export interface ItemEffect {
  type: ItemType
  duration: number
  active: boolean
}

export type BiomeType = 'forest' | 'desert' | 'ice' | 'volcano'

export interface BiomeConfig {
  name: string
  skyColors: string[]
  groundColor: string
  grassColor: string
  grassColor2: string
  platformColor: string
  platformTop: string
  treeColor: string
  treeTrunk: string
  mountainColor: string
  particleColor: string
  moonColor: string
}

export interface LeaderboardEntry {
  name: string
  score: number
  level: number
  kills: number
  date: string
}
