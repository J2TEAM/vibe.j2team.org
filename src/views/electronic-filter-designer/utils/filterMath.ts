/**
 * Closed-form transfer functions for the six supported topologies.
 *
 *   1st-order RC LPF   |H(s)| = 1 / (1 + sRC)         f_c = 1/(2πRC)
 *   1st-order RC HPF   |H(s)| = sRC / (1 + sRC)       f_c = 1/(2πRC)
 *   1st-order RL LPF   |H(s)| = 1 / (1 + s·L/R)       f_c = R/(2πL)
 *   1st-order RL HPF   |H(s)| = sL/R / (1 + s·L/R)    f_c = R/(2πL)
 *   2nd-order RLC BP   H(s)   = (s·ω0/Q) / (s² + s·ω0/Q + ω0²)
 *                      ω0 = 1/√(LC),  Q = (1/R)·√(L/C)
 *   2nd-order Sallen-Key LPF (equal R, equal C, gain K via op-amp)
 *                      H(s) = K / (s²/ω0² + s/(Q·ω0) + 1)
 *                      ω0 = 1/(R·C),  Q = 1/(3 - K),  stable for 0 < K < 3
 *
 * All formulas are textbook (e.g. Sedra/Smith *Microelectronic Circuits*,
 * Texas Instruments app-note SBOA055A). No invented constants.
 */

import type {
  FilterDescription,
  FilterEvaluation,
  FilterParams,
  FilterResult,
  FilterTopology,
} from '../types'

const TWO_PI = 2 * Math.PI

function toDb(linear: number): number {
  if (linear <= 0) return Number.NEGATIVE_INFINITY
  return 20 * Math.log10(linear)
}

function radToDeg(rad: number): number {
  return (rad * 180) / Math.PI
}

function evalFirstOrderLpf(fc: number, gain: number, f: number): FilterEvaluation {
  if (f <= 0) return { magnitudeDb: toDb(gain), phaseDeg: 0 }
  const x = f / fc
  const mag = gain / Math.sqrt(1 + x * x)
  const phase = -Math.atan(x)
  return { magnitudeDb: toDb(mag), phaseDeg: radToDeg(phase) }
}

function evalFirstOrderHpf(fc: number, gain: number, f: number): FilterEvaluation {
  if (f <= 0) return { magnitudeDb: Number.NEGATIVE_INFINITY, phaseDeg: 90 }
  const x = f / fc
  const mag = (gain * x) / Math.sqrt(1 + x * x)
  const phase = Math.PI / 2 - Math.atan(x)
  return { magnitudeDb: toDb(mag), phaseDeg: radToDeg(phase) }
}

function evalRlcBandpass(f0: number, q: number, f: number): FilterEvaluation {
  if (f <= 0) return { magnitudeDb: Number.NEGATIVE_INFINITY, phaseDeg: 90 }
  const x = f / f0
  const num = x / q
  const den = Math.sqrt((1 - x * x) ** 2 + num * num)
  const mag = num / den
  // ∠H = π/2 - atan2(x/Q, 1 - x²)
  const phase = Math.PI / 2 - Math.atan2(num, 1 - x * x)
  return { magnitudeDb: toDb(mag), phaseDeg: radToDeg(phase) }
}

function evalSallenKeyLpf(f0: number, q: number, k: number, f: number): FilterEvaluation {
  if (f <= 0) return { magnitudeDb: toDb(k), phaseDeg: 0 }
  const x = f / f0
  const den = Math.sqrt((1 - x * x) ** 2 + (x / q) ** 2)
  const mag = k / den
  const phase = -Math.atan2(x / q, 1 - x * x)
  return { magnitudeDb: toDb(mag), phaseDeg: radToDeg(phase) }
}

function requirePositive(value: number, name: string): string | null {
  if (!Number.isFinite(value) || value <= 0) {
    return `${name} phải > 0`
  }
  return null
}

