import { ref, computed } from 'vue'
import type { Card, CardLevel, StudyConfig, HistoryEntry } from '../types'
import { updateCardLevel } from '../services/card-service'

export interface SessionStats {
  totalCards: number
  cardsReviewed: number
  cardsCorrect: number
  startedAt: number
  timeSpent: number
  levelBreakdown: Record<CardLevel, number>
}

export function useStudy(allCards: Card[], config: StudyConfig) {
  const currentRound = ref<1 | 2 | 3>(1)
  const roundCards = ref<Card[]>([])
  const currentIndex = ref(0)
  const isFlipped = ref(false)
  const history = ref<HistoryEntry[]>([])
  const status = ref<'studying' | 'completed'>('studying')
  const startedAt = Date.now()
  const cardsReviewed = ref(0)
  const cardsCorrect = ref(0)
  const roundCompleted = ref<1 | 2 | 3 | null>(null)
  const roundTotal = ref(0)

  // Track final levels for stats
  const cardLevels = ref<Map<string, CardLevel>>(new Map())

  function initRound() {
    const targetLevel = currentRound.value - 1
    let cards = allCards.filter((c) => {
      const currentLevel = cardLevels.value.get(c.id) ?? c.level
      return currentLevel === (targetLevel as CardLevel)
    })

    if (config.cardOrder === 'random') {
      cards = shuffle(cards)
    }

    roundCards.value = cards
    roundTotal.value = cards.length
    currentIndex.value = 0
    isFlipped.value = false
  }

  function shuffle<T>(arr: T[]): T[] {
    const result = [...arr]
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      const temp = result[i]!
      result[i] = result[j]!
      result[j] = temp
    }
    return result
  }

  // Determine which side to show first for the current card
  function getShowFrontFirst(): boolean {
    if (config.cardSide === 'front') return true
    if (config.cardSide === 'back') return false
    return Math.random() >= 0.5
  }

  const showFrontFirst = ref(getShowFrontFirst())

  const currentCard = computed<Card | null>(() => {
    if (status.value === 'completed') return null
    return roundCards.value[currentIndex.value] ?? null
  })

  const progress = computed(() => ({
    round: currentRound.value,
    remaining: roundCards.value.length,
    total: roundTotal.value,
  }))

  const canUndo = computed(() => history.value.length > 0)

  const sessionStats = computed<SessionStats>(() => {
    const breakdown: Record<CardLevel, number> = { 0: 0, 1: 0, 2: 0, 3: 0 }
    for (const level of cardLevels.value.values()) {
      breakdown[level]++
    }
    // Count cards not yet tracked
    for (const card of allCards) {
      if (!cardLevels.value.has(card.id)) {
        breakdown[card.level]++
      }
    }
    return {
      totalCards: allCards.length,
      cardsReviewed: cardsReviewed.value,
      cardsCorrect: cardsCorrect.value,
      startedAt,
      timeSpent: Date.now() - startedAt,
      levelBreakdown: breakdown,
    }
  })

  function flip() {
    isFlipped.value = !isFlipped.value
  }

  function advanceRound() {
    // Signal that this round was completed
    roundCompleted.value = currentRound.value

    if (currentRound.value < 3) {
      currentRound.value = (currentRound.value + 1) as 1 | 2 | 3
      initRound()
      if (roundCards.value.length === 0) {
        // No cards at this level, try next
        advanceRound()
      }
    } else {
      status.value = 'completed'
    }
  }

  function dismissRoundComplete() {
    roundCompleted.value = null
  }

  async function answerCorrect() {
    const card = currentCard.value
    if (!card) return

    const previousLevel = (cardLevels.value.get(card.id) ?? card.level) as CardLevel
    const newLevel = currentRound.value as CardLevel

    history.value.push({ cardId: card.id, previousLevel, wasCorrect: true })
    cardLevels.value.set(card.id, newLevel)
    cardsReviewed.value++
    cardsCorrect.value++

    // Persist to IndexedDB
    await updateCardLevel(card, newLevel)

    // Remove from round cards (promoted)
    roundCards.value.splice(currentIndex.value, 1)

    if (roundCards.value.length === 0) {
      advanceRound()
    } else {
      // Adjust index if needed
      if (currentIndex.value >= roundCards.value.length) {
        currentIndex.value = 0
      }
      isFlipped.value = false
      showFrontFirst.value = getShowFrontFirst()
    }
  }

  async function answerIncorrect() {
    const card = currentCard.value
    if (!card) return

    const previousLevel = (cardLevels.value.get(card.id) ?? card.level) as CardLevel

    history.value.push({ cardId: card.id, previousLevel, wasCorrect: false })
    cardsReviewed.value++

    // Move card to end of round
    roundCards.value.splice(currentIndex.value, 1)
    roundCards.value.push(card)

    if (currentIndex.value >= roundCards.value.length) {
      currentIndex.value = 0
    }
    isFlipped.value = false
    showFrontFirst.value = getShowFrontFirst()
  }

  async function undo() {
    const entry = history.value.pop()
    if (!entry) return

    // Restore card level
    cardLevels.value.set(entry.cardId, entry.previousLevel)
    cardsReviewed.value--
    if (entry.wasCorrect) {
      cardsCorrect.value--
    }

    const card = allCards.find((c) => c.id === entry.cardId)
    if (card) {
      await updateCardLevel(card, entry.previousLevel)

      // If we moved to a new round or completed, go back
      if (status.value === 'completed') {
        status.value = 'studying'
      }

      // Re-insert card into current round
      if (entry.wasCorrect) {
        // Card was removed (promoted), add it back
        roundCards.value.splice(currentIndex.value, 0, card)
      } else {
        // Card was moved to end, move it back to current position
        const endIndex = roundCards.value.findIndex((c) => c.id === card.id)
        if (endIndex !== -1) {
          roundCards.value.splice(endIndex, 1)
        }
        roundCards.value.splice(currentIndex.value, 0, card)
      }

      isFlipped.value = false
      showFrontFirst.value = getShowFrontFirst()
    }
  }

  // Initialize first round
  for (const card of allCards) {
    cardLevels.value.set(card.id, card.level)
  }
  initRound()

  // If no cards at level 0, find the first round that has cards
  if (roundCards.value.length === 0 && allCards.length > 0) {
    advanceRound()
  }

  return {
    currentCard,
    isFlipped,
    showFrontFirst,
    progress,
    canUndo,
    status,
    sessionStats,
    currentRound,
    roundCompleted,
    flip,
    answerCorrect,
    answerIncorrect,
    undo,
    dismissRoundComplete,
  }
}
