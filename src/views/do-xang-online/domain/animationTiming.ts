import type { FillPhaseCode } from '../types'

// ── Timing constants (single source of truth, re-exported from sessionConstants) ──

/** Hand picks up nozzle at pump — no visual yet. */
export const SESSION_PREP_MS = 620

/** Walk from pump to vehicle (horizontal progress only; footsteps are CSS-driven). */
export const SESSION_WALK_MS = 3_000

/** Connect nozzle to tank inlet. */
export const SESSION_COUPLE_MS = 780

/** Fuel fills hose segment (tube → vehicle) before tank starts filling. */
export const SESSION_HOSE_PRIME_MS = 4_800

/** Total of all pre-tank phases. */
export const SESSION_PRE_TANK_MS =
  SESSION_PREP_MS + SESSION_WALK_MS + SESSION_COUPLE_MS + SESSION_HOSE_PRIME_MS

// ── Types ──

/** Animation phase as a numeric index (for branchless maths). */
export type AnimationPhase = 'prep' | 'walk' | 'couple' | 'hose' | 'tank' | 'done'

/** Immutable configuration for a fill session timeline. */
export interface TimingConfig {
  prepMs: number
  walkMs: number
  coupleMs: number
  hosePrimeMs: number
  tankDurationMs: number
  /** When true all pre-tank phases collapse to 0. */
  reducedMotion: boolean
}

/** Default config pulled from the exported constants. */
export function defaultTimingConfig(
  tankDurationMs: number,
  reducedMotion = false,
): TimingConfig {
  return {
    prepMs: reducedMotion ? 0 : SESSION_PREP_MS,
    walkMs: reducedMotion ? 0 : SESSION_WALK_MS,
    coupleMs: reducedMotion ? 0 : SESSION_COUPLE_MS,
    hosePrimeMs: reducedMotion ? 0 : SESSION_HOSE_PRIME_MS,
    tankDurationMs,
    reducedMotion,
  }
}

// ── Easing functions (all input/output clamped 0→1) ──

/** Classic smoothstep: 3t² − 2t³. */
export function smoothstep(t: number): number {
  const x = Math.max(0, Math.min(1, t))
  return x * x * (3 - 2 * x)
}

/** ease-out cubic: 1 − (1−t)³. */
export function easeOutCubic(t: number): number {
  const x = 1 - Math.max(0, Math.min(1, t))
  return 1 - x * x * x
}

/** ease-in-out quadratic. */
export function easeInOutQuad(t: number): number {
  const x = Math.max(0, Math.min(1, t))
  return x < 0.5 ? 2 * x * x : 1 - (-2 * x + 2) ** 2 / 2
}

// ── Phase duration helpers ──

/** Sum of all phases up to (and including) `phase`. */
export function phaseEndMs(phase: AnimationPhase, cfg: TimingConfig): number {
  switch (phase) {
    case 'prep':
      return cfg.prepMs
    case 'walk':
      return cfg.prepMs + cfg.walkMs
    case 'couple':
      return cfg.prepMs + cfg.walkMs + cfg.coupleMs
    case 'hose':
      return cfg.prepMs + cfg.walkMs + cfg.coupleMs + cfg.hosePrimeMs
    case 'tank':
      return cfg.prepMs + cfg.walkMs + cfg.coupleMs + cfg.hosePrimeMs + cfg.tankDurationMs
    case 'done':
      return Infinity
  }
}

/** Total session duration. */
export function totalSessionMs(cfg: TimingConfig): number {
  return phaseEndMs('tank', cfg)
}

// ── Phase → FillPhaseCode mapping ──

const PHASE_CODE_MAP: Record<AnimationPhase, FillPhaseCode> = {
  prep: 'prep',
  walk: 'walk',
  couple: 'couple',
  hose: 'hose',
  tank: 'tank',
  done: 'done',
}

/** Map our numeric phase to the existing FillPhaseCode union. */
export function phaseToCode(phase: AnimationPhase): FillPhaseCode {
  return PHASE_CODE_MAP[phase]!
}
