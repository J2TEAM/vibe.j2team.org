import { ref, computed } from 'vue'
import { useStorage } from '@vueuse/core'
import type { LegoBrick, LegoBrickType } from '../types'

export function useLegoBuilder() {
  const bricks = useStorage<LegoBrick[]>('lego-builder-bricks', [])
  
  // Safety check for corrupt localStorage
  if (!Array.isArray(bricks.value)) {
    bricks.value = []
  }

  const activeBrickType = ref<LegoBrickType>('2x2')
  const activeColor = ref('#E3000B')
  
  // Ensure history starts with a valid array clone
  const initialData = Array.isArray(bricks.value) ? JSON.parse(JSON.stringify(bricks.value)) : []
  const history = ref<LegoBrick[][]>([initialData])
  const historyIndex = ref(0)

  const canUndo = computed(() => {
    return Array.isArray(history.value) && historyIndex.value > 0
  })
  const canRedo = computed(() => {
    return Array.isArray(history.value) && historyIndex.value < history.value.length - 1
  })

  function commitUpdate() {
    const currentState = JSON.parse(JSON.stringify(bricks.value))
    if (JSON.stringify(currentState) === JSON.stringify(history.value[historyIndex.value])) return

    history.value = history.value.slice(0, historyIndex.value + 1)
    history.value.push(currentState)
    if (history.value.length > 50) history.value.shift()
    else historyIndex.value++
  }

  function addBrick(brick: LegoBrick) {
    bricks.value.push(brick)
    commitUpdate()
  }

  function removeBrick(id: string) {
    bricks.value = bricks.value.filter(b => b.id !== id)
    commitUpdate()
  }

  function clearAll() {
    bricks.value = []
    commitUpdate()
  }

  function undo() {
    if (canUndo.value) {
      historyIndex.value--
      bricks.value = JSON.parse(JSON.stringify(history.value[historyIndex.value]))
    }
  }

  function redo() {
    if (canRedo.value) {
      historyIndex.value++
      bricks.value = JSON.parse(JSON.stringify(history.value[historyIndex.value]))
    }
  }

  return {
    bricks,
    activeBrickType,
    activeColor,
    addBrick,
    removeBrick,
    clearAll,
    undo,
    redo,
    canUndo,
    canRedo,
  }
}
