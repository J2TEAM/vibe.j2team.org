<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { RouterLink } from 'vue-router'

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

type PieceType = 'K' | 'A' | 'E' | 'H' | 'R' | 'C' | 'P'
type PieceColor = 'red' | 'black'
type GameMode = 'menu' | 'local' | 'ai' | 'online-setup' | 'online-play' | 'spectator'
type AiDifficulty = 'medium'
type Turn = 'red' | 'black'
type ConnectionState = 'idle' | 'creating-offer' | 'waiting-answer' | 'joining' | 'connected'

interface Piece { type: PieceType; color: PieceColor }
type Board = (Piece | null)[][]
interface Move { from: [number, number]; to: [number, number]; piece: Piece; captured: Piece | null }

const PIECE_CHAR: Record<PieceType, { red: string; black: string }> = {
  K: { red: '帥', black: '將' }, A: { red: '仕', black: '士' },
  E: { red: '相', black: '象' }, H: { red: '馬', black: '馬' },
  R: { red: '車', black: '車' }, C: { red: '炮', black: '砲' },
  P: { red: '兵', black: '卒' },
}
const PIECE_VN: Record<PieceType, string> = { K: 'Tướng', A: 'Sĩ', E: 'Tượng', H: 'Mã', R: 'Xe', C: 'Pháo', P: 'Tốt' }
const COL_NAMES = ['1', '2', '3', '4', '5', '6', '7', '8', '9']

// ═══════════════════════════════════════════════════════════════════════════
// GAME ENGINE
// ═══════════════════════════════════════════════════════════════════════════

function P(type: PieceType, color: PieceColor): Piece { return { type, color } }

function initBoard(): Board {
  const B: PieceColor = 'black', R: PieceColor = 'red'
  return [
    [P('R',B), P('H',B), P('E',B), P('A',B), P('K',B), P('A',B), P('E',B), P('H',B), P('R',B)],
    Array(9).fill(null),
    [null, P('C',B), null, null, null, null, null, P('C',B), null],
    [P('P',B), null, P('P',B), null, P('P',B), null, P('P',B), null, P('P',B)],
    Array(9).fill(null),
    Array(9).fill(null),
    [P('P',R), null, P('P',R), null, P('P',R), null, P('P',R), null, P('P',R)],
    [null, P('C',R), null, null, null, null, null, P('C',R), null],
    Array(9).fill(null),
    [P('R',R), P('H',R), P('E',R), P('A',R), P('K',R), P('A',R), P('E',R), P('H',R), P('R',R)],
  ]
}

function cloneBoard(b: Board): Board { return b.map(row => row.map(p => p ? { ...p } : null)) }

function inBounds(r: number, c: number): boolean { return r >= 0 && r <= 9 && c >= 0 && c <= 8 }

function inPalace(r: number, c: number, color: PieceColor): boolean {
  return c >= 3 && c <= 5 && (color === 'black' ? r >= 0 && r <= 2 : r >= 7 && r <= 9)
}

function isOwnSide(r: number, color: PieceColor): boolean {
  return color === 'black' ? r >= 0 && r <= 4 : r >= 5 && r <= 9
}

