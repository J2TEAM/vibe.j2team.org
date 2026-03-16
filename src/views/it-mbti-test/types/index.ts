export type MbtiAxis = 'EI' | 'SN' | 'TF' | 'JP'
export type MbtiTrait = 'E' | 'I' | 'S' | 'N' | 'T' | 'F' | 'J' | 'P' | 'hidden'
export type QuizPhase = 'intro' | 'question' | 'calculating' | 'result' | 'devil'

export interface QuizOption {
  label: string
  text: string
  trait: MbtiTrait
  score: number
}

export interface QuizQuestion {
  id: number
  question: string
  axis: MbtiAxis
  options: QuizOption[] // includes hidden option (trait: 'hidden') when present
}

export interface ScoreMap {
  E: number
  I: number
  S: number
  N: number
  T: number
  F: number
  J: number
  P: number
}

export interface TraitResult {
  winner: MbtiTrait
  scoreA: number
  scoreB: number
  pctA: number
  pctB: number
}

export interface NemesisLine {
  speaker: string
  text: string
}

export interface MbtiResult {
  type: string
  name: string
  subtitle: string
  overview: string
  strengths: string[]
  weaknesses: string[]
  ally: string
  allyDesc: string
  prophecy: string
  roleTitle: string
  role: string
  nemesis: string
  nemesisLines: NemesisLine[]
  soulmate: string
  soulmateDesc: string
  warning: string
}

export interface DevilResult {
  type: string
  name: string
  subtitle: string
  overview: string
  traits: string[]
  signs: string[]
  nemesis: string
  nemesisDesc: string
  soulmate: string
  soulmateDesc: string
  prophecy: string
  warning: string
}
