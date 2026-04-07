import { ref, computed } from 'vue'
import type { Passenger } from '../types'
import { randomInt, pickRandom } from '../utils/rng'

const RAINBOW_COLORS = ['#FF4444', '#FF8C00', '#FFD700', '#44BB44', '#4488FF', '#6B3FA0', '#9B59B6']

const MAX_PASSENGERS = 50

// ── Horizontal bus layout ──────────────────────────────────
// Bus body
const BUS_X = 15
const BUS_Y = 8
const BUS_W = 550
const BUS_H = 150

// Seat dimensions
const SEAT_W = 28
const SEAT_H = 18
const COL_PITCH = 38 // horizontal spacing between seat columns
const ROW_PITCH = 22 // vertical spacing between seat rows

// First seat column left-edge X
const BUS_INTERIOR_START_X = 55
const NUM_COLS = 12

// 4 seat rows: 0=top-window, 1=top-aisle, 2=bottom-aisle, 3=bottom-window
const ROW_Y_CENTERS = [
  BUS_Y + 18 + SEAT_H / 2, // 35  top window
  BUS_Y + 18 + SEAT_H / 2 + ROW_PITCH, // 57  top aisle
  BUS_Y + BUS_H - 18 - SEAT_H / 2 - ROW_PITCH, // 111 bottom aisle
  BUS_Y + BUS_H - 18 - SEAT_H / 2, // 133 bottom window
] as const

// Doors on the TOP edge — occupy these columns in the top bank (rows 0-1)
const DOOR_COLS: ReadonlySet<number> = new Set([3, 4, 8, 9])

// Pre-compute all valid seat positions
interface SeatDef {
  x: number
  y: number
  col: number
  row: number
}
const SEAT_POSITIONS: SeatDef[] = []
for (let col = 0; col < NUM_COLS; col++) {
  for (let row = 0; row < 4; row++) {
    if (row < 2 && DOOR_COLS.has(col)) continue
    SEAT_POSITIONS.push({
      x: BUS_INTERIOR_START_X + col * COL_PITCH + SEAT_W / 2,
      y: ROW_Y_CENTERS[row]!,
      col,
      row,
    })
  }
}
const TOTAL_SEATS = SEAT_POSITIONS.length // (12-4)*2 + 12*2 = 16+24 = 40
const STANDING_CAPACITY = MAX_PASSENGERS - TOTAL_SEATS // 10

// Aisle center
const AISLE_CENTER_Y = (ROW_Y_CENTERS[1]! + ROW_Y_CENTERS[2]!) / 2 // ~84

// Door spawn positions (outside bus, top edge)
const DOOR_1_X = BUS_INTERIOR_START_X + 3.5 * COL_PITCH + SEAT_W / 2 // ~210
const DOOR_1_Y = BUS_Y - 12
const DOOR_2_X = BUS_INTERIOR_START_X + 8.5 * COL_PITCH + SEAT_W / 2 // ~400
const DOOR_2_Y = BUS_Y - 12

// Clamping
const BUS_BODY_LEFT = BUS_X + 8
const BUS_BODY_RIGHT = BUS_X + BUS_W - 8
const BUS_BODY_TOP = BUS_Y + 6
const BUS_BODY_BOTTOM = BUS_Y + BUS_H - 6

let passengerIdCounter = 0

function generatePassengerId(): string {
  passengerIdCounter++
  return `p_${passengerIdCounter}`
}

function randomDoorPosition(): { x: number; y: number } {
  return Math.random() < 0.5 ? { x: DOOR_1_X, y: DOOR_1_Y } : { x: DOOR_2_X, y: DOOR_2_Y }
}

function getSeatPosition(seatIndex: number): { x: number; y: number } {
  const seat = SEAT_POSITIONS[seatIndex]
  if (!seat) return { x: AISLE_CENTER_Y, y: BUS_Y + BUS_H / 2 }
  return { x: seat.x, y: seat.y }
}

function getStandingPosition(standIndex: number): { x: number; y: number } {
  const count = Math.max(STANDING_CAPACITY, 1)
  const startX = BUS_INTERIOR_START_X + SEAT_W / 2
  const endX = BUS_INTERIOR_START_X + (NUM_COLS - 1) * COL_PITCH + SEAT_W / 2
  const spacing = (endX - startX) / Math.max(count - 1, 1)
  const yOffsets = [-10, 0, 10]
  return {
    x: startX + standIndex * spacing,
    y: AISLE_CENTER_Y + yOffsets[standIndex % 3]!,
  }
}

