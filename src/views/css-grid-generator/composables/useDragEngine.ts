import { ref, type Ref } from 'vue'
import { useEventListener } from '@vueuse/core'
import type { GridConfig, GridItem } from '../types'

interface DragState {
  itemId: number
  mode: 'move' | 'resize'
  startX: number
  startY: number
  startCol: number
  startRow: number
  startColSpan: number
  startRowSpan: number
}

export function useDragEngine(
  config: GridConfig,
  items: Ref<GridItem[]>,
  canPlace: (
    col: number,
    row: number,
    colSpan: number,
    rowSpan: number,
    excludeId?: number,
  ) => boolean,
  moveItem: (id: number, newCol: number, newRow: number) => boolean,
  resizeItem: (id: number, newColSpan: number, newRowSpan: number) => boolean,
) {
  const dragState = ref<DragState | null>(null)
  const previewCol = ref<number | null>(null)
  const previewRow = ref<number | null>(null)
  const previewColSpan = ref<number | null>(null)
  const previewRowSpan = ref<number | null>(null)
  const isDragging = ref(false)

  let gridEl: HTMLElement | null = null
  let cellWidth = 0
  let cellHeight = 0

  const setGridElement = (el: HTMLElement | null) => {
    gridEl = el
  }

  const measureCells = () => {
    if (!gridEl) return

    const rect = gridEl.getBoundingClientRect()
    const totalGapX = config.gap * (config.columns - 1)
    const totalGapY = config.gap * (config.rows - 1)
    cellWidth = (rect.width - totalGapX) / config.columns
    cellHeight = (rect.height - totalGapY) / config.rows
  }

  const getCellFromPoint = (clientX: number, clientY: number): { col: number; row: number } => {
    if (!gridEl) return { col: 1, row: 1 }

    const rect = gridEl.getBoundingClientRect()
    const relX = clientX - rect.left
    const relY = clientY - rect.top

    const cellPlusGapW = cellWidth + config.gap
    const cellPlusGapH = cellHeight + config.gap

    const col = Math.max(1, Math.min(config.columns, Math.floor(relX / cellPlusGapW) + 1))
    const row = Math.max(1, Math.min(config.rows, Math.floor(relY / cellPlusGapH) + 1))

    return { col, row }
  }

  const startDrag = (itemId: number, mode: 'move' | 'resize', event: PointerEvent) => {
    event.preventDefault()
    event.stopPropagation()

    const item = items.value.find((i) => i.id === itemId)
    if (!item) return

    measureCells()

    dragState.value = {
      itemId,
      mode,
      startX: event.clientX,
      startY: event.clientY,
      startCol: item.col,
      startRow: item.row,
      startColSpan: item.colSpan,
      startRowSpan: item.rowSpan,
    }

    isDragging.value = true

    if (mode === 'move') {
      previewCol.value = item.col
      previewRow.value = item.row
      previewColSpan.value = item.colSpan
      previewRowSpan.value = item.rowSpan
    } else {
      previewCol.value = item.col
      previewRow.value = item.row
      previewColSpan.value = item.colSpan
      previewRowSpan.value = item.rowSpan
    }
  }

  const onPointerMove = (event: PointerEvent) => {
    const state = dragState.value
    if (!state) return

    const item = items.value.find((i) => i.id === state.itemId)
    if (!item) return

    if (state.mode === 'move') {
      const cellPlusGapW = cellWidth + config.gap
      const cellPlusGapH = cellHeight + config.gap

      const deltaX = event.clientX - state.startX
      const deltaY = event.clientY - state.startY

      const colDelta = Math.round(deltaX / cellPlusGapW)
      const rowDelta = Math.round(deltaY / cellPlusGapH)

      let newCol = state.startCol + colDelta
      let newRow = state.startRow + rowDelta

      newCol = Math.max(1, Math.min(config.columns - item.colSpan + 1, newCol))
      newRow = Math.max(1, Math.min(config.rows - item.rowSpan + 1, newRow))

      previewCol.value = newCol
      previewRow.value = newRow
      previewColSpan.value = item.colSpan
      previewRowSpan.value = item.rowSpan
    } else {
      const { col: endCol, row: endRow } = getCellFromPoint(event.clientX, event.clientY)

      let newColSpan = Math.max(1, endCol - state.startCol + 1)
      let newRowSpan = Math.max(1, endRow - state.startRow + 1)

      newColSpan = Math.min(newColSpan, config.columns - state.startCol + 1)
      newRowSpan = Math.min(newRowSpan, config.rows - state.startRow + 1)

      previewCol.value = state.startCol
      previewRow.value = state.startRow
      previewColSpan.value = newColSpan
      previewRowSpan.value = newRowSpan
    }
  }

  const onPointerUp = () => {
    const state = dragState.value
    if (!state) return

    if (state.mode === 'move') {
      const newCol = previewCol.value ?? state.startCol
      const newRow = previewRow.value ?? state.startRow

      if (newCol !== state.startCol || newRow !== state.startRow) {
        moveItem(state.itemId, newCol, newRow)
      }
    } else {
      const newColSpan = previewColSpan.value ?? state.startColSpan
      const newRowSpan = previewRowSpan.value ?? state.startRowSpan

      if (newColSpan !== state.startColSpan || newRowSpan !== state.startRowSpan) {
        resizeItem(state.itemId, newColSpan, newRowSpan)
      }
    }

    dragState.value = null
    isDragging.value = false
    previewCol.value = null
    previewRow.value = null
    previewColSpan.value = null
    previewRowSpan.value = null
  }

  useEventListener(window, 'pointermove', onPointerMove)
  useEventListener(window, 'pointerup', onPointerUp)

  return {
    dragState,
    previewCol,
    previewRow,
    previewColSpan,
    previewRowSpan,
    isDragging,
    startDrag,
    setGridElement,
  }
}
