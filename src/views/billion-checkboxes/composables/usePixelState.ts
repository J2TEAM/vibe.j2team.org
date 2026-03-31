import { shallowRef, triggerRef } from 'vue'
import { useLocalStorage, useDebounceFn } from '@vueuse/core'
import { STORAGE_KEY, SAVE_DEBOUNCE_MS } from '../constants/gridConfig'

/**
 * Pixel state management with localStorage persistence
 */
export function usePixelState() {
  const checkedIndices = useLocalStorage<number[]>(STORAGE_KEY, [])
  // Use shallowRef + Set for sparse storage (tradeoff: sparse set vs true bitset)
  const checkedSet = shallowRef(new Set(checkedIndices.value))

  // Track pending changes for debounced save
  let hasPendingSave = false

  /**
   * Schedule a debounced save to localStorage
   */
  const scheduleSave = useDebounceFn(() => {
    // Debounce the full array serialization to localStorage to avoid freezing UI
    if (hasPendingSave) {
      checkedIndices.value = Array.from(checkedSet.value)
      hasPendingSave = false
    }
  }, SAVE_DEBOUNCE_MS)

  /**
   * Toggle a pixel at the given index
   */
  function togglePixel(index: number): boolean {
    const wasChecked = checkedSet.value.has(index)

    if (wasChecked) {
      checkedSet.value.delete(index)
    } else {
      checkedSet.value.add(index)
    }

    triggerRef(checkedSet)
    hasPendingSave = true
    scheduleSave()

    return !wasChecked // Return new state
  }

  /**
   * Set a pixel to a specific state (checked or unchecked)
   */
  function setPixel(index: number, checked: boolean) {
    const wasChecked = checkedSet.value.has(index)

    if (checked && !wasChecked) {
      checkedSet.value.add(index)
      triggerRef(checkedSet)
      hasPendingSave = true
      scheduleSave()
    } else if (!checked && wasChecked) {
      checkedSet.value.delete(index)
      triggerRef(checkedSet)
      hasPendingSave = true
      scheduleSave()
    }
  }

  /**
   * Clear all pixels
   */
  function clearAll() {
    checkedSet.value.clear()
    triggerRef(checkedSet)
    checkedIndices.value = []
    hasPendingSave = false
  }

  /**
   * Import state from an array of indices
   */
  function importState(indices: number[]) {
    checkedSet.value = new Set(indices)
    triggerRef(checkedSet)
    hasPendingSave = true
    scheduleSave()
  }

  /**
   * Export current state as an array of indices
   */
  function exportState(): number[] {
    return Array.from(checkedSet.value)
  }

  function markDirtyAndSave() {
    hasPendingSave = true
    scheduleSave()
  }

  return {
    checkedSet,
    checkedIndices,
    togglePixel,
    setPixel,
    clearAll,
    importState,
    exportState,
    markDirtyAndSave,
  }
}
