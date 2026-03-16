<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { Icon } from '@iconify/vue'
import { useIntervalFn, useEventListener, useStorage } from '@vueuse/core'
import { generateSudoku, type SudokuBoard, type Difficulty } from './utils/sudoku'

// --- Types & State ---
const board = ref<SudokuBoard>([])
const difficulty = useStorage<Difficulty>('vibe-sudoku-difficulty', 'medium')
const timeElapsed = ref(0)
const isGenerating = ref(true)
const isGameWon = ref(false)
const isPaused = ref(false)
const selectedCell = ref<{ r: number; c: number } | null>(null)
const isNotesMode = ref(false)
const isPlaying = ref(false)

const { pause: pauseTimer, resume: resumeTimer } = useIntervalFn(
  () => {
    timeElapsed.value++
  },
  1000,
  { immediate: false },
)

// --- Computed ---
const formattedTime = computed(() => {
  const m = Math.floor(timeElapsed.value / 60)
    .toString()
    .padStart(2, '0')
  const s = (timeElapsed.value % 60).toString().padStart(2, '0')
  return `${m}:${s}`
})

const difficultyName = computed(() => {
  const map: Record<Difficulty, string> = {
    easy: 'Dễ',
    medium: 'Trung bình',
    hard: 'Khó',
    expert: 'Chuyên gia',
  }
  return map[difficulty.value]
})

// --- Game Logic ---
const startNewGame = async () => {
  isPlaying.value = true
  isGenerating.value = true
  isGameWon.value = false
  isPaused.value = false
  selectedCell.value = null
  pauseTimer()
  timeElapsed.value = 0

  await nextTick()
  setTimeout(() => {
    const { board: newBoard } = generateSudoku(difficulty.value)
    board.value = newBoard
    isGenerating.value = false
    resumeTimer()
  }, 50)
}

const updateErrors = () => {
  board.value.forEach((row) => row.forEach((cell) => (cell.isError = false)))

  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const cell = board.value[r]?.[c]
      if (!cell || !cell.value) continue

      let hasError = false
      for (let i = 0; i < 9; i++) {
        if (i !== c && board.value[r]?.[i]?.value === cell.value) hasError = true
      }
      for (let i = 0; i < 9; i++) {
        if (i !== r && board.value[i]?.[c]?.value === cell.value) hasError = true
      }
      const sr = r - (r % 3)
      const sc = c - (c % 3)
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          const rr = sr + i
          const cc = sc + j
          if ((rr !== r || cc !== c) && board.value[rr]?.[cc]?.value === cell.value) hasError = true
        }
      }
      if (hasError) cell.isError = true
    }
  }
}

const checkWin = () => {
  if (board.value.length === 0) return
  let full = true
  let hasError = false
  for (const row of board.value) {
    for (const cell of row) {
      if (!cell.value) full = false
      if (cell.isError) hasError = true
    }
  }
  if (full && !hasError) {
    isGameWon.value = true
    pauseTimer()
    selectedCell.value = null
  }
}

// --- Player Actions ---
const selectCell = (r: number, c: number) => {
  if (isPaused.value || isGameWon.value) return
  selectedCell.value = { r, c }
}

const inputNumber = (num: number) => {
  if (isPaused.value || isGameWon.value || !selectedCell.value) return
  const { r, c } = selectedCell.value
  const cell = board.value[r]?.[c]
  if (!cell || cell.isClue) return

  if (isNotesMode.value) {
    if (cell.value) return
    if (cell.notes.has(num)) {
      cell.notes.delete(num)
    } else {
      cell.notes.add(num)
    }
  } else {
    if (cell.value === num) {
      cell.value = null
    } else {
      cell.value = num
      cell.notes.clear()
      removeNotesFromRelated(r, c, num)
    }
    updateErrors()
    checkWin()
  }
}

