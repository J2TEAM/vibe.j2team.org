export interface SolarTerm {
  id: string
  name: string
  translation: string
  description: string
  season: 'Xuân' | 'Hạ' | 'Thu' | 'Đông'
  approxDate: string
  displayDate: string
  tips: string
  proverb?: string
}
