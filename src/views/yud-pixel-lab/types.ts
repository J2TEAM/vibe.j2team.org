export interface EffectParam {
  label: string
  key: string
  min: number
  max: number
  step: number
  defaultValue: number
}

export interface EffectDefinition {
  id: EffectId
  name: string
  icon: string
  description: string
  params: EffectParam[]
}

export type EffectId = 'dithering' | 'pixelate' | 'halftone' | 'edge'

export type EffectParams = Record<string, number>
