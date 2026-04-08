/// <reference lib="webworker" />
import type { VChessState } from './vchess-engine'
import {
  findBestMoveSync,
  randomAiSearchBudgetMs,
  type IterativePlyDebugEvent,
  type SearchResult,
} from './vchess-search'
import { computeHash } from './vchess-zobrist'

export type VChessAiWorkerIn = {
  type: 'search'
  id: number
  state: VChessState
}

export type VChessAiWorkerOut =
  | { type: 'result'; id: number; result: SearchResult | null }
  | { type: 'debug'; id: number; event: IterativePlyDebugEvent }
  | { type: 'error'; id: number; message: string }

self.onmessage = (event: MessageEvent<VChessAiWorkerIn>) => {
  const msg = event.data
  if (msg.type !== 'search') return
  const { id, state } = msg
  try {
    state.hash = computeHash(state)
    const result = findBestMoveSync(state, randomAiSearchBudgetMs(), {
      onIterativePly: (event) => {
        const out: VChessAiWorkerOut = { type: 'debug', id, event }
        self.postMessage(out)
      },
    })
    const out: VChessAiWorkerOut = { type: 'result', id, result }
    self.postMessage(out)
  } catch (err) {
    const out: VChessAiWorkerOut = {
      type: 'error',
      id,
      message: err instanceof Error ? err.message : String(err),
    }
    self.postMessage(out)
  }
}
