<template>
  <div
    class="min-h-screen font-body flex flex-col items-center px-4 transition-all duration-700 bg-bg-deep relative overflow-y-auto"
  >
    <!-- Overlay mờ để nhìn rõ nội dung text bọc ngoài -->
    <div class="absolute inset-0 bg-bg-deep/80 z-0 pointer-events-none"></div>

    <div class="z-10 flex flex-col items-center w-full max-w-5xl animate-fade-up my-auto py-8">
      <h1
        class="font-display text-5xl md:text-6xl font-bold text-accent-coral flex items-center gap-4 mb-2"
      >
        <span class="text-accent-coral font-display text-xl tracking-widest opacity-70">//</span>
        Minesweeper
      </h1>

      <p
        class="text-text-secondary text-lg mb-8 text-center bg-bg-surface/50 px-4 py-1 border border-border-default/50 backdrop-blur-md"
      >
        Level {{ level }} / 99
      </p>

      <!-- Toolbar -->
      <div
        class="flex flex-col sm:flex-row gap-4 items-center justify-between w-full max-w-lg mb-6 bg-bg-surface/80 p-4 border border-border-default backdrop-blur-md"
      >
        <div class="flex items-center gap-6">
          <div class="flex flex-col items-center">
            <span
              class="text-xs text-text-dim font-display tracking-wide uppercase"
              title="Số cờ còn lại / Tổng số bom"
              >Bom / Cờ</span
            >
            <span class="font-display text-xl font-bold text-accent-coral"
              >{{ remainingMines }} / {{ maxMines }}</span
            >
          </div>
          <div class="w-px h-8 bg-border-default"></div>
          <div class="flex flex-col items-center">
            <span class="text-xs text-text-dim font-display tracking-wide uppercase">Trợ giúp</span>
            <span class="font-display text-xl font-bold text-accent-sky">{{ hints }}</span>
          </div>
          <div class="w-px h-8 bg-border-default"></div>
          <div class="flex flex-col items-center">
            <span class="text-xs text-text-dim font-display tracking-wide uppercase"
              >Trạng thái</span
            >
            <span :class="statusColorClass" class="font-display text-lg sm:text-xl font-bold">
              {{ statusText }}
            </span>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <button
            @click="useHint"
            :disabled="hints <= 0 || status === 'won' || status === 'lost'"
            class="px-4 py-2 bg-accent-amber/10 border border-accent-amber/50 hover:bg-accent-amber hover:text-bg-deep transition-colors text-text-primary text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <span>💡</span> Trợ giúp
          </button>

          <button
            v-if="status === 'won'"
            @click="nextLevel"
            class="px-4 py-2 bg-accent-sky text-bg-deep border border-accent-sky hover:bg-transparent hover:text-accent-sky transition-colors text-sm font-bold animate-fade-up"
          >
            Level Tiếp Theo
          </button>

          <button
            @click="resetToLevel1"
            class="px-4 py-2 bg-bg-elevated border border-border-default hover:border-accent-coral transition-colors text-text-primary text-sm font-semibold"
          >
            Chơi Lại
          </button>
        </div>
      </div>

      <!-- Game Board -->
      <div
        class="p-2 border border-border-default shadow-2xl overflow-auto select-none bg-bg-surface/30 backdrop-blur-md rounded-sm inline-block max-w-full"
        @contextmenu.prevent
      >
        <div
          class="grid gap-[1px] shrink-0 border border-border-default/50 relative"
          :style="{
            gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
            backgroundImage:
              imageLoaded && flatBoard.length > 0 ? `url(${currentBackground})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            width: 'fit-content',
          }"
        >
          <div
            class="absolute inset-0 bg-bg-deep/40 pointer-events-none transition-opacity duration-1000"
            :class="status === 'won' ? 'opacity-0' : 'opacity-100'"
          ></div>

          <div
            v-for="cell in flatBoard"
            :key="`${cell.r}-${cell.c}`"
            @click="handleLeftClick(cell)"
            @contextmenu.prevent="handleRightClick(cell)"
            class="relative z-10 flex items-center justify-center font-display text-base md:text-xl font-bold transition-all duration-[800ms] cursor-pointer"
            :class="[
              getCellClass(cell),
              {
                'animate-pulse ring-2 ring-accent-amber z-20 shadow-[0_0_15px_rgba(255,184,48,0.8)] bg-accent-amber/30':
                  hintTarget && cell.r === hintTarget.r && cell.c === hintTarget.c,
              },
            ]"
            :style="{ width: cellSize, height: cellSize }"
          >
            <!-- Khi thắng thì ẩn hết số và mìn đi cho đẹp, chỉ chiêm ngưỡng ảnh thôi -->
            <template v-if="status !== 'won'">
              <template v-if="cell.isRevealed">
                <span
                  v-if="cell.isMine"
                  class="text-accent-coral text-lg md:text-2xl animate-fade-up animate-delay-1 drop-shadow-md"
                  >💣</span
                >
                <span
                  v-else-if="cell.neighborMines > 0"
                  :class="getNumberColor(cell.neighborMines)"
                  class="drop-shadow-md"
                >
                  {{ cell.neighborMines }}
                </span>
              </template>
              <template v-else>
                <span
                  v-if="cell.isFlagged"
                  class="text-accent-amber text-lg md:text-2xl drop-shadow-md"
                  >🚩</span
                >
              </template>
            </template>
          </div>
        </div>
      </div>

      <!-- Back Link -->
      <RouterLink
        to="/"
        class="mt-12 inline-flex items-center gap-2 border border-border-default bg-bg-surface px-5 py-2.5 text-sm text-text-secondary transition hover:border-accent-coral hover:text-text-primary animate-fade-up animate-delay-3"
      >
        &larr; Back to home
      </RouterLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

const level = ref(1)
const hints = ref(3)
const hintTarget = ref<Cell | null>(null)

const currentBackground = ref('')

const getLevelImageId = (lv: number): number => {
  const STORAGE_KEY = 'minesweeper_level_images'
  const usedImagesStr = localStorage.getItem(STORAGE_KEY)
  let levelMap: Record<number, number> = {}

  if (usedImagesStr) {
    try {
      levelMap = JSON.parse(usedImagesStr)
    } catch (e) {
      console.error(e)
    }
  }

  // Nếu level này đã random ra ảnh trước đó, dùng lại luôn
  if (levelMap[lv]) {
    return levelMap[lv]
  }

  // Lấy ra danh sách các ảnh đã được dùng ở mọi level khác
  const usedIds = Object.values(levelMap)

  // Tạo danh sách ảnh khả dụng từ 1-55
  const availableIds: number[] = []
  for (let i = 1; i <= 55; i++) {
    if (!usedIds.includes(i)) {
      availableIds.push(i)
    }
  }

  // Nếu chơi đến level 56 mà cạn 55 ảnh rồi thì reset xoay vòng (cho phép trùng lại)
  if (availableIds.length === 0) {
    for (let i = 1; i <= 55; i++) availableIds.push(i)
  }

  const randomId: number = availableIds[Math.floor(Math.random() * availableIds.length)] || 1

  // Lưu lại vào map và save localStorage
  levelMap[lv] = randomId
  localStorage.setItem(STORAGE_KEY, JSON.stringify(levelMap))

  return randomId
}

const updateBackground = () => {
  const imageId = getLevelImageId(level.value)

  const imgPathWebp = `/minesweeper/${imageId}.webp?v=${Date.now()}`
  const imgPathJpg = `/minesweeper/${imageId}.jpg?v=${Date.now()}`
  const imgPathPng = `/minesweeper/${imageId}.png?v=${Date.now()}`
  const imgPathJpeg = `/minesweeper/${imageId}.jpeg?v=${Date.now()}`

  const formats = [imgPathWebp, imgPathJpg, imgPathPng, imgPathJpeg]
  const tryLoad = (index: number) => {
    if (index >= formats.length) {
      currentBackground.value = `/minesweeper/1.webp`
      return
    }
    const img = new Image()
    const src = formats[index] as string
    img.onload = () => {
      currentBackground.value = src
    }
    img.onerror = () => tryLoad(index + 1)
    img.src = src
  }
  tryLoad(0)
}

watch(
  level,
  () => {
    updateBackground()
  },
  { immediate: true },
)

// Độ khó tăng dần theo level
// Bắt đầu từ 8x8 (level 1) lên tối đa 20x20
// Cứ mỗi 2 level thì cả hàng và cột tăng thêm 1 ô để map nở dần ra
const maxGridSize = 24
const cols = computed(() => Math.min(maxGridSize, 8 + Math.floor((level.value - 1) / 2)))
const rows = computed(() => Math.min(maxGridSize, 8 + Math.floor((level.value - 1) / 2)))

const getMineDensity = (lv: number) => {
  const base = 0.1
  const max = 0.25
  return base + ((lv - 1) / 98) * (max - base)
}

const maxMines = computed(() => {
  const totalCells = rows.value * cols.value
  const density = getMineDensity(level.value)
  return Math.floor(totalCells * density)
})

// Tự động thu nhỏ các ô khi grid lớn để không tràn màn hình mobile
const cellSize = computed(() => {
  if (cols.value <= 10) return '3rem'
  if (cols.value <= 13) return '2.5rem'
  if (cols.value <= 16) return '2rem'
  return '1.5rem'
})

type GameStatus = 'idle' | 'playing' | 'won' | 'lost'

export interface Cell {
  r: number
  c: number
  isMine: boolean
  isRevealed: boolean
  isFlagged: boolean
  neighborMines: number
}

const status = ref<GameStatus>('idle')
const board = ref<Cell[][]>([])
const flatBoard = computed(() => board.value.flat())
const flagsPlaced = ref(0)
const firstClick = ref(true)
const imageLoaded = ref(false)

const remainingMines = computed(() => maxMines.value - flagsPlaced.value)

const statusText = computed(() => {
  switch (status.value) {
    case 'idle':
      return 'Sẵn sàng'
    case 'playing':
      return 'Đang chơi'
    case 'won':
      return 'Tuyệt vời!'
    case 'lost':
      return 'Thua rồi!'
    default:
      return ''
  }
})

const statusColorClass = computed(() => {
  switch (status.value) {
    case 'idle':
      return 'text-text-secondary'
    case 'playing':
      return 'text-accent-sky'
    case 'won':
      return 'text-accent-amber animate-pulse'
    case 'lost':
      return 'text-accent-coral font-bold'
    default:
      return ''
  }
})

const getCellClass = (cell: Cell) => {
  if (status.value === 'won') {
    return 'bg-transparent border-transparent'
  }

  if (cell.isRevealed) {
    return cell.isMine
      ? 'bg-accent-coral/80 border border-accent-coral'
      : 'bg-transparent border border-white/10 shadow-[inset_0_0_20px_rgba(0,0,0,0.2)]'
  }
  // Màu sắc phải đủ đậm đập chết khối vuông để không bị leak ảnh chớp mờ
  return 'bg-[#162232] border-t border-l border-white/10 shadow-[inset_2px_2px_4px_rgba(255,255,255,0.05),inset_-2px_-2px_4px_rgba(0,0,0,0.2)] hover:bg-[#1E2F42] hover:border-accent-sky/50'
}

const getNumberColor = (count: number) => {
  const colors = [
    '',
    'text-accent-sky',
    'text-accent-amber',
    'text-accent-coral',
    'text-[#A78BFA]',
    'text-[#F472B6]',
    'text-[#34D399]',
    'text-[#FBBF24]',
    'text-[#F87171]',
  ]
  return colors[count] || 'text-white'
}

const initGame = () => {
  imageLoaded.value = false // Tắt ảnh đi trong lúc tải grid
  status.value = 'idle'
  flagsPlaced.value = 0
  firstClick.value = true
  const newBoard: Cell[][] = []
  for (let r = 0; r < rows.value; r++) {
    const row: Cell[] = []
    for (let c = 0; c < cols.value; c++) {
      row.push({
        r,
        c,
        isMine: false,
        isRevealed: false,
        isFlagged: false,
        neighborMines: 0,
      })
    }
    newBoard.push(row)
  }
  board.value = newBoard

  // Bật ảnh lại sau khi Vue render grid xong (chờ hẳn 1s để chắc chắn các ô vuông đã phủ kín)
  setTimeout(() => {
    imageLoaded.value = true
  }, 500)
}

const resetToLevel1 = () => {
  level.value = 1
  hints.value = 3
  initGame()
}

const nextLevel = () => {
  if (level.value < 99) {
    level.value++
    initGame()
  } else {
    alert('Chúc mừng bạn đã phá đảo toàn bộ 99 level!')
  }
}

const useHint = () => {
  if (hints.value <= 0 || status.value === 'won' || status.value === 'lost') return

  if (firstClick.value) {
    const r = Math.floor(rows.value / 2)
    const c = Math.floor(cols.value / 2)
    const centerCell = board.value[r]?.[c]
    if (centerCell) handleLeftClick(centerCell)
  }

  const safeCells: Cell[] = []
  flatBoard.value.forEach((cell) => {
    if (!cell.isMine && !cell.isRevealed && !cell.isFlagged) {
      safeCells.push(cell)
    }
  })

  if (safeCells.length === 0) return

  const zeroCells = safeCells.filter((c) => c.neighborMines === 0)
  const targetArray = zeroCells.length > 0 ? zeroCells : safeCells

  const target = targetArray[Math.floor(Math.random() * targetArray.length)]

  if (!target) return

  hintTarget.value = target
  hints.value--

  setTimeout(() => {
    handleLeftClick(target)
    setTimeout(() => {
      hintTarget.value = null
    }, 500)
  }, 300)
}

const placeMines = (firstR: number, firstC: number) => {
  let minesPlaced = 0
  let attempts = 0
  const maxAttempts = rows.value * cols.value * 10

  while (minesPlaced < maxMines.value && attempts < maxAttempts) {
    attempts++
    const r = Math.floor(Math.random() * rows.value)
    const c = Math.floor(Math.random() * cols.value)

    const isSafeZone = Math.abs(r - firstR) <= 1 && Math.abs(c - firstC) <= 1
    const strictSafe = attempts > maxAttempts / 2 ? r === firstR && c === firstC : isSafeZone

    const cellAtPos = board.value[r]?.[c]
    if (cellAtPos && !cellAtPos.isMine && !strictSafe) {
      cellAtPos.isMine = true
      minesPlaced++
    }
  }

  for (let r = 0; r < rows.value; r++) {
    for (let c = 0; c < cols.value; c++) {
      const cell = board.value[r]?.[c]
      if (cell && !cell.isMine) {
        let count = 0
        getNeighbors(r, c).forEach((n) => {
          if (n && n.isMine) count++
        })
        cell.neighborMines = count
      }
    }
  }
}

const getNeighbors = (r: number, c: number) => {
  const neighbors: Cell[] = []
  for (let i = -1; i <= 1; i++) {
    for (let j = -1; j <= 1; j++) {
      if (i === 0 && j === 0) continue
      const nr = r + i
      const nc = c + j
      if (nr >= 0 && nr < rows.value && nc >= 0 && nc < cols.value) {
        const neighborCell = board.value[nr]?.[nc]
        if (neighborCell) {
          neighbors.push(neighborCell)
        }
      }
    }
  }
  return neighbors
}

const handleLeftClick = (cell: Cell) => {
  if (status.value === 'won' || cell.isFlagged || cell.isRevealed) return

  if (status.value === 'lost') {
    resetToLevel1()
    return
  }

  if (firstClick.value) {
    firstClick.value = false
    status.value = 'playing'
    placeMines(cell.r, cell.c)
  }

  revealCell(cell.r, cell.c)
  checkWinCondition()
}

const handleRightClick = (cell: Cell) => {
  if (status.value === 'won' || status.value === 'lost' || cell.isRevealed) return

  if (!cell.isFlagged && flagsPlaced.value < maxMines.value) {
    cell.isFlagged = true
    flagsPlaced.value++
  } else if (cell.isFlagged) {
    cell.isFlagged = false
    flagsPlaced.value--
  }
}

const revealCell = (r: number, c: number) => {
  const cell = board.value[r]?.[c]
  if (!cell || cell.isRevealed || cell.isFlagged) return

  cell.isRevealed = true

  if (cell.isMine) {
    gameOver()
    return
  }

  if (cell.neighborMines === 0) {
    const stack = [[r, c]]
    while (stack.length > 0) {
      const curr = stack.pop()
      if (!curr) continue
      const [cr, cc] = curr
      if (cr !== undefined && cc !== undefined) {
        getNeighbors(cr, cc).forEach((n) => {
          if (n && !n.isRevealed && !n.isFlagged) {
            n.isRevealed = true
            if (n.neighborMines === 0 && !n.isMine) {
              stack.push([n.r, n.c])
            }
          }
        })
      }
    }
  }
}

const gameOver = () => {
  status.value = 'lost'
  flatBoard.value.forEach((cell) => {
    if (cell.isMine) {
      cell.isRevealed = true
    }
  })
}

const checkWinCondition = () => {
  if (status.value === 'lost') return

  let unrevealedSafe = 0
  flatBoard.value.forEach((cell) => {
    if (!cell.isMine && !cell.isRevealed) unrevealedSafe++
  })

  if (unrevealedSafe === 0) {
    status.value = 'won'
    hints.value++
    flatBoard.value.forEach((cell) => {
      if (cell.isMine && !cell.isFlagged) {
        cell.isFlagged = true
        flagsPlaced.value++
      }
    })
  }
}

initGame()
</script>
