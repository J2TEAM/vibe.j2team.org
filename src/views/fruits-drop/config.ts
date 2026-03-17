export const ENGINE_ITERATIONS = 5
export const GRAVITY = 0.4
export const FRICTION = 0.85
export const BOUNCE = 0.3
export const BOARD_WIDTH = 400
export const BOARD_HEIGHT = 600

// 1. Thêm Interface này
export interface FruitData {
  id: number
  icon: string
  color: string
  radius: number
  score: number
}

// 2. Gắn kiểu mảng FruitData[] vào FRUIT_TYPES
export const FRUIT_TYPES: FruitData[] = [
  { id: 1, icon: '🍒', color: 'text-red-400', radius: 15, score: 2 },
  { id: 2, icon: '🍓', color: 'text-rose-500', radius: 22, score: 4 },
  { id: 3, icon: '🍇', color: 'text-purple-400', radius: 30, score: 8 },
  { id: 4, icon: '🍊', color: 'text-orange-400', radius: 38, score: 16 },
  { id: 5, icon: '🍎', color: 'text-red-500', radius: 48, score: 32 },
  { id: 6, icon: '🍐', color: 'text-yellow-200', radius: 58, score: 64 },
  { id: 7, icon: '🍑', color: 'text-pink-300', radius: 68, score: 128 },
  { id: 8, icon: '🍍', color: 'text-yellow-400', radius: 80, score: 256 },
  { id: 9, icon: '🍈', color: 'text-green-300', radius: 95, score: 512 },
  { id: 10, icon: '🍉', color: 'text-green-500', radius: 115, score: 1024 },
  { id: 11, icon: '🌟', color: 'text-accent-amber', radius: 135, score: 2048 }
]
