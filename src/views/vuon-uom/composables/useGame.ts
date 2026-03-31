import { reactive, computed, toRef } from 'vue'
import type {
  GameState,
  Card,
  BiomeId,
  StatKey,
  ResourceKey,
  GameEvent,
  TurnHistoryEntry,
} from '../types'
import { CARDS } from '../data/cards'
import { ENDINGS, COMBO_ENDINGS } from '../data/endings'
import { useDerivedStats } from './useDerivedStats'

// ── Constants ───────────────────────────────────────────────────────────

const TOTAL_TURNS = 10
const HAND_SIZE = 5
const SLOT_COUNT = 6
const BUDGET_CAP = 30
const ENERGY_CAP = 15
const BASE_BUDGET_INCOME = 20
const BASE_ENERGY_INCOME = 5
const FOOD_CAP = 20
const MATERIALS_CAP = 15
const KNOWLEDGE_CAP = 10

// ── State ───────────────────────────────────────────────────────────────

const state = reactive<GameState>({
  screen: 'title',
  turn: 1,
  phase: 'event',

  budget: 20,
  energy: 5,
  energyGenMods: [],

  food: 0,
  materials: 0,
  knowledge: 0,

  stats: { nature: 0, human: 0, economy: 0, digital: 0 },
  slots: Array(SLOT_COUNT).fill(null),
  hand: [],
  selectedIds: new Set(),

  developedBiomes: new Set(),
  playedCardIds: new Set(),
  unlockedCardIds: new Set(),

  mixedCardsPlayed: 0,
  hadCollapse: false,

  playedThisTurn: [],
  currentEvents: [],
  activeEvents: [],
  resolvedEnding: null,
  onboardingStep: null,
  history: [],
})

// ── Derived stats (passed as computed ref) ──────────────────────────────

const statsRef = toRef(state, 'stats')
const { derived } = useDerivedStats(statsRef)

// ── Helpers ─────────────────────────────────────────────────────────────

function clamp(val: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, val))
}

function applyStatDelta(delta: Partial<Record<StatKey, number>>): void {
  for (const key of Object.keys(delta) as StatKey[]) {
    state.stats[key] = clamp(state.stats[key] + (delta[key] ?? 0))
  }
}

function getEffectiveEnergyIncome(): number {
  const base = BASE_ENERGY_INCOME + Math.floor(state.stats.human / 20)
  const biomeBonus = state.developedBiomes.size
  const mods = state.energyGenMods
    .filter((m) => m.turnsLeft > 0)
    .reduce((sum, m) => sum + m.amount, 0)
  return Math.max(0, base + biomeBonus + mods)
}

function getEffectiveBudgetIncome(): number {
  return BASE_BUDGET_INCOME + Math.floor(state.stats.economy / 20) * 3
}

function getCardEffects(card: Card): Partial<Record<StatKey, number>> {
  if (card.biome === 'global') return card.homeEffects
  if (state.developedBiomes.has(card.biome as BiomeId)) return card.homeEffects
  return card.awayEffects
}

function isMixedCard(card: Card): boolean {
  return card.tracks.length > 1
}

// ── Production helpers ──────────────────────────────────────────────────

function getProductionTotals(): Record<ResourceKey, number> {
  const totals: Record<ResourceKey, number> = { food: 0, materials: 0, knowledge: 0 }
  for (const slot of state.slots) {
    if (!slot || slot.deactivated) continue
    const p = slot.card.produces
    if (p) {
      for (const key of Object.keys(p) as ResourceKey[]) {
        totals[key] += p[key] ?? 0
      }
    }
  }
  return totals
}

// ── Unlock logic ────────────────────────────────────────────────────────

function isUnlocked(card: Card): boolean {
  const cond = card.unlockCondition
  switch (cond.type) {
    case 'always':
      return true
    case 'meter':
      return state.stats[cond.stat] >= cond.min
    case 'biome':
      return state.developedBiomes.has(cond.biomeId)
    case 'chain':
      return (
        cond.cardIds.every((id) => state.playedCardIds.has(id)) &&
        state.stats[cond.stat] >= cond.min
      )
    case 'mixed-harmony':
      return state.mixedCardsPlayed >= cond.mixedCount && derived.value.harmony >= cond.harmonyMin
    case 'all-biomes':
      return state.developedBiomes.size >= 7
    case 'all-meters':
      return Object.values(state.stats).every((v) => v >= cond.min)
    case 'hidden-collapse':
      return state.hadCollapse
    case 'hidden-no-vision':
      // Only available at final turn as a surprise — handled specially
      return state.turn === TOTAL_TURNS && !hasAnyVisionInSlots()
    default:
      return false
  }
}

