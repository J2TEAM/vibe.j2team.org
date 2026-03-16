export interface WingParams {
  span: number      // Wing span (mm)
  rootChord: number // Root chord (mm)
  tipChord: number  // Tip chord (mm)
  sweep: number     // Sweep distance (mm)
  fuseWidth: number // Fuselage width (mm)
  chassisCog: number // Chassis CG from nose (mm)
  chassisWeight: number // Chassis weight (g)
  targetCgPercent: number // Target CG as percentage of MAC
}

export interface Part {
  id: string
  name: string
  width: number
  length: number
  weight: number
  x: number // distance from nose to part center
  y: number // distance from center line (0 for fuselage parts)
  rotation: number
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
