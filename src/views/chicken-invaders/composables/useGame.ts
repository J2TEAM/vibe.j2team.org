import { useGameState } from './useGameState'
import { useControls } from './useControls'
import { useGameActions } from './useGameActions'
import { useGameLoop } from './useGameLoop'

export function useGame() {
  // 1. Lấy trạng thái game (State)
  const state = useGameState()

  // 2. Lấy bộ điều khiển (Controls)
  const controls = useControls()

  // 3. Khởi tạo các hành động game (Actions)
  const actions = useGameActions(state, controls)

  // 4. Khởi động vòng lặp game (Loop)
  useGameLoop(state, controls, actions)

  const setPointerState = (clientX?: number, clientY?: number, isDown?: boolean) => {
    if (isDown !== undefined) controls.pointerState.value.isDown = isDown
    if (state.gameState.value !== 'playing' && state.gameState.value !== 'starting') return

    if (clientX !== undefined && clientY !== undefined && clientX !== -1) {
      const translated = controls.getTranslatedPointer(clientX, clientY, state.boardRotation.value)
      if (translated) {
        const logical_cx = state.activeWidth.value / 2
        const logical_cy = state.activeHeight.value / 2
        state.player.value.x = Math.max(
          0,
          Math.min(
            logical_cx + translated.local_dx - state.player.value.width / 2,
            state.activeWidth.value - state.player.value.width,
          ),
        )
        state.player.value.y = Math.max(
          0,
          Math.min(
            logical_cy + translated.local_dy - state.player.value.height / 2,
            state.activeHeight.value - state.player.value.height,
          ),
        )
      }
    }
  }

  const handleBoardPointerDown = (e: PointerEvent) => {
    if (state.gameState.value === 'paused' && e.pointerType === 'mouse') {
      actions.resumeGame()
    } else {
      setPointerState(e.clientX, e.clientY, true)
    }
  }

  return {
    ...state,
    ...controls,
    ...actions,
    setPointerState,
    handleBoardPointerDown,
  }
}

export type GameContext = ReturnType<typeof useGame>
