<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useMediaQuery, useRafFn, useWindowSize } from '@vueuse/core'
import { Icon } from '@iconify/vue'

type PlayerSide = 'left' | 'right'
type GameMode = 'pvp' | 'ai'

type DinoType = {
  id: number
  name: string
  push: number
  damage: number
  sizeRem: number
  image: string
}

type Unit = {
  id: number
  side: PlayerSide
  x: number
  type: DinoType
}

type Lane = {
  id: number
  units: Unit[]
  isColliding: boolean
}

type LockableScreenOrientation = {
  lock: (orientation: 'landscape') => Promise<void>
}

const maxHp = 100
const laneLength = 100
const spawnPadding = 4.5
const unitSpacing = 5.5
const spawnBlockDistance = unitSpacing + 0.35
const collideDistance = 4.8
const collisionReleaseDistance = collideDistance + 0.45
const movementSpeed = 7
const spawnInterval = 3000
const overshootMargin = 14
const positionStep = 0.1
const aiReactionMin = 260
const aiReactionMax = 720
const preMatchCountdown = 3000
const spriteUrls = [
  new URL('./svg/dino_01_bao-chua.svg', import.meta.url).href,
  new URL('./svg/dino_02_gai-nho.svg', import.meta.url).href,
  new URL('./svg/dino_03_canh-bay.svg', import.meta.url).href,
  new URL('./svg/dino_04_co-dai.svg', import.meta.url).href,
  new URL('./svg/dino_05_mo-dai.svg', import.meta.url).href,
  new URL('./svg/dino_06_ba-sung.svg', import.meta.url).href,
  new URL('./svg/dino_07_lung-gai.svg', import.meta.url).href,
  new URL('./svg/dino_08_mo-vit.svg', import.meta.url).href,
] as const

const dinosaurs: DinoType[] = [
  { id: 1, name: 'Bạo Chúa', push: 5, damage: 5, sizeRem: 4.5, image: spriteUrls[0] },
  { id: 2, name: 'Gai nhỏ', push: 6, damage: 4, sizeRem: 5.3, image: spriteUrls[1] },
  { id: 3, name: 'Cánh bay', push: 2, damage: 8, sizeRem: 3.5, image: spriteUrls[2] },
  { id: 4, name: 'Cổ dài', push: 9, damage: 1, sizeRem: 6.4, image: spriteUrls[3] },
  { id: 5, name: 'Mỏ dài', push: 4, damage: 6, sizeRem: 4.2, image: spriteUrls[4] },
  { id: 6, name: 'Ba sừng', push: 8, damage: 2, sizeRem: 5.8, image: spriteUrls[5] },
  { id: 7, name: 'Lưng gai', push: 7, damage: 3, sizeRem: 5.8, image: spriteUrls[6] },
  { id: 8, name: 'Mỏ vịt', push: 3, damage: 7, sizeRem: 3.9, image: spriteUrls[7] },
]

const dinosaursByPush = computed(() =>
  [...dinosaurs].sort(
    (left, right) => right.push - left.push || left.damage - right.damage || left.id - right.id,
  ),
)

function randomDino() {
  const index = Math.floor(Math.random() * dinosaurs.length)
  return dinosaurs[index]!
}

function isNaturalLtr(dino: DinoType) {
  return dino.id === 1
}

function dinoFacingClass(dino: DinoType, side: PlayerSide) {
  const shouldFlip =
    (isNaturalLtr(dino) && side === 'right') || (!isNaturalLtr(dino) && side === 'left')
  return shouldFlip ? '-scale-x-100' : ''
}

function previewSpriteStyle(dino: DinoType | null) {
  if (!dino) {
    return {}
  }

  const mobileScale = isMobileViewport.value ? 0.68 : 1
  const size = `${Math.max(2.4, Math.min(5.4, dino.sizeRem * mobileScale))}rem`
  return {
    width: size,
    height: size,
  }
}

function isFlyingDino(dino: DinoType) {
  return dino.id === 3
}

function sideLabel(side: PlayerSide, mode: GameMode) {
  if (side === 'left') {
    return 'Người chơi 1'
  }

  return mode === 'ai' ? 'Máy' : 'Người chơi 2'
}

function createLane(id: number): Lane {
  return {
    id,
    units: [],
    isColliding: false,
  }
}

const lanes = reactive<Lane[]>(Array.from({ length: 5 }, (_, index) => createLane(index)))
const leftHp = ref(maxHp)
const rightHp = ref(maxHp)
const leftCurrent = ref<DinoType>(randomDino())
const rightCurrent = ref<DinoType>(randomDino())
const leftSpawnCountdown = ref(0)
const rightSpawnCountdown = ref(0)
const rightAiThinkCountdown = ref(0)
const nextUnitId = ref(1)
const winner = ref<PlayerSide | null>(null)
const gameMode = ref<GameMode>('ai')
const showStartMenu = ref(true)
const matchCountdown = ref(0)
const isMatchLive = ref(false)
const status = ref('Chế độ đấu máy. Bạn ở bên trái, máy ở bên phải.')
const { width: viewportWidth } = useWindowSize()
const isTouchDevice = useMediaQuery('(pointer: coarse)')
const isPortraitViewport = useMediaQuery('(orientation: portrait)')
const isCompactHeight = useMediaQuery('(max-height: 520px)')

