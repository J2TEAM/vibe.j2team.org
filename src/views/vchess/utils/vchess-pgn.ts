import {
  coordinateToPosition,
  createInitialState,
  getGameStatus,
  getLegalMovesForSquare,
  isInCheck,
  makeMove,
  positionToCoordinate,
  type Move,
  type MoveRecord,
  type Piece,
  type VChessState,
} from '../engine/vchess-engine'

const HEADER_VCHESS = /^\[vChess\s+"(\d+)"\]\s*$/i
const HEADER_MODE = /^\[Mode\s+"([^"]*)"\]\s*$/i

/**
 * Quy ước gần **FIDE long algebraic (LAN)**:
 * - Tốt: chỉ ô `e3-e4` (không ghi P — giống ghi nhanh cờ vua).
 * - Quân khác: một chữ + ô xuất phát + `-` hoặc `x` + ô đích, ví dụ `Nd5-f6`, `Rd5xd8`.
 * - Sát thủ ăn nhảy: `Aa1xb2>c3` (ăn `b2`, xuống `c3`).
 * - Đại bàng lật: `Ha1*` (H mặt đất), `Fa1*` khi đang bay (tùy chọn; có thể chỉ `a1*`).
 * - Chiếu / chiếu hết (tuỳ chọn khi nhập): `+` `#` ở cuối (giống FIDE).
 *
 * Vẫn chấp nhận bản rút gọn **chỉ tọa độ** (`a1-b2`) như trước.
 */

/** Ký hiệu quân (LAN) — tốt = chuỗi rỗng. */
function fidePieceLetter(piece: Piece): string {
  switch (piece.kind) {
    case 'rook':
      return 'R'
    case 'knight':
      return 'N'
    case 'elephant':
      return 'E'
    case 'gunner':
      return 'G'
    case 'king':
      return 'K'
    case 'pawn':
      return ''
    case 'assassin':
      return 'A'
    case 'eagle':
      return piece.eagleMode === 'flying' ? 'F' : 'H'
  }
}

/** Chỉ tọa độ + ký hiệu nước (không chữ quân) — dùng lỗi / tương thích cũ. */
export function serializeMove(move: Move): string {
  const from = positionToCoordinate(move.from)
  if (move.type === 'flip') return `${from}*`
  const to = positionToCoordinate(move.to)
  if (move.type === 'capture' && move.captureSquare) {
    const v = positionToCoordinate(move.captureSquare)
    if (v === to) return `${from}x${to}`
    return `${from}x${v}>${to}`
  }
  return `${from}-${to}`
}

/** Xuất LAN kiểu FIDE: thêm `R` `N` `K`… trước chuỗi tọa độ; tốt không thêm chữ. */
export function serializeMoveRecord(rec: MoveRecord): string {
  const letter = fidePieceLetter(rec.movedPiece)
  const core = serializeMove(rec.move)
  return letter ? `${letter}${core}` : core
}

/**
 * Bỏ `+` `#` (chiếu / chiếu hết) và **một chữ quân in hoa** FIDE ở đầu (`Nd5-f6`).
 * Tốt chỉ tọa độ `e3-e4` — chữ `e` đầu là **hàng** (a–k), không bị nhầm với quân.
 */
function stripNotationDecorators(token: string): string {
  let t = token
    .trim()
    .replace(/[+#]+$/u, '')
    .trim()
  if (/^[RNEGKPAHFP](?=[a-k][1-9])/u.test(t)) {
    t = t.slice(1)
  }
  return t.toLowerCase()
}

function parseMoveToken(token: string): Move | null {
  const t = stripNotationDecorators(token)
  if (!t) return null

  if (t.endsWith('*')) {
    const from = coordinateToPosition(t.slice(0, -1))
    if (!from) return null
    return { from, to: { ...from }, type: 'flip' }
  }

  const assassin = /^([a-k][1-9])x([a-k][1-9])>([a-k][1-9])$/.exec(t)
  if (assassin?.[1] && assassin[2] && assassin[3]) {
    const from = coordinateToPosition(assassin[1])
    const victim = coordinateToPosition(assassin[2])
    const to = coordinateToPosition(assassin[3])
    if (!from || !victim || !to) return null
    return { from, to, type: 'capture', captureSquare: victim }
  }

  const cap = /^([a-k][1-9])x([a-k][1-9])$/.exec(t)
  if (cap?.[1] && cap[2]) {
    const from = coordinateToPosition(cap[1])
    const sq = coordinateToPosition(cap[2])
    if (!from || !sq) return null
    return { from, to: sq, type: 'capture', captureSquare: sq }
  }

  const quiet = /^([a-k][1-9])-([a-k][1-9])$/.exec(t)
  if (quiet?.[1] && quiet[2]) {
    const from = coordinateToPosition(quiet[1])
    const to = coordinateToPosition(quiet[2])
    if (!from || !to) return null
    return { from, to, type: 'move' }
  }

  return null
}

/** Tách token nước đi từ chuỗi (bỏ header PGN, số thứ tự `1.`). */
const SKIP_TOKENS = new Set(['*', '1-0', '0-1', '1/2-1/2', '½-½'])

export function extractMoveTokens(text: string): string[] {
  const lines = text.split(/\r?\n/)
  const tokens: string[] = []
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('%')) continue
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) continue
    const parts = trimmed.split(/\s+/).filter(Boolean)
    for (const p of parts) {
      const cleaned = p.replace(/^\d+\.+\s*/, '').trim()
      if (!cleaned || SKIP_TOKENS.has(cleaned)) continue
      tokens.push(cleaned)
    }
  }
  return tokens
}

