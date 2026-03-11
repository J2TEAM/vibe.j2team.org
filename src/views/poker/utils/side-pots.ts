import type { PlayerStatus } from '../types'

export interface SidePot {
  amount: number
  eligibleIds: string[]
}

interface PotPlayer {
  id: string
  totalBet: number
  status: PlayerStatus
}

/**
 * Calculates main pot and side pots from player bets.
 * Returns an array of pots ordered from main to side.
 * Each pot lists the player IDs eligible to win it.
 *
 * Only returns multiple pots when all-in players create
 * different contribution levels. Returns empty array if no bets.
 */
export function calculateSidePots(players: PotPlayer[]): SidePot[] {
  const bettors = players.filter((p) => p.totalBet > 0)
  if (bettors.length === 0) return []

  const sorted = [...bettors].sort((a, b) => a.totalBet - b.totalBet)
  const pots: SidePot[] = []
  let prevBet = 0

  for (const player of sorted) {
    if (player.totalBet <= prevBet) continue
    const contribution = player.totalBet - prevBet
    const contributors = sorted.filter((p) => p.totalBet > prevBet)
    const amount = contribution * contributors.length
    const eligibleIds = contributors
      .filter((p) => p.status !== 'folded' && p.status !== 'out')
      .map((p) => p.id)

    if (amount > 0 && eligibleIds.length > 0) {
      pots.push({ amount, eligibleIds })
    }
    prevBet = player.totalBet
  }

  const merged: SidePot[] = []
  for (const pot of pots) {
    const last = merged[merged.length - 1]
    if (
      last &&
      last.eligibleIds.length === pot.eligibleIds.length &&
      last.eligibleIds.every((id) => pot.eligibleIds.includes(id))
    ) {
      last.amount += pot.amount
    } else {
      merged.push({ amount: pot.amount, eligibleIds: [...pot.eligibleIds] })
    }
  }

  return merged
}