const removeNotesFromRelated = (r: number, c: number, num: number) => {
  for (let i = 0; i < 9; i++) {
    board.value[r]?.[i]?.notes.delete(num)
    board.value[i]?.[c]?.notes.delete(num)
  }
  const sr = r - (r % 3)
  const sc = c - (c % 3)
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      board.value[sr + i]?.[sc + j]?.notes.delete(num)
    }
  }
}

const erase = () => {
  if (isPaused.value || isGameWon.value || !selectedCell.value) return
  const { r, c } = selectedCell.value
  const cell = board.value[r]?.[c]
  if (!cell || cell.isClue) return
  cell.value = null
  updateErrors()
}

const toggleNotes = () => {
  isNotesMode.value = !isNotesMode.value
}

const togglePause = () => {
  if (isGameWon.value) return
  isPaused.value = !isPaused.value
  if (isPaused.value) {
    pauseTimer()
  } else {
    resumeTimer()
  }
}

// --- Keyboard Handling ---
const handleKeydown = (e: KeyboardEvent) => {
  if (!isPlaying.value || isPaused.value || isGameWon.value || !selectedCell.value) return
  const { r, c } = selectedCell.value

  if (e.key >= '1' && e.key <= '9') {
    inputNumber(parseInt(e.key))
  } else if (e.key === 'Backspace' || e.key === 'Delete') {
    erase()
  } else if (e.key === 'n' || e.key === 'N') {
    toggleNotes()
  } else if (e.key.startsWith('Arrow')) {
    e.preventDefault()
    let nr = r,
      nc = c
    if (e.key === 'ArrowUp') nr = (r - 1 + 9) % 9
    else if (e.key === 'ArrowDown') nr = (r + 1) % 9
    else if (e.key === 'ArrowLeft') nc = (c - 1 + 9) % 9
    else if (e.key === 'ArrowRight') nc = (c + 1) % 9
    selectedCell.value = { r: nr, c: nc }
  }
}

useEventListener('keydown', handleKeydown)

useEventListener(document, 'visibilitychange', () => {
  if (document.hidden && isPlaying.value && !isPaused.value && !isGameWon.value) {
    togglePause()
  }
})

// --- UI Helpers ---
const bgClassFor = (r: number, c: number) => {
  const cell = board.value[r]?.[c]
  if (!cell) return 'bg-bg-surface'

  const isSelected = selectedCell.value?.r === r && selectedCell.value?.c === c
  const isRelated =
    selectedCell.value &&
    (selectedCell.value.r === r ||
      selectedCell.value.c === c ||
      (Math.floor(r / 3) === Math.floor(selectedCell.value.r / 3) &&
        Math.floor(c / 3) === Math.floor(selectedCell.value.c / 3)))

  const selectedThemeCell = selectedCell.value
    ? board.value[selectedCell.value.r]?.[selectedCell.value.c]
    : null
  const hasSameNumber = cell.value && selectedThemeCell && selectedThemeCell.value === cell.value

  if (isSelected) return 'bg-accent-coral/20'
  if (hasSameNumber) return 'bg-accent-amber/20'
  if (isRelated) return 'bg-bg-elevated'
  return 'bg-bg-surface'
}
</script>

