// ── Locale ─────────────────────────────────────────────────────────────

export type Locale = 'en' | 'vi'

export interface L10n {
  en: string
  vi: string
}

// ── Stats ──────────────────────────────────────────────────────────────

export type StatKey = 'nature' | 'human' | 'economy' | 'digital'
export type Stats = Record<StatKey, number> // 0–100

export interface DerivedStats {
  harmony: number // 100 - (max - min) of all 4 stats
  sustainability: number // avg(nature + economy)
  connection: number // avg(human + digital)
}

// ── Biomes ─────────────────────────────────────────────────────────────

export type BiomeId =
  | 'mangrove-coast'
  | 'coastal-winds'
  | 'highland-mists'
  | 'ancient-forests'
  | 'highland-plateaus'
  | 'river-delta-plains'
  | 'grand-port'

export interface Biome {
  id: BiomeId
  name: L10n
  emoji: string
  specialty: L10n
}

// ── Production Resources ─────────────────────────────────────────────

export type ResourceKey = 'food' | 'materials' | 'knowledge'
export type Resources = Record<ResourceKey, number>
export type ResourceCost = Partial<Resources>

// ── Cards ──────────────────────────────────────────────────────────────

export type CardTier = 'foundation' | 'culture' | 'vision' | 'regional'

export type StatDelta = Partial<Record<StatKey, number>>

export type UnlockCondition =
  | { type: 'always' }
  | { type: 'meter'; stat: StatKey; min: number }
  | { type: 'biome'; biomeId: BiomeId }
  | { type: 'chain'; cardIds: number[]; stat: StatKey; min: number }
  | { type: 'mixed-harmony'; mixedCount: number; harmonyMin: number }
  | { type: 'all-biomes' }
  | { type: 'all-meters'; min: number }
  | { type: 'hidden-collapse' }
  | { type: 'hidden-no-vision' }

export interface Card {
  id: number
  name: L10n
  tier: CardTier
  tracks: StatKey[] // primary stat tracks
  costBudget: number
  costEnergy: number
  biome: BiomeId | 'global'
  regionLocked: boolean // can only be played in home biome
  homeEffects: StatDelta // effects when played in home biome (or global)
  awayEffects: StatDelta // effects when played outside home biome
  upkeep: number // 💰 per turn while in slot (non-deactivated)
  unlockCondition: UnlockCondition
  developsIome?: BiomeId // playing this card develops the named biome
  hidden?: boolean // true for secret vision cards
  costResources?: ResourceCost // resource cost to play (food/materials/knowledge)
  produces?: ResourceCost // resources produced each turn while active
  upkeepResources?: ResourceCost // resource upkeep consumed each turn
}

// A card sitting in an active slot
export interface SlotCard {
  card: Card
  deactivated: boolean
}

// ── Events ─────────────────────────────────────────────────────────────

export type EventType = 'opportunity' | 'challenge'

export interface OutCondition {
  track?: StatKey // any card with this track is in active slots
  stat?: StatKey // stat meter >= min
  substat?: 'harmony' | 'sustainability' | 'connection' // substat >= min
  min?: number
}

export interface GameEvent {
  id: string
  type: EventType
  title: L10n
  description: L10n
  budgetDelta: number
  energyDelta: number
  meterDeltas: StatDelta
  energyGenMod?: { amount: number; turns: number }
  drawExtra: number
  outCondition?: OutCondition // if satisfied, event effect is negated (challenges)
  duration?: number // turns the event persists (default 1 = instant)
}

export interface ActiveEvent {
  event: GameEvent
  turnsLeft: number
}

// ── Endings ────────────────────────────────────────────────────────────

export interface Ending {
  visionId: number // which vision card triggers this (0 = special)
  title: L10n
  narrative: L10n
}

export interface ComboEnding {
  visionIds: [number, number] // pair of vision card IDs (sorted ascending)
  title: L10n
}

// ── History ────────────────────────────────────────────────────────────

export interface TurnHistoryEntry {
  turn: number
  year: number
  cardNames: L10n[] // cards played this turn
  events: { title: L10n; type: EventType }[]
  statsSnapshot: Stats // stats at end of turn
}

// ── Game State ─────────────────────────────────────────────────────────

export type GameScreen = 'title' | 'onboarding' | 'playing' | 'ending'
export type TurnPhase = 'event' | 'select' | 'transition' | 'end'

export interface GameState {
  screen: GameScreen
  turn: number // 1–10
  phase: TurnPhase

  budget: number
  energy: number
  energyGenMods: Array<{ amount: number; turnsLeft: number }>

  // Production resources
  food: number
  materials: number
  knowledge: number

  stats: Stats
  slots: (SlotCard | null)[] // always length 6
  hand: Card[] // 5 cards drawn each turn
  selectedIds: Set<number> // card IDs selected this turn (max 2)

  developedBiomes: Set<BiomeId>
  playedCardIds: Set<number> // all card IDs ever played this run
  unlockedCardIds: Set<number>

  mixedCardsPlayed: number // count of mixed-track cards played (for Harmonic World)
  hadCollapse: boolean // all 4 stats dropped below 30 at some point

  playedThisTurn: Card[] // accumulates cards played this turn
  history: TurnHistoryEntry[]

  currentEvents: GameEvent[]
  activeEvents: ActiveEvent[]

  resolvedEnding: {
    title: L10n
    narrative: L10n
    visionIds: number[]
  } | null

  onboardingStep: number | null // null = done/skipped, 1-4 = tutorial step
}
