import { ref, type Ref } from 'vue'
import type { Board, Turn } from '../types'
import { PIECE_CHAR } from '../constants'
import { findKing } from './useGameEngine'

const BOARD_PAD = 30
let cellSize = 50

function getCanvasSize() {
  const maxW = Math.min(460, window.innerWidth - 32)
  cellSize = Math.floor((maxW - BOARD_PAD * 2) / 8)
  return { w: cellSize * 8 + BOARD_PAD * 2, h: cellSize * 9 + BOARD_PAD * 2 }
}

export function useBoard(
  board: Ref<Board>,
  selectedPos: Ref<[number, number] | null>,
  validMoves: Ref<[number, number][]>,
  check: Ref<boolean>,
  turn: Ref<Turn>,
  isFlipped: Ref<boolean>,
) {
  const canvasRef = ref<HTMLCanvasElement | null>(null)

  function drawBoard() {
    const canvas = canvasRef.value
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const dpr = window.devicePixelRatio || 1
    const { w, h } = getCanvasSize()
    canvas.width = w * dpr
    canvas.height = h * dpr
    canvas.style.width = `${w}px`
    canvas.style.height = `${h}px`
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    const flipped = isFlipped.value
    const brd = board.value

    // Background
    const bg = ctx.createLinearGradient(0, 0, w, h)
    bg.addColorStop(0, '#2A1810')
    bg.addColorStop(1, '#1A0E08')
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, w, h)

    // Board surface
    ctx.fillStyle = '#3D2B1F'
    ctx.fillRect(BOARD_PAD - 8, BOARD_PAD - 8, cellSize * 8 + 16, cellSize * 9 + 16)

    const ox = BOARD_PAD,
      oy = BOARD_PAD

    // Grid lines
    ctx.strokeStyle = '#8B7355'
    ctx.lineWidth = 1
    for (let r = 0; r <= 9; r++) {
      ctx.beginPath()
      ctx.moveTo(ox, oy + r * cellSize)
      ctx.lineTo(ox + 8 * cellSize, oy + r * cellSize)
      ctx.stroke()
    }
    for (let c = 0; c <= 8; c++) {
      ctx.beginPath()
      ctx.moveTo(ox + c * cellSize, oy)
      ctx.lineTo(ox + c * cellSize, oy + 4 * cellSize)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(ox + c * cellSize, oy + 5 * cellSize)
      ctx.lineTo(ox + c * cellSize, oy + 9 * cellSize)
      ctx.stroke()
    }

    // Palace diagonals
    ctx.strokeStyle = '#6B5B4F'
    ctx.lineWidth = 0.8
    const drawPalace = (topR: number) => {
      const y1 = oy + topR * cellSize,
        y2 = oy + (topR + 2) * cellSize
      const x1 = ox + 3 * cellSize,
        x2 = ox + 5 * cellSize
      ctx.beginPath()
      ctx.moveTo(x1, y1)
      ctx.lineTo(x2, y2)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(x2, y1)
      ctx.lineTo(x1, y2)
      ctx.stroke()
    }
    drawPalace(flipped ? 7 : 0)
    drawPalace(flipped ? 0 : 7)

    // River text
    ctx.fillStyle = '#6B5B4F'
    ctx.font = `italic ${cellSize * 0.35}px "Anybody", serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    const riverY = oy + 4.5 * cellSize
    ctx.fillText('楚 河', ox + 2 * cellSize, riverY)
    ctx.fillText('漢 界', ox + 6 * cellSize, riverY)

    // Selected highlight
    if (selectedPos.value) {
      const [sr, sc] = selectedPos.value
      const dr = flipped ? 9 - sr : sr,
        dc = flipped ? 8 - sc : sc
      ctx.fillStyle = 'rgba(255, 184, 48, 0.25)'
      ctx.fillRect(
        ox + dc * cellSize - cellSize * 0.45,
        oy + dr * cellSize - cellSize * 0.45,
        cellSize * 0.9,
        cellSize * 0.9,
      )
    }

    // Valid move indicators
    for (const [mr, mc] of validMoves.value) {
      const dr = flipped ? 9 - mr : mr,
        dc = flipped ? 8 - mc : mc
      const tx = ox + dc * cellSize,
        ty = oy + dr * cellSize
      if (brd[mr]![mc]) {
        ctx.strokeStyle = 'rgba(255, 107, 74, 0.7)'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.arc(tx, ty, cellSize * 0.4, 0, Math.PI * 2)
        ctx.stroke()
      } else {
        ctx.fillStyle = 'rgba(255, 184, 48, 0.5)'
        ctx.beginPath()
        ctx.arc(tx, ty, cellSize * 0.12, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    // Pieces
    const pieceR = cellSize * 0.4
    for (let r = 0; r < 10; r++)
      for (let c = 0; c < 9; c++) {
        const p = brd[r]![c]
        if (!p) continue
        const dr = flipped ? 9 - r : r,
          dc = flipped ? 8 - c : c
        const px = ox + dc * cellSize,
          py = oy + dr * cellSize

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)'
        ctx.beginPath()
        ctx.arc(px + 1, py + 2, pieceR, 0, Math.PI * 2)
        ctx.fill()

        // Piece circle
        const grad = ctx.createRadialGradient(
          px - pieceR * 0.2,
          py - pieceR * 0.2,
          0,
          px,
          py,
          pieceR,
        )
        if (p.color === 'red') {
          grad.addColorStop(0, '#5C1A0A')
          grad.addColorStop(1, '#3A0E05')
        } else {
          grad.addColorStop(0, '#1F2A20')
          grad.addColorStop(1, '#0E150F')
        }
        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.arc(px, py, pieceR, 0, Math.PI * 2)
        ctx.fill()

        // Border
        ctx.strokeStyle = p.color === 'red' ? '#D4703A' : '#6B8B5E'
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.arc(px, py, pieceR - 1, 0, Math.PI * 2)
        ctx.stroke()
        ctx.strokeStyle = p.color === 'red' ? '#D4703A44' : '#6B8B5E44'
        ctx.lineWidth = 0.8
        ctx.beginPath()
        ctx.arc(px, py, pieceR - 4, 0, Math.PI * 2)
        ctx.stroke()

        // Character
        const ch = PIECE_CHAR[p.type]![p.color]
        ctx.fillStyle = p.color === 'red' ? '#FF6B4A' : '#A8D8A0'
        ctx.font = `bold ${cellSize * 0.42}px "Noto Serif SC", "SimSun", serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(ch, px, py + 1)
      }

    // Check indicator
    if (check.value) {
      const king = findKing(brd, turn.value)
      if (king) {
        const [kr, kc] = king
        const dkr = flipped ? 9 - kr : kr,
          dkc = flipped ? 8 - kc : kc
        ctx.strokeStyle = '#EF4444'
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.arc(ox + dkc * cellSize, oy + dkr * cellSize, pieceR + 3, 0, Math.PI * 2)
        ctx.stroke()
      }
    }
  }

  function canvasToBoard(ex: number, ey: number): [number, number] | null {
    const canvas = canvasRef.value
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    const sx = ex - rect.left,
      sy = ey - rect.top
    const c = Math.round((sx - BOARD_PAD) / cellSize)
    const r = Math.round((sy - BOARD_PAD) / cellSize)
    if (r < 0 || r > 9 || c < 0 || c > 8) return null
    const flipped = isFlipped.value
    return [flipped ? 9 - r : r, flipped ? 8 - c : c]
  }

  return { canvasRef, drawBoard, canvasToBoard }
}
