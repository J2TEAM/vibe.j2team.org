import { ref, computed } from 'vue'

// =============================================
// KIỂU DỮ LIỆU
// =============================================

/** Vị trí trên bàn cờ (0–11): 0,6 = ô quan; 1–5 = dân người chơi; 7–11 = dân máy */
export type CellIndex = number

/** Hướng rải quân */
export type Direction = 'left' | 'right'

/** Lượt chơi */
export type Player = 'human' | 'computer'

/** Pha game */
export type GamePhase =
  | 'picking' // Đang chọn ô để đi
  | 'animating' // Đang rải quân (animation)
  | 'computer' // Máy đang nghĩ
  | 'gameOver' // Kết thúc

/** Một bước rải quân (dùng cho animation) */
export interface AnimationStep {
  type:
    | 'distribute' // Rải 1 quân vào ô
    | 'capture' // Ăn quân ở ô
    | 'skip' // Bỏ qua ô quan
  cellIndex: number
  boardSnapshot: number[] // Trạng thái bàn cờ sau bước này
  capturedStones?: number // Số quân bị ăn (nếu type = capture)
}

/** Kết quả 1 nước đi */
export interface MoveResult {
  steps: AnimationStep[]
  capturedByHuman: number
  capturedByComputer: number
}

// =============================================
// HẰNG SỐ
// =============================================

/** Số ô trên bàn (bao gồm 2 ô quan) */
const BOARD_SIZE = 12
/** Ô quan bên trái (của người chơi phía dưới) */
const QUAN_LEFT = 0
/** Ô quan bên phải (của người chơi phía trên) */
const QUAN_RIGHT = 6
/** Số quân dân ban đầu mỗi ô nhỏ */
const INITIAL_STONES = 5
/** Giá trị 1 quân quan (quy đổi) */
const QUAN_VALUE = 10
/** Thời gian delay mỗi bước animation (ms) */
export const ANIMATION_DELAY = 300

// =============================================
// COMPOSABLE CHÍNH
// =============================================

