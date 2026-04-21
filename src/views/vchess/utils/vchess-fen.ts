import {
  BOARD_COLS,
  BOARD_ROWS,
  createInitialState,
  createStateFromBoard,
  type Piece,
  type Side,
  type VChessState,
} from '../engine/vchess-engine'

/**
 * FEN vChess — bàn 9×11, hàng trong chuỗi từ **trên xuống** (hàng k → a).
 * Quân: R N E G K P A; đại bàng đất H/h, bay F/f. Hoa = Đỏ, thường = Đen.
 * Phần sau bàn: `r|b` lượt; `0|1` quyền vua đi 2 ô lần đầu (Đỏ rồi Đen); `- 0 1` giữ chỗ (giống FIDE).
 *
 * Ví dụ (một dòng): `.../... r 1 1 - 0 1`
 */

function pieceToFenChar(piece: Piece): string {
  const upper = piece.side === 'red'
  let ch: string
  switch (piece.kind) {
    case 'rook':
      ch = 'R'
      break
    case 'knight':
      ch = 'N'
      break
    case 'elephant':
      ch = 'E'
      break
    case 'gunner':
      ch = 'G'
      break
    case 'king':
      ch = 'K'
      break
    case 'pawn':
      ch = 'P'
      break
    case 'assassin':
      ch = 'A'
      break
    case 'eagle':
      ch = piece.eagleMode === 'flying' ? 'F' : 'H'
      break
  }
  return upper ? ch : ch.toLowerCase()
}

function fenCharToPiece(ch: string): Piece | null {
  const upper = ch === ch.toUpperCase()
  const side: Side = upper ? 'red' : 'black'
  const u = ch.toUpperCase()
  switch (u) {
    case 'R':
      return { side, kind: 'rook' }
    case 'N':
      return { side, kind: 'knight' }
    case 'E':
      return { side, kind: 'elephant' }
    case 'G':
      return { side, kind: 'gunner' }
    case 'K':
      return { side, kind: 'king' }
    case 'P':
      return { side, kind: 'pawn' }
    case 'A':
      return { side, kind: 'assassin' }
    case 'H':
      return { side, kind: 'eagle', eagleMode: 'ground' }
    case 'F':
      return { side, kind: 'eagle', eagleMode: 'flying' }
    default:
      return null
  }
}

function encodeRow(row: (Piece | null)[]): string {
  let s = ''
  let empty = 0
  for (let c = 0; c < BOARD_COLS; c++) {
    const p = row[c]
    if (!p) {
      empty++
      continue
    }
    if (empty > 0) {
      s += String(empty)
      empty = 0
    }
    s += pieceToFenChar(p)
  }
  if (empty > 0) s += String(empty)
  return s
}

function expandRow(rowStr: string): (Piece | null)[] | { error: string } {
  const out: (Piece | null)[] = []
  for (let i = 0; i < rowStr.length; i++) {
    const ch = rowStr[i]
    if (!ch) break
    if (ch >= '1' && ch <= '9') {
      const n = Number.parseInt(ch, 10)
      for (let k = 0; k < n; k++) out.push(null)
    } else {
      const p = fenCharToPiece(ch)
      if (!p) return { error: `Ký tự quân không hợp lệ: "${ch}"` }
      out.push(p)
    }
  }
  if (out.length !== BOARD_COLS) {
    return { error: `Mỗi hàng cần ${BOARD_COLS} ô, có ${out.length}` }
  }
  return out
}

function parseBoardPart(boardStr: string): (Piece | null)[][] | { error: string } {
  const rows = boardStr.split('/')
  if (rows.length !== BOARD_ROWS) {
    return { error: `Cần ${BOARD_ROWS} hàng (cách nhau bởi /), có ${rows.length}` }
  }
  const board: (Piece | null)[][] = Array.from({ length: BOARD_ROWS }, () =>
    Array.from({ length: BOARD_COLS }, () => null as Piece | null),
  )
  for (let fenRank = 0; fenRank < BOARD_ROWS; fenRank++) {
    const boardRow = BOARD_ROWS - 1 - fenRank
    const rowStr = rows[fenRank]
    if (!rowStr) return { error: `Hàng ${fenRank} trống` }
    const cells = expandRow(rowStr)
    if ('error' in cells) return cells
    const row = board[boardRow]
    if (!row) return { error: 'Lỗi bộ nhớ bàn' }
    for (let c = 0; c < BOARD_COLS; c++) {
      row[c] = cells[c] ?? null
    }
  }
  return board
}

function countKings(board: (Piece | null)[][]): { red: number; black: number } {
  let red = 0
  let black = 0
  for (let r = 0; r < BOARD_ROWS; r++) {
    for (let c = 0; c < BOARD_COLS; c++) {
      const p = board[r]?.[c]
      if (p?.kind === 'king') {
        if (p.side === 'red') red++
        else black++
      }
    }
  }
  return { red, black }
}

/** Xuất FEN vChess (một dòng). */
export function serializeVchessFen(state: VChessState): string {
  const rankStrings: string[] = []
  for (let row = BOARD_ROWS - 1; row >= 0; row--) {
    const line = state.board[row]
    rankStrings.push(line ? encodeRow(line) : '9')
  }
  const boardPart = rankStrings.join('/')
  const turn = state.turn === 'red' ? 'r' : 'b'
  const k2r = state.kingTwoStepAvailable.red ? '1' : '0'
  const k2b = state.kingTwoStepAvailable.black ? '1' : '0'
  return `${boardPart} ${turn} ${k2r} ${k2b} - 0 1`
}

/** FEN mặc định = khai cuộc chuẩn (để kiểm tra / mẫu). */
export function defaultStartFen(): string {
  return serializeVchessFen(createInitialState())
}

export function parseVchessFen(input: string): VChessState | { error: string } {
  const trimmed = input.trim()
  if (!trimmed) return { error: 'Chuỗi FEN trống' }

  const spaceIdx = trimmed.search(/\s/)
  let boardStr: string
  let turn: Side = 'red'
  let k2r = true
  let k2b = true

  if (spaceIdx === -1) {
    boardStr = trimmed
  } else {
    boardStr = trimmed.slice(0, spaceIdx).trim()
    const rest = trimmed.slice(spaceIdx).trim().split(/\s+/)
    if (rest.length >= 1 && rest[0]) {
      const t = rest[0].toLowerCase()
      if (t === 'r' || t === 'w') turn = 'red'
      else if (t === 'b') turn = 'black'
      else return { error: `Lượt không hợp lệ: "${rest[0]}" (dùng r hoặc b)` }
    }
    if (rest.length >= 3 && rest[1] && rest[2]) {
      const a = rest[1]
      const b = rest[2]
      if (a === '0' || a === '1') k2r = a === '1'
      if (b === '0' || b === '1') k2b = b === '1'
    }
  }

  const boardResult = parseBoardPart(boardStr)
  if (!Array.isArray(boardResult)) return boardResult
  const board = boardResult
  const kings = countKings(board)
  if (kings.red !== 1 || kings.black !== 1) {
    return {
      error: `Cần đúng một vua Đỏ và một vua Đen (hiện: Đỏ ${kings.red}, Đen ${kings.black}).`,
    }
  }

  return createStateFromBoard(board, turn, { red: k2r, black: k2b }, [])
}