const leftHpWidth = computed(() => `${(leftHp.value / maxHp) * 100}%`)
const rightHpWidth = computed(() => `${(rightHp.value / maxHp) * 100}%`)
const leftSpawnCountdownText = computed(() => `${(leftSpawnCountdown.value / 1000).toFixed(1)}s`)
const rightSpawnCountdownText = computed(() => `${(rightSpawnCountdown.value / 1000).toFixed(1)}s`)
const matchCountdownText = computed(() => `${Math.max(1, Math.ceil(matchCountdown.value / 1000))}`)
const isMobileViewport = computed(() => isTouchDevice.value && viewportWidth.value < 1024)
const shouldForceLandscape = computed(() => isMobileViewport.value && isPortraitViewport.value)
const shouldHideFooter = computed(() => isCompactHeight.value || isMobileViewport.value)

function clampCombatX(x: number) {
  const clamped = Math.max(-overshootMargin, Math.min(laneLength + overshootMargin, x))
  return Math.round(clamped / positionStep) * positionStep
}

function getUnits(lane: Lane, side: PlayerSide) {
  return lane.units
    .filter((unit) => unit.side === side)
    .sort((a, b) => (side === 'left' ? a.x - b.x : b.x - a.x))
}

function getLanePush(lane: Lane, side: PlayerSide) {
  return getUnits(lane, side).reduce((total, unit) => total + unit.type.push, 0)
}

function getSpawnX(side: PlayerSide) {
  return side === 'left' ? spawnPadding : laneLength - spawnPadding
}

function canDeployToLane(lane: Lane, side: PlayerSide) {
  const spawnX = getSpawnX(side)
  return lane.units.every((unit) => Math.abs(unit.x - spawnX) > spawnBlockDistance)
}

function getTotalPush(units: Unit[]) {
  return units.reduce((total, unit) => total + unit.type.push, 0)
}

function getEngagedUnits(units: Unit[], side: PlayerSide) {
  if (units.length === 0) {
    return []
  }

  const engaged: Unit[] = [units[units.length - 1]!]

  for (let index = units.length - 2; index >= 0; index -= 1) {
    const unit = units[index]
    const ahead = engaged[engaged.length - 1]
    if (!unit || !ahead) {
      continue
    }

    const gap = side === 'left' ? ahead.x - unit.x : unit.x - ahead.x
    if (gap <= unitSpacing + 0.25) {
      engaged.push(unit)
      continue
    }

    break
  }

  return engaged
}

function refillCurrentDino(side: PlayerSide) {
  if (side === 'left') {
    leftSpawnCountdown.value = 0
    status.value = `${sideLabel('left', gameMode.value)} có khủng long mới.`
  } else {
    rightSpawnCountdown.value = 0
    status.value = `${sideLabel('right', gameMode.value)} có khủng long mới.`
  }
}

function isSideReady(side: PlayerSide) {
  return side === 'left' ? leftSpawnCountdown.value === 0 : rightSpawnCountdown.value === 0
}

function deployCurrentDino(laneIndex: number, side: PlayerSide) {
  if (winner.value) {
    return
  }

  const lane = lanes[laneIndex]
  if (!lane) {
    return
  }

  if (!isSideReady(side)) {
    return
  }

  const current = side === 'left' ? leftCurrent.value : rightCurrent.value

  if (!canDeployToLane(lane, side)) {
    status.value = `${sideLabel(side, gameMode.value)} không thể thả thêm ở lane ${laneIndex + 1}.`
    return
  }

  lane.units.push({
    id: nextUnitId.value++,
    side,
    x: getSpawnX(side),
    type: current,
  })

  if (side === 'left') {
    leftCurrent.value = randomDino()
    leftSpawnCountdown.value = spawnInterval
    status.value = `${sideLabel('left', gameMode.value)} thả ${current.name} vào lane ${laneIndex + 1}.`
  } else {
    rightCurrent.value = randomDino()
    rightSpawnCountdown.value = spawnInterval
    status.value = `${sideLabel('right', gameMode.value)} thả ${current.name} vào lane ${laneIndex + 1}.`
  }
}

function dealBaseDamage(lane: Lane, side: PlayerSide, unit: Unit) {
  if (side === 'left') {
    rightHp.value = Math.max(0, rightHp.value - unit.type.damage)
    status.value = `${sideLabel('left', gameMode.value)} đẩy khủng long qua lane ${lane.id + 1}, gây ${unit.type.damage} sát thương.`
  } else {
    leftHp.value = Math.max(0, leftHp.value - unit.type.damage)
    status.value = `${sideLabel('right', gameMode.value)} đẩy khủng long qua lane ${lane.id + 1}, gây ${unit.type.damage} sát thương.`
  }

  if (leftHp.value <= 0) {
    winner.value = 'right'
    status.value = `${sideLabel('right', gameMode.value)} chiến thắng.`
  } else if (rightHp.value <= 0) {
    winner.value = 'left'
    status.value = `${sideLabel('left', gameMode.value)} chiến thắng.`
  }
}

function resolveEscapedUnits(lane: Lane) {
  const leftScoredUnits = lane.units
    .filter((unit) => unit.side === 'left' && unit.x >= laneLength)
    .sort((a, b) => b.x - a.x)

  const rightScoredUnits = lane.units
    .filter((unit) => unit.side === 'right' && unit.x <= 0)
    .sort((a, b) => a.x - b.x)

  const leftEliminatedUnits = lane.units
    .filter((unit) => unit.side === 'left' && unit.x <= 0)
    .sort((a, b) => a.x - b.x)

  const rightEliminatedUnits = lane.units
    .filter((unit) => unit.side === 'right' && unit.x >= laneLength)
    .sort((a, b) => b.x - a.x)

  const escapedUnits = [
    ...leftScoredUnits,
    ...rightScoredUnits,
    ...leftEliminatedUnits,
    ...rightEliminatedUnits,
  ]
  if (escapedUnits.length === 0) {
    return false
  }

  const escapedIds = new Set(escapedUnits.map((unit) => unit.id))
  lane.units = lane.units.filter((unit) => !escapedIds.has(unit.id))

  for (const unit of leftScoredUnits) {
    dealBaseDamage(lane, 'left', unit)
    if (winner.value) {
      return true
    }
  }

  for (const unit of rightScoredUnits) {
    dealBaseDamage(lane, 'right', unit)
    if (winner.value) {
      return true
    }
  }

  if (leftEliminatedUnits.length > 0 || rightEliminatedUnits.length > 0) {
    const eliminatedSide =
      leftEliminatedUnits.length > 0
        ? sideLabel('left', gameMode.value)
        : sideLabel('right', gameMode.value)
    status.value = `${eliminatedSide} bị đẩy lùi và mất khủng long ở lane ${lane.id + 1}.`
  }

  return true
}

