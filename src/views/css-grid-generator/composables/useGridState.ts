import { reactive, ref, computed } from 'vue'
import {
  DEFAULT_CONFIG,
  ITEM_COLORS,
  MAX_COLS,
  MAX_GAP,
  MAX_ROWS,
  MIN_COLS,
  MIN_GAP,
  MIN_ROWS,
  type GridConfig,
  type GridItem,
} from '../types'

export function useGridState() {
  const config = reactive<GridConfig>({ ...DEFAULT_CONFIG })
  const items = ref<GridItem[]>([])
  let nextId = 1

  const clampConfig = () => {
    config.columns = Math.max(MIN_COLS, Math.min(MAX_COLS, Math.round(config.columns)))
    config.rows = Math.max(MIN_ROWS, Math.min(MAX_ROWS, Math.round(config.rows)))
    config.gap = Math.max(MIN_GAP, Math.min(MAX_GAP, Math.round(config.gap)))
  }

  const occupancyMap = computed(() => {
    const map: boolean[][] = []
    for (let r = 1; r <= config.rows; r++) {
      const row: boolean[] = []
      for (let c = 1; c <= config.columns; c++) {
        row.push(false)
      }
      map.push(row)
    }

    items.value.forEach((item) => {
      for (let r = item.row; r < item.row + item.rowSpan; r++) {
        for (let c = item.col; c < item.col + item.colSpan; c++) {
          if (r >= 1 && r <= config.rows && c >= 1 && c <= config.columns) {
            map[r - 1]![c - 1] = true
          }
        }
      }
    })

    return map
  })

  const isCellOccupied = (col: number, row: number): boolean => {
    if (row < 1 || row > config.rows || col < 1 || col > config.columns) return true
    return occupancyMap.value[row - 1]?.[col - 1] ?? true
  }

  const canPlace = (
    col: number,
    row: number,
    colSpan: number,
    rowSpan: number,
    excludeId?: number,
  ): boolean => {
    if (col < 1 || row < 1) return false
    if (col + colSpan - 1 > config.columns) return false
    if (row + rowSpan - 1 > config.rows) return false

    for (let r = row; r < row + rowSpan; r++) {
      for (let c = col; c < col + colSpan; c++) {
        const occupant = items.value.find((item) => {
          if (item.id === excludeId) return false
          return (
            c >= item.col &&
            c < item.col + item.colSpan &&
            r >= item.row &&
            r < item.row + item.rowSpan
          )
        })
        if (occupant) return false
      }
    }

    return true
  }

  const addItem = (col: number, row: number): GridItem | null => {
    if (!canPlace(col, row, 1, 1)) return null

    const color = ITEM_COLORS[(nextId - 1) % ITEM_COLORS.length]!
    const item: GridItem = {
      id: nextId++,
      col,
      row,
      colSpan: 1,
      rowSpan: 1,
      color,
    }

    items.value = [...items.value, item]
    return item
  }

  const removeItem = (id: number) => {
    items.value = items.value.filter((item) => item.id !== id)
  }

  const moveItem = (id: number, newCol: number, newRow: number): boolean => {
    const item = items.value.find((i) => i.id === id)
    if (!item) return false
    if (!canPlace(newCol, newRow, item.colSpan, item.rowSpan, id)) return false

    item.col = newCol
    item.row = newRow
    items.value = [...items.value]
    return true
  }

  const resizeItem = (id: number, newColSpan: number, newRowSpan: number): boolean => {
    const item = items.value.find((i) => i.id === id)
    if (!item) return false

    const clampedColSpan = Math.max(1, Math.min(newColSpan, config.columns - item.col + 1))
    const clampedRowSpan = Math.max(1, Math.min(newRowSpan, config.rows - item.row + 1))

    if (!canPlace(item.col, item.row, clampedColSpan, clampedRowSpan, id)) return false

    item.colSpan = clampedColSpan
    item.rowSpan = clampedRowSpan
    items.value = [...items.value]
    return true
  }

  const resetItems = () => {
    items.value = []
    nextId = 1
  }

  const pruneOutOfBounds = () => {
    items.value = items.value.filter((item) => {
      return item.col <= config.columns && item.row <= config.rows
    })

    items.value.forEach((item) => {
      if (item.col + item.colSpan - 1 > config.columns) {
        item.colSpan = config.columns - item.col + 1
      }
      if (item.row + item.rowSpan - 1 > config.rows) {
        item.rowSpan = config.rows - item.row + 1
      }
    })

    items.value = [...items.value]
  }

  return {
    config,
    items,
    occupancyMap,
    isCellOccupied,
    canPlace,
    addItem,
    removeItem,
    moveItem,
    resizeItem,
    resetItems,
    clampConfig,
    pruneOutOfBounds,
  }
}