function getRawMoves(board: Board, r: number, c: number): [number, number][] {
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
    for (const [dr, dc] of [[0,1],[0,-1],[1,0],[-1,0]]) {
      const nr = r+dr!, nc = c+dc!
      if (inPalace(nr, nc, color) && canMoveTo(nr, nc)) moves.push([nr, nc])
    }
  } else if (type === 'A') {
    for (const [dr, dc] of [[1,1],[1,-1],[-1,1],[-1,-1]]) {
      const nr = r+dr!, nc = c+dc!
      if (inPalace(nr, nc, color) && canMoveTo(nr, nc)) moves.push([nr, nc])
    }
  } else if (type === 'E') {
    for (const [dr, dc] of [[2,2],[2,-2],[-2,2],[-2,-2]]) {
      const nr = r+dr!, nc = c+dc!
      const er = r+dr!/2, ec = c+dc!/2 // eye
      if (inBounds(nr, nc) && isOwnSide(nr, color) && !board[er]![ec] && canMoveTo(nr, nc))
        moves.push([nr, nc])
    }
  } else if (type === 'H') {
    const legs: [number, number, number, number][] = [
      [-1,0,-2,-1],[-1,0,-2,1],[1,0,2,-1],[1,0,2,1],
      [0,-1,-1,-2],[0,-1,1,-2],[0,1,-1,2],[0,1,1,2],
    ]
    for (const [lr, lc, dr, dc] of legs) {
      const legR = r+lr!, legC = c+lc!, nr = r+dr!, nc = c+dc!
      if (inBounds(nr, nc) && !board[legR]?.[legC] && canMoveTo(nr, nc))
        moves.push([nr, nc])
    }
  } else if (type === 'R') {
    for (const [dr, dc] of [[0,1],[0,-1],[1,0],[-1,0]]) {
      let nr = r+dr!, nc = c+dc!
      while (inBounds(nr, nc)) {
        if (!board[nr]![nc]) { moves.push([nr, nc]) }
        else { if (board[nr]![nc]!.color === enemy) moves.push([nr, nc]); break }
        nr += dr!; nc += dc!
      }
    }
  } else if (type === 'C') {
    for (const [dr, dc] of [[0,1],[0,-1],[1,0],[-1,0]]) {
      let nr = r+dr!, nc = c+dc!; let jumped = false
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
        nr += dr!; nc += dc!
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

function findKing(board: Board, color: PieceColor): [number, number] | null {
  for (let r = 0; r < 10; r++) for (let c = 0; c < 9; c++)
    if (board[r]![c]?.type === 'K' && board[r]![c]?.color === color) return [r, c]
  return null
}

function isKingFacing(board: Board): boolean {
  const rk = findKing(board, 'red'), bk = findKing(board, 'black')
  if (!rk || !bk || rk[1] !== bk[1]) return false
  for (let r = Math.min(rk[0], bk[0]) + 1; r < Math.max(rk[0], bk[0]); r++)
    if (board[r]![rk[1]]) return false
  return true
}

function isInCheck(board: Board, color: PieceColor): boolean {
  const king = findKing(board, color)
  if (!king) return true
  const enemy = color === 'red' ? 'black' : 'red'
  for (let r = 0; r < 10; r++) for (let c = 0; c < 9; c++) {
    if (board[r]![c]?.color === enemy) {
      const moves = getRawMoves(board, r, c)
      if (moves.some(([mr, mc]) => mr === king[0] && mc === king[1])) return true
    }
  }
  return false
}

function getLegalMoves(board: Board, r: number, c: number): [number, number][] {
  const piece = board[r]![c]
  if (!piece) return []
  return getRawMoves(board, r, c).filter(([tr, tc]) => {
    const test = cloneBoard(board)
    test[tr]![tc] = test[r]![c]
    test[r]![c] = null
    return !isInCheck(test, piece.color) && !isKingFacing(test)
  })
}

function isCheckmate(board: Board, color: PieceColor): boolean {
  for (let r = 0; r < 10; r++) for (let c = 0; c < 9; c++)
    if (board[r]![c]?.color === color && getLegalMoves(board, r, c).length > 0) return false
  return true
}

// ═══════════════════════════════════════════════════════════════════════════
// AI ENGINE — Minimax with Alpha-Beta Pruning
// ═══════════════════════════════════════════════════════════════════════════

const PIECE_VALUE: Record<PieceType, number> = { K: 10000, A: 20, E: 25, H: 45, R: 90, C: 45, P: 10 }

// Position bonuses (simplified for medium difficulty)
const CENTER_BONUS = [
  [0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0],
  [0,0,0,1,1,1,0,0,0],[0,0,1,2,2,2,1,0,0],[0,0,1,2,2,2,1,0,0],
  [0,0,0,1,1,1,0,0,0],[0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0],
]

function evaluateBoard(b: Board, forColor: PieceColor): number {
  let score = 0
  const enemy = forColor === 'red' ? 'black' : 'red'
  for (let r = 0; r < 10; r++) for (let c = 0; c < 9; c++) {
    const p = b[r]?.[c]
    if (!p) continue
    const base = PIECE_VALUE[p.type]! + (CENTER_BONUS[r]?.[c] ?? 0)
    // Pawn bonus after crossing river
    let bonus = 0
    if (p.type === 'P') {
      const crossed = p.color === 'red' ? r <= 4 : r >= 5
      if (crossed) bonus += 15
    }
    // Rook on open column
    if (p.type === 'R') bonus += 5
    // Horse in center
    if (p.type === 'H' && c >= 2 && c <= 6 && r >= 2 && r <= 7) bonus += 5
    if (p.color === forColor) score += base + bonus
    else score -= base + bonus
  }
  // Check bonus
  if (isInCheck(b, enemy)) score += 30
  if (isInCheck(b, forColor)) score -= 30
  return score
}

function getAllMoves(b: Board, color: PieceColor): { fr: number; fc: number; tr: number; tc: number }[] {
  const moves: { fr: number; fc: number; tr: number; tc: number }[] = []
  for (let r = 0; r < 10; r++) for (let c = 0; c < 9; c++) {
    if (b[r]?.[c]?.color === color) {
      for (const [tr, tc] of getLegalMoves(b, r, c))
        moves.push({ fr: r, fc: c, tr, tc })
    }
  }
  return moves
}

function minimax(b: Board, depth: number, alpha: number, beta: number, maximizing: boolean, aiColor: PieceColor): number {
  const enemy = aiColor === 'red' ? 'black' : 'red'
  const currentColor = maximizing ? aiColor : enemy

  if (depth === 0) return evaluateBoard(b, aiColor)
  if (isCheckmate(b, currentColor)) return maximizing ? -99999 + (3 - depth) : 99999 - (3 - depth)

  const moves = getAllMoves(b, currentColor)
  if (moves.length === 0) return maximizing ? -99999 : 99999

  // Move ordering: captures first for better pruning
  moves.sort((a, x) => {
    const aCap = b[a.tr]?.[a.tc] ? 1 : 0
    const xCap = b[x.tr]?.[x.tc] ? 1 : 0
    return xCap - aCap
  })

  if (maximizing) {
    let best = -Infinity
    for (const m of moves) {
      const nb = cloneBoard(b)
      nb[m.tr]![m.tc] = nb[m.fr]![m.fc]; nb[m.fr]![m.fc] = null
      const val = minimax(nb, depth - 1, alpha, beta, false, aiColor)
      best = Math.max(best, val); alpha = Math.max(alpha, val)
      if (beta <= alpha) break
    }
    return best
  } else {
    let best = Infinity
    for (const m of moves) {
      const nb = cloneBoard(b)
      nb[m.tr]![m.tc] = nb[m.fr]![m.fc]; nb[m.fr]![m.fc] = null
      const val = minimax(nb, depth - 1, alpha, beta, true, aiColor)
      best = Math.min(best, val); beta = Math.min(beta, val)
      if (beta <= alpha) break
    }
    return best
  }
}

function findBestMove(b: Board, aiColor: PieceColor): { fr: number; fc: number; tr: number; tc: number } | null {
  const moves = getAllMoves(b, aiColor)
  if (moves.length === 0) return null
  let bestScore = -Infinity
  let bestMove = moves[0]!
  const depth = 3 // medium difficulty

  for (const m of moves) {
    const nb = cloneBoard(b)
    nb[m.tr]![m.tc] = nb[m.fr]![m.fc]; nb[m.fr]![m.fc] = null
    const score = minimax(nb, depth - 1, -Infinity, Infinity, false, aiColor)
    if (score > bestScore) { bestScore = score; bestMove = m }
  }
  return bestMove
}

const aiThinking = ref(false)
const aiColor = ref<PieceColor>('black')

function triggerAiMove() {
  if (gameOver.value || turn.value !== aiColor.value) return
  aiThinking.value = true
  // Use setTimeout to avoid blocking UI
  setTimeout(() => {
    const best = findBestMove(board.value, aiColor.value)
    if (best) makeMove(best.fr, best.fc, best.tr, best.tc)
    aiThinking.value = false
  }, 300)
}

// ═══════════════════════════════════════════════════════════════════════════
// CANVAS RENDERER
// ═══════════════════════════════════════════════════════════════════════════

const canvasRef = ref<HTMLCanvasElement | null>(null)
const BOARD_PAD = 30
let cellSize = 50

function getCanvasSize() {
  const maxW = Math.min(460, window.innerWidth - 32)
  cellSize = Math.floor((maxW - BOARD_PAD * 2) / 8)
  return { w: cellSize * 8 + BOARD_PAD * 2, h: cellSize * 9 + BOARD_PAD * 2 }
}

function drawBoard() {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const dpr = window.devicePixelRatio || 1
  const { w, h } = getCanvasSize()
  canvas.width = w * dpr; canvas.height = h * dpr
  canvas.style.width = `${w}px`; canvas.style.height = `${h}px`
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

  const flipped = isFlipped.value
  const brd = board.value

  // Background
  const bg = ctx.createLinearGradient(0, 0, w, h)
  bg.addColorStop(0, '#2A1810'); bg.addColorStop(1, '#1A0E08')
  ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h)

  // Board surface
  ctx.fillStyle = '#3D2B1F'
  ctx.fillRect(BOARD_PAD - 8, BOARD_PAD - 8, cellSize * 8 + 16, cellSize * 9 + 16)

  const ox = BOARD_PAD, oy = BOARD_PAD

  // Grid lines
  ctx.strokeStyle = '#8B7355'; ctx.lineWidth = 1
  for (let r = 0; r <= 9; r++) {
    ctx.beginPath(); ctx.moveTo(ox, oy + r * cellSize); ctx.lineTo(ox + 8 * cellSize, oy + r * cellSize); ctx.stroke()
  }
  for (let c = 0; c <= 8; c++) {
    ctx.beginPath()
    ctx.moveTo(ox + c * cellSize, oy); ctx.lineTo(ox + c * cellSize, oy + 4 * cellSize); ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(ox + c * cellSize, oy + 5 * cellSize); ctx.lineTo(ox + c * cellSize, oy + 9 * cellSize); ctx.stroke()
  }

  // Palace diagonals
  ctx.strokeStyle = '#6B5B4F'; ctx.lineWidth = 0.8
  const drawPalace = (topR: number) => {
    const y1 = oy + topR * cellSize, y2 = oy + (topR + 2) * cellSize
    const x1 = ox + 3 * cellSize, x2 = ox + 5 * cellSize
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(x2, y1); ctx.lineTo(x1, y2); ctx.stroke()
  }
  drawPalace(flipped ? 7 : 0); drawPalace(flipped ? 0 : 7)

  // River text
  ctx.fillStyle = '#6B5B4F'; ctx.font = `italic ${cellSize * 0.35}px "Anybody", serif`
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
  const riverY = oy + 4.5 * cellSize
  ctx.fillText('楚 河', ox + 2 * cellSize, riverY)
  ctx.fillText('漢 界', ox + 6 * cellSize, riverY)

  // Selected highlight
  if (selectedPos.value) {
    const [sr, sc] = selectedPos.value
    const dr = flipped ? 9 - sr : sr, dc = flipped ? 8 - sc : sc
    ctx.fillStyle = 'rgba(255, 184, 48, 0.25)'
    ctx.fillRect(ox + dc * cellSize - cellSize * 0.45, oy + dr * cellSize - cellSize * 0.45, cellSize * 0.9, cellSize * 0.9)
  }

  // Valid move indicators
  for (const [mr, mc] of validMoves.value) {
    const dr = flipped ? 9 - mr : mr, dc = flipped ? 8 - mc : mc
    const tx = ox + dc * cellSize, ty = oy + dr * cellSize
    if (brd[mr]![mc]) {
      ctx.strokeStyle = 'rgba(255, 107, 74, 0.7)'; ctx.lineWidth = 2
      ctx.beginPath(); ctx.arc(tx, ty, cellSize * 0.4, 0, Math.PI * 2); ctx.stroke()
    } else {
      ctx.fillStyle = 'rgba(255, 184, 48, 0.5)'
      ctx.beginPath(); ctx.arc(tx, ty, cellSize * 0.12, 0, Math.PI * 2); ctx.fill()
    }
  }

  // Pieces
  const pieceR = cellSize * 0.4
  for (let r = 0; r < 10; r++) for (let c = 0; c < 9; c++) {
    const p = brd[r]![c]
    if (!p) continue
    const dr = flipped ? 9 - r : r, dc = flipped ? 8 - c : c
    const px = ox + dc * cellSize, py = oy + dr * cellSize

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)'
    ctx.beginPath(); ctx.arc(px + 1, py + 2, pieceR, 0, Math.PI * 2); ctx.fill()

    // Piece circle
    const grad = ctx.createRadialGradient(px - pieceR * 0.2, py - pieceR * 0.2, 0, px, py, pieceR)
    if (p.color === 'red') {
      grad.addColorStop(0, '#5C1A0A'); grad.addColorStop(1, '#3A0E05')
    } else {
      grad.addColorStop(0, '#1F2A20'); grad.addColorStop(1, '#0E150F')
    }
    ctx.fillStyle = grad
    ctx.beginPath(); ctx.arc(px, py, pieceR, 0, Math.PI * 2); ctx.fill()

    // Border
    ctx.strokeStyle = p.color === 'red' ? '#D4703A' : '#6B8B5E'; ctx.lineWidth = 1.5
    ctx.beginPath(); ctx.arc(px, py, pieceR - 1, 0, Math.PI * 2); ctx.stroke()
    // Inner ring
    ctx.strokeStyle = p.color === 'red' ? '#D4703A44' : '#6B8B5E44'; ctx.lineWidth = 0.8
    ctx.beginPath(); ctx.arc(px, py, pieceR - 4, 0, Math.PI * 2); ctx.stroke()

    // Character
    const ch = PIECE_CHAR[p.type]![p.color]
    ctx.fillStyle = p.color === 'red' ? '#FF6B4A' : '#A8D8A0'
    ctx.font = `bold ${cellSize * 0.42}px "Noto Serif SC", "SimSun", serif`
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    ctx.fillText(ch, px, py + 1)
  }

  // Check indicator
  if (check.value) {
    const king = findKing(brd, turn.value)
    if (king) {
      const [kr, kc] = king
      const dkr = flipped ? 9 - kr : kr, dkc = flipped ? 8 - kc : kc
      ctx.strokeStyle = '#EF4444'; ctx.lineWidth = 3
      ctx.beginPath(); ctx.arc(ox + dkc * cellSize, oy + dkr * cellSize, pieceR + 3, 0, Math.PI * 2)
      ctx.stroke()
    }
  }
}

