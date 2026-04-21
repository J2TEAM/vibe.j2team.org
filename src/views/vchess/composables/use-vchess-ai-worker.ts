import { onUnmounted, shallowRef } from 'vue'
import type { VChessState } from '../engine/vchess-engine'
import type { SearchResult } from '../engine/vchess-search'
import type { VChessAiWorkerOut } from '../engine/vchess-ai.worker'
import VChessAiWorker from '../engine/vchess-ai.worker.ts?worker'

let requestSeq = 0

/** Plain object — tránh Proxy Vue khi postMessage / structuredClone (DataCloneError). */
function stateForWorker(state: VChessState): VChessState {
  const plain = JSON.parse(
    JSON.stringify(state, (_, v) => (typeof v === 'bigint' ? null : v)),
  ) as VChessState
  plain.hash = 0n
  return plain
}

export function useVchessAiWorker() {
  const workerRef = shallowRef<Worker | null>(null)
  const pending = new Map<number, (value: SearchResult | null) => void>()

  function ensureWorker(): Worker {
    const existing = workerRef.value
    if (existing) return existing

    const w = new VChessAiWorker()

    w.onmessage = (event: MessageEvent<VChessAiWorkerOut>) => {
      const msg = event.data
      if (msg.type === 'result') {
        const resolve = pending.get(msg.id)
        if (!resolve) return
        pending.delete(msg.id)
        resolve(msg.result)
        return
      }
      if (msg.type === 'error') {
        const resolve = pending.get(msg.id)
        if (!resolve) return
        pending.delete(msg.id)
        resolve(null)
      }
    }

    w.onerror = () => {
      for (const resolve of pending.values()) {
        resolve(null)
      }
      pending.clear()
      terminateWorkerInstance()
    }

    workerRef.value = w
    return w
  }

  function terminateWorkerInstance() {
    const w = workerRef.value
    if (w) {
      w.terminate()
      workerRef.value = null
    }
  }

  /**
   * Hủy mọi kết quả đang chờ (đi menu / đổi màn trong lúc máy suy nghĩ).
   */
  function cancelPendingSearches() {
    for (const resolve of pending.values()) {
      resolve(null)
    }
    pending.clear()
    terminateWorkerInstance()
  }

  /**
   * Chạy tìm nước trong Web Worker — **không** gọi findBestMoveSync trên main thread.
   */
  function requestSearch(state: VChessState): Promise<SearchResult | null> {
    return new Promise((resolve) => {
      const id = ++requestSeq
      pending.set(id, resolve)
      try {
        const w = ensureWorker()
        w.postMessage({
          type: 'search',
          id,
          state: stateForWorker(state),
        })
      } catch {
        pending.delete(id)
        resolve(null)
      }
    })
  }

  onUnmounted(() => {
    cancelPendingSearches()
    terminateWorkerInstance()
  })

  return {
    requestSearch,
    cancelPendingSearches,
  }
}
