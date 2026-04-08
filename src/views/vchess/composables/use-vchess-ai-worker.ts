import { onUnmounted, shallowRef } from 'vue'
import { positionToCoordinate, type Move, type VChessState } from '../engine/vchess-engine'
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

export type VChessAiSearchOutcome =
  | { kind: 'ok'; result: SearchResult }
  | { kind: 'no_result' }
  | { kind: 'cancelled' }
  | {
      kind: 'failed'
      reason: 'worker_crash' | 'search_exception' | 'post_message'
      detail?: string
    }

export function useVchessAiWorker() {
  const workerRef = shallowRef<Worker | null>(null)
  const pending = new Map<number, (value: VChessAiSearchOutcome) => void>()
  const openGroups = new Set<number>()

  function formatMoveForMainConsole(move: Move): string {
    const from = positionToCoordinate(move.from)
    const to = positionToCoordinate(move.to)
    const cap =
      move.type === 'capture' && move.captureSquare
        ? ` x${positionToCoordinate(move.captureSquare)}`
        : ''
    return `${from}-${to}${cap} (${move.type})`
  }

  function ensureWorker(): Worker {
    const existing = workerRef.value
    if (existing) return existing

    const w = new VChessAiWorker()

    w.onmessage = (event: MessageEvent<VChessAiWorkerOut>) => {
      const msg = event.data
      if (msg.type === 'debug') {
        if (!openGroups.has(msg.id)) {
          openGroups.add(msg.id)
          console.groupCollapsed(`[vchess-ai] #${msg.id}`)
        }
        const { ply, bestMove, bestScore, elapsedMs, budgetMs } = msg.event
        console.log(
          `ply=${ply} best=${formatMoveForMainConsole(bestMove)} score=${bestScore} elapsedMs=${elapsedMs} (budgetMs=${budgetMs})`,
        )
        return
      }
      if (msg.type === 'result') {
        const resolve = pending.get(msg.id)
        if (!resolve) return
        pending.delete(msg.id)
        if (openGroups.delete(msg.id)) console.groupEnd()
        if (msg.result !== null) {
          resolve({ kind: 'ok', result: msg.result })
        } else {
          resolve({ kind: 'no_result' })
        }
        return
      }
      if (msg.type === 'error') {
        const resolve = pending.get(msg.id)
        if (!resolve) return
        pending.delete(msg.id)
        if (openGroups.delete(msg.id)) console.groupEnd()
        resolve({
          kind: 'failed',
          reason: 'search_exception',
          detail: msg.message,
        })
        return
      }
    }

    w.onerror = () => {
      for (const resolve of pending.values()) {
        resolve({ kind: 'failed', reason: 'worker_crash' })
      }
      pending.clear()
      for (const id of openGroups) {
        console.groupEnd()
        openGroups.delete(id)
      }
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
      resolve({ kind: 'cancelled' })
    }
    pending.clear()
    for (const id of openGroups) {
      console.groupEnd()
      openGroups.delete(id)
    }
    terminateWorkerInstance()
  }

  /**
   * Chạy tìm nước trong Web Worker — **không** gọi findBestMoveSync trên main thread.
   */
  function requestSearch(state: VChessState): Promise<VChessAiSearchOutcome> {
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
        resolve({ kind: 'failed', reason: 'post_message' })
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
