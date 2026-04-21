import {
  computeHash,
  zobristKingTwoBlack,
  zobristKingTwoRed,
  zobristPieceKey,
  zobristSideToMove,
} from './vchess-zobrist'

export const BOARD_ROWS = 11
export const BOARD_COLS = 9

/** Mailbox 11×15: 2 hàng `x` trên + 11 hàng chơi + 2 dưới; mỗi hàng `x` + 9 ô + `x`. */
export const MAILBOX_WIDTH = 11
export const MAILBOX_HEIGHT = 15
export const MAIL_SIZE = MAILBOX_WIDTH * MAILBOX_HEIGHT

const RANK_PAD = 2
const FILE_PAD = 1

export type Side = 'red' | 'black'
export type PieceKind =
  | 'rook'
  | 'knight'
  | 'elephant'
  | 'gunner'
  | 'king'
  | 'pawn'
  | 'assassin'
  | 'eagle'
export type EagleMode = 'ground' | 'flying'

export interface Piece {
  side: Side
  kind: PieceKind
  eagleMode?: EagleMode
}

export interface Position {
  row: number
  col: number
}

export interface Move {
  from: Position
  to: Position
  type: 'move' | 'capture' | 'flip'
  captureSquare?: Position
}

export interface MoveRecord {
  move: Move
  movedPiece: Piece
  capturedPiece: Piece | null
  kingTwoStepAvailableBefore: Record<Side, boolean>
}

export interface VChessState {
  /** Mảng một chiều 165 ô; chỉ các ô chơi được gán quân (off-board bỏ qua). */
  mailbox: (Piece | null)[]
  /** Bản 2D đồng bộ với `mailbox` — dùng UI / FEN. */
  board: (Piece | null)[][]
  turn: Side
  kingTwoStepAvailable: Record<Side, boolean>
  history: MoveRecord[]
  /** Chỉ số mailbox của vua; `-1` nếu không có. */
  kingSq: Record<Side, number>
  /** Zobrist hash — cập nhật incremental khi apply/unapply. */
  hash: bigint
}

const FILES = ['1', '2', '3', '4', '5', '6', '7', '8', '9'] as const
const RANKS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k'] as const

/** Bước dọc tia trên mailbox (hàng engine tăng = chỉ số tăng 11). */
const M_NORTH = -MAILBOX_WIDTH
const M_SOUTH = MAILBOX_WIDTH
const M_WEST = -1
const M_EAST = 1
const MAIL_ROOK_DIRS = [M_NORTH, M_SOUTH, M_WEST, M_EAST] as const

function rcToSqInternal(row: number, col: number): number {
  return (row + RANK_PAD) * MAILBOX_WIDTH + (col + FILE_PAD)
}

const M_DIAG_NW = M_NORTH + M_WEST
const M_DIAG_NE = M_NORTH + M_EAST
const M_DIAG_SW = M_SOUTH + M_WEST
const M_DIAG_SE = M_SOUTH + M_EAST

const KNIGHT_MAIL = [
  { leg: M_SOUTH, targets: [M_SOUTH + M_SOUTH + M_EAST, M_SOUTH + M_SOUTH + M_WEST] as const },
  { leg: M_NORTH, targets: [M_NORTH + M_NORTH + M_EAST, M_NORTH + M_NORTH + M_WEST] as const },
  { leg: M_EAST, targets: [M_SOUTH + M_EAST + M_EAST, M_NORTH + M_EAST + M_EAST] as const },
  { leg: M_WEST, targets: [M_SOUTH + M_WEST + M_WEST, M_NORTH + M_WEST + M_WEST] as const },
] as const

/** Reverse knight attack: from target, check diagonal legs then knight positions. */
const KNIGHT_ATTACK_MAP = [
  { leg: M_DIAG_NW, knights: [2 * M_NORTH + M_WEST, M_NORTH + 2 * M_WEST] as const },
  { leg: M_DIAG_NE, knights: [2 * M_NORTH + M_EAST, M_NORTH + 2 * M_EAST] as const },
  { leg: M_DIAG_SW, knights: [2 * M_SOUTH + M_WEST, M_SOUTH + 2 * M_WEST] as const },
  { leg: M_DIAG_SE, knights: [2 * M_SOUTH + M_EAST, M_SOUTH + 2 * M_EAST] as const },
] as const

/** Reverse pawn attack offsets — where an enemy pawn could be to attack targetSq. */
const PAWN_ATK_OFFSETS = {
  red: [M_NORTH, M_DIAG_NE, M_DIAG_NW] as const,
  black: [M_SOUTH, M_DIAG_SE, M_DIAG_SW] as const,
} as const

/** Reverse gunner attack: { pos: offset from target to gunner, leg: offset from target to gunner's front }. */
const GUNNER_ATK_ENTRIES = {
  red: [
    { pos: 2 * M_NORTH + M_EAST, leg: M_NORTH + M_EAST },
    { pos: 2 * M_NORTH, leg: M_NORTH },
    { pos: 2 * M_NORTH + M_WEST, leg: M_NORTH + M_WEST },
  ] as const,
  black: [
    { pos: 2 * M_SOUTH + M_EAST, leg: M_SOUTH + M_EAST },
    { pos: 2 * M_SOUTH, leg: M_SOUTH },
    { pos: 2 * M_SOUTH + M_WEST, leg: M_SOUTH + M_WEST },
  ] as const,
} as const

