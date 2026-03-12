import { ref, onMounted, onUnmounted } from 'vue'

const MOVE_SPEED = 0.000002
const UNSTUCK_CHECK_INTERVAL_MS = 200

export type UsePlayerMovementOptions = {
  isWalkable?: (lat: number, lng: number) => boolean
  /** Gọi khi nhân vật kẹt trong building để tìm vị trí thoát */
  getUnstuck?: (lat: number, lng: number) => { lat: number; lng: number } | null
}

export function usePlayerMovement(
  initialLat = 10.78,
  initialLng = 106.7,
  options?: UsePlayerMovementOptions,
) {
  const { isWalkable, getUnstuck } = options ?? {}
  const position = ref({ lat: initialLat, lng: initialLng })
  const keys = ref({ w: false, a: false, s: false, d: false })
  let lastUnstuckCheck = 0

  const handleKeyDown = (e: KeyboardEvent) => {
    const k = e.key.toLowerCase()
    const arrow =
      e.key === 'ArrowUp' ||
      e.key === 'ArrowDown' ||
      e.key === 'ArrowLeft' ||
      e.key === 'ArrowRight'
    if (['w', 'a', 's', 'd'].includes(k) || arrow) {
      e.preventDefault()
    }
    if (k === 'w' || e.key === 'ArrowUp') keys.value = { ...keys.value, w: true }
    if (k === 'a' || e.key === 'ArrowLeft') keys.value = { ...keys.value, a: true }
    if (k === 's' || e.key === 'ArrowDown') keys.value = { ...keys.value, s: true }
    if (k === 'd' || e.key === 'ArrowRight') keys.value = { ...keys.value, d: true }
  }

  const handleKeyUp = (e: KeyboardEvent) => {
    const k = e.key.toLowerCase()
    if (k === 'w' || e.key === 'ArrowUp') keys.value = { ...keys.value, w: false }
    if (k === 'a' || e.key === 'ArrowLeft') keys.value = { ...keys.value, a: false }
    if (k === 's' || e.key === 'ArrowDown') keys.value = { ...keys.value, s: false }
    if (k === 'd' || e.key === 'ArrowRight') keys.value = { ...keys.value, d: false }
  }

  onMounted(() => {
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
  })
  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeyDown)
    window.removeEventListener('keyup', handleKeyUp)
  })

  let rafId: number
  const tick = () => {
    const now = Date.now()
    const { lat, lng } = position.value

    if (isWalkable && getUnstuck && !isWalkable(lat, lng)) {
      if (now - lastUnstuckCheck >= UNSTUCK_CHECK_INTERVAL_MS) {
        lastUnstuckCheck = now
        const unstuck = getUnstuck(lat, lng)
        if (unstuck) position.value = unstuck
      }
    } else {
      const k = keys.value
      if (k.w || k.a || k.s || k.d) {
        let newLat = lat
        let newLng = lng
        if (k.w) newLat += MOVE_SPEED
        if (k.s) newLat -= MOVE_SPEED
        if (k.a) newLng -= MOVE_SPEED
        if (k.d) newLng += MOVE_SPEED
        if (!isWalkable || isWalkable(newLat, newLng)) {
          position.value = { lat: newLat, lng: newLng }
        }
      }
    }
    rafId = requestAnimationFrame(tick)
  }
  rafId = requestAnimationFrame(tick)
  onUnmounted(() => cancelAnimationFrame(rafId))

  return { position, keys }
}
