import type { Wall, Position } from './types'

interface ClearZone {
  x: number
  y: number
  w: number
  h: number
}

export function generateMap(
  cols: number,
  rows: number,
  tile: number,
  princessPos: Position,
  playerPos: Position,
  enemyPositions: Position[],
  level: number,
): Wall[] {
  const walls: Wall[] = []

  // Border walls (indestructible)
  for (let x = 0; x < cols; x++) {
    walls.push({ x: x * tile, y: 0, width: tile, height: tile, destructible: false, health: 999 })
    walls.push({
      x: x * tile,
      y: (rows - 1) * tile,
      width: tile,
      height: tile,
      destructible: false,
      health: 999,
    })
  }
  for (let y = 1; y < rows - 1; y++) {
    walls.push({ x: 0, y: y * tile, width: tile, height: tile, destructible: false, health: 999 })
    walls.push({
      x: (cols - 1) * tile,
      y: y * tile,
      width: tile,
      height: tile,
      destructible: false,
      health: 999,
    })
  }

  const clearZones: ClearZone[] = [
    { x: playerPos.x - tile, y: playerPos.y - tile, w: tile * 3, h: tile * 3 },
    { x: princessPos.x - tile, y: princessPos.y - tile, w: tile * 3, h: tile * 3 },
  ]
  for (const ep of enemyPositions) {
    clearZones.push({ x: ep.x - tile, y: ep.y - tile, w: tile * 3, h: tile * 3 })
  }

  function isClear(x: number, y: number) {
    for (const z of clearZones) {
      if (x >= z.x && x < z.x + z.w && y >= z.y && y < z.y + z.h) return true
    }
    return false
  }

  const layouts = [
    // Level 1 - simple
    [
      { startCol: 3, startRow: 3, lenCol: 4, lenRow: 1, destructible: true },
      { startCol: 9, startRow: 4, lenCol: 3, lenRow: 1, destructible: false },
      { startCol: 14, startRow: 3, lenCol: 3, lenRow: 1, destructible: true },
      { startCol: 4, startRow: 7, lenCol: 3, lenRow: 1, destructible: true },
      { startCol: 8, startRow: 8, lenCol: 4, lenRow: 1, destructible: false },
      { startCol: 14, startRow: 9, lenCol: 3, lenRow: 1, destructible: true },
      { startCol: 3, startRow: 11, lenCol: 4, lenRow: 1, destructible: true },
      { startCol: 10, startRow: 11, lenCol: 3, lenRow: 1, destructible: false },
      { startCol: 6, startRow: 2, lenCol: 1, lenRow: 3, destructible: true },
      { startCol: 12, startRow: 2, lenCol: 1, lenRow: 3, destructible: false },
      { startCol: 16, startRow: 5, lenCol: 1, lenRow: 3, destructible: true },
      { startCol: 8, startRow: 10, lenCol: 1, lenRow: 3, destructible: true },
    ],
    // Level 2 - more walls
    [
      { startCol: 3, startRow: 2, lenCol: 2, lenRow: 1, destructible: false },
      { startCol: 7, startRow: 2, lenCol: 5, lenRow: 1, destructible: true },
      { startCol: 15, startRow: 2, lenCol: 3, lenRow: 1, destructible: true },
      { startCol: 3, startRow: 5, lenCol: 1, lenRow: 4, destructible: false },
      { startCol: 5, startRow: 6, lenCol: 3, lenRow: 1, destructible: true },
      { startCol: 9, startRow: 5, lenCol: 1, lenRow: 5, destructible: true },
      { startCol: 11, startRow: 6, lenCol: 3, lenRow: 1, destructible: false },
      { startCol: 15, startRow: 5, lenCol: 1, lenRow: 4, destructible: true },
      { startCol: 17, startRow: 6, lenCol: 1, lenRow: 3, destructible: false },
      { startCol: 4, startRow: 10, lenCol: 4, lenRow: 1, destructible: true },
      { startCol: 10, startRow: 11, lenCol: 5, lenRow: 1, destructible: true },
      { startCol: 6, startRow: 12, lenCol: 1, lenRow: 2, destructible: false },
      { startCol: 12, startRow: 8, lenCol: 1, lenRow: 3, destructible: true },
    ],
    // Level 3 - maze-like
    [
      { startCol: 2, startRow: 3, lenCol: 6, lenRow: 1, destructible: true },
      { startCol: 10, startRow: 2, lenCol: 1, lenRow: 4, destructible: false },
      { startCol: 12, startRow: 3, lenCol: 5, lenRow: 1, destructible: true },
      { startCol: 5, startRow: 5, lenCol: 1, lenRow: 4, destructible: false },
      { startCol: 7, startRow: 6, lenCol: 3, lenRow: 1, destructible: true },
      { startCol: 12, startRow: 5, lenCol: 1, lenRow: 4, destructible: true },
      { startCol: 14, startRow: 6, lenCol: 4, lenRow: 1, destructible: false },
      { startCol: 2, startRow: 8, lenCol: 3, lenRow: 1, destructible: true },
      { startCol: 7, startRow: 9, lenCol: 4, lenRow: 1, destructible: false },
      { startCol: 15, startRow: 9, lenCol: 1, lenRow: 3, destructible: true },
      { startCol: 3, startRow: 11, lenCol: 5, lenRow: 1, destructible: true },
      { startCol: 9, startRow: 11, lenCol: 1, lenRow: 3, destructible: false },
      { startCol: 11, startRow: 12, lenCol: 4, lenRow: 1, destructible: true },
      { startCol: 17, startRow: 10, lenCol: 1, lenRow: 3, destructible: true },
    ],
  ]

  const layout = layouts[Math.min(level, layouts.length - 1)]!

  for (const p of layout) {
    for (let c = 0; c < p.lenCol; c++) {
      for (let r = 0; r < p.lenRow; r++) {
        const wx = (p.startCol + c) * tile
        const wy = (p.startRow + r) * tile
        if (!isClear(wx, wy)) {
          walls.push({
            x: wx,
            y: wy,
            width: tile,
            height: tile,
            destructible: p.destructible,
            health: p.destructible ? 2 : 999,
          })
        }
      }
    }
  }

  return walls
}