function getFrontUnit(lane: Lane, side: PlayerSide) {
  const units = getUnits(lane, side)
  return units[units.length - 1] ?? null
}

function getRightAiLaneScore(lane: Lane) {
  if (!canDeployToLane(lane, 'right')) {
    return Number.NEGATIVE_INFINITY
  }

  const current = rightCurrent.value
  const leftFront = getFrontUnit(lane, 'left')
  const rightFront = getFrontUnit(lane, 'right')
  const leftPush = getLanePush(lane, 'left')
  const rightPush = getLanePush(lane, 'right')
  let score = Math.random() * 0.3

  if (leftFront) {
    score += (leftFront.x / laneLength) * 7.5
  } else {
    score += current.damage * 0.7
  }

  if (leftPush > rightPush) {
    score += (leftPush - rightPush) * 1.35 + current.push * 1.1
  } else {
    score += current.damage * 0.55
  }

  if (rightFront) {
    score += (1 - rightFront.x / laneLength) * 4
  }

  if (!leftFront && !rightFront) {
    score += 1.2
  }

  return score
}

function chooseRightAiLane() {
  const rankedLanes = lanes
    .map((lane) => ({
      laneId: lane.id,
      score: getRightAiLaneScore(lane),
    }))
    .filter((entry) => Number.isFinite(entry.score))
    .sort((left, right) => right.score - left.score)

  return rankedLanes[0]?.laneId ?? null
}

async function requestLandscapeMode() {
  try {
    if (document.documentElement.requestFullscreen && !document.fullscreenElement) {
      await document.documentElement.requestFullscreen()
    }
  } catch {
    // Ignore fullscreen failures on browsers that restrict this behavior.
  }

  try {
    const orientation = screen.orientation as Partial<LockableScreenOrientation> | undefined
    if (orientation?.lock) {
      await orientation.lock('landscape')
    }
  } catch {
    // iOS Safari and some mobile browsers do not support orientation lock.
  }
}

function beginMatch() {
  void requestLandscapeMode()
  resetGame()
  showStartMenu.value = false
  isMatchLive.value = false
  matchCountdown.value = preMatchCountdown
  status.value =
    gameMode.value === 'ai' ? 'Chuẩn bị đối đầu với máy.' : 'Chuẩn bị cho trận đấu 2 người.'
}

function setGameMode(mode: GameMode) {
  if (gameMode.value === mode) {
    return
  }

  gameMode.value = mode
  resetGame()
}

function updateLane(lane: Lane, dt: number) {
  const leftUnits = getUnits(lane, 'left')
  const rightUnits = getUnits(lane, 'right')
  const leftFront = leftUnits[leftUnits.length - 1] ?? null
  const rightFront = rightUnits[rightUnits.length - 1] ?? null

  if (resolveEscapedUnits(lane)) {
    lane.isColliding = false
    return
  }

  const collisionDistance = lane.isColliding ? collisionReleaseDistance : collideDistance
  const isFrontCollision =
    leftFront && rightFront && rightFront.x - leftFront.x <= collisionDistance

  if (isFrontCollision && leftFront && rightFront) {
    lane.isColliding = true
    const leftEngagedUnits = getEngagedUnits(leftUnits, 'left')
    const rightEngagedUnits = getEngagedUnits(rightUnits, 'right')
    const diff = getTotalPush(leftEngagedUnits) - getTotalPush(rightEngagedUnits)
    const direction = Math.sign(diff)
    const delta = (direction * movementSpeed * dt) / 1000

    for (const unit of leftEngagedUnits) {
      unit.x = clampCombatX(unit.x + delta)
    }

    for (const unit of rightEngagedUnits) {
      unit.x = clampCombatX(unit.x + delta)
    }

    if (resolveEscapedUnits(lane)) {
      lane.isColliding = false
      return
    }

    const center = (leftFront.x + rightFront.x) / 2
    leftFront.x = clampCombatX(center - collideDistance / 2)
    rightFront.x = clampCombatX(center + collideDistance / 2)
  } else {
    lane.isColliding = false
    if (leftFront) {
      leftFront.x = clampCombatX(leftFront.x + (movementSpeed * dt) / 1000)
    }

    if (rightFront) {
      rightFront.x = clampCombatX(rightFront.x - (movementSpeed * dt) / 1000)
    }
  }

  for (let index = leftUnits.length - 2; index >= 0; index -= 1) {
    const unit = leftUnits[index]
    const ahead = leftUnits[index + 1]
    if (!unit || !ahead) {
      continue
    }

    const targetX = ahead.x - unitSpacing
    unit.x = clampCombatX(Math.min(unit.x + (movementSpeed * dt) / 1000, targetX))
  }

  for (let index = rightUnits.length - 2; index >= 0; index -= 1) {
    const unit = rightUnits[index]
    const ahead = rightUnits[index + 1]
    if (!unit || !ahead) {
      continue
    }

    const targetX = ahead.x + unitSpacing
    unit.x = clampCombatX(Math.max(unit.x - (movementSpeed * dt) / 1000, targetX))
  }

  resolveEscapedUnits(lane)
}

