// ──────────────────────────────────────────────
// Type definitions for the Tarot Reading app
// ──────────────────────────────────────────────

/** Four suits of the Minor Arcana */
export type Suit = 'wands' | 'cups' | 'swords' | 'pentacles'

/** Major vs Minor classification */
export type Arcana = 'major' | 'minor'

/**
 * A single tarot card definition.
 * Follows Interface Segregation (ISP): only required fields for all cards,
 * optional fields for minor-arcana-specific data.
 */
export interface TarotCard {
  id: number
  name: string
  arcana: Arcana
  keywords: string[]
  uprightMeaning: string
  reversedMeaning: string
  /** Only present for Minor Arcana cards */
  suit?: Suit
  /** Numeric value: 1=Ace, 11=Page, 12=Knight, 13=Queen, 14=King */
  number?: number
}

/** Position in the three-card spread */
export type SpreadPosition = 'past' | 'present' | 'future'

/** A card that has been drawn into the spread */
export interface DrawnCard {
  card: TarotCard
  reversed: boolean
  position: SpreadPosition
  flipped: boolean
}

/** Application phase / screen state */
export type AppPhase = 'landing' | 'deck' | 'spread'
