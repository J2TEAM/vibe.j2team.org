import type { Card, HandRank, HandResult } from '../types'

const RANK_NAMES: Record<HandRank, string> = {
  'royal-flush': 'Royal Flush',
  'straight-flush': 'Thùng Phá Sảnh',
  'four-of-a-kind': 'Tứ Quý',
  'full-house': 'Full House',
  flush: 'Thùng',
  straight: 'Sảnh',
  'three-of-a-kind': 'Tam Quý',
  'two-pair': 'Hai Đôi',
  pair: 'Một Đôi',
  'high-card': 'Bài Cao',
}

function getCombinations(cards: Card[], k: number): Card[][] {
  if (k === 0) return [[]]
  if (cards.length < k) return []
  const [first, ...rest] = cards as [Card, ...Card[]]
  const withFirst = getCombinations(rest, k - 1).map((combo) => [first, ...combo])
  const withoutFirst = getCombinations(rest, k)
  return [...withFirst, ...withoutFirst]
}

function rankFiveCards(five: Card[]): HandResult {
  const sorted = [...five].sort((a, b) => b.rank - a.rank)
  const ranks = sorted.map((c) => c.rank)
  const suits = sorted.map((c) => c.suit)

  const isFlush = suits.every((s) => s === suits[0])

  const isNormalStraight =
    ranks.length === 5 && ranks.every((r, i) => i === 0 || (ranks[i - 1] ?? 0) - r === 1)
  const isWheelStraight =
    ranks[0] === 14 && ranks[1] === 5 && ranks[2] === 4 && ranks[3] === 3 && ranks[4] === 2
  const isStraight = isNormalStraight || isWheelStraight

  const freq = new Map<number, number>()
  for (const r of ranks) freq.set(r, (freq.get(r) ?? 0) + 1)
  const freqEntries = [...freq.entries()].sort((a, b) => b[1] - a[1] || b[0] - a[0])

  const topFreq = freqEntries[0]
  const secondFreq = freqEntries[1]

  if (isFlush && isStraight) {
    const highCard = isWheelStraight ? 5 : (ranks[0] ?? 14)
    if (!isWheelStraight && ranks[0] === 14 && ranks[4] === 10) {
      return {
        rank: 'royal-flush',
        rankValue: 9,
        cards: sorted,
        tiebreakers: [9, 14],
        description: RANK_NAMES['royal-flush'],
      }
    }
    return {
      rank: 'straight-flush',
      rankValue: 8,
      cards: sorted,
      tiebreakers: [8, highCard],
      description: `${RANK_NAMES['straight-flush']} ${highCard} cao`,
    }
  }

  if (topFreq && topFreq[1] === 4) {
    const kicker = secondFreq?.[0] ?? 0
    return {
      rank: 'four-of-a-kind',
      rankValue: 7,
      cards: sorted,
      tiebreakers: [7, topFreq[0], kicker],
      description: `${RANK_NAMES['four-of-a-kind']} ${topFreq[0]}`,
    }
  }

  if (topFreq && topFreq[1] === 3 && secondFreq && secondFreq[1] === 2) {
    return {
      rank: 'full-house',
      rankValue: 6,
      cards: sorted,
      tiebreakers: [6, topFreq[0], secondFreq[0]],
      description: `${RANK_NAMES['full-house']} ${topFreq[0]}/${secondFreq[0]}`,
    }
  }

  if (isFlush) {
    return {
      rank: 'flush',
      rankValue: 5,
      cards: sorted,
      tiebreakers: [5, ...ranks],
      description: RANK_NAMES['flush'],
    }
  }

  if (isStraight) {
    const highCard = isWheelStraight ? 5 : (ranks[0] ?? 14)
    return {
      rank: 'straight',
      rankValue: 4,
      cards: sorted,
      tiebreakers: [4, highCard],
      description: `${RANK_NAMES['straight']} ${highCard} cao`,
    }
  }

  if (topFreq && topFreq[1] === 3) {
    const kickers = freqEntries.slice(1).map((e) => e[0])
    return {
      rank: 'three-of-a-kind',
      rankValue: 3,
      cards: sorted,
      tiebreakers: [3, topFreq[0], ...kickers],
      description: `${RANK_NAMES['three-of-a-kind']} ${topFreq[0]}`,
    }
  }

  if (topFreq && topFreq[1] === 2 && secondFreq && secondFreq[1] === 2) {
    const thirdFreq = freqEntries[2]
    const kicker = thirdFreq?.[0] ?? 0
    const highPair = Math.max(topFreq[0], secondFreq[0])
    const lowPair = Math.min(topFreq[0], secondFreq[0])
    return {
      rank: 'two-pair',
      rankValue: 2,
      cards: sorted,
      tiebreakers: [2, highPair, lowPair, kicker],
      description: `${RANK_NAMES['two-pair']} ${highPair} và ${lowPair}`,
    }
  }

  if (topFreq && topFreq[1] === 2) {
    const kickers = freqEntries.slice(1).map((e) => e[0])
    return {
      rank: 'pair',
      rankValue: 1,
      cards: sorted,
      tiebreakers: [1, topFreq[0], ...kickers],
      description: `${RANK_NAMES['pair']} ${topFreq[0]}`,
    }
  }

  return {
    rank: 'high-card',
    rankValue: 0,
    cards: sorted,
    tiebreakers: [0, ...ranks],
    description: `${RANK_NAMES['high-card']} ${ranks[0] ?? 0}`,
  }
}

