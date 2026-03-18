<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Icon } from '@iconify/vue'
import { RouterLink } from 'vue-router'
import { useLocalStorage, useIntervalFn, useEventListener } from '@vueuse/core'

const MAX_LEVEL = 8
const TOWER_LABELS = ['A', 'B', 'C']
const DISK_COLORS = [
  '#ff6b4a',
  '#ffb830',
  '#38bdf8',
  '#ff8f73',
  '#ffc94d',
  '#60cdff',
  '#e85d3a',
  '#d9a028',
  '#2098c9',
  '#cc5038',
]

const currentLevel = ref(1)
const unlockedLevel = useLocalStorage('hanoi-tower-unlocked', 1)
const bestMoves = useLocalStorage<Record<string, number>>('hanoi-tower-best-moves', {})
const bestTimes = useLocalStorage<Record<string, number>>('hanoi-tower-best-times', {})

const diskCount = computed(() => currentLevel.value + 2)
const optimalMoves = computed(() => 2 ** diskCount.value - 1)
const towerHeight = computed(() => `${(diskCount.value + 2) * 32}px`)

const towers = ref<number[][]>([[], [], []])
const moves = ref(0)
const selectedTower = ref<number | null>(null)
const gameWon = ref(false)
const gameStarted = ref(false)
const showLevelSelect = ref(false)
const hintMove = ref<[number, number] | null>(null)

const elapsedSeconds = ref(0)
const { pause: pauseTimer, resume: resumeTimer } = useIntervalFn(
  () => {
    elapsedSeconds.value++
  },
  1000,
  { immediate: false },
)

const formattedTime = computed(() => {
  const m = Math.floor(elapsedSeconds.value / 60)
  const s = elapsedSeconds.value % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
})

function getDiskColor(disk: number): string {
  return DISK_COLORS[(disk - 1) % DISK_COLORS.length]!
}

