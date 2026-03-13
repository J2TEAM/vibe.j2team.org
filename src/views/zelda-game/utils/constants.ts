// --- Grid & Tile ---
export const TILE_SIZE = 32 // pixels per tile
export const MAP_COLS = 35 // expanded from 25; map can be larger than viewport — camera scrolls
export const MAP_ROWS = 28 // expanded from 19

// --- Canvas ---
export const CANVAS_WIDTH = 800 // viewport width (px); map may be larger — camera scrolls
export const CANVAS_HEIGHT = 608 // viewport height (px); map may be larger — camera scrolls

// --- Physics ---
export const PLAYER_SPEED = 120 // pixels/second
export const ENEMY_SPEED = 60 // pixels/second

// --- Colors (must match src/assets/main.css @theme tokens) ---
export const COLORS = {
  bgDeep: '#0F1923',
  bgSurface: '#162232',
  bgElevated: '#1E2F42',
  accentCoral: '#FF6B4A',
  accentAmber: '#FFB830',
  accentSky: '#38BDF8',
  textPrimary: '#F0EDE6',
  textSecondary: '#8B9DB5',
  // Game-specific
  ground: '#4A7A3B',
  wall: '#5C4033',
  tree: '#2D5A1E',
  bush: '#3D8B2F',
  water: '#2563EB',
  chest: '#D4A017',
  gate: '#6B7280',
  enemyRed: '#DC2626',
  heartRed: '#EF4444',
  heartEmpty: '#374151',
} as const

// --- Player ---
export const PLAYER_SIZE = 28 // px (fits within 32px tile)
export const PLAYER_MAX_HEALTH = 3 // hearts (Stage 1)
export const PLAYER_INVULN_DURATION = 1.0 // seconds of i-frames
export const PLAYER_BLINK_RATE = 0.1 // seconds per blink toggle
export const SPRITE_SIZE = 32 // px (sprite canvas size)
export const WALK_FRAME_DURATION = 0.15 // seconds per walk frame

// --- Enemy ---
export const ENEMY_SIZE = 28 // px collision box
export const ENEMY_SPRITE_SIZE = 32 // px render size

// --- Vision & Stealth ---
export const VISION_RANGE = 5 * TILE_SIZE // 160px (5 tiles)
export const VISION_ANGLE_DEG = 60 // total cone width
export const VISION_HALF_ANGLE_RAD = Math.PI / 6 // 30° half-width
export const ALERT_TRANSITION_TIME = 0.3 // seconds before chase
export const CHASE_TIMEOUT = 3.0 // seconds to lose player
export const VISION_CHECK_INTERVAL = 3 // check every N frames
export const BOKOBLIN_HP = 2 // health points
export const INTERACT_RADIUS = TILE_SIZE * 1.5 // 48px interaction range

// --- Patrol ---
/** [RED TEAM #11] Idle pause at waypoints before moving to next */
export const PATROL_PAUSE_TIME = 0.5 // seconds to idle at each waypoint

// --- Combat Constants ---
export const SWORD_DAMAGE = 1
export const SWORD_COOLDOWN = 0.5 // seconds
export const SWORD_SWING_DURATION = 0.25 // seconds (active hitbox window)
export const SWORD_RANGE = 1.5 * TILE_SIZE // ~48px, 1.5 tiles
export const SWORD_ARC_WIDTH = 1.0 * TILE_SIZE // width of arc hitbox

export const SHIELD_FLAT_BLOCK = 1 // flat damage reduction (blocks 1 point of damage)
export const SHIELD_SPEED_MULTIPLIER = 0.5 // 50% movement speed

export const BOW_DAMAGE = 1
export const BOW_COOLDOWN = 1.5 // seconds
export const BOW_SHOOT_DURATION = 0.3 // animation time before arrow spawns
export const ARROW_SPEED = 250 // pixels/second
export const ARROW_SIZE = 6 // pixels (projectile hitbox)

export const PLAYER_KNOCKBACK_FORCE = 20 // knockback on enemies when hit

// --- Effects ---
export const DAMAGE_FLASH_DURATION = 0.2 // seconds of red flash
export const DEATH_ANIM_DURATION = 0.5 // seconds of death animation

