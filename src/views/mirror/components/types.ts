export interface PageInfo {
  name: string
  description: string
  author: string
  category: string
  path: string
  facebook?: string
}

export interface ProductItem {
  name: string
  description: string
  author: string
  category: string
  path: string
  facebook?: string
  x: number
  y: number
  vx: number
  vy: number
  isDragging: boolean
  lastClickTime: number
}

export interface Star {
  x: number
  y: number
  size: number
  brightness: number
  twinkleSpeed: number
  twinkleOffset: number
}

export const COLORS = {
  bgDeep: '#0F1923',
  bgSurface: '#162232',
  bgElevated: '#1E2F42',
  coral: '#FF6B4A',
  coralLight: '#FF8A70',
  coralDark: '#E55A3A',
  coralMuted: '#CC5A3D',
  amber: '#FFB830',
  amberLight: '#FFC94D',
  textPrimary: '#F0EDE6',
  textSecondary: '#8B9DB5',
  textDim: '#4A6180',
  border: '#253549',
  starColor: '#FFFFFF',
  starGlow: 'rgba(255, 255, 255, 0.3)',
  constellationLine: 'rgba(255, 107, 74, 0.4)',
  constellationLineAuthor: 'rgba(255, 184, 48, 0.4)',
}
