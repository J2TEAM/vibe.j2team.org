import { shallowRef, onUnmounted, type Ref } from 'vue'
import type { Direction, Zombie, ZombieState } from '../types'

const ZOMBIE_SPEED_BASE = 0.0000012
const ZOMBIE_SPEED_MIN = 0.6
const ZOMBIE_SPEED_MAX = 1.5
const SPAWN_RADIUS_MIN = 0.00012
const SPAWN_RADIUS_MAX = 0.00035
const INITIAL_COUNT = 6
const MAX_ZOMBIES = 22
const SPAWN_INTERVAL_MS = 1400
const DEATH_ANIMATION_MS = 700
const SPAWN_WALKABLE_ATTEMPTS = 30
const TICK_MS = 33 // ~30fps game logic
const WALK_FRAME_MS = 100 // 10fps walk animation
const WALK_TOTAL_FRAMES = 6
const DEATH_FRAME_MS = 100
/** Zombie không di chuyển quá 3s → coi là kẹt tường → kill */
const STUCK_TIMEOUT_MS = 3000

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
  const now = Date.now()
  return {
    id,
    lat,
    lng,
    direction: 'south',
    state: 'alive',
    spawnTime: now,
    lastMoveTime: now,
    speed: randomSpeed(),
  }
}

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
  const zombies = shallowRef<Zombie[]>([])
  const walkFrame = shallowRef(0)

  let lastSpawnTime = 0
  let lastTickTime = 0
  let lastWalkFrameTime = 0

  function spawnInitial() {
    const center = playerPosition.value
    const list: Zombie[] = []
    for (let i = 0; i < INITIAL_COUNT; i++) {
      const z = isWalkable
        ? trySpawnZombieWalkable(center, nextId(), isWalkable)
        : spawnZombieAt(
            center.lat + (Math.random() - 0.5) * 0.0002,
            center.lng + (Math.random() - 0.5) * 0.0002,
            nextId(),
          )
      if (z) list.push(z)
    }
    zombies.value = list
    lastSpawnTime = Date.now()
  }
  spawnInitial()

  const hitZombie = (id: string) => {
    const list = zombies.value
    for (const z of list) {
      if (z.id === id && z.state === 'alive') {
        z.state = 'dying' as ZombieState
        z.deathStartTime = Date.now()
        z.deathFrame = 0
        zombies.value = list.slice()
        break
      }
    }
  }

  let rafId: number
  const tick = () => {
    const now = Date.now()

    // Cập nhật walk frame animation (10fps, độc lập với game logic)
    if (now - lastWalkFrameTime >= WALK_FRAME_MS) {
      walkFrame.value = (walkFrame.value + 1) % WALK_TOTAL_FRAMES
      lastWalkFrameTime = now
    }

    // Throttle game logic ~30fps
    if (now - lastTickTime < TICK_MS) {
      rafId = requestAnimationFrame(tick)
      return
    }
    lastTickTime = now

    const pos = playerPosition.value
    const list = zombies.value
    let changed = false

    // Spawn zombie mới
    if (isWalkable && list.length < MAX_ZOMBIES && now - lastSpawnTime >= SPAWN_INTERVAL_MS) {
      lastSpawnTime = now
      const z = trySpawnZombieWalkable(pos, nextId(), isWalkable)
      if (z) {
        list.push(z)
        changed = true
      }
    }

    // Cập nhật từng zombie in-place (không tạo object mới)
    for (let i = list.length - 1; i >= 0; i--) {
      const z = list[i]
      if (!z) continue

      if (z.state === 'dying') {
        if (z.deathStartTime) {
          const elapsed = now - z.deathStartTime
          if (elapsed > DEATH_ANIMATION_MS) {
            list.splice(i, 1)
            changed = true
            continue
          }
          const frame = Math.min(Math.floor(elapsed / DEATH_FRAME_MS), 6)
          if (frame !== z.deathFrame) {
            z.deathFrame = frame
            changed = true
          }
        }
        continue
      }

      // Di chuyển về phía người chơi
      const dLat = pos.lat - z.lat
      const dLng = pos.lng - z.lng
      const dist = Math.sqrt(dLat * dLat + dLng * dLng) || 1e-10
      const speed = ZOMBIE_SPEED_BASE * (z.speed ?? 1)
      const step = Math.min(speed, dist * 0.1)
      const newLat = z.lat + (dLat / dist) * step
      const newLng = z.lng + (dLng / dist) * step

      if (isWalkable && !isWalkable(newLat, newLng)) {
        // Kẹt tường — kiểm tra stuck timeout
        if (now - z.lastMoveTime >= STUCK_TIMEOUT_MS) {
          z.state = 'dying' as ZombieState
          z.deathStartTime = now
          z.deathFrame = 0
          changed = true
        }
        continue
      }

      const direction = getDirectionToward({ lat: z.lat, lng: z.lng }, pos)
      z.lat = newLat
      z.lng = newLng
      z.direction = direction
      z.lastMoveTime = now
      changed = true
    }

    if (changed) zombies.value = list.slice()
    rafId = requestAnimationFrame(tick)
  }
  rafId = requestAnimationFrame(tick)

  onUnmounted(() => cancelAnimationFrame(rafId))

  function reset() {
    zombies.value = []
    spawnInitial()
  }

  return { zombies, hitZombie, reset, walkFrame }
}