/** Reverse eagle (ground) attack offsets. */
const EAGLE_ATK_OFFSETS = {
  red: [M_DIAG_NE, M_DIAG_NW] as const,
  black: [M_DIAG_SE, M_DIAG_SW] as const,
} as const

const KING_ALL_DIRS = [
  M_NORTH,
  M_SOUTH,
  M_WEST,
  M_EAST,
  M_DIAG_NW,
  M_DIAG_NE,
  M_DIAG_SW,
  M_DIAG_SE,
] as const

const KING_DIRECTIONS: Position[] = [
  { row: 1, col: 0 },
  { row: -1, col: 0 },
  { row: 0, col: 1 },
  { row: 0, col: -1 },
  { row: 1, col: 1 },
  { row: 1, col: -1 },
  { row: -1, col: 1 },
  { row: -1, col: -1 },
]

/** Các ô chơi theo chỉ số mailbox (99 phần tử). */
const PLAYABLE_SQ: readonly number[] = (() => {
  const list: number[] = []
  for (let row = 0; row < BOARD_ROWS; row++) {
    for (let col = 0; col < BOARD_COLS; col++) {
      list.push(rcToSqInternal(row, col))
    }
  }
  return list
})()

export function rcToMailboxSq(row: number, col: number): number {
  return rcToSqInternal(row, col)
}

export function mailboxSqToRc(sq: number): Position {
  return {
    row: Math.floor(sq / MAILBOX_WIDTH) - RANK_PAD,
    col: (sq % MAILBOX_WIDTH) - FILE_PAD,
  }
}

export function isPlayableMailboxSq(sq: number): boolean {
  const r = (sq / MAILBOX_WIDTH) | 0
  const c = sq % MAILBOX_WIDTH
  return r >= RANK_PAD && r < RANK_PAD + BOARD_ROWS && c >= FILE_PAD && c < FILE_PAD + BOARD_COLS
}

const EMPTY_BOARD = () =>
  Array.from({ length: BOARD_ROWS }, () =>
    Array.from({ length: BOARD_COLS }, () => null as Piece | null),
  )

function clonePiece(piece: Piece): Piece {
  return piece.eagleMode ? { ...piece, eagleMode: piece.eagleMode } : { ...piece }
}

/** Đồng bộ `board` với `mailbox` — cùng reference từng ô (lật đại bàng chỉ sửa object trong mailbox). */
function boardFromMailbox(mailbox: (Piece | null)[]): (Piece | null)[][] {
  const board = EMPTY_BOARD()
  for (let row = 0; row < BOARD_ROWS; row++) {
    for (let col = 0; col < BOARD_COLS; col++) {
      board[row]![col] = mailbox[rcToSqInternal(row, col)] ?? null
    }
  }
  return board
}

function clonePosition(position: Position): Position {
  return { row: position.row, col: position.col }
}

function createMajorRow(side: Side): Piece[] {
  return [
    { side, kind: 'rook' },
    { side, kind: 'knight' },
    { side, kind: 'elephant' },
    { side, kind: 'eagle', eagleMode: 'ground' },
    { side, kind: 'king' },
    { side, kind: 'eagle', eagleMode: 'ground' },
    { side, kind: 'elephant' },
    { side, kind: 'knight' },
    { side, kind: 'rook' },
  ]
}

function emptyMailbox(): (Piece | null)[] {
  return Array.from({ length: MAIL_SIZE }, (): Piece | null => null)
}

function pieceAt(state: VChessState, pos: Position): Piece | null {
  if (!isInsideBoard(pos)) return null
  return state.mailbox[rcToSqInternal(pos.row, pos.col)] ?? null
}

function setPieceState(state: VChessState, pos: Position, piece: Piece | null): void {
  if (!isInsideBoard(pos)) return
  const sq = rcToSqInternal(pos.row, pos.col)
  state.mailbox[sq] = piece
  const row = state.board[pos.row]
  if (row) row[pos.col] = piece
}

function recomputeKingSq(state: VChessState): void {
  let red = -1
  let black = -1
  for (const sq of PLAYABLE_SQ) {
    const p = state.mailbox[sq]
    if (p?.kind === 'king') {
      if (p.side === 'red') red = sq
      else black = sq
    }
  }
  state.kingSq.red = red
  state.kingSq.black = black
}

