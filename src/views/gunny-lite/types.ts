// ─── Weapon ────────────────────────────────────────────────────────────────

export type WeaponId = 'grenade' | 'brick' | 'lightning' | 'dart' | 'fridge'

export interface Weapon {
  id: WeaponId
  name: string
  emoji: string
  baseDamage: number
  minAngle: number // degrees
  maxAngle: number
  explosionRadius: number
  delayBase: number
  /** How many projectiles normally (1, or 3 for trident effect) */
  projectileCount: number
}

// ─── Character ─────────────────────────────────────────────────────────────

export type CharacterBuild = 'cannon' | 'tank' | 'agile' | 'lucky' | 'custom'

export interface CharacterStats {
  atk: number // Tấn công
  def: number // Phòng thủ
  agi: number // Nhanh nhẹn
  lck: number // May mắn
  armor: number // Hộ giáp (from equipment)
  maxHp: number
}

export interface CharacterPreset {
  emoji: string
  name: string
  description: string
  stats: CharacterStats
}

export interface Character {
  id: number
  name: string
  build: CharacterBuild
  color: string // canvas fill color (kept for HP bar tint)
  emoji: string // animal emotion character
  stats: CharacterStats
  hp: number
  maxHp: number
  stamina: number
  maxStamina: number
  /** Accumulated delay points — lower = next to act */
  delayAccum: number
  weapon: Weapon
  x: number
  y: number
  facingRight: boolean
  isAI: boolean
  /** Currently falling? */
  isFalling: boolean
  fallVy: number
  /** Alive? */
  alive: boolean
}

// ─── Projectile ────────────────────────────────────────────────────────────

export interface Projectile {
  x: number
  y: number
  vx: number
  vy: number
  ownerId: number
  weapon: Weapon
  buffCoeff: number // 1.0 = no buff
  /** extra projectile spread for trident (radians offset) */
  spreadOffset: number
  active: boolean
  isTeleport: boolean
}

// ─── Buff / Item ───────────────────────────────────────────────────────────

export type BuffId =
  | 'dmg10'
  | 'dmg20'
  | 'dmg30'
  | 'dmg40'
  | 'dmg50'
  | 'extra1'
  | 'trident'
  | 'teleport'

export interface BuffItem {
  id: BuffId
  name: string
  description: string
  staminaCost: number
  delayAdd: number
  /** damage multiplier (1.0 = no change) */
  damageMultiplier: number
  /** extra shots count (0 = none) */
  extraShots: number
  isTrident: boolean
  isTeleport: boolean
}

// ─── Wind ──────────────────────────────────────────────────────────────────

export interface Wind {
  /** positive = right, negative = left */
  value: number
  /** display animation trigger */
  changed: boolean
}

// ─── Turn State ────────────────────────────────────────────────────────────

export type TurnPhase =
  | 'buff_select' // choosing buffs
  | 'aiming' // adjusting angle + power
  | 'firing' // projectile in air
  | 'resolving' // gravity/fall settling
  | 'ai_thinking' // AI computing shot
  | 'ai_aiming' // AI adjusting angle/power (animated)

export interface TurnState {
  activeCharId: number
  phase: TurnPhase
  timeLeft: number // seconds
  angle: number // degrees (0 = horizontal right)
  power: number // 0–100
  powerCharging: boolean
  selectedBuffs: BuffId[]
  activeBuffCoeff: number
  activeShotCount: number
  isTrident: boolean
  hasTeleport: boolean
  /** last angle, for HUD reference marker */
  lastAngle: number | null
}

// ─── Explosion ─────────────────────────────────────────────────────────────

export interface Explosion {
  x: number
  y: number
  radius: number
  /** animation progress 0–1 */
  progress: number
}

// ─── Damage Event ──────────────────────────────────────────────────────────

export interface DamageEvent {
  targetId: number
  damage: number
  isCrit: boolean
  x: number
  y: number
  /** display timer countdown */
  ttl: number
}

// ─── Game Screen ───────────────────────────────────────────────────────────

export type GameScreen = 'menu' | 'weapon_select' | 'playing' | 'result'

// ─── Map / Terrain ─────────────────────────────────────────────────────────

export type MapId = 'valley' | 'castle' | 'island'

export interface GameMap {
  id: MapId
  name: string
  width: number
  height: number
  skyColor: string
  groundColor: string
  groundPattern: 'hills' | 'flat' | 'pillars'
}

// ─── Game Result ───────────────────────────────────────────────────────────

export interface GameResult {
  winnerId: number | null // null = draw
  winnerName: string | null
  turns: number
}