function clampPosition(x: number, y: number): { x: number; y: number } {
  return {
    x: Math.max(BUS_BODY_LEFT, Math.min(BUS_BODY_RIGHT, x)),
    y: Math.max(BUS_BODY_TOP, Math.min(BUS_BODY_BOTTOM, y)),
  }
}

export function usePassengerManager() {
  const passengers = ref<Passenger[]>([])
  const animatingPassengers = ref<Passenger[]>([])
  const isAnimating = ref(false)
  let wanderInterval: ReturnType<typeof setInterval> | null = null

  const occupiedSeats = computed(() => {
    const seats = new Set<number>()
    for (const p of passengers.value) {
      if (p.seatIndex >= 0) seats.add(p.seatIndex)
    }
    return seats
  })

  const passengerCount = computed(() => passengers.value.length)
  const seatCount = computed(() => passengers.value.filter((p) => p.seatIndex >= 0).length)
  const standingCount = computed(() => passengers.value.filter((p) => p.seatIndex < 0).length)

  function findRandomFreeSeat(): number {
    const freeSeats: number[] = []
    for (let i = 0; i < TOTAL_SEATS; i++) {
      if (!occupiedSeats.value.has(i)) freeSeats.push(i)
    }
    if (freeSeats.length === 0) return -1
    return pickRandom(freeSeats)
  }

  function findStandingSlot(): number {
    const usedStanding = new Set(
      passengers.value.filter((p) => p.seatIndex < 0).map((p) => p.seatIndex),
    )
    const freeSlots: number[] = []
    for (let i = 0; i < STANDING_CAPACITY; i++) {
      if (!usedStanding.has(-(i + 1))) freeSlots.push(-(i + 1))
    }
    if (freeSlots.length === 0) return -(STANDING_CAPACITY + 1)
    return pickRandom(freeSlots)
  }

  function spawnPassenger(): Passenger | null {
    if (passengers.value.length >= MAX_PASSENGERS) return null
    const freeSeat = findRandomFreeSeat()
    const preferStanding = Math.random() < 0.3
    const seatIndex = freeSeat >= 0 && !preferStanding ? freeSeat : findStandingSlot()
    const basePos =
      seatIndex >= 0 ? getSeatPosition(seatIndex) : getStandingPosition(Math.abs(seatIndex) - 1)
    const jitterX = (Math.random() - 0.5) * 6
    const jitterY = (Math.random() - 0.5) * 4
    const clamped = clampPosition(basePos.x + jitterX, basePos.y + jitterY)
    const doorPos = randomDoorPosition()
    return {
      id: generatePassengerId(),
      color: pickRandom(RAINBOW_COLORS),
      seatIndex,
      x: doorPos.x,
      y: doorPos.y,
      targetX: clamped.x,
      targetY: clamped.y,
      state: 'boarding',
    }
  }

  async function boardPassengers(count: number): Promise<number> {
    const toBoard = Math.min(count, MAX_PASSENGERS - passengers.value.length)
    isAnimating.value = true
    let boarded = 0
    for (let i = 0; i < toBoard; i++) {
      const p = spawnPassenger()
      if (!p) break
      animatingPassengers.value.push(p)
      passengers.value.push(p)
      boarded++
      await delay(300)
    }
    await delay(500)
    for (const p of passengers.value) {
      if (p.state === 'boarding') {
        p.x = p.targetX
        p.y = p.targetY
        p.state = p.seatIndex >= 0 ? 'seated' : 'standing'
      }
    }
    animatingPassengers.value = []
    isAnimating.value = false
    return boarded
  }

  async function alightPassengers(count: number): Promise<number> {
    const toAlight = Math.min(count, passengers.value.length)
    isAnimating.value = true
    let alighted = 0
    const indices = passengers.value.map((_, i) => i)
    const shuffled = indices.sort(() => Math.random() - 0.5)
    const toRemoveIds: string[] = []
    for (let i = 0; i < toAlight; i++) {
      const idx = shuffled[i]
      if (idx === undefined) break
      const p = passengers.value[idx]
      if (!p) break
      p.state = 'alighting'
      const doorPos = randomDoorPosition()
      p.targetX = doorPos.x
      p.targetY = doorPos.y
      toRemoveIds.push(p.id)
      alighted++
      await delay(250)
    }
    await delay(500)
    passengers.value = passengers.value.filter((p) => !toRemoveIds.includes(p.id))
    isAnimating.value = false
    return alighted
  }

  function alightAll(): void {
    passengers.value = []
    animatingPassengers.value = []
  }

  function movePassengerToSeat(p: Passenger, newSeatIndex: number) {
    p.seatIndex = newSeatIndex
    const basePos =
      newSeatIndex >= 0
        ? getSeatPosition(newSeatIndex)
        : getStandingPosition(Math.abs(newSeatIndex) - 1)
    const clamped = clampPosition(
      basePos.x + (Math.random() - 0.5) * 8,
      basePos.y + (Math.random() - 0.5) * 6,
    )
    p.targetX = clamped.x
    p.targetY = clamped.y
    p.state = newSeatIndex >= 0 ? 'seated' : 'standing'
  }

  function startWandering() {
    stopWandering()
    wanderInterval = setInterval(() => {
      const jitterCount = Math.min(randomInt(2, 4), passengers.value.length)
      const jitterIndices = passengers.value
        .map((_, i) => i)
        .sort(() => Math.random() - 0.5)
        .slice(0, jitterCount)
      for (const idx of jitterIndices) {
        const p = passengers.value[idx]
        if (!p || p.state === 'boarding' || p.state === 'alighting') continue
        const basePos =
          p.seatIndex >= 0
            ? getSeatPosition(p.seatIndex)
            : getStandingPosition(Math.abs(p.seatIndex) - 1)
        const newPos = clampPosition(
          basePos.x + (Math.random() - 0.5) * 16,
          basePos.y + (Math.random() - 0.5) * 12,
        )
        p.targetX = newPos.x
        p.targetY = newPos.y
      }
      const active = passengers.value.filter(
        (p) => p.state !== 'boarding' && p.state !== 'alighting',
      )
      if (Math.random() < 0.3) {
        const standing = active.filter((p) => p.seatIndex < 0)
        if (standing.length > 0) {
          const seat = findRandomFreeSeat()
          if (seat >= 0) movePassengerToSeat(pickRandom(standing), seat)
        }
      }
      if (Math.random() < 0.15) {
        const seated = active.filter((p) => p.seatIndex >= 0)
        if (seated.length > 0) {
          const seat = findRandomFreeSeat()
          if (seat >= 0) movePassengerToSeat(pickRandom(seated), seat)
        }
      }
      if (Math.random() < 0.1) {
        const seated = active.filter((p) => p.seatIndex >= 0)
        if (seated.length > 0) {
          movePassengerToSeat(pickRandom(seated), findStandingSlot())
        }
      }
      if (Math.random() < 0.2 && active.length >= 2) {
        const sh = [...active].sort(() => Math.random() - 0.5)
        const p1 = sh[0]!
        const p2 = sh[1]!
        const tmp = p1.seatIndex
        p1.seatIndex = p2.seatIndex
        p2.seatIndex = tmp
        const pos1 =
          p1.seatIndex >= 0
            ? getSeatPosition(p1.seatIndex)
            : getStandingPosition(Math.abs(p1.seatIndex) - 1)
        const pos2 =
          p2.seatIndex >= 0
            ? getSeatPosition(p2.seatIndex)
            : getStandingPosition(Math.abs(p2.seatIndex) - 1)
        const c1 = clampPosition(
          pos1.x + (Math.random() - 0.5) * 8,
          pos1.y + (Math.random() - 0.5) * 6,
        )
        const c2 = clampPosition(
          pos2.x + (Math.random() - 0.5) * 8,
          pos2.y + (Math.random() - 0.5) * 6,
        )
        p1.targetX = c1.x
        p1.targetY = c1.y
        p1.state = p1.seatIndex >= 0 ? 'seated' : 'standing'
        p2.targetX = c2.x
        p2.targetY = c2.y
        p2.state = p2.seatIndex >= 0 ? 'seated' : 'standing'
      }
    }, 1600)
  }

  function stopWandering() {
    if (wanderInterval) {
      clearInterval(wanderInterval)
      wanderInterval = null
    }
  }

  function reset() {
    passengers.value = []
    animatingPassengers.value = []
    isAnimating.value = false
    stopWandering()
    passengerIdCounter = 0
  }

  return {
    passengers,
    animatingPassengers,
    isAnimating,
    passengerCount,
    seatCount,
    standingCount,
    boardPassengers,
    alightPassengers,
    alightAll,
    startWandering,
    stopWandering,
    reset,
    TOTAL_SEATS,
    MAX_PASSENGERS,
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export {
  BUS_X,
  BUS_Y,
  BUS_W,
  BUS_H,
  SEAT_W,
  SEAT_H,
  COL_PITCH,
  ROW_PITCH,
  NUM_COLS,
  TOTAL_SEATS,
  SEAT_POSITIONS,
  BUS_INTERIOR_START_X,
  DOOR_COLS,
  ROW_Y_CENTERS,
  AISLE_CENTER_Y,
  DOOR_1_X,
  DOOR_1_Y,
  DOOR_2_X,
  DOOR_2_Y,
  getSeatPosition,
  getStandingPosition,
}
