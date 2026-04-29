export type Severity = 'safe' | 'warning' | 'danger'
export type SessionStatus = 'idle' | 'running' | 'finished'

export type StepChoice = {
  id: string
  label: string
  consequence: string
  impact: number
  severity: Severity
  nextStepId?: string
}

export type ScenarioStep = {
  id: string
  title: string
  prompt: string
  timeLimit: number
  reference: string
  timeoutChoiceId: string
  choices: readonly [StepChoice, StepChoice, ...StepChoice[]]
}

export type Scenario = {
  id: string
  name: string
  badge: string
  icon: string
  image: string
  description: string
  objective: string
  summary: string
  startStepId: string
  debrief: readonly string[]
  steps: readonly ScenarioStep[]
}

export type DecisionLogItem = {
  stepId: string
  stepTitle: string
  selectedChoiceId: string
  selectedLabel: string
  consequence: string
  impact: number
  severity: Severity
  timedOut: boolean
  remainingTime: number
  elapsedTime: number
  reference: string
}

export type SafetyAssessment = {
  label: string
  description: string
  textClass: string
  borderClass: string
}
