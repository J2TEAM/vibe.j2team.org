export type LegoBrickType = '1x1' | '1x2' | '2x1' | '2x2' | '2x3' | '2x4' | '4x2' | '4x4'

export interface LegoBrick {
  id: string
  type: LegoBrickType
  color: string
  position: { x: number; y: number; z: number }
  rotation: number // 0, 90, 180, 270 degrees
}

export const BRICK_DATA: Record<LegoBrickType, { width: number; depth: number; height: number }> = {
  '1x1': { width: 1, depth: 1, height: 1.2 },
  '1x2': { width: 1, depth: 2, height: 1.2 },
  '2x1': { width: 2, depth: 1, height: 1.2 },
  '2x2': { width: 2, depth: 2, height: 1.2 },
  '2x3': { width: 2, depth: 3, height: 1.2 },
  '2x4': { width: 2, depth: 4, height: 1.2 },
  '4x2': { width: 4, depth: 2, height: 1.2 },
  '4x4': { width: 4, depth: 4, height: 1.2 },
}

export const LEGO_COLORS = [
  '#E3000B', // Red
  '#0055BF', // Blue
  '#FFD500', // Yellow
  '#FFFFFF', // White
  '#000000', // Black
  '#00852B', // Green
  '#FF6A00', // Orange
  '#A0A5A9', // Silver
  '#4B2C20', // Brown
  '#FF94B2', // Pink
  '#7209B7', // Purple
  '#4CC9F0', // Neon blue
  '#F1FAEE', // Off-white
  '#A8DADC', // Light blue
  '#3A0CA3', // Indigo
  '#B5E48C', // Lime
]