/** Tạo state đầy đủ từ bàn 2D (FEN / nhập liệu). */
export function createStateFromBoard(
  board: (Piece | null)[][],
  turn: Side,
  kingTwoStepAvailable: Record<Side, boolean>,
  history: MoveRecord[] = [],
): VChessState {
  const mailbox = emptyMailbox()
  for (let r = 0; r < BOARD_ROWS; r++) {
    for (let c = 0; c < BOARD_COLS; c++) {
      const p = board[r]?.[c] ?? null
      mailbox[rcToSqInternal(r, c)] = p ? clonePiece(p) : null
    }
  }
  const state: VChessState = {
    mailbox,
    board: boardFromMailbox(mailbox),
    turn,
    kingTwoStepAvailable: { red: kingTwoStepAvailable.red, black: kingTwoStepAvailable.black },
    history: history.map((record) => ({
      move: {
        from: clonePosition(record.move.from),
        to: clonePosition(record.move.to),
        type: record.move.type,
        captureSquare: record.move.captureSquare
          ? clonePosition(record.move.captureSquare)
          : undefined,
      },
      movedPiece: clonePiece(record.movedPiece),
      capturedPiece: record.capturedPiece ? clonePiece(record.capturedPiece) : null,
      kingTwoStepAvailableBefore: {
        red: record.kingTwoStepAvailableBefore.red,
        black: record.kingTwoStepAvailableBefore.black,
      },
    })),
    kingSq: { red: -1, black: -1 },
    hash: 0n,
  }
  recomputeKingSq(state)
  state.hash = computeHash(state)
  return state
}

export function createInitialState(): VChessState {
  const board = EMPTY_BOARD()
  const mailbox = emptyMailbox()
  const state: VChessState = {
    mailbox,
    board,
    turn: 'red',
    kingTwoStepAvailable: { red: true, black: true },
    history: [],
    kingSq: { red: -1, black: -1 },
    hash: 0n,
  }

  const redMajor = createMajorRow('red')
  for (let col = 0; col < BOARD_COLS; col++) {
    const piece = redMajor[col]
    if (piece) setPieceState(state, { row: 0, col }, piece)
  }

  setPieceState(state, { row: 1, col: 2 }, { side: 'red', kind: 'assassin' })
  setPieceState(state, { row: 1, col: 6 }, { side: 'red', kind: 'assassin' })
  setPieceState(state, { row: 2, col: 1 }, { side: 'red', kind: 'gunner' })
  setPieceState(state, { row: 2, col: 7 }, { side: 'red', kind: 'gunner' })
  setPieceState(state, { row: 3, col: 0 }, { side: 'red', kind: 'pawn' })
  setPieceState(state, { row: 3, col: 2 }, { side: 'red', kind: 'pawn' })
  setPieceState(state, { row: 3, col: 4 }, { side: 'red', kind: 'pawn' })
  setPieceState(state, { row: 3, col: 6 }, { side: 'red', kind: 'pawn' })
  setPieceState(state, { row: 3, col: 8 }, { side: 'red', kind: 'pawn' })

  const blackMajor = createMajorRow('black')
  for (let col = 0; col < BOARD_COLS; col++) {
    const piece = blackMajor[col]
    if (piece) setPieceState(state, { row: 10, col }, piece)
  }

  setPieceState(state, { row: 9, col: 2 }, { side: 'black', kind: 'assassin' })
  setPieceState(state, { row: 9, col: 6 }, { side: 'black', kind: 'assassin' })
  setPieceState(state, { row: 8, col: 1 }, { side: 'black', kind: 'gunner' })
  setPieceState(state, { row: 8, col: 7 }, { side: 'black', kind: 'gunner' })
  setPieceState(state, { row: 7, col: 0 }, { side: 'black', kind: 'pawn' })
  setPieceState(state, { row: 7, col: 2 }, { side: 'black', kind: 'pawn' })
  setPieceState(state, { row: 7, col: 4 }, { side: 'black', kind: 'pawn' })
  setPieceState(state, { row: 7, col: 6 }, { side: 'black', kind: 'pawn' })
  setPieceState(state, { row: 7, col: 8 }, { side: 'black', kind: 'pawn' })

  recomputeKingSq(state)
  state.hash = computeHash(state)
  return state
}

export function cloneState(state: VChessState): VChessState {
  const mailbox = state.mailbox.map((p) => (p ? clonePiece(p) : null))
  const next: VChessState = {
    mailbox,
    board: boardFromMailbox(mailbox),
    turn: state.turn,
    kingTwoStepAvailable: {
      red: state.kingTwoStepAvailable.red,
      black: state.kingTwoStepAvailable.black,
    },
    history: state.history.map((record) => ({
      move: {
        from: clonePosition(record.move.from),
        to: clonePosition(record.move.to),
        type: record.move.type,
        captureSquare: record.move.captureSquare
          ? clonePosition(record.move.captureSquare)
          : undefined,
      },
      movedPiece: clonePiece(record.movedPiece),
      capturedPiece: record.capturedPiece ? clonePiece(record.capturedPiece) : null,
      kingTwoStepAvailableBefore: {
        red: record.kingTwoStepAvailableBefore.red,
        black: record.kingTwoStepAvailableBefore.black,
      },
    })),
    kingSq: { red: state.kingSq.red, black: state.kingSq.black },
    hash: state.hash,
  }
  return next
}

export function positionToCoordinate(position: Position): string {
  const rank = RANKS[position.row] ?? '?'
  const file = FILES[position.col] ?? '?'
  return `${rank}${file}`
}

export function coordinateToPosition(coord: string): Position | null {
  const c = coord.trim().toLowerCase()
  if (c.length < 2) return null
  const rankChar = c[0]
  const filePart = c.slice(1)
  const row = RANKS.indexOf(rankChar as (typeof RANKS)[number])
  const col = FILES.indexOf(filePart as (typeof FILES)[number])
  if (row < 0 || col < 0) return null
  return { row, col }
}

