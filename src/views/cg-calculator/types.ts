export interface WingParams {
  span: number | null
  rootChord: number | null
  tipChord: number | null
  sweep: number | null
  fuseWidth: number | null
  chassisCog: number | null
  chassisWeight: number | null
  targetCgPercent: number | null
}

export interface Part {
  id: string
  name: string
  width: number | null
  length: number | null
  weight: number | null
  x: number | null
  y: number | null
  rotation: number | null
  color: string
}

export interface CalculationResult {
  wingAreaLabel: string // dm2
  macDistance: number   // mm from nose/LE
  macLength: number     // mm
  targetCgDist: number  // mm from nose
  chassisCentroid: number // mm
  totalWeight: number   // g
  wingLoading: number    // g/dm2
  stallSpeed: number     // km/h
  actualCgDist: number   // mm from nose
}
