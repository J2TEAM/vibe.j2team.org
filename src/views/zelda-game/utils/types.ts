/** 2D vector */
export interface Vec2 {
  x: number
  y: number
}

/** Axis-Aligned Bounding Box */
export interface AABB {
  x: number
  y: number
  width: number
  height: number
}

/** Direction the entity is facing */
export type Direction = 'up' | 'down' | 'left' | 'right'

/** Game state machine states */
export type GameState =
  | 'loading'
  | 'start_screen'
  | 'playing'
  | 'paused'
  | 'game_over'
  | 'victory'
  | 'stage_transition'

/** Single tile in a tilemap */
export type TileType =
  | 'empty'
  | 'wall'
  | 'ground'
  | 'bush'
  | 'tree'
  | 'water'
  | 'chest'
  | 'gate'
  | 'pillar'

/** Tilemap definition */
export interface TileMap {
  width: number // tiles wide
  height: number // tiles tall
  tiles: TileType[][] // [row][col]
  theme?: 'forest' | 'bridge' | 'castle'
}

/** Base entity interface */
export interface Entity {
  position: Vec2
  size: Vec2
  velocity: Vec2
  direction: Direction
  active: boolean
}

/** Input state snapshot per frame */
export interface InputState {
  up: boolean
  down: boolean
  left: boolean
  right: boolean
  attack: boolean
  block: boolean
  ranged: boolean
  interact: boolean
  pause: boolean
  attackJustPressed: boolean
  blockJustPressed: boolean
  rangedJustPressed: boolean
  interactJustPressed: boolean
  pauseJustPressed: boolean
}

/** Sprite frame for animation */
export interface SpriteFrame {
  draw: (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    direction?: Direction,
  ) => void
}

/** Camera viewport */
export interface Viewport {
  x: number
  y: number
  width: number
  height: number
}

/** Named animation states */
export type AnimationState = 'idle' | 'walk' | 'attack' | 'hurt' | 'die'

/** Definition of a single animation sequence */
export interface AnimationDef {
  frames: SpriteFrame[]
  frameDuration: number // seconds per frame
  loop: boolean
}

/** Map of animation name → per-direction definitions */
export type AnimationMap = Record<string, Partial<Record<Direction, AnimationDef>>>

/** Cached sprite = offscreen canvas */
export type CachedSprite = HTMLCanvasElement

/** Enemy AI alert state machine */
export type AlertState = 'patrol' | 'alert' | 'chase'

/** Vision cone configuration */
export interface VisionConeConfig {
  range: number // pixels
  angleDeg: number // total cone angle in degrees
  checkInterval: number // frames between full checks
}

/** Patrol waypoints in world coordinates */
export type PatrolRoute = Vec2[]

/** Stage objective for tracking progress */
export interface StageObjective {
  id: string
  description: string
  completed: boolean
}

/** Stage phase state */
export type StageState = 'stealth' | 'combat' | 'completed'

// --- Combat Types ---

export type WeaponType = 'sword' | 'shield' | 'bow'

export type CombatState = 'idle' | 'attacking' | 'blocking' | 'shooting'

export interface Hitbox {
  aabb: AABB
  damage: number
  knockback: number
  source: 'player' | 'enemy'
}

export interface ProjectileSpawnRequest {
  x: number
  y: number
  dirX: number
  dirY: number
  damage: number
  speed: number
  source?: 'player' | 'enemy'
}

export interface Projectile {
  active: boolean
  x: number
  y: number
  dirX: number // normalized direction (float in [-1, 1])
  dirY: number
  speed: number
  damage: number
  size: number // hitbox size (square)
  source: 'player' | 'enemy'
}

export interface CombatResult {
  state: CombatState
  hitbox: Hitbox | null
  swingID: number
  projectileRequest: ProjectileSpawnRequest | null
  speedMultiplier: number
  damageReduction: number
  hitCenter?: { x: number; y: number }
}

// --- Stage 2 Types ---

/** Lynel boss phase based on HP thresholds */
export type LynelPhase = 'charge' | 'fire_breath' | 'berserk'

/** Lynel AI state machine */
export type LynelAIState =
  | 'idle'
  | 'pacing'
  | 'charge_windup'
  | 'charging'
  | 'stunned'
  | 'slashing'
  | 'fire_breathing'

/** Fire tile left by Lynel's fire breath */
export interface FireTile {
  x: number // world x
  y: number // world y
  timer: number // remaining seconds (starts at FIRE_TILE_DURATION)
}

/** Wave configuration for Stage 2 gauntlet */
export interface WaveConfig {
  bokoblins: number // melee enemy count
  archers: number // ranged enemy count
  triggerX: number // world X position that triggers this wave
}

/** Heart pickup item */
export interface HeartPickup {
  x: number
  y: number
  active: boolean
  floatTimer: number // for bobbing animation
}

// --- Stage 3 Types ---

/** Ganon phase based on HP thresholds */
export type GanonPhase = 'dark_sorcery' | 'teleportation' | 'calamity' | 'final_stand'

/** Ganon AI state machine states */
export type GanonAIState =
  | 'idle'
  | 'pacing'
  | 'casting_orbs'
  | 'teleporting'
  | 'dark_slash'
  | 'triple_orb'
  | 'ground_slam_charge'
  | 'ground_slam'
  | 'stunned'
  | 'summoning'

/** Destructible pillar in the castle arena */
export interface DestructiblePillar {
  col: number
  row: number
  destroyed: boolean
}

/** Dark energy orb projectile managed by Ganon */
export interface DarkOrb {
  x: number
  y: number
  dirX: number
  dirY: number
  speed: number
  homingTimer: number // seconds remaining for homing behavior
  active: boolean
  reflectable: boolean // can be shield-deflected back (false after reflection)
  reflectFlashTimer: number // seconds remaining for reflect flash visual (0 = no flash)
}

export interface DialogLine {
  text: string
  speaker?: string
  autoAdvanceDelay?: number // seconds to auto-advance; omit to require input
}

export interface HUDState {
  health: number
  maxHealth: number
  weapons: { sword: boolean; shield: boolean; bow: boolean }
  combatState: CombatState
  stageNumber: number
  swordCooldownRatio: number
  bowCooldownRatio: number
}

export interface VictoryStats {
  totalTime: number
  enemiesDefeated: number
  damageTaken: number
}

// --- Effects System ---

export interface Particle {
  active: boolean
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  size: number
  color: string
  gravity: number
  alpha: number
  decay: number
  shrink: number
  tag?: string
}

export interface ParticleEmitConfig {
  x: number
  y: number
  count: number
  speed: number
  spread?: number
  baseAngle?: number
  life: number
  size: number
  colors: string[]
  gravity?: number
  shrink?: number
  tag?: string
}

export type ScreenEffectType = 'freeze' | 'flash' | 'fade'

export interface ScreenEffect {
  type: ScreenEffectType
  timer: number
  duration: number
  color: string
  alpha: number
  phase: 'in' | 'out'
  onMidpoint?: () => void
  onComplete?: () => void
}

export interface DamagePopup {
  active: boolean
  x: number
  y: number
  vy: number
  text: string
  color: string
  alpha: number
  life: number
  maxLife: number
}