export function buildFilter(topology: FilterTopology, params: FilterParams): FilterResult {
  switch (topology) {
    case 'rc-lpf': {
      const err = requirePositive(params.R, 'R') ?? requirePositive(params.C, 'C')
      if (err !== null) return { ok: false, error: err }
      const fc = 1 / (TWO_PI * params.R * params.C)
      const desc: FilterDescription = {
        topology,
        fc,
        q: null,
        passbandGain: 1,
        extras: {},
        evaluate: (f) => evalFirstOrderLpf(fc, 1, f),
      }
      return { ok: true, description: desc }
    }

    case 'rc-hpf': {
      const err = requirePositive(params.R, 'R') ?? requirePositive(params.C, 'C')
      if (err !== null) return { ok: false, error: err }
      const fc = 1 / (TWO_PI * params.R * params.C)
      const desc: FilterDescription = {
        topology,
        fc,
        q: null,
        passbandGain: 1,
        extras: {},
        evaluate: (f) => evalFirstOrderHpf(fc, 1, f),
      }
      return { ok: true, description: desc }
    }

    case 'rl-lpf': {
      const err = requirePositive(params.R, 'R') ?? requirePositive(params.L, 'L')
      if (err !== null) return { ok: false, error: err }
      const fc = params.R / (TWO_PI * params.L)
      const desc: FilterDescription = {
        topology,
        fc,
        q: null,
        passbandGain: 1,
        extras: {},
        evaluate: (f) => evalFirstOrderLpf(fc, 1, f),
      }
      return { ok: true, description: desc }
    }

    case 'rl-hpf': {
      const err = requirePositive(params.R, 'R') ?? requirePositive(params.L, 'L')
      if (err !== null) return { ok: false, error: err }
      const fc = params.R / (TWO_PI * params.L)
      const desc: FilterDescription = {
        topology,
        fc,
        q: null,
        passbandGain: 1,
        extras: {},
        evaluate: (f) => evalFirstOrderHpf(fc, 1, f),
      }
      return { ok: true, description: desc }
    }

    case 'rlc-bp': {
      const err =
        requirePositive(params.R, 'R') ??
        requirePositive(params.L, 'L') ??
        requirePositive(params.C, 'C')
      if (err !== null) return { ok: false, error: err }
      const f0 = 1 / (TWO_PI * Math.sqrt(params.L * params.C))
      const q = (1 / params.R) * Math.sqrt(params.L / params.C)
      const desc: FilterDescription = {
        topology,
        fc: f0,
        q,
        passbandGain: 1,
        extras: { Q: q },
        evaluate: (f) => evalRlcBandpass(f0, q, f),
      }
      return { ok: true, description: desc }
    }

    case 'sk-lpf': {
      const err =
        requirePositive(params.R, 'R') ??
        requirePositive(params.C, 'C') ??
        requirePositive(params.Q, 'Q')
      if (err !== null) return { ok: false, error: err }
      const k = 3 - 1 / params.Q
      if (k <= 0 || k >= 3) {
        return {
          ok: false,
          error: `Q = ${params.Q.toFixed(3)} ⇒ K = ${k.toFixed(3)}; cần 0 < K < 3 để ổn định`,
        }
      }
      const f0 = 1 / (TWO_PI * params.R * params.C)
      const desc: FilterDescription = {
        topology,
        fc: f0,
        q: params.Q,
        passbandGain: k,
        extras: { K: k, Q: params.Q },
        evaluate: (f) => evalSallenKeyLpf(f0, params.Q, k, f),
      }
      return { ok: true, description: desc }
    }
  }
}

/** Compute the second component value for a given target characteristic frequency. */
export function solveSecondComponent(
  topology: FilterTopology,
  given: { name: 'R' | 'C' | 'L'; value: number },
  targetFc: number,
): { name: 'R' | 'C' | 'L'; value: number } | null {
  if (!Number.isFinite(targetFc) || targetFc <= 0) return null
  if (!Number.isFinite(given.value) || given.value <= 0) return null

  switch (topology) {
    case 'rc-lpf':
    case 'rc-hpf': {
      // f_c = 1 / (2π R C) ⇒ the missing one is 1 / (2π · X · f_c)
      if (given.name === 'R') {
        return { name: 'C', value: 1 / (TWO_PI * given.value * targetFc) }
      }
      if (given.name === 'C') {
        return { name: 'R', value: 1 / (TWO_PI * given.value * targetFc) }
      }
      return null
    }
    case 'rl-lpf':
    case 'rl-hpf': {
      // f_c = R / (2π L)
      if (given.name === 'R') {
        return { name: 'L', value: given.value / (TWO_PI * targetFc) }
      }
      if (given.name === 'L') {
        return { name: 'R', value: TWO_PI * targetFc * given.value }
      }
      return null
    }
    case 'sk-lpf': {
      // f_0 = 1 / (2π R C)
      if (given.name === 'R') {
        return { name: 'C', value: 1 / (TWO_PI * given.value * targetFc) }
      }
      if (given.name === 'C') {
        return { name: 'R', value: 1 / (TWO_PI * given.value * targetFc) }
      }
      return null
    }
    case 'rlc-bp':
      // Two unknowns (need additional constraint such as target Q); not
      // attempted here to avoid presenting a guess as a solution.
      return null
  }
}
