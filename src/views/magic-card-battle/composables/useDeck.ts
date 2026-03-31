import { ref } from 'vue'
import type { CardData } from '../types'

export function useDeck() {
  const allCards = ref<CardData[]>([])
  const isLoaded = ref(false)

  // Lazy load cards from public JSON
  async function loadCards(): Promise<void> {
    if (isLoaded.value) return
    const response = await fetch('/magic-card-battle/cards.json')
    allCards.value = (await response.json()) as CardData[]
    isLoaded.value = true
  }

  // Fisher-Yates shuffle
  function shuffle<T>(array: T[]): T[] {
    const arr = [...array]
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[arr[i], arr[j]] = [arr[j]!, arr[i]!]
    }
    return arr
  }

  // Build a random 30-card deck
  function buildRandomDeck(): CardData[] {
    const pool = shuffle(allCards.value)
    // Ensure at least some creatures, spells, and variety
    const creatures = pool.filter((c) => c.type === 'creature')
    const spells = pool.filter((c) => c.type === 'spell')
    const others = pool.filter((c) => c.type !== 'creature' && c.type !== 'spell')

    const deck: CardData[] = []
    // 12-15 creatures
    const creatureCount = 12 + Math.floor(Math.random() * 4)
    deck.push(...shuffle(creatures).slice(0, creatureCount))
    // 8-10 spells
    const spellCount = 8 + Math.floor(Math.random() * 3)
    deck.push(...shuffle(spells).slice(0, spellCount))
    // Fill rest with others
    const remaining = 30 - deck.length
    deck.push(...shuffle(others).slice(0, remaining))

    return shuffle(deck)
  }

  // Draw cards from a deck
  function drawCards(
    deck: CardData[],
    count: number,
  ): { drawn: CardData[]; remaining: CardData[] } {
    const drawn = deck.slice(0, count)
    const remaining = deck.slice(count)
    return { drawn, remaining }
  }

  return {
    allCards,
    isLoaded,
    loadCards,
    shuffle,
    buildRandomDeck,
    drawCards,
  }
}
