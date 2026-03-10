export type CornerThresholdKey = '8.5' | '9.5' | '10.5' | '11.5' | '12.5'

export type CornerRecommendation = 'OVER' | 'UNDER' | 'NO BET'

export interface CornerThresholdDetail {
  prob_over: number
  prob_under: number
  recommendation: CornerRecommendation
  edge: number
}

export type CornerThresholds = Record<CornerThresholdKey, CornerThresholdDetail>

export interface CornerPredictionItem {
  date: string
  homeTeam: string
  awayTeam: string
  prediction: string
  confidence: 'Low' | 'Medium' | 'High'
  expectedCorners: number
  edge: number
  prob: number
  actualCorners: number | null
  isFuture: boolean
  thresholds: CornerThresholds
}

export interface CornerModelInfo {
  type: string
  features: number
  window: number
  train_date: string
  rmse: number
}

export interface CornerDataFile {
  updatedAt: string
  commentary?: string
  model: CornerModelInfo
  predictions: CornerPredictionItem[]
}

export interface CornerFilters {
  teamQuery: string
  onlyFuture: boolean
  bookmarkedOnly: boolean
}

export interface CornerPreferences {
  confidenceThreshold: number
  showAdvancedStats: boolean
}