export function parseMoveTokens(tokens: string[]): Move[] | { error: string } {
  const moves: Move[] = []
  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i] ?? ''
    const m = parseMoveToken(tok)
    if (!m) {
      return { error: `Không hiểu nước thứ ${i + 1}: "${tok}"` }
    }
    moves.push(m)
  }
  return moves
}

export type VchessPgnMeta = {
  formatVersion: string
  mode: string | null
}

export function parsePgnHeaders(text: string): VchessPgnMeta {
  let formatVersion = '1'
  let mode: string | null = null
  for (const line of text.split(/\r?\n/)) {
    const t = line.trim()
    const v = HEADER_VCHESS.exec(t)
    if (v?.[1]) formatVersion = v[1]
    const m = HEADER_MODE.exec(t)
    if (m?.[1]) mode = m[1]
  }
  return { formatVersion, mode }
}

export function buildPgnDocument(options: { history: MoveRecord[]; mode?: string }): string {
  const lines: string[] = ['[vChess "1"]']
  if (options.mode) lines.push(`[Mode "${options.mode}"]`)
  lines.push('')
  if (options.history.length === 0) lines.push('*')
  else {
    const body = buildPgnBodyWithCheckSuffix(options.history)
    lines.push(body)
  }
  return lines.join('\n')
}

function buildPgnBodyWithCheckSuffix(history: MoveRecord[]): string {
  let s = createInitialState()
  const chunks: string[] = []
  for (const rec of history) {
    const next = makeMove(s, rec.move)
    if (next === s) {
      chunks.push(serializeMoveRecord(rec))
      continue
    }
    s = next
    let suf = ''
    if (getGameStatus(s) === 'checkmate') suf = '#'
    else if (isInCheck(s, s.turn)) suf = '+'
    chunks.push(serializeMoveRecord(rec) + suf)
  }
  return chunks.join(' ')
}

/** Chuỗi nước giống thân PGN khi xuất (LAN + `+` / `#`) — dùng hiển thị danh sách nước. */
export function formatHistoryAsPgnMoveText(history: MoveRecord[]): string {
  return buildPgnBodyWithCheckSuffix(history)
}

function matchLegalMove(state: VChessState, partial: Move): Move | null {
  const candidates = getLegalMovesForSquare(state, partial.from)
  return (
    candidates.find(
      (m) =>
        m.to.row === partial.to.row &&
        m.to.col === partial.to.col &&
        m.type === partial.type &&
        (m.captureSquare?.row ?? -1) === (partial.captureSquare?.row ?? -1) &&
        (m.captureSquare?.col ?? -1) === (partial.captureSquare?.col ?? -1),
    ) ?? null
  )
}

/** Áp dụng lần lượt các nước đã parse (đối chiếu nước hợp lệ trên bàn). */
export function replayParsedMoves(moves: Move[]): VChessState | { error: string } {
  let s = createInitialState()
  for (let i = 0; i < moves.length; i++) {
    const raw = moves[i]
    if (!raw) return { error: `Thiếu nước thứ ${i + 1}` }
    const legal = matchLegalMove(s, raw)
    if (!legal) {
      return {
        error: `Nước ${i + 1} không hợp lệ hoặc không khớp ván: ${serializeMove(raw)}`,
      }
    }
    const next = makeMove(s, legal)
    if (next === s) return { error: `Không áp dụng được nước ${i + 1}` }
    s = next
  }
  return s
}

/** Parse toàn bộ văn bản PGN vChess → trạng thái sau khi chơi các nước. Chỉ header / `*` → ván mới. */
export function importGameFromPgnText(text: string): VChessState | { error: string } {
  const tokens = extractMoveTokens(text)
  if (tokens.length === 0) return createInitialState()
  const parsed = parseMoveTokens(tokens)
  if ('error' in parsed) return parsed
  return replayParsedMoves(parsed)
}
