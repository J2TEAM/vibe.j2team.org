import type { Board, Piece, PieceColor, PieceType } from '../types'

export function P(type: PieceType, color: PieceColor): Piece {
  return { type, color }
}

export function initBoard(): Board {
  const B: PieceColor = 'black',
    R: PieceColor = 'red'
  return [
    [
      P('R', B),
      P('H', B),
      P('E', B),
      P('A', B),
      P('K', B),
      P('A', B),
      P('E', B),
      P('H', B),
      P('R', B),
    ],
    Array(9).fill(null),
    [null, P('C', B), null, null, null, null, null, P('C', B), null],
    [P('P', B), null, P('P', B), null, P('P', B), null, P('P', B), null, P('P', B)],
    Array(9).fill(null),
    Array(9).fill(null),
    [P('P', R), null, P('P', R), null, P('P', R), null, P('P', R), null, P('P', R)],
    [null, P('C', R), null, null, null, null, null, P('C', R), null],
    Array(9).fill(null),
    [
      P('R', R),
      P('H', R),
      P('E', R),
      P('A', R),
      P('K', R),
      P('A', R),
      P('E', R),
      P('H', R),
      P('R', R),
    ],
  ]
}

export function cloneBoard(b: Board): Board {
  return b.map((row) => row.map((p) => (p ? { ...p } : null)))
}

export function inBounds(r: number, c: number): boolean {
  return r >= 0 && r <= 9 && c >= 0 && c <= 8
}

function inPalace(r: number, c: number, color: PieceColor): boolean {
  return c >= 3 && c <= 5 && (color === 'black' ? r >= 0 && r <= 2 : r >= 7 && r <= 9)
}

function isOwnSide(r: number, color: PieceColor): boolean {
  return color === 'black' ? r >= 0 && r <= 4 : r >= 5 && r <= 9
}

export function getRawMoves(board: Board, r: number, c: number): [number, number][] {
  const piece = board[r]![c]
  if (!piece) return []
  const moves: [number, number][] = []
  const { type, color } = piece
  const enemy = color === 'red' ? 'black' : 'red'

  const canMoveTo = (tr: number, tc: number) => {
    if (!inBounds(tr, tc)) return false
    const target = board[tr]![tc]
    return !target || target.color === enemy
  }

  if (type === 'K') {
    for (const [dr, dc] of [
      [0, 1],
      [0, -1],
      [1, 0],
      [-1, 0],
    ]) {
      const nr = r + dr!,
        nc = c + dc!
      if (inPalace(nr, nc, color) && canMoveTo(nr, nc)) moves.push([nr, nc])
    }
  } else if (type === 'A') {
    for (const [dr, dc] of [
      [1, 1],
      [1, -1],
      [-1, 1],
      [-1, -1],
    ]) {
      const nr = r + dr!,
        nc = c + dc!
      if (inPalace(nr, nc, color) && canMoveTo(nr, nc)) moves.push([nr, nc])
    }
  } else if (type === 'E') {
    for (const [dr, dc] of [
      [2, 2],
      [2, -2],
      [-2, 2],
      [-2, -2],
    ]) {
      const nr = r + dr!,
        nc = c + dc!
      const er = r + dr! / 2,
        ec = c + dc! / 2
      if (inBounds(nr, nc) && isOwnSide(nr, color) && !board[er]![ec] && canMoveTo(nr, nc))
        moves.push([nr, nc])
    }
  } else if (type === 'H') {
    const legs: [number, number, number, number][] = [
      [-1, 0, -2, -1],
      [-1, 0, -2, 1],
      [1, 0, 2, -1],
      [1, 0, 2, 1],
      [0, -1, -1, -2],
      [0, -1, 1, -2],
      [0, 1, -1, 2],
      [0, 1, 1, 2],
    ]
    for (const [lr, lc, dr, dc] of legs) {
      const legR = r + lr!,
        legC = c + lc!,
        nr = r + dr!,
        nc = c + dc!
      if (inBounds(nr, nc) && !board[legR]?.[legC] && canMoveTo(nr, nc)) moves.push([nr, nc])
    }
  } else if (type === 'R') {
    for (const [dr, dc] of [
      [0, 1],
      [0, -1],
      [1, 0],
      [-1, 0],
    ]) {
      let nr = r + dr!,
        nc = c + dc!
      while (inBounds(nr, nc)) {
        if (!board[nr]![nc]) {
          moves.push([nr, nc])
        } else {
          if (board[nr]![nc]!.color === enemy) moves.push([nr, nc])
          break
        }
        nr += dr!
        nc += dc!
      }
    }
  } else if (type === 'C') {
    for (const [dr, dc] of [
      [0, 1],
      [0, -1],
      [1, 0],
      [-1, 0],
    ]) {
      let nr = r + dr!,
        nc = c + dc!
      let jumped = false
      while (inBounds(nr, nc)) {
        if (!jumped) {
          if (!board[nr]![nc]) moves.push([nr, nc])
          else jumped = true
        } else {
          if (board[nr]![nc]) {
            if (board[nr]![nc]!.color === enemy) moves.push([nr, nc])
            break
          }
        }
        nr += dr!
        nc += dc!
      }
    }
  } else if (type === 'P') {
    const forward = color === 'red' ? -1 : 1
    const crossed = color === 'red' ? r <= 4 : r >= 5
    if (canMoveTo(r + forward, c)) moves.push([r + forward, c])
    if (crossed) {
      if (canMoveTo(r, c - 1)) moves.push([r, c - 1])
      if (canMoveTo(r, c + 1)) moves.push([r, c + 1])
    }
  }
  return moves
}

export function findKing(board: Board, color: PieceColor): [number, number] | null {
  for (let r = 0; r < 10; r++)
    for (let c = 0; c < 9; c++)
      if (board[r]![c]?.type === 'K' && board[r]![c]?.color === color) return [r, c]
  return null
}

export function isKingFacing(board: Board): boolean {
  const rk = findKing(board, 'red'),
    bk = findKing(board, 'black')
  if (!rk || !bk || rk[1] !== bk[1]) return false
  for (let r = Math.min(rk[0], bk[0]) + 1; r < Math.max(rk[0], bk[0]); r++)
    if (board[r]![rk[1]]) return false
  return true
}

export function isInCheck(board: Board, color: PieceColor): boolean {
  const king = findKing(board, color)
  if (!king) return true
  const enemy = color === 'red' ? 'black' : 'red'
  for (let r = 0; r < 10; r++)
    for (let c = 0; c < 9; c++) {
      if (board[r]![c]?.color === enemy) {
        const moves = getRawMoves(board, r, c)
        if (moves.some(([mr, mc]) => mr === king[0] && mc === king[1])) return true
      }
    }
  return false
}

export function getLegalMoves(board: Board, r: number, c: number): [number, number][] {
  const piece = board[r]![c]
  if (!piece) return []
  return getRawMoves(board, r, c).filter(([tr, tc]) => {
    const test = cloneBoard(board)
    test[tr]![tc] = test[r]![c] ?? null
    test[r]![c] = null
    return !isInCheck(test, piece.color) && !isKingFacing(test)
  })
}

export function isCheckmate(board: Board, color: PieceColor): boolean {
  for (let r = 0; r < 10; r++)
    for (let c = 0; c < 9; c++)
      if (board[r]![c]?.color === color && getLegalMoves(board, r, c).length > 0) return false
  return true
}
