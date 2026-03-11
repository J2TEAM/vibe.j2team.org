// ──────────────────────────────────────────────
// Card image resolver — maps card IDs to their image URLs.
//
// Uses Vite's import.meta.glob to eagerly import all card PNGs.
// This ensures images are properly bundled and cache-busted.
// ──────────────────────────────────────────────

import type { TarotCard } from '../types'

// Eagerly import all card images — Vite resolves these at build time
const imageModules = import.meta.glob<string>('../assets/images/**/*.png', {
  eager: true,
  import: 'default',
})

// Build a flat map: filename → resolved asset URL
const imageByFilename = new Map<string, string>()
for (const [path, url] of Object.entries(imageModules)) {
  const filename = path.split('/').pop()
  if (filename) {
    imageByFilename.set(filename, url)
  }
}

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
 * Get the resolved image URL for a tarot card.
 * Returns empty string if no matching image is found.
 */
export function getCardImageUrl(card: TarotCard): string {
  let filename: string

  if (card.arcana === 'major') {
    // Major Arcana: "00-TheFool.png"
    const base = MAJOR_ARCANA_FILENAMES[card.id]
    if (!base) return ''
    filename = `${base}.png`
  } else {
    // Minor Arcana: "Ace_of_wand.png"
    if (!card.suit || !card.number) return ''
    const rank = RANK_NAMES[card.number]
    const suitSuffix = SUIT_FILE_SUFFIXES[card.suit]
    if (!rank || !suitSuffix) return ''
    filename = `${rank}_of_${suitSuffix}.png`
  }

  return imageByFilename.get(filename) ?? ''
}

/** Get the resolved URL for the card back image */
export function getCardBackUrl(): string {
  return imageByFilename.get('CardBacks.png') ?? ''
}
