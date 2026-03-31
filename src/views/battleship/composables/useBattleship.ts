import { reactive, computed } from 'vue'

import { createBoard, countAliveShipCells } from '../utils/board'
import { useAI } from './useAI'
import { placeShape, removeShape, canPlaceShape } from '../utils/placement'
import { SHIPS } from '../utils/ship'

import type { GamePhase, Difficulty } from '../types/game'

export function useBattleship() {
  type Placement = { shipIndex: number; r: number; c: number; shape: number[][] }

  const state = reactive({
    phase: 'onboard' as GamePhase,
    difficulty: 'hard' as Difficulty,
    playerBoard: createBoard(),
    enemyBoard: createBoard(),
    message: 'Chào mừng đến Battleship',
    shipRotation: 0,
    placements: [] as Placement[],
    selectedPlacementIndex: null as number | null,
  })
  const ai = useAI(() => state.difficulty)

  const placedShipIndices = computed(() => new Set(state.placements.map((p) => p.shipIndex)))

  const selectedPlacement = computed(() => {
    const i = state.selectedPlacementIndex
    if (i === null || i < 0 || i >= state.placements.length) return null
    return state.placements[i]!
  })

  function setPhase(p: GamePhase) {
    state.phase = p
  }

  function cycleShipRotation() {
    state.shipRotation = (state.shipRotation + 1) % 4
  }

  function selectPlacementAt(cellR: number, cellC: number): boolean {
    for (let i = 0; i < state.placements.length; i++) {
      const p = state.placements[i]!
      const { r, c, shape } = p
      for (let di = 0; di < shape.length; di++) {
        const row = shape[di]
        if (!row) continue
        for (let dj = 0; dj < row.length; dj++) {
          if (!row[dj]) continue
          if (r + di === cellR && c + dj === cellC) {
            state.selectedPlacementIndex = state.selectedPlacementIndex === i ? null : i
            return true
          }
        }
      }
    }
    return false
  }

  function rotateSelectedShip(): boolean {
    const i = state.selectedPlacementIndex
    if (i === null || i < 0 || i >= state.placements.length) return false
    const p = state.placements[i]!
    const { shipIndex, r, c, shape } = p
    const rotated = rotateShape(shape)
    removeShape(state.playerBoard, r, c, shape)
    if (!canPlaceShape(state.playerBoard, r, c, rotated)) {
      placeShape(state.playerBoard, r, c, shape)
      return false
    }
    placeShape(state.playerBoard, r, c, rotated)
    state.placements[i] = { shipIndex, r, c, shape: rotated }
    return true
  }

  function getShapeWithRotation(shape: number[][], rot: number): number[][] {
    let s = shape
    for (let i = 0; i < rot; i++) s = rotateShape(s)
    return s
  }

  function placePlayerShip(r: number, c: number, shipIndex?: number): boolean {
    const idx =
      shipIndex ?? [...Array(SHIPS.length).keys()].find((i) => !placedShipIndices.value.has(i))
    if (idx === undefined || placedShipIndices.value.has(idx)) return false
    const ship = SHIPS[idx]
    if (!ship) return false
    const shape = getShapeWithRotation(ship.shape, state.shipRotation)
    if (!canPlaceShape(state.playerBoard, r, c, shape)) return false
    placeShape(state.playerBoard, r, c, shape)
    state.placements.push({ shipIndex: idx, r, c, shape })
    return true
  }

  function removeShipAt(cellR: number, cellC: number): boolean {
    for (let i = state.placements.length - 1; i >= 0; i--) {
      const p = state.placements[i]!
      const { r, c, shape } = p
      for (let di = 0; di < shape.length; di++) {
        const row = shape[di]
        if (!row) continue
        for (let dj = 0; dj < row.length; dj++) {
          if (!row[dj]) continue
          if (r + di === cellR && c + dj === cellC) {
            removeShape(state.playerBoard, r, c, shape)
            state.placements.splice(i, 1)
            return true
          }
        }
      }
    }
    return false
  }

  function moveShip(fromR: number, fromC: number, toR: number, toC: number): boolean {
    for (let i = 0; i < state.placements.length; i++) {
      const p = state.placements[i]!
      const { shipIndex, r, c, shape } = p
      for (let di = 0; di < shape.length; di++) {
        const row = shape[di]
        if (!row) continue
        for (let dj = 0; dj < row.length; dj++) {
          if (!row[dj]) continue
          if (r + di === fromR && c + dj === fromC) {
            if (toR === r && toC === c) return true
            removeShape(state.playerBoard, r, c, shape)
            if (!canPlaceShape(state.playerBoard, toR, toC, shape)) {
              placeShape(state.playerBoard, r, c, shape)
              return false
            }
            placeShape(state.playerBoard, toR, toC, shape)
            state.placements[i] = { shipIndex, r: toR, c: toC, shape }
            return true
          }
        }
      }
    }
    return false
  }

  function rotateShape(shape: number[][]): number[][] {
    const rows = shape.length
    const cols = shape[0]?.length ?? 0
    return Array.from({ length: cols }, (_, j) =>
      Array.from({ length: rows }, (_, i) => shape[rows - 1 - i]?.[j] ?? 0),
    )
  }

  function randomPlacePlayerShips() {
    for (const p of state.placements) {
      removeShape(state.playerBoard, p.r, p.c, p.shape)
    }
    state.placements = []
    state.selectedPlacementIndex = null

    const board = state.playerBoard
    for (let shipIndex = 0; shipIndex < SHIPS.length; shipIndex++) {
      const ship = SHIPS[shipIndex]!
      let placed = false
      for (let attempt = 0; attempt < 100 && !placed; attempt++) {
        const r = Math.floor(Math.random() * board.length)
        const c = Math.floor(Math.random() * board.length)
        const rot = Math.floor(Math.random() * 4)
        let shape = ship.shape
        for (let i = 0; i < rot; i++) {
          shape = rotateShape(shape)
        }
        if (canPlaceShape(board, r, c, shape)) {
          placeShape(board, r, c, shape)
          state.placements.push({ shipIndex, r, c, shape })
          placed = true
        }
      }
    }
  }

  function placeAIShips() {
    const board = state.enemyBoard
    for (const ship of SHIPS) {
      const candidates: { r: number; c: number; shape: number[][] }[] = []
      for (let r = 0; r < board.length; r++) {
        for (let c = 0; c < (board[0]?.length ?? 0); c++) {
          for (let rot = 0; rot < 4; rot++) {
            let shape = ship.shape
            for (let i = 0; i < rot; i++) {
              shape = rotateShape(shape)
            }
            if (canPlaceShape(board, r, c, shape)) {
              candidates.push({ r, c, shape })
            }
          }
        }
      }
      if (candidates.length === 0) continue
      const pick = candidates[Math.floor(Math.random() * candidates.length)]!
      placeShape(board, pick.r, pick.c, pick.shape)
    }
  }

  const HIT_MESSAGES = [
    'Trúng rồi! Sắp xong rồi đấy!',
    'Boom! Bắn trúng tàu đối thủ!',
    'Trúng đích! Đối thủ đang run rồi!',
    'Hay đấy! Tiếp tục ăn mừng đi!',
    'Trúng chính xác! Họ đang khóc đây!',
    'Đúng rồi! Cứ thế mà phang!',
  ]

  const MISS_MESSAGES = [
    'Trượt! Rồi tới lượt đối thủ đó...',
    'Trượt rồi! Bể bình rồi nhé!',
    'Trượt! May mắn lần sau nhé!',
    'Nước chưa! Lần sau thử lại!',
    'Hụt! Đối thủ đang cười vào mặt đó!',
    'Trượt! Cẩn thận kẻo thua!',
  ]

  function startGame() {
    placeAIShips()
    state.phase = 'battle'
    state.message = 'Chiến đấu thôi!'
  }

  function playerAttack(r: number, c: number) {
    if (state.phase !== 'battle') return
    const cell = state.enemyBoard[r]?.[c]
    if (!cell || cell.hit) return
    cell.hit = true
    if (countAliveShipCells(state.enemyBoard) === 0) {
      state.phase = 'victory'
      state.message = 'Bạn thắng rồi! Quá đỉnh!'
      return
    }
    if (cell.ship) {
      state.message = HIT_MESSAGES[Math.floor(Math.random() * HIT_MESSAGES.length)]!
    } else {
      state.message = MISS_MESSAGES[Math.floor(Math.random() * MISS_MESSAGES.length)]!
      setTimeout(aiTurn, 600)
    }
  }

  function aiTurn() {
    if (state.phase !== 'battle') return
    const pos = ai.next(state.playerBoard)
    if (!pos) return
    const [r, c] = pos
    const cell = state.playerBoard[r]?.[c]
    if (!cell || cell.hit) return
    cell.hit = true
    ai.process(r, c, !!cell.ship, state.playerBoard)
    if (countAliveShipCells(state.playerBoard) === 0) {
      state.phase = 'defeat'
      state.message = 'Đối thủ đã tiêu diệt hết tàu của bạn! Lần sau cố lên!'
      return
    }
    if (cell.ship) {
      setTimeout(aiTurn, 600)
    }
  }

  function allShipsPlaced(): boolean {
    return state.placements.length >= SHIPS.length
  }

  return Object.assign(state, {
    placedShipIndices,
    selectedPlacement,
    setPhase,
    cycleShipRotation,
    selectPlacementAt,
    rotateSelectedShip,
    placePlayerShip,
    removeShipAt,
    moveShip,
    randomPlacePlayerShips,
    startGame,
    playerAttack,
    allShipsPlaced,
  })
}