function hasAnyVisionInSlots(): boolean {
  return state.slots.some((s) => s !== null && s.card.tier === 'vision')
}

function recomputeUnlocked(): void {
  state.unlockedCardIds = new Set(
    CARDS.filter((c) => !state.playedCardIds.has(c.id) || c.tier === 'vision')
      .filter((c) => isUnlocked(c))
      .map((c) => c.id),
  )
}

// Cards already in slots can't be drawn again (except vision cards stay as trophies)
function drawableCards(): Card[] {
  const slotCardIds = new Set(state.slots.filter(Boolean).map((s) => s!.card.id))
  return CARDS.filter((c) => state.unlockedCardIds.has(c.id) && !slotCardIds.has(c.id))
}

function drawHand(): void {
  const pool = drawableCards()
  const shuffled = [...pool].sort(() => Math.random() - 0.5)
  state.hand = shuffled.slice(0, HAND_SIZE)
  state.selectedIds = new Set()
}

// ── Event drawing ────────────────────────────────────────────────────────

function applyEvent(event: GameEvent): void {
  // Check out condition for challenges
  if (event.type === 'challenge' && event.outCondition) {
    const out = event.outCondition
    let satisfied = false

    if (out.track !== undefined) {
      satisfied = state.slots.some(
        (s) => s !== null && !s.deactivated && s.card.tracks.includes(out.track!),
      )
    } else if (out.stat !== undefined && out.min !== undefined) {
      satisfied = state.stats[out.stat] >= out.min
    } else if (out.substat === 'connection' && out.min !== undefined) {
      satisfied = derived.value.connection >= out.min
    } else if (out.substat === 'harmony' && out.min !== undefined) {
      satisfied = derived.value.harmony >= out.min
    }

    if (satisfied) return // out condition met — event negated
  }

  // Apply effects
  state.budget = clamp(state.budget + event.budgetDelta, 0, 999)
  state.energy = clamp(state.energy + event.energyDelta, 0, 999)
  applyStatDelta(event.meterDeltas)

  if (event.energyGenMod) {
    state.energyGenMods.push({
      amount: event.energyGenMod.amount,
      turnsLeft: event.energyGenMod.turns,
    })
  }
}

// ── Turn flow ────────────────────────────────────────────────────────────

export function startTurnEvents(): void {
  // Events temporarily disabled — go straight to card selection
  state.currentEvents = []
  state.playedThisTurn = []
  state.phase = 'select'
  drawHand()
}

export function chooseEvent(eventId: string): void {
  const evt = state.currentEvents.find((e) => e.id === eventId)
  if (evt) {
    applyEvent(evt)
    if (evt.duration && evt.duration > 1) {
      state.activeEvents.push({ event: evt, turnsLeft: evt.duration - 1 })
    }
  }
  state.playedThisTurn = []
  state.phase = 'select'
  drawHand()
}

export function toggleCardSelection(cardId: number): void {
  if (state.phase !== 'select') return
  const card = state.hand.find((c) => c.id === cardId)
  if (!card) return

  if (state.selectedIds.has(cardId)) {
    state.selectedIds.delete(cardId)
  } else {
    const emptySlots = state.slots.filter((s) => s === null).length
    if (state.selectedIds.size >= emptySlots) return
    state.selectedIds.add(cardId)
  }
}

export function canAfford(card: Card): boolean {
  if (state.budget < card.costBudget || state.energy < card.costEnergy) return false
  const cr = card.costResources
  if (cr) {
    if ((cr.food ?? 0) > state.food) return false
    if ((cr.materials ?? 0) > state.materials) return false
    if ((cr.knowledge ?? 0) > state.knowledge) return false
  }
  return true
}

export function spendEnergyForExtraCard(): void {
  if (state.energy < 3 || state.phase !== 'select') return
  state.energy -= 3
  const pool = drawableCards().filter((c) => !state.hand.find((h) => h.id === c.id))
  if (pool.length > 0) {
    const pick = pool[Math.floor(Math.random() * pool.length)]!
    state.hand.push(pick)
  }
}

export function spendEnergyForDiscount(cardId: number): void {
  if (state.energy < 5 || state.phase !== 'select') return
  const card = state.hand.find((c) => c.id === cardId)
  if (!card) return
  state.energy -= 5
  // Temporarily reduce cost by mutating a discounted clone in hand
  const idx = state.hand.findIndex((c) => c.id === cardId)
  state.hand[idx] = { ...card, costBudget: Math.max(0, card.costBudget - 5) }
}

// ── Card play helper ─────────────────────────────────────────────────────

