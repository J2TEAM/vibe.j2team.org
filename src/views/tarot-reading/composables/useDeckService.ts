// ──────────────────────────────────────────────
// DeckService — Single Responsibility Principle (SRP):
// This module handles ONLY randomness, shuffling, and drawing logic.
// It has no knowledge of UI state or presentation.
//
// Open-Closed Principle (OCP): new shuffle algorithms can be added
// as separate exported functions without modifying existing ones.
// ──────────────────────────────────────────────

import type { TarotCard, DrawnCard, SpreadPosition } from '../types'

/** Spread positions in order */
const SPREAD_POSITIONS: readonly SpreadPosition[] = ['past', 'present', 'future'] as const

/**
 * Fisher-Yates (Knuth) shuffle algorithm.
 * Time: O(n), Space: O(n) — creates a new array, does not mutate input.
 * Each permutation has equal probability of occurring.
 */
export function shuffleDeck(deck: readonly TarotCard[]): TarotCard[] {
  const shuffled = [...deck]

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    // Swap elements — semicolon prefix prevents ASI issues with destructuring
    const temp = shuffled[i]
    shuffled[i] = shuffled[j]!
    shuffled[j] = temp!
  }

  return shuffled
}

/**
 * Draw `count` cards from the top of the deck.
 * Returns drawn cards and the remaining deck (immutable — no side effects).
 */
export function drawCards(
  deck: readonly TarotCard[],
  count: number,
): { drawn: TarotCard[]; remaining: TarotCard[] } {
  const safeDraw = Math.min(count, deck.length)
  return {
    drawn: deck.slice(0, safeDraw),
    remaining: deck.slice(safeDraw),
  }
}

/**
 * Determine if a card appears reversed.
 * ~50% probability, consistent with traditional tarot practice.
 */
export function isReversed(): boolean {
  return Math.random() < 0.5
}

/**
 * Create a three-card spread from an array of drawn cards.
 * Maps the first 3 cards to past / present / future positions.
 * Each card independently has a ~50% chance of being reversed.
 */
export function createSpread(cards: readonly TarotCard[]): DrawnCard[] {
  return cards.slice(0, 3).map((card, index) => ({
    card,
    reversed: isReversed(),
    position: SPREAD_POSITIONS[index]!,
    flipped: false,
  }))
}