useRafFn(({ delta }) => {
  if (showStartMenu.value) {
    return
  }

  if (winner.value) {
    return
  }

  const dt = Math.min(delta, 32)

  if (!isMatchLive.value) {
    if (matchCountdown.value > 0) {
      matchCountdown.value = Math.max(0, matchCountdown.value - dt)
      if (matchCountdown.value === 0) {
        isMatchLive.value = true
        status.value =
          gameMode.value === 'ai'
            ? 'Trận đấu bắt đầu. Máy đang canh lane bên phải.'
            : 'Trận đấu bắt đầu.'
      }
    }
    return
  }

  if (leftSpawnCountdown.value > 0) {
    leftSpawnCountdown.value = Math.max(0, leftSpawnCountdown.value - dt)
    if (leftSpawnCountdown.value === 0) {
      refillCurrentDino('left')
    }
  }

  if (rightSpawnCountdown.value > 0) {
    rightSpawnCountdown.value = Math.max(0, rightSpawnCountdown.value - dt)
    if (rightSpawnCountdown.value === 0) {
      refillCurrentDino('right')
    }
  }

  if (gameMode.value === 'ai') {
    if (isSideReady('right')) {
      if (rightAiThinkCountdown.value <= 0) {
        rightAiThinkCountdown.value =
          aiReactionMin + Math.random() * (aiReactionMax - aiReactionMin)
      } else {
        rightAiThinkCountdown.value = Math.max(0, rightAiThinkCountdown.value - dt)
        if (rightAiThinkCountdown.value === 0) {
          const laneId = chooseRightAiLane()
          if (laneId !== null) {
            deployCurrentDino(laneId, 'right')
          } else {
            rightAiThinkCountdown.value = 180
          }
        }
      }
    } else {
      rightAiThinkCountdown.value = 0
    }
  } else {
    rightAiThinkCountdown.value = 0
  }

  for (const lane of lanes) {
    updateLane(lane, dt)
  }
})

function resetGame() {
  leftHp.value = maxHp
  rightHp.value = maxHp
  leftCurrent.value = randomDino()
  rightCurrent.value = randomDino()
  leftSpawnCountdown.value = 0
  rightSpawnCountdown.value = 0
  rightAiThinkCountdown.value = 0
  nextUnitId.value = 1
  winner.value = null
  isMatchLive.value = false
  matchCountdown.value = 0
  status.value =
    gameMode.value === 'ai'
      ? 'Chế độ đấu máy. Bạn ở bên trái, máy ở bên phải.'
      : 'Mỗi người có timer riêng. Thả khủng long vào lane để bắt đầu ép sân.'
  lanes.splice(0, lanes.length, ...Array.from({ length: 5 }, (_, index) => createLane(index)))
}

function unitStyle(unit: Unit) {
  const mobileScale = isMobileViewport.value ? 0.62 : 1
  const sizeRem = unit.type.sizeRem * mobileScale

  return {
    left: `calc(${unit.x}% - ${sizeRem / 2}rem)`,
    bottom: isFlyingDino(unit.type)
      ? isMobileViewport.value
        ? '1.45rem'
        : '2.2rem'
      : isMobileViewport.value
        ? '0.15rem'
        : '0.4rem',
    width: `${sizeRem}rem`,
    height: `${sizeRem}rem`,
  }
}

function cooldownFrameStyle(side: PlayerSide) {
  const countdown = side === 'left' ? leftSpawnCountdown.value : rightSpawnCountdown.value
  const progress = countdown === 0 ? 1 : (spawnInterval - countdown) / spawnInterval
  const color = countdown === 0 ? 'rgba(255, 255, 255, 0.92)' : 'rgba(255, 255, 255, 0.52)'
  const track = countdown === 0 ? 'rgba(255, 255, 255, 0.18)' : 'rgba(255, 255, 255, 0.06)'

  return {
    background: `conic-gradient(${color} ${Math.max(0, Math.min(1, progress)) * 360}deg, ${track} 0deg)`,
    opacity: countdown === 0 ? '1' : '0.9',
  }
}
</script>