function applyCardPlay(card: Card, slotIndex: number): void {
  state.budget -= card.costBudget
  state.energy -= card.costEnergy
  // Deduct resource costs
  if (card.costResources) {
    state.food -= card.costResources.food ?? 0
    state.materials -= card.costResources.materials ?? 0
    state.knowledge -= card.costResources.knowledge ?? 0
  }
  applyStatDelta(getCardEffects(card))
  if (card.developsIome) state.developedBiomes.add(card.developsIome)
  if (isMixedCard(card)) state.mixedCardsPlayed++
  state.playedCardIds.add(card.id)
  state.slots[slotIndex] = { card, deactivated: false }
  if (Object.values(state.stats).every((v) => v < 30)) state.hadCollapse = true
  state.playedThisTurn.push(card)
}

function recordHistoryAndAdvance(): void {
  const entry: TurnHistoryEntry = {
    turn: state.turn,
    year: state.turn * 5,
    cardNames: state.playedThisTurn.map((c) => c.name),
    events: state.currentEvents.map((e) => ({ title: e.title, type: e.type })),
    statsSnapshot: { ...state.stats },
  }
  state.history.push(entry)
  state.playedThisTurn = []
  state.phase = 'transition'
}

export function dismissTransition(): void {
  state.phase = 'end'
  advanceTurn()
}

export function confirmSelection(): void {
  if (state.phase !== 'select') return

  const selected = state.hand.filter((c) => state.selectedIds.has(c.id))
  if (selected.length === 0 && state.playedThisTurn.length === 0) return
  if (!selected.every((c) => canAfford(c))) return

  for (const card of selected) {
    const emptyIdx = state.slots.findIndex((s) => s === null)
    if (emptyIdx !== -1) applyCardPlay(card, emptyIdx)
  }

  recomputeUnlocked()
  recordHistoryAndAdvance()
}

export function deactivateSlot(idx: number): void {
  const slot = state.slots[idx]
  if (!slot || slot.card.tier === 'vision') return
  slot.deactivated = !slot.deactivated
}

export function removeFromSlot(idx: number): void {
  const slot = state.slots[idx]
  if (!slot || slot.card.tier === 'vision') return
  state.slots[idx] = null
}

// ── End of turn ──────────────────────────────────────────────────────────

function advanceTurn(): void {
  // 1. Produce resources from active slots
  const production = getProductionTotals()
  state.food += production.food
  state.materials += production.materials
  state.knowledge += production.knowledge

  // 2. Tick active (multi-turn) events
  for (const ae of state.activeEvents) {
    applyStatDelta(ae.event.meterDeltas)
  }
  state.activeEvents = state.activeEvents
    .map((ae) => ({ ...ae, turnsLeft: ae.turnsLeft - 1 }))
    .filter((ae) => ae.turnsLeft > 0)

  // 3. Pay budget upkeep
  for (const slot of state.slots) {
    if (!slot || slot.deactivated) continue
    state.budget = Math.max(0, state.budget - slot.card.upkeep)
  }

  // 4. Pay resource upkeep — auto-deactivate if can't afford
  for (const slot of state.slots) {
    if (!slot || slot.deactivated) continue
    const ur = slot.card.upkeepResources
    if (!ur) continue
    const canPay =
      state.food >= (ur.food ?? 0) &&
      state.materials >= (ur.materials ?? 0) &&
      state.knowledge >= (ur.knowledge ?? 0)
    if (canPay) {
      state.food -= ur.food ?? 0
      state.materials -= ur.materials ?? 0
      state.knowledge -= ur.knowledge ?? 0
    } else {
      slot.deactivated = true // can't pay — auto-deactivate
    }
  }

  // 5. Cap production resources
  state.food = Math.min(state.food, FOOD_CAP)
  state.materials = Math.min(state.materials, MATERIALS_CAP)
  state.knowledge = Math.min(state.knowledge, KNOWLEDGE_CAP)

  // 6. Decrement energy gen mods
  state.energyGenMods = state.energyGenMods
    .map((m) => ({ ...m, turnsLeft: m.turnsLeft - 1 }))
    .filter((m) => m.turnsLeft > 0)

  // 7. Regenerate budget/energy (cap carry-over, then add income)
  const carriedBudget = Math.min(state.budget, BUDGET_CAP)
  const carriedEnergy = Math.min(state.energy, ENERGY_CAP)
  state.budget = carriedBudget + getEffectiveBudgetIncome()
  state.energy = carriedEnergy + getEffectiveEnergyIncome()

  if (state.turn >= TOTAL_TURNS) {
    resolveEnding()
    return
  }

  state.turn++
  startTurnEvents()
}

// ── Ending resolution ────────────────────────────────────────────────────