// --- Screen Transitions (Phase 3) ---
export const STAGE_FADE_HALF = 0.5 // seconds per fade half (in or out)
export const DIALOG_SLIDE_IN = 0.2 // seconds for dialog to slide up
export const DIALOG_SLIDE_OUT = 0.15 // seconds for dialog to slide down
export const BOSS_INTRO_DARKEN = 0.3 // seconds for boss intro screen darken
export const GAME_OVER_DESATURATE_TIME = 0.5 // seconds of increasing grayscale on death
export const GAME_OVER_FADE_TIME = 0.5 // seconds of fade-to-dark after desaturate
export const WAVE_FLASH_DURATION = 0.1 // seconds of white flash between waves
export const VICTORY_FLASH_DURATION = 0.3 // seconds of white flash on Ganon defeat

// ==================== STAGE 2 ====================

// --- Player Stage 2 ---
export const STAGE2_PLAYER_MAX_HEALTH = 5

// --- Lynel ---
export const LYNEL_HP = 10
export const LYNEL_SIZE = 40 // larger than Bokoblin
export const LYNEL_SPRITE_SIZE = 48
export const LYNEL_SPEED = 80 // pixels/sec (pacing)
export const LYNEL_BERSERK_SPEED = 120 // +50% speed

// Lynel Charge
export const LYNEL_CHARGE_WINDUP_P1 = 1.0 // seconds (Phase 1)
export const LYNEL_CHARGE_WINDUP_P2 = 0.7 // seconds (Phase 2+)
export const LYNEL_CHARGE_SPEED = 250 // pixels/sec
export const LYNEL_STUN_DURATION = 2.0 // seconds after hitting edge

// Lynel Attacks
export const LYNEL_SLASH_DAMAGE = 1
export const LYNEL_SLASH_RANGE = 56 // 1.75 tiles
export const LYNEL_BERSERK_DAMAGE = 2
export const LYNEL_SLASH_COOLDOWN = 1.0 // seconds between slashes

// Lynel Fire Breath
export const LYNEL_FIRE_CONE_RANGE = 5 * TILE_SIZE // 160px
export const LYNEL_FIRE_CONE_ANGLE = 60 // degrees
export const FIRE_TILE_DURATION = 2.0 // seconds fire lingers
export const FIRE_DAMAGE_PER_TICK = 1 // damage per 0.5s on fire
export const FIRE_TICK_INTERVAL = 0.5 // seconds between fire damage ticks

// Lynel Phase Thresholds (HP values)
export const LYNEL_PHASE2_HP = 6 // enters Phase 2 at 6 HP
export const LYNEL_PHASE3_HP = 3 // enters Phase 3 at 3 HP

// --- Bokoblin Archer ---
export const ARCHER_FIRE_INTERVAL = 2.0 // seconds between shots
export const ARCHER_ARROW_SPEED = 200 // pixels/sec
export const ARCHER_ARROW_DAMAGE = 1
export const ARCHER_DETECTION_RANGE = 8 * TILE_SIZE // 256px

// --- Wave System ---
export const WAVE_BREATHER_TIME = 2.0 // seconds between waves
export const HEART_HEAL_AMOUNT = 1
export const HEART_PICKUP_RADIUS = TILE_SIZE * 1.5 // 48px

// --- Boss Arena ---
export const BOSS_ARENA_LEFT = 38 * TILE_SIZE // world X where arena starts
export const BOSS_ARENA_RIGHT = 56 * TILE_SIZE // world X where arena ends

// ==================== STAGE 3 ====================

// --- Ganon Base Stats ---
export const GANON_HP = 20
export const GANON_SIZE = 40 // collision box (px) — same as Lynel
export const GANON_SPRITE_SIZE = 48 // render size (px)
export const GANON_SPEED = 50 // pacing speed (px/sec) — deliberately slow

// --- Ganon Phase HP Thresholds ---
// Phase transitions occur when HP drops to or below these values
export const GANON_PHASE2_HP = 14 // ≤14 HP → Phase 2: Teleportation
export const GANON_PHASE3_HP = 9 // ≤9 HP  → Phase 3: Calamity Unleashed
export const GANON_PHASE4_HP = 4 // ≤4 HP  → Phase 4: Final Stand

