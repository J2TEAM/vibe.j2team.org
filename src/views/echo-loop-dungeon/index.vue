<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { useEventListener, useTimeoutFn } from '@vueuse/core'
import { computed, ref } from 'vue'
import DungeonGrid from './components/DungeonGrid.vue'
import DungeonSidebar from './components/DungeonSidebar.vue'
import { levels, movementKeyMap } from './levels'
import type { EchoState, LevelDefinition, Point, RecordingState, Step, Tile } from './types'

const fallbackLevel: LevelDefinition = levels[0] ?? {
  name: 'Fallback Room',
  hint: 'Fallback level.',
  maxEchoes: 1,
  minEchoToClear: 1,
  maxLoopLength: 8,
  map: ['#####', '#S.X#', '#####'],
}

const levelIndex = ref(0)
const nextEchoId = ref(1)
const turn = ref(0)
const won = ref(false)
const message = ref('Bấm Ghi vòng lặp rồi bắt đầu di chuyển.')
const successToast = ref('')

const { start: scheduleHideSuccessToast, stop: cancelHideSuccessToast } = useTimeoutFn(
  () => {
    successToast.value = ''
  },
  1800,
  { immediate: false },
)

const grid = ref<Tile[][]>([])
const startPoint = ref<Point>({ x: 0, y: 0 })
const exitPoint = ref<Point>({ x: 0, y: 0 })
const platePoints = ref<Point[]>([])

const playerPosition = ref<Point>({ x: 0, y: 0 })
const echoes = ref<EchoState[]>([])
const recording = ref<RecordingState | null>(null)

const currentLevel = computed(() => levels[levelIndex.value] ?? fallbackLevel)
const isLastLevel = computed(() => levelIndex.value === levels.length - 1)
const levelWidth = computed(() => grid.value[0]?.length ?? 0)
const levelHeight = computed(() => grid.value.length)
const recordingActive = computed(() => recording.value !== null)
const loopUsage = computed(() => recording.value?.steps.length ?? 0)
const canSpawnMoreEchoes = computed(() => echoes.value.length < currentLevel.value.maxEchoes)
const canGoNextLevel = computed(() => won.value && !isLastLevel.value)
const pressedPlateCount = computed(() => {
  const actors = getActorPositions()

  return platePoints.value.filter((plate) => actors.some((actor) => isSamePoint(actor, plate)))
    .length
})
const doorOpen = computed(() => areAllPlatesPressed(getActorPositions()))
const statusText = computed(() => {
  if (won.value) {
    if (isLastLevel.value) {
      return 'Bạn đã phá đảo Echo Loop Dungeon. Có thể reset để chơi lại.'
    }

    return 'Bạn đã thoát khỏi dungeon. Có thể qua level tiếp theo.'
  }

  if (recordingActive.value) {
    return `Đang ghi: ${loopUsage.value}/${currentLevel.value.maxLoopLength} bước.`
  }

  return 'WASD/Arrow để di chuyển, Space để chờ 1 nhịp.'
})

initLevel(0)

function showSuccessToast(text: string) {
  successToast.value = text
  cancelHideSuccessToast()
  scheduleHideSuccessToast()
}

function initLevel(index: number) {
  const level = levels[index] ?? fallbackLevel
  const parsedGrid: Tile[][] = []
  const parsedPlates: Point[] = []
  let parsedStart: Point | null = null
  let parsedExit: Point | null = null

  for (const [y, row] of level.map.entries()) {
    const parsedRow: Tile[] = []

    for (let x = 0; x < row.length; x += 1) {
      const symbol = row.charAt(x)

      if (symbol === '#') {
        parsedRow.push('#')
        continue
      }

      if (symbol === 'S') {
        parsedStart = { x, y }
        parsedRow.push('.')
        continue
      }

      if (symbol === 'X') {
        parsedExit = { x, y }
        parsedRow.push('.')
        continue
      }

      if (symbol === 'P') {
        parsedPlates.push({ x, y })
        parsedRow.push('P')
        continue
      }

      if (symbol === 'D') {
        parsedRow.push('D')
        continue
      }

      parsedRow.push('.')
    }

    parsedGrid.push(parsedRow)
  }

  const safeStart = parsedStart ?? { x: 1, y: 1 }
  const safeExit = parsedExit ?? { x: 1, y: 1 }

  levelIndex.value = index
  grid.value = parsedGrid
  platePoints.value = parsedPlates
  startPoint.value = clonePoint(safeStart)
  exitPoint.value = clonePoint(safeExit)
  playerPosition.value = clonePoint(safeStart)
  echoes.value = []
  recording.value = null
  turn.value = 0
  won.value = false
  message.value = 'Bấm Ghi vòng lặp để tạo Echo đầu tiên.'
  nextEchoId.value = 1
}

