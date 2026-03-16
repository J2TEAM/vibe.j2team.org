import { ref, type Ref, onMounted, onUnmounted } from 'vue'
import type { Map as MapboxMap } from 'mapbox-gl'
import type { Bullet } from '../types'

const BULLET_SPEED = 0.000008
const BULLET_MAX_DISTANCE = 0.0005
const FIRE_RATE_MS = 150
const ZOMBIE_HIT_RADIUS = 0.000035
/** Đạn phải bay xa tối thiểu mới tính trúng zombie (tránh zombie đè lên người thì đạn spawn là trúng) */
const BULLET_MIN_DISTANCE_TO_HIT = 0.000025

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
  const ndx = dx / len
  const ndy = dy / len
  const scale = 50
  const endX = centerX + ndx * scale
  const endY = centerY + ndy * scale
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
  const bullets = ref<Bullet[]>([])
  const lastShot = ref(0)
  const isHolding = ref(false)
  const mousePos = ref({ x: 0, y: 0 })

  const shoot = (mouseX: number, mouseY: number) => {
    const map = mapRef.value
    if (!map) return
    const now = Date.now()
    if (now - lastShot.value < FIRE_RATE_MS) return
    lastShot.value = now
    const { dirLat, dirLng } = getShootDirection(map, mouseX, mouseY)
    const pos = playerPosition.value
    bullets.value = [
      ...bullets.value,
      {
        id: nextId++,
        lat: pos.lat,
        lng: pos.lng,
        startLat: pos.lat,
        startLng: pos.lng,
        dirLat,
        dirLng,
      },
    ]
  }

  onMounted(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return
      isHolding.value = true
      mousePos.value = { x: e.clientX, y: e.clientY }
      shoot(e.clientX, e.clientY)
    }
    const handleMouseUp = () => {
      isHolding.value = false
    }
    const handleMouseLeave = () => {
      isHolding.value = false
    }
    const handleMouseMove = (e: MouseEvent) => {
      mousePos.value = { x: e.clientX, y: e.clientY }
    }
    const fireInterval = setInterval(() => {
      if (isHolding.value) shoot(mousePos.value.x, mousePos.value.y)
    }, FIRE_RATE_MS)

    window.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('mouseup', handleMouseUp)
    window.addEventListener('mouseleave', handleMouseLeave)
    window.addEventListener('mousemove', handleMouseMove)

    onUnmounted(() => {
      window.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mouseup', handleMouseUp)
      window.removeEventListener('mouseleave', handleMouseLeave)
      window.removeEventListener('mousemove', handleMouseMove)
      clearInterval(fireInterval)
    })
  })

  let rafId: number
  const tick = () => {
    bullets.value = bullets.value
      .map((b) => {
        const newLat = b.lat + b.dirLat * BULLET_SPEED
        const newLng = b.lng + b.dirLng * BULLET_SPEED
        if (isWalkable && !isWalkable(newLat, newLng)) return null
        const traveled = Math.sqrt((newLat - b.startLat) ** 2 + (newLng - b.startLng) ** 2)
        if (traveled >= BULLET_MIN_DISTANCE_TO_HIT) {
          const aliveZombies = (zombiesRef?.value ?? []).filter((z) => z.state === 'alive')
          for (const z of aliveZombies) {
            const d = (newLat - z.lat) ** 2 + (newLng - z.lng) ** 2
            if (d < ZOMBIE_HIT_RADIUS ** 2) {
              onZombieHit?.(z.id)
              return null
            }
          }
        }
        const dist = Math.sqrt((newLat - b.startLat) ** 2 + (newLng - b.startLng) ** 2)
        if (dist > BULLET_MAX_DISTANCE) return null
        return { ...b, lat: newLat, lng: newLng }
      })
      .filter((b): b is Bullet => b !== null)
    rafId = requestAnimationFrame(tick)
  }
  rafId = requestAnimationFrame(tick)
  onUnmounted(() => cancelAnimationFrame(rafId))

  return bullets
}
