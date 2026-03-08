import type { LevelConfig } from './types'

const TILE = 40

export const LEVELS: LevelConfig[] = [
  {
    name: 'Tiền tuyến',
    enemies: [
      { x: TILE * 10, y: TILE * 2, type: 'scout' },
      { x: TILE * 16, y: TILE * 7, type: 'scout' },
      { x: TILE * 5, y: TILE * 5, type: 'scout' },
    ],
    princessPos: { x: (20 - 2) * TILE, y: TILE },
    playerPos: { x: TILE * 1.5, y: (15 - 2) * TILE },
  },
  {
    name: 'Vùng nguy hiểm',
    enemies: [
      { x: TILE * 4, y: TILE * 2, type: 'scout' },
      { x: TILE * 14, y: TILE * 3, type: 'heavy' },
      { x: TILE * 10, y: TILE * 8, type: 'scout' },
      { x: TILE * 16, y: TILE * 11, type: 'sniper' },
    ],
    princessPos: { x: (20 - 2) * TILE, y: TILE },
    playerPos: { x: TILE * 1.5, y: (15 - 2) * TILE },
  },
  {
    name: 'Lâu đài bóng tối',
    enemies: [
      { x: TILE * 3, y: TILE * 2, type: 'heavy' },
      { x: TILE * 16, y: TILE * 3, type: 'sniper' },
      { x: TILE * 8, y: TILE * 7, type: 'heavy' },
      { x: TILE * 14, y: TILE * 10, type: 'scout' },
      { x: TILE * 5, y: TILE * 11, type: 'sniper' },
    ],
    princessPos: { x: (20 - 2) * TILE, y: TILE },
    playerPos: { x: TILE * 1.5, y: (15 - 2) * TILE },
  },
]
