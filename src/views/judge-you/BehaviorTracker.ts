import { onMounted, onUnmounted } from 'vue'
import { useBehaviorStore } from './useBehaviorStore'
import { useEventListener } from '@vueuse/core'

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
    clickTimestamps = clickTimestamps.filter((t) => now - t < 2000)
    store.setRapid(clickTimestamps.length > 3)

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
      } else if (e.touches && typeof e.touches[0] !== 'undefined') {
        cx = e.touches[0].clientX
        cy = e.touches[0].clientY
      }

      if (cx > window.innerWidth - 100 && cy < 100) {
        store.hasFollowedInstruction = true
      }
    }

    if (store.phase < 8 && !store.hasEscaped) {
      evaluatePhase()
    }
    store.predictionTarget.show = false
  }

  function handleMove(e: MouseEvent | TouchEvent) {
    handleInteraction()
    store.updateMove()

    const now = Date.now()
    let clientX = 0,
      clientY = 0
    if (e instanceof MouseEvent) {
      clientX = e.clientX
      clientY = e.clientY
    } else if (e.touches && typeof e.touches[0] !== 'undefined') {
      clientX = e.touches[0].clientX
      clientY = e.touches[0].clientY
    }

    if (lastMouseX >= 0) {
      const dist = Math.hypot(clientX - lastMouseX, clientY - lastMouseY)
      const timeDiff = now - lastMouseMoveTime
      if (timeDiff > 0) store.isFastMoving = dist / timeDiff > 3
    }

    lastMouseX = clientX
    lastMouseY = clientY
    lastMouseMoveTime = now

    // Prediction
    if (
      Math.random() < 0.005 &&
      store.phase >= 2 &&
      !store.predictionTarget.show &&
      store.phase < 7
    ) {
      const diffX = clientX - lastMouseX
      const diffY = clientY - lastMouseY
      if (diffX !== 0 || diffY !== 0) {
        store.predictionTarget = {
          x: clientX + diffX * 20,
          y: clientY + diffY * 20,
          show: true,
        }
      }
    }
    if (store.mouseMoves % 15 === 0 && store.phase < 8 && !store.hasEscaped) evaluatePhase()
  }

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

    // Scoring
    const score =
      clicks * 15 + mouseMoves * 0.4 + Math.min(idleTime, 15000) / 100 + totalTime / 1000

    let newPhase = store.phase
    if (score > 6000)
      newPhase = 8 // Fake Ending
    else if (score > 4500)
      newPhase = 7 // Collapse
    else if (score > 3500)
      newPhase = 6 // Control
    else if (score > 2000)
      newPhase = 5 // Pressure
    else if (score > 1000)
      newPhase = 4 // Disturb
    else if (score > 400)
      newPhase = 3 // Judgment
    else if (score > 150)
      newPhase = 2 // Observation
    else newPhase = 1

    if (newPhase > store.phase) {
      store.setPhase(newPhase)
      if (newPhase === 6) store.reverseControlActive = true

      // Fake ending auto-transition
      if (newPhase === 8) {
        window.setTimeout(() => {
          store.setPhase(9) // Reveal
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
