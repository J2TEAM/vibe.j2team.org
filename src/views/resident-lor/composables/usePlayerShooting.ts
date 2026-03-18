import { shallowRef, onMounted, onUnmounted, type Ref } from 'vue'
import type { Map as MapboxMap } from 'mapbox-gl'
import type { Bullet } from '../types'

/** Đơn vị: độ/ms (frame-rate independent) */
const BULLET_SPEED_PER_MS = 0.0000009
const BULLET_MAX_DIST_SQ = 0.0007 ** 2
const BULLET_MIN_DIST_SQ = 0.000025 ** 2
const ZOMBIE_HIT_RADIUS_SQ = 0.000035 ** 2
const FIRE_RATE_MS = 150

let nextId = 0

function getShootDirection(
  map: MapboxMap,
  mouseX: number,
  mouseY: number,
): { dirLat: number; dirLng: number } {
  const centerX = window.innerWidth / 2
  const centerY = window.innerHeight / 2
  const dx = mouseX - centerX
  const dy = mouseY - centerY
  const len = Math.sqrt(dx * dx + dy * dy) || 1
  const scale = 50 / len
  const endX = centerX + dx * scale
  const endY = centerY + dy * scale
  const start = map.unproject([centerX, centerY])
  const end = map.unproject([endX, endY])
  const dirLng = end.lng - start.lng
  const dirLat = end.lat - start.lat
  const dLen = Math.sqrt(dirLat * dirLat + dirLng * dirLng) || 1e-10
  return { dirLat: dirLat / dLen, dirLng: dirLng / dLen }
}

export type UsePlayerShootingOptions = {
  isWalkable?: (lat: number, lng: number) => boolean
  zombies?: Ref<{ id: string; lat: number; lng: number; state: string }[]>
  onZombieHit?: (zombieId: string) => void
}

export function usePlayerShooting(
  playerPosition: Ref<{ lat: number; lng: number }>,
  mapRef: Ref<MapboxMap | null>,
  options?: UsePlayerShootingOptions,
) {
  const { isWalkable, zombies: zombiesRef, onZombieHit } = options ?? {}
  const bullets = shallowRef<Bullet[]>([])
  let lastShot = 0
  let isHolding = false
  let mouseX = 0
  let mouseY = 0

  const shoot = (mx: number, my: number) => {
    const map = mapRef.value
    if (!map) return
    const now = Date.now()
    if (now - lastShot < FIRE_RATE_MS) return
    lastShot = now
    const { dirLat, dirLng } = getShootDirection(map, mx, my)
    const pos = playerPosition.value
    const list = bullets.value
    list.push({
      id: nextId++,
      lat: pos.lat,
      lng: pos.lng,
      startLat: pos.lat,
      startLng: pos.lng,
      dirLat,
      dirLng,
    })
    bullets.value = list.slice()
  }

  onMounted(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return
      isHolding = true
      mouseX = e.clientX
      mouseY = e.clientY
      shoot(e.clientX, e.clientY)
    }
    const handleMouseUp = () => {
      isHolding = false
    }
    const handleMouseLeave = () => {
      isHolding = false
    }
    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX
      mouseY = e.clientY
    }
    const fireInterval = setInterval(() => {
      if (isHolding) shoot(mouseX, mouseY)
    }, FIRE_RATE_MS)

    const handleTouchStart = (e: TouchEvent) => {
      for (const touch of Array.from(e.changedTouches)) {
        if ((touch.target as Element)?.closest('[data-no-shoot]')) continue
        isHolding = true
        mouseX = touch.clientX
        mouseY = touch.clientY
        shoot(touch.clientX, touch.clientY)
        break
      }
    }
    const handleTouchMove = (e: TouchEvent) => {
      for (const touch of Array.from(e.changedTouches)) {
        if ((touch.target as Element)?.closest('[data-no-shoot]')) continue
        mouseX = touch.clientX
        mouseY = touch.clientY
        break
      }
    }
    const handleTouchEnd = (e: TouchEvent) => {
      if (e.touches.length === 0) isHolding = false
    }

    window.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('mouseup', handleMouseUp)
    window.addEventListener('mouseleave', handleMouseLeave)
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('touchstart', handleTouchStart, { passive: true })
    window.addEventListener('touchmove', handleTouchMove, { passive: true })
    window.addEventListener('touchend', handleTouchEnd)

    onUnmounted(() => {
      window.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mouseup', handleMouseUp)
      window.removeEventListener('mouseleave', handleMouseLeave)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend', handleTouchEnd)
      clearInterval(fireInterval)
    })
  })

  let rafId: number
  let lastTime = 0

  const tick = (timestamp: number) => {
    // Delta time để đạn luôn bay đúng tốc độ dù FPS thấp hay cao
    const delta = lastTime ? Math.min(timestamp - lastTime, 50) : 16
    lastTime = timestamp

    const list = bullets.value
    if (list.length === 0) {
      rafId = requestAnimationFrame(tick)
      return
    }

    const step = BULLET_SPEED_PER_MS * delta
    let changed = false

    for (let i = list.length - 1; i >= 0; i--) {
      const b = list[i]
      if (!b) continue

      const newLat = b.lat + b.dirLat * step
      const newLng = b.lng + b.dirLng * step

      if (isWalkable && !isWalkable(newLat, newLng)) {
        list.splice(i, 1)
        changed = true
        continue
      }

      const dLat = newLat - b.startLat
      const dLng = newLng - b.startLng
      const distSq = dLat * dLat + dLng * dLng

      if (distSq > BULLET_MAX_DIST_SQ) {
        list.splice(i, 1)
        changed = true
        continue
      }

      if (distSq >= BULLET_MIN_DIST_SQ) {
        const aliveZombies = zombiesRef?.value ?? []
        let hit = false
        for (const z of aliveZombies) {
          if (z.state !== 'alive') continue
          const zd = (newLat - z.lat) ** 2 + (newLng - z.lng) ** 2
          if (zd < ZOMBIE_HIT_RADIUS_SQ) {
            onZombieHit?.(z.id)
            list.splice(i, 1)
            changed = true
            hit = true
            break
          }
        }
        if (hit) continue
      }

      b.lat = newLat
      b.lng = newLng
      changed = true
    }

    if (changed) bullets.value = list.slice()
    rafId = requestAnimationFrame(tick)
  }
  rafId = requestAnimationFrame(tick)
  onUnmounted(() => cancelAnimationFrame(rafId))

  return bullets
}
