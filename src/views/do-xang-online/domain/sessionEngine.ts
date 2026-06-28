import type { FillPhaseCode } from '../types'
import {
  type TimingConfig,
  defaultTimingConfig,
  phaseEndMs,
  phaseToCode,
  smoothstep,
} from './animationTiming'

// ── Fill duration calculation ──

/**
 * Decide how many milliseconds the tank-fill phase should last,
 * clamped between `minMs` and `maxMs`.
 *
 * Linear model: `4000 + capacityLiters × 120`, matching the original composable.
 */
export function calculateFillDuration(
  capacityLiters: number,
  minMs: number,
  maxMs: number,
): number {
  if (capacityLiters <= 0) return minMs
  const ms = 4_000 + capacityLiters * 120
  return Math.max(minMs, Math.min(maxMs, ms))
}

// ── Phase computation ──

/**
 * Determine which animation phase is active at a given elapsed time.
 */
export function computePhase(elapsedMs: number, cfg: TimingConfig): FillPhaseCode {
  if (cfg.reducedMotion) return 'tank'

  const phases = ['prep', 'walk', 'couple', 'hose', 'tank'] as const
  for (const p of phases) {
    if (elapsedMs < phaseEndMs(p, cfg)) return phaseToCode(p)
  }
  return 'done'
}

// ── Progress computation ──

export interface Progress {
  phase: FillPhaseCode
  /** 0–1 overall, including pre-tank visual phases. */
  percent: number
}

/**
 * Compute the current phase and a normalised 0→1 progress value.
 *
 * During pre-tank phases the percent reflects visual animation progress.
 * During the tank phase it reflects fuel volume fill ratio.
 */
export function calculateProgress(elapsedMs: number, cfg: TimingConfig): Progress {
  if (cfg.reducedMotion) {
    const fillDur = cfg.tankDurationMs
    if (fillDur <= 0) return { phase: 'done', percent: 1 }
    const ratio = Math.max(0, Math.min(1, elapsedMs / fillDur))
    return { phase: ratio >= 1 ? 'done' : 'tank', percent: ratio }
  }

  const prepEnd = phaseEndMs('prep', cfg)
  const walkEnd = phaseEndMs('walk', cfg)
  const coupleEnd = phaseEndMs('couple', cfg)
  const hoseEnd = phaseEndMs('hose', cfg)
  const totalDur = phaseEndMs('tank', cfg)

  if (elapsedMs < prepEnd) {
    const t = prepEnd > 0 ? elapsedMs / prepEnd : 1
    return { phase: 'prep', percent: smoothstep(t) * 0.1 }
  }
  if (elapsedMs < walkEnd) {
    const t = cfg.walkMs > 0 ? (elapsedMs - prepEnd) / cfg.walkMs : 1
    return { phase: 'walk', percent: (0.1 + smoothstep(t) * 0.2) }
  }
  if (elapsedMs < coupleEnd) {
    const t = cfg.coupleMs > 0 ? (elapsedMs - walkEnd) / cfg.coupleMs : 1
    return { phase: 'couple', percent: 0.3 + smoothstep(t) * 0.1 }
  }
  if (elapsedMs < hoseEnd) {
    const t = cfg.hosePrimeMs > 0 ? (elapsedMs - coupleEnd) / cfg.hosePrimeMs : 1
    return { phase: 'hose', percent: 0.4 + smoothstep(t) * 0.1 }
  }

  const tankEnd = totalDur
  if (tankEnd <= hoseEnd) {
    return { phase: 'done', percent: 1 }
  }
  const tankElapsed = elapsedMs - hoseEnd
  const tankDur = tankEnd - hoseEnd
  const ratio = Math.max(0, Math.min(1, tankElapsed / tankDur))

  return {
    phase: ratio >= 1 ? 'done' : 'tank',
    percent: 0.5 + ratio * 0.5,
  }
}

// ── Cost calculation ──

/**
 * Calculate total cost from litres dispensed and price per litre.
 */
export function calculateCost(liters: number, pricePerLiter: number): number {
  return liters * pricePerLiter
}

// ── Convenience: create config from the same args as the composable ──

export interface SessionEngineOptions {
  capacityLiters: number
  reducedMotion: boolean
  minFillMs?: number
  maxFillMs?: number
}

/**
 * Build a `TimingConfig` from high-level options (mirrors `useRefuelSession` inputs).
 */
export function buildTimingConfig(opts: SessionEngineOptions): TimingConfig {
  const fillMs = calculateFillDuration(
    opts.capacityLiters,
    opts.minFillMs ?? 5_000,
    opts.maxFillMs ?? 10_000,
  )
  return defaultTimingConfig(fillMs, opts.reducedMotion)
}