export function isInsideBoard(position: Position): boolean {
  return (
    position.row >= 0 && position.row < BOARD_ROWS && position.col >= 0 && position.col < BOARD_COLS
  )
}

function forwardDelta(side: Side): number {
  return side === 'red' ? 1 : -1
}

function isAlly(piece: Piece | null, side: Side): boolean {
  return piece !== null && piece.side === side
}

function pushMoveIfValid(
  state: VChessState,
  side: Side,
  from: Position,
  to: Position,
  moves: Move[],
): void {
  if (!isInsideBoard(to)) return
  const target = pieceAt(state, to)
  if (target === null) {
    moves.push({ from, to, type: 'move' })
    return
  }
  if (target.side !== side) {
    moves.push({ from, to, type: 'capture', captureSquare: clonePosition(to) })
  }
}

function generateRookMoves(state: VChessState, piece: Piece, from: Position): Move[] {
  const moves: Move[] = []
  const fromSq = rcToSqInternal(from.row, from.col)
  for (const dir of MAIL_ROOK_DIRS) {
    let sq = fromSq
    while (true) {
      sq += dir
      if (!isPlayableMailboxSq(sq)) break
      const target = state.mailbox[sq] ?? null
      const to = mailboxSqToRc(sq)
      if (target === null) {
        moves.push({ from, to, type: 'move' })
        continue
      }
      if (target.side !== piece.side) {
        moves.push({ from, to, type: 'capture', captureSquare: clonePosition(to) })
      }
      break
    }
  }
  return moves
}

function generateKnightMoves(state: VChessState, piece: Piece, from: Position): Move[] {
  const moves: Move[] = []
  const fromSq = rcToSqInternal(from.row, from.col)
  for (const rule of KNIGHT_MAIL) {
    const legSq = fromSq + rule.leg
    if (!isPlayableMailboxSq(legSq) || state.mailbox[legSq] !== null) continue
    for (const tOff of rule.targets) {
      const tsq = fromSq + tOff
      if (!isPlayableMailboxSq(tsq)) continue
      pushMoveIfValid(state, piece.side, from, mailboxSqToRc(tsq), moves)
    }
  }
  return moves
}

function getPawnTargets(piece: Piece, from: Position): Position[] {
  const dir = forwardDelta(piece.side)
  return [
    { row: from.row + dir, col: from.col },
    { row: from.row + dir, col: from.col - 1 },
    { row: from.row + dir, col: from.col + 1 },
  ]
}

function getGunnerTargets(piece: Piece, from: Position): Position[] {
  const dir = forwardDelta(piece.side)
  return [
    { row: from.row + dir * 2, col: from.col - 1 },
    { row: from.row + dir * 2, col: from.col },
    { row: from.row + dir * 2, col: from.col + 1 },
  ]
}

function generatePawnMoves(state: VChessState, piece: Piece, from: Position): Move[] {
  const moves: Move[] = []
  for (const target of getPawnTargets(piece, from)) {
    pushMoveIfValid(state, piece.side, from, target, moves)
  }
  return moves
}

function generateGunnerMoves(state: VChessState, piece: Piece, from: Position): Move[] {
  const front = { row: from.row + forwardDelta(piece.side), col: from.col }
  if (!isInsideBoard(front) || pieceAt(state, front) !== null) return []
  const moves: Move[] = []
  for (const target of getGunnerTargets(piece, from)) {
    pushMoveIfValid(state, piece.side, from, target, moves)
  }
  return moves
}

function generateElephantMoves(state: VChessState, piece: Piece, from: Position): Move[] {
  const dir = forwardDelta(piece.side)
  const front = { row: from.row + dir, col: from.col }
  const frontPiece = pieceAt(state, front)
  const moves: Move[] = []

  if (isAlly(frontPiece, piece.side)) {
    pushMoveIfValid(state, piece.side, from, { row: from.row + dir, col: from.col - 1 }, moves)
    pushMoveIfValid(state, piece.side, from, { row: from.row + dir, col: from.col + 1 }, moves)
    return moves
  }

  for (const target of getPawnTargets(piece, from)) {
    pushMoveIfValid(state, piece.side, from, target, moves)
  }

  if (frontPiece === null) {
    for (const target of getGunnerTargets(piece, from)) {
      pushMoveIfValid(state, piece.side, from, target, moves)
    }
  }

  return moves
}

function generateKingMoves(state: VChessState, piece: Piece, from: Position): Move[] {
  const moves: Move[] = []
  for (const direction of KING_DIRECTIONS) {
    pushMoveIfValid(
      state,
      piece.side,
      from,
      { row: from.row + direction.row, col: from.col + direction.col },
      moves,
    )
  }

  if (state.kingTwoStepAvailable[piece.side]) {
    for (const direction of KING_DIRECTIONS) {
      const middle = { row: from.row + direction.row, col: from.col + direction.col }
      const destination = { row: from.row + direction.row * 2, col: from.col + direction.col * 2 }
      if (!isInsideBoard(middle) || !isInsideBoard(destination)) continue
      if (pieceAt(state, middle) !== null) continue
      pushMoveIfValid(state, piece.side, from, destination, moves)
    }
  }

  return moves
}