function canvasToBoard(ex: number, ey: number): [number, number] | null {
  const canvas = canvasRef.value
  if (!canvas) return null
  const rect = canvas.getBoundingClientRect()
  const sx = (ex - rect.left), sy = (ey - rect.top)
  const c = Math.round((sx - BOARD_PAD) / cellSize)
  const r = Math.round((sy - BOARD_PAD) / cellSize)
  if (r < 0 || r > 9 || c < 0 || c > 8) return null
  const flipped = isFlipped.value
  return [flipped ? 9 - r : r, flipped ? 8 - c : c]
}

// ═══════════════════════════════════════════════════════════════════════════
// WEBRTC (adapted from dongnguyenvie:feat/peer-call + DataChannel)
// ═══════════════════════════════════════════════════════════════════════════

const ICE_CFG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'turn:openrelay.metered.ca:80', username: 'openrelayproject', credential: 'openrelayproject' },
    { urls: 'turn:openrelay.metered.ca:443', username: 'openrelayproject', credential: 'openrelayproject' },
  ],
}

const connState = ref<ConnectionState>('idle')
const localStream = ref<MediaStream | null>(null)
const remoteStream = ref<MediaStream | null>(null)
const localVideoRef = ref<HTMLVideoElement | null>(null)
const remoteVideoRef = ref<HTMLVideoElement | null>(null)
const offerSdp = ref(''); const answerSdp = ref('')
const pastedOffer = ref(''); const pastedAnswer = ref('')
const isMuted = ref(false); const isCameraOff = ref(false)
const copied = ref(false); const connError = ref(''); const iceProgress = ref('')

let pc: RTCPeerConnection | null = null
let dataChannel: RTCDataChannel | null = null

function sdpEncode(s: string): string { return btoa(s) }
function sdpDecode(s: string): string {
  const t = s.trim(); if (t.startsWith('{')) return t
  try { return atob(t) } catch { return t }
}