export function useOAnQuan() {
  // --- Trạng thái bàn cờ ---
  // board[0] = ô quan trái, board[1..5] = 5 ô dân người chơi (phía dưới)
  // board[6] = ô quan phải, board[7..11] = 5 ô dân máy (phía trên)
  const board = ref<number[]>(createInitialBoard())

  // --- Trạng thái game ---
  const currentPlayer = ref<Player>('human')
  const gamePhase = ref<GamePhase>('picking')
  const humanScore = ref(0)
  const computerScore = ref(0)
  const selectedCell = ref<CellIndex | null>(null)
  const selectedDirection = ref<Direction | null>(null)
  const highlightedCell = ref<CellIndex | null>(null) // Ô đang được highlight (animation)
  const lastCapturedCells = ref<CellIndex[]>([]) // Ô vừa bị ăn (hiệu ứng)
  const moveHistory = ref<string[]>([]) // Lịch sử nước đi
  const gameMessage = ref('') // Thông báo

  // --- Computed ---

  /** Các ô dân người chơi có thể chọn */
  const humanCells = computed(() => [1, 2, 3, 4, 5])
  /** Các ô dân máy */
  const computerCells = computed(() => [7, 8, 9, 10, 11])

  /** Kiểm tra ô có click được không (ô dân của human, có quân, đang ở phase picking) */
  const isPlayableCell = computed(() => {
    return (index: CellIndex): boolean => {
      if (gamePhase.value !== 'picking') return false
      if (currentPlayer.value !== 'human') return false
      if (!humanCells.value.includes(index)) return false
      return (board.value[index] ?? 0) > 0
    }
  })

  /** Kiểm tra ô là ô quan */
  const isQuanCell = (index: CellIndex): boolean => {
    return index === QUAN_LEFT || index === QUAN_RIGHT
  }

  /** Tổng quân còn trên bàn */
  const totalStonesOnBoard = computed(() => {
    return board.value.reduce((sum, stones) => sum + stones, 0)
  })

  /** Kiểm tra người chơi cần rải thêm quân (hết quân ở phía mình) */
  const humanHasNoStones = computed(() => {
    return humanCells.value.every((i) => board.value[i] === 0)
  })

  const computerHasNoStones = computed(() => {
    return computerCells.value.every((i) => board.value[i] === 0)
  })

  // =============================================
  // LOGIC GAME
  // =============================================

  /** Tạo bàn cờ ban đầu */
  function createInitialBoard(): number[] {
    // [quan_left, dân1, dân2, dân3, dân4, dân5, quan_right, dân6, dân7, dân8, dân9, dân10]
    const b = Array.from({ length: BOARD_SIZE }, () => INITIAL_STONES)
    b[QUAN_LEFT] = QUAN_VALUE
    b[QUAN_RIGHT] = QUAN_VALUE
    return b
  }

  /** Lấy ô tiếp theo theo hướng (vòng tròn) */
  function nextCell(current: CellIndex, direction: Direction): CellIndex {
    if (direction === 'right') {
      // Chiều kim đồng hồ: 1→2→3→4→5→6→7→8→9→10→11→0→1...
      return (current + 1) % BOARD_SIZE
    } else {
      // Ngược chiều: 1→0→11→10→9→8→7→6→5→4→3→2→1...
      return (current - 1 + BOARD_SIZE) % BOARD_SIZE
    }
  }

  /**
   * Thực hiện 1 nước đi: nhặt quân từ ô startCell, rải theo direction
   * Trả về danh sách các bước (cho animation)
   */
  function executeMove(
    startCell: CellIndex,
    direction: Direction,
    boardState: number[],
  ): AnimationStep[] {
    const b = [...boardState] // Clone bàn cờ
    const steps: AnimationStep[] = []

    // Nhặt hết quân ở ô bắt đầu
    let hand = b[startCell] ?? 0
    b[startCell] = 0

    let current = startCell

    // Rải quân
    while (hand > 0) {
      current = nextCell(current, direction)
      b[current] = (b[current] ?? 0) + 1
      hand--
      steps.push({
        type: 'distribute',
        cellIndex: current,
        boardSnapshot: [...b],
      })
    }

    // Sau khi rải hết, kiểm tra ăn quân
    let captureLoop = true
    while (captureLoop) {
      const nextIdx = nextCell(current, direction)

      // Nếu ô tiếp theo là ô quan và trống → dừng
      if (isQuanCell(nextIdx) && b[nextIdx] === 0) {
        captureLoop = false
        break
      }

      // Nếu ô tiếp theo trống → kiểm tra ô sau nó
      if (b[nextIdx] === 0) {
        const afterNext = nextCell(nextIdx, direction)

        // Nếu ô sau ô trống cũng trống hoặc là ô quan trống → dừng
        if (b[afterNext] === 0) {
          captureLoop = false
          break
        }

        // Ăn quân ở ô sau ô trống
        const captured = b[afterNext]
        b[afterNext] = 0
        steps.push({
          type: 'capture',
          cellIndex: afterNext,
          boardSnapshot: [...b],
          capturedStones: captured,
        })

        // Tiếp tục kiểm tra (current = afterNext)
        current = afterNext
      } else {
        // Ô tiếp theo không trống → dừng
        captureLoop = false
      }
    }

    return steps
  }

  /**
   * Người chơi chọn ô và hướng đi → thực hiện nước đi
   */
  async function humanMove(cellIndex: CellIndex, direction: Direction) {
    if (!isPlayableCell.value(cellIndex)) return

    selectedCell.value = cellIndex
    selectedDirection.value = direction
    gamePhase.value = 'animating'
    lastCapturedCells.value = []

    // Thực hiện logic
    const steps = executeMove(cellIndex, direction, board.value)

    // Phát animation từng bước
    let capturedTotal = 0
    for (const step of steps) {
      highlightedCell.value = step.cellIndex
      board.value = [...step.boardSnapshot]

      if (step.type === 'capture' && step.capturedStones) {
        capturedTotal += step.capturedStones
        lastCapturedCells.value.push(step.cellIndex)
        humanScore.value += step.capturedStones
      }

      await delay(ANIMATION_DELAY)
    }

    highlightedCell.value = null

    // Ghi lịch sử
    const dirLabel = direction === 'right' ? '→' : '←'
    moveHistory.value.unshift(
      `Bạn: ô ${cellIndex} ${dirLabel}${capturedTotal > 0 ? ` (ăn ${capturedTotal})` : ''}`,
    )

    // Kiểm tra phải rải lại quân không
    await checkAndRefillStones()

    // Kiểm tra kết thúc
    if (checkGameOver()) return

    // Chuyển lượt sang máy
    currentPlayer.value = 'computer'
    gamePhase.value = 'computer'
    gameMessage.value = 'Máy đang suy nghĩ...'

    await delay(800 + Math.random() * 500)

    await computerMove()
  }

  /**
   * Máy tự chơi (AI đơn giản: chọn nước ăn được nhiều nhất)
   */
  async function computerMove() {
    gamePhase.value = 'animating'
    lastCapturedCells.value = []

    // Tìm nước đi tốt nhất cho máy
    const bestMove = findBestMove()
    if (!bestMove) {
      // Máy không có nước đi → kết thúc
      checkGameOver()
      return
    }

    // Thực hiện
    const steps = executeMove(bestMove.cell, bestMove.direction, board.value)

    let capturedTotal = 0
    for (const step of steps) {
      highlightedCell.value = step.cellIndex
      board.value = [...step.boardSnapshot]

      if (step.type === 'capture' && step.capturedStones) {
        capturedTotal += step.capturedStones
        lastCapturedCells.value.push(step.cellIndex)
        computerScore.value += step.capturedStones
      }

      await delay(ANIMATION_DELAY)
    }

    highlightedCell.value = null

    // Ghi lịch sử
    const dirLabel = bestMove.direction === 'right' ? '→' : '←'
    moveHistory.value.unshift(
      `Máy: ô ${bestMove.cell} ${dirLabel}${capturedTotal > 0 ? ` (ăn ${capturedTotal})` : ''}`,
    )

    // Kiểm tra phải rải lại quân không
    await checkAndRefillStones()

    // Kiểm tra kết thúc
    if (checkGameOver()) return

    // Chuyển lượt về người chơi
    currentPlayer.value = 'human'
    gamePhase.value = 'picking'
    gameMessage.value = 'Lượt của bạn — chọn ô để đi'

    selectedCell.value = null
    selectedDirection.value = null
  }

  /**
   * AI: Tìm nước đi tốt nhất (greedy — ưu tiên ăn nhiều)
   */
  function findBestMove(): { cell: CellIndex; direction: Direction } | null {
    let bestScore = -1
    let bestMoves: { cell: CellIndex; direction: Direction }[] = []

    for (const cell of computerCells.value) {
      if (board.value[cell] === 0) continue

      for (const dir of ['left', 'right'] as Direction[]) {
        const steps = executeMove(cell, dir, board.value)
        const captured = steps
          .filter((s) => s.type === 'capture')
          .reduce((sum, s) => sum + (s.capturedStones || 0), 0)

        if (captured > bestScore) {
          bestScore = captured
          bestMoves = [{ cell, direction: dir }]
        } else if (captured === bestScore) {
          bestMoves.push({ cell, direction: dir })
        }
      }
    }

    if (bestMoves.length === 0) return null

    // Chọn ngẫu nhiên trong các nước tốt nhất
    return bestMoves[Math.floor(Math.random() * bestMoves.length)] ?? null
  }

  /**
   * Kiểm tra và rải lại quân nếu 1 bên hết quân
   * (mỗi ô nhận 1 quân từ điểm của người chơi đó)
   */
  async function checkAndRefillStones() {
    // Người chơi hết quân → lấy 5 quân từ điểm để rải vào 5 ô dân
    if (humanHasNoStones.value && humanScore.value >= 5 && !areBothQuanEmpty()) {
      humanScore.value -= 5
      for (const cell of humanCells.value) {
        board.value[cell] = 1
      }
      board.value = [...board.value]
      gameMessage.value = 'Bạn hết quân — đã rải lại 5 quân!'
      await delay(500)
    }

    // Máy hết quân
    if (computerHasNoStones.value && computerScore.value >= 5 && !areBothQuanEmpty()) {
      computerScore.value -= 5
      for (const cell of computerCells.value) {
        board.value[cell] = 1
      }
      board.value = [...board.value]
      gameMessage.value = 'Máy hết quân — đã rải lại 5 quân!'
      await delay(500)
    }
  }

  /** Kiểm tra cả 2 ô quan đều trống */
  function areBothQuanEmpty(): boolean {
    return board.value[QUAN_LEFT] === 0 && board.value[QUAN_RIGHT] === 0
  }

  /**
   * Kiểm tra game kết thúc:
   * - Cả 2 ô quan trống
   * - Hoặc 1 bên không thể đi (hết quân + không đủ điểm rải lại)
   */
  function checkGameOver(): boolean {
    const bothQuanEmpty = areBothQuanEmpty()
    const humanCanPlay =
      humanCells.value.some((i) => (board.value[i] ?? 0) > 0) || humanScore.value >= 5
    const computerCanPlay =
      computerCells.value.some((i) => (board.value[i] ?? 0) > 0) || computerScore.value >= 5

    if (bothQuanEmpty || !humanCanPlay || !computerCanPlay) {
      // Thu hồi quân còn lại trên bàn
      // Quân ở phía người chơi → về người chơi
      for (const cell of humanCells.value) {
        humanScore.value += board.value[cell] ?? 0
        board.value[cell] = 0
      }
      // Quân ở phía máy → về máy
      for (const cell of computerCells.value) {
        computerScore.value += board.value[cell] ?? 0
        board.value[cell] = 0
      }
      // Quân quan → chia đều (hoặc ai gần hơn)
      humanScore.value += board.value[QUAN_LEFT] ?? 0
      computerScore.value += board.value[QUAN_RIGHT] ?? 0
      board.value[QUAN_LEFT] = 0
      board.value[QUAN_RIGHT] = 0

      board.value = [...board.value]

      gamePhase.value = 'gameOver'

      if (humanScore.value > computerScore.value) {
        gameMessage.value = '🎉 Bạn thắng!'
      } else if (humanScore.value < computerScore.value) {
        gameMessage.value = '😢 Máy thắng!'
      } else {
        gameMessage.value = '🤝 Hòa!'
      }

      return true
    }

    return false
  }

  /** Reset game */
  function resetGame() {
    board.value = createInitialBoard()
    currentPlayer.value = 'human'
    gamePhase.value = 'picking'
    humanScore.value = 0
    computerScore.value = 0
    selectedCell.value = null
    selectedDirection.value = null
    highlightedCell.value = null
    lastCapturedCells.value = []
    moveHistory.value = []
    gameMessage.value = 'Lượt của bạn — chọn ô để đi'
  }

  // Khởi tạo message
  gameMessage.value = 'Lượt của bạn — chọn ô để đi'

  return {
    // Trạng thái
    board,
    currentPlayer,
    gamePhase,
    humanScore,
    computerScore,
    selectedCell,
    selectedDirection,
    highlightedCell,
    lastCapturedCells,
    moveHistory,
    gameMessage,

    // Computed
    humanCells,
    computerCells,
    isPlayableCell,
    totalStonesOnBoard,

    // Hằng số
    QUAN_LEFT,
    QUAN_RIGHT,
    BOARD_SIZE,
    QUAN_VALUE,

    // Hành động
    humanMove,
    isQuanCell,
    resetGame,
  }
}

// --- Tiện ích ---
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