function generateEagleMoves(state: VChessState, piece: Piece, from: Position): Move[] {
  if (piece.eagleMode === 'flying') {
    const moves: Move[] = []
    for (const sq of PLAYABLE_SQ) {
      const to = mailboxSqToRc(sq)
      if (to.row === from.row && to.col === from.col) continue
      if (state.mailbox[sq] === null) {
        moves.push({ from, to, type: 'move' })
      }
    }
    return moves
  }

  const dir = forwardDelta(piece.side)
  const moves: Move[] = []
  pushMoveIfValid(state, piece.side, from, { row: from.row + dir, col: from.col - 1 }, moves)
  pushMoveIfValid(state, piece.side, from, { row: from.row + dir, col: from.col + 1 }, moves)
  moves.push({
    from,
    to: clonePosition(from),
    type: 'flip',
  })
  return moves
}

function generateAssassinMoves(state: VChessState, piece: Piece, from: Position): Move[] {
  const moves: Move[] = []
  const fromSq = rcToSqInternal(from.row, from.col)
  for (const dir of MAIL_ROOK_DIRS) {
    let step = 1
    let firstSq: number | null = null

    while (true) {
      const sq = fromSq + dir * step
      if (!isPlayableMailboxSq(sq)) break
      if (state.mailbox[sq] !== null) {
        firstSq = sq
        break
      }
      step++
    }

    if (firstSq === null) continue

    const firstPos = mailboxSqToRc(firstSq)
    const firstPiece = state.mailbox[firstSq]
    if (firstPiece && firstPiece.side === piece.side) {
      let tail = 1
      while (true) {
        const sq = firstSq + dir * tail
        if (!isPlayableMailboxSq(sq)) break
        const target = state.mailbox[sq]
        if (target === null) {
          moves.push({ from, to: mailboxSqToRc(sq), type: 'move' })
          tail++
          continue
        }
        break
      }
      continue
    }

    if (firstPiece && firstPiece.side !== piece.side) {
      let tail = 1
      while (true) {
        const sq = firstSq + dir * tail
        if (!isPlayableMailboxSq(sq)) break
        const target = state.mailbox[sq]
        if (target === null) {
          moves.push({
            from,
            to: mailboxSqToRc(sq),
            type: 'capture',
            captureSquare: clonePosition(firstPos),
          })
          tail++
          continue
        }
        break
      }
    }
  }
  return moves
}

function piecePseudoMoves(state: VChessState, from: Position): Move[] {
  const piece = pieceAt(state, from)
  if (!piece) return []
  switch (piece.kind) {
    case 'rook':
      return generateRookMoves(state, piece, from)
    case 'knight':
      return generateKnightMoves(state, piece, from)
    case 'elephant':
      return generateElephantMoves(state, piece, from)
    case 'gunner':
      return generateGunnerMoves(state, piece, from)
    case 'king':
      return generateKingMoves(state, piece, from)
    case 'pawn':
      return generatePawnMoves(state, piece, from)
    case 'assassin':
      return generateAssassinMoves(state, piece, from)
    case 'eagle':
      return generateEagleMoves(state, piece, from)
    default:
      return []
  }
}

export function findKing(state: VChessState, side: Side): Position | null {
  const sq = state.kingSq[side]
  if (sq < 0) return null
  return mailboxSqToRc(sq)
}

/** Safe mailbox access — returns null for undefined (off-board sentinel). */
function mbAt(mb: (Piece | null)[], sq: number): Piece | null {
  return mb[sq] ?? null
}

/**
 * Efficient attack detection — looks OUTWARD from target instead of iterating all squares.
 * O(directions) instead of O(99).
 */
