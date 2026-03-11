/**
 * Adaptive bot AI for Texas Hold'em.
 * Automatically adjusts play style based on table size:
 *   - Heads-up (1v1): plays ~85-90% of hands, very aggressive
 *   - Short-handed (3p): plays ~65-70% of hands
 *   - Full table (4-6p): plays ~50-55% of hands
 */
import type { GameState, Player, PlayerAction } from '../types'
import { handStrengthScore } from '../utils/hand-evaluator'

function rand(min: number, max: number): number {
  return Math.random() * (max - min) + min
}

function randInt(min: number, max: number): number {
  return Math.floor(rand(min, max + 1))
}

export function decideBotAction(player: Player, state: GameState): PlayerAction {
  const strength = handStrengthScore(player.holeCards, state.communityCards)
  const noise = rand(-0.05, 0.05)
  const effective = Math.max(0, Math.min(1, strength + noise))

  const callAmount = state.currentBet - player.roundBet
  const canCheck = callAmount === 0
  const potSize = Math.max(1, state.pot)
  const potOdds = callAmount > 0 ? callAmount / (potSize + callAmount) : 0

  const isPreFlop = state.communityCards.length === 0
  const rng = Math.random()

  const opponents = state.players.filter(
    (p) => p.id !== player.id && p.status !== 'out' && p.status !== 'folded',
  ).length
  const isHeadsUp = opponents <= 1
  const isShortHanded = opponents <= 2
  const L = isHeadsUp ? 0.22 : isShortHanded ? 0.1 : 0

  // ── PRE-FLOP ────────────────────────────────────────────────────────────────

  if (isPreFlop) {
    if (canCheck) {
      if (effective > 0.5 - L && rng < 0.7) {
        const raiseAmt = state.bigBlind * randInt(2, 3)
        return makeRaise(player, state, raiseAmt)
      }
      return { type: 'check' }
    }

    const adj = effective + L

    if (adj >= 0.65) {
      if (rng < 0.55) {
        return makeRaise(player, state, callAmount + state.bigBlind * randInt(2, 4))
      }
      return { type: 'call' }
    }

    if (adj >= 0.38) {
      if (callAmount <= state.bigBlind * 5) {
        if (rng < 0.2) return makeRaise(player, state, callAmount + state.bigBlind * 2)
        return { type: 'call' }
      }
      return rng < 0.5 ? { type: 'call' } : { type: 'fold' }
    }

    if (adj >= 0.2) {
      if (callAmount <= state.bigBlind * 2) {
        return rng < 0.75 ? { type: 'call' } : { type: 'fold' }
      }
      if (callAmount <= state.bigBlind * 3) {
        return rng < 0.45 ? { type: 'call' } : { type: 'fold' }
      }
      return rng < 0.2 ? { type: 'call' } : { type: 'fold' }
    }

    if (isHeadsUp && callAmount <= state.bigBlind && rng < 0.45) {
      return { type: 'call' }
    }
    if (rng < 0.07) {
      return makeRaise(player, state, state.bigBlind * randInt(3, 5))
    }
    return { type: 'fold' }
  }

  // ── POST-FLOP (can check) ─────────────────────────────────────────────────

  if (canCheck) {
    if (effective >= 0.65) {
      if (rng < 0.25) return { type: 'check' }
      const betSize = Math.floor(potSize * rand(0.4, 0.7))
      return makeRaise(player, state, betSize)
    }

    if (effective >= 0.35) {
      const cbetFreq = isHeadsUp ? 0.75 : isShortHanded ? 0.65 : 0.55
      if (rng < cbetFreq) {
        const betSize = Math.floor(potSize * rand(0.3, 0.55))
        return makeRaise(player, state, betSize)
      }
      return { type: 'check' }
    }

    if (effective >= 0.18) {
      const bluffFreq = isHeadsUp ? 0.45 : isShortHanded ? 0.32 : 0.22
      if (rng < bluffFreq) {
        const betSize = Math.floor(potSize * rand(0.3, 0.5))
        return makeRaise(player, state, betSize)
      }
      return { type: 'check' }
    }

    const pureBluffFreq = isHeadsUp ? 0.25 : 0.15
    if (rng < pureBluffFreq) {
      const betSize = Math.floor(potSize * rand(0.35, 0.65))
      return makeRaise(player, state, betSize)
    }
    return { type: 'check' }
  }

  // ── FACING A BET POST-FLOP ────────────────────────────────────────────────

  if (effective >= 0.7) {
    if (rng < 0.55) {
      return makeRaise(player, state, callAmount + Math.floor(potSize * rand(0.5, 1.0)))
    }
    return makeCall(player, callAmount)
  }

  if (effective >= 0.42) {
    if (rng < 0.22) {
      return makeRaise(player, state, callAmount + Math.floor(potSize * rand(0.4, 0.7)))
    }
    return makeCall(player, callAmount)
  }

  if (effective >= 0.22) {
    const priceOk = potOdds < effective + 0.18
    if (priceOk) return makeCall(player, callAmount)
    if (rng < 0.12) {
      return makeRaise(player, state, callAmount + Math.floor(potSize * rand(0.5, 0.8)))
    }
    const stubbornFreq = isHeadsUp ? 0.4 : isShortHanded ? 0.25 : 0.12
    if (rng < stubbornFreq) return makeCall(player, callAmount)
    return { type: 'fold' }
  }

  if (rng < 0.07) {
    return makeRaise(player, state, callAmount + Math.floor(potSize * rand(0.6, 1.0)))
  }
  const heroFreq = isHeadsUp ? 0.32 : 0.15
  if (rng < heroFreq && potOdds < 0.35) return makeCall(player, callAmount)
  return { type: 'fold' }
}

function makeCall(player: Player, callAmount: number): PlayerAction {
  if (callAmount >= player.chips) return { type: 'all-in' }
  return { type: 'call' }
}

function makeRaise(player: Player, state: GameState, amount: number): PlayerAction {
  const minRaise = state.currentBet + state.bigBlind
  const maxRaise = player.chips + player.roundBet
  const target = Math.max(minRaise, Math.min(maxRaise, state.currentBet + amount))

  if (target >= player.chips + player.roundBet) return { type: 'all-in' }
  if (target <= state.currentBet) return { type: 'call' }
  return { type: 'raise', amount: target }
}
