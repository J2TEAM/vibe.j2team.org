import { ref } from 'vue'
import { useMousePressed, useMagicKeys } from '@vueuse/core'
import { GAME_WIDTH, GAME_HEIGHT } from '../utils/config'

export function useControls() {
  const mobileKeys = ref({ left: false, right: false, fire: false })
  const pointerState = ref({ isDown: false })

  const { w, a, s, d, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, space, Escape } = useMagicKeys()
  const { pressed: mousePressed } = useMousePressed()

  const getTranslatedPointer = (clientX: number, clientY: number, boardRotation: number) => {
    const boardEl = document.getElementById('touch-layer')
    if (!boardEl) return null
    const rect = boardEl.getBoundingClientRect()

    const localX = ((clientX - rect.left) / rect.width) * GAME_WIDTH
    const localY = ((clientY - rect.top) / rect.height) * GAME_HEIGHT

    const cx = GAME_WIDTH / 2
    const cy = GAME_HEIGHT / 2
    const dx = localX - cx
    const dy = localY - cy

    const theta = (boardRotation * Math.PI) / 180
    const local_dx = dx * Math.cos(-theta) - dy * Math.sin(-theta)
    const local_dy = dx * Math.sin(-theta) + dy * Math.cos(-theta)

    return { local_dx, local_dy }
  }

  return {
    mobileKeys,
    pointerState,
    w,
    a,
    s,
    d,
    ArrowUp,
    ArrowDown,
    ArrowLeft,
    ArrowRight,
    space,
    Escape,
    mousePressed,
    getTranslatedPointer,
  }
}
