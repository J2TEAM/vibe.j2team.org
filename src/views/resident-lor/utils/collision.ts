import type { Map as MapboxMap } from 'mapbox-gl'

const BUILDING_LAYER_ID = '3d-buildings'

/**
 * Cache `hasLayer` per map instance — layer 3d-buildings xuất hiện một lần sau khi
 * style load xong, không bao giờ biến mất trong một session nên cache vô thời hạn.
 * Dùng WeakMap để tự GC khi map instance bị destroy.
 */
const layerPresentCache = new WeakMap<MapboxMap, boolean>()

/**
 * Spatial cache cho walkability.
 * Building positions là static (OSM data) nên cache vô thời hạn.
 * Key = (lat, lng) làm tròn đến lưới 0.00005° (~5m) — nhỏ hơn bước di chuyển zombie.
 */
const GRID = 0.00005
const walkableCache = new Map<string, boolean>()

function walkKey(lat: number, lng: number): string {
  return `${Math.round(lat / GRID)},${Math.round(lng / GRID)}`
}

/**
 * Xóa spatial cache khi map pans xa (gọi từ GameMap khi cần).
 * Thông thường không cần vì buildings là static.
 */
export function clearWalkableCache(): void {
  walkableCache.clear()
}

/**
 * Kiểm tra (lat, lng) có nằm trong building footprint không.
 * Dùng map.queryRenderedFeatures trên layer 3d-buildings.
 * Kết quả được cache theo vị trí để tránh gọi queryRenderedFeatures lặp.
 * Trả về true nếu đi được (không bị chặn), false nếu bị chặn.
 */
export function isWalkable(map: MapboxMap | null, lat: number, lng: number): boolean {
  if (!map) return true

  try {
    // Cache hasLayer — tránh getStyle() đắt tiền mỗi lần gọi
    let hasLayer = layerPresentCache.get(map)
    if (hasLayer === undefined) {
      const style = map.getStyle()
      hasLayer = style?.layers?.some((l) => l.id === BUILDING_LAYER_ID) ?? false
      if (hasLayer) layerPresentCache.set(map, true) // chỉ cache khi đã có layer
    }
    if (!hasLayer) return true

    // Spatial cache — tránh queryRenderedFeatures lặp cho cùng ô lưới
    const key = walkKey(lat, lng)
    const cached = walkableCache.get(key)
    if (cached !== undefined) return cached

    const point = map.project([lng, lat])
    const bbox: [[number, number], [number, number]] = [
      [point.x - 2, point.y - 2],
      [point.x + 2, point.y + 2],
    ]
    const result = map.queryRenderedFeatures(bbox, { layers: [BUILDING_LAYER_ID] }).length === 0
    walkableCache.set(key, result)
    return result
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
