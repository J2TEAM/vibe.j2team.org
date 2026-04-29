<script setup lang="ts">
import { Icon } from '@iconify/vue'
import {
  useClipboard,
  useElementSize,
  useEventListener,
  useLocalStorage,
  useMediaQuery,
} from '@vueuse/core'
import { computed, ref, shallowRef, watch } from 'vue'
import { useVchessAiWorker } from './composables/use-vchess-ai-worker'
import { useVchessClock } from './composables/use-vchess-clock'
import { useVchessSounds } from './composables/use-vchess-sounds'
import { VCHESS_CLOCK_DEFAULTS, type VChessClockSettings } from './constants'
import {
  BOARD_COLS,
  BOARD_ROWS,
  createInitialState,
  findKing,
  getGameStatus,
  getLegalMovesForSquare,
  isInCheck,
  isInsideBoard,
  makeMove,
  positionToCoordinate,
  undoLastMove,
  type MoveRecord,
  type Piece,
  type Position,
  type Side,
} from './engine/vchess-engine'
import { AI_MAX_PLY, AI_MAX_SEARCH_MS, AI_SEARCH_MS_MIN } from './engine/vchess-search'
import { getPieceImageSrc } from './piece-images'
import {
  buildPgnDocument,
  formatHistoryAsPgnMoveText,
  importGameFromPgnText,
} from './utils/vchess-pgn'
import { parseVchessFen, serializeVchessFen } from './utils/vchess-fen'
import RulesContent from './components/RulesContent.vue'

type Screen = 'menu' | 'ai-setup' | 'rules' | 'game'
type GameMode = 'solo' | 'vs-ai'

const screen = ref<Screen>('menu')
const gameMode = ref<GameMode>('solo')

/** shallowRef: engine gọi apply/unapply tạm trên state — deep reactive sẽ kích hoạt lại computed giữa chừng và có thể lặp vô hạn. */
const gameState = shallowRef(createInitialState())
const selectedSquare = ref<Position | null>(null)

/** Đồng hồ ván vs máy — chỉ gán khi bấm «Bắt đầu» ở màn chuẩn bị. */
const matchClockSettings = ref<VChessClockSettings | null>(null)

/** Tạm dừng ván vs máy: dừng đồng hồ, không cho đi quân, không gọi AI. */
const aiGamePaused = ref(false)

const clockSettings = useLocalStorage<VChessClockSettings>('vchess-clock-settings', () => ({
  initialMinutes: VCHESS_CLOCK_DEFAULTS.initialMinutes,
  incrementSeconds: VCHESS_CLOCK_DEFAULTS.incrementSeconds,
}))

/** Bản nháp trên màn «Chơi với máy» — đồng bộ khi mở màn. */
const aiSetupMinutes = ref<number>(VCHESS_CLOCK_DEFAULTS.initialMinutes)
const aiSetupIncrement = ref<number>(VCHESS_CLOCK_DEFAULTS.incrementSeconds)

const initialMinutesForClock = computed(() => {
  const src = matchClockSettings.value
  if (!src) return VCHESS_CLOCK_DEFAULTS.initialMinutes
  const n = Number(src.initialMinutes)
  if (!Number.isFinite(n)) return VCHESS_CLOCK_DEFAULTS.initialMinutes
  return Math.min(180, Math.max(1, Math.round(n)))
})

const incrementSecondsForClock = computed(() => {
  const src = matchClockSettings.value
  if (!src) return VCHESS_CLOCK_DEFAULTS.incrementSeconds
  const n = Number(src.incrementSeconds)
  if (!Number.isFinite(n)) return VCHESS_CLOCK_DEFAULTS.incrementSeconds
  return Math.min(600, Math.max(0, Math.round(n)))
})

const clockEnabled = computed(
  () =>
    screen.value === 'game' &&
    gameMode.value === 'vs-ai' &&
    matchClockSettings.value !== null &&
    !aiGamePaused.value,
)

const { playForMoveType } = useVchessSounds()
const { requestSearch, cancelPendingSearches } = useVchessAiWorker()
const { copy: copyToClipboard } = useClipboard()

const pgnFeedback = ref('')
const pgnPasteText = ref('')

const pgnMovesLine = computed(() => formatHistoryAsPgnMoveText(gameState.value.history))

function clearPgnFeedbackSoon() {
  window.setTimeout(() => {
    pgnFeedback.value = ''
  }, 4000)
}

async function exportPgnToClipboard() {
  pgnFeedback.value = ''
  const text = buildPgnDocument({ history: gameState.value.history, mode: gameMode.value })
  try {
    await copyToClipboard(text)
    pgnFeedback.value = 'Đã sao chép ván (PGN vChess) vào clipboard.'
    clearPgnFeedbackSoon()
  } catch {
    pgnFeedback.value = 'Không sao chép được — thử chọn «Sao chép văn bản» thủ công.'
    clearPgnFeedbackSoon()
  }
}

function applyPgnImport(text: string) {
  pgnFeedback.value = ''
  const trimmed = text.trim()
  if (!trimmed) {
    pgnFeedback.value = 'Nội dung trống.'
    return
  }
  if (gameState.value.history.length > 0) {
    const ok = window.confirm('Thay thế ván hiện tại bằng ván từ PGN?')
    if (!ok) return
  }
  cancelPendingSearches()
  const result = importGameFromPgnText(trimmed)
  if ('error' in result) {
    pgnFeedback.value = result.error
    return
  }
  aiGamePaused.value = false
  gameState.value = result
  selectedSquare.value = null
  pgnPasteText.value = ''
  if (gameMode.value === 'vs-ai' && matchClockSettings.value) {
    resetClock()
  }
  pgnFeedback.value = 'Đã nhập ván.'
  clearPgnFeedbackSoon()
}

function applyPgnFromTextarea() {
  applyPgnImport(pgnPasteText.value)
}

const fenPasteText = ref('')
const fenFeedback = ref('')

function clearFenFeedbackSoon() {
  window.setTimeout(() => {
    fenFeedback.value = ''
  }, 5000)
}

function applyFenFromTextarea() {
  fenFeedback.value = ''
  const trimmed = fenPasteText.value.trim()
  if (!trimmed) {
    fenFeedback.value = 'Ô FEN trống.'
    return
  }
  if (gameState.value.history.length > 0) {
    const ok = window.confirm('Thay thế ván hiện tại bằng thế cờ FEN? (Lịch sử nước sẽ mất.)')
    if (!ok) return
  }
  cancelPendingSearches()
  const result = parseVchessFen(trimmed)
  if ('error' in result) {
    fenFeedback.value = result.error
    return
  }
  aiGamePaused.value = false
  gameState.value = result
  selectedSquare.value = null
  if (gameMode.value === 'vs-ai' && matchClockSettings.value) {
    resetClock()
  }
  fenFeedback.value = 'Đã áp dụng thế cờ FEN.'
  clearFenFeedbackSoon()
}

async function copyFenToClipboard() {
  fenFeedback.value = ''
  try {
    await copyToClipboard(serializeVchessFen(gameState.value))
    fenFeedback.value = 'Đã sao chép FEN thế cờ hiện tại.'
    clearFenFeedbackSoon()
  } catch {
    fenFeedback.value = 'Không sao chép được — chép thủ công từ ô.'
    clearFenFeedbackSoon()
  }
}

const status = computed(() => getGameStatus(gameState.value))

/** Ô vua đang bị chiếu — hiển thị nhấn mạnh trên bàn (khi ván đang diễn ra hoặc vừa chiếu hết). */
const kingInCheckSquare = computed((): Position | null => {
  if (status.value !== 'playing' && status.value !== 'checkmate') return null
  if (!isInCheck(gameState.value, gameState.value.turn)) return null
  return findKing(gameState.value, gameState.value.turn)
})

const {
  redMs,
  blackMs,
  timeoutLoser,
  reset: resetClock,
  applyIncrementAfterMove,
  revertIncrementForMover,
} = useVchessClock({
  enabled: clockEnabled,
  gameStatus: status,
  turn: computed(() => gameState.value.turn),
  initialMinutes: initialMinutesForClock,
  incrementSeconds: incrementSecondsForClock,
})

