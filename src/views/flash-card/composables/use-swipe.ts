import { ref, watch, onUnmounted, type Ref } from 'vue'

interface SwipeOptions {
  onSwipeLeft: () => void
  onSwipeRight: () => void
  threshold?: number
}

export function useSwipe(elementRef: Ref<HTMLElement | null>, options: SwipeOptions) {
  const threshold = options.threshold ?? 80
  const offsetX = ref(0)
  const isDragging = ref(false)
  const wasDragged = ref(false)

  let startX = 0
  let startY = 0
  let locked = false
  let cancelled = false
  let currentEl: HTMLElement | null = null

  function pointerDown(x: number, y: number) {
    startX = x
    startY = y
    isDragging.value = true
    wasDragged.value = false
    locked = false
    cancelled = false
    offsetX.value = 0
  }

  function pointerMove(x: number, y: number) {
    if (!isDragging.value || cancelled) return

    const dx = x - startX
    const dy = y - startY

    if (!locked) {
      if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
        if (Math.abs(dy) > Math.abs(dx)) {
          cancelled = true
          offsetX.value = 0
          return
        }
        locked = true
        wasDragged.value = true
      } else {
        return
      }
    }

    offsetX.value = dx
  }

  function pointerUp() {
    if (!isDragging.value) return
    isDragging.value = false

    if (cancelled) {
      offsetX.value = 0
      return
    }

    const dx = offsetX.value

    if (Math.abs(dx) > threshold) {
      const direction = dx > 0 ? 1 : -1
      flyOff(direction, dx > 0 ? options.onSwipeRight : options.onSwipeLeft)
    } else {
      snapBack()
    }
  }

  function flyOff(direction: number, callback: () => void) {
    const el = currentEl
    if (!el) {
      offsetX.value = 0
      callback()
      return
    }

    const target = direction * (window.innerWidth + 100)
    el.style.transition = 'transform 0.35s cubic-bezier(0.4, 0, 1, 1), opacity 0.35s ease'
    el.style.transform = `translateX(${target}px) rotate(${direction * 20}deg)`
    el.style.opacity = '0'

    setTimeout(() => {
      el.style.transition = 'none'
      el.style.transform = ''
      el.style.opacity = ''
      offsetX.value = 0
      callback()
      // Clear leftover inline transition style
      requestAnimationFrame(() => {
        el.style.transition = ''
      })
    }, 350)
  }

  function snapBack() {
    offsetX.value = 0
  }

  function triggerSwipe(direction: 'left' | 'right') {
    const callback = direction === 'right' ? options.onSwipeRight : options.onSwipeLeft
    const dir = direction === 'right' ? 1 : -1
    flyOff(dir, callback)
  }

  // --- Touch events ---
  function onTouchStart(e: TouchEvent) {
    const touch = e.touches[0]
    if (!touch) return
    pointerDown(touch.clientX, touch.clientY)
  }

  function onTouchMove(e: TouchEvent) {
    const touch = e.touches[0]
    if (!touch) return
    pointerMove(touch.clientX, touch.clientY)
  }

  function onTouchEnd() {
    pointerUp()
  }

  // --- Mouse events ---
  function onMouseDown(e: MouseEvent) {
    if (e.button !== 0) return
    e.preventDefault()
    pointerDown(e.clientX, e.clientY)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }

  function onMouseMove(e: MouseEvent) {
    pointerMove(e.clientX, e.clientY)
  }

  function onMouseUp() {
    pointerUp()
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('mouseup', onMouseUp)
  }

  function attachListeners(el: HTMLElement) {
    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchmove', onTouchMove, { passive: true })
    el.addEventListener('touchend', onTouchEnd, { passive: true })
    el.addEventListener('mousedown', onMouseDown)
  }

  function detachListeners(el: HTMLElement) {
    el.removeEventListener('touchstart', onTouchStart)
    el.removeEventListener('touchmove', onTouchMove)
    el.removeEventListener('touchend', onTouchEnd)
    el.removeEventListener('mousedown', onMouseDown)
  }

  // Watch for element appearing/disappearing (handles v-if)
  watch(
    elementRef,
    (newEl, oldEl) => {
      if (oldEl) detachListeners(oldEl)
      if (newEl) attachListeners(newEl)
      currentEl = newEl
    },
    { immediate: true },
  )

  onUnmounted(() => {
    if (currentEl) detachListeners(currentEl)
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('mouseup', onMouseUp)
  })

  return { offsetX, isDragging, wasDragged, triggerSwipe }
}
