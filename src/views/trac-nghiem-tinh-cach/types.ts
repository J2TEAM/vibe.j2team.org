export interface Question {
  id: number
  text: string
  dimension: 'EI' | 'SN' | 'TF' | 'JP'
  pole: 'E' | 'I' | 'S' | 'N' | 'T' | 'F' | 'J' | 'P'
}

export interface PersonalityType {
  code: string
  nameVi: string
  nameEn: string
  group: 'analyst' | 'diplomat' | 'sentinel' | 'explorer'
  groupNameVi: string
  emoji: string
  population: string
  description: string
  traits: string[]
  strengths: string[]
  weaknesses: string[]
  compatibleTypes: string[]
  famousPeople: string[]
}

export interface DimensionScore {
  left: { label: string; score: number; percentage: number }
  right: { label: string; score: number; percentage: number }
}

export interface QuizResult {
  type: string
  scores: Record<string, number>
  percentages: Record<string, number>
  dimensions: Record<string, DimensionScore>
  date: string
  personality?: PersonalityType
}

export type QuizState = 'welcome' | 'quiz' | 'result' | 'history'