<template>
  <div
    class="relative h-dvh min-h-dvh overflow-hidden bg-bg-deep px-2 py-2 text-text-primary md:px-3 md:py-3"
  >
    <div class="mx-auto flex h-full max-w-7xl flex-col gap-1.5 md:gap-1.5">
      <header
        v-if="isMobileViewport"
        class="grid shrink-0 grid-cols-[60px_52px_minmax(0,1fr)_52px_60px] gap-1"
      >
        <section class="border border-border-default bg-bg-surface p-1">
          <div class="mx-auto h-12 w-12 p-[2px]" :style="cooldownFrameStyle('left')">
            <div
              class="grid h-full w-full place-items-center border border-border-default bg-bg-surface"
            >
              <img
                :src="leftCurrent.image"
                :alt="leftCurrent.name"
                class="mx-auto block object-contain object-center"
                :class="dinoFacingClass(leftCurrent, 'left')"
                :style="previewSpriteStyle(leftCurrent)"
              />
            </div>
          </div>
          <p class="mt-1 truncate text-center font-display text-[9px] text-text-primary">
            {{ leftCurrent.name }}
          </p>
          <p
            class="mt-0.5 text-center text-[8px] leading-none text-text-secondary"
            :class="{ 'text-accent-amber': isSideReady('left') }"
          >
            {{ isSideReady('left') ? 'Sẵn' : leftSpawnCountdownText }}
          </p>
        </section>

        <section class="border border-border-default bg-bg-surface p-1">
          <p class="text-center font-display text-[10px] tracking-[0.18em] text-accent-coral">P1</p>
          <p class="mt-1 text-center font-display text-2xl leading-none">{{ leftHp }}</p>
          <div class="mt-1.5 border border-border-default bg-bg-deep p-1">
            <div class="h-1.5 bg-bg-surface">
              <div class="h-full bg-accent-coral" :style="{ width: leftHpWidth }" />
            </div>
          </div>
        </section>

        <section class="border border-border-default bg-bg-surface p-1.5">
          <p
            class="truncate text-center font-display text-[10px] tracking-[0.24em] text-accent-coral"
          >
            // DINOSAUR BATTLE
          </p>
          <div class="mt-1.5 grid justify-items-center gap-1">
            <div class="inline-flex border border-border-default bg-bg-deep">
              <button
                type="button"
                class="px-2 py-1 text-[9px] transition"
                :class="
                  gameMode === 'pvp'
                    ? 'bg-accent-coral text-bg-deep'
                    : 'text-text-secondary hover:bg-bg-elevated hover:text-text-primary'
                "
                @click="setGameMode('pvp')"
              >
                2P
              </button>
              <button
                type="button"
                class="border-l border-border-default px-2 py-1 text-[9px] transition"
                :class="
                  gameMode === 'ai'
                    ? 'bg-accent-sky text-bg-deep'
                    : 'text-text-secondary hover:bg-bg-elevated hover:text-text-primary'
                "
                @click="setGameMode('ai')"
              >
                AI
              </button>
            </div>
            <div class="flex flex-wrap justify-center gap-1">
              <button
                type="button"
                class="inline-flex items-center justify-center gap-1 border border-border-default bg-bg-deep px-1.5 py-1 text-[9px] transition hover:border-accent-amber hover:bg-bg-elevated"
                @click="beginMatch"
              >
                <Icon icon="lucide:rotate-ccw" class="size-3" />
                Chơi lại
              </button>
              <RouterLink
                to="/"
                class="inline-flex items-center justify-center gap-1 border border-border-default bg-bg-deep px-1.5 py-1 text-[9px] text-text-secondary transition hover:border-accent-coral hover:bg-bg-elevated hover:text-text-primary"
              >
                <Icon icon="lucide:house" class="size-3" />
                Trang chủ
              </RouterLink>
            </div>
          </div>
          <p
            v-if="winner"
            class="mt-1 truncate text-center font-display text-[10px] text-accent-amber"
          >
            {{ winner === 'left' ? 'P1 thắng' : gameMode === 'ai' ? 'Máy thắng' : 'P2 thắng' }}
          </p>
        </section>

        <section class="border border-border-default bg-bg-surface p-1">
          <p class="text-center font-display text-[10px] tracking-[0.18em] text-accent-sky">
            {{ gameMode === 'ai' ? 'MÁY' : 'P2' }}
          </p>
          <p class="mt-1 text-center font-display text-2xl leading-none">{{ rightHp }}</p>
          <div class="mt-1.5 border border-border-default bg-bg-deep p-1">
            <div class="h-1.5 bg-bg-surface">
              <div class="h-full bg-accent-sky" :style="{ width: rightHpWidth }" />
            </div>
          </div>
        </section>

        <section class="border border-border-default bg-bg-surface p-1">
          <div class="mx-auto h-12 w-12 p-[2px]" :style="cooldownFrameStyle('right')">
            <div
              class="grid h-full w-full place-items-center border border-border-default bg-bg-surface"
            >
              <img
                :src="rightCurrent.image"
                :alt="rightCurrent.name"
                class="mx-auto block object-contain object-center"
                :class="dinoFacingClass(rightCurrent, 'right')"
                :style="previewSpriteStyle(rightCurrent)"
              />
            </div>
          </div>
          <p class="mt-1 truncate text-center font-display text-[9px] text-text-primary">
            {{ rightCurrent.name }}
          </p>
          <p
            class="mt-0.5 text-center text-[8px] leading-none text-text-secondary"
            :class="{ 'text-accent-amber': isSideReady('right') }"
          >
            {{ isSideReady('right') ? 'Sẵn' : rightSpawnCountdownText }}
          </p>
        </section>
      </header>

      <header v-else class="grid shrink-0 gap-1 md:grid-cols-[0.92fr_1.08fr_0.92fr] xl:gap-3">
        <section class="border border-border-default bg-bg-surface p-2 md:p-2 xl:p-3">
          <div class="flex items-center justify-between gap-3">
            <div class="flex items-center gap-2">
              <div
                class="h-20 w-20 shrink-0 p-[2px] md:h-16 md:w-16 xl:h-28 xl:w-28"
                :style="cooldownFrameStyle('left')"
              >
                <div
                  class="grid h-full w-full place-items-center border border-border-default bg-bg-surface"
                >
                  <img
                    :src="leftCurrent.image"
                    :alt="leftCurrent.name"
                    class="mx-auto block object-contain object-center"
                    :class="dinoFacingClass(leftCurrent, 'left')"
                    :style="previewSpriteStyle(leftCurrent)"
                  />
                </div>
              </div>
              <div
                class="min-h-12 min-w-0 text-[10px] text-text-secondary md:min-h-10 md:text-[9px] xl:min-h-20 xl:text-xs"
              >
                <p class="truncate font-display text-sm text-text-primary md:text-xs xl:text-lg">
                  {{ leftCurrent.name }}
                </p>
                <p>Push {{ leftCurrent.push }}</p>
                <p>Damage {{ leftCurrent.damage }}</p>
                <p class="mt-1" :class="{ 'text-accent-amber': isSideReady('left') }">
                  {{ isSideReady('left') ? 'Sẵn sàng' : leftSpawnCountdownText }}
                </p>
              </div>
            </div>

            <div class="w-28 shrink-0 text-right">
              <div class="flex items-end justify-end gap-2">
                <p class="font-display text-[11px] tracking-[0.24em] text-accent-coral">P1</p>
                <p class="font-display text-3xl font-bold">
                  {{ leftHp }}
                </p>
              </div>
              <div class="mt-1 border border-border-default bg-bg-deep p-1">
                <div class="h-2 bg-bg-surface">
                  <div class="h-full bg-accent-coral" :style="{ width: leftHpWidth }" />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section class="border border-border-default bg-bg-surface p-2 md:p-2 xl:p-3">
          <div class="flex items-start justify-between gap-3">
            <div>
              <p class="font-display text-[11px] tracking-[0.28em] text-accent-coral">
                // DINOSAUR BATTLE
              </p>
              <h1
                class="font-display text-[2rem] font-bold uppercase leading-none md:text-[1.75rem] xl:text-3xl"
              >
                Khủng Long Chiến
              </h1>
            </div>
            <div class="grid gap-2">
              <div class="inline-flex border border-border-default bg-bg-deep">
                <button
                  type="button"
                  class="px-2.5 py-1 text-[10px] transition md:px-2 xl:px-2.5"
                  :class="
                    gameMode === 'pvp'
                      ? 'bg-accent-coral text-bg-deep'
                      : 'text-text-secondary hover:bg-bg-elevated hover:text-text-primary'
                  "
                  @click="setGameMode('pvp')"
                >
                  2 người
                </button>
                <button
                  type="button"
                  class="border-l border-border-default px-2.5 py-1 text-[10px] transition md:px-2 xl:px-2.5"
                  :class="
                    gameMode === 'ai'
                      ? 'bg-accent-sky text-bg-deep'
                      : 'text-text-secondary hover:bg-bg-elevated hover:text-text-primary'
                  "
                  @click="setGameMode('ai')"
                >
                  Đấu máy
                </button>
              </div>
              <div class="flex items-center gap-1.5 xl:gap-2">
                <button
                  type="button"
                  class="inline-flex min-w-24 items-center justify-center gap-1.5 border border-border-default bg-bg-deep px-2.5 py-1.5 text-[11px] transition hover:border-accent-amber hover:bg-bg-elevated md:min-w-20 md:px-2 md:text-[10px] xl:min-w-28 xl:gap-2 xl:px-3 xl:py-2 xl:text-xs"
                  @click="beginMatch"
                >
                  <Icon icon="lucide:rotate-ccw" class="size-4" />
                  Chơi lại
                </button>
                <RouterLink
                  to="/"
                  class="inline-flex min-w-24 items-center justify-center gap-1.5 border border-border-default bg-bg-deep px-2.5 py-1.5 text-[11px] text-text-secondary transition hover:border-accent-coral hover:bg-bg-elevated hover:text-text-primary md:min-w-20 md:px-2 md:text-[10px] xl:min-w-28 xl:gap-2 xl:px-3 xl:py-2 xl:text-xs"
                >
                  <Icon icon="lucide:house" class="size-4" />
                  Trang chủ
                </RouterLink>
              </div>
            </div>
          </div>

          <p
            v-if="winner"
            class="mt-1 font-display text-lg text-accent-amber md:text-base xl:mt-2 xl:text-xl"
          >
            {{
              winner === 'left'
                ? 'Người chơi 1 thắng'
                : gameMode === 'ai'
                  ? 'Máy thắng'
                  : 'Người chơi 2 thắng'
            }}
          </p>
        </section>

        <section class="border border-border-default bg-bg-surface p-2 md:p-2 xl:p-3">
          <div class="flex items-center justify-between gap-3">
            <div class="w-28 shrink-0">
              <div class="flex items-end gap-2">
                <p class="font-display text-[11px] tracking-[0.24em] text-accent-sky">
                  {{ gameMode === 'ai' ? 'MÁY' : 'P2' }}
                </p>
                <p class="font-display text-3xl font-bold">
                  {{ rightHp }}
                </p>
              </div>
              <div class="mt-1 w-28 border border-border-default bg-bg-deep p-1">
                <div class="h-2 bg-bg-surface">
                  <div class="h-full bg-accent-sky" :style="{ width: rightHpWidth }" />
                </div>
              </div>
            </div>

            <div class="flex min-w-0 items-center gap-2">
              <div
                class="h-20 w-20 shrink-0 p-[2px] md:h-16 md:w-16 xl:h-28 xl:w-28"
                :style="cooldownFrameStyle('right')"
              >
                <div
                  class="grid h-full w-full place-items-center border border-border-default bg-bg-surface"
                >
                  <img
                    :src="rightCurrent.image"
                    :alt="rightCurrent.name"
                    class="mx-auto block object-contain object-center"
                    :class="dinoFacingClass(rightCurrent, 'right')"
                    :style="previewSpriteStyle(rightCurrent)"
                  />
                </div>
              </div>
              <div
                class="min-h-12 min-w-0 text-[10px] text-text-secondary md:min-h-10 md:text-[9px] xl:min-h-20 xl:text-xs"
              >
                <p class="truncate font-display text-sm text-text-primary md:text-xs xl:text-lg">
                  {{ rightCurrent.name }}
                </p>
                <p>Push {{ rightCurrent.push }}</p>
                <p>Damage {{ rightCurrent.damage }}</p>
                <p class="mt-1" :class="{ 'text-accent-amber': isSideReady('right') }">
                  {{ isSideReady('right') ? 'Sẵn sàng' : rightSpawnCountdownText }}
                </p>
              </div>
            </div>
          </div>
        </section>
      </header>

      <section class="flex min-h-0 flex-1 flex-col gap-1.5 md:gap-1 xl:gap-2">
        <article
          v-for="lane in lanes"
          :key="lane.id"
          class="grid min-h-0 flex-1 grid-cols-[56px_minmax(0,1fr)_56px] gap-1 md:grid-cols-[58px_minmax(0,1fr)_58px] xl:grid-cols-[88px_minmax(0,1fr)_88px] xl:gap-2"
        >
          <button
            type="button"
            class="grid place-items-center border border-border-default bg-bg-surface p-2 transition hover:border-accent-coral hover:bg-bg-elevated disabled:opacity-45 md:p-1.5 xl:p-2"
            :disabled="
              !isMatchLive ||
              winner !== null ||
              !isSideReady('left') ||
              !canDeployToLane(lane, 'left')
            "
            @click="deployCurrentDino(lane.id, 'left')"
          >
            <div class="text-center">
              <p class="font-display text-xs tracking-[0.2em] text-accent-coral">P1</p>
              <p class="mt-1 text-[10px] text-text-secondary md:hidden xl:block">
                Lane {{ lane.id + 1 }}
              </p>
              <p class="mt-1 hidden text-[10px] text-text-secondary md:block xl:hidden">
                {{ lane.id + 1 }}
              </p>
            </div>
          </button>

          <div
            class="relative border border-border-default bg-bg-surface"
            :class="isMobileViewport ? 'overflow-hidden' : 'overflow-visible'"
          >
            <div class="absolute inset-y-0 left-4 w-px bg-accent-coral/30" />
            <div class="absolute inset-y-0 right-4 w-px bg-accent-sky/30" />
            <div class="absolute inset-y-0 left-1/2 w-px bg-border-default/70" />
            <div
              class="absolute left-3 top-2 font-display text-[10px] tracking-[0.2em] text-text-dim"
            >
              LANE {{ lane.id + 1 }}
            </div>
            <div class="absolute left-1/2 top-7 flex -translate-x-1/2 items-center gap-2">
              <div
                class="min-w-8 border border-border-default bg-accent-coral/18 px-2 py-0.5 text-center font-display text-xs text-accent-coral"
                :class="{ 'opacity-35': getLanePush(lane, 'left') === 0 }"
              >
                {{ getLanePush(lane, 'left') }}
              </div>
              <div
                class="min-w-8 border border-border-default bg-accent-sky/18 px-2 py-0.5 text-center font-display text-xs text-accent-sky"
                :class="{ 'opacity-35': getLanePush(lane, 'right') === 0 }"
              >
                {{ getLanePush(lane, 'right') }}
              </div>
            </div>

            <div
              v-for="unit in lane.units"
              :key="unit.id"
              class="absolute"
              :style="unitStyle(unit)"
            >
              <img
                :src="unit.type.image"
                :alt="unit.type.name"
                class="h-full w-full object-contain"
                :class="dinoFacingClass(unit.type, unit.side)"
              />
            </div>
          </div>

          <button
            type="button"
            class="grid place-items-center border border-border-default bg-bg-surface p-2 transition hover:border-accent-sky hover:bg-bg-elevated disabled:opacity-45 md:p-1.5 xl:p-2"
            :disabled="
              !isMatchLive ||
              gameMode === 'ai' ||
              winner !== null ||
              !isSideReady('right') ||
              !canDeployToLane(lane, 'right')
            "
            @click="deployCurrentDino(lane.id, 'right')"
          >
            <div class="text-center">
              <p class="font-display text-xs tracking-[0.2em] text-accent-sky">
                {{ gameMode === 'ai' ? 'AI' : 'P2' }}
              </p>
              <p class="mt-1 text-[10px] text-text-secondary md:hidden xl:block">
                Lane {{ lane.id + 1 }}
              </p>
              <p class="mt-1 hidden text-[10px] text-text-secondary md:block xl:hidden">
                {{ lane.id + 1 }}
              </p>
            </div>
          </button>
        </article>
      </section>

      <footer
        v-if="!shouldHideFooter"
        class="grid shrink-0 gap-1.5 text-[11px] text-text-secondary sm:grid-cols-4 md:gap-1 xl:gap-2 xl:text-xs"
      >
        <div
          v-for="dino in dinosaursByPush"
          :key="dino.id"
          class="flex items-center gap-2 border border-border-default bg-bg-surface px-2.5 py-1.5 md:px-2 md:py-1.5 xl:px-3 xl:py-2"
        >
          <img
            :src="dino.image"
            :alt="dino.name"
            class="object-contain"
            :style="{
              width: `${Math.max(2.2, dino.sizeRem * 0.68)}rem`,
              height: `${Math.max(2.2, dino.sizeRem * 0.68)}rem`,
            }"
          />
          <div>
            <p class="font-display text-sm text-text-primary md:text-[13px] xl:text-sm">
              {{ dino.name }}
            </p>
            <p>Push {{ dino.push }} · Damage {{ dino.damage }}</p>
          </div>
        </div>
      </footer>
    </div>

    <div
      v-if="showStartMenu"
      class="absolute inset-0 z-40 grid place-items-center bg-bg-deep/88"
      :class="isMobileViewport ? 'px-2 py-2' : 'px-4'"
    >
      <div
        class="w-full overflow-auto border border-border-default bg-bg-surface text-center"
        :class="
          isMobileViewport
            ? 'max-h-[calc(100dvh-0.75rem)] max-w-4xl p-3'
            : 'max-h-[calc(100dvh-1rem)] max-w-2xl p-4 md:p-5'
        "
      >
        <p class="font-display text-[11px] tracking-[0.28em] text-accent-coral">
          // DINOSAUR BATTLE
        </p>
        <h2
          class="font-display uppercase leading-none"
          :class="isMobileViewport ? 'mt-1 text-2xl' : 'mt-2 text-4xl'"
        >
          Khủng Long Chiến
        </h2>
        <div :class="isMobileViewport ? 'mt-3' : 'mt-4'">
          <p
            class="font-display tracking-[0.24em] text-text-dim"
            :class="isMobileViewport ? 'text-[10px]' : 'text-[11px]'"
          >
            THẢ KHỦNG LONG VÀO LANE ĐỂ ĐẨY ĐỐI THỦ
          </p>
          <div
            class="grid grid-cols-4"
            :class="isMobileViewport ? 'mt-2 gap-1' : 'mt-3 gap-1.5 md:gap-3'"
          >
            <div
              v-for="dino in dinosaursByPush"
              :key="`menu-${dino.id}`"
              class="border border-border-default bg-bg-deep"
              :class="isMobileViewport ? 'px-1 py-1' : 'px-2 py-1.5'"
            >
              <div class="grid place-items-center">
                <img
                  :src="dino.image"
                  :alt="dino.name"
                  class="object-contain"
                  :style="{
                    width: isMobileViewport
                      ? `${Math.max(1.8, dino.sizeRem * 0.48)}rem`
                      : `${Math.max(2.8, dino.sizeRem * 0.78)}rem`,
                    height: isMobileViewport
                      ? `${Math.max(1.8, dino.sizeRem * 0.48)}rem`
                      : `${Math.max(2.8, dino.sizeRem * 0.78)}rem`,
                  }"
                />
              </div>
              <p
                class="font-display text-text-primary"
                :class="
                  isMobileViewport ? 'mt-1 text-[10px] leading-tight' : 'mt-2 text-xs md:text-sm'
                "
              >
                {{ dino.name }}
              </p>
              <p
                class="text-text-secondary"
                :class="
                  isMobileViewport
                    ? 'mt-0.5 text-[9px] leading-tight'
                    : 'mt-1 text-[10px] md:text-[11px]'
                "
              >
                <template v-if="isMobileViewport">{{ dino.push }} · {{ dino.damage }}</template>
                <template v-else>Đẩy {{ dino.push }} · Đánh {{ dino.damage }}</template>
              </p>
            </div>
          </div>
        </div>

        <div :class="isMobileViewport ? 'mt-3' : 'mt-4'">
          <p
            class="font-display tracking-[0.24em] text-text-dim"
            :class="isMobileViewport ? 'text-[10px]' : 'text-[11px]'"
          >
            CHẾ ĐỘ
          </p>
          <div
            class="inline-flex border border-border-default bg-bg-deep"
            :class="isMobileViewport ? 'mt-2' : 'mt-3'"
          >
            <button
              type="button"
              class="transition"
              :class="[
                isMobileViewport ? 'px-3 py-1.5 text-[10px]' : 'px-4 py-2 text-sm',
                gameMode === 'ai'
                  ? 'bg-accent-sky text-bg-deep'
                  : 'text-text-secondary hover:bg-bg-elevated hover:text-text-primary',
              ]"
              @click="setGameMode('ai')"
            >
              Đấu máy
            </button>
            <button
              type="button"
              class="border-l border-border-default transition"
              :class="[
                isMobileViewport ? 'px-3 py-1.5 text-[10px]' : 'px-4 py-2 text-sm',
                gameMode === 'pvp'
                  ? 'bg-accent-coral text-bg-deep'
                  : 'text-text-secondary hover:bg-bg-elevated hover:text-text-primary',
              ]"
              @click="setGameMode('pvp')"
            >
              2 người
            </button>
          </div>
        </div>

        <div class="flex justify-center" :class="isMobileViewport ? 'mt-3' : 'mt-5'">
          <button
            type="button"
            class="inline-flex items-center gap-2 border border-border-default bg-accent-amber font-display text-bg-deep transition hover:brightness-110"
            :class="isMobileViewport ? 'px-4 py-2 text-[11px]' : 'px-5 py-3 text-sm'"
            @click="beginMatch"
          >
            <Icon icon="lucide:play" :class="isMobileViewport ? 'size-3.5' : 'size-4'" />
            Bắt đầu
          </button>
        </div>
      </div>
    </div>

    <div
      v-else-if="!isMatchLive && matchCountdown > 0"
      class="absolute inset-0 z-30 grid place-items-center bg-bg-deep/42"
    >
      <div
        class="grid h-32 w-32 place-items-center border border-border-default bg-bg-surface/88 font-display text-6xl text-accent-amber backdrop-blur-sm"
      >
        {{ matchCountdownText }}
      </div>
    </div>

    <div
      v-if="shouldForceLandscape"
      class="absolute inset-0 z-50 grid place-items-center bg-bg-deep px-5 text-center"
    >
      <div class="max-w-sm border border-border-default bg-bg-surface p-5">
        <div
          class="mx-auto grid h-16 w-16 place-items-center border border-border-default bg-bg-deep text-accent-amber"
        >
          <Icon icon="lucide:smartphone" class="size-8 rotate-90" />
        </div>
        <p class="mt-4 font-display text-2xl uppercase">Xoay ngang</p>
        <p class="mt-2 text-sm text-text-secondary">
          Trò chơi này cần điện thoại nằm ngang để hiển thị đầy đủ.
        </p>
        <button
          type="button"
          class="mt-4 inline-flex items-center gap-2 border border-border-default bg-accent-amber px-4 py-2 font-display text-sm text-bg-deep transition hover:brightness-110"
          @click="requestLandscapeMode"
        >
          <Icon icon="lucide:rotate-cw" class="size-4" />
          Thử xoay ngang
        </button>
      </div>
    </div>
  </div>
</template>
