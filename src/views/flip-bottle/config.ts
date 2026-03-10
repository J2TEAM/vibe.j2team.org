/** Per-difficulty tuning values */
export interface DifficultyConfig {
  /** Bottom part density — higher = heavier bottom = easier to self-right */
  bottomDensity: number
  /** Air friction — higher = spin dies faster in air */
  frictionAir: number
  /** Base jump force (no charge) */
  forceBase: number
  /** Additional jump force at full charge */
  forceAdd: number
  /** Spin multiplier applied to spinSpeed */
  spinMult: number
  /** Angle tolerance (radians) for counting as "upright" */
  uprightTolerance: number
  /** Angle tolerance when giant */
  uprightToleranceGiant: number

  // ── Balance / auto-stabilize ──
  /** Landing stabilize torque */
  landTorque: number
  /** Landing stabilize torque when giant */
  landTorqueGiant: number
  /** Landing stabilize angle threshold */
  landThresh: number
  /** Angular damping when speed < 2 */
  landDampingSlow: number
  /** Angular damping when speed 2–5 */
  landDampingFast: number
  /** Whether air correction is enabled */
  airCorrectionEnabled: boolean
  /** Air correction torque */
  airTorque: number
  /** Air correction angle threshold */
  airThresh: number
  /** Air correction damping (0.99 = very gentle) */
  airDamping: number
  /** Max speed for air correction to activate */
  airCorrectionMaxSpeed: number
  /** Whether hard-mode skips stabilize above speed 3 */
  skipStabilizeAboveSpeed3: boolean

  // ── Item spawning ──
  /** Multiplier on random roll for obstacle type (lower = fewer hard obstacles) */
  obstacleRollMult: number
  /** Whether items always spawn */
  alwaysSpawnItems: boolean
  /** Replace bomb/freeze with shield */
  safeItems: boolean
}

export interface GameConfig {
  /** Finish line position for 2P mode */
  finishLineX: number
  /** Skill/buff duration in frames (60fps) */
  skillDuration: number
  /** Body friction on platforms */
  bodyFriction: number
  /** Respawn delay in ms */
  respawnDelay: number

  // ── Jump physics ──
  /** Base spin speed (rad/s) */
  spinBase: number
  /** Extra spin at full charge */
  spinCharge: number
  /** Giant force multiplier */
  giantForceMult: number
  /** Super jump force multiplier */
  superJumpMult: number

  // ── Auto-stabilize ──
  /** Max speed for strong (landing) stabilization */
  stabilizeSpeedMax: number
  /** Max speed for flying stabilization (between stabilizeSpeedMax and this) */
  flyingSpeedMax: number

  // ── Airplane obstacles ──
  /** Spawn chance per frame (0.005 = 0.5%) */
  planeSpawnChance: number
  /** Min speed of planes */
  planeSpeedMin: number
  /** Max additional random speed */
  planeSpeedRand: number
  /** Knockback force multiplier on hit */
  planeKnockback: number
  /** Angular disruption on hit */
  planeSpin: number
  /** Minimum Y so planes fly above platforms (higher = safer) */
  planeMinY: number

  /** Per-difficulty configs indexed 0=hard, 1=normal, 2=easy */
  difficulty: [DifficultyConfig, DifficultyConfig, DifficultyConfig]
}

export const DEFAULT_CONFIG: GameConfig = {
  finishLineX: 6000,
  skillDuration: 600,
  bodyFriction: 1.0,
  respawnDelay: 800,

  spinBase: 0.15,
  spinCharge: 0.25,
  giantForceMult: 4,
  superJumpMult: 1.4,

  stabilizeSpeedMax: 5.0,
  flyingSpeedMax: 15.0,

  planeSpawnChance: 0.002,
  planeSpeedMin: 3,
  planeSpeedRand: 3,
  planeKnockback: 0.02,
  planeSpin: 0.15,
  planeMinY: 150,

  difficulty: [
    // 0 = HARD
    {
      bottomDensity: 0.05,
      frictionAir: 0.005,
      forceBase: 0.28,
      forceAdd: 0.3,
      spinMult: 1.0,
      uprightTolerance: 0.6,
      uprightToleranceGiant: 1.2,
      landTorque: 0.015,
      landTorqueGiant: 0.04,
      landThresh: 1.0,
      landDampingSlow: 0.85,
      landDampingFast: 0.9,
      airCorrectionEnabled: false,
      airTorque: 0,
      airThresh: 0,
      airDamping: 1.0,
      airCorrectionMaxSpeed: 0,
      skipStabilizeAboveSpeed3: true,
      obstacleRollMult: 1.0,
      alwaysSpawnItems: false,
      safeItems: false,
    },
    // 1 = NORMAL
    {
      bottomDensity: 0.08,
      frictionAir: 0.008,
      forceBase: 0.35,
      forceAdd: 0.4,
      spinMult: 1.0,
      uprightTolerance: 1.2,
      uprightToleranceGiant: 1.5,
      landTorque: 0.025,
      landTorqueGiant: 0.06,
      landThresh: 2.0,
      landDampingSlow: 0.8,
      landDampingFast: 0.88,
      airCorrectionEnabled: true,
      airTorque: 0.002,
      airThresh: 1.2,
      airDamping: 0.99,
      airCorrectionMaxSpeed: 8.0,
      skipStabilizeAboveSpeed3: false,
      obstacleRollMult: 1.0,
      alwaysSpawnItems: false,
      safeItems: false,
    },
    // 2 = EASY
    {
      bottomDensity: 0.14,
      frictionAir: 0.018,
      forceBase: 0.46,
      forceAdd: 0.48,
      spinMult: 0.85,
      uprightTolerance: 2.2,
      uprightToleranceGiant: 2.5,
      landTorque: 0.05,
      landTorqueGiant: 0.08,
      landThresh: 3.0,
      landDampingSlow: 0.75,
      landDampingFast: 0.82,
      airCorrectionEnabled: true,
      airTorque: 0.005,
      airThresh: 2.0,
      airDamping: 0.97,
      airCorrectionMaxSpeed: 10.0,
      skipStabilizeAboveSpeed3: false,
      obstacleRollMult: 0.8,
      alwaysSpawnItems: true,
      safeItems: true,
    },
  ],
}
