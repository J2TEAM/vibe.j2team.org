// types.ts
export interface BugdleItem {
  id: string
  name?: string
  language?: string
  stage?: 'Compile' | 'Runtime' | 'Build' | 'Network' | 'Git' | 'Other' | '???'
  depressionLevel?: 1 | 2 | 3 | 4 | 5 | number
  commonFix?: string
  _comparison?: Record<string, string>
}

export interface TechdleItem {
  id: string
  name?: string
  year?: number
  logoColor?: string
  nickname?: string
  hateRatio?: number
  _comparison?: Record<string, string>
}

export interface ClientQuoteItem {
  id: string
  quote?: string
  speaker?: 'PM' | 'Khách hàng' | 'Tester' | 'Leader' | 'Khác' | '???'
  field?: 'Frontend' | 'Backend' | 'Design' | 'System' | 'All' | '???'
  consequence?: string
  realMeaning?: string
  _comparison?: Record<string, string>
}

export interface CursedCodeItem {
  id: string
  snippet?: string
  language?: string
  output?: string
  hints?: string[]
  _comparison?: Record<string, string>
}
