export type PlanetId =
  | 'mercury'
  | 'venus'
  | 'earth'
  | 'mars'
  | 'jupiter'
  | 'saturn'
  | 'uranus'
  | 'neptune'

export interface PlanetDefinition {
  id: PlanetId
  name: string
  englishName: string
  distanceAU: number
  orbitalPeriodDays: number
  diameterKm: number
  rotationLabel: string
  moons: number
  description: string
  learningHint: string
  primaryColor: string
  secondaryColor: string
  eccentricity: number
  orbitalInclinationDeg: number
  axialTiltDeg: number
  perihelionArgDeg: number
  epochMeanAnomalyRad: number
  seasonOffsetDeg: number
}

export interface TrailPoint {
  x: number
  y: number
}

export interface PlanetFrameState {
  x: number
  y: number
  drawRadius: number
  orbitalRadiusAU: number
  trueAnomalyRad: number
  trail: TrailPoint[]
}

export interface Star {
  nx: number
  ny: number
  radius: number
  alpha: number
  phase: number
  twinkleSpeed: number
}

export interface PlanetSeasonData {
  northSeason: string
  southSeason: string
  subsolarLatitudeDeg: number
  axialTiltShownDeg: number
  retrogradeRotation: boolean
  insolationIndex: number
}

export interface LessonStep {
  id: string
  title: string
  objective: string
  instructions: string
  hint: string
  focusPlanetId: PlanetId
  recommendedSpeed: number
  emphasis: 'eccentricity' | 'inclination' | 'season' | 'comparison'
}

export interface QuizChoice {
  id: string
  label: string
}

export interface QuizQuestion {
  id: string
  question: string
  choices: QuizChoice[]
  correctChoiceId: string
  explanation: string
}
