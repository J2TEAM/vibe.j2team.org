// ──────────────────────────────────────────────
// Pinia Store — orchestrates UI state for the tarot reading.
//
// Single Responsibility (SRP): the store manages application state only.
// All shuffle/draw logic is delegated to DeckService (separation of concerns).
// All reading text generation is delegated to ReadingSynthesis.
//
// Dependency Inversion (DIP): the store depends on abstractions
// (imported functions) rather than implementing logic directly.
// ──────────────────────────────────────────────

import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { allCards } from '../data/tarot-cards'
import { shuffleDeck, drawCards, createSpread } from '../composables/useDeckService'
import { synthesizeReading } from '../composables/useReadingSynthesis'
import type { TarotCard, DrawnCard, AppPhase } from '../types'

export const useTarotStore = defineStore('tarot-reading', () => {
  // ── State ──

  /** Current phase of the application flow */
  const phase = ref<AppPhase>('landing')

  /** The full deck of cards (shuffled or unshuffled) */
  const deck = ref<TarotCard[]>([...allCards])

  /** The three cards drawn into the spread */
  const spread = ref<DrawnCard[]>([])

  /** How many times the deck has been shuffled this session */
  const shuffleCount = ref(0)

  /** Whether the shuffle animation is currently playing */
  const isAnimating = ref(false)

  // ── Computed ──

  /** True when all three spread cards have been flipped face-up */
  const allFlipped = computed(
    () => spread.value.length === 3 && spread.value.every((c) => c.flipped),
  )

  /** Number of cards that have been flipped so far */
  const flippedCount = computed(() => spread.value.filter((c) => c.flipped).length)

  /** The synthesized reading text (only available when all cards are flipped) */
  const reading = computed(() => (allFlipped.value ? synthesizeReading(spread.value) : []))

  // ── Actions ──

  /** Transition from landing to the deck/shuffle phase */
  function startReading() {
    phase.value = 'deck'
  }

  /** Shuffle the deck using Fisher-Yates and increment counter */
  function shuffle() {
    deck.value = shuffleDeck(deck.value)
    shuffleCount.value++
  }

  /** Draw three cards from the deck and create the spread */
  function dealCards() {
    const { drawn, remaining } = drawCards(deck.value, 3)
    deck.value = remaining
    spread.value = createSpread(drawn)
    phase.value = 'spread'
  }

  /** Flip a single card by index (0, 1, or 2) */
  function flipCard(index: number) {
    const card = spread.value[index]
    if (!card || card.flipped) return
    card.flipped = true
  }

  /** Set animation state (used by components to coordinate transitions) */
  function setAnimating(value: boolean) {
    isAnimating.value = value
  }

  /** Reset everything back to the landing screen */
  function reset() {
    phase.value = 'landing'
    deck.value = [...allCards]
    spread.value = []
    shuffleCount.value = 0
    isAnimating.value = false
  }

  return {
    // State
    phase,
    deck,
    spread,
    shuffleCount,
    isAnimating,
    // Computed
    allFlipped,
    flippedCount,
    reading,
    // Actions
    startReading,
    shuffle,
    dealCards,
    flipCard,
    setAnimating,
    reset,
  }
})
