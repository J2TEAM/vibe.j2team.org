export type ChoiceId = 'A' | 'B' | 'C' | 'D'

export type QuizLevel = 'easy' | 'medium' | 'hard'

export interface QuizChoice {
  id: ChoiceId
  text: string
}

export interface QuizQuestion {
  id: string
  level: QuizLevel
  title: string
  snippet: string
  question: string
  choices: QuizChoice[]
  correctChoice: ChoiceId
  explanation: string
}

export interface LevelMeta {
  label: string
  hint: string
}

export type QuestionBank = Record<QuizLevel, QuizQuestion[]>
