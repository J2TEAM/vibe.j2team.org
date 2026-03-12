import type { Map as MapboxMap } from 'mapbox-gl'

const BUILDING_LAYER_ID = '3d-buildings'

/**
 * Kiểm tra (lat, lng) có nằm trong building footprint không.
 * Dùng map.queryRenderedFeatures trên layer 3d-buildings.
 * Trả về true nếu đi được (không bị chặn), false nếu bị chặn.
 * Trả về true nếu layer chưa có (style chưa load xong) để tránh lỗi.
 */
export function isWalkable(map: MapboxMap | null, lat: number, lng: number): boolean {
  if (!map) return true
  try {
    const style = map.getStyle()
    const hasLayer = style?.layers?.some((l) => l.id === BUILDING_LAYER_ID) ?? false
    if (!hasLayer) return true

    const point = map.project([lng, lat])
    const bbox: [[number, number], [number, number]] = [
      [point.x - 2, point.y - 2],
      [point.x + 2, point.y + 2],
    ]
    const features = map.queryRenderedFeatures(bbox, {
      layers: [BUILDING_LAYER_ID],
    })
    return features.length === 0
  } catch {
    return true
  }
}

const UNSTUCK_STEP = 0.00004
const UNSTUCK_RINGS = 12
const UNSTUCK_POINTS_PER_RING = 8

/**
 * Tìm vị trí walkable gần (lat, lng) để thoát kẹt trong building.
 * Thử các điểm theo vòng tròn đồng tâm, trả về vị trí đầu tiên đi được.
 */
export function findWalkableNear(
  lat: number,
  lng: number,
  check: (lat: number, lng: number) => boolean,
): { lat: number; lng: number } | null {
  for (let r = 1; r <= UNSTUCK_RINGS; r++) {
    const dist = r * UNSTUCK_STEP
    for (let i = 0; i < UNSTUCK_POINTS_PER_RING; i++) {
      const angle = (i / UNSTUCK_POINTS_PER_RING) * Math.PI * 2
      const lat2 = lat + Math.cos(angle) * dist
      const lng2 = lng + Math.sin(angle) * dist
      if (check(lat2, lng2)) return { lat: lat2, lng: lng2 }
    }
  }
  return null
}
