/**
 * Piece–square tables (PST) cho vChess — cùng ý tưởng với Wukong
 * (đánh giá tĩnh theo loại quân + ô, mirror phe Đen sang hệ quy chiếu Đỏ).
 *
 * Bảng được lưu theo góc nhìn **Đỏ**: hàng 0 = phía sân Đỏ, hàng tăng = tiến lên phía Đen.
 * Quân Đen dùng `orientedCoords`: lật 180° (hàng + cột) rồi tra cùng bảng.
 */

import { BOARD_COLS, BOARD_ROWS, type Piece, type VChessState } from './vchess-engine'

type Grid = number[][]

function makeGrid(fn: (row: number, col: number) => number): Grid {
  return Array.from({ length: BOARD_ROWS }, (_, row) =>
    Array.from({ length: BOARD_COLS }, (_, col) => fn(row, col)),
  )
}

/** Đỏ: (row,col) tuyệt đối; Đen: mirror 180° → cùng “phía trước / trái” như Wukong PST. */
function orientedCoords(side: 'red' | 'black', row: number, col: number): { r: number; c: number } {
  if (side === 'red') return { r: row, c: col }
  return { r: BOARD_ROWS - 1 - row, c: BOARD_COLS - 1 - col }
}

/** Tốt: tiến sâu (hàng lớn) + ưu tiên trục giữa; ô trung tâm bàn mạnh hơn mép. */
const PST_PAWN: Grid = makeGrid((row, col) => {
  const forward = Math.round(row * 3.4)
  const center = Math.round((4 - Math.abs(col - 4)) * 2.8)
  const midBoard = row >= 3 && row <= 8 && col >= 2 && col <= 6 ? 8 : 0
  return forward + center + midBoard
})

/** Mã: ô trung tâm (khoảng e–f, cột 3–5) tốt; mép/cạnh bàn yếu. */
const PST_KNIGHT: Grid = makeGrid((row, col) => {
  const dr = Math.abs(row - 5)
  const dc = Math.abs(col - 4)
  let v = 30 - dr * 3 - dc * 3
  if (dr + dc > 5) v -= 10
  if (row <= 1 || row >= 9 || col <= 0 || col >= 8) v -= 6
  return Math.max(0, v)
})

/** Xe: kiểm soát trục giữa và nửa bàn đối phương; vẫn hữu ích ở hậu phương nhưng kém hơn tiền tuyến. */
const PST_ROOK: Grid = makeGrid((row, col) => {
  const centerFile = 14 - Math.abs(col - 4) * 2
  const forward = row * 2
  const rim = col === 0 || col === 8 ? -4 : 0
  return Math.max(0, centerFile - 8 + forward + rim)
})

/** Tượng: lai tốt + xạ — ưu tiên về phía trước và vùng giữa. */
const PST_ELEPHANT: Grid = makeGrid((row, col) => {
  const forward = Math.round(row * 2.2)
  const center = (4 - Math.abs(col - 4)) * 2
  return forward + center
})

/** Xạ thủ: đứng giữa bàn để có nhiều tuyến; tránh góc. */
const PST_GUNNER: Grid = makeGrid((row, col) => {
  const dr = Math.abs(row - 5)
  const dc = Math.abs(col - 4)
  let v = 22 - dr * 2 - dc * 2
  if (row <= 1 || row >= 9) v -= 6
  return Math.max(0, v)
})

/** Sát thủ: cần tia dài — ưu tiên trung lộ, không quá sát mép. */
const PST_ASSASSIN: Grid = makeGrid((row, col) => {
  const dr = Math.abs(row - 5)
  const dc = Math.abs(col - 4)
  let v = 20 - dr * 2 - dc * 2
  if (col <= 1 || col >= 7) v -= 5
  return Math.max(0, v)
})

/** Đại bàng (mặt đất): hai chéo phía trước — thưởng tiến + trung tâm; bay không tính riêng. */
const PST_EAGLE: Grid = makeGrid((row, col) => {
  const forward = Math.round(row * 2.6)
  const center = Math.round((4 - Math.abs(col - 4)) * 2)
  return forward + center
})

/** Vua: tránh góc/mép nhẹ; khuyến khích an toàn trung tâm (điểm nhỏ so với quân khác). */
const PST_KING: Grid = makeGrid((row, col) => {
  const corner = (row <= 1 || row >= 9) && (col <= 1 || col >= 7) ? -10 : 0
  const center = 12 - Math.abs(row - 5) - Math.abs(col - 4)
  return corner + Math.max(0, center)
})

function pstTableForKind(kind: Piece['kind']): Grid | null {
  switch (kind) {
    case 'pawn':
      return PST_PAWN
    case 'knight':
      return PST_KNIGHT
    case 'rook':
      return PST_ROOK
    case 'elephant':
      return PST_ELEPHANT
    case 'gunner':
      return PST_GUNNER
    case 'assassin':
      return PST_ASSASSIN
    case 'eagle':
      return PST_EAGLE
    case 'king':
      return PST_KING
  }
}

/** Điểm PST của một quân (góc Đỏ đã mirror nếu là Đen). */
export function pstBonusForPiece(piece: Piece, absoluteRow: number, absoluteCol: number): number {
  const { r, c } = orientedCoords(piece.side, absoluteRow, absoluteCol)
  const table = pstTableForKind(piece.kind)
  if (!table) return 0
  return table[r]?.[c] ?? 0
}

/**
 * Chênh lệch điểm vị trí: dương = lợi thế Đỏ (PST + vật chất sau này gộp ở search).
 */
export function positionalDifferenceRedMinusBlack(state: VChessState): number {
  let sum = 0
  for (let row = 0; row < BOARD_ROWS; row++) {
    for (let col = 0; col < BOARD_COLS; col++) {
      const piece = state.board[row]?.[col]
      if (!piece) continue
      const bonus = pstBonusForPiece(piece, row, col)
      sum += piece.side === 'red' ? bonus : -bonus
    }
  }
  return sum
}
