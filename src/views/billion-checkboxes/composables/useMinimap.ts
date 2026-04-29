import { watch, type Ref } from 'vue'
import {
  COLS,
  ROWS,
  CELL_SIZE,
  MINIMAP_SIZE,
  GRID_CELL_SIZE,
  GRID_ROWS,
  GRID_COLS,
} from '../constants/gridConfig'

export function useMinimap(
  minimapRef: Ref<HTMLCanvasElement | null>,
  containerRef: Ref<HTMLElement | null>,
  zoom: Ref<number>,
  checkedSet: Ref<Set<number>>,
  spatialGrid: Map<number, number>,
  showMinimap: Ref<boolean>,
) {
  let minimapCtx: CanvasRenderingContext2D | null = null
  let isMinimapDragging = false

  function drawMinimap() {
    if (!minimapRef.value || !showMinimap.value) return

    if (!minimapCtx) {
      minimapCtx = minimapRef.value.getContext('2d', { willReadFrequently: false })
    }
    const ctx = minimapCtx
    if (!ctx) return

    ctx.clearRect(0, 0, MINIMAP_SIZE, MINIMAP_SIZE)

    ctx.fillStyle = '#1a1a1a'
    ctx.fillRect(0, 0, MINIMAP_SIZE, MINIMAP_SIZE)

    const lodFactor = Math.max(1, Math.min(200, Math.ceil(COLS / MINIMAP_SIZE)))
    const sampleStep = lodFactor > 50 ? 10 : 1

    for (let r = 0; r < ROWS; r += lodFactor) {
      for (let c = 0; c < COLS; c += lodFactor) {
        const gridStartRow = Math.floor(r / GRID_CELL_SIZE)
        const gridEndRow = Math.floor(Math.min(r + lodFactor - 1, ROWS - 1) / GRID_CELL_SIZE)
        const gridStartCol = Math.floor(c / GRID_CELL_SIZE)
        const gridEndCol = Math.floor(Math.min(c + lodFactor - 1, COLS - 1) / GRID_CELL_SIZE)

        let hasPixelsInRegion = false
        for (let gr = gridStartRow; gr <= gridEndRow && gr < GRID_ROWS; gr++) {
          for (let gc = gridStartCol; gc <= gridEndCol && gc < GRID_COLS; gc++) {
            if (spatialGrid.has(gr * GRID_COLS + gc)) {
              hasPixelsInRegion = true
              break
            }
          }
          if (hasPixelsInRegion) break
        }

        if (!hasPixelsInRegion) continue

        let filledCount = 0

        for (let dr = 0; dr < lodFactor && r + dr < ROWS; dr += sampleStep) {
          for (let dc = 0; dc < lodFactor && c + dc < COLS; dc += sampleStep) {
            const index = (r + dr) * COLS + (c + dc)
            if (checkedSet.value.has(index)) filledCount++
          }
        }

        if (filledCount > 0) {
          const x = (c / COLS) * MINIMAP_SIZE
          const y = (r / ROWS) * MINIMAP_SIZE
          const w = Math.max(1, (lodFactor / COLS) * MINIMAP_SIZE)
          const h = Math.max(1, (lodFactor / ROWS) * MINIMAP_SIZE)

          const sampledMaxCells =
            Math.ceil(lodFactor / sampleStep) * Math.ceil(lodFactor / sampleStep)
          const density = filledCount / sampledMaxCells
          const opacity = Math.max(0.3, Math.min(1, density))

          ctx.fillStyle = `rgba(255, 107, 74, ${opacity})`
          ctx.fillRect(x, y, w, h)
        }
      }
    }

    if (containerRef.value) {
      const { scrollLeft, scrollTop, clientWidth, clientHeight } = containerRef.value

      const totalWidth = COLS * CELL_SIZE * zoom.value
      const totalHeight = ROWS * CELL_SIZE * zoom.value

      const viewX = (scrollLeft / totalWidth) * MINIMAP_SIZE
      const viewY = (scrollTop / totalHeight) * MINIMAP_SIZE
      const viewW = (clientWidth / totalWidth) * MINIMAP_SIZE
      const viewH = (clientHeight / totalHeight) * MINIMAP_SIZE

      ctx.strokeStyle = '#00d9ff'
      ctx.lineWidth = 2
      ctx.strokeRect(viewX, viewY, viewW, viewH)

      ctx.fillStyle = 'rgba(0, 217, 255, 0.1)'
      ctx.fillRect(viewX, viewY, viewW, viewH)
    }
  }

  function handleMinimapPointerDown(e: PointerEvent) {
    if (!minimapRef.value || !containerRef.value) return

    isMinimapDragging = true
    minimapRef.value.setPointerCapture(e.pointerId)

    updateScrollFromMinimap(e)
  }

  function handleMinimapPointerMove(e: PointerEvent) {
    if (!isMinimapDragging) return
    updateScrollFromMinimap(e)
  }

  function handleMinimapPointerUp(e: PointerEvent) {
    if (!minimapRef.value) return
    isMinimapDragging = false
    minimapRef.value.releasePointerCapture(e.pointerId)
  }

  function updateScrollFromMinimap(e: PointerEvent) {
    if (!minimapRef.value || !containerRef.value) return

    const rect = minimapRef.value.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const totalWidth = COLS * CELL_SIZE * zoom.value
    const totalHeight = ROWS * CELL_SIZE * zoom.value

    const targetScrollX = (x / MINIMAP_SIZE) * totalWidth
    const targetScrollY = (y / MINIMAP_SIZE) * totalHeight

    containerRef.value.scrollLeft = targetScrollX - containerRef.value.clientWidth / 2
    containerRef.value.scrollTop = targetScrollY - containerRef.value.clientHeight / 2
  }

  watch(showMinimap, (enabled) => {
    if (enabled) {
      requestAnimationFrame(() => drawMinimap())
    }
  })

  return {
    drawMinimap,
    handleMinimapPointerDown,
    handleMinimapPointerMove,
    handleMinimapPointerUp,
  }
}