async function startMedia() {
  const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
  localStream.value = stream
  await nextTick()
  if (localVideoRef.value) { localVideoRef.value.srcObject = stream; localVideoRef.value.play() }
  return stream
}

function setupPeerConnection(stream: MediaStream) {
  pc = new RTCPeerConnection(ICE_CFG)
  remoteStream.value = new MediaStream()

  for (const track of stream.getTracks()) pc.addTrack(track, stream)

  pc.ontrack = (e) => {
    const s = e.streams[0]
    if (s) for (const track of s.getTracks()) remoteStream.value?.addTrack(track)
    nextTick(() => { if (remoteVideoRef.value && remoteStream.value) { remoteVideoRef.value.srcObject = remoteStream.value; remoteVideoRef.value.play().catch(() => {}) } })
  }

  pc.oniceconnectionstatechange = () => {
    if (pc?.iceConnectionState === 'connected' && connState.value !== 'joining')
      connState.value = 'connected'
    if (pc?.iceConnectionState === 'failed' && connState.value === 'connected')
      disconnectRTC()
  }

  return pc
}

function setupDataChannel(ch: RTCDataChannel) {
  dataChannel = ch
  ch.onmessage = (e) => {
    try {
      const msg = JSON.parse(e.data)
      if (msg.type === 'move') handleRemoteMove(msg.from, msg.to)
      if (msg.type === 'resign') handleRemoteResign()
      if (msg.type === 'sync') handleRemoteSync(msg)
    } catch { /* ignore */ }
  }
}

function waitIce(conn: RTCPeerConnection): Promise<string> {
  return new Promise((resolve) => {
    let resolved = false
    const done = () => { if (resolved) return; resolved = true; iceProgress.value = ''; resolve(JSON.stringify(conn.localDescription)) }
    if (conn.iceGatheringState === 'complete') { done(); return }
    iceProgress.value = 'Đang thu thập kết nối...'
    // Resolve early once we have a server-reflexive candidate (fast path)
    conn.onicecandidate = (e) => {
      if (!e.candidate) { done(); return }
      if (e.candidate.type === 'srflx' || e.candidate.type === 'relay') {
        iceProgress.value = 'Đã tìm thấy đường truyền!'
        setTimeout(done, 500) // short delay to collect a few more
      }
    }
    const t = setTimeout(done, 3000) // 3s hard timeout (was 10s)
    conn.onicegatheringstatechange = () => {
      if (conn.iceGatheringState === 'complete') { clearTimeout(t); done() }
    }
  })
}

async function createRoom() {
  connState.value = 'creating-offer'; connError.value = ''; iceProgress.value = 'Đang khởi tạo...'
  try {
    const stream = await startMedia()
    const conn = setupPeerConnection(stream)
    const ch = conn.createDataChannel('chess')
    setupDataChannel(ch)
    const offer = await conn.createOffer()
    await conn.setLocalDescription(offer)
    const sdp = await waitIce(conn)
    offerSdp.value = sdpEncode(sdp)
  } catch (err) {
    connError.value = 'Không thể bật camera/mic. Vui lòng cấp quyền.'
    connState.value = 'idle'
  }
}

async function joinRoom() {
  connState.value = 'joining'; connError.value = ''
  try {
    const stream = await startMedia()
    const conn = setupPeerConnection(stream)
    conn.ondatachannel = (e) => setupDataChannel(e.channel)
    const decoded = sdpDecode(pastedOffer.value)
    await conn.setRemoteDescription(JSON.parse(decoded))
    const answer = await conn.createAnswer()
    await conn.setLocalDescription(answer)
    const sdp = await waitIce(conn)
    answerSdp.value = sdpEncode(sdp)
    // Auto copy
    safeCopy(answerSdp.value)
  } catch {
    connError.value = 'Mã mời không hợp lệ.'
    connState.value = 'idle'
  }
}

async function acceptAnswer() {
  if (!pc) return
  try {
    const decoded = sdpDecode(pastedAnswer.value)
    await pc.setRemoteDescription(JSON.parse(decoded))
  } catch { connError.value = 'Mã trả lời không hợp lệ.' }
}

function enterOnlineGame() {
  connState.value = 'connected'
  gameMode.value = 'online-play'
  // Joiner plays black (board flipped), creator plays red
  if (answerSdp.value) { myColor.value = 'black'; isFlipped.value = true }
  else { myColor.value = 'red'; isFlipped.value = false }
  sendSync()
}

function sendMove(from: [number, number], to: [number, number]) {
  dataChannel?.send(JSON.stringify({ type: 'move', from, to }))
}

function sendSync() {
  const state = { type: 'sync', board: board.value, turn: turn.value, moveHistory: moveHistory.value }
  dataChannel?.send(JSON.stringify(state))
}

function sendResign() { dataChannel?.send(JSON.stringify({ type: 'resign' })) }

function disconnectRTC() {
  pc?.close(); pc = null; dataChannel = null
  localStream.value?.getTracks().forEach(t => t.stop())
  localStream.value = null; remoteStream.value = null
  connState.value = 'idle'; offerSdp.value = ''; answerSdp.value = ''
  pastedOffer.value = ''; pastedAnswer.value = ''
}

async function safeCopy(text: string) {
  try { await navigator.clipboard.writeText(text); copied.value = true; setTimeout(() => copied.value = false, 2000); return true }
  catch { return false }
}

function toggleMute() {
  const t = localStream.value?.getAudioTracks()[0]
  if (t) { t.enabled = !t.enabled; isMuted.value = !t.enabled }
}

function toggleCamera() {
  const t = localStream.value?.getVideoTracks()[0]
  if (t) { t.enabled = !t.enabled; isCameraOff.value = !t.enabled }
}

// ═══════════════════════════════════════════════════════════════════════════
// GAME STATE
// ═══════════════════════════════════════════════════════════════════════════

const gameMode = ref<GameMode>('menu')
const board = ref<Board>(initBoard())
const turn = ref<Turn>('red')
const selectedPos = ref<[number, number] | null>(null)
const validMoves = ref<[number, number][]>([])
const moveHistory = ref<Move[]>([])
const check = ref(false)
const gameOver = ref(false)
const winner = ref<PieceColor | null>(null)
const myColor = ref<PieceColor>('red')
const isFlipped = ref(false)

function resetGame() {
  board.value = initBoard()
  turn.value = 'red'; selectedPos.value = null; validMoves.value = []
  moveHistory.value = []; check.value = false; gameOver.value = false; winner.value = null
}

