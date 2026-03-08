export const TILE_SIZE = 32
export const GRID_W = 20
export const GRID_H = 15
export const CANVAS_WIDTH = GRID_W * TILE_SIZE
export const CANVAS_HEIGHT = GRID_H * TILE_SIZE
export const WALKABLE_AREA = { minX: 1, maxX: 18, minY: 1, maxY: 13 }

export const ACTION_ZONES = [
  { name: 'Nấu ăn', icon: '🍳', delay: 2000, rect: { x1: 0, y1: 2.5, x2: 3.6, y2: 4.3 } },
  { name: 'Ăn', icon: '🍎', delay: 3000, rect: { x1: 4.5, y1: 3.0, x2: 6.5, y2: 4.5 } },
  {
    name: 'Xem TV',
    icon: '📺',
    delay: 3000,
    rects: [
      { x1: 8.1, y1: 4.7, x2: 8.6, y2: 6.4 },
      { x1: 11.9, y1: 4.8, x2: 12.3, y2: 6.3 },
      { x1: 8.9, y1: 6.7, x2: 11.3, y2: 7.0 },
    ],
  },
  { name: 'Đọc sách', icon: '📖', delay: 3000, rect: { x1: 15.2, y1: 0.6, x2: 20.0, y2: 4.3 } },
  {
    name: 'Ngủ',
    icon: '💤',
    delay: 8000,
    rect: { x1: 16.9, y1: 8.2, x2: 18.5, y2: 10.4 },
    targetPos: { x: 17.7, y: 9.4 },
  },
]
