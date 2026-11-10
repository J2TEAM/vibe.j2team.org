export type PlayerId = 'p0' | 'p1' | 'p2'
export type Role = 'A' | 'B' | 'C'
export type Mode = 'plain' | 'caesar' | 'authenticated'
export type Phase = 'lobby' | 'compose' | 'intercept' | 'decide' | 'reveal' | 'finished' | 'aborted'
export type Door = 1 | 2 | 3

export interface Envelope {
  iv: string
  ciphertext: string
}

export interface Player {
  id: PlayerId
  name: string
  connected: boolean
  ready: boolean
  score: number
}

export interface PlayerView extends Player {
  role: Role
}

export interface RoundResult {
  round: number
  mode: Mode
  roles: Record<Role, PlayerId>
  targetDoor: Door
  chosenDoor: Door | null
  originalText: string
  receivedText: string | null
  modified: boolean
  authenticated: boolean | null
  reason: string
  reasonCode:
    | 'decision'
    | 'sender-timeout'
    | 'receiver-timeout'
    | 'receipt-timeout'
    | 'authentication-failed'
  winner: 'team' | 'interceptor' | 'none'
  timeline: string[]
}

/** This payload carries commands, never a sender ID or a self-declared role. */
export interface GameEvent {
  id: string
  roomId: string
  round: number
  phase: Phase
  type:
    | 'ready'
    | 'mode'
    | 'start'
    | 'public-key'
    | 'compose'
    | 'unlock'
    | 'forward'
    | 'receipt'
    | 'decide'
    | 'next'
    | 'restart'
    | 'reveal-original'
  ready?: boolean
  mode?: Mode
  text?: string
  key?: number
  envelope?: Envelope
  door?: Door
  publicKey?: string
  status?: 'valid' | 'invalid'
}

/** Only the trusted host holds this state. Never serialize it to another player. */
export interface EngineState {
  roomId: string
  mode: Mode
  phase: Phase
  round: number
  deadline: number | null
  serverNow: number
  revision: number
  players: Record<PlayerId, Player>
  roles: Record<Role, PlayerId>
  targetDoor: Door
  caesarKey: number
  originalText: string
  deliveredText: string | null
  originalEnvelope: Envelope | null
  deliveredEnvelope: Envelope | null
  publicKeys: Partial<Record<PlayerId, string>>
  unlocked: boolean
  receipt: 'pending' | 'valid' | 'invalid'
  modified: boolean
  timeline: string[]
  results: RoundResult[]
  seenEvents: Set<string>
  notice: string
}

/** New objects are built for each recipient; secrets are omitted, not hidden by CSS. */
export interface RoomView {
  roomId: string
  mode: Mode
  phase: Phase
  round: number
  deadline: number | null
  serverNow: number
  revision: number
  players: PlayerView[]
  selfId: PlayerId
  role: Role
  roles: Record<Role, PlayerId>
  targetDoor?: Door
  caesarKey?: number
  originalText?: string
  interceptedText?: string
  ciphertext?: string
  caesarHint?: string
  envelope?: Envelope
  receivedText?: string
  otherPublicKey?: string
  unlocked?: boolean
  receipt?: 'pending' | 'valid' | 'invalid'
  result: RoundResult | null
  results: RoundResult[]
  notice: string
}