function handleCanvasClick(e: MouseEvent | TouchEvent) {
  if (gameOver.value || aiThinking.value) return
  if (gameMode.value === 'spectator') return

  // Online/AI: only move on your turn
  if (gameMode.value === 'online-play' && turn.value !== myColor.value) return
  if (gameMode.value === 'ai' && turn.value === aiColor.value) return

  const ev = 'touches' in e ? e.touches[0]! : e
  const pos = canvasToBoard(ev.clientX, ev.clientY)
  if (!pos) return
  const [r, c] = pos

  if (selectedPos.value) {
    const [sr, sc] = selectedPos.value
    // Try to move
    if (validMoves.value.some(([mr, mc]) => mr === r && mc === c)) {
      makeMove(sr, sc, r, c)
      if (gameMode.value === 'online-play') sendMove([sr, sc], [r, c])
      return
    }
    // Select another piece of same color
    const p = board.value[r]![c]
    if (p && p.color === turn.value) { selectPiece(r, c); return }
    // Deselect
    selectedPos.value = null; validMoves.value = []
    nextTick(drawBoard)
    return
  }

  // Select piece
  const p = board.value[r]![c]
  if (p && p.color === turn.value) selectPiece(r, c)
}

function selectPiece(r: number, c: number) {
  selectedPos.value = [r, c]
  validMoves.value = getLegalMoves(board.value, r, c)
  nextTick(drawBoard)
}

function makeMove(fr: number, fc: number, tr: number, tc: number) {
  const piece = board.value[fr]![fc]
  if (!piece) return
  const captured = board.value[tr]![tc]
  board.value[tr]![tc] = piece
  board.value[fr]![fc] = null
  moveHistory.value.push({ from: [fr, fc], to: [tr, tc], piece, captured })

  selectedPos.value = null; validMoves.value = []
  turn.value = turn.value === 'red' ? 'black' : 'red'

  check.value = isInCheck(board.value, turn.value)
  if (isCheckmate(board.value, turn.value)) {
    gameOver.value = true
    winner.value = turn.value === 'red' ? 'black' : 'red'
  }
  nextTick(drawBoard)

  // Trigger AI move if it's AI's turn
  if (gameMode.value === 'ai' && turn.value === aiColor.value && !gameOver.value) {
    nextTick(triggerAiMove)
  }
}

function handleRemoteMove(from: [number, number], to: [number, number]) {
  makeMove(from[0], from[1], to[0], to[1])
}

function handleRemoteResign() {
  gameOver.value = true
  winner.value = myColor.value
}

function handleRemoteSync(msg: { board: Board; turn: Turn; moveHistory: Move[] }) {
  board.value = msg.board; turn.value = msg.turn; moveHistory.value = msg.moveHistory
  check.value = isInCheck(board.value, turn.value)
  nextTick(drawBoard)
}

function resign() {
  gameOver.value = true
  winner.value = turn.value === 'red' ? 'black' : 'red'
  if (gameMode.value === 'online-play') sendResign()
}

function startLocal() { gameMode.value = 'local'; resetGame(); nextTick(drawBoard) }
function startAi() { gameMode.value = 'ai'; aiColor.value = 'black'; myColor.value = 'red'; isFlipped.value = false; resetGame(); nextTick(drawBoard) }
function startOnline() { gameMode.value = 'online-setup'; resetGame() }
function backToMenu() { disconnectRTC(); gameMode.value = 'menu'; resetGame() }
function flipBoard() { isFlipped.value = !isFlipped.value; nextTick(drawBoard) }

const lastMove = computed(() => {
  if (moveHistory.value.length === 0) return null
  const m = moveHistory.value[moveHistory.value.length - 1]!
  const ch = PIECE_CHAR[m.piece.type]![m.piece.color]
  const vn = PIECE_VN[m.piece.type]
  return `${ch} ${vn} (${COL_NAMES[m.from[1]]},${m.from[0]+1}) → (${COL_NAMES[m.to[1]]},${m.to[0]+1})${m.captured ? ' ✕' : ''}`
})

const turnLabel = computed(() => turn.value === 'red' ? 'Hồng tiên' : 'Hắc hậu')
const moveCount = computed(() => moveHistory.value.length)

// SVG icon paths (inline SVGs for ancient style)
const svgIcons = {
  chess: '<path d="M12 2C9.24 2 7 4.24 7 7c0 1.53.77 2.88 1.93 3.73L7 14h10l-1.93-3.27A4.98 4.98 0 0017 7c0-2.76-2.24-5-5-5zm-3 14v2h6v-2H9zm-1 4v2h8v-2H8z"/>',
  local: '<path d="M16 11c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 3-1.34 3-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05C16.19 13.79 17 14.93 17 16.5V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>',
  online: '<path d="M21 6h-7.59l3.29-3.29L16 2l-4 4-4-4-.71.71L10.59 6H3c-1.1 0-2 .89-2 2v12c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.11-.9-2-2-2zm0 14H3V8h18v12zM9 10v8l7-4z"/>',
  signal: '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>',
  join: '<path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14h-2v-4H8v-2h4V7h2v4h4v2h-4v4z"/>',
  copy: '<path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>',
  check: '<path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>',
  flip: '<path d="M6.99 11L3 15l3.99 4v-3H14v-2H6.99v-3zM21 9l-3.99-4v3H10v2h7.01v3L21 9z"/>',
  flag: '<path d="M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6h-5.6z"/>',
  refresh: '<path d="M17.65 6.35A7.958 7.958 0 0012 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0112 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>',
  mic: '<path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5zm6 6c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>',
  micOff: '<path d="M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4.02.17c0-.06.02-.11.02-.17V5c0-1.66-1.34-3-3-3S9 3.34 9 5v.18l5.98 5.99zM4.27 3L3 4.27l6.01 6.01V11c0 1.66 1.33 3 2.99 3 .22 0 .44-.03.65-.08l1.66 1.66c-.71.33-1.5.52-2.31.52-2.76 0-5.3-2.1-5.3-5.1H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c.91-.13 1.77-.45 2.55-.9l4.18 4.18L21 19.73 4.27 3z"/>',
  cam: '<path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>',
  camOff: '<path d="M21 6.5l-4 4V7c0-.55-.45-1-1-1H9.82L21 17.18V6.5zM3.27 2L2 3.27 4.73 6H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.21 0 .39-.08.54-.18L19.73 21 21 19.73 3.27 2z"/>',
  home: '<path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>',
  play: '<path d="M8 5v14l11-7z"/>',
  scroll: '<path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5 0 1.52-.98 2.82-2.34 3.3C14.81 13.56 16 15.03 16 17H8c0-1.97 1.19-3.44 2.84-4.2C9.48 12.32 8.5 11.02 8.5 9.5 8.5 7.57 10.07 6 12 6z"/>',
  robot: '<path d="M20 9V7c0-1.1-.9-2-2-2h-3c0-1.66-1.34-3-3-3S9 3.34 9 5H6c-1.1 0-2 .9-2 2v2c-1.66 0-3 1.34-3 3s1.34 3 3 3v4c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-4c1.66 0 3-1.34 3-3s-1.34-3-3-3zM7.5 11.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5S9.83 13 9 13s-1.5-.67-1.5-1.5zM16 17H8v-2h8v2zm-1-4c-.83 0-1.5-.67-1.5-1.5S14.17 10 15 10s1.5.67 1.5 1.5S15.83 13 15 13z"/>',
}

onMounted(() => { window.addEventListener('resize', () => { if (gameMode.value !== 'menu') drawBoard() }) })
onUnmounted(() => { disconnectRTC() })