function isSquareAttacked(state: VChessState, targetSq: number, bySide: Side): boolean {
  const mb = state.mailbox

  // Rook: orthogonal rays — first piece found on each ray
  for (const d of MAIL_ROOK_DIRS) {
    let sq = targetSq + d
    while (isPlayableMailboxSq(sq)) {
      const p = mbAt(mb, sq)
      if (p !== null) {
        if (p.side === bySide && p.kind === 'rook') return true
        break
      }
      sq += d
    }
  }

  // Knight: check 4 diagonal legs, then 2 knight positions per leg
  for (const { leg, knights } of KNIGHT_ATTACK_MAP) {
    const legSq = targetSq + leg
    if (!isPlayableMailboxSq(legSq) || mbAt(mb, legSq) !== null) continue
    for (const kOff of knights) {
      const kSq = targetSq + kOff
      if (!isPlayableMailboxSq(kSq)) continue
      const p = mbAt(mb, kSq)
      if (p !== null && p.side === bySide && p.kind === 'knight') return true
    }
  }

  // Pawn: check 3 reverse-attack positions
  const pawnOffs = PAWN_ATK_OFFSETS[bySide]
  for (const off of pawnOffs) {
    const sq = targetSq + off
    if (!isPlayableMailboxSq(sq)) continue
    const p = mbAt(mb, sq)
    if (p !== null && p.side === bySide && p.kind === 'pawn') return true
  }

  // Gunner: check 3 positions with front-leg empty
  const gunnerEntries = GUNNER_ATK_ENTRIES[bySide]
  for (const { pos, leg } of gunnerEntries) {
    const gSq = targetSq + pos
    if (!isPlayableMailboxSq(gSq)) continue
    const p = mbAt(mb, gSq)
    if (!p || p.side !== bySide || p.kind !== 'gunner') continue
    const legSq = targetSq + leg
    if (!isPlayableMailboxSq(legSq) || mbAt(mb, legSq) !== null) continue
    return true
  }

  // Elephant — pawn-like attacks (3 positions, same offsets as pawn reverse)
  const eStraightOff = bySide === 'red' ? M_NORTH : M_SOUTH
  for (const off of pawnOffs) {
    const eSq = targetSq + off
    if (!isPlayableMailboxSq(eSq)) continue
    const p = mbAt(mb, eSq)
    if (!p || p.side !== bySide || p.kind !== 'elephant') continue
    if (off === eStraightOff) {
      const tp = mbAt(mb, targetSq)
      if (tp !== null && tp.side === bySide) continue
    }
    return true
  }
  // Elephant — gunner-like attacks (3 positions, front must be empty)
  for (const { pos, leg } of gunnerEntries) {
    const eSq = targetSq + pos
    if (!isPlayableMailboxSq(eSq)) continue
    const p = mbAt(mb, eSq)
    if (!p || p.side !== bySide || p.kind !== 'elephant') continue
    const legSq = targetSq + leg
    if (!isPlayableMailboxSq(legSq) || mbAt(mb, legSq) !== null) continue
    return true
  }

  // King: 8 neighbours + optional 2-step
  for (const d of KING_ALL_DIRS) {
    const sq = targetSq + d
    if (!isPlayableMailboxSq(sq)) continue
    const p = mbAt(mb, sq)
    if (p !== null && p.side === bySide && p.kind === 'king') return true
  }
  if (state.kingTwoStepAvailable[bySide]) {
    for (const d of KING_ALL_DIRS) {
      const midSq = targetSq + d
      if (!isPlayableMailboxSq(midSq) || mbAt(mb, midSq) !== null) continue
      const kSq = targetSq + 2 * d
      if (!isPlayableMailboxSq(kSq)) continue
      const p = mbAt(mb, kSq)
      if (p !== null && p.side === bySide && p.kind === 'king') return true
    }
  }

  // Eagle (ground): 2 diagonal-forward positions
  const eagleOffs = EAGLE_ATK_OFFSETS[bySide]
  for (const off of eagleOffs) {
    const sq = targetSq + off
    if (!isPlayableMailboxSq(sq)) continue
    const p = mbAt(mb, sq)
    if (p !== null && p.side === bySide && p.kind === 'eagle' && p.eagleMode !== 'flying')
      return true
  }

  // Assassin: for each direction, check behind target is empty, then scan opposite for assassin
  for (const d of MAIL_ROOK_DIRS) {
    const behindSq = targetSq + d
    if (!isPlayableMailboxSq(behindSq) || mbAt(mb, behindSq) !== null) continue
    let sq = targetSq - d
    while (isPlayableMailboxSq(sq)) {
      const p = mbAt(mb, sq)
      if (p !== null) {
        if (p.side === bySide && p.kind === 'assassin') return true
        break
      }
      sq -= d
    }
  }

  return false
}

function isSquareAttackedAtPosition(state: VChessState, square: Position, bySide: Side): boolean {
  if (!isInsideBoard(square)) return false
  return isSquareAttacked(state, rcToSqInternal(square.row, square.col), bySide)
}

function applyMoveUnsafe(state: VChessState, move: Move): MoveRecord | null {
  const movingPiece = pieceAt(state, move.from)
  if (!movingPiece) return null
  const movedPieceBefore = clonePiece(movingPiece)
  const kingTwoStepAvailableBefore: Record<Side, boolean> = {
    red: state.kingTwoStepAvailable.red,
    black: state.kingTwoStepAvailable.black,
  }

  let capturedPiece: Piece | null = null
  if (move.type === 'capture' && move.captureSquare) {
    capturedPiece = pieceAt(state, move.captureSquare)
    if (capturedPiece) {
      state.hash ^= zobristPieceKey(capturedPiece, move.captureSquare.row, move.captureSquare.col)
      if (capturedPiece.kind === 'king') state.kingSq[capturedPiece.side] = -1
    }
    setPieceState(state, move.captureSquare, null)
  }

  if (move.type === 'flip') {
    if (movingPiece.kind !== 'eagle' || movingPiece.eagleMode === 'flying') return null
    state.hash ^= zobristPieceKey(movingPiece, move.from.row, move.from.col)
    movingPiece.eagleMode = 'flying'
    state.hash ^= zobristPieceKey(movingPiece, move.from.row, move.from.col)
  } else {
    state.hash ^= zobristPieceKey(movedPieceBefore, move.from.row, move.from.col)
    setPieceState(state, move.from, null)
    const pieceAfterMove = clonePiece(movingPiece)
    if (pieceAfterMove.kind === 'eagle' && pieceAfterMove.eagleMode === 'flying') {
      pieceAfterMove.eagleMode = 'ground'
    }
    setPieceState(state, move.to, pieceAfterMove)
    state.hash ^= zobristPieceKey(pieceAfterMove, move.to.row, move.to.col)

    if (movedPieceBefore.kind === 'king') {
      state.kingSq[movedPieceBefore.side] = rcToSqInternal(move.to.row, move.to.col)
      if (state.kingTwoStepAvailable[movedPieceBefore.side]) {
        state.hash ^= movedPieceBefore.side === 'red' ? zobristKingTwoRed : zobristKingTwoBlack
        state.kingTwoStepAvailable[movedPieceBefore.side] = false
      }
    }
  }

  state.hash ^= zobristSideToMove

  return {
    move: {
      from: clonePosition(move.from),
      to: clonePosition(move.to),
      type: move.type,
      captureSquare: move.captureSquare ? clonePosition(move.captureSquare) : undefined,
    },
    movedPiece: movedPieceBefore,
    capturedPiece: capturedPiece ? clonePiece(capturedPiece) : null,
    kingTwoStepAvailableBefore,
  }
}

