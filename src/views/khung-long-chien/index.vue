<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRafFn } from '@vueuse/core'
import { Icon } from '@iconify/vue'

type PlayerSide = 'left' | 'right'

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
}

const maxHp = 100
const laneLength = 100
const spawnPadding = 8
const unitSpacing = 5.5
const spawnBlockDistance = unitSpacing + 0.35
const collideDistance = 4.8
const movementSpeed = 7
const spawnInterval = 3000
const overshootMargin = 14
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
  { id: 1, name: 'Bạo Chúa', push: 3, damage: 7, sizeRem: 3.9, image: spriteUrls[0] },
  { id: 2, name: 'Gai nhỏ', push: 6, damage: 4, sizeRem: 4.9, image: spriteUrls[1] },
  { id: 3, name: 'Cánh bay', push: 2, damage: 8, sizeRem: 3.5, image: spriteUrls[2] },
  { id: 4, name: 'Cổ dài', push: 9, damage: 1, sizeRem: 6.4, image: spriteUrls[3] },
  { id: 5, name: 'Mỏ dài', push: 4, damage: 6, sizeRem: 4.2, image: spriteUrls[4] },
  { id: 6, name: 'Ba sừng', push: 8, damage: 2, sizeRem: 5.8, image: spriteUrls[5] },
  { id: 7, name: 'Lưng gai', push: 7, damage: 3, sizeRem: 5.4, image: spriteUrls[6] },
  { id: 8, name: 'Mỏ vịt', push: 5, damage: 5, sizeRem: 4.5, image: spriteUrls[7] },
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

  const size = `${Math.max(3.6, Math.min(5.4, dino.sizeRem))}rem`
  return {
    width: size,
    height: size,
  }
}

function isFlyingDino(dino: DinoType) {
  return dino.id === 3
}

function createLane(id: number): Lane {
  return {
    id,
    units: [],
  }
}

const lanes = reactive<Lane[]>(Array.from({ length: 5 }, (_, index) => createLane(index)))
const leftHp = ref(maxHp)
const rightHp = ref(maxHp)
const leftCurrent = ref<DinoType | null>(randomDino())
const rightCurrent = ref<DinoType | null>(randomDino())
const leftSpawnCountdown = ref(0)
const rightSpawnCountdown = ref(0)
const nextUnitId = ref(1)
const winner = ref<PlayerSide | null>(null)
const status = ref('Mỗi người có timer riêng. Thả khủng long vào lane để bắt đầu ép sân.')

const leftHpWidth = computed(() => `${(leftHp.value / maxHp) * 100}%`)
const rightHpWidth = computed(() => `${(rightHp.value / maxHp) * 100}%`)
const leftSpawnProgressWidth = computed(
  () => `${((spawnInterval - leftSpawnCountdown.value) / spawnInterval) * 100}%`,
)
const rightSpawnProgressWidth = computed(
  () => `${((spawnInterval - rightSpawnCountdown.value) / spawnInterval) * 100}%`,
)
const leftSpawnCountdownText = computed(() => `${(leftSpawnCountdown.value / 1000).toFixed(1)}s`)
const rightSpawnCountdownText = computed(() => `${(rightSpawnCountdown.value / 1000).toFixed(1)}s`)

function clampCombatX(x: number) {
  return Math.max(-overshootMargin, Math.min(laneLength + overshootMargin, x))
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
    leftCurrent.value = randomDino()
    leftSpawnCountdown.value = 0
    status.value = 'Người chơi 1 có khủng long mới.'
  } else {
    rightCurrent.value = randomDino()
    rightSpawnCountdown.value = 0
    status.value = 'Người chơi 2 có khủng long mới.'
  }
}

function deployCurrentDino(laneIndex: number, side: PlayerSide) {
  if (winner.value) {
    return
  }

  const lane = lanes[laneIndex]
  if (!lane) {
    return
  }

  const current = side === 'left' ? leftCurrent.value : rightCurrent.value
  if (!current) {
    return
  }

  if (!canDeployToLane(lane, side)) {
    status.value = `${side === 'left' ? 'Người chơi 1' : 'Người chơi 2'} không thể thả thêm ở lane ${laneIndex + 1}.`
    return
  }

  lane.units.push({
    id: nextUnitId.value++,
    side,
    x: getSpawnX(side),
    type: current,
  })

  if (side === 'left') {
    leftCurrent.value = null
    leftSpawnCountdown.value = spawnInterval
    status.value = `Người chơi 1 thả ${current.name} vào lane ${laneIndex + 1}.`
  } else {
    rightCurrent.value = null
    rightSpawnCountdown.value = spawnInterval
    status.value = `Người chơi 2 thả ${current.name} vào lane ${laneIndex + 1}.`
  }
}