watch(board, () => { nextTick(drawBoard) }, { deep: true })
</script>

<template>
  <div class="co-tuong-root min-h-screen font-body relative overflow-hidden">
    <!-- Decorative corner ornaments -->
    <div class="corner-ornament top-0 left-0" />
    <div class="corner-ornament top-0 right-0 rotate-90" />
    <div class="corner-ornament bottom-0 right-0 rotate-180" />
    <div class="corner-ornament bottom-0 left-0 -rotate-90" />

    <div class="max-w-5xl mx-auto px-4 py-8 relative z-10">

      <!-- ═══════ MENU ═══════ -->
      <div v-if="gameMode === 'menu'" class="min-h-[80vh] flex flex-col items-center justify-center">
        <div class="text-center animate-fade-up">
          <!-- Chess SVG icon -->
          <svg class="w-16 h-16 mx-auto mb-4 ancient-gold" viewBox="0 0 24 24" fill="currentColor" v-html="svgIcons.chess" />
          <h1 class="font-display text-5xl sm:text-7xl font-bold ancient-gold mb-3 tracking-widest" style="font-variant: small-caps;">棋 Cờ Tướng</h1>
          <p class="ancient-silver text-base sm:text-lg mb-1">Kỳ Đài Luận Anh Hùng</p>
          <div class="ornament-line my-6" />
          <p class="ancient-dim text-xs font-display tracking-[0.3em] mb-10">XIANGQI · CANVAS · WEBRTC</p>
        </div>

        <div class="grid gap-5 sm:grid-cols-3 max-w-2xl w-full animate-fade-up animate-delay-1">
          <button class="ancient-card group" @click="startLocal">
            <svg class="w-8 h-8 mx-auto ancient-gold mb-3 group-hover:scale-110 transition-transform" viewBox="0 0 24 24" fill="currentColor" v-html="svgIcons.local" />
            <p class="font-display text-lg font-semibold mb-1 ancient-gold">Đối Ẩm Kỳ Cuộc</p>
            <p class="text-sm ancient-dim">Hai người, một bàn cờ</p>
          </button>
          <button class="ancient-card group" @click="startAi">
            <svg class="w-8 h-8 mx-auto ancient-gold mb-3 group-hover:scale-110 transition-transform" viewBox="0 0 24 24" fill="currentColor" v-html="svgIcons.robot" />
            <p class="font-display text-lg font-semibold mb-1 ancient-gold">Tập Dợt</p>
            <p class="text-sm ancient-dim">Đấu với máy · Trung bình</p>
          </button>
          <button class="ancient-card group" @click="startOnline">
            <svg class="w-8 h-8 mx-auto ancient-gold mb-3 group-hover:scale-110 transition-transform" viewBox="0 0 24 24" fill="currentColor" v-html="svgIcons.online" />
            <p class="font-display text-lg font-semibold mb-1 ancient-gold">Thiên Hạ Kỳ Thủ</p>
            <p class="text-sm ancient-dim">Giao đấu qua WebRTC</p>
          </button>
        </div>

        <div class="mt-10 animate-fade-up animate-delay-2">
          <RouterLink to="/" class="ancient-btn-ghost">
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" v-html="svgIcons.home" />
            Hồi Cung
          </RouterLink>
        </div>
      </div>

      <!-- ═══════ ONLINE SETUP ═══════ -->
      <div v-if="gameMode === 'online-setup'" class="max-w-lg mx-auto py-8 animate-fade-up">
        <div class="flex items-center gap-3 mb-6">
          <button class="ancient-dim hover:text-[#C8A96E] transition text-sm" @click="backToMenu">&larr; Hồi</button>
          <div class="ornament-line flex-1" />
          <h2 class="font-display text-xl font-bold ancient-gold tracking-wider">Thiên Hạ Kỳ Thủ</h2>
        </div>

        <div v-if="connError" class="mb-4 ancient-alert-error">{{ connError }}</div>

        <!-- IDLE -->
        <div v-if="connState === 'idle'" class="space-y-4">
          <div class="grid gap-4 sm:grid-cols-2">
            <button class="ancient-card" @click="createRoom">
              <svg class="w-6 h-6 mx-auto ancient-gold mb-2" viewBox="0 0 24 24" fill="currentColor" v-html="svgIcons.signal" />
              <p class="font-display font-semibold mb-1 ancient-gold">Lập Kỳ Đài</p>
              <p class="text-xs ancient-dim">Tạo mã thiệp mời đối thủ</p>
            </button>
            <div class="ancient-panel text-center">
              <svg class="w-5 h-5 mx-auto ancient-gold mb-2" viewBox="0 0 24 24" fill="currentColor" v-html="svgIcons.join" />
              <p class="font-display font-semibold ancient-gold mb-2">Nhập Cuộc</p>
              <textarea v-model="pastedOffer" placeholder="Dán thiệp mời tại đây..." class="ancient-textarea h-16" />
              <button class="mt-2 w-full ancient-btn-accent" :disabled="!pastedOffer.trim()" @click="joinRoom">Kết Nối</button>
            </div>
          </div>
        </div>

        <!-- CREATING OFFER -->
        <div v-if="connState === 'creating-offer'" class="space-y-4">
          <!-- ICE loading indicator -->
          <div v-if="iceProgress && !offerSdp" class="ancient-panel text-center">
            <div class="ice-spinner mx-auto mb-2" />
            <p class="ancient-gold text-sm font-display">{{ iceProgress }}</p>
          </div>
          <div class="ancient-panel">
            <p class="font-display text-sm font-semibold ancient-gold mb-2">Bước nhất · Sao chép thiệp mời</p>
            <textarea :value="offerSdp" readonly class="ancient-textarea h-20" />
            <button class="mt-2 w-full ancient-btn-primary" :disabled="!offerSdp" @click="safeCopy(offerSdp)">
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" v-html="copied ? svgIcons.check : svgIcons.copy" />
              {{ copied ? 'Đã sao chép!' : 'Sao chép thiệp mời' }}
            </button>
          </div>
          <div class="ancient-panel">
            <p class="font-display text-sm font-semibold ancient-gold mb-2">Bước nhì · Dán hồi tín</p>
            <textarea v-model="pastedAnswer" placeholder="Dán hồi tín từ đối thủ..." class="ancient-textarea h-20" />
            <button class="mt-2 w-full ancient-btn-accent" :disabled="!pastedAnswer.trim()" @click="acceptAnswer">Kết Nối</button>
          </div>
        </div>

        <!-- JOINING -->
        <div v-if="connState === 'joining'" class="space-y-4">
          <div class="ancient-panel">
            <p class="font-display text-sm font-semibold ancient-gold mb-2">Hồi tín · Gửi cho kỳ chủ</p>
            <textarea :value="answerSdp" readonly class="ancient-textarea h-20" />
            <button class="mt-2 w-full ancient-btn-primary" @click="safeCopy(answerSdp)">
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" v-html="copied ? svgIcons.check : svgIcons.copy" />
              {{ copied ? 'Đã sao chép!' : 'Sao chép hồi tín' }}
            </button>
          </div>
          <button class="w-full ancient-btn-enter" @click="enterOnlineGame">
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" v-html="svgIcons.play" />
            NHẬP CUỘC
          </button>
        </div>

        <!-- CONNECTED -->
        <div v-if="connState === 'connected' && gameMode === 'online-setup'">
          <div class="ancient-panel text-center border-[#4A7A3A]/60">
            <svg class="w-8 h-8 text-[#4A7A3A] mx-auto mb-2" viewBox="0 0 24 24" fill="currentColor" v-html="svgIcons.check" />
            <p class="text-[#7ABA6A] font-display font-semibold mb-3">Kết nối thành công!</p>
            <button class="ancient-btn-enter" @click="enterOnlineGame">
              <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" v-html="svgIcons.play" />
              KHAI CUỘC
            </button>
          </div>
        </div>
      </div>

      <!-- ═══════ GAME BOARD ═══════ -->
      <div v-if="gameMode === 'local' || gameMode === 'ai' || gameMode === 'online-play' || gameMode === 'spectator'" class="animate-fade-up">
        <!-- Top bar -->
        <div class="flex items-center justify-between mb-4">
          <button class="ancient-dim hover:text-[#C8A96E] transition text-sm flex items-center gap-1" @click="backToMenu">
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" v-html="svgIcons.home" /> Hồi
          </button>
          <div class="flex items-center gap-3">
            <span class="font-display text-sm font-semibold tracking-wider" :class="turn === 'red' ? 'text-[#C84B31]' : 'ancient-silver'">{{ turnLabel }}</span>
            <span v-if="check && !gameOver" class="text-xs ancient-alert-badge">將 CHIẾU</span>
            <span v-if="aiThinking" class="text-xs ancient-thinking-badge"><span class="ice-spinner inline-block w-3 h-3 align-middle mr-1" /> Suy nghĩ...</span>
          </div>
          <span class="ancient-dim text-xs font-display tracking-wider">第 {{ moveCount }} 手</span>
        </div>

        <div class="flex flex-col lg:flex-row gap-4 items-start">
          <!-- Webcam panels (online) -->
          <div v-if="gameMode === 'online-play'" class="w-full lg:w-48 flex lg:flex-col gap-2">
            <div class="flex-1 ancient-panel overflow-hidden relative p-0">
              <video ref="remoteVideoRef" autoplay playsinline muted class="w-full aspect-video object-cover" style="transform: scaleX(-1)" />
              <span class="absolute bottom-1 left-1 text-xs px-1.5 py-0.5 font-display" :class="myColor === 'red' ? 'ancient-silver' : 'text-[#C84B31]'" style="background: rgba(15,10,5,0.8)">{{ myColor === 'red' ? '黑 Đối thủ' : '紅 Đối thủ' }}</span>
            </div>
            <div class="flex-1 ancient-panel overflow-hidden relative p-0">
              <video ref="localVideoRef" autoplay playsinline muted class="w-full aspect-video object-cover" style="transform: scaleX(-1)" />
              <span class="absolute bottom-1 left-1 text-xs px-1.5 py-0.5 font-display" :class="myColor === 'red' ? 'text-[#C84B31]' : 'ancient-silver'" style="background: rgba(15,10,5,0.8)">{{ myColor === 'red' ? '紅 Bạn' : '黑 Bạn' }}</span>
            </div>
            <div class="flex lg:flex-col gap-1">
              <button class="flex-1 ancient-btn-sm" @click="toggleMute">
                <svg class="w-4 h-4 mx-auto" viewBox="0 0 24 24" fill="currentColor" v-html="isMuted ? svgIcons.micOff : svgIcons.mic" />
              </button>
              <button class="flex-1 ancient-btn-sm" @click="toggleCamera">
                <svg class="w-4 h-4 mx-auto" viewBox="0 0 24 24" fill="currentColor" v-html="isCameraOff ? svgIcons.camOff : svgIcons.cam" />
              </button>
            </div>
          </div>

          <!-- Board -->
          <div class="flex-shrink-0 board-frame">
            <canvas ref="canvasRef" class="block cursor-pointer" @click="handleCanvasClick" @touchstart.prevent="handleCanvasClick" />
          </div>

          <!-- Side panel -->
          <div class="flex-1 min-w-0 lg:max-w-[220px] space-y-3">
            <!-- Controls -->
            <div class="flex flex-wrap gap-2">
              <button class="ancient-btn-sm" @click="flipBoard">
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" v-html="svgIcons.flip" />
                <span class="text-xs">Lật</span>
              </button>
              <button v-if="!gameOver" class="ancient-btn-sm text-[#C84B31]" @click="resign">
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" v-html="svgIcons.flag" />
                <span class="text-xs">Đầu hàng</span>
              </button>
              <button v-if="gameOver" class="ancient-btn-sm text-[#C8A96E]" @click="resetGame(); nextTick(drawBoard)">
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" v-html="svgIcons.refresh" />
                <span class="text-xs">Ván mới</span>
              </button>
            </div>

            <!-- Game Over -->
            <div v-if="gameOver" class="ancient-panel text-center" :class="winner === 'red' ? 'border-[#C84B31]/50' : 'border-[#8B7355]/50'">
              <p class="font-display text-xl font-bold tracking-wider" :class="winner === 'red' ? 'text-[#C84B31]' : 'ancient-silver'">
                {{ winner === 'red' ? '紅 方 勝' : '黑 方 勝' }}
              </p>
              <p class="ancient-dim text-xs mt-1">{{ check ? '將死 — Chiếu bí!' : '投降 — Đầu hàng' }}</p>
            </div>

            <!-- Last move -->
            <div v-if="lastMove" class="ancient-panel">
              <p class="ancient-dim text-xs font-display mb-1 tracking-wider">末手 NƯỚC CUỐI</p>
              <p class="text-sm ancient-silver">{{ lastMove }}</p>
            </div>

            <!-- Move history scroll -->
            <div class="ancient-panel max-h-48 overflow-y-auto ancient-scrollbar">
              <p class="ancient-dim text-xs font-display mb-1 tracking-wider">棋譜 KỲ PHỔ ({{ moveCount }})</p>
              <div v-if="moveHistory.length === 0" class="ancient-dim text-xs italic">Kỳ cuộc chưa khai</div>
              <div v-for="(m, i) in moveHistory" :key="i" class="text-xs py-0.5 border-b border-[#2A1F14]" :class="m.piece.color === 'red' ? 'text-[#C84B31]' : 'ancient-silver'">
                {{ i + 1 }}. {{ PIECE_CHAR[m.piece.type]![m.piece.color] }} {{ PIECE_VN[m.piece.type] }}
                ({{ COL_NAMES[m.from[1]] }},{{ m.from[0]+1 }}) → ({{ COL_NAMES[m.to[1]] }},{{ m.to[0]+1 }})
                <span v-if="m.captured" class="text-[#C8A96E]">斬 {{ PIECE_CHAR[m.captured.type]![m.captured.color] }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="mt-8 text-center">
          <div class="ornament-line mb-3" />
          <p class="ancient-dim text-xs font-display tracking-[0.25em]">棋 CỜ TƯỚNG · XIANGQI × WEBRTC × CANVAS · 開發 HWG</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ═══════ Ancient Theme Foundation ═══════ */
.co-tuong-root {
  background: linear-gradient(180deg, #0F0A05 0%, #1A0E08 30%, #0D0806 100%);
  color: #B8A88A;
}

/* Gold & Silver text utilities */
.ancient-gold { color: #C8A96E; }
.ancient-silver { color: #B8A88A; }
.ancient-dim { color: #6B5B45; }

/* Ornamental horizontal line */
.ornament-line {
  height: 1px;
  background: linear-gradient(90deg, transparent, #C8A96E33, #C8A96E66, #C8A96E33, transparent);
}

/* Corner decorations */
.corner-ornament {
  position: fixed; width: 60px; height: 60px;
  pointer-events: none; z-index: 1; opacity: 0.15;
  background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 60 60'%3E%3Cpath d='M0 0h8v60h-1V8H0V0zm52 0h8v8h-8V0zM0 52h8v8H0v-8z' fill='%23C8A96E'/%3E%3C/svg%3E") no-repeat;
}

/* Card (menu items) */
.ancient-card {
  border: 1px solid #2E231A;
  background: linear-gradient(135deg, #1A120C, #0F0A05);
  padding: 1.5rem;
  text-align: center;
  transition: all 0.3s;
  position: relative;
  overflow: hidden;
}
.ancient-card::before {
  content: ''; position: absolute; inset: 3px;
  border: 1px solid #C8A96E11;
  pointer-events: none;
}
.ancient-card:hover {
  border-color: #C8A96E44;
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(200, 169, 110, 0.08);
}

/* Panel (content areas) */
.ancient-panel {
  border: 1px solid #2E231A;
  background: linear-gradient(180deg, #16100A, #0F0A05);
  padding: 1rem;
}

/* Textarea */
.ancient-textarea {
  width: 100%;
  background: #0A0704;
  border: 1px solid #2E231A;
  padding: 0.5rem;
  font-size: 0.75rem;
  color: #B8A88A;
  resize: none;
}
.ancient-textarea:focus {
  outline: none;
  border-color: #C8A96E44;
}
.ancient-textarea::placeholder { color: #3D2E20; }

/* Buttons */
.ancient-btn-primary {
  display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem;
  background: linear-gradient(180deg, #2A1F14, #1A120C);
  border: 1px solid #C8A96E55;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  color: #C8A96E;
  font-family: 'Anybody', sans-serif;
  font-weight: 600;
  transition: all 0.3s;
  letter-spacing: 0.05em;
}
.ancient-btn-primary:hover {
  background: linear-gradient(180deg, #3D2B1F, #2A1F14);
  border-color: #C8A96E88;
}

.ancient-btn-accent {
  display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem;
  background: transparent;
  border: 1px solid #C84B3166;
  padding: 0.375rem 0.75rem;
  font-size: 0.75rem;
  color: #C84B31;
  font-family: 'Anybody', sans-serif;
  transition: all 0.3s;
}
.ancient-btn-accent:hover { background: #C84B3111; border-color: #C84B31; }
.ancient-btn-accent:disabled { opacity: 0.3; cursor: not-allowed; }

.ancient-btn-enter {
  display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; width: 100%;
  background: linear-gradient(180deg, #3A5A2A, #2A4A1A);
  border: 1px solid #4A7A3A;
  padding: 0.75rem 1.5rem;
  font-size: 0.875rem;
  color: #E0F0D0;
  font-family: 'Anybody', sans-serif;
  font-weight: 700;
  transition: all 0.3s;
  letter-spacing: 0.1em;
}
.ancient-btn-enter:hover { background: linear-gradient(180deg, #4A6A3A, #3A5A2A); }

.ancient-btn-ghost {
  display: inline-flex; align-items: center; gap: 0.5rem;
  border: 1px solid #2E231A;
  background: transparent;
  padding: 0.5rem 1.25rem;
  font-size: 0.875rem;
  color: #6B5B45;
  transition: all 0.3s;
}
.ancient-btn-ghost:hover { border-color: #C8A96E44; color: #C8A96E; }

.ancient-btn-sm {
  display: inline-flex; align-items: center; gap: 0.25rem;
  border: 1px solid #2E231A;
  background: #16100A;
  padding: 0.375rem 0.625rem;
  color: #8B7355;
  transition: all 0.3s;
}
.ancient-btn-sm:hover { border-color: #C8A96E44; color: #C8A96E; }

/* Alert */
.ancient-alert-error {
  border: 1px solid #C84B3140;
  background: #C84B3110;
  padding: 0.75rem;
  font-size: 0.875rem;
  color: #C84B31;
}

.ancient-alert-badge {
  font-size: 0.65rem;
  background: #8B2020;
  color: #FFD0D0;
  padding: 0.15rem 0.5rem;
  font-family: 'Anybody', sans-serif;
  letter-spacing: 0.1em;
  animation: pulse-glow 1.5s ease-in-out infinite;
}

.ancient-thinking-badge {
  font-size: 0.65rem;
  background: #2A1F14;
  color: #C8A96E;
  padding: 0.15rem 0.5rem;
  font-family: 'Anybody', sans-serif;
  letter-spacing: 0.05em;
  border: 1px solid #C8A96E44;
}

/* Board frame */
.board-frame {
  padding: 6px;
  border: 2px solid #3D2B1F;
  background: linear-gradient(135deg, #2A1F14, #1A120C);
  box-shadow: 0 0 30px rgba(200, 169, 110, 0.05), inset 0 0 15px rgba(0,0,0,0.5);
  position: relative;
}
.board-frame::before {
  content: ''; position: absolute; inset: 2px;
  border: 1px solid #C8A96E15;
  pointer-events: none;
}

/* Scrollbar */
.ancient-scrollbar::-webkit-scrollbar { width: 4px; }
.ancient-scrollbar::-webkit-scrollbar-track { background: #0A0704; }
.ancient-scrollbar::-webkit-scrollbar-thumb { background: #2E231A; }
.ancient-scrollbar::-webkit-scrollbar-thumb:hover { background: #3D2B1F; }

/* Canvas */
canvas { image-rendering: -webkit-optimize-contrast; touch-action: none; }
video { background: #0A0704; }

/* ICE loading spinner */
.ice-spinner {
  width: 24px; height: 24px;
  border: 2px solid #2E231A;
  border-top-color: #C8A96E;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* Animations */
@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 4px rgba(200, 50, 50, 0.3); }
  50% { box-shadow: 0 0 12px rgba(200, 50, 50, 0.6); }
}
</style>