function clonePoint(point: Point): Point {
  return { x: point.x, y: point.y }
}

function isSamePoint(a: Point, b: Point): boolean {
  return a.x === b.x && a.y === b.y
}

function getStepDelta(step: Exclude<Step, 'W'>): Point {
  const moveDelta: Record<Exclude<Step, 'W'>, Point> = {
    U: { x: 0, y: -1 },
    D: { x: 0, y: 1 },
    L: { x: -1, y: 0 },
    R: { x: 1, y: 0 },
  }

  return moveDelta[step]
}

function getNextPoint(from: Point, step: Step): Point {
  if (step === 'W') {
    return clonePoint(from)
  }

  const delta = getStepDelta(step)

  return {
    x: from.x + delta.x,
    y: from.y + delta.y,
  }
}

function getActorPositions(): Point[] {
  return [playerPosition.value, ...echoes.value.map((echo) => echo.position)]
}

function areAllPlatesPressed(actors: Point[]): boolean {
  if (platePoints.value.length === 0) {
    return true
  }

  return platePoints.value.every((plate) => actors.some((actor) => isSamePoint(actor, plate)))
}

function attemptMove(from: Point, step: Step, canUseDoor: boolean): Point {
  if (step === 'W') {
    return clonePoint(from)
  }

  const next = getNextPoint(from, step)

  if (next.y < 0 || next.y >= levelHeight.value) {
    return clonePoint(from)
  }

  if (next.x < 0 || next.x >= levelWidth.value) {
    return clonePoint(from)
  }

  const tile = grid.value[next.y]?.[next.x]

  if (!tile || tile === '#') {
    return clonePoint(from)
  }

  if (tile === 'D' && !canUseDoor) {
    return clonePoint(from)
  }

  const movingIntoExit = isSamePoint(next, exitPoint.value)

  if (movingIntoExit && !canUseDoor) {
    return clonePoint(from)
  }

  return next
}

function advanceTurn(step: Step) {
  if (won.value) {
    return
  }

  const wasDoorOpen = doorOpen.value

  if (recording.value && recording.value.steps.length >= currentLevel.value.maxLoopLength) {
    message.value = 'Đã đạt tối đa bước. Hãy Chốt Echo hoặc Hủy.'
    return
  }

  if (recording.value) {
    recording.value.steps.push(step)
  }

  const canUseDoor = doorOpen.value
  const playerStart = clonePoint(playerPosition.value)
  const playerAttempt = getNextPoint(playerStart, step)
  playerPosition.value = attemptMove(playerStart, step, canUseDoor)

  if (
    !canUseDoor &&
    step !== 'W' &&
    isSamePoint(playerAttempt, exitPoint.value) &&
    isSamePoint(playerPosition.value, playerStart)
  ) {
    message.value = 'Cổng thoát đang khóa. Hãy kích hoạt toàn bộ plate để mở cửa.'
  }

  for (const echo of echoes.value) {
    const scriptStep = echo.script[echo.stepIndex] ?? 'W'
    echo.position = attemptMove(echo.position, scriptStep, canUseDoor)
    echo.stepIndex = (echo.stepIndex + 1) % echo.script.length
  }

  if (!wasDoorOpen && doorOpen.value) {
    showSuccessToast('Mở cửa thành công!')
    message.value = 'Mở cửa thành công! Tiếp tục tới cổng thoát.'
  }

  turn.value += 1

  if (isSamePoint(playerPosition.value, exitPoint.value)) {
    if (echoes.value.length < currentLevel.value.minEchoToClear) {
      message.value = `Cần tối thiểu ${currentLevel.value.minEchoToClear} Echo để qua level này.`
      return
    }

    won.value = true

    if (isLastLevel.value) {
      message.value = 'Chúc mừng! Bạn đã hoàn thành toàn bộ Echo Loop Dungeon.'
    } else {
      message.value = 'Thắng rồi. Bạn có thể sang level tiếp theo.'
    }

    recording.value = null
    return
  }

  if (recording.value && recording.value.steps.length === currentLevel.value.maxLoopLength) {
    message.value = 'Đã ghi đầy vòng lặp. Bấm Chốt Echo để tua timeline.'
  }
}

