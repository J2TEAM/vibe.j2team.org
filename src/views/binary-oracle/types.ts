export interface Hexagram {
  id: number
  binary: string
  name: string
  symbol: string
  type: string
  description: string
  advice: string
}

export interface DailyOracleInfo {
  luckyNumber: number
  deity: string
  direction: string
}
