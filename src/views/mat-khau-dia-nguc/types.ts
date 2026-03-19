export interface Rule {
  id: number
  title: string
  description: string
  validate: (password: string) => boolean
  hint?: string | ((password: string) => string)
  emoji?: string
  category?: string
  targetCopy?: string
}

export type RuleStatus = 'hidden' | 'active' | 'passed' | 'failed'

export interface RuleWithStatus extends Rule {
  status: RuleStatus
}
