export interface SortStep {
  array: number[]
  comparing: number[]
  swapping: number[]
  sorted: number[]
  pivot?: number
  description: string
  pseudoCodeLine: number
  comparisons: number
  swaps: number
}

export type AlgorithmId =
  | 'bubble'
  | 'selection'
  | 'insertion'
  | 'merge'
  | 'quick'
  | 'heap'
  | 'shell'
  | 'counting'
  | 'radix'
  | 'bogo'

export type VisualizationMode = 'bar' | 'hue' | 'dot'

export type InputType = 'random' | 'nearly-sorted' | 'reversed' | 'duplicates'

export type PivotStrategy = 'first' | 'last' | 'random' | 'median'

export interface AlgorithmDef {
  id: AlgorithmId
  name: string
  timeComplexity: { best: string; average: string; worst: string }
  spaceComplexity: string
  stable: boolean
  description: string
  pseudoCode: string[]
  generate: (arr: number[], pivotStrategy?: PivotStrategy) => Generator<SortStep>
  maxSize?: number
}
