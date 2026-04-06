export interface GridConfig {
  columns: number
  rows: number
  gap: number
}

export interface GridItem {
  id: number
  col: number
  row: number
  colSpan: number
  rowSpan: number
  color: string
}

export const ITEM_COLORS = [
  '#FF6B4A',
  '#FFB830',
  '#38BDF8',
  '#A78BFA',
  '#34D399',
  '#F472B6',
  '#FB923C',
  '#2DD4BF',
  '#E879F9',
  '#FACC15',
] as const

export const DEFAULT_CONFIG: GridConfig = {
  columns: 3,
  rows: 3,
  gap: 10,
}

export const MIN_COLS = 1
export const MAX_COLS = 12
export const MIN_ROWS = 1
export const MAX_ROWS = 12
export const MIN_GAP = 0
export const MAX_GAP = 50