function dealBaseDamage(lane: Lane, side: PlayerSide, unit: Unit) {
  if (side === 'left') {
    rightHp.value = Math.max(0, rightHp.value - unit.type.damage)
    status.value = `Người chơi 1 đẩy khủng long qua lane ${lane.id + 1}, gây ${unit.type.damage} sát thương.`
  } else {
    leftHp.value = Math.max(0, leftHp.value - unit.type.damage)
    status.value = `Người chơi 2 đẩy khủng long qua lane ${lane.id + 1}, gây ${unit.type.damage} sát thương.`
  }

  if (leftHp.value <= 0) {
    winner.value = 'right'
    status.value = 'Người chơi 2 chiến thắng.'
  } else if (rightHp.value <= 0) {
    winner.value = 'left'
    status.value = 'Người chơi 1 chiến thắng.'
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
    const eliminatedSide = leftEliminatedUnits.length > 0 ? 'Người chơi 1' : 'Người chơi 2'
    status.value = `${eliminatedSide} bị đẩy lùi và mất khủng long ở lane ${lane.id + 1}.`
  }

  return true
}

function updateLane(lane: Lane, dt: number) {
  const leftUnits = getUnits(lane, 'left')
  const rightUnits = getUnits(lane, 'right')
  const leftFront = leftUnits[leftUnits.length - 1] ?? null
  const rightFront = rightUnits[rightUnits.length - 1] ?? null

  if (resolveEscapedUnits(lane)) {
    return
  }

  if (leftFront && rightFront && rightFront.x - leftFront.x <= collideDistance) {
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
      return
    }

    const center = (leftFront.x + rightFront.x) / 2
    leftFront.x = clampCombatX(center - collideDistance / 2)
    rightFront.x = clampCombatX(center + collideDistance / 2)
  } else {
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
  if (winner.value) {
    return
  }

  const dt = Math.min(delta, 32)

  if (leftCurrent.value === null && leftSpawnCountdown.value > 0) {
    leftSpawnCountdown.value = Math.max(0, leftSpawnCountdown.value - dt)
    if (leftSpawnCountdown.value === 0) {
      refillCurrentDino('left')
    }
  }

  if (rightCurrent.value === null && rightSpawnCountdown.value > 0) {
    rightSpawnCountdown.value = Math.max(0, rightSpawnCountdown.value - dt)
    if (rightSpawnCountdown.value === 0) {
      refillCurrentDino('right')
    }
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
  nextUnitId.value = 1
  winner.value = null
  status.value = 'Mỗi người có timer riêng. Thả khủng long vào lane để bắt đầu ép sân.'
  lanes.splice(0, lanes.length, ...Array.from({ length: 5 }, (_, index) => createLane(index)))
}

function unitStyle(unit: Unit) {
  return {
    left: `calc(${unit.x}% - ${unit.type.sizeRem / 2}rem)`,
    bottom: isFlyingDino(unit.type) ? '2.2rem' : '0.4rem',
    width: `${unit.type.sizeRem}rem`,
    height: `${unit.type.sizeRem}rem`,
  }
}
</script>

<template>
  <div class="h-screen overflow-hidden bg-bg-deep px-3 py-3 text-text-primary">
    <div class="mx-auto flex h-full max-w-7xl flex-col gap-3">
      <header class="grid shrink-0 gap-3 lg:grid-cols-[1fr_1.1fr_1fr]">
        <section class="border border-border-default bg-bg-surface p-3">
          <div class="flex items-center justify-between gap-3">
            <div>
              <p class="font-display text-[11px] tracking-[0.24em] text-accent-coral">P1</p>
              <p class="font-display text-3xl font-bold">{{ leftHp }}</p>
            </div>
            <div class="w-28 border border-border-default bg-bg-deep p-1">
              <div class="h-2 bg-bg-surface">
                <div class="h-full bg-accent-coral" :style="{ width: leftHpWidth }" />
              </div>
            </div>
          </div>

          <div class="mt-3 border border-border-default bg-bg-deep p-3">
            <p class="font-display text-[11px] tracking-[0.2em] text-text-dim">
              KHỦNG LONG HIỆN TẠI
            </p>
            <div class="mt-2 flex items-center gap-3">
              <div
                class="grid h-28 w-28 shrink-0 place-items-center border border-border-default bg-bg-surface"
              >
                <img
                  v-if="leftCurrent"
                  :src="leftCurrent.image"
                  :alt="leftCurrent.name"
                  class="object-contain"
                  :class="dinoFacingClass(leftCurrent, 'left')"
                  :style="previewSpriteStyle(leftCurrent)"
                />
                <div v-else class="grid h-full w-full place-items-center text-text-dim">
                  <Icon icon="lucide:timer-reset" class="size-6" />
                </div>
              </div>
              <div class="min-h-20 text-xs text-text-secondary">
                <template v-if="leftCurrent">
                  <p class="font-display text-lg text-text-primary">{{ leftCurrent.name }}</p>
                  <p>Push {{ leftCurrent.push }}</p>
                  <p>Damage {{ leftCurrent.damage }}</p>
                </template>
                <p v-else>Đã dùng lượt hiện tại</p>
              </div>
            </div>
            <div class="mt-3">
              <div class="flex items-center justify-between text-[11px] text-text-secondary">
                <span>{{ leftCurrent ? 'Sẵn sàng' : 'Khủng long mới sau' }}</span>
                <span>{{ leftCurrent ? '0.0s' : leftSpawnCountdownText }}</span>
              </div>
              <div class="mt-2 h-2 bg-bg-surface">
                <div
                  class="h-full bg-accent-coral transition-[width] duration-100"
                  :style="{ width: leftSpawnProgressWidth }"
                />
              </div>
            </div>
          </div>
        </section>

        <section class="border border-border-default bg-bg-surface p-3">
          <div class="flex items-start justify-between gap-3">
            <div>
              <p class="font-display text-[11px] tracking-[0.28em] text-accent-coral">
                // DINOSAUR BATTLE
              </p>
              <h1 class="font-display text-3xl font-bold uppercase leading-none">
                Khủng Long Chiến
              </h1>
            </div>
            <div class="flex items-center gap-2">
              <button
                type="button"
                class="inline-flex items-center gap-2 border border-border-default px-3 py-2 text-xs transition hover:border-accent-amber hover:bg-bg-elevated"
                @click="resetGame"
              >
                <Icon icon="lucide:rotate-ccw" class="size-4" />
                Chơi lại
              </button>
              <RouterLink
                to="/"
                class="inline-flex items-center gap-2 border border-border-default px-3 py-2 text-xs text-text-secondary transition hover:border-accent-coral hover:bg-bg-elevated hover:text-text-primary"
              >
                <Icon icon="lucide:house" class="size-4" />
                Trang chủ
              </RouterLink>
            </div>
          </div>

          <div class="mt-3 grid gap-2 sm:grid-cols-3">
            <div
              class="border border-border-default bg-bg-deep px-3 py-2 text-xs text-text-secondary"
            >
              Cứ 3 giây mỗi bên nhận 1 khủng long mới.
            </div>
            <div
              class="border border-border-default bg-bg-deep px-3 py-2 text-xs text-text-secondary"
            >
              Chỉ cộng lực khi các con thật sự chạm nhau.
            </div>
            <div
              class="border border-border-default bg-bg-deep px-3 py-2 text-xs text-text-secondary"
            >
              Đẩy qua vạch đích để trừ HP đối thủ.
            </div>
          </div>

          <div
            class="mt-3 border border-border-default bg-bg-deep px-3 py-2 text-sm text-text-secondary"
          >
            {{ status }}
          </div>
          <p v-if="winner" class="mt-2 font-display text-xl text-accent-amber">
            {{ winner === 'left' ? 'Người chơi 1 thắng' : 'Người chơi 2 thắng' }}
          </p>
        </section>

        <section class="border border-border-default bg-bg-surface p-3">
          <div class="flex items-center justify-between gap-3">
            <div>
              <p class="font-display text-[11px] tracking-[0.24em] text-accent-sky">P2</p>
              <p class="font-display text-3xl font-bold">{{ rightHp }}</p>
            </div>
            <div class="w-28 border border-border-default bg-bg-deep p-1">
              <div class="h-2 bg-bg-surface">
                <div class="h-full bg-accent-sky" :style="{ width: rightHpWidth }" />
              </div>
            </div>
          </div>

          <div class="mt-3 border border-border-default bg-bg-deep p-3">
            <p class="font-display text-[11px] tracking-[0.2em] text-text-dim">
              KHỦNG LONG HIỆN TẠI
            </p>
            <div class="mt-2 flex items-center gap-3">
              <div
                class="grid h-28 w-28 shrink-0 place-items-center border border-border-default bg-bg-surface"
              >
                <img
                  v-if="rightCurrent"
                  :src="rightCurrent.image"
                  :alt="rightCurrent.name"
                  class="object-contain"
                  :class="dinoFacingClass(rightCurrent, 'right')"
                  :style="previewSpriteStyle(rightCurrent)"
                />
                <div v-else class="grid h-full w-full place-items-center text-text-dim">
                  <Icon icon="lucide:timer-reset" class="size-6" />
                </div>
              </div>
              <div class="min-h-20 text-xs text-text-secondary">
                <template v-if="rightCurrent">
                  <p class="font-display text-lg text-text-primary">{{ rightCurrent.name }}</p>
                  <p>Push {{ rightCurrent.push }}</p>
                  <p>Damage {{ rightCurrent.damage }}</p>
                </template>
                <p v-else>Đã dùng lượt hiện tại</p>
              </div>
            </div>
            <div class="mt-3">
              <div class="flex items-center justify-between text-[11px] text-text-secondary">
                <span>{{ rightCurrent ? 'Sẵn sàng' : 'Khủng long mới sau' }}</span>
                <span>{{ rightCurrent ? '0.0s' : rightSpawnCountdownText }}</span>
              </div>
              <div class="mt-2 h-2 bg-bg-surface">
                <div
                  class="h-full bg-accent-sky transition-[width] duration-100"
                  :style="{ width: rightSpawnProgressWidth }"
                />
              </div>
            </div>
          </div>
        </section>
      </header>

      <section class="flex min-h-0 flex-1 flex-col gap-2">
        <article
          v-for="lane in lanes"
          :key="lane.id"
          class="grid min-h-0 flex-1 grid-cols-[88px_minmax(0,1fr)_88px] gap-2"
        >
          <button
            type="button"
            class="grid place-items-center border border-border-default bg-bg-surface p-2 transition hover:border-accent-coral hover:bg-bg-elevated disabled:opacity-45"
            :disabled="winner !== null || leftCurrent === null || !canDeployToLane(lane, 'left')"
            @click="deployCurrentDino(lane.id, 'left')"
          >
            <div class="text-center">
              <p class="font-display text-xs tracking-[0.2em] text-accent-coral">P1</p>
              <p class="mt-1 text-[11px] text-text-secondary">Lane {{ lane.id + 1 }}</p>
            </div>
          </button>

          <div class="relative overflow-visible border border-border-default bg-bg-surface">
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
            class="grid place-items-center border border-border-default bg-bg-surface p-2 transition hover:border-accent-sky hover:bg-bg-elevated disabled:opacity-45"
            :disabled="winner !== null || rightCurrent === null || !canDeployToLane(lane, 'right')"
            @click="deployCurrentDino(lane.id, 'right')"
          >
            <div class="text-center">
              <p class="font-display text-xs tracking-[0.2em] text-accent-sky">P2</p>
              <p class="mt-1 text-[11px] text-text-secondary">Lane {{ lane.id + 1 }}</p>
            </div>
          </button>
        </article>
      </section>

      <footer class="grid shrink-0 gap-2 text-xs text-text-secondary sm:grid-cols-4">
        <div
          v-for="dino in dinosaursByPush"
          :key="dino.id"
          class="flex items-center gap-2 border border-border-default bg-bg-surface px-3 py-2"
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
            <p class="font-display text-sm text-text-primary">{{ dino.name }}</p>
            <p>Push {{ dino.push }} · Damage {{ dino.damage }}</p>
          </div>
        </div>
      </footer>
    </div>
  </div>
</template>
