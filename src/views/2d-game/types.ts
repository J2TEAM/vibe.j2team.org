export interface Platform {
    x: number; y: number; w: number; h: number
    type: 'ground' | 'platform' | 'floating'
}

export interface Particle {
    x: number; y: number; vx: number; vy: number
    life: number; maxLife: number; color: string; size: number
}

export interface FloatingText {
    x: number; y: number; text: string; color: string
    life: number; vy: number; size: number
}

export type MonsterType = 'slime' | 'skeleton' | 'demon' | 'boss' | 'bat' | 'ghost'

export interface Monster {
    x: number; y: number; vx: number; vy: number
    w: number; h: number
    hp: number; maxHp: number
    type: MonsterType
    speed: number; damage: number
    exp: number; scoreValue: number
    onGround: boolean; facing: number
    animFrame: number; animTimer: number
    attackTimer: number; attackCooldown: number
    state: 'idle' | 'chase' | 'attack' | 'hurt'
    hurtTimer: number; color: string; dead: boolean
    flying: boolean  // NEW: flying monsters ignore gravity
}

export type WeaponType = 'sword' | 'dual_swords' | 'axe' | 'bow' | 'shuriken' | 'hammer'

export interface WeaponConfig {
    name: string
    damage: number
    range: number      // attack hitbox width
    speed: number      // attack cooldown reduction
    color: string
    icon: string
    description: string
}

export interface Player {
    x: number; y: number; vx: number; vy: number
    w: number; h: number
    speed: number; jumpPower: number
    onGround: boolean; facing: 1 | -1
    attacking: boolean; attackTimer: number
    attackCooldown: number; attackFrame: number
    invincible: number
    animFrame: number; animTimer: number
    state: 'idle' | 'run' | 'jump' | 'attack'
    baseAtk: number; atkBoost: number
    speedBoost: number; shield: number
    jumpCount: number       // NEW: for double jump
    maxJumps: number        // NEW: max jumps allowed
    weapon: WeaponType      // NEW: equipped weapon
}

export type ItemType = 'hp_potion' | 'atk_boost' | 'speed_boost' | 'shield' | 'exp_gem'
export type DropType = ItemType | WeaponType

export interface Chest {
    x: number; y: number; w: number; h: number
    opened: boolean; openTimer: number
    item: ItemType; animFrame: number
}

export interface WeaponDrop {
    x: number; y: number; vy: number
    w: number; h: number
    weapon: WeaponType
    life: number
    onGround: boolean
    animFrame: number
}

export interface ItemEffect {
    type: ItemType; duration: number; active: boolean
}

export type BiomeType = 'forest' | 'desert' | 'ice' | 'volcano'

export interface BiomeConfig {
    name: string
    skyColors: string[]
    groundColor: string; grassColor: string; grassColor2: string
    platformColor: string; platformTop: string
    treeColor: string; treeTrunk: string
    mountainColor: string
    particleColor: string
    moonColor: string
}

export interface LeaderboardEntry {
    name: string; score: number; level: number
    kills: number; date: string
}
