import { ref, onMounted, onUnmounted } from 'vue'

export function useInput() {
  const keys = ref<Set<string>>(new Set())

  const onKeyDown = (e: KeyboardEvent) => {
    keys.value.add(e.code)
    // Prevent page scroll for game keys
    if (
      [
        'ArrowUp',
        'ArrowDown',
        'ArrowLeft',
        'ArrowRight',
        'Space',
        'Digit1',
        'Digit2',
        'Digit3',
        'Digit4',
        'Digit5',
        'Digit6',
        'Digit7',
        'Digit8',
      ].includes(e.code)
    ) {
      e.preventDefault()
    }
  }
  const onKeyUp = (e: KeyboardEvent) => {
    keys.value.delete(e.code)
  }

  onMounted(() => {
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
  })
  onUnmounted(() => {
    window.removeEventListener('keydown', onKeyDown)
    window.removeEventListener('keyup', onKeyUp)
  })

  function isDown(code: string): boolean {
    return keys.value.has(code)
  }

  function consumeKey(code: string): boolean {
    if (keys.value.has(code)) {
      keys.value.delete(code)
      return true
    }
    return false
  }

  return { keys, isDown, consumeKey }
}
