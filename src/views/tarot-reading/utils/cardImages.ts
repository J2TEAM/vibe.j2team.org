import type { TarotCard } from '../types'

const BASE = '/tarot-cards'

// ── Major Arcana filename lookup (id → filename without extension) ──

const MAJOR_ARCANA_FILENAMES: Record<number, string> = {
  0: '00-TheFool',
  1: '01-TheMagician',
  2: '02-TheHighPriestess',
  3: '03-TheEmpress',
  4: '04-TheEmperor',
  5: '05-TheHierophant',
  6: '06-TheLovers',
  7: '07-TheChariot',
  8: '08-Strength',
  9: '09-TheHermit',
  10: '10-WheelOfFortune',
  11: '11-Justice',
  12: '12-TheHangedMan',
  13: '13-Death',
  14: '14-Temperance',
  15: '15-TheDevil',
  16: '16-TheTower',
  17: '17-TheStar',
  18: '18-TheMoon',
  19: '19-TheSun',
  20: '20-Judgement',
  21: '21-TheWorld',
}

// ── Minor Arcana rank names (number → English rank in filename) ──

const RANK_NAMES: Record<number, string> = {
  1: 'Ace',
  2: 'Two',
  3: 'Three',
  4: 'Four',
  5: 'Five',
  6: 'Six',
  7: 'Seven',
  8: 'Eight',
  9: 'Nine',
  10: 'Ten',
  11: 'Pace', // Asset files use "Pace" for Page
  12: 'Knight',
  13: 'Queen',
  14: 'King',
}

// Suit names as used in the asset filenames (some singular, some plural)
const SUIT_FILE_SUFFIXES: Record<string, string> = {
  wands: 'wand',
  cups: 'cups',
  swords: 'sword',
  pentacles: 'pentacles',
}

/**
 * Get the public URL for a tarot card image.
 * Returns empty string if no matching image is found.
 */
export function getCardImageUrl(card: TarotCard): string {
  if (card.arcana === 'major') {
    const base = MAJOR_ARCANA_FILENAMES[card.id]
    if (!base) return ''
    return `${BASE}/majorArcana/${base}.png`
  }

  if (!card.suit || !card.number) return ''
  const rank = RANK_NAMES[card.number]
  const suitSuffix = SUIT_FILE_SUFFIXES[card.suit]
  if (!rank || !suitSuffix) return ''
  return `${BASE}/${card.suit}/${rank}_of_${suitSuffix}.png`
}

/** Get the public URL for the card back image */
export function getCardBackUrl(): string {
  return `${BASE}/CardBacks.png`
}