function startRecording() {
  if (won.value) {
    return
  }

  if (recording.value) {
    message.value = 'Bạn đang trong chế độ ghi.'
    return
  }

  if (!canSpawnMoreEchoes.value) {
    message.value = 'Đã đạt giới hạn Echo của level này.'
    return
  }

  if (turn.value !== 0) {
    message.value = 'Chỉ có thể bắt đầu ghi ở turn 0. Hãy bấm Tua timeline.'
    return
  }

  recording.value = {
    start: clonePoint(playerPosition.value),
    steps: [],
  }
  message.value = 'Đang ghi vòng lặp mới...'
}

function cancelRecording() {
  if (!recording.value) {
    return
  }

  recording.value = null
  message.value = 'Đã hủy bản ghi. Không tạo Echo.'
}

function rewindTimeline() {
  playerPosition.value = clonePoint(startPoint.value)
  turn.value = 0
  won.value = false

  for (const echo of echoes.value) {
    echo.position = clonePoint(echo.start)
    echo.stepIndex = 0
  }
}

function commitRecording() {
  const activeRecording = recording.value

  if (!activeRecording) {
    message.value = 'Chưa có bản ghi để chốt.'
    return
  }

  if (activeRecording.steps.length === 0) {
    message.value = 'Bản ghi rỗng. Di chuyển ít nhất 1 bước.'
    return
  }

  const createdEchoId = nextEchoId.value

  echoes.value.push({
    id: createdEchoId,
    start: clonePoint(activeRecording.start),
    position: clonePoint(activeRecording.start),
    script: [...activeRecording.steps],
    stepIndex: 0,
  })
  nextEchoId.value += 1
  recording.value = null
  rewindTimeline()
  message.value = 'Đã tạo Echo mới và tua timeline về đầu.'
  showSuccessToast(`Ghi loop thành công: Echo E${createdEchoId}`)
}

function resetLevel() {
  initLevel(levelIndex.value)
}

function goToPreviousLevel() {
  if (levelIndex.value <= 0) {
    return
  }

  initLevel(levelIndex.value - 1)
}

function goToNextLevel() {
  if (isLastLevel.value) {
    message.value = 'Đây là level cuối rồi.'
    return
  }

  if (!won.value) {
    message.value = 'Cần thắng level hiện tại trước khi qua level sau.'
    return
  }

  const nextIndex = levelIndex.value + 1
  const nextLevel = levels[nextIndex] ?? fallbackLevel

  initLevel(nextIndex)
  message.value = `Đã chuyển sang ${nextLevel.name}.`
  showSuccessToast(`Chuyển level thành công: ${nextLevel.name}`)
}

function moveUp() {
  advanceTurn('U')
}

function moveDown() {
  advanceTurn('D')
}

function moveLeft() {
  advanceTurn('L')
}

function moveRight() {
  advanceTurn('R')
}

function waitOneTurn() {
  advanceTurn('W')
}

function handleKeydown(event: KeyboardEvent) {
  if (event.repeat) {
    return
  }

  if (event.target instanceof HTMLElement) {
    const tag = event.target.tagName
    const isTextInput = tag === 'INPUT' || tag === 'TEXTAREA' || event.target.isContentEditable

    if (isTextInput) {
      return
    }
  }

  const movement = movementKeyMap[event.key]

  if (movement) {
    event.preventDefault()
    advanceTurn(movement)
    return
  }

  if (event.key === 'r' || event.key === 'R') {
    event.preventDefault()

    if (recording.value) {
      commitRecording()
    } else {
      startRecording()
    }

    return
  }

  if (event.key === 'Escape') {
    event.preventDefault()
    cancelRecording()
    return
  }

  if (event.key === 't' || event.key === 'T') {
    event.preventDefault()
    rewindTimeline()
    message.value = 'Đã tua timeline về turn 0.'
    return
  }

  if (event.key === 'n' || event.key === 'N') {
    event.preventDefault()
    goToNextLevel()
    return
  }

  if (event.key === 'Backspace') {
    event.preventDefault()
    resetLevel()
  }
}

useEventListener(window, 'keydown', handleKeydown)
</script>