function formatClock(ms: number) {
  const totalSec = Math.max(0, Math.floor(ms / 1000))
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function openAiSetup() {
  aiSetupMinutes.value =
    Number(clockSettings.value.initialMinutes) || VCHESS_CLOCK_DEFAULTS.initialMinutes
  aiSetupIncrement.value =
    Number(clockSettings.value.incrementSeconds) || VCHESS_CLOCK_DEFAULTS.incrementSeconds
  screen.value = 'ai-setup'
}

function cancelAiSetup() {
  screen.value = 'menu'
}

function syncAiSetupDraft() {
  aiSetupMinutes.value = Math.min(180, Math.max(1, Math.round(Number(aiSetupMinutes.value) || 1)))
  aiSetupIncrement.value = Math.min(
    600,
    Math.max(0, Math.round(Number(aiSetupIncrement.value) || 0)),
  )
}

/** Lưu mặc định + bắt đầu ván; đồng hồ chỉ chạy từ đây. */
function beginVsAiFromSetup() {
  syncAiSetupDraft()
  clockSettings.value.initialMinutes = aiSetupMinutes.value
  clockSettings.value.incrementSeconds = aiSetupIncrement.value
  matchClockSettings.value = {
    initialMinutes: aiSetupMinutes.value,
    incrementSeconds: aiSetupIncrement.value,
  }
  gameMode.value = 'vs-ai'
  aiGamePaused.value = false
  gameState.value = createInitialState()
  selectedSquare.value = null
  screen.value = 'game'
  resetClock()
}

const fileLabels = Array.from({ length: BOARD_COLS }, (_, index) => `${index + 1}`)
const rankLabels = Array.from({ length: BOARD_ROWS }, (_, index) => String.fromCharCode(97 + index))
const displayRows = Array.from({ length: BOARD_ROWS }, (_, index) => BOARD_ROWS - 1 - index)

/** Khung full-width quanh bàn — đo để tính kích thước ô, tránh scroll ngang trên mobile. */
const boardFitEl = ref<HTMLDivElement | null>(null)
const { width: boardFitWidth } = useElementSize(boardFitEl)

/** Trục số/chữ (1–9, a–k) chỉ từ sm — mobile ẩn để ô cờ rộng tối đa. */
const vchessBoardShowAxes = useMediaQuery('(min-width: 640px)')

/**
 * Phần cố định ngang ngoài 9 ô: từ sm có viền gỗ + p-3 + khung ô + trục; mobile tối giản (full width) chỉ chừa vài px subpixel.
 */
const boardCellGutterPx = computed(() => (vchessBoardShowAxes.value ? 132 : 2))

const boardCellPx = computed(() => {
  const w = boardFitWidth.value
  if (!w || w < 80) return 58
  const raw = Math.floor((w - boardCellGutterPx.value) / 9)
  if (raw < 1) return 12
  return Math.min(58, raw)
})

const boardRootStyle = computed(() => ({
  '--vchess-cell': `${boardCellPx.value}px`,
}))

const legalMovesFromSelected = computed(() => {
  if (!selectedSquare.value) return []
  return getLegalMovesForSquare(gameState.value, selectedSquare.value)
})

const turnText = computed(() => (gameState.value.turn === 'red' ? 'Đỏ' : 'Đen'))

/** Hoàn nước: solo bất kỳ lúc; vs máy — hủy tìm AI nếu đang chờ Đen, trừ increment tương ứng. */
const canUndo = computed(
  () => screen.value === 'game' && !timeoutLoser.value && gameState.value.history.length > 0,
)

/** Viền avatar phía bàn: Đen (trên) / Đỏ (dưới). */
const highlightBoardTopAvatar = computed(
  () =>
    screen.value === 'game' &&
    status.value === 'playing' &&
    !timeoutLoser.value &&
    !aiGamePaused.value &&
    gameState.value.turn === 'black',
)

const highlightBoardBottomAvatar = computed(
  () =>
    screen.value === 'game' &&
    status.value === 'playing' &&
    !timeoutLoser.value &&
    !aiGamePaused.value &&
    gameState.value.turn === 'red',
)

const isAiThinking = computed(
  () =>
    screen.value === 'game' &&
    gameMode.value === 'vs-ai' &&
    !aiGamePaused.value &&
    status.value === 'playing' &&
    !timeoutLoser.value &&
    gameState.value.turn === 'black',
)

/** Lật đại bàng (mặt đất → bay): chỉ khi đã chọn đúng quân và đến lượt — icon / phím L (cạnh bàn: nhấp ô quân khi không có ô phía trước trong bàn). */
const canFlipSelectedEagle = computed(() => {
  if (status.value !== 'playing' || timeoutLoser.value) return false
  if (gameMode.value === 'vs-ai' && aiGamePaused.value) return false
  if (isAiThinking.value) return false
  const sel = selectedSquare.value
  if (!sel) return false
  const p = gameState.value.board[sel.row]?.[sel.col]
  if (!p || p.kind !== 'eagle' || p.eagleMode !== 'ground') return false
  if (p.side !== gameState.value.turn) return false
  return legalMovesFromSelected.value.some((m) => m.type === 'flip')
})

/** Vị trí UI lật đại bàng: nút căn giữa ô quân; không dùng nhấp ô trống phía trước (giữa hai chéo) để lật. */
type EagleFlipUiPlacement =
  | { kind: 'forwardCell'; renderRow: number; renderCol: number }
  | { kind: 'eagleEdge'; row: number; col: number }

const eagleFlipUiPlacement = computed((): EagleFlipUiPlacement | null => {
  if (!canFlipSelectedEagle.value || !selectedSquare.value) return null
  const sel = selectedSquare.value
  const p = gameState.value.board[sel.row]?.[sel.col]
  if (!p || p.kind !== 'eagle') return null
  const dir = p.side === 'red' ? 1 : -1
  const mid = { row: sel.row + dir, col: sel.col }
  if (isInsideBoard(mid)) {
    return {
      kind: 'forwardCell',
      renderRow: sel.row,
      renderCol: sel.col,
    }
  }
  return {
    kind: 'eagleEdge',
    row: sel.row,
    col: sel.col,
  }
})

function isTypingTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false
  const tag = el.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true
  return el.isContentEditable
}

useEventListener(
  'keydown',
  (e: KeyboardEvent) => {
    if (e.key !== 'l' && e.key !== 'L') return
    if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return
    if (isTypingTarget(e.target)) return
    if (!canFlipSelectedEagle.value) return
    e.preventDefault()
    maybeFlipSelected()
  },
  { passive: false },
)

const modeLabel = computed(() =>
  gameMode.value === 'solo'
    ? 'Hai người đi cùng máy (luân phiên lượt)'
    : `Bạn cầm Đỏ; máy cầm Đen (${Math.round(AI_SEARCH_MS_MIN / 1000)}–${Math.round(AI_MAX_SEARCH_MS / 1000)}s ngẫu nhiên / tối đa ${AI_MAX_PLY} ply mỗi nước)`,
)

const headline = computed(() => {
  if (
    gameMode.value === 'vs-ai' &&
    aiGamePaused.value &&
    status.value === 'playing' &&
    !timeoutLoser.value
  ) {
    return 'Tạm dừng'
  }
  if (timeoutLoser.value) {
    const winner = timeoutLoser.value === 'red' ? 'Đen' : 'Đỏ'
    return `Hết giờ - ${winner} thắng`
  }
  if (status.value === 'checkmate') {
    const winner = gameState.value.turn === 'red' ? 'Đen' : 'Đỏ'
    return `Chiếu hết - ${winner} thắng`
  }
  if (status.value === 'stalemate') return 'Hòa - hết nước đi'
  if (isInCheck(gameState.value, gameState.value.turn))
    return `Đang bị chiếu - lượt ${turnText.value}`
  if (isAiThinking.value) return 'Máy (Đen) đang đi…'
  return `Lượt đi: ${turnText.value}`
})

