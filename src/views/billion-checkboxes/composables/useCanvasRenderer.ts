import { type Ref } from 'vue'
import {
  CELL_SIZE,
  COLS,
  ROWS,
  GRID_CELL_SIZE,
  GRID_ROWS,
  GRID_COLS,
} from '../constants/gridConfig'

export function useCanvasRenderer(
  canvasRef: Ref<HTMLCanvasElement | null>,
  containerRef: Ref<HTMLElement | null>,
  zoom: Ref<number>,
  checkedSet: Ref<Set<number>>,
  spatialGrid: Map<number, number>,
) {
  let cachedCtx: CanvasRenderingContext2D | null = null
  let drawScheduled = false

  function draw() {
    if (drawScheduled) return
    drawScheduled = true

    requestAnimationFrame(() => {
      drawScheduled = false

      if (!canvasRef.value || !containerRef.value) return
      if (!cachedCtx) {
        cachedCtx = canvasRef.value.getContext('2d', { willReadFrequently: false })
      }
      let ctx = cachedCtx
      if (!ctx) return

      const { clientWidth, clientHeight, scrollLeft, scrollTop } = containerRef.value

      if (clientWidth === 0 || clientHeight === 0) return

      if (canvasRef.value.width !== clientWidth || canvasRef.value.height !== clientHeight) {
        canvasRef.value.width = clientWidth
        canvasRef.value.height = clientHeight
        cachedCtx = null // Context is lost on resize, force re-fetch
        ctx = canvasRef.value.getContext('2d', { willReadFrequently: false })
        if (!ctx) return
        cachedCtx = ctx
      }

      ctx.clearRect(0, 0, clientWidth, clientHeight)

      const cellSize = CELL_SIZE * zoom.value

      let lodFactor = 1
      if (zoom.value < 0.1) {
        lodFactor = Math.max(1, Math.min(200, Math.floor(1 / zoom.value / 10)))
      }

      const startCol = Math.floor(scrollLeft / cellSize / lodFactor) * lodFactor
      const startRow = Math.floor(scrollTop / cellSize / lodFactor) * lodFactor
      const endCol = Math.min(
        COLS - 1,
        Math.ceil((scrollLeft + clientWidth) / cellSize / lodFactor) * lodFactor,
      )
      const endRow = Math.min(
        ROWS - 1,
        Math.ceil((scrollTop + clientHeight) / cellSize / lodFactor) * lodFactor,
      )

      const offsetX = -scrollLeft
      const offsetY = -scrollTop

      if (clientWidth > 600 && zoom.value >= 0.5 && lodFactor === 1) {
        ctx.strokeStyle = '#33333320'
        ctx.lineWidth = 0.5
        ctx.beginPath()
        for (let c = startCol; c <= endCol; c++) {
          const x = offsetX + c * cellSize
          ctx.moveTo(x, 0)
          ctx.lineTo(x, clientHeight)
        }
        for (let r = startRow; r <= endRow; r++) {
          const y = offsetY + r * cellSize
          ctx.moveTo(0, y)
          ctx.lineTo(clientWidth, y)
        }
        ctx.stroke()
      }

      if (lodFactor > 1) {
        for (let r = startRow; r <= endRow; r += lodFactor) {
          for (let c = startCol; c <= endCol; c += lodFactor) {
            const gridStartRow = Math.floor(r / GRID_CELL_SIZE)
            const gridEndRow = Math.floor((r + lodFactor - 1) / GRID_CELL_SIZE)
            const gridStartCol = Math.floor(c / GRID_CELL_SIZE)
            const gridEndCol = Math.floor((c + lodFactor - 1) / GRID_CELL_SIZE)

            let totalFilledInRegion = 0
            for (let gr = gridStartRow; gr <= gridEndRow && gr < GRID_ROWS; gr++) {
              for (let gc = gridStartCol; gc <= gridEndCol && gc < GRID_COLS; gc++) {
                const gridIndex = gr * GRID_COLS + gc
                totalFilledInRegion += spatialGrid.get(gridIndex) || 0
              }
            }

            if (totalFilledInRegion === 0) continue

            let filledCount = 0
            // At high zoom-out levels, approximate density using pre-computed spatial grid totals for performance.

            if (lodFactor >= GRID_CELL_SIZE / 2) {
              filledCount = totalFilledInRegion
              // Approximate density based on region area covered
              const cellsInRegion = lodFactor * lodFactor
              const density = Math.min(1, filledCount / cellsInRegion)
              const opacity = zoom.value < 0.01 ? 0.6 : Math.max(0.2, density)

              const x = offsetX + c * cellSize
              const y = offsetY + r * cellSize
              const groupSize = lodFactor * cellSize
              ctx.fillStyle = `rgba(255, 107, 74, ${opacity})`
              ctx.fillRect(x, y, groupSize, groupSize)
            } else {
              // Exact count for small lod factors
              const useSampling = lodFactor > 50
              const sampleStep = useSampling ? Math.max(1, Math.floor(lodFactor / 10)) : 1
              let sampledCells = 0

              for (let dr = 0; dr < lodFactor && r + dr < ROWS; dr += sampleStep) {
                for (let dc = 0; dc < lodFactor && c + dc < COLS; dc += sampleStep) {
                  const index = (r + dr) * COLS + (c + dc)
                  if (checkedSet.value.has(index)) filledCount++
                  sampledCells++
                }
              }

              if (filledCount > 0) {
                const x = offsetX + c * cellSize
                const y = offsetY + r * cellSize
                const groupSize = lodFactor * cellSize

                const density = useSampling
                  ? filledCount / sampledCells
                  : filledCount / (lodFactor * lodFactor)

                const opacity = zoom.value < 0.01 ? 0.6 : Math.max(0.2, density)

                ctx.fillStyle = `rgba(255, 107, 74, ${opacity})`
                ctx.fillRect(x, y, groupSize, groupSize)
              }
            }
          }
        }
      } else {
        const gridStartRow = Math.floor(startRow / GRID_CELL_SIZE)
        const gridEndRow = Math.ceil(endRow / GRID_CELL_SIZE)
        const gridStartCol = Math.floor(startCol / GRID_CELL_SIZE)
        const gridEndCol = Math.ceil(endCol / GRID_CELL_SIZE)

        ctx.fillStyle = '#ff6b4a'
        ctx.beginPath()
        let pathCount = 0

        for (let gr = gridStartRow; gr <= gridEndRow && gr < GRID_ROWS; gr++) {
          for (let gc = gridStartCol; gc <= gridEndCol && gc < GRID_COLS; gc++) {
            const gridIndex = gr * GRID_COLS + gc
            if (!spatialGrid.has(gridIndex)) continue

            const cellStartRow = Math.max(startRow, gr * GRID_CELL_SIZE)
            const cellEndRow = Math.min(endRow, (gr + 1) * GRID_CELL_SIZE - 1)
            const cellStartCol = Math.max(startCol, gc * GRID_CELL_SIZE)
            const cellEndCol = Math.min(endCol, (gc + 1) * GRID_CELL_SIZE - 1)

            for (let r = cellStartRow; r <= cellEndRow; r++) {
              for (let c = cellStartCol; c <= cellEndCol; c++) {
                const index = r * COLS + c
                if (checkedSet.value.has(index)) {
                  const x = offsetX + c * cellSize
                  const y = offsetY + r * cellSize
                  ctx.rect(x, y, cellSize, cellSize)
                  pathCount++

                  if (pathCount > 500) {
                    ctx.fill()
                    ctx.beginPath()
                    pathCount = 0
                  }
                }
              }
            }
          }
        }
        if (pathCount > 0) ctx.fill()
      }
    })
  }

  return {
    draw,
  }
}