// --- Dark Orbs (Phase 1+) ---
export const DARK_ORB_COUNT = 3 // orbs spawned per cast
export const DARK_ORB_SPEED = 80 // movement speed (px/sec) — slow, dodge-able
export const DARK_ORB_FAST_SPEED = 120 // Phase 3+ speed (px/sec)
export const DARK_ORB_HOMING_DURATION = 3.0 // seconds orb tracks player before going straight
export const DARK_ORB_SIZE = 10 // hitbox size (px)
export const DARK_ORB_DAMAGE = 1 // damage to player on hit
export const DARK_ORB_REFLECT_DAMAGE = 1 // damage to Ganon when deflected back
export const DARK_ORB_CAST_COOLDOWN = 3.0 // seconds between orb casts
export const MAX_DARK_ORBS = 9 // cap active orbs (3 casts × 3 orbs)

// --- Teleportation (Phase 2+) ---
export const GANON_TELEPORT_DURATION = 1.5 // seconds Ganon is invisible/intangible
export const GANON_VULNERABLE_WINDOW = 2.0 // seconds of vulnerability after attack

// --- Dark Slash (Phase 2+) ---
export const GANON_DARK_SLASH_DAMAGE = 2 // damage per hit
export const GANON_DARK_SLASH_RANGE = 64 // reach in pixels (2 tiles)
export const GANON_DARK_SLASH_ARC = 120 // sweep angle in degrees (wide)
export const GANON_DARK_SLASH_DURATION = 0.3 // seconds for slash animation

// --- Triple Orb Burst (Phase 2+) ---
export const TRIPLE_ORB_SPEED = 150 // faster than homing orbs (px/sec)
export const TRIPLE_ORB_SPREAD = 30 // degrees between each orb in the spread

// --- Ground Slam (Phase 3+) ---
export const GROUND_SLAM_CHARGE_TIME = 1.5 // seconds to charge before slam
export const GROUND_SLAM_RADIUS = 128 // AoE damage radius (px) — 4 tiles
export const GROUND_SLAM_DAMAGE = 3 // heavy damage — nearly lethal
export const GROUND_SLAM_STUN_TIME = 3.0 // seconds Ganon is stunned after slam

// --- Final Stand Phase 4 ---
export const FINAL_STAND_STUN_TIME = 2.0 // shorter stun window in Phase 4
export const FINAL_STAND_CYCLE_SPEED = 1.2 // attack speed multiplier for Phase 4

// --- Minion Summoning (Phase 1) ---
export const MINION_SUMMON_INTERVAL = 6.0 // seconds between summon waves
export const MINION_COUNT = 2 // Bokoblins per summon wave (legacy, used as default)
export const MINION_RESUMMON_DELAY = 5.0 // delay before re-summoning after minions die

/** Per-phase minion configuration: [melee count, archer count] */
export const MINION_PHASE_CONFIG: Record<string, { melee: number; archers: number }> = {
  dark_sorcery: { melee: 2, archers: 0 },
  teleportation: { melee: 1, archers: 1 },
  calamity: { melee: 2, archers: 1 },
  final_stand: { melee: 2, archers: 1 },
}

// --- Pillar Destruction ---
export const PILLAR_SHOCKWAVE_RADIUS = 96 // visual shockwave radius (px) — 3 tiles

// --- Victory Sequence ---
export const VICTORY_SEQUENCE_DURATION = 3.0 // seconds for Ganon dissolve animation
export const CRYSTAL_SHATTER_DURATION = 1.5 // seconds for crystal break animation

// --- Camera ---
export const CAMERA_LERP_FACTOR = 0.12 // smooth follow factor (0.08 = sluggish, 0.20 = snappy)

// --- Haptic Feedback ---
export const HAPTIC_PLAYER_DAMAGE = 100 // ms
export const HAPTIC_BOSS_HIT = 50 // ms
export const HAPTIC_STAGE_CLEAR: number[] = [100, 50, 200, 50, 100] // pulse pattern
export const HAPTIC_GAME_OVER = 200 // ms

// --- Dev Flags ---
export const EFFECTS_DEBUG = false // set true to show pool usage overlay
export const DEBUG_OVERLAY = false // set true to show FPS counter and debug info panel

