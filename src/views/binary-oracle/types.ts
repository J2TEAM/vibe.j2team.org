export interface Hexagram {
  id: number
  binary: string
  name: string
  animation: string
  description: string
  advice: string
}

export interface DailyOracleInfo {
  luckyNumber: number
  deity: string
  direction: string
}
