export interface RevealedPair {
  clientSeed: string
  serverSeed: string
  serverSeedHash: string
  rolls: number
}

export interface HistoryEntry {
  nonce: number
  result: number
  mode: 'under' | 'over'
  prediction: number
  won: boolean
  delta: number
  clientSeed: string
  serverSeedHash: string
}

export type FairnessTab = 'seeds' | 'verify' | 'algorithm'
