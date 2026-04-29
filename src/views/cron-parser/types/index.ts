export type CronField = 'minute' | 'hour' | 'dayOfMonth' | 'month' | 'dayOfWeek' | 'second'
export type CronFormat = 'linux' | 'quartz'
export type CronAlertLevel = 'info' | 'warning' | 'error'

export interface CronBuilderState {
  second: string
  minute: string
  hour: string
  dayOfMonth: string
  month: string
  dayOfWeek: string
}

export interface CronValidation {
  isValid: boolean
  error?: string
}

export interface CronAlert {
  level: CronAlertLevel
  title: string
  message: string
}

export interface CronAnalysis {
  fieldCount: number
  expectedFieldCount: 5 | 6
  modeLabel: string
  cadenceLabel: string
  cadenceTone: 'accent-coral' | 'accent-amber' | 'accent-sky'
  fieldSummary: string
  alerts: CronAlert[]
}

export interface NextRun {
  date: Date
  formatted: string
}
