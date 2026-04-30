export type FilterTopology = 'rc-lpf' | 'rc-hpf' | 'rl-lpf' | 'rl-hpf' | 'rlc-bp' | 'sk-lpf'

export type ComponentField = 'R' | 'C' | 'L' | 'Q'

export interface TopologyInfo {
  id: FilterTopology
  shortLabel: string
  fullLabel: string
  vietnameseName: string
  order: 1 | 2
  fields: ComponentField[]
  formulaTex: string
  cutoffFormulaTex: string
  /** A small inline schematic description users can read like a sentence. */
  schematicNote: string
}

export interface FilterParams {
  R: number
  C: number
  L: number
  Q: number
}

export interface FilterEvaluation {
  /** Magnitude in decibels (20 log10 |H|). */
  magnitudeDb: number
  /** Phase in degrees. */
  phaseDeg: number
}

export interface FilterDescription {
  topology: FilterTopology
  /** Characteristic frequency in Hz: cutoff for 1st-order, resonant for 2nd-order. */
  fc: number
  /** Quality factor for 2nd-order; null for 1st-order. */
  q: number | null
  /** Linear gain at the passband centre (DC for LPF, infinity for HPF). */
  passbandGain: number
  /** Extra computed scalars to display (e.g. Sallen-Key K). */
  extras: Record<string, number>
  evaluate: (frequencyHz: number) => FilterEvaluation
}

export type FilterResult =
  | { ok: true; description: FilterDescription }
  | { ok: false; error: string }
