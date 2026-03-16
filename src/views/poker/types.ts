export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades'

// 2-10 = face value, 11=J, 12=Q, 13=K, 14=A
export type Rank = 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14

export interface Card {
  suit: Suit
  rank: Rank
}

export type GamePhase = 'waiting' | 'pre-flop' | 'flop' | 'turn' | 'river' | 'showdown'

export type PlayerStatus = 'active' | 'folded' | 'all-in' | 'out'

export interface Player {
  id: string
  name: string
  chips: number
  holeCards: Card[]
  roundBet: number
  totalBet: number
  status: PlayerStatus
  isBot: boolean
  seatIndex: number
  hasActed: boolean
}

export type HandRank =
  | 'royal-flush'
  | 'straight-flush'
  | 'four-of-a-kind'
  | 'full-house'
  | 'flush'
  | 'straight'
  | 'three-of-a-kind'
  | 'two-pair'
  | 'pair'
  | 'high-card'

export interface HandResult {
  rank: HandRank
  rankValue: number
  cards: Card[]
  tiebreakers: number[]
  description: string
}

export type PlayerActionType = 'fold' | 'check' | 'call' | 'raise' | 'all-in'

export interface PlayerAction {
  type: PlayerActionType
  amount?: number
}

export interface WinnerInfo {
  playerId: string
  playerName: string
  amount: number
  handResult: HandResult | null
}

export interface GameState {
  phase: GamePhase
  players: Player[]
  communityCards: Card[]
  pot: number
  currentBet: number
  activePlayerIndex: number
  dealerIndex: number
  winners: WinnerInfo[]
  handNumber: number
  lastActionText: string
  smallBlind: number
  bigBlind: number
  actionHistory: string[]
}

export interface LobbyConfig {
  playerName: string
  botCount: number
  startingChips: number
  smallBlind: number
  blindIncreaseHands: number
}

export interface FriendsConfig {
  playerNames: string[]
  startingChips: number
  smallBlind: number
  blindIncreaseHands: number
}
