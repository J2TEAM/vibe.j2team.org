import { ref } from 'vue'
import type { Ref } from 'vue'

export function useDraggable<T>(items: Ref<T[]>) {
  const dragIndex = ref<number | null>(null)
  const overIndex = ref<number | null>(null)

  function onDragStart(_e: DragEvent, index: number) {
    dragIndex.value = index
  }

  function onDragOver(e: DragEvent, index: number) {
    e.preventDefault()
    overIndex.value = index
  }

  function onDrop(e: DragEvent, index: number) {
    e.preventDefault()
    if (dragIndex.value === null || dragIndex.value === index) {
      reset()
      return
    }
    const arr = [...items.value]
    const [moved] = arr.splice(dragIndex.value, 1) as [T]
    arr.splice(index, 0, moved)
    items.value = arr
    reset()
  }

  function onDragEnd() {
    reset()
  }

  function reset() {
    dragIndex.value = null
    overIndex.value = null
  }

  return { dragIndex, overIndex, onDragStart, onDragOver, onDrop, onDragEnd }
}
