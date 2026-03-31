import { onMounted, onUnmounted } from 'vue'
import { useBehaviorStore } from './useBehaviorStore'
import { useEventListener, useThrottleFn } from '@vueuse/core'

export function useBehaviorTracker() {
  const store = useBehaviorStore()
  let idleTimer: number | null = null
  let lastActive = Date.now()
  const sessionStart = Date.now()
  let clickTimestamps: number[] = []

  let lastMouseX = -1
  let lastMouseY = -1
  let lastMouseMoveTime = 0
  let escapeHoldTimer: number | null = null

  // Throttle to avoid tracking noise, max 10 clicks recorded logically per 1.5s
  const throttledUpdateMove = useThrottleFn(() => store.updateMove(), 150)

  function checkIdle() {
    const now = Date.now()
    const diff = now - lastActive
    store.updateIdle(diff)
    store.totalTime = now - sessionStart
    store.lastDuration = store.totalTime

    if (store.phase < 8 && !store.hasEscaped) {
      evaluatePhase()
    }
  }

  function handleInteraction() {
    lastActive = Date.now()
    store.resetIdle()
  }

  function handleClick(e: MouseEvent | TouchEvent) {
    handleInteraction()
    store.updateClick()

    const now = Date.now()
    clickTimestamps.push(now)
    clickTimestamps = clickTimestamps.filter((t) => now - t < 1500)
    store.setRapid(clickTimestamps.length >= 3)

    if (e.type === 'touchstart') {
      store.setMobileSpam(clickTimestamps.length > 4)
    }

    // Reverse control check
    if (store.phase === 6 && store.reverseControlActive) {
      let cx = 0,
        cy = 0
      if (e instanceof MouseEvent) {
        cx = e.clientX
        cy = e.clientY
      } else if (e.touches && e.touches[0]) {
        cx = e.touches[0].clientX
        cy = e.touches[0].clientY
      }

      if (cx > window.innerWidth - 100 && cy < 100) {
        store.hasFollowedInstruction = true
      }
    }

    setTimeout(() => {
      if (store.phase < 8 && !store.hasEscaped) evaluatePhase()
    }, 50)

    store.predictionTarget.show = false
  }

  function handleMoveRaw(e: MouseEvent | TouchEvent) {
    handleInteraction()
    throttledUpdateMove()

    const now = Date.now()
    let clientX = 0,
      cy = 0
    if (e instanceof MouseEvent) {
      clientX = e.clientX
      cy = e.clientY
    } else if (e.touches?.[0]) {
      clientX = e.touches[0].clientX
      cy = e.touches[0].clientY
    }

    if (lastMouseX >= 0) {
      const dist = Math.hypot(clientX - lastMouseX, cy - lastMouseY)
      const timeDiff = now - lastMouseMoveTime
      if (timeDiff > 0) store.isFastMoving = dist / timeDiff > 4
    }

    // Intentional Prediction Logic based on velocity vector
    if (store.phase >= 2 && store.phase < 7 && !store.predictionTarget.show) {
      const diffX = clientX - lastMouseX
      const diffY = cy - lastMouseY
      const velocity = Math.hypot(diffX, diffY)

      if (velocity > 25 && Math.random() < 0.2) {
        store.predictionTarget = {
          x: clientX + diffX * 12,
          y: cy + diffY * 12,
          show: true,
        }
      }
    }

    lastMouseX = clientX
    lastMouseY = cy
    lastMouseMoveTime = now
  }

  const handleMove = useThrottleFn(handleMoveRaw, 40)

  // Hidden Escape Mechanism: 3s hold
  function handleMouseDown() {
    if (store.phase >= 3 && store.phase < 8) {
      escapeHoldTimer = window.setTimeout(() => {
        store.escape()
      }, 3000)
    }
  }

  function handleMouseUp() {
    if (escapeHoldTimer) clearTimeout(escapeHoldTimer)
  }

  function evaluatePhase() {
    if (store.hasEscaped) return
    const { clicks, mouseMoves, idleTime, totalTime } = store

    // Smoother scoring curve to avoid instant early acceleration
    const score =
      clicks * 15 + mouseMoves * 0.2 + Math.min(idleTime, 15000) / 100 + totalTime / 1000

    let newPhase = store.phase
    if (score > 6000)
      newPhase = 8 // Fake Ending
    else if (score > 4800)
      newPhase = 7 // Collapse
    else if (score > 3600)
      newPhase = 6 // Control
    else if (score > 2200)
      newPhase = 5 // Pressure
    else if (score > 1200)
      newPhase = 4 // Disturb
    else if (score > 550)
      newPhase = 3 // Judgment
    else if (score > 180)
      newPhase = 2 // Observation
    else newPhase = 1

    if (newPhase > store.phase) {
      store.setPhase(newPhase)
      if (newPhase === 2) store.determinePersonality()
      if (newPhase === 6) store.reverseControlActive = true

      if (newPhase === 8) {
        window.setTimeout(() => {
          store.setPhase(9)
        }, 5000)
      }
    }
  }

  onMounted(() => {
    store.visitCount++
    idleTimer = window.setInterval(checkIdle, 500)

    useEventListener(document, 'mousemove', handleMove, { passive: true })
    useEventListener(document, 'touchmove', handleMove, { passive: true })
    useEventListener(document, 'click', handleClick, { passive: true })
    useEventListener(document, 'touchstart', handleClick, { passive: true })

    useEventListener(document, 'mousedown', handleMouseDown, { passive: true })
    useEventListener(document, 'touchstart', handleMouseDown, { passive: true })
    useEventListener(document, 'mouseup', handleMouseUp, { passive: true })
    useEventListener(document, 'touchend', handleMouseUp, { passive: true })
    useEventListener(document, 'touchcancel', handleMouseUp, { passive: true })
  })

  onUnmounted(() => {
    if (idleTimer) clearInterval(idleTimer)
    if (escapeHoldTimer) clearTimeout(escapeHoldTimer)
  })
}
