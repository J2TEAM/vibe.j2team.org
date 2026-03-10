// === Kiểu dữ liệu cho trang Corner Prediction ===

// --- Ngưỡng kèo ---
export type CornerThresholdKey = '8.5' | '9.5' | '10.5' | '11.5' | '12.5'

export type CornerRecommendation = 'OVER' | 'UNDER' | 'NO BET'

export interface CornerThresholdDetail {
  prob_over: number
  prob_under: number
  recommendation: CornerRecommendation
  edge: number
}

export type CornerThresholds = Record<CornerThresholdKey, CornerThresholdDetail>

// --- Dữ liệu prediction theo trận (corners.json) ---
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

// --- Thông tin đội bóng (teams_stats.json) ---
export interface TeamInfo {
  id: string
  name: string
  shortName: string
}

export interface TeamSideStats {
  for: number
  against: number
  total: number
  recentForm: string
}

export interface TeamsStatsFile {
  updatedAt: string
  teams: TeamInfo[]
  homeStats: Record<string, TeamSideStats>
  awayStats: Record<string, TeamSideStats>
}

// --- Dữ liệu H2H đối đầu (h2h_corners.json) ---
export interface H2HProbPoint {
  prob_over: number
  prob_under: number
}

export interface H2HCornerHistory {
  teamId: string
  last10: number[]
}

export interface H2HTotalEntry {
  date: string
  homeId: string
  awayId: string
  homeCorners: number
  awayCorners: number
}

export interface H2HOverRate {
  threshold: string
  homeRate: number
  awayRate: number
}

export interface H2HPairData {
  pairId: string
  probabilityByThreshold: Record<CornerThresholdKey, H2HProbPoint>
  cornerHistory: Record<string, H2HCornerHistory>
  h2hTotals: H2HTotalEntry[]
  overRates: H2HOverRate[]
}

export interface H2HFile {
  updatedAt: string
  pairs: Record<string, H2HPairData>
}
