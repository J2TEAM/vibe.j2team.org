import { ref, computed, type Ref } from 'vue'
import { useEventListener } from '@vueuse/core'

const MIN_SCALE = 0.6
const MAX_SCALE = 5
const ZOOM_STEP = 0.2
const PAN_DRAG_THRESHOLD = 4

export function useMapZoom(containerRef: Ref<HTMLElement | null>) {
  const scale = ref(1)
  const panX = ref(0)
  const panY = ref(0)
  const isPanning = ref(false)
  const wasDragging = ref(false)

  let startX = 0
  let startY = 0
  let startPanX = 0
  let startPanY = 0

  // Pinch state
  let pinchStartDist = 0
  let pinchStartScale = 1
  const activePointers = new Map<number, PointerEvent>()

  const transform = computed(
    () => `translate(${panX.value}px, ${panY.value}px) scale(${scale.value})`,
  )

  const zoomPercent = computed(() => Math.round(scale.value * 100))

  // ---- Zoom helpers ----

  function clampScale(s: number): number {
    return Math.max(MIN_SCALE, Math.min(MAX_SCALE, s))
  }

  function zoomIn() {
    scale.value = clampScale(scale.value + ZOOM_STEP)
  }

  function zoomOut() {
    scale.value = clampScale(scale.value - ZOOM_STEP)
  }

  function resetZoom() {
    scale.value = 1
    panX.value = 0
    panY.value = 0
  }

  // ---- Mouse wheel ----

  function onWheel(e: WheelEvent) {
    e.preventDefault()
    const container = containerRef.value
    if (!container) return

    const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP
    const newScale = clampScale(scale.value + delta)
    if (newScale === scale.value) return

    // Zoom toward cursor
    const rect = container.getBoundingClientRect()
    const cursorX = e.clientX - rect.left - rect.width / 2
    const cursorY = e.clientY - rect.top - rect.height / 2
    const ratio = newScale / scale.value
    panX.value = cursorX - ratio * (cursorX - panX.value)
    panY.value = cursorY - ratio * (cursorY - panY.value)
    scale.value = newScale
  }

  // ---- Pointer (mouse + touch) ----

  function onPointerDown(e: PointerEvent) {
    activePointers.set(e.pointerId, e)

    if (activePointers.size === 1) {
      // Single pointer → start pan
      isPanning.value = true
      wasDragging.value = false
      startX = e.clientX
      startY = e.clientY
      startPanX = panX.value
      startPanY = panY.value
    } else if (activePointers.size === 2) {
      // Second pointer → start pinch
      const pts = Array.from(activePointers.values())
      const p1 = pts[0]!
      const p2 = pts[1]!
      pinchStartDist = Math.hypot(p1.clientX - p2.clientX, p1.clientY - p2.clientY)
      pinchStartScale = scale.value
    }
  }

  function onPointerMove(e: PointerEvent) {
    activePointers.set(e.pointerId, e)

    if (activePointers.size === 2) {
      // Pinch zoom
      const pts = Array.from(activePointers.values())
      const p1 = pts[0]!
      const p2 = pts[1]!
      const dist = Math.hypot(p1.clientX - p2.clientX, p1.clientY - p2.clientY)
      if (pinchStartDist > 0) {
        scale.value = clampScale(pinchStartScale * (dist / pinchStartDist))
      }
      return
    }

    if (!isPanning.value) return
    const dx = e.clientX - startX
    const dy = e.clientY - startY

    if (!wasDragging.value && Math.abs(dx) < PAN_DRAG_THRESHOLD && Math.abs(dy) < PAN_DRAG_THRESHOLD) {
      return // haven't exceeded threshold yet
    }

    wasDragging.value = true
    panX.value = startPanX + dx
    panY.value = startPanY + dy
  }

  function onPointerUp(e: PointerEvent) {
    activePointers.delete(e.pointerId)
    if (activePointers.size === 0) {
      isPanning.value = false
    }
  }

  // Register events
  useEventListener(containerRef, 'wheel', onWheel, { passive: false })
  useEventListener(containerRef, 'pointerdown', onPointerDown)
  useEventListener(window, 'pointermove', onPointerMove)
  useEventListener(window, 'pointerup', onPointerUp)
  useEventListener(window, 'pointercancel', onPointerUp)

  return {
    scale,
    panX,
    panY,
    isPanning,
    wasDragging,
    transform,
    zoomPercent,
    zoomIn,
    zoomOut,
    resetZoom,
  }
}
