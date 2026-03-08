export const GRAVITY = 0.5
export const TILE_SIZE = 32

export interface AABB {
  x: number
  y: number
  width: number
  height: number
}

export function overlaps(a: AABB, b: AABB): boolean {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y
}

export function overlapArea(a: AABB, b: AABB): { x: number; y: number } {
  const ox = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x)
  const oy = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y)
  return { x: ox, y: oy }
}
