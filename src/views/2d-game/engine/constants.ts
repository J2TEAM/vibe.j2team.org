// Game constants - Single source of truth for all magic numbers
export const CANVAS_WIDTH = 960
export const CANVAS_HEIGHT = 540
export const GRAVITY = 0.5
export const MAP_WIDTH = 3200
export const GROUND_Y = CANVAS_HEIGHT - 48

// Player defaults
export const PLAYER_WIDTH = 28
export const PLAYER_HEIGHT = 40
export const PLAYER_BASE_SPEED = 3.5
export const PLAYER_JUMP_POWER = -10
export const PLAYER_MAX_HP = 100
export const PLAYER_MAX_MP = 60
export const PLAYER_BASE_ATK = 15
export const PLAYER_MANA_REGEN = 0.02
export const PLAYER_BASE_CRIT = 5
export const PLAYER_SPAWN_X = 100
export const PLAYER_SPAWN_OFFSET_Y = 100 // y = H - this
export const PLAYER_SPAWN_INVINCIBLE = 180 // frames of invincibility on spawn/reset

// Physics
export const FRICTION = 0.85
export const MAX_FALL_SPEED = 12
export const MAX_JUMPS = 2

// Combat
export const INVINCIBLE_FRAMES = 30
export const DASH_INVINCIBLE_FRAMES = 15
export const HURT_TIMER_FRAMES = 15
export const MINOR_HURT_TIMER = 10 // shorter stun for thorns/projectile
export const CRIT_MULT_DEFAULT = 1.8
export const CRIT_MULT_BURST = 2.2
export const LIFESTEAL_PERCENT = 0.08
export const THORNS_PERCENT = 0.2
export const LIGHTNING_CHANCE = 0.15
export const LIGHTNING_MULT = 0.4
export const MANA_SHIELD_REDUCTION = 0.1
export const MANA_SHIELD_COST_MULT = 0.5 // MP cost multiplier for absorbed damage
export const SHIELD_DAMAGE_MULT = 0.3 // damage multiplier when shield active
export const KNOCKBACK_VX = 5 // horizontal knockback speed
export const KNOCKBACK_VY = -4 // vertical knockback speed
export const MONSTER_ATTACK_TIMER = 20 // frames for monster attack animation
export const MONSTER_ATTACK_COOLDOWN = 60 // frames between monster attacks
export const MONSTER_HIT_KNOCKBACK = 4 // knockback speed when monster is hit
export const SCORE_COMBO_SCALE = 0.1 // score bonus per combo hit
export const ATTACK_TIMER = 18 // frames for player attack animation
export const ATTACK_COOLDOWN_BASE = 25 // base attack cooldown
export const ATTACK_COOLDOWN_MIN = 10 // minimum attack cooldown
export const ATTACK_HITBOX_PAD_Y = 4 // attack hitbox Y padding
export const ATTACK_HITBOX_PAD_H = 8 // attack hitbox height padding
export const DAMAGE_LEVEL_SCALE = 2 // damage bonus per level
export const DAMAGE_ATK_BOOST_MULT = 5 // damage multiplier for atk boost
export const DAMAGE_VARIANCE = 5 // random damage variance
export const SPEED_BOOST_MULT = 0.5 // speed boost effect multiplier
export const EFFECT_DECAY_RATE = 1 / 60 // per-frame effect decay (seconds)
export const CHEST_OPEN_TIMER = 60 // frames for chest open animation

// Dash
export const DASH_TIMER = 12 // frames for dash duration
export const DASH_SPEED = 12 // dash velocity
export const DASH_SLASH_DAMAGE = 20 // base dash slash damage
export const DASH_SLASH_LIFE = 15 // frames for dash slash projectile

// Heal skill
export const HEAL_BASE = 25
export const HEAL_LEVEL_SCALE = 3

// Spawning
export const MONSTER_SPAWN_INTERVAL = 180 // frames
export const INITIAL_SPAWN_RATE = 200 // initial frames between spawns
export const INITIAL_MAX_MONSTERS = 5
export const MAX_MAX_MONSTERS = 12 // cap for max monsters
export const MIN_SPAWN_RATE = 60 // minimum spawn rate
export const SPAWN_RATE_DECREASE = 10 // spawn rate decrease per level
export const CHEST_SPAWN_INTERVAL = 600 // frames between chest spawns
export const CHEST_DROP_CHANCE = 0.2
export const WEAPON_DROP_CHANCE = 0.12
export const EQUIP_DROP_CHANCE = 0.18
export const CONSUMABLE_DROP_CHANCE = 0.15

// Consumables
export const INITIAL_HP_POTIONS = 3
export const INITIAL_MP_POTIONS = 2
export const HP_POTION_HEAL = 35
export const MP_POTION_HEAL = 30
export const HP_POTION_HEAL_CHEST = 30 // heal amount from chest item

// EXP
export const BASE_EXP_MAX = 50
export const EXP_GEM_BASE = 20
export const EXP_GEM_LEVEL_SCALE = 5

// Leveling
export const EXP_GROWTH = 1.5
export const LEVEL_HP_BONUS = 15
export const LEVEL_MP_BONUS = 8
export const LEVEL_ATK_BONUS = 2
export const LEVEL_HP_HEAL = 30 // HP healed on level up
export const LEVEL_MP_HEAL = 20 // MP healed on level up
export const LEVEL_SPEED_BONUS = 0.15

// Screen Shake & Hit-stop (keep values LOW to avoid feeling "frozen")
export const SHAKE_INTENSITY_HIT = 2
export const SHAKE_INTENSITY_CRIT = 4
export const SHAKE_INTENSITY_BOSS = 8
export const SHAKE_DECAY = 0.8
export const HITSTOP_FRAMES_NORMAL = 0 // no freeze on normal hits
export const HITSTOP_FRAMES_CRIT = 2 // tiny freeze on crit only
export const HITSTOP_FRAMES_BOSS_PHASE = 8 // brief freeze on boss phase change

// Combo System
export const COMBO_TIMEOUT = 120 // frames before combo resets
export const COMBO_DMG_SCALE = 0.05 // +5% per combo hit
export const COMBO_MAX_MULT = 2.0 // max 2x damage at high combo

// Boss Phases
export const BOSS_PHASE2_HP = 0.6 // enters phase 2 at 60% HP
export const BOSS_PHASE3_HP = 0.25 // enters phase 3 at 25% HP
export const BOSS_PHASE1_SPEED = 1.0
export const BOSS_PHASE2_SPEED = 1.4
export const BOSS_PHASE3_SPEED = 1.8
export const BOSS_PHASE1_COOLDOWN = 60
export const BOSS_PHASE2_COOLDOWN = 40
export const BOSS_PHASE3_COOLDOWN = 30

// Auto-save
export const AUTOSAVE_KEY = 'ninja_quest_save'
export const AUTOSAVE_INTERVAL = 900 // frames (~15s at 60fps)