export function compareHands(a: HandResult, b: HandResult): number {
  const len = Math.max(a.tiebreakers.length, b.tiebreakers.length)
  for (let i = 0; i < len; i++) {
    const av = a.tiebreakers[i] ?? 0
    const bv = b.tiebreakers[i] ?? 0
    if (av !== bv) return av - bv
  }
  return 0
}

export function bestHandFrom7(cards: Card[]): HandResult {
  const combos = getCombinations(cards, 5)
  let best: HandResult | null = null
  for (const combo of combos) {
    const result = rankFiveCards(combo)
    if (best === null || compareHands(result, best) > 0) {
      best = result
    }
  }
  return best ?? rankFiveCards(cards.slice(0, 5))
}

/**
 * Returns a 0–1 strength score calibrated for bot decisions:
 *   high-card ≈ 0.10–0.20
 *   pair      ≈ 0.30–0.50
 *   two-pair  ≈ 0.55–0.65
 *   trips     ≈ 0.65–0.75
 *   straight  ≈ 0.75–0.82
 *   flush     ≈ 0.80–0.88
 *   full-house≈ 0.88–0.93
 *   quads     ≈ 0.95–0.98
 *   sf / rf   ≈ 0.98–1.00
 */
export function handStrengthScore(holeCards: Card[], communityCards: Card[]): number {
  const all = [...holeCards, ...communityCards]
  if (all.length < 5) return estimatePreFlopStrength(holeCards)

  const result = bestHandFrom7(all)
  const rv = result.rankValue

  const baseScores: Record<number, [number, number]> = {
    0: [0.1, 0.22], // high-card
    1: [0.3, 0.52], // pair
    2: [0.55, 0.65], // two-pair
    3: [0.65, 0.76], // trips
    4: [0.76, 0.83], // straight
    5: [0.8, 0.88], // flush
    6: [0.88, 0.93], // full house
    7: [0.95, 0.98], // quads
    8: [0.98, 0.99], // straight flush
    9: [0.99, 1.0], // royal flush
  }

  const range = baseScores[rv] ?? [0.1, 0.2]
  const topCard = result.tiebreakers[1] ?? 7
  const cardFraction = Math.min(1, Math.max(0, (topCard - 2) / 12))
  return range[0] + (range[1] - range[0]) * cardFraction
}

/**
 * Pre-flop hand strength using a simplified Chen formula.
 * Returns 0.15–0.90 for typical hands (AA ≈ 0.88, 72o ≈ 0.15).
 */
function estimatePreFlopStrength(holeCards: Card[]): number {
  if (holeCards.length !== 2) return 0.3
  const c1 = holeCards[0]
  const c2 = holeCards[1]
  if (!c1 || !c2) return 0.3

  const high = Math.max(c1.rank, c2.rank)
  const low = Math.min(c1.rank, c2.rank)
  const suited = c1.suit === c2.suit
  const paired = c1.rank === c2.rank
  const gap = high - low

  let score = 0

  if (paired) {
    score = high * 2
    if (score < 5) score = 5
  } else {
    score = high
    if (high === 14) score = 10
    else if (high === 13) score = 8
    else if (high === 12) score = 7
    else if (high === 11) score = 6
  }

  if (suited) score += 2

  if (!paired) {
    if (gap === 1) score += 1
    else if (gap === 2) score -= 1
    else if (gap === 3) score -= 2
    else if (gap === 4) score -= 4
    else if (gap >= 5) score -= 5
  }

  // Normalize to 0–1 range (max possible ≈ 28 for AA, min ≈ -1 for 72o)
  return Math.max(0.1, Math.min(0.92, (score + 2) / 30))
}

export { rankFiveCards }