watch(
  () =>
    [gameState.value.turn, gameMode.value, screen.value, status.value, aiGamePaused.value] as const,
  (_cur, _prev, onCleanup) => {
    if (screen.value !== 'game' || gameMode.value !== 'vs-ai') return
    if (aiGamePaused.value) return
    if (status.value !== 'playing' || timeoutLoser.value) return
    if (gameState.value.turn !== 'black') return

    let cancelled = false
    const id = window.setTimeout(() => {
      void (async () => {
        const snapshot = gameState.value
        if (snapshot.turn !== 'black') return
        const historyLen = snapshot.history.length
        const result = await requestSearch(snapshot)
        if (cancelled) return
        if (screen.value !== 'game' || gameMode.value !== 'vs-ai') return
        if (timeoutLoser.value) return
        if (gameState.value !== snapshot) return
        if (gameState.value.history.length !== historyLen) return
        if (gameState.value.turn !== 'black') return
        if (getGameStatus(gameState.value) !== 'playing') return
        if (!result) return
        gameState.value = makeMove(snapshot, result.move)
        selectedSquare.value = null
      })()
    }, 380)

    onCleanup(() => {
      cancelled = true
      window.clearTimeout(id)
      cancelPendingSearches()
    })
  },
  { flush: 'post' },
)

watch(
  () => gameState.value.history.length,
  (len, prevLen) => {
    if (len < 1) return
    if (prevLen !== undefined && len <= prevLen) return
    const record = gameState.value.history[len - 1]
    if (!record) return
    playForMoveType(record.move.type === 'capture' ? 'capture' : 'move')
    if (screen.value === 'game' && gameMode.value === 'vs-ai') {
      applyIncrementAfterMove()
    }
  },
)

function goMenu() {
  screen.value = 'menu'
  selectedSquare.value = null
  matchClockSettings.value = null
  aiGamePaused.value = false
  cancelPendingSearches()
}

function toggleAiGamePause() {
  if (gameMode.value !== 'vs-ai' || screen.value !== 'game') return
  if (status.value !== 'playing' || timeoutLoser.value) return
  if (aiGamePaused.value) {
    aiGamePaused.value = false
    return
  }
  cancelPendingSearches()
  aiGamePaused.value = true
}

const rulesBackTarget = ref<'menu' | 'game'>('menu')

function openRules(from: 'menu' | 'game' = 'menu') {
  rulesBackTarget.value = from
  screen.value = 'rules'
}

function backFromRules() {
  screen.value = rulesBackTarget.value
}

function startSoloGame() {
  matchClockSettings.value = null
  aiGamePaused.value = false
  gameMode.value = 'solo'
  gameState.value = createInitialState()
  selectedSquare.value = null
  screen.value = 'game'
}

function resetGame() {
  aiGamePaused.value = false
  gameState.value = createInitialState()
  selectedSquare.value = null
  if (gameMode.value === 'vs-ai' && matchClockSettings.value) {
    resetClock()
  }
}

function handleUndo() {
  if (!canUndo.value) return
  cancelPendingSearches()
  const before = gameState.value
  if (before.history.length === 0) return
  const moverToRevert: Side = before.turn === 'red' ? 'black' : 'red'
  const prev = undoLastMove(before)
  if (!prev) return
  gameState.value = prev
  selectedSquare.value = null
  if (gameMode.value === 'vs-ai' && matchClockSettings.value) {
    revertIncrementForMover(moverToRevert)
  }
}

/** Lượt đỏ: accent coral; lượt đen: xám ấm (ô chọn, gợi ý đi). */
const isRedTurn = computed(() => gameState.value.turn === 'red')

function isSquareSelected(row: number, col: number): boolean {
  return selectedSquare.value?.row === row && selectedSquare.value?.col === col
}

function moveTo(row: number, col: number) {
  if (!selectedSquare.value) return
  const candidates = legalMovesFromSelected.value.filter(
    (move) => move.to.row === row && move.to.col === col,
  )
  const move = candidates[0]
  if (!move) return
  gameState.value = makeMove(gameState.value, move)
  selectedSquare.value = null
}

function maybeFlipSelected() {
  if (!selectedSquare.value) return
  const flipMove = legalMovesFromSelected.value.find((move) => move.type === 'flip')
  if (!flipMove) return
  gameState.value = makeMove(gameState.value, flipMove)
  selectedSquare.value = null
}

function handleSquareClick(row: number, col: number) {
  if (status.value !== 'playing' || timeoutLoser.value) return
  if (gameMode.value === 'vs-ai' && aiGamePaused.value) return
  if (isAiThinking.value) return

  const flipUi = eagleFlipUiPlacement.value
  if (flipUi?.kind === 'eagleEdge' && flipUi.row === row && flipUi.col === col) {
    maybeFlipSelected()
    return
  }

  const clickedPiece = pieceAt(row, col)
  if (
    selectedSquare.value &&
    selectedSquare.value.row === row &&
    selectedSquare.value.col === col
  ) {
    selectedSquare.value = null
    return
  }

  if (selectedSquare.value) {
    const canMove = legalMovesFromSelected.value.some(
      (move) => move.to.row === row && move.to.col === col,
    )
    if (canMove) {
      moveTo(row, col)
      return
    }
  }

  if (clickedPiece && clickedPiece.side === gameState.value.turn) {
    selectedSquare.value = { row, col }
    return
  }

  selectedSquare.value = null
}

function isMoveTarget(row: number, col: number): boolean {
  return legalMovesFromSelected.value.some((move) => move.to.row === row && move.to.col === col)
}

/** Ô có quân bị ăn: `captureSquare` (sát thủ: quân nhảy qua; quân khác: trùng `to`). */
function isCaptureTarget(row: number, col: number): boolean {
  return legalMovesFromSelected.value.some((move) => {
    if (move.type !== 'capture') return false
    const victim = move.captureSquare ?? move.to
    return victim.row === row && victim.col === col
  })
}

/** Ô đích trống (chấm giữa — kiểu Chess.com / Lichess, không dùng viền xanh). */
function isEmptyMoveTarget(row: number, col: number): boolean {
  return isMoveTarget(row, col) && !isCaptureTarget(row, col)
}

function pieceAt(row: number, col: number): Piece | null {
  return gameState.value.board[row]?.[col] ?? null
}

function isKingInCheckSquare(row: number, col: number): boolean {
  const k = kingInCheckSquare.value
  return k !== null && k.row === row && k.col === col
}

/** Nước đi vừa xong — tô ô xuất phát / ô đích (giống gợi ý trên các app cờ phổ biến). */
const lastMoveRecord = computed((): MoveRecord | null => {
  const h = gameState.value.history
  if (h.length < 1) return null
  return h[h.length - 1] ?? null
})

function isLastMoveFromSquare(row: number, col: number): boolean {
  const rec = lastMoveRecord.value
  if (!rec) return false
  const { from } = rec.move
  return from.row === row && from.col === col
}

function isLastMoveToSquare(row: number, col: number): boolean {
  const rec = lastMoveRecord.value
  if (!rec) return false
  const { from, to } = rec.move
  if (from.row === to.row && from.col === to.col) return false
  return to.row === row && to.col === col
}

type GameOverInfo =
  | { outcome: 'checkmate'; winner: Side }
  | { outcome: 'timeout'; winner: Side }
  | { outcome: 'stalemate' }

const gameOverInfo = computed((): GameOverInfo | null => {
  if (screen.value !== 'game') return null
  if (timeoutLoser.value) {
    const winner: Side = timeoutLoser.value === 'red' ? 'black' : 'red'
    return { outcome: 'timeout', winner }
  }
  if (status.value === 'checkmate') {
    const winner: Side = gameState.value.turn === 'red' ? 'black' : 'red'
    return { outcome: 'checkmate', winner }
  }
  if (status.value === 'stalemate') {
    return { outcome: 'stalemate' }
  }
  return null
})

const gameResultDismissed = ref(false)

watch(
  () => [status.value, timeoutLoser.value, gameState.value.history.length] as const,
  () => {
    gameResultDismissed.value = false
  },
)

function dismissGameResultModal() {
  gameResultDismissed.value = true
}

function sideLabel(side: Side): string {
  return side === 'red' ? 'Đỏ' : 'Đen'
}

/** Mô tả người thắng: hai người trên máy vs chơi với máy. */
function winnerDescription(winner: Side): string {
  if (gameMode.value !== 'vs-ai') return `Phe ${sideLabel(winner)} thắng.`
  if (winner === 'red') return 'Bạn (phe Đỏ) thắng.'
  return 'Máy (phe Đen) thắng.'
}
</script>