// --- Audio ---
export const MASTER_VOLUME = 0.3
export const SFX_VOLUME = 0.5
export const MUSIC_VOLUME = 0.2
export const MUSIC_BPM = 120

// --- HUD Constants ---
export const HUD_MARGIN_RATIO = 0.01 // of canvas width
export const HEART_SIZE_RATIO = 0.02 // of canvas width
export const HEART_SPACING = 2
export const WEAPON_ICON_SIZE_RATIO = 0.025 // of canvas width
export const WEAPON_ICON_SPACING = 4
export const HUD_FONT_SIZE_RATIO = 0.015 // of canvas width

// --- Effects ---
export const MAX_PARTICLES = 96
export const MAX_POPUPS = 16
export const HIT_FREEZE_FRAMES = 4
export const SCREEN_FLASH_DURATION = 0.15
export const SCREEN_FADE_DURATION = 0.5
export const POPUP_RISE_SPEED = 60
export const POPUP_LIFE = 0.6
export const POPUP_FONT_SIZE = 14

// Particle color palettes
export const SPARK_COLORS = ['#FFFFFF', '#FFE066', '#FFD700']
export const DUST_COLORS = ['#8B7355', '#A0926B', '#6B5B3D']
export const FIRE_COLORS = ['#FF6600', '#FF4400', '#FFAA00', '#FF8800']
export const HEAL_COLORS = ['#66FF66', '#44FF88', '#AAFFAA']
export const LEAF_COLORS = ['#4A7A3B', '#6B8E23', '#8FBC3B', '#9ACD32']
export const CASTLE_DUST_COLORS = ['#666666', '#888888', '#555555', '#777777']
export const REFLECT_COLORS = ['#38BDF8', '#FFFFFF', '#87CEEB', '#E0F0FF']

// --- Combat Feedback ---
export const HIT_SPARK_COUNT = 6
export const HIT_SPARK_SPEED = 100
export const HIT_SPARK_LIFE = 0.2
export const HIT_SPARK_SIZE = 3

export const DUST_COUNT = 4
export const DUST_SPEED = 30
export const DUST_LIFE = 0.3
export const DUST_SIZE = 2
export const DUST_GRAVITY = 80

export const PLAYER_DAMAGE_SHAKE_INTENSITY = 4
export const PLAYER_DAMAGE_SHAKE_DURATION = 0.2
export const BOSS_DAMAGE_SHAKE_INTENSITY = 2
export const BOSS_DAMAGE_SHAKE_DURATION = 0.15

export const BLOCK_SPARK_COUNT = 4
export const BLOCK_SPARK_SPEED = 60
export const BLOCK_SPARK_LIFE = 0.15
export const BLOCK_SPARK_SIZE = 2

// --- Phase 4: Particle Effects ---

// Lynel death burst
export const LYNEL_DEATH_PARTICLE_COUNT = 14
export const LYNEL_DEATH_PARTICLE_SPEED = 60
export const LYNEL_DEATH_PARTICLE_LIFE = 0.6
export const LYNEL_DEATH_PARTICLE_SIZE = 5

// Enemy spawn smoke
export const SPAWN_SMOKE_COUNT = 5
export const SPAWN_SMOKE_SPEED = 20
export const SPAWN_SMOKE_LIFE = 0.3
export const SPAWN_SMOKE_SIZE = 3

// Sword / arrow trails
export const SWORD_TRAIL_LIFE = 0.1
export const SWORD_TRAIL_SIZE = 2
export const ARROW_TRAIL_LIFE = 0.15
export const ARROW_TRAIL_SIZE = 1.5

// Ambient particles
export const AMBIENT_LEAF_COUNT = 12
export const AMBIENT_DUST_COUNT = 10
export const AMBIENT_DRIFT_SPEED = 15
export const POOL_HIGH_WATERMARK = 0.8 // skip low-priority emits when pool > 80% full

// Shield reflect sparkle
export const REFLECT_SPARK_COUNT = 8
export const REFLECT_SPARK_SPEED = 80
export const REFLECT_SPARK_LIFE = 0.25
export const REFLECT_SPARK_SIZE = 3

// Low-health pulse vignette
export const LOW_HEALTH_PULSE_FREQ = 1.0 // Hz
export const LOW_HEALTH_VIGNETTE_MAX = 0.3
