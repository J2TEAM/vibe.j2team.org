export type CalculatorMode =
  | 'home'
  | 'calculate'
  | 'base_n'
  | 'complex'
  | 'matrix'
  | 'vector'
  | 'statistics'
  | 'distribution'
  | 'spreadsheet'
  | 'table'
  | 'equation'
  | 'inequality'
  | 'verify'
  | 'ratio'

export type AngleMode = 'DEG' | 'RAD' | 'GRA'

export type CalcResult = { ok: true; value: string; raw: number } | { ok: false; error: string }

export type HistoryEntry = {
  expr: string
  result: string
  raw: number
}
