import type { Ref } from 'vue'
import { useEventListener } from '@vueuse/core'

export function useSearchShortcut(inputRef: Ref<HTMLInputElement | null>) {
  useEventListener(document, 'keydown', (e: KeyboardEvent) => {
    if (e.key !== '/') return
    const tag = (e.target as HTMLElement)?.tagName
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
    if ((e.target as HTMLElement)?.isContentEditable) return
    e.preventDefault()
    inputRef.value?.focus()
  })
}