function unapplyMove(state: VChessState, record: MoveRecord): void {
  const { move, movedPiece, capturedPiece, kingTwoStepAvailableBefore } = record

  state.hash ^= zobristSideToMove

  if (move.type === 'flip') {
    const p = pieceAt(state, move.from)
    if (p?.kind === 'eagle') {
      state.hash ^= zobristPieceKey(p, move.from.row, move.from.col)
      p.eagleMode = 'ground'
      state.hash ^= zobristPieceKey(p, move.from.row, move.from.col)
    }
  } else {
    const landed = pieceAt(state, move.to)
    if (landed) state.hash ^= zobristPieceKey(landed, move.to.row, move.to.col)
    setPieceState(state, move.to, null)

    const restored = clonePiece(movedPiece)
    setPieceState(state, move.from, restored)
    state.hash ^= zobristPieceKey(restored, move.from.row, move.from.col)

    if (move.type === 'capture' && capturedPiece && move.captureSquare) {
      const cap = clonePiece(capturedPiece)
      setPieceState(state, move.captureSquare, cap)
      state.hash ^= zobristPieceKey(cap, move.captureSquare.row, move.captureSquare.col)
      if (cap.kind === 'king') {
        state.kingSq[cap.side] = rcToSqInternal(move.captureSquare.row, move.captureSquare.col)
      }
    }

    if (movedPiece.kind === 'king') {
      state.kingSq[movedPiece.side] = rcToSqInternal(move.from.row, move.from.col)
    }
  }

  const wasRedAvail = state.kingTwoStepAvailable.red
  const wasBlackAvail = state.kingTwoStepAvailable.black
  state.kingTwoStepAvailable.red = kingTwoStepAvailableBefore.red
  state.kingTwoStepAvailable.black = kingTwoStepAvailableBefore.black
  if (wasRedAvail !== state.kingTwoStepAvailable.red) state.hash ^= zobristKingTwoRed
  if (wasBlackAvail !== state.kingTwoStepAvailable.black) state.hash ^= zobristKingTwoBlack
  state.turn = movedPiece.side
}

function getKingTwoStepMiddle(from: Position, to: Position): Position | null {
  const rowDiff = Math.abs(from.row - to.row)
  const colDiff = Math.abs(from.col - to.col)
  if (rowDiff > 2 || colDiff > 2) return null
  if (Math.max(rowDiff, colDiff) !== 2) return null
  if (!(rowDiff === 0 || colDiff === 0 || rowDiff === colDiff)) return null
  const rowStep = to.row > from.row ? 1 : to.row < from.row ? -1 : 0
  const colStep = to.col > from.col ? 1 : to.col < from.col ? -1 : 0
  const middle = { row: from.row + rowStep, col: from.col + colStep }
  if (!isInsideBoard(middle)) return null
  return middle
}

/** Ô trung gian nước vua 2 ô không được đi qua khi đang bị chiếu. */
function passesKingTwoStepMiddleGuard(state: VChessState, move: Move): boolean {
  const movingPiece = pieceAt(state, move.from)
  if (!movingPiece) return false
  const enemy = state.turn === 'red' ? 'black' : 'red'
  if (movingPiece.kind === 'king' && state.kingTwoStepAvailable[movingPiece.side]) {
    const middle = getKingTwoStepMiddle(move.from, move.to)
    if (middle !== null && pieceAt(state, middle) === null) {
      if (isSquareAttackedAtPosition(state, middle, enemy)) return false
    }
  }
  return true
}

/** Sau khi đã `applyMoveUnsafe`, vua của phe `side` (đang đến lượt trước khi flip turn) có an toàn không. */
function isKingSafeForMover(state: VChessState, mover: Side): boolean {
  const ks = state.kingSq[mover]
  if (ks < 0) return false
  const enemy = mover === 'red' ? 'black' : 'red'
  return !isSquareAttacked(state, ks, enemy)
}