function getDiskWidth(disk: number): string {
  const n = diskCount.value
  if (n <= 1) return '90%'
  return `${30 + ((disk - 1) / (n - 1)) * 62}%`
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function canMoveTo(toIndex: number): boolean {
  if (selectedTower.value === null || selectedTower.value === toIndex) return false
  const source = towers.value[selectedTower.value]
  const target = towers.value[toIndex]
  if (!source || !target || source.length === 0) return false
  if (target.length === 0) return true
  return source[0]! < target[0]!
}

function initGame() {
  const n = diskCount.value
  towers.value = [Array.from({ length: n }, (_, i) => i + 1), [], []]
  moves.value = 0
  elapsedSeconds.value = 0
  selectedTower.value = null
  gameWon.value = false
  gameStarted.value = false
  hintMove.value = null
  pauseTimer()
}

function selectTower(index: number) {
  if (gameWon.value) return
  hintMove.value = null

  if (selectedTower.value === null) {
    const tower = towers.value[index]
    if (!tower || tower.length === 0) return
    selectedTower.value = index
  } else if (selectedTower.value === index) {
    selectedTower.value = null
  } else {
    const moved = tryMove(selectedTower.value, index)
    const target = towers.value[index]
    if (!moved && target && target.length > 0) {
      selectedTower.value = index
    } else {
      selectedTower.value = null
    }
  }
}

function tryMove(from: number, to: number): boolean {
  const source = towers.value[from]
  const target = towers.value[to]
  if (!source || !target || source.length === 0) return false

  const disk = source[0]!
  if (target.length > 0 && target[0]! < disk) return false

  if (!gameStarted.value) {
    gameStarted.value = true
    resumeTimer()
  }

  towers.value[from] = source.slice(1)
  towers.value[to] = [disk, ...target]
  moves.value++

  const finalTower = towers.value[2]
  if (finalTower && finalTower.length === diskCount.value) {
    gameWon.value = true
    pauseTimer()

    const key = String(currentLevel.value)
    const prevBest = bestMoves.value[key]
    if (prevBest === undefined || moves.value < prevBest) {
      bestMoves.value = { ...bestMoves.value, [key]: moves.value }
    }
    const prevTime = bestTimes.value[key]
    if (prevTime === undefined || elapsedSeconds.value < prevTime) {
      bestTimes.value = { ...bestTimes.value, [key]: elapsedSeconds.value }
    }
    if (currentLevel.value >= unlockedLevel.value && currentLevel.value < MAX_LEVEL) {
      unlockedLevel.value = currentLevel.value + 1
    }
  }

  return true
}

function getHint() {
  if (gameWon.value) return
  const state = towers.value.map((t) => [...t])
  hintMove.value = solveNext(state, diskCount.value, 2)
}

function solveNext(state: number[][], n: number, target: number): [number, number] | null {
  function solve(disk: number, tgt: number): [number, number] | null {
    if (disk === 0) return null
    let cur = -1
    for (let i = 0; i < 3; i++) {
      const tower = state[i]
      if (tower && tower.includes(disk)) {
        cur = i
        break
      }
    }
    if (cur === -1) return null
    if (cur === tgt) return solve(disk - 1, tgt)
    const aux = 3 - cur - tgt
    const sub = solve(disk - 1, aux)
    if (sub) return sub
    return [cur, tgt]
  }
  return solve(n, target)
}

function goToLevel(level: number) {
  if (level > unlockedLevel.value) return
  currentLevel.value = level
  showLevelSelect.value = false
  initGame()
}

function nextLevel() {
  if (currentLevel.value < MAX_LEVEL) {
    currentLevel.value++
    initGame()
  }
}

useEventListener('keydown', (e: KeyboardEvent) => {
  if (showLevelSelect.value) {
    if (e.key === 'Escape') showLevelSelect.value = false
    return
  }
  if (gameWon.value) return
  const key = e.key.toLowerCase()
  if (key === '1') selectTower(0)
  else if (key === '2') selectTower(1)
  else if (key === '3') selectTower(2)
  else if (key === 'h') getHint()
  else if (key === 'r') initGame()
  else if (key === 'escape') selectedTower.value = null
})

onMounted(() => initGame())
</script>

<template>
  <div
    class="min-h-screen bg-bg-deep font-body flex flex-col items-center px-4 py-6 md:py-8 select-none"
  >
    <div class="w-full max-w-2xl">
      <!-- Header -->
      <div
        class="mb-6 flex items-center justify-between border-b border-border-default pb-4 animate-fade-up"
      >
        <div>
          <h1
            class="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-accent-coral tracking-tight flex items-center gap-2"
          >
            <span class="text-accent-coral/50 text-sm sm:text-base tracking-widest">//</span>
            Tháp Hà Nội
          </h1>
          <p class="text-text-secondary text-xs sm:text-sm mt-1">Di chuyển tất cả đĩa sang cột C</p>
        </div>
        <button
          class="flex items-center gap-2 px-3 py-2 bg-bg-surface border border-border-default text-text-secondary hover:border-accent-coral hover:text-text-primary transition-colors text-sm font-display font-semibold"
          @click="showLevelSelect = true"
        >
          <Icon icon="lucide:layers" class="size-4" />
          Level {{ currentLevel }}
        </button>
      </div>

      <!-- Stats Bar -->
      <div class="grid grid-cols-4 gap-2 sm:gap-3 mb-6 animate-fade-up animate-delay-1">
        <div
          class="flex flex-col items-center bg-bg-surface border border-border-default p-2 sm:p-3"
        >
          <span
            class="text-[9px] sm:text-[10px] uppercase tracking-widest text-text-dim font-display font-bold mb-1"
          >
            Đĩa
          </span>
          <span class="text-lg sm:text-xl font-bold text-accent-coral font-display tabular-nums">
            {{ diskCount }}
          </span>
        </div>
        <div
          class="flex flex-col items-center bg-bg-surface border border-border-default p-2 sm:p-3"
        >
          <span
            class="text-[9px] sm:text-[10px] uppercase tracking-widest text-text-dim font-display font-bold mb-1"
          >
            Bước đi
          </span>
          <span
            class="text-lg sm:text-xl font-bold font-display tabular-nums"
            :class="moves > optimalMoves ? 'text-accent-coral' : 'text-text-primary'"
          >
            {{ moves }}
          </span>
        </div>
        <div
          class="flex flex-col items-center bg-bg-surface border border-border-default p-2 sm:p-3"
        >
          <span
            class="text-[9px] sm:text-[10px] uppercase tracking-widest text-text-dim font-display font-bold mb-1"
          >
            Tối ưu
          </span>
          <span class="text-lg sm:text-xl font-bold text-accent-amber font-display tabular-nums">
            {{ optimalMoves }}
          </span>
        </div>
        <div
          class="flex flex-col items-center bg-bg-surface border border-border-default p-2 sm:p-3"
        >
          <span
            class="text-[9px] sm:text-[10px] uppercase tracking-widest text-text-dim font-display font-bold mb-1"
          >
            Thời gian
          </span>
          <span class="text-lg sm:text-xl font-bold text-accent-sky font-display tabular-nums">
            {{ formattedTime }}
          </span>
        </div>
      </div>

      <!-- Game Board -->
      <div
        class="bg-bg-surface border border-border-default p-3 sm:p-4 md:p-6 animate-fade-up animate-delay-2"
      >
        <!-- Hint banner -->
        <div
          v-if="hintMove"
          class="mb-3 flex items-center justify-center gap-2 py-2 px-3 bg-accent-amber/10 border border-accent-amber/30 text-accent-amber text-xs sm:text-sm font-display"
        >
          <Icon icon="lucide:lightbulb" class="size-4 shrink-0" />
          Di chuyển từ cột {{ TOWER_LABELS[hintMove[0]] }} sang cột
          {{ TOWER_LABELS[hintMove[1]] }}
        </div>

        <!-- Towers -->
        <div class="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4">
          <div
            v-for="(tower, tIndex) in towers"
            :key="tIndex"
            class="flex flex-col items-center cursor-pointer"
            role="button"
            :aria-label="`Cột ${TOWER_LABELS[tIndex]}, ${tower.length} đĩa`"
            @click="selectTower(tIndex)"
          >
            <div
              class="relative w-full flex flex-col items-center justify-end gap-[2px] border-2 transition-all duration-200 px-1 pb-1"
              :class="[
                selectedTower === tIndex
                  ? 'border-accent-coral/60 bg-accent-coral/5'
                  : selectedTower !== null && canMoveTo(tIndex)
                    ? 'border-accent-sky/30 bg-accent-sky/5'
                    : hintMove && (hintMove[0] === tIndex || hintMove[1] === tIndex)
                      ? 'border-accent-amber/40 bg-accent-amber/5'
                      : 'border-transparent',
              ]"
              :style="{ minHeight: towerHeight }"
            >
              <!-- Peg -->
              <div
                class="absolute bottom-1 left-1/2 -translate-x-1/2 w-0.5 sm:w-1 bg-text-dim/30"
                :style="{ height: 'calc(100% - 16px)' }"
              />

              <!-- Disks -->
              <div
                v-for="(disk, di) in tower"
                :key="disk"
                class="relative z-10 h-5 sm:h-6 md:h-7 flex items-center justify-center text-[10px] sm:text-xs font-bold text-white/90 font-display transition-all duration-200 shrink-0"
                :class="[
                  selectedTower === tIndex && di === 0 ? '-translate-y-3 sm:-translate-y-4' : '',
                ]"
                :style="{
                  width: getDiskWidth(disk),
                  backgroundColor: getDiskColor(disk),
                  boxShadow:
                    selectedTower === tIndex && di === 0
                      ? `0 4px 16px ${getDiskColor(disk)}50`
                      : 'none',
                }"
              >
                {{ disk }}
              </div>
            </div>

            <!-- Base -->
            <div class="w-full h-1 sm:h-1.5 bg-text-dim/40" />

            <!-- Label -->
            <div
              class="mt-1.5 sm:mt-2 text-[10px] sm:text-xs font-display font-bold tracking-wider transition-colors"
              :class="[
                selectedTower === tIndex
                  ? 'text-accent-coral'
                  : hintMove && (hintMove[0] === tIndex || hintMove[1] === tIndex)
                    ? 'text-accent-amber'
                    : 'text-text-dim',
              ]"
            >
              {{ TOWER_LABELS[tIndex] }}
            </div>
          </div>
        </div>
      </div>

      <!-- Controls -->
      <div class="mt-4 sm:mt-6 flex gap-2 sm:gap-3 animate-fade-up animate-delay-3">
        <button
          :disabled="gameWon"
          class="flex flex-1 items-center justify-center gap-2 bg-bg-surface border border-border-default py-2.5 sm:py-3 font-display font-bold text-sm text-text-primary hover:bg-bg-elevated transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          @click="getHint"
        >
          <Icon icon="lucide:lightbulb" class="size-4" />
          Gợi ý
        </button>
        <button
          class="flex flex-1 items-center justify-center gap-2 bg-bg-surface border border-border-default py-2.5 sm:py-3 font-display font-bold text-sm text-text-primary hover:bg-bg-elevated transition-colors"
          @click="initGame"
        >
          <Icon icon="lucide:rotate-ccw" class="size-4" />
          Chơi lại
        </button>
      </div>

      <!-- Back to home -->
      <RouterLink
        to="/"
        class="mt-3 sm:mt-4 flex items-center justify-center gap-2 border border-border-default/50 bg-bg-surface/50 py-2.5 sm:py-3 text-sm text-text-secondary hover:text-text-primary transition-colors font-display font-bold hover:bg-bg-elevated animate-fade-up animate-delay-4"
      >
        <Icon icon="lucide:home" class="size-4" />
        Quay về Trang chủ
      </RouterLink>

      <!-- Keyboard hints (desktop) -->
      <div
        class="mt-6 hidden md:flex justify-center gap-8 border-t border-border-default/30 pt-6 animate-fade-up animate-delay-5"
      >
        <div class="flex flex-col items-center">
          <span class="text-[9px] uppercase font-display font-bold text-text-dim mb-2">
            Chọn cột
          </span>
          <div class="flex gap-1">
            <kbd
              class="px-2 py-1 bg-bg-surface border border-border-default text-xs text-text-primary font-bold"
            >
              1
            </kbd>
            <kbd
              class="px-2 py-1 bg-bg-surface border border-border-default text-xs text-text-primary font-bold"
            >
              2
            </kbd>
            <kbd
              class="px-2 py-1 bg-bg-surface border border-border-default text-xs text-text-primary font-bold"
            >
              3
            </kbd>
          </div>
        </div>
        <div class="flex flex-col items-center">
          <span class="text-[9px] uppercase font-display font-bold text-text-dim mb-2">
            Gợi ý
          </span>
          <kbd
            class="px-2 py-1 bg-bg-surface border border-border-default text-xs text-text-primary font-bold"
          >
            H
          </kbd>
        </div>
        <div class="flex flex-col items-center">
          <span class="text-[9px] uppercase font-display font-bold text-text-dim mb-2">
            Chơi lại
          </span>
          <kbd
            class="px-2 py-1 bg-bg-surface border border-border-default text-xs text-text-primary font-bold"
          >
            R
          </kbd>
        </div>
      </div>
    </div>

    <!-- Win Overlay -->
    <Transition name="overlay">
      <div
        v-if="gameWon"
        class="fixed inset-0 z-[60] flex items-center justify-center bg-bg-deep/95 backdrop-blur-xl p-4"
      >
        <div class="flex flex-col items-center text-center max-w-sm w-full animate-fade-up">
          <Icon icon="lucide:trophy" class="size-16 sm:size-20 text-accent-amber mb-4" />
          <h2
            class="font-display text-3xl sm:text-4xl font-bold text-accent-amber mb-2 tracking-tight"
          >
            Hoàn thành!
          </h2>
          <p class="text-text-secondary mb-6 text-sm">
            Level {{ currentLevel }} — {{ diskCount }} đĩa
          </p>

          <div class="grid grid-cols-2 gap-3 w-full mb-6">
            <div class="bg-bg-surface border border-border-default p-3 sm:p-4">
              <div
                class="text-[10px] uppercase tracking-widest text-text-dim font-display font-bold mb-1"
              >
                Bước đi
              </div>
              <div
                class="text-xl sm:text-2xl font-bold font-display tabular-nums"
                :class="moves <= optimalMoves ? 'text-accent-amber' : 'text-text-primary'"
              >
                {{ moves }}
                <span class="text-xs sm:text-sm text-text-dim">/ {{ optimalMoves }}</span>
              </div>
              <div
                v-if="moves <= optimalMoves"
                class="text-[10px] sm:text-xs text-accent-amber mt-1 font-display font-semibold"
              >
                Tối ưu!
              </div>
            </div>
            <div class="bg-bg-surface border border-border-default p-3 sm:p-4">
              <div
                class="text-[10px] uppercase tracking-widest text-text-dim font-display font-bold mb-1"
              >
                Thời gian
              </div>
              <div class="text-xl sm:text-2xl font-bold text-accent-sky font-display tabular-nums">
                {{ formattedTime }}
              </div>
            </div>
          </div>

          <div class="flex flex-col gap-3 w-full">
            <button
              v-if="currentLevel < MAX_LEVEL"
              class="flex items-center justify-center gap-2 bg-accent-coral py-3.5 sm:py-4 font-display font-bold text-white hover:bg-accent-coral/90 transition-colors active:scale-95"
              @click="nextLevel"
            >
              <Icon icon="lucide:arrow-right" class="size-5" />
              Level tiếp theo
            </button>
            <button
              class="flex items-center justify-center gap-2 border border-border-default bg-bg-surface py-3 font-display font-bold text-text-secondary hover:text-text-primary transition-colors"
              @click="initGame"
            >
              <Icon icon="lucide:rotate-ccw" class="size-5" />
              Chơi lại
            </button>
            <RouterLink
              to="/"
              class="flex items-center justify-center gap-2 border border-border-default/50 bg-bg-surface/50 py-3 font-display font-bold text-text-secondary hover:text-text-primary transition-colors"
            >
              <Icon icon="lucide:home" class="size-5" />
              Trang chủ
            </RouterLink>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Level Select Modal -->
    <Transition name="overlay">
      <div
        v-if="showLevelSelect"
        class="fixed inset-0 z-[60] flex items-center justify-center bg-bg-deep/95 backdrop-blur-xl p-4"
        @click.self="showLevelSelect = false"
      >
        <div class="w-full max-w-md animate-fade-up">
          <div class="flex items-center justify-between mb-6">
            <h2
              class="font-display text-xl sm:text-2xl font-bold text-text-primary flex items-center gap-2"
            >
              <span class="text-accent-coral/50 text-sm tracking-widest">//</span>
              Chọn Level
            </h2>
            <button
              class="p-2 text-text-dim hover:text-text-primary transition-colors"
              @click="showLevelSelect = false"
            >
              <Icon icon="lucide:x" class="size-5" />
            </button>
          </div>

          <div class="grid grid-cols-2 gap-2 sm:gap-3 max-h-[60vh] overflow-y-auto">
            <button
              v-for="level in MAX_LEVEL"
              :key="level"
              :disabled="level > unlockedLevel"
              class="relative overflow-hidden border p-3 sm:p-4 text-left transition-all duration-200"
              :class="[
                level <= unlockedLevel
                  ? level === currentLevel
                    ? 'bg-accent-coral/10 border-accent-coral text-text-primary'
                    : 'bg-bg-surface border-border-default text-text-primary hover:border-accent-coral hover:bg-bg-elevated'
                  : 'bg-bg-surface/50 border-border-default/50 text-text-dim cursor-not-allowed opacity-50',
              ]"
              @click="goToLevel(level)"
            >
              <div class="font-display text-base sm:text-lg font-bold">Level {{ level }}</div>
              <div class="text-[10px] sm:text-xs text-text-secondary mt-0.5">
                {{ level + 2 }} đĩa — {{ 2 ** (level + 2) - 1 }} bước
              </div>
              <div
                v-if="bestMoves[String(level)] !== undefined"
                class="text-[10px] sm:text-xs text-accent-amber mt-1.5 font-display"
              >
                Kỷ lục: {{ bestMoves[String(level)] }} bước ·
                {{ formatTime(bestTimes[String(level)] ?? 0) }}
              </div>
              <Icon
                v-if="level > unlockedLevel"
                icon="lucide:lock"
                class="absolute top-2.5 right-2.5 size-4 text-text-dim"
              />
              <Icon
                v-else-if="bestMoves[String(level)] !== undefined"
                icon="lucide:check-circle-2"
                class="absolute top-2.5 right-2.5 size-4 text-accent-amber"
              />
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.overlay-enter-active,
.overlay-leave-active {
  transition: opacity 0.3s ease;
}

.overlay-enter-from,
.overlay-leave-to {
  opacity: 0;
}
</style>