<template>
  <div class="min-h-screen bg-bg-deep px-4 py-6 font-body text-text-primary">
    <Transition
      enter-active-class="transition duration-200"
      enter-from-class="translate-y-2 opacity-0"
      enter-to-class="translate-y-0 opacity-100"
      leave-active-class="transition duration-200"
      leave-from-class="translate-y-0 opacity-100"
      leave-to-class="translate-y-2 opacity-0"
    >
      <div
        v-if="successToast"
        class="fixed right-4 top-4 z-40 inline-flex max-w-[calc(100vw-2rem)] items-center gap-2 border border-accent-sky bg-bg-surface px-3 py-2 text-sm text-accent-sky shadow-lg"
      >
        <Icon icon="lucide:badge-check" class="size-4" />
        <span>{{ successToast }}</span>
      </div>
    </Transition>

    <div class="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <header class="animate-fade-up border border-border-default bg-bg-surface p-4">
        <div class="mb-3 flex flex-wrap items-center justify-between gap-3">
          <RouterLink
            to="/"
            class="inline-flex items-center gap-2 border border-border-default bg-bg-elevated px-3 py-2 text-sm font-medium transition hover:border-accent-coral hover:text-accent-coral"
          >
            <Icon icon="lucide:house" class="size-4" />
            Về trang chủ
          </RouterLink>

          <div class="text-right text-sm text-text-secondary">
            <p>Level {{ levelIndex + 1 }} / {{ levels.length }}</p>
            <p>{{ currentLevel.name }}</p>
          </div>
        </div>

        <h1 class="font-display text-3xl sm:text-4xl">
          <span class="text-accent-coral">//</span>
          Echo Loop Dungeon
        </h1>
        <p class="mt-2 max-w-3xl text-sm text-text-secondary sm:text-base">
          Tạo và phát lại vòng lặp di chuyển của bản thân trong quá khứ. Dùng Echo đứng plate để mở
          cửa, canh nhịp và tìm đường thoát.
        </p>
      </header>

      <section class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div class="animate-fade-up animate-delay-1 border border-border-default bg-bg-surface p-4">
          <div class="mb-3 flex flex-wrap gap-2 text-xs sm:text-sm">
            <span class="border border-border-default bg-bg-elevated px-2 py-1">
              Turn: {{ turn }}
            </span>
            <span class="border border-border-default bg-bg-elevated px-2 py-1">
              Echo: {{ echoes.length }} / {{ currentLevel.maxEchoes }}
            </span>
            <span class="border border-border-default bg-bg-elevated px-2 py-1">
              Plate: {{ pressedPlateCount }} / {{ platePoints.length }}
            </span>
            <span class="border border-border-default bg-bg-elevated px-2 py-1">
              Clear: {{ echoes.length }} / {{ currentLevel.minEchoToClear }} Echo
            </span>
            <span
              class="border px-2 py-1"
              :class="
                doorOpen
                  ? 'border-accent-sky bg-accent-sky/15 text-accent-sky'
                  : 'border-accent-coral bg-accent-coral/15 text-accent-coral'
              "
            >
              {{ doorOpen ? 'Cửa đang mở' : 'Cửa đang đóng' }}
            </span>
          </div>

          <DungeonGrid
            :grid="grid"
            :level-width="levelWidth"
            :level-height="levelHeight"
            :start-point="startPoint"
            :exit-point="exitPoint"
            :player-position="playerPosition"
            :echoes="echoes"
            :door-open="doorOpen"
          />

          <p class="mt-4 text-sm font-medium text-text-primary">
            {{ statusText }}
          </p>
          <p class="mt-1 text-xs text-text-secondary sm:text-sm">
            {{ currentLevel.hint }}
          </p>
          <p class="mt-1 text-xs text-text-secondary sm:text-sm">
            {{ message }}
          </p>
        </div>

        <DungeonSidebar
          :recording-active="recordingActive"
          :can-spawn-more-echoes="canSpawnMoreEchoes"
          :turn="turn"
          :won="won"
          :level-index="levelIndex"
          :levels-count="levels.length"
          :can-go-next-level="canGoNextLevel"
          :current-echo-count="echoes.length"
          :min-echo-to-clear="currentLevel.minEchoToClear"
          :echoes="echoes"
          @start-recording="startRecording"
          @commit-recording="commitRecording"
          @cancel-recording="cancelRecording"
          @rewind-timeline="rewindTimeline"
          @reset-level="resetLevel"
          @move-up="moveUp"
          @move-left="moveLeft"
          @wait-one-turn="waitOneTurn"
          @move-right="moveRight"
          @move-down="moveDown"
          @go-to-previous-level="goToPreviousLevel"
          @go-to-next-level="goToNextLevel"
        />
      </section>
    </div>
  </div>
</template>
