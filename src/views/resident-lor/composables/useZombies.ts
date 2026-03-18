import { ref, type Ref, onUnmounted } from 'vue'
import type { Direction, Zombie, ZombieState } from '../types'

const ZOMBIE_SPEED_BASE = 0.0000012
const ZOMBIE_SPEED_MIN = 0.6
const ZOMBIE_SPEED_MAX = 1.5
const SPAWN_RADIUS_MIN = 0.00012
const SPAWN_RADIUS_MAX = 0.00035
const INITIAL_COUNT = 6
const MAX_ZOMBIES = 22
const SPAWN_INTERVAL_MS = 1400
const LIFESPAN_MS = 5000
const DEATH_DURATION_MS = 700
const SPAWN_WALKABLE_ATTEMPTS = 30

function getDirectionToward(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
): Direction {
  const dLat = to.lat - from.lat
  const dLng = to.lng - from.lng
  if (Math.abs(dLat) < 1e-10 && Math.abs(dLng) < 1e-10) return 'south'
  const angle = (Math.atan2(dLat, dLng) * 180) / Math.PI
  const normalized = (angle + 360) % 360
  const sectors: Direction[] = [
    'east',
    'north-east',
    'north',
    'north-west',
    'west',
    'south-west',
    'south',
    'south-east',
  ]
  const index = Math.round(normalized / 45) % 8
  return sectors[index] ?? 'south'
}

function randomSpeed() {
  return ZOMBIE_SPEED_MIN + Math.random() * (ZOMBIE_SPEED_MAX - ZOMBIE_SPEED_MIN)
}

function spawnZombieAt(lat: number, lng: number, id: string): Zombie {
  return {
    id,
    lat,
    lng,
    direction: 'south',
    state: 'alive',
    spawnTime: Date.now(),
    speed: randomSpeed(),
  }
}

/** Spawn zombie ở vị trí walkable gần center (tránh spawn vào nhà). */
function trySpawnZombieWalkable(
  center: { lat: number; lng: number },
  id: string,
  isWalkable: (lat: number, lng: number) => boolean,
): Zombie | null {
  for (let i = 0; i < SPAWN_WALKABLE_ATTEMPTS; i++) {
    const angle = Math.random() * Math.PI * 2
    const r = SPAWN_RADIUS_MIN + Math.random() * (SPAWN_RADIUS_MAX - SPAWN_RADIUS_MIN)
    const lat = center.lat + Math.cos(angle) * r
    const lng = center.lng + Math.sin(angle) * r
    if (isWalkable(lat, lng)) return spawnZombieAt(lat, lng, id)
  }
  return null
}

let idCounter = 0
function nextId() {
  return `z-${++idCounter}`
}

export type UseZombiesOptions = {
  isWalkable?: (lat: number, lng: number) => boolean
}

export function useZombies(
  playerPosition: Ref<{ lat: number; lng: number }>,
  options?: UseZombiesOptions,
) {
  const { isWalkable } = options ?? {}
  const zombies = ref<Zombie[]>([])
  let lastSpawnTime = 0

  function spawnInitial() {
    const center = playerPosition.value
    for (let i = 0; i < INITIAL_COUNT; i++) {
      const z = isWalkable
        ? trySpawnZombieWalkable(center, nextId(), isWalkable)
        : spawnZombieAt(
            center.lat + (Math.random() - 0.5) * 0.0002,
            center.lng + (Math.random() - 0.5) * 0.0002,
            nextId(),
          )
      if (z) zombies.value = [...zombies.value, z]
    }
    lastSpawnTime = Date.now()
  }
  spawnInitial()

  const hitZombie = (id: string) => {
    zombies.value = zombies.value.map((z) =>
      z.id === id && z.state === 'alive'
        ? { ...z, state: 'dying' as ZombieState, deathStartTime: Date.now() }
        : z,
    )
  }

  let rafId: number
  const tick = () => {
    const now = Date.now()
    const pos = playerPosition.value

    if (
      isWalkable &&
      zombies.value.length < MAX_ZOMBIES &&
      now - lastSpawnTime >= SPAWN_INTERVAL_MS
    ) {
      lastSpawnTime = now
      const z = trySpawnZombieWalkable(pos, nextId(), isWalkable)
      if (z) zombies.value = [...zombies.value, z]
    }

    zombies.value = zombies.value
      .map((z) => {
        if (z.state === 'dead') return null

        if (z.state === 'alive' && now - z.spawnTime > LIFESPAN_MS) {
          return { ...z, state: 'dying' as ZombieState, deathStartTime: now }
        }

        if (z.state === 'dying' && z.deathStartTime && now - z.deathStartTime > DEATH_DURATION_MS) {
          return null
        }
        if (z.state === 'dying') return z

        const pos = playerPosition.value
        const dLat = pos.lat - z.lat
        const dLng = pos.lng - z.lng
        const dist = Math.sqrt(dLat * dLat + dLng * dLng) || 1e-10
        const speed = ZOMBIE_SPEED_BASE * (z.speed ?? 1)
        const step = Math.min(speed, dist * 0.1)
        const newLat = z.lat + (dLat / dist) * step
        const newLng = z.lng + (dLng / dist) * step
        if (isWalkable && !isWalkable(newLat, newLng)) return z
        const direction = getDirectionToward({ lat: z.lat, lng: z.lng }, pos)
        return { ...z, lat: newLat, lng: newLng, direction }
      })
      .filter((z): z is Zombie => z !== null)
    rafId = requestAnimationFrame(tick)
  }
  rafId = requestAnimationFrame(tick)

  onUnmounted(() => cancelAnimationFrame(rafId))

  function reset() {
    zombies.value = []
    spawnInitial()
  }

  return { zombies, hitZombie, reset }
}
