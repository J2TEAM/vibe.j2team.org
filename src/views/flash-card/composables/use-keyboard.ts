import { onMounted, onUnmounted } from 'vue'

interface KeyboardOptions {
  onFlip: () => void
  onLeft: () => void
  onRight: () => void
  onUndo: () => void
}

export function useKeyboard(options: KeyboardOptions) {
  function onKeyDown(e: KeyboardEvent) {
    // Ignore if user is typing in an input/textarea
    const tag = (e.target as HTMLElement).tagName
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return

    switch (e.key) {
      case ' ':
      case 'Enter':
        e.preventDefault()
        options.onFlip()
        break
      case 'ArrowLeft':
        e.preventDefault()
        options.onLeft()
        break
      case 'ArrowRight':
        e.preventDefault()
        options.onRight()
        break
      case 'z':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault()
          options.onUndo()
        }
        break
    }
  }

  onMounted(() => {
    window.addEventListener('keydown', onKeyDown)
  })

  onUnmounted(() => {
    window.removeEventListener('keydown', onKeyDown)
  })
}
