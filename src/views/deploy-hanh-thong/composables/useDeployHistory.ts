import { useLocalStorage } from '@vueuse/core'
import type { HistoryItem } from '../types'

const STORAGE_KEY = 'deploy-hanh-thong-history'

export function useDeployHistory() {
  const history = useLocalStorage<HistoryItem[]>(STORAGE_KEY, [])

  function addHistory(item: HistoryItem): void {
    history.value = [item, ...history.value].slice(0, 20)
  }

  function clearHistory(): void {
    history.value = []
  }

  return {
    history,
    addHistory,
    clearHistory,
  }
}