function resolveEnding(): void {
  state.screen = 'ending'

  const visionSlotsIds = state.slots
    .filter(Boolean)
    .map((s) => s!.card)
    .filter((c) => c.tier === 'vision')
    .map((c) => c.id)

  // Check Empty Throne (no vision cards at all)
  if (visionSlotsIds.length === 0) {
    const ending = ENDINGS.find((e) => e.visionId === 41)!
    state.resolvedEnding = {
      title: ending.title,
      narrative: ending.narrative,
      visionIds: [],
    }
    return
  }

  // Check combo titles (2+ vision cards)
  if (visionSlotsIds.length >= 2) {
    const sorted = [...visionSlotsIds].sort((a, b) => a - b)
    for (const combo of COMBO_ENDINGS) {
      const [a, b] = combo.visionIds
      if (sorted.includes(a) && sorted.includes(b)) {
        // Merge narratives from the two single endings
        const endA = ENDINGS.find((e) => e.visionId === a)
        const endB = ENDINGS.find((e) => e.visionId === b)
        state.resolvedEnding = {
          title: combo.title,
          narrative:
            endA && endB
              ? {
                  en: endA.narrative.en + ' ' + endB.narrative.en,
                  vi: endA.narrative.vi + ' ' + endB.narrative.vi,
                }
              : (endA?.narrative ?? endB?.narrative ?? { en: '', vi: '' }),
          visionIds: sorted,
        }
        return
      }
    }
  }

  // Single vision card — use highest-impact one
  const primaryId = visionSlotsIds[visionSlotsIds.length - 1]
  const ending = ENDINGS.find((e) => e.visionId === primaryId)
  if (ending) {
    state.resolvedEnding = {
      title: ending.title,
      narrative: ending.narrative,
      visionIds: visionSlotsIds,
    }
  }
}

// ── Game lifecycle ───────────────────────────────────────────────────────

export function startGame(): void {
  state.screen = 'playing'
  state.turn = 1
  state.phase = 'event'
  state.budget = 20
  state.energy = 5
  state.energyGenMods = []
  state.food = 0
  state.materials = 0
  state.knowledge = 0
  state.stats = { nature: 0, human: 0, economy: 0, digital: 0 }
  state.slots = Array(SLOT_COUNT).fill(null)
  state.hand = []
  state.selectedIds = new Set()
  state.developedBiomes = new Set()
  state.playedCardIds = new Set()
  state.mixedCardsPlayed = 0
  state.hadCollapse = false
  state.playedThisTurn = []
  state.currentEvents = []
  state.activeEvents = []
  state.resolvedEnding = null
  state.onboardingStep = null
  state.history = []

  // Foundation cards always start unlocked
  state.unlockedCardIds = new Set(
    CARDS.filter((c) => c.unlockCondition.type === 'always').map((c) => c.id),
  )

  startTurnEvents()
}

export function restartGame(): void {
  startGame()
}

export function goToMenu(): void {
  state.screen = 'title'
}

export function startGameWithTutorial(): void {
  state.screen = 'onboarding'
  state.onboardingStep = 0
}

export function beginTutorial(): void {
  state.screen = 'playing'
  state.turn = 1
  state.phase = 'select'
  state.budget = 20
  state.energy = 5
  state.energyGenMods = []
  state.food = 0
  state.materials = 0
  state.knowledge = 0
  state.stats = { nature: 0, human: 0, economy: 0, digital: 0 }
  state.slots = Array(SLOT_COUNT).fill(null)
  state.selectedIds = new Set()
  state.developedBiomes = new Set()
  state.playedCardIds = new Set()
  state.mixedCardsPlayed = 0
  state.hadCollapse = false
  state.playedThisTurn = []
  state.currentEvents = []
  state.activeEvents = []
  state.resolvedEnding = null
  state.onboardingStep = 1
  state.history = []

  state.unlockedCardIds = new Set(
    CARDS.filter((c) => c.unlockCondition.type === 'always').map((c) => c.id),
  )

  drawHand()
}

export function advanceOnboarding(): void {
  if (state.onboardingStep === null) return
  if (state.onboardingStep >= 4) {
    state.onboardingStep = null
    return
  }
  state.onboardingStep++
}

export function skipOnboarding(): void {
  state.onboardingStep = null
}

// ── Exports ──────────────────────────────────────────────────────────────

export function useGame() {
  const year = computed(() => state.turn * 5)

  return {
    state,
    derived,
    year,
    startGame,
    startGameWithTutorial,
    beginTutorial,
    advanceOnboarding,
    skipOnboarding,
    dismissTransition,
    restartGame,
    goToMenu,
    startTurnEvents,
    chooseEvent,
    toggleCardSelection,
    canAfford,
    spendEnergyForExtraCard,
    spendEnergyForDiscount,
    confirmSelection,
    deactivateSlot,
    removeFromSlot,
    getProductionTotals,
  }
}