<template>
  <div
    class="min-h-screen bg-bg-deep py-6 text-text-primary sm:py-8"
    :class="screen === 'game' ? 'overflow-x-hidden px-0 sm:px-4' : 'px-3 sm:px-4'"
  >
    <!-- Menu chính -->
    <div
      v-if="screen === 'menu'"
      class="mx-auto flex w-full max-w-lg flex-col gap-8 px-1 py-8 sm:py-16"
    >
      <header class="animate-fade-up text-center">
        <p class="font-display text-xs tracking-[0.2em] text-accent-coral">// vCHESS</p>
        <h1
          class="mt-3 font-display text-3xl font-bold tracking-tight text-text-primary sm:text-4xl"
        >
          Cờ biến thể Việt
        </h1>
        <p class="mx-auto mt-3 max-w-md text-sm text-text-secondary">
          Chọn chế độ để vào bàn. Bạn có thể xem luật đầy đủ trước khi chơi.
        </p>
      </header>

      <nav class="animate-fade-up animate-delay-2 flex flex-col gap-3" aria-label="Chế độ chơi">
        <button
          type="button"
          class="group flex w-full items-center gap-4 border border-border-default bg-bg-surface p-4 text-left transition hover:border-accent-coral hover:bg-bg-elevated"
          @click="openAiSetup"
        >
          <span
            class="flex size-12 shrink-0 items-center justify-center border border-border-default bg-bg-deep text-accent-coral transition group-hover:border-accent-coral/60"
            aria-hidden="true"
          >
            <Icon icon="lucide:bot" class="size-6" />
          </span>
          <span class="min-w-0">
            <span class="font-display text-lg font-semibold text-text-primary">Chơi với máy</span>
            <span class="mt-1 block text-xs text-text-secondary">
              Chọn thời gian đồng hồ rồi bắt đầu — bạn cầm Đỏ, máy cầm Đen.
            </span>
          </span>
        </button>

        <button
          type="button"
          class="group flex w-full items-center gap-4 border border-border-default bg-bg-surface p-4 text-left transition hover:border-accent-amber hover:bg-bg-elevated"
          @click="startSoloGame"
        >
          <span
            class="flex size-12 shrink-0 items-center justify-center border border-border-default bg-bg-deep text-accent-amber transition group-hover:border-accent-amber/60"
            aria-hidden="true"
          >
            <Icon icon="lucide:users" class="size-6" />
          </span>
          <span class="min-w-0">
            <span class="font-display text-lg font-semibold text-text-primary">Chơi một mình</span>
            <span class="mt-1 block text-xs text-text-secondary">
              Hai người luân phiên trên cùng một máy.
            </span>
          </span>
        </button>

        <button
          type="button"
          class="group flex w-full items-center gap-4 border border-border-default bg-bg-surface p-4 text-left transition hover:border-accent-sky hover:bg-bg-elevated"
          @click="openRules('menu')"
        >
          <span
            class="flex size-12 shrink-0 items-center justify-center border border-border-default bg-bg-deep text-accent-sky transition group-hover:border-accent-sky/60"
            aria-hidden="true"
          >
            <Icon icon="lucide:book-open" class="size-6" />
          </span>
          <span class="min-w-0">
            <span class="font-display text-lg font-semibold text-text-primary">Luật chơi</span>
            <span class="mt-1 block text-xs text-text-secondary">
              Tóm tắt luật vChess: bàn, quân, cách thắng thua.
            </span>
          </span>
        </button>
      </nav>

      <div class="animate-fade-up animate-delay-3 flex flex-wrap justify-center gap-2 text-sm">
        <RouterLink
          to="/"
          class="border border-border-default bg-bg-elevated px-4 py-2 text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
        >
          ← Trang chủ vibe.j2team.org
        </RouterLink>
      </div>
    </div>

    <!-- Chuẩn bị ván vs máy: đồng hồ + Bắt đầu -->
    <div
      v-else-if="screen === 'ai-setup'"
      class="mx-auto flex w-full max-w-lg flex-col gap-6 px-1 py-8 sm:py-12"
    >
      <header class="animate-fade-up text-center">
        <p class="font-display text-xs tracking-[0.2em] text-accent-coral">// vCHESS</p>
        <h1
          class="mt-3 font-display text-2xl font-bold tracking-tight text-text-primary sm:text-3xl"
        >
          Chơi với máy
        </h1>
        <p class="mx-auto mt-3 max-w-md text-sm text-text-secondary">
          Đặt đồng hồ Fischer cho ván này, rồi bấm Bắt đầu — đồng hồ chỉ chạy sau khi vào bàn.
        </p>
      </header>

      <div
        class="animate-fade-up animate-delay-2 border border-border-default bg-bg-surface p-5 sm:p-6"
      >
        <p class="font-display text-xs tracking-widest text-accent-amber">// Đồng hồ</p>
        <div class="mt-4 space-y-4">
          <label class="block">
            <span class="mb-1.5 block text-xs text-text-secondary"> Phút ban đầu mỗi bên </span>
            <input
              v-model.number="aiSetupMinutes"
              type="number"
              min="1"
              max="180"
              step="1"
              class="w-full border border-border-default bg-bg-deep px-3 py-2 text-sm text-text-primary"
            />
          </label>
          <label class="block">
            <span class="mb-1.5 block text-xs text-text-secondary">
              Cộng thêm sau mỗi nước (giây)
            </span>
            <input
              v-model.number="aiSetupIncrement"
              type="number"
              min="0"
              max="600"
              step="1"
              class="w-full border border-border-default bg-bg-deep px-3 py-2 text-sm text-text-primary"
            />
          </label>
        </div>
        <p class="mt-4 text-xs text-text-dim">
          Giá trị được lưu làm mặc định cho lần sau (trình duyệt).
        </p>
      </div>

      <div
        class="animate-fade-up animate-delay-3 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center"
      >
        <button
          type="button"
          class="border border-border-default bg-bg-elevated px-5 py-2.5 text-sm text-text-secondary transition hover:border-accent-amber hover:text-text-primary"
          @click="cancelAiSetup"
        >
          Quay lại menu
        </button>
        <button
          type="button"
          class="border border-accent-coral bg-accent-coral/10 px-5 py-2.5 text-sm font-medium text-accent-coral transition hover:bg-accent-coral/20"
          @click="beginVsAiFromSetup"
        >
          Bắt đầu
        </button>
      </div>

      <div class="flex flex-wrap justify-center gap-2 text-sm">
        <RouterLink
          to="/"
          class="border border-border-default bg-bg-elevated px-4 py-2 text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
        >
          ← Trang chủ vibe.j2team.org
        </RouterLink>
      </div>
    </div>

    <!-- Trang luật -->
    <div v-else-if="screen === 'rules'" class="mx-auto w-full max-w-3xl animate-fade-up">
      <div class="mb-6 flex flex-wrap items-center gap-3">
        <button
          type="button"
          class="inline-flex items-center gap-2 border border-border-default bg-bg-elevated px-3 py-2 text-sm text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
          @click="backFromRules"
        >
          <Icon icon="lucide:arrow-left" class="size-4 shrink-0" />
          {{ rulesBackTarget === 'game' ? 'Quay lại bàn cờ' : 'Quay lại menu' }}
        </button>
        <RouterLink
          to="/"
          class="border border-border-default bg-bg-surface px-3 py-2 text-sm text-text-dim transition hover:border-border-default hover:text-text-secondary"
        >
          Trang chủ
        </RouterLink>
      </div>

      <div class="border border-border-default bg-bg-surface p-5 sm:p-6">
        <h2 class="flex items-center gap-2 font-display text-xl font-semibold text-text-primary">
          <span class="text-accent-amber">//</span>
          Luật chơi vChess
        </h2>
        <p class="mt-2 text-xs text-text-dim">
          Bản rút gọn trong app; chi tiết đầy đủ có thể xem thêm trong
          <code class="text-text-secondary">rules.md</code> (repo).
        </p>
        <div class="mt-6 max-h-[min(70vh,40rem)] overflow-y-auto overscroll-contain pr-1">
          <RulesContent />
        </div>
      </div>

      <div class="mt-6 border border-border-default bg-bg-elevated p-4">
        <h3 class="font-display text-sm font-semibold text-text-primary">
          <span class="text-accent-amber">//</span>
          Bộ ảnh quân cờ
        </h3>
        <p class="mt-2 text-xs text-text-secondary">
          Mỗi loại quân có ảnh đỏ/đen; vua dùng vương miện, đại bàng mặt bay dùng
          <code class="text-text-dim">eagle_fly_*</code>.
        </p>
      </div>
    </div>

    <!-- Bàn cờ -->
    <div
      v-else
      class="mx-auto flex w-full max-w-[100rem] flex-col gap-5 lg:flex-row lg:items-start lg:gap-6"
    >
      <!-- Cột trái: điều hướng, PGN, FEN -->
      <aside
        class="animate-fade-up order-3 flex w-full shrink-0 flex-col gap-4 border border-border-default bg-bg-surface p-4 lg:order-none lg:sticky lg:top-6 lg:w-56 xl:w-60"
        aria-label="PGN, FEN và mô tả chế độ"
      >
        <div>
          <p class="font-display text-xs tracking-widest text-accent-coral">// vCHESS</p>
          <h1 class="mt-1 font-display text-xl font-bold leading-tight md:text-2xl">
            Bàn cờ vChess
          </h1>
          <p class="mt-2 text-xs text-text-secondary">
            {{ modeLabel }}. Nhấp quân để xem nước hợp lệ. Đại bàng mặt đất: lật sang mặt bay bằng
            icon trên <strong class="text-text-primary">ô quân đại bàng</strong> hoặc phím
            <kbd
              class="rounded border border-border-default bg-bg-deep px-1 font-mono text-[10px] text-text-secondary"
              >L</kbd
            >
            — không dùng nhấp lại ô quân đại bàng.
          </p>
        </div>
        <div class="border border-border-default bg-bg-deep/40 p-3 text-xs">
          <p class="font-display tracking-wide text-accent-sky">// Xuất / nhập ván (PGN vChess)</p>
          <p class="mt-2 leading-relaxed text-text-dim">
            Gần <strong class="text-text-secondary">FIDE (long algebraic)</strong>: tốt chỉ ô
            <code class="text-text-secondary">e3-e4</code>; quân khác thêm chữ in hoa
            <code class="text-text-secondary">Nd5-f6</code>
            <code class="text-text-secondary">Rd5xd8</code>. Ăn
            <code class="text-text-secondary">x</code>, sát thủ
            <code class="text-text-secondary">a1xb2>c3</code>, lật đại bàng
            <code class="text-text-secondary">Ha1*</code> hoặc
            <code class="text-text-secondary">a1*</code>. Chiếu
            <code class="text-text-secondary">+</code>, chiếu hết
            <code class="text-text-secondary">#</code> (tuỳ chọn).
          </p>
          <div class="mt-3">
            <span class="mb-1 block text-[10px] uppercase tracking-wider text-text-dim">
              Nước đã đi
            </span>
            <div
              class="max-h-32 overflow-y-auto border border-border-default/70 bg-bg-deep px-2 py-1.5 font-mono text-[11px] leading-relaxed text-text-primary"
              role="region"
              aria-label="Các nước đi theo ký hiệu PGN vChess"
            >
              <span v-if="gameState.history.length === 0" class="text-text-dim">
                Chưa có nước.
              </span>
              <span v-else class="whitespace-pre-wrap break-words">{{ pgnMovesLine }}</span>
            </div>
          </div>
          <div class="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              class="inline-flex items-center gap-1.5 border border-border-default bg-bg-elevated px-3 py-1.5 text-text-secondary transition hover:border-accent-sky hover:text-text-primary"
              @click="exportPgnToClipboard"
            >
              <Icon icon="lucide:copy" class="size-4 shrink-0" aria-hidden="true" />
              Sao chép ván
            </button>
          </div>
          <label class="mt-6 block">
            <span class="mb-1 block text-[10px] leading-relaxed text-text-dim">
              Dán hoặc gõ toàn bộ PGN ván cờ vào ô dưới, rồi bấm «Áp dụng ván đã dán» để nhập ván —
              sẽ thay thế ván đang chơi.
            </span>
            <textarea
              v-model="pgnPasteText"
              rows="4"
              class="w-full resize-y border border-border-default bg-bg-deep px-2 py-1.5 font-mono text-[11px] leading-snug text-text-primary placeholder:text-text-dim"
              placeholder='Dán [vChess "1"] và các nước a1-b2 …'
              spellcheck="false"
            />
          </label>
          <button
            type="button"
            class="mt-2 w-full border border-border-default bg-bg-elevated py-2 text-text-secondary transition hover:border-accent-sky hover:text-text-primary"
            @click="applyPgnFromTextarea"
          >
            Áp dụng ván đã dán
          </button>
          <p
            v-if="pgnFeedback"
            class="mt-2 text-sm"
            :class="pgnFeedback.startsWith('Đã ') ? 'text-accent-sky' : 'text-accent-coral'"
          >
            {{ pgnFeedback }}
          </p>
        </div>
        <div class="border border-border-default bg-bg-deep/40 p-3 text-xs">
          <p class="font-display tracking-wide text-accent-amber">// Thế cờ (FEN vChess)</p>
          <p class="mt-2 leading-relaxed text-text-dim">
            11 hàng <code class="text-text-secondary">/</code> (từ hàng
            <code class="text-text-secondary">k</code> xuống
            <code class="text-text-secondary">a</code>), 9 cột/số. Quân:
            <code class="text-text-secondary">RNEGKPA</code> + đại bàng
            <code class="text-text-secondary">H</code>/<code class="text-text-secondary">h</code>
            (đất) / <code class="text-text-secondary">F</code>/<code class="text-text-secondary"
              >f</code
            >
            (bay). Hoa = Đỏ. Sau bàn: <code class="text-text-secondary">r|b</code> lượt,
            <code class="text-text-secondary">0|1</code> quyền vua đi 2 ô (Đỏ, Đen),
            <code class="text-text-secondary">- 0 1</code> giữ chỗ.
          </p>
          <div class="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              class="inline-flex items-center gap-1.5 border border-border-default bg-bg-elevated px-3 py-1.5 text-text-secondary transition hover:border-accent-amber hover:text-text-primary"
              @click="copyFenToClipboard"
            >
              <Icon icon="lucide:braces" class="size-4 shrink-0" aria-hidden="true" />
              Sao chép FEN hiện tại
            </button>
          </div>
          <label class="mt-6 block">
            <span class="mb-1 block text-[10px] uppercase tracking-wider text-text-dim"
              >Đặt / dán FEN</span
            >
            <textarea
              v-model="fenPasteText"
              rows="3"
              class="w-full resize-y border border-border-default bg-bg-deep px-2 py-1.5 font-mono text-[10px] leading-snug text-text-primary placeholder:text-text-dim sm:text-[11px]"
              placeholder="Dán một dòng FEN vChess…"
              spellcheck="false"
            />
          </label>
          <button
            type="button"
            class="mt-2 w-full border border-border-default bg-bg-elevated py-2 text-text-secondary transition hover:border-accent-amber hover:text-text-primary"
            @click="applyFenFromTextarea"
          >
            Áp dụng thế cờ FEN
          </button>
          <p
            v-if="fenFeedback"
            class="mt-2 text-sm"
            :class="fenFeedback.startsWith('Đã ') ? 'text-accent-sky' : 'text-accent-coral'"
          >
            {{ fenFeedback }}
          </p>
        </div>
      </aside>

      <!-- Giữa: avatar + bàn cờ — mobile: bàn full-bleed, không padding/viền khối; từ sm giữ layout cũ. -->
      <section
        class="animate-fade-up animate-delay-2 order-1 min-w-0 flex-1 border-0 bg-bg-surface p-0 sm:border sm:border-border-default sm:p-5 lg:order-none"
        aria-label="Bàn cờ và người chơi"
      >
        <div class="flex w-full flex-col items-stretch gap-3 sm:items-center">
          <div
            class="relative mx-3 flex w-[calc(100%-1.5rem)] max-w-[min(100%,42rem)] items-center gap-3 border border-border-default bg-bg-deep/40 px-3 py-2 transition sm:mx-auto sm:w-full"
            :class="
              highlightBoardTopAvatar
                ? 'ring-1 ring-accent-amber/50 ring-offset-2 ring-offset-bg-surface'
                : ''
            "
          >
            <div
              class="relative z-[1] flex size-12 shrink-0 items-center justify-center rounded-full border border-border-default bg-bg-elevated text-accent-amber"
              aria-hidden="true"
            >
              <Icon
                :icon="gameMode === 'vs-ai' ? 'lucide:bot' : 'lucide:user-round'"
                class="size-7"
              />
            </div>
            <div
              v-if="gameMode === 'vs-ai' && matchClockSettings"
              class="pointer-events-none absolute inset-0 flex items-center justify-center px-14"
            >
              <span
                role="timer"
                aria-live="polite"
                :aria-label="`Đồng hồ Đen: ${formatClock(blackMs)}`"
                class="inline-flex min-w-[5.5rem] items-center justify-center rounded-sm border px-2 py-0.5 font-mono text-base font-semibold tabular-nums"
                :class="
                  status === 'playing' &&
                  !timeoutLoser &&
                  !aiGamePaused &&
                  gameState.turn === 'black'
                    ? 'border-accent-amber/50 bg-bg-elevated text-text-primary ring-1 ring-accent-amber/40'
                    : 'border-border-default bg-bg-elevated/90 text-text-secondary'
                "
              >
                {{ formatClock(blackMs) }}
              </span>
            </div>
            <div
              v-if="gameMode === 'vs-ai' && matchClockSettings"
              class="relative z-[1] ml-auto min-w-0 text-right"
            >
              <p class="font-display text-sm font-semibold text-text-primary">Đen</p>
              <p class="text-xs text-text-dim">
                {{ gameMode === 'vs-ai' ? 'Máy' : 'Hai người — cầm quân phía trên bàn' }}
              </p>
            </div>
            <div v-else class="min-w-0 flex-1 text-left">
              <p class="font-display text-sm font-semibold text-text-primary">Đen</p>
              <p class="text-xs text-text-dim">
                {{ gameMode === 'vs-ai' ? 'Máy' : 'Hai người — cầm quân phía trên bàn' }}
              </p>
            </div>
          </div>

          <div
            ref="boardFitEl"
            class="w-full min-w-0 max-w-full overflow-x-hidden overflow-y-visible"
          >
            <div
              class="vchess-board-root w-full max-w-full overflow-visible border-0 bg-transparent p-0 shadow-none sm:mx-auto sm:w-fit sm:border-4 sm:border-[#3d2e22] sm:bg-[#a08060] sm:p-3 sm:shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]"
              :style="boardRootStyle"
            >
              <div class="mb-1 hidden items-center gap-2 sm:flex">
                <div class="inline-flex w-8 shrink-0" aria-hidden="true" />
                <div class="flex">
                  <span
                    v-for="file in fileLabels"
                    :key="`file-${file}`"
                    class="vchess-board-file inline-flex min-h-4 items-center justify-center text-xs font-display leading-none text-[#3d3428]"
                  >
                    {{ file }}
                  </span>
                </div>
                <div class="inline-flex w-8 shrink-0" aria-hidden="true" />
              </div>

              <div class="flex min-w-0 items-start gap-2">
                <div class="hidden shrink-0 flex-col sm:flex">
                  <span
                    v-for="displayRow in displayRows"
                    :key="`rank-l-${displayRow}`"
                    class="vchess-board-rank inline-flex w-8 items-center justify-center text-xs font-display text-[#3d3428]"
                  >
                    {{ rankLabels[displayRow] }}
                  </span>
                </div>

                <div
                  class="flex min-w-0 flex-1 flex-col items-center overflow-visible border-0 p-0 shadow-none sm:flex-none sm:items-stretch sm:border-2 sm:border-[#e8dcc8] sm:p-1 sm:shadow-[inset_0_0_0_1px_rgba(255,250,240,0.35)]"
                >
                  <div
                    v-for="displayRow in displayRows"
                    :key="`row-${displayRow}`"
                    class="flex overflow-visible max-sm:justify-center sm:justify-start"
                  >
                    <div
                      v-for="col in BOARD_COLS"
                      :key="`cell-wrap-${displayRow}-${col - 1}`"
                      class="relative inline-flex shrink-0"
                    >
                      <button
                        type="button"
                        class="vchess-board-cell relative inline-flex shrink-0 items-center justify-center text-sm font-display transition duration-150"
                        :class="[
                          'border-r border-b border-[#c9a882] bg-[#f5e8d8]',
                          displayRow === BOARD_ROWS - 1 ? 'border-t border-[#c9a882]' : '',
                          col === 1 ? 'border-l border-[#c9a882]' : '',
                          'text-text-primary',
                        ]"
                        :title="positionToCoordinate({ row: displayRow, col: col - 1 })"
                        @click="handleSquareClick(displayRow, col - 1)"
                      >
                        <span
                          v-if="isLastMoveFromSquare(displayRow, col - 1)"
                          class="vchess-last-move-from pointer-events-none absolute inset-0 z-0"
                          aria-hidden="true"
                        />
                        <span
                          v-if="isLastMoveToSquare(displayRow, col - 1)"
                          class="vchess-last-move-to pointer-events-none absolute inset-0 z-0"
                          aria-hidden="true"
                        />
                        <span
                          v-if="isKingInCheckSquare(displayRow, col - 1)"
                          class="vchess-check-cell-overlay pointer-events-none absolute inset-0 z-0"
                          aria-hidden="true"
                        />
                        <span
                          v-if="isSquareSelected(displayRow, col - 1)"
                          class="pointer-events-none absolute inset-0 z-0 transition-opacity duration-200"
                          :class="
                            isRedTurn
                              ? 'bg-gradient-to-br from-accent-coral/25 via-amber-50/20 to-transparent'
                              : 'bg-gradient-to-br from-stone-600/20 via-stone-500/10 to-transparent'
                          "
                          aria-hidden="true"
                        />
                        <span
                          v-if="isEmptyMoveTarget(displayRow, col - 1)"
                          class="pointer-events-none absolute inset-0 z-0"
                          :class="isRedTurn ? 'bg-accent-coral/[0.09]' : 'bg-[#54524e]/[0.12]'"
                          aria-hidden="true"
                        />
                        <span
                          v-if="isEmptyMoveTarget(displayRow, col - 1)"
                          class="pointer-events-none absolute inset-0 z-[1] flex items-center justify-center"
                          aria-hidden="true"
                        >
                          <span
                            class="size-3 rounded-full shadow-[0_1px_2px_rgba(61,46,34,0.2)] ring-2 ring-white/70"
                            :class="isRedTurn ? 'bg-accent-coral/55' : 'bg-[#5c5a56]/75'"
                          />
                        </span>
                        <span
                          v-if="isCaptureTarget(displayRow, col - 1)"
                          class="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-br from-accent-coral/20 via-accent-coral/8 to-transparent"
                          aria-hidden="true"
                        />
                        <template v-if="pieceAt(displayRow, col - 1)">
                          <span
                            class="vchess-board-piece relative z-[2] flex items-center justify-center rounded-[10px] border-[3px] bg-gradient-to-b from-white to-[#f5f1ea] p-1 transition duration-200 ease-out will-change-transform sm:p-1.5"
                            :class="[
                              isSquareSelected(displayRow, col - 1)
                                ? isRedTurn
                                  ? 'scale-[1.06] border-accent-coral/55 [box-shadow:inset_0_1px_0_rgba(255,255,255,0.45),0_8px_22px_rgba(255,107,74,0.26),0_3px_10px_rgba(61,46,34,0.12)]'
                                  : 'scale-[1.06] border-[#6f6a65] [box-shadow:inset_0_1px_0_rgba(255,255,255,0.38),0_8px_22px_rgba(45,45,45,0.24),0_3px_10px_rgba(61,46,34,0.14)]'
                                : isCaptureTarget(displayRow, col - 1)
                                  ? 'scale-[1.04] border-dashed border-accent-coral [box-shadow:inset_0_1px_0_rgba(255,255,255,0.42),0_6px_20px_rgba(255,107,74,0.3),0_2px_6px_rgba(61,46,34,0.09)] ring-2 ring-accent-coral/35 ring-offset-2 ring-offset-[#f5e8d8]'
                                  : 'border-[#b89a78] [box-shadow:0_3px_10px_rgba(61,46,34,0.1),0_1px_2px_rgba(61,46,34,0.05),inset_0_1px_0_rgba(255,255,255,0.85),inset_0_-1px_3px_rgba(61,46,34,0.04)]',
                              isKingInCheckSquare(displayRow, col - 1)
                                ? 'vchess-king-in-check-piece'
                                : '',
                            ]"
                          >
                            <img
                              :src="getPieceImageSrc(pieceAt(displayRow, col - 1)!)"
                              alt=""
                              class="max-h-full max-w-full min-h-0 min-w-0 object-contain drop-shadow-[0_1px_2px_rgba(61,46,34,0.1)]"
                              draggable="false"
                            />
                          </span>
                        </template>
                      </button>
                      <button
                        v-if="
                          eagleFlipUiPlacement?.kind === 'forwardCell' &&
                          eagleFlipUiPlacement.renderRow === displayRow &&
                          eagleFlipUiPlacement.renderCol === col - 1
                        "
                        type="button"
                        class="vchess-eagle-flip-btn absolute top-1/2 left-0 right-0 z-[50] mx-auto flex shrink-0 -translate-y-1/2 items-center justify-center rounded-full border border-accent-amber/85 bg-bg-elevated/95 text-accent-amber shadow-[0_2px_8px_rgba(61,46,34,0.2)] ring-2 ring-accent-amber/35"
                        aria-label="Lật đại bàng sang mặt bay (mặt đất → bay)"
                        @click.stop="maybeFlipSelected"
                      >
                        <Icon
                          icon="lucide:flip-horizontal-2"
                          class="size-[min(1rem,calc(var(--vchess-cell)*0.35))] shrink-0"
                          aria-hidden="true"
                        />
                      </button>
                      <button
                        v-if="
                          eagleFlipUiPlacement?.kind === 'eagleEdge' &&
                          eagleFlipUiPlacement.row === displayRow &&
                          eagleFlipUiPlacement.col === col - 1
                        "
                        type="button"
                        class="vchess-eagle-flip-btn absolute top-1/2 left-0 right-0 z-[50] mx-auto flex shrink-0 -translate-y-1/2 items-center justify-center rounded-full border border-accent-amber/85 bg-bg-elevated/95 text-accent-amber shadow-[0_2px_8px_rgba(61,46,34,0.2)] ring-2 ring-accent-amber/35"
                        aria-label="Lật đại bàng sang mặt bay (mặt đất → bay)"
                        @click.stop="maybeFlipSelected"
                      >
                        <Icon
                          icon="lucide:flip-horizontal-2"
                          class="size-[min(1rem,calc(var(--vchess-cell)*0.35))] shrink-0"
                          aria-hidden="true"
                        />
                      </button>
                    </div>
                  </div>
                </div>

                <div class="hidden shrink-0 flex-col sm:flex" aria-hidden="true">
                  <span
                    v-for="displayRow in displayRows"
                    :key="`rank-r-${displayRow}`"
                    class="vchess-board-rank inline-flex w-8 items-center justify-center text-xs font-display text-[#3d3428]"
                  >
                    {{ rankLabels[displayRow] }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div
            class="relative mx-3 flex w-[calc(100%-1.5rem)] max-w-[min(100%,42rem)] items-center gap-3 border border-border-default bg-bg-deep/40 px-3 py-2 transition sm:mx-auto sm:w-full"
            :class="
              highlightBoardBottomAvatar
                ? 'ring-1 ring-accent-coral/45 ring-offset-2 ring-offset-bg-surface'
                : ''
            "
          >
            <div
              class="relative z-[1] flex size-12 shrink-0 items-center justify-center rounded-full border border-border-default bg-bg-elevated text-accent-coral"
              aria-hidden="true"
            >
              <Icon icon="lucide:user-round" class="size-7" />
            </div>
            <div
              v-if="gameMode === 'vs-ai' && matchClockSettings"
              class="pointer-events-none absolute inset-0 flex items-center justify-center px-14"
            >
              <span
                role="timer"
                aria-live="polite"
                :aria-label="`Đồng hồ Đỏ: ${formatClock(redMs)}`"
                class="inline-flex min-w-[5.5rem] items-center justify-center rounded-sm border px-2 py-0.5 font-mono text-base font-semibold tabular-nums"
                :class="
                  status === 'playing' && !timeoutLoser && !aiGamePaused && gameState.turn === 'red'
                    ? 'border-accent-coral/50 bg-bg-elevated text-text-primary ring-1 ring-accent-coral/40'
                    : 'border-border-default bg-bg-elevated/90 text-text-secondary'
                "
              >
                {{ formatClock(redMs) }}
              </span>
            </div>
            <div
              v-if="gameMode === 'vs-ai' && matchClockSettings"
              class="relative z-[1] ml-auto min-w-0 text-right"
            >
              <p class="font-display text-sm font-semibold text-text-primary">Đỏ</p>
              <p class="text-xs text-text-dim">
                {{ gameMode === 'vs-ai' ? 'Bạn' : 'Hai người — cầm quân phía dưới bàn' }}
              </p>
            </div>
            <div v-else class="min-w-0 flex-1 text-left">
              <p class="font-display text-sm font-semibold text-text-primary">Đỏ</p>
              <p class="text-xs text-text-dim">
                {{ gameMode === 'vs-ai' ? 'Bạn' : 'Hai người — cầm quân phía dưới bàn' }}
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- Cột phải: thao tác + lượt + đồng hồ + luật -->
      <aside
        class="animate-fade-up animate-delay-2 order-2 flex w-full shrink-0 flex-col gap-4 border border-border-default bg-bg-surface p-4 lg:order-none lg:sticky lg:top-6 lg:animate-delay-3 lg:w-72 xl:w-80"
        aria-label="Thao tác, lượt đi, đồng hồ và luật"
      >
        <div class="border border-border-default bg-bg-elevated p-3">
          <p class="font-display text-xs tracking-widest text-accent-coral">// Thao tác</p>
          <div class="mt-3 flex flex-wrap gap-2 text-sm">
            <RouterLink
              to="/"
              class="border border-border-default bg-bg-deep px-3 py-1.5 text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
            >
              ← Trang chủ
            </RouterLink>
            <button
              type="button"
              class="inline-flex items-center gap-1.5 border border-border-default bg-bg-deep px-3 py-1.5 text-text-secondary transition hover:border-accent-amber hover:text-text-primary"
              @click="goMenu"
            >
              <Icon icon="lucide:menu" class="size-4 shrink-0" aria-hidden="true" />
              Menu
            </button>
            <button
              type="button"
              class="inline-flex items-center gap-1.5 border border-border-default bg-bg-deep px-3 py-1.5 text-text-secondary transition hover:border-accent-amber hover:text-text-primary"
              @click="resetGame"
            >
              <Icon icon="lucide:rotate-ccw" class="size-4 shrink-0" aria-hidden="true" />
              Chơi lại
            </button>
            <button
              type="button"
              class="inline-flex items-center gap-1.5 border border-border-default bg-bg-deep px-3 py-1.5 text-text-secondary transition hover:border-accent-amber hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-40"
              :disabled="!canUndo"
              @click="handleUndo"
            >
              <Icon icon="lucide:undo-2" class="size-4 shrink-0" aria-hidden="true" />
              Hoàn nước
            </button>
            <button
              v-if="gameMode === 'vs-ai' && status === 'playing' && !timeoutLoser"
              type="button"
              class="inline-flex items-center gap-1.5 border border-border-default bg-bg-deep px-3 py-1.5 text-text-secondary transition hover:border-accent-sky hover:text-text-primary"
              :aria-pressed="aiGamePaused"
              @click="toggleAiGamePause"
            >
              <Icon
                :icon="aiGamePaused ? 'lucide:play' : 'lucide:pause'"
                class="size-4 shrink-0"
                aria-hidden="true"
              />
              {{ aiGamePaused ? 'Tiếp tục' : 'Tạm dừng' }}
            </button>
          </div>
        </div>

        <div class="border border-border-default bg-bg-elevated p-3">
          <p class="font-display text-xs tracking-widest text-accent-amber">// Lượt đi</p>
          <p class="mt-2 text-sm font-medium text-text-primary">{{ headline }}</p>
        </div>

        <div
          v-if="gameMode === 'vs-ai' && matchClockSettings"
          class="border border-border-default bg-bg-deep/40 p-3 text-xs"
        >
          <p class="font-display tracking-wide text-accent-sky">// Đồng hồ (Fischer)</p>
          <p class="mt-2 text-text-dim">
            Thời gian hiển thị giữa thanh bàn cờ: Đen (trên, máy), Đỏ (dưới, bạn).
          </p>
          <p class="mt-2 text-text-dim">
            Mỗi bên: {{ initialMinutesForClock }} phút ban đầu, +{{ incrementSecondsForClock }}s mỗi
            nước.
          </p>
          <p class="mt-3 text-text-dim">
            Muốn đổi: Menu → Chơi với máy để tạo ván mới với thời gian khác.
          </p>
        </div>
        <div
          v-else
          class="border border-dashed border-border-default bg-bg-deep/40 p-3 text-xs text-text-dim"
        >
          <p class="font-display tracking-wide text-text-secondary">// Đồng hồ</p>
          <p class="mt-1">Chỉ bật khi chơi với máy. Chế độ hai người không dùng đồng hồ.</p>
        </div>

        <div class="border border-border-default bg-bg-elevated p-3">
          <p class="font-display text-xs tracking-widest text-accent-amber">// Luật nhanh</p>
          <p class="mt-2 text-xs leading-relaxed text-text-secondary">
            Lưới 9×11; <strong class="text-text-primary">Đỏ</strong> đi trước. Không để vua bị
            chiếu; chiếu hết / stalemate như cờ vua. Đại bàng mặt đất: nhấp icon trên
            <strong class="text-text-primary">ô quân đại bàng</strong> hoặc phím
            <kbd class="rounded border border-border-default bg-bg-deep px-1 font-mono text-[10px]"
              >L</kbd
            >
            khi đã chọn quân.
          </p>
          <button
            type="button"
            class="mt-3 w-full border border-border-default bg-bg-deep py-2 text-xs font-medium text-accent-sky transition hover:border-accent-sky hover:bg-bg-surface"
            @click="openRules('game')"
          >
            Xem luật đầy đủ
          </button>
        </div>
      </aside>
    </div>

    <Teleport to="body">
      <div
        v-if="screen === 'game' && gameOverInfo && !gameResultDismissed"
        class="fixed inset-0 z-[300] flex items-center justify-center px-4 py-8"
        role="dialog"
        aria-modal="true"
        aria-labelledby="vchess-game-result-title"
      >
        <button
          type="button"
          class="absolute inset-0 border-0 bg-bg-deep/85 backdrop-blur-[2px]"
          aria-label="Đóng"
          @click="dismissGameResultModal"
        />
        <div
          class="relative z-[1] w-full max-w-md border border-border-default bg-bg-surface p-6 shadow-2xl"
          @click.stop
        >
          <template v-if="gameOverInfo.outcome === 'stalemate'">
            <p class="font-display text-xs tracking-[0.2em] text-accent-amber">// Kết quả ván</p>
            <h2
              id="vchess-game-result-title"
              class="mt-3 font-display text-2xl font-bold text-text-primary"
            >
              Hòa cờ
            </h2>
            <p class="mt-3 text-sm leading-relaxed text-text-secondary">
              Hết nước đi hợp lệ nhưng vua không bị chiếu — không bên nào thắng.
            </p>
          </template>
          <template v-else>
            <p class="font-display text-xs tracking-[0.2em] text-accent-coral">// Kết quả ván</p>
            <div class="mt-3 flex items-start gap-3">
              <span
                class="flex size-12 shrink-0 items-center justify-center border border-border-default bg-bg-deep text-accent-coral"
                aria-hidden="true"
              >
                <Icon icon="lucide:trophy" class="size-7" />
              </span>
              <div class="min-w-0 flex-1">
                <h2
                  id="vchess-game-result-title"
                  class="font-display text-2xl font-bold text-text-primary"
                >
                  {{ gameOverInfo.outcome === 'timeout' ? 'Hết giờ' : 'Chiếu hết' }}
                </h2>
                <p class="mt-2 text-lg font-semibold text-accent-coral">
                  {{ winnerDescription(gameOverInfo.winner) }}
                </p>
                <p class="mt-2 text-sm text-text-secondary">
                  {{
                    gameOverInfo.outcome === 'timeout'
                      ? 'Một bên hết thời gian trước.'
                      : 'Vua không thể thoát khỏi chiếu.'
                  }}
                </p>
              </div>
            </div>
          </template>
          <div class="mt-6 flex flex-wrap gap-2">
            <button
              type="button"
              class="inline-flex items-center gap-2 border border-accent-coral bg-accent-coral/10 px-4 py-2.5 text-sm font-medium text-accent-coral transition hover:bg-accent-coral/20"
              @click="resetGame"
            >
              <Icon icon="lucide:rotate-ccw" class="size-4 shrink-0" aria-hidden="true" />
              Chơi lại
            </button>
            <button
              type="button"
              class="border border-border-default bg-bg-deep px-4 py-2.5 text-sm text-text-secondary transition hover:border-accent-amber hover:text-text-primary"
              @click="dismissGameResultModal"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
/* Ô cờ co theo --vchess-cell (set từ script theo khung boardFitEl). */
.vchess-board-root {
  --vchess-cell: 58px;
}

.vchess-board-file {
  min-width: var(--vchess-cell);
}

.vchess-board-rank {
  min-height: var(--vchess-cell);
  box-sizing: border-box;
}

.vchess-board-cell {
  box-sizing: border-box;
  width: var(--vchess-cell);
  min-width: var(--vchess-cell);
  min-height: var(--vchess-cell);
  height: var(--vchess-cell);
}

.vchess-board-piece {
  width: min(3rem, calc(var(--vchess-cell) * 0.82));
  height: min(3rem, calc(var(--vchess-cell) * 0.82));
  max-width: 100%;
  max-height: 100%;
}

.vchess-eagle-flip-btn {
  width: min(2.25rem, calc(var(--vchess-cell) * 0.58));
  height: min(2.25rem, calc(var(--vchess-cell) * 0.58));
}

/* Nước đi cuối: ô đi (amber) / ô đến (sky) — tách biệt màu với ô chiếu (coral). */
.vchess-last-move-from {
  background: linear-gradient(135deg, rgba(255, 184, 48, 0.38) 0%, rgba(255, 184, 48, 0.14) 100%);
}

.vchess-last-move-to {
  background: linear-gradient(135deg, rgba(56, 189, 248, 0.32) 0%, rgba(56, 189, 248, 0.12) 100%);
}

/* Ô vua bị chiếu — nền + nhấp nháy nhẹ để thu hút chú ý (accent coral). */
.vchess-check-cell-overlay {
  background: linear-gradient(
    145deg,
    rgba(255, 107, 74, 0.28) 0%,
    rgba(255, 107, 74, 0.1) 55%,
    rgba(255, 107, 74, 0.18) 100%
  );
  animation: vchess-check-cell-pulse 1.15s ease-in-out infinite;
}

@keyframes vchess-check-cell-pulse {
  0%,
  100% {
    opacity: 0.75;
  }
  50% {
    opacity: 1;
  }
}

.vchess-king-in-check-piece {
  animation: vchess-king-in-check-glow 1.1s ease-in-out infinite;
}

@keyframes vchess-king-in-check-glow {
  0%,
  100% {
    box-shadow:
      0 0 0 2px rgba(255, 107, 74, 0.55),
      0 0 12px rgba(255, 107, 74, 0.35),
      0 3px 10px rgba(61, 46, 34, 0.1),
      0 1px 2px rgba(61, 46, 34, 0.05),
      inset 0 1px 0 rgba(255, 255, 255, 0.85),
      inset 0 -1px 3px rgba(61, 46, 34, 0.04);
  }
  50% {
    box-shadow:
      0 0 0 3px rgba(255, 107, 74, 0.75),
      0 0 20px rgba(255, 107, 74, 0.48),
      0 3px 10px rgba(61, 46, 34, 0.1),
      0 1px 2px rgba(61, 46, 34, 0.05),
      inset 0 1px 0 rgba(255, 255, 255, 0.85),
      inset 0 -1px 3px rgba(61, 46, 34, 0.04);
  }
}
</style>