function isMoveLegal(state: VChessState, move: Move): boolean {
  if (!passesKingTwoStepMiddleGuard(state, move)) return false
  const record = applyMoveUnsafe(state, move)
  if (!record) return false
  const mover = state.turn
  const ok = isKingSafeForMover(state, mover)
  unapplyMove(state, record)
  return ok
}

export function getLegalMovesForSquare(state: VChessState, from: Position): Move[] {
  const piece = pieceAt(state, from)
  if (!piece || piece.side !== state.turn) return []
  return piecePseudoMoves(state, from).filter((move) => isMoveLegal(state, move))
}

export function getAllLegalMoves(state: VChessState): Move[] {
  const moves: Move[] = []
  for (const sq of PLAYABLE_SQ) {
    const piece = state.mailbox[sq]
    if (piece?.side !== state.turn) continue
    moves.push(...getLegalMovesForSquare(state, mailboxSqToRc(sq)))
  }
  return moves
}

export function movesEqual(a: Move, b: Move): boolean {
  return (
    a.from.row === b.from.row &&
    a.from.col === b.from.col &&
    a.to.row === b.to.row &&
    a.to.col === b.to.col &&
    a.type === b.type &&
    (a.captureSquare?.row ?? -1) === (b.captureSquare?.row ?? -1) &&
    (a.captureSquare?.col ?? -1) === (b.captureSquare?.col ?? -1)
  )
}

export function getLegalCaptures(state: VChessState): Move[] {
  return getAllLegalMoves(state).filter((m) => m.type === 'capture')
}

export function tryPushMove(state: VChessState, move: Move): boolean {
  const piece = pieceAt(state, move.from)
  if (!piece || piece.side !== state.turn) return false
  const candidate = piecePseudoMoves(state, move.from).find((m) => movesEqual(m, move))
  if (!candidate) return false
  if (!passesKingTwoStepMiddleGuard(state, candidate)) return false
  const record = applyMoveUnsafe(state, candidate)
  if (!record) return false
  const mover = state.turn
  if (!isKingSafeForMover(state, mover)) {
    unapplyMove(state, record)
    return false
  }
  state.history.push(record)
  state.turn = state.turn === 'red' ? 'black' : 'red'
  return true
}

export function popMove(state: VChessState): void {
  const record = state.history.pop()
  if (!record) throw new Error('popMove: empty history')
  unapplyMove(state, record)
}

export function makeMove(state: VChessState, move: Move): VChessState {
  const legalMoves = getLegalMovesForSquare(state, move.from)
  const candidate = legalMoves.find(
    (legalMove) =>
      legalMove.from.row === move.from.row &&
      legalMove.from.col === move.from.col &&
      legalMove.to.row === move.to.row &&
      legalMove.to.col === move.to.col &&
      legalMove.type === move.type &&
      (legalMove.captureSquare?.row ?? -1) === (move.captureSquare?.row ?? -1) &&
      (legalMove.captureSquare?.col ?? -1) === (move.captureSquare?.col ?? -1),
  )

  if (!candidate) return state

  const nextState = cloneState(state)
  const record = applyMoveUnsafe(nextState, candidate)
  if (!record) return state

  nextState.history.push(record)
  nextState.turn = state.turn === 'red' ? 'black' : 'red'
  return nextState
}

export function undoLastMove(state: VChessState): VChessState | null {
  if (state.history.length === 0) return null
  const trimmed = state.history.slice(0, -1)
  let s = createInitialState()
  for (const rec of trimmed) {
    const next = makeMove(s, rec.move)
    if (next === s) return null
    s = next
  }
  return s
}

export function isInCheck(state: VChessState, side: Side): boolean {
  const ks = state.kingSq[side]
  if (ks < 0) return false
  const enemy = side === 'red' ? 'black' : 'red'
  return isSquareAttacked(state, ks, enemy)
}

export type GameStatus = 'playing' | 'checkmate' | 'stalemate'

export function getGameStatus(state: VChessState): GameStatus {
  const hasMoves = getAllLegalMoves(state).length > 0
  if (hasMoves) return 'playing'
  return isInCheck(state, state.turn) ? 'checkmate' : 'stalemate'
}

/**
 * Lightweight move apply for search — skips pseudo move re-generation and
 * legality re-check since search already got legal moves from getAllLegalMoves.
 */
export function searchPushMove(state: VChessState, move: Move): boolean {
  const record = applyMoveUnsafe(state, move)
  if (!record) return false
  const mover = state.turn
  if (!isKingSafeForMover(state, mover)) {
    unapplyMove(state, record)
    return false
  }
  state.history.push(record)
  state.turn = state.turn === 'red' ? 'black' : 'red'
  return true
}

export function pieceToGlyph(piece: Piece | null): string {
  if (!piece) return ''
  const symbolMap: Record<PieceKind, string> = {
    rook: 'R',
    knight: 'N',
    elephant: 'E',
    gunner: 'G',
    king: 'K',
    pawn: 'P',
    assassin: 'S',
    eagle: piece.eagleMode === 'flying' ? 'F' : 'H',
  }
  const symbol = symbolMap[piece.kind]
  return piece.side === 'red' ? symbol : symbol.toLowerCase()
}
