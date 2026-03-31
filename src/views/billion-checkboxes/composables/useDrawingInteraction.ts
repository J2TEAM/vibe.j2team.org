import { ref, type Ref } from 'vue'
import { CELL_SIZE, COLS, ROWS } from '../constants/gridConfig'

export function useDrawingInteraction(
  containerRef: Ref<HTMLElement | null>,
  zoom: Ref<number>,
  togglePixel: (index: number) => boolean,
  setPixel: (index: number, state: boolean) => void,
  updateSpatialGrid: (index: number, isAdding: boolean) => void,
  scheduleDraw: () => void,
  pendingAdd: Set<number>,
  pendingDel: Set<number>,
) {
  const isDrawMode = ref(false)
  let isPointerDown = false
  let drawState: boolean | null = null

  // Panning state
  let isPanning = false
  let startPanX = 0
  let startPanY = 0
  let startScrollLeft = 0
  let startScrollTop = 0

  function getCellFromEvent(e: PointerEvent | MouseEvent) {
    if (!containerRef.value) return null
    const { scrollLeft, scrollTop } = containerRef.value
    const rect = containerRef.value.getBoundingClientRect()
    const x = e.clientX - rect.left + scrollLeft
    const y = e.clientY - rect.top + scrollTop
    const cellSize = CELL_SIZE * zoom.value

    const col = Math.floor(x / cellSize)
    const row = Math.floor(y / cellSize)

    if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return null
    return row * COLS + col
  }

  function handlePointerDown(e: PointerEvent) {
    if (isDrawMode.value) {
      if (e.pointerType !== 'mouse') {
        containerRef.value?.setPointerCapture(e.pointerId)
      }
      isPointerDown = true
      const index = getCellFromEvent(e)
      if (index !== null) {
        drawState = togglePixel(index)
        updateSpatialGrid(index, drawState)

        if (drawState) {
          pendingAdd.add(index)
          pendingDel.delete(index)
        } else {
          pendingDel.add(index)
          pendingAdd.delete(index)
        }

        scheduleDraw()
      }
    } else {
      // Pan mode: Only apply custom JS drag-to-scroll for mouse.
      // Touch devices use native momentum scrolling natively.
      if (!containerRef.value || e.pointerType !== 'mouse') return

      isPanning = true
      startPanX = e.clientX
      startPanY = e.clientY
      startScrollLeft = containerRef.value.scrollLeft
      startScrollTop = containerRef.value.scrollTop
      containerRef.value.setPointerCapture(e.pointerId)
    }
  }

  function handlePointerMove(e: PointerEvent) {
    if (isDrawMode.value && isPointerDown && drawState !== null) {
      const index = getCellFromEvent(e)
      if (index !== null) {
        setPixel(index, drawState)
        updateSpatialGrid(index, drawState)

        if (drawState) {
          pendingAdd.add(index)
          pendingDel.delete(index)
        } else {
          pendingDel.add(index)
          pendingAdd.delete(index)
        }

        scheduleDraw()
      }
    } else if (isPanning && containerRef.value) {
      const dx = e.clientX - startPanX
      const dy = e.clientY - startPanY
      containerRef.value.scrollLeft = startScrollLeft - dx
      containerRef.value.scrollTop = startScrollTop - dy
    }
  }

  function handlePointerUp(e: PointerEvent) {
    if (isDrawMode.value) {
      isPointerDown = false
      drawState = null
      if (e.pointerType !== 'mouse' && containerRef.value?.hasPointerCapture(e.pointerId)) {
        containerRef.value.releasePointerCapture(e.pointerId)
      }
    } else {
      isPanning = false
      if (containerRef.value?.hasPointerCapture(e.pointerId)) {
        containerRef.value.releasePointerCapture(e.pointerId)
      }
    }
  }

  return {
    isDrawMode,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
  }
}
