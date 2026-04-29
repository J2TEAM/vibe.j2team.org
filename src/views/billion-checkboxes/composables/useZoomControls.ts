import { ref, computed, type Ref } from 'vue'
import { ZOOM_LEVELS, DEFAULT_ZOOM_INDEX, COLS, ROWS, CELL_SIZE } from '../constants/gridConfig'

export function useZoomControls(
  containerRef: Ref<HTMLElement | null>,
  draw: () => void,
  drawMinimap: () => void,
  showMinimap: Ref<boolean>,
) {
  const zoomIndex = ref(DEFAULT_ZOOM_INDEX)
  const zoom = computed(() => ZOOM_LEVELS[zoomIndex.value] ?? 1)

  function zoomIn() {
    if (zoomIndex.value < ZOOM_LEVELS.length - 1) {
      zoomIndex.value++
      requestAnimationFrame(() => draw())
      if (showMinimap.value) requestAnimationFrame(() => drawMinimap())
    }
  }

  function zoomOut() {
    if (zoomIndex.value > 0) {
      zoomIndex.value--
      requestAnimationFrame(() => draw())
      if (showMinimap.value) requestAnimationFrame(() => drawMinimap())
    }
  }

  function resetZoom() {
    zoomIndex.value = DEFAULT_ZOOM_INDEX
    requestAnimationFrame(() => draw())
    if (showMinimap.value) requestAnimationFrame(() => drawMinimap())
  }

  function fitToScreen() {
    if (!containerRef.value) return
    const { clientWidth, clientHeight } = containerRef.value

    const totalWidth = COLS * CELL_SIZE
    const totalHeight = ROWS * CELL_SIZE

    const zoomX = clientWidth / totalWidth
    const zoomY = clientHeight / totalHeight
    const targetZoom = Math.min(zoomX, zoomY) * 0.95 // 95% to add padding

    let closestIndex = 0
    let minDiff = Math.abs(ZOOM_LEVELS[0]! - targetZoom)

    for (let i = 1; i < ZOOM_LEVELS.length; i++) {
      const diff = Math.abs(ZOOM_LEVELS[i]! - targetZoom)
      if (diff < minDiff) {
        minDiff = diff
        closestIndex = i
      }
    }

    zoomIndex.value = closestIndex

    setTimeout(() => {
      if (containerRef.value) {
        const scrollX = (totalWidth * zoom.value - clientWidth) / 2
        const scrollY = (totalHeight * zoom.value - clientHeight) / 2
        containerRef.value.scrollLeft = Math.max(0, scrollX)
        containerRef.value.scrollTop = Math.max(0, scrollY)
      }
    }, 50)

    requestAnimationFrame(() => draw())
    if (showMinimap.value) requestAnimationFrame(() => drawMinimap())
  }

  function handleKeyboard(e: KeyboardEvent) {
    if ((e.ctrlKey || e.metaKey) && (e.key === '+' || e.key === '=')) {
      e.preventDefault()
      zoomIn()
    } else if ((e.ctrlKey || e.metaKey) && e.key === '-') {
      e.preventDefault()
      zoomOut()
    } else if ((e.ctrlKey || e.metaKey) && e.key === '0') {
      e.preventDefault()
      resetZoom()
    }
  }

  function handleWheel(e: WheelEvent) {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault()

      const prevZoom = zoom.value

      if (e.deltaY < 0) {
        zoomIn()
      } else {
        zoomOut()
      }

      if (containerRef.value && prevZoom !== zoom.value) {
        const rect = containerRef.value.getBoundingClientRect()
        const mouseX = e.clientX - rect.left
        const mouseY = e.clientY - rect.top

        const zoomRatio = zoom.value / prevZoom

        containerRef.value.scrollLeft =
          (containerRef.value.scrollLeft + mouseX) * zoomRatio - mouseX
        containerRef.value.scrollTop = (containerRef.value.scrollTop + mouseY) * zoomRatio - mouseY
      }
    }
  }

  return {
    zoomIndex,
    zoom,
    zoomIn,
    zoomOut,
    resetZoom,
    fitToScreen,
    handleKeyboard,
    handleWheel,
  }
}