<template>
  <div
    class="min-h-screen bg-bg-deep text-text-primary font-body flex flex-col items-center py-8 sm:py-12 px-2 sm:px-4 selection:bg-accent-coral/20"
  >
    <div class="max-w-xl w-full">
      <div
        class="flex flex-col sm:flex-row sm:items-end justify-between mb-8 animate-fade-up gap-4"
      >
        <div>
          <h1 class="font-display text-4xl sm:text-5xl font-bold flex items-center gap-3">
            <span class="text-accent-coral font-display text-xl sm:text-2xl tracking-widest"
              >//</span
            >
            Sudoku
          </h1>
        </div>

        <div v-if="isPlaying" class="flex items-center gap-4 justify-between sm:justify-end">
          <select
            v-model="difficulty"
            @change="startNewGame"
            class="bg-bg-surface border border-border-default px-3 py-1.5 text-sm font-display text-text-primary outline-none focus:border-accent-coral cursor-pointer transition-colors"
          >
            <option value="easy">Dễ</option>
            <option value="medium">Trung bình</option>
            <option value="hard">Khó</option>
            <option value="expert">Chuyên gia</option>
          </select>

          <div class="font-display text-lg text-text-secondary w-16 text-right tabular-nums">
            {{ formattedTime }}
          </div>
        </div>
      </div>

      <!-- Welcome Screen -->
      <div
        v-if="!isPlaying"
        class="flex flex-col items-center justify-center py-12 sm:py-20 animate-fade-up animate-delay-1"
      >
        <div class="relative w-24 h-24 mx-auto mb-8">
          <div class="absolute inset-0 bg-accent-coral/20 animate-ping rounded-sm"></div>
          <Icon icon="lucide:grid-3x3" class="size-full text-accent-coral relative z-10" />
        </div>

        <h2 class="font-display text-2xl sm:text-3xl font-bold mb-8 text-center">
          Chọn độ khó để bắt đầu
        </h2>

        <div class="grid grid-cols-2 gap-3 sm:gap-4 w-full max-w-sm mb-10">
          <button
            @click="difficulty = 'easy'"
            class="py-4 border text-lg font-display transition-all"
            :class="
              difficulty === 'easy'
                ? 'border-accent-coral bg-accent-coral/10 text-accent-coral'
                : 'border-border-default bg-bg-surface text-text-secondary hover:text-text-primary hover:border-text-dim'
            "
          >
            Dễ
          </button>
          <button
            @click="difficulty = 'medium'"
            class="py-4 border text-lg font-display transition-all"
            :class="
              difficulty === 'medium'
                ? 'border-accent-coral bg-accent-coral/10 text-accent-coral'
                : 'border-border-default bg-bg-surface text-text-secondary hover:text-text-primary hover:border-text-dim'
            "
          >
            Trung bình
          </button>
          <button
            @click="difficulty = 'hard'"
            class="py-4 border text-lg font-display transition-all"
            :class="
              difficulty === 'hard'
                ? 'border-accent-coral bg-accent-coral/10 text-accent-coral'
                : 'border-border-default bg-bg-surface text-text-secondary hover:text-text-primary hover:border-text-dim'
            "
          >
            Khó
          </button>
          <button
            @click="difficulty = 'expert'"
            class="py-4 border text-lg font-display transition-all"
            :class="
              difficulty === 'expert'
                ? 'border-accent-coral bg-accent-coral/10 text-accent-coral'
                : 'border-border-default bg-bg-surface text-text-secondary hover:text-text-primary hover:border-text-dim'
            "
          >
            Chuyên gia
          </button>
        </div>

        <button
          @click="startNewGame"
          class="w-full max-w-sm py-4 bg-accent-coral text-bg-deep font-bold font-display text-xl tracking-widest hover:bg-accent-coral/90 transition-all border border-accent-coral shadow-lg shadow-accent-coral/20 hover:-translate-y-1 active:translate-y-0"
        >
          BẮT ĐẦU CHƠI
        </button>
      </div>

      <div v-else class="w-full flex-col flex gap-0 animate-fade-up">
        <div class="relative w-full aspect-square max-w-[500px] mx-auto touch-none">
          <div
            class="absolute inset-0 border-2 border-text-dim/50 grid grid-cols-9 grid-rows-9 gap-0 bg-border-default bg-opacity-30"
          >
            <template v-for="(row, r) in board" :key="'row-' + r">
              <div
                v-for="(cell, c) in row"
                :key="'cell-' + r + '-' + c"
                @mousedown.prevent="selectCell(r, c)"
                class="flex items-center justify-center text-xl sm:text-2xl lg:text-3xl font-display cursor-pointer transition-colors relative"
                :class="[
                  (c + 1) % 3 === 0 && c !== 8
                    ? 'border-r-2 border-r-text-dim/50'
                    : 'border-r border-r-border-default',
                  (r + 1) % 3 === 0 && r !== 8
                    ? 'border-b-2 border-b-text-dim/50'
                    : 'border-b border-b-border-default',
                  c === 8 ? 'border-r-0' : '',
                  r === 8 ? 'border-b-0' : '',
                  bgClassFor(r, c),
                ]"
              >
                <span
                  v-if="cell.value"
                  :class="[
                    cell.isError
                      ? 'text-red-400 font-bold'
                      : cell.isClue
                        ? 'text-text-primary'
                        : 'text-accent-coral',
                  ]"
                >
                  {{ cell.value }}
                </span>

                <div
                  v-else-if="cell.notes.size > 0"
                  class="grid grid-cols-3 grid-rows-3 w-full h-full p-0.5 sm:p-1 pointer-events-none"
                >
                  <span
                    v-for="n in 9"
                    :key="'n' + n"
                    class="flex items-center justify-center text-[9px] sm:text-[11px] text-text-dim font-body leading-none"
                  >
                    {{ cell.notes.has(n) ? n : '' }}
                  </span>
                </div>
              </div>
            </template>
          </div>

          <div
            v-if="isGenerating"
            class="absolute inset-0 bg-bg-deep flex flex-col items-center justify-center z-10"
          >
            <Icon icon="lucide:loader-2" class="animate-spin text-accent-coral size-10 mb-4" />
            <span class="font-display text-text-secondary tracking-widest text-sm animate-pulse"
              >TẠO CÂU ĐỐ...</span
            >
          </div>
        </div>

        <div
          class="mt-6 sm:mt-8 flex flex-col sm:flex-row gap-6 animate-fade-up animate-delay-3 justify-between items-center max-w-[500px] mx-auto"
        >
          <div class="grid grid-cols-5 sm:flex sm:flex-wrap gap-2 w-full sm:w-auto flex-1">
            <button
              v-for="n in 9"
              :key="'pad-' + n"
              @click="inputNumber(n)"
              @mousedown.prevent
              class="aspect-square sm:aspect-auto sm:h-14 flex-1 flex items-center justify-center bg-bg-surface border border-border-default text-text-primary hover:border-accent-coral hover:text-accent-coral transition-colors font-display text-xl sm:text-2xl active:scale-95"
            >
              {{ n }}
            </button>
          </div>

          <div class="flex gap-3 sm:gap-4 w-full sm:w-auto justify-center">
            <button
              @click="toggleNotes"
              @mousedown.prevent
              class="flex flex-col items-center gap-1.5 group w-14 sm:w-16 transition-colors"
              :class="
                isNotesMode ? 'text-accent-coral' : 'text-text-secondary hover:text-text-primary'
              "
            >
              <div
                class="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center border transition-all duration-300 shadow-sm"
                :class="
                  isNotesMode
                    ? 'border-accent-coral bg-accent-coral/10 shadow-accent-coral/20'
                    : 'border-border-default bg-bg-surface group-hover:border-text-primary'
                "
              >
                <Icon icon="lucide:edit-3" class="size-4 sm:size-5" />
              </div>
              <span class="text-[10px] sm:text-xs font-display flex items-center gap-1">
                Ghi chú
                <span
                  v-if="isNotesMode"
                  class="w-1.5 h-1.5 rounded-full bg-accent-coral animate-pulse"
                ></span>
              </span>
            </button>

            <button
              @click="erase"
              @mousedown.prevent
              class="flex flex-col items-center gap-1.5 group w-14 sm:w-16 text-text-secondary hover:text-text-primary transition-colors"
            >
              <div
                class="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center border border-border-default bg-bg-surface group-hover:border-text-primary group-hover:bg-bg-elevated transition-colors shadow-sm"
              >
                <Icon icon="lucide:eraser" class="size-4 sm:size-5" />
              </div>
              <span class="text-[10px] sm:text-xs font-display">Xóa</span>
            </button>
          </div>
        </div>

        <div class="mt-8 flex justify-center gap-4 animate-fade-up animate-delay-4">
          <button
            @click="togglePause"
            class="flex items-center gap-2 border border-border-default bg-bg-surface px-5 py-2.5 text-sm text-text-primary hover:border-text-primary hover:bg-bg-elevated transition-colors min-w-[130px] justify-center"
          >
            <Icon :icon="isPaused ? 'lucide:play' : 'lucide:pause'" class="size-4" />
            {{ isPaused ? 'Tiếp tục' : 'Tạm dừng' }}
          </button>
          <button
            @click="startNewGame"
            class="flex items-center gap-2 border border-accent-coral bg-accent-coral/5 px-5 py-2.5 text-sm text-accent-coral hover:bg-accent-coral hover:text-bg-deep hover:shadow-lg hover:shadow-accent-coral/20 transition-all duration-300"
          >
            <Icon icon="lucide:refresh-ccw" class="size-4" />
            Ván mới
          </button>
        </div>
      </div>

      <div class="mt-12 flex justify-center animate-fade-up animate-delay-5 pb-8">
        <RouterLink
          to="/"
          class="inline-flex items-center gap-2 border border-border-default bg-bg-surface px-5 py-2.5 text-sm text-text-secondary transition hover:border-accent-coral hover:text-text-primary link-underline group"
        >
          <Icon
            icon="lucide:arrow-left"
            class="size-4 group-hover:-translate-x-1 transition-transform"
          />
          Về trang chủ
        </RouterLink>
      </div>
    </div>

    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="opacity-0 translate-y-4"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 translate-y-4"
    >
      <div
        v-if="isGameWon"
        class="fixed inset-0 z-50 bg-bg-deep/90 backdrop-blur-sm flex items-center justify-center p-4"
      >
        <div
          class="bg-bg-surface border border-border-default p-8 max-w-sm w-full text-center shadow-2xl shadow-accent-amber/10"
        >
          <div class="relative w-24 h-24 mx-auto mb-6">
            <div class="absolute inset-0 bg-accent-amber/20 animate-ping rounded-full"></div>
            <Icon
              icon="lucide:trophy"
              class="size-full text-accent-amber relative z-10 drop-shadow-lg"
            />
          </div>
          <h2 class="font-display text-4xl font-bold text-text-primary mb-3">Tuyệt vời!</h2>
          <p class="text-text-secondary mb-8 text-lg">
            Bạn đã giải hoàn tất mức độ <br />
            <span
              class="text-accent-coral font-bold font-display uppercase tracking-widest text-xl mt-2 inline-block"
              >{{ difficultyName }}</span
            >
            <br />
            <span class="text-text-dim text-sm mt-3 inline-block"
              >Thời gian: {{ formattedTime }}</span
            >
          </p>
          <button
            @click="startNewGame"
            class="w-full py-3.5 bg-accent-coral text-bg-deep font-bold font-display tracking-widest hover:bg-accent-coral/90 transition-colors border border-accent-coral"
          >
            CHƠI LẠI
          </button>
        </div>
      </div>
    </Transition>

    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div
        v-if="isPaused && !isGameWon && board.length > 0 && !isGenerating"
        class="fixed inset-0 z-40 bg-bg-deep/95 backdrop-blur-md flex items-center justify-center p-4"
      >
        <div class="text-center group cursor-pointer" @click="togglePause">
          <Icon
            icon="lucide:pause-circle"
            class="size-24 text-text-dim mx-auto mb-8 group-hover:scale-110 transition-transform duration-500 ease-out"
          />
          <h2
            class="font-display text-3xl md:text-5xl font-bold text-text-primary mb-12 tracking-[0.2em] group-hover:text-accent-coral transition-colors duration-500"
          >
            ĐÃ TẠM DỪNG
          </h2>
          <button
            class="px-10 py-4 border border-border-default text-text-primary transition-all duration-300 font-display tracking-[0.2em] bg-bg-surface group-hover:border-accent-coral group-hover:bg-accent-coral/10 group-hover:-translate-y-1 group-active:translate-y-0 group-active:scale-95"
          >
            CHẠM ĐỂ TIẾP TỤC
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.touch-none {
  touch-action: none;
}
</style>
