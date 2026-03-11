import { reactive, ref, computed } from 'vue'
import type { GameState, Player, PlayerAction, FriendsConfig, GamePhase } from '../types'
import { calculateSidePots, type SidePot } from '../utils/side-pots'

let idCounter = 0
function makeId(): string {
  return `fp-${++idCounter}`
}

function createPlayer(name: string, chips: number, seatIndex: number): Player {
  return {
    id: makeId(),
    name,
    chips,
    holeCards: [],
    roundBet: 0,
    totalBet: 0,
    status: 'active',
    isBot: false,
    seatIndex,
    hasActed: false,
  }
}

const BLIND_TIERS = [5, 10, 25, 50, 100, 200, 500, 1000]

export function useFriendsGame() {
  const state = reactive<GameState>({
    phase: 'waiting',
    players: [],
    communityCards: [],
    pot: 0,
    currentBet: 0,
    activePlayerIndex: 0,
    dealerIndex: -1,
    winners: [],
    handNumber: 0,
    lastActionText: '',
    smallBlind: 10,
    bigBlind: 20,
    actionHistory: [],
  })

  const awaitingConfirm = ref(false)
  const nextPhaseLabel = ref('')
  const showdownPlayerIds = ref<string[]>([])
  const sidePots = ref<SidePot[]>([])
  let blindIncreaseHands = 0

  const activePlayer = computed(() => state.players[state.activePlayerIndex])

  function addHistory(text: string) {
    state.actionHistory.push(text)
    state.lastActionText = text
  }

  function getActiveFrom(startIndex: number): Player[] {
    const result: Player[] = []
    let idx = startIndex
    for (let i = 0; i < state.players.length; i++) {
      const p = state.players[idx]
      if (p && p.status !== 'out') result.push(p)
      idx = (idx + 1) % state.players.length
    }
    return result
  }

  function initGame(config: FriendsConfig) {
    state.players = config.playerNames.map((name, i) => createPlayer(name, config.startingChips, i))
    state.smallBlind = config.smallBlind
    state.bigBlind = config.smallBlind * 2
    state.dealerIndex = -1
    state.handNumber = 0
    state.phase = 'waiting'
    state.actionHistory = []
    state.communityCards = []
    state.pot = 0
    state.currentBet = 0
    state.winners = []
    state.lastActionText = ''
    blindIncreaseHands = config.blindIncreaseHands
    sidePots.value = []
    showdownPlayerIds.value = []
    awaitingConfirm.value = false
  }

  function startHand() {
    const alive = state.players.filter((p) => p.chips > 0 || p.status !== 'out')
    if (alive.length < 2) return

    state.handNumber++
    state.pot = 0
    state.currentBet = 0
    state.communityCards = []
    state.winners = []
    state.lastActionText = ''
    state.actionHistory = []
    awaitingConfirm.value = false
    showdownPlayerIds.value = []
    sidePots.value = []

    if (
      blindIncreaseHands > 0 &&
      state.handNumber > 1 &&
      (state.handNumber - 1) % blindIncreaseHands === 0
    ) {
      const currentIdx = BLIND_TIERS.indexOf(state.smallBlind)
      const nextIdx =
        currentIdx >= 0
          ? Math.min(currentIdx + 1, BLIND_TIERS.length - 1)
          : BLIND_TIERS.findIndex((t) => t > state.smallBlind)
      const newBlind = nextIdx >= 0 ? (BLIND_TIERS[nextIdx] ?? state.smallBlind) : state.smallBlind
      state.smallBlind = newBlind
      state.bigBlind = newBlind * 2
      addHistory(`Blinds tăng lên ${newBlind}/${newBlind * 2}!`)
    }

    for (const p of state.players) {
      p.roundBet = 0
      p.totalBet = 0
      p.hasActed = false
      p.holeCards = []
      p.status = p.chips > 0 ? 'active' : 'out'
    }

    const activePlayers = state.players.filter((p) => p.status !== 'out')
    if (activePlayers.length < 2) {
      state.phase = 'waiting'
      return
    }

    let dealerIdx = (state.dealerIndex + 1) % state.players.length
    while (state.players[dealerIdx]?.status === 'out') {
      dealerIdx = (dealerIdx + 1) % state.players.length
    }
    state.dealerIndex = dealerIdx

    const isHeadsUp = activePlayers.length === 2
    const dealStart = isHeadsUp ? state.dealerIndex : (state.dealerIndex + 1) % state.players.length
    const dealOrder = getActiveFrom(dealStart)

    const sbPlayer = dealOrder[0]
    const bbPlayer = dealOrder[1]

    if (sbPlayer && bbPlayer) {
      const sbAmount = Math.min(sbPlayer.chips, state.smallBlind)
      sbPlayer.chips -= sbAmount
      sbPlayer.roundBet = sbAmount
      sbPlayer.totalBet = sbAmount
      if (sbPlayer.chips === 0) sbPlayer.status = 'all-in'

      const bbAmount = Math.min(bbPlayer.chips, state.bigBlind)
      bbPlayer.chips -= bbAmount
      bbPlayer.roundBet = bbAmount
      bbPlayer.totalBet = bbAmount
      if (bbPlayer.chips === 0) bbPlayer.status = 'all-in'

      state.pot = sbAmount + bbAmount
      state.currentBet = bbAmount

      addHistory(`${sbPlayer.name} đặt SB ${sbAmount}`)
      addHistory(`${bbPlayer.name} đặt BB ${bbAmount}`)
    }

    const firstToAct = dealOrder.length > 2 ? dealOrder[2] : dealOrder[0]
    if (firstToAct) {
      state.activePlayerIndex = state.players.indexOf(firstToAct)
    }

    for (const p of dealOrder) p.hasActed = false
    state.phase = 'pre-flop'

    if (!state.players.some((p) => p.status === 'active')) {
      enterShowdown()
    }
  }

  function applyAction(playerId: string, action: PlayerAction) {
    const player = state.players.find((p) => p.id === playerId)
    if (!player || player.status !== 'active') return
    if (state.players.indexOf(player) !== state.activePlayerIndex) return
    if (awaitingConfirm.value) return

    const callAmount = state.currentBet - player.roundBet

    switch (action.type) {
      case 'fold':
        player.status = 'folded'
        player.hasActed = true
        addHistory(`${player.name}: Fold`)
        break

      case 'check':
        if (callAmount > 0) return
        player.hasActed = true
        addHistory(`${player.name}: Check`)
        break

      case 'call': {
        const amount = Math.min(callAmount, player.chips)
        player.chips -= amount
        player.roundBet += amount
        player.totalBet += amount
        state.pot += amount
        if (player.chips === 0) player.status = 'all-in'
        player.hasActed = true
        addHistory(`${player.name}: Call ${amount.toLocaleString()}`)
        break
      }

      case 'raise': {
        const targetBet = action.amount ?? state.currentBet * 2
        const clampedTarget = Math.min(targetBet, player.chips + player.roundBet)
        const toAdd = clampedTarget - player.roundBet
        if (toAdd <= 0 || clampedTarget <= state.currentBet) return
        player.chips -= toAdd
        state.pot += toAdd
        player.roundBet = clampedTarget
        player.totalBet += toAdd
        state.currentBet = clampedTarget
        if (player.chips === 0) player.status = 'all-in'
        player.hasActed = true
        for (const p of state.players) {
          if (p.id !== playerId && p.status === 'active') p.hasActed = false
        }
        addHistory(`${player.name}: Raise → ${clampedTarget.toLocaleString()}`)
        break
      }

      case 'all-in': {
        const amount = player.chips
        player.chips = 0
        player.roundBet += amount
        player.totalBet += amount
        state.pot += amount
        if (player.roundBet > state.currentBet) {
          state.currentBet = player.roundBet
          for (const p of state.players) {
            if (p.id !== playerId && p.status === 'active') p.hasActed = false
          }
        }
        player.status = 'all-in'
        player.hasActed = true
        addHistory(`${player.name}: All-in ${player.roundBet.toLocaleString()}`)
        break
      }
    }

    const remaining = state.players.filter((p) => p.status !== 'folded' && p.status !== 'out')
    if (remaining.length === 1 && remaining[0]) {
      remaining[0].chips += state.pot
      state.winners = [
        {
          playerId: remaining[0].id,
          playerName: remaining[0].name,
          amount: state.pot,
          handResult: null,
        },
      ]
      addHistory(`${remaining[0].name} thắng ${state.pot.toLocaleString()} (mọi người fold)`)
      state.pot = 0
      state.phase = 'showdown'
      return
    }

    if (isBettingRoundOver()) {
      advancePhase()
    } else {
      advanceActivePlayer()
    }
  }

  function isBettingRoundOver(): boolean {
    const active = state.players.filter((p) => p.status === 'active')
    if (active.length === 0) return true
    return active.every((p) => p.hasActed && p.roundBet === state.currentBet)
  }

  function advanceActivePlayer() {
    let next = (state.activePlayerIndex + 1) % state.players.length
    let tries = 0
    while (tries < state.players.length) {
      if (state.players[next]?.status === 'active') {
        state.activePlayerIndex = next
        return
      }
      next = (next + 1) % state.players.length
      tries++
    }
    advancePhase()
  }

  function advancePhase() {
    for (const p of state.players) {
      p.roundBet = 0
      p.hasActed = false
    }
    state.currentBet = 0

    const hasActive = state.players.some((p) => p.status === 'active')

    const nextPhaseMap: Record<string, { phase: GamePhase; label: string }> = {
      'pre-flop': { phase: 'flop', label: 'Lật Flop (3 lá bài chung)' },
      flop: { phase: 'turn', label: 'Lật Turn (1 lá bài chung)' },
      turn: { phase: 'river', label: 'Lật River (1 lá bài chung)' },
      river: { phase: 'showdown', label: 'Showdown' },
    }

    const next = nextPhaseMap[state.phase]
    if (!next) return

    if (next.phase === 'showdown' || !hasActive) {
      enterShowdown()
      return
    }

    state.phase = next.phase
    nextPhaseLabel.value = next.label
    awaitingConfirm.value = true
    addHistory(next.label)
  }

  function confirmNextPhase() {
    awaitingConfirm.value = false
    const firstActive = getActiveFrom((state.dealerIndex + 1) % state.players.length).find(
      (p) => p.status === 'active',
    )
    if (firstActive) {
      state.activePlayerIndex = state.players.indexOf(firstActive)
    }
    if (!state.players.some((p) => p.status === 'active')) {
      enterShowdown()
    }
  }

  function enterShowdown() {
    state.phase = 'showdown'
    awaitingConfirm.value = false
    showdownPlayerIds.value = state.players
      .filter((p) => p.status !== 'folded' && p.status !== 'out')
      .map((p) => p.id)
    sidePots.value = calculateSidePots(state.players)
    addHistory('Showdown — Chọn người thắng')
  }

  function awardWinners(winnerIds: string[]) {
    if (winnerIds.length === 0) return

    const pots =
      sidePots.value.length > 0
        ? sidePots.value
        : [{ amount: state.pot, eligibleIds: showdownPlayerIds.value }]

    const allWinnerAmounts = new Map<string, number>()

    for (const pot of pots) {
      const eligible = winnerIds.filter((id) => pot.eligibleIds.includes(id))
      if (eligible.length === 0) {
        const fallbackId = pot.eligibleIds[0]
        if (fallbackId) {
          const p = state.players.find((pl) => pl.id === fallbackId)
          if (p) {
            p.chips += pot.amount
            allWinnerAmounts.set(p.id, (allWinnerAmounts.get(p.id) ?? 0) + pot.amount)
          }
        }
        continue
      }

      const share = Math.floor(pot.amount / eligible.length)
      const remainder = pot.amount - share * eligible.length
      for (let i = 0; i < eligible.length; i++) {
        const id = eligible[i]!
        const p = state.players.find((pl) => pl.id === id)
        if (p) {
          const amt = share + (i === 0 ? remainder : 0)
          p.chips += amt
          allWinnerAmounts.set(p.id, (allWinnerAmounts.get(p.id) ?? 0) + amt)
        }
      }
    }

    state.winners = [...allWinnerAmounts.entries()].map(([id, amount]) => {
      const p = state.players.find((pl) => pl.id === id)
      return {
        playerId: id,
        playerName: p?.name ?? '',
        amount,
        handResult: null,
      }
    })

    const names = winnerIds
      .map((id) => state.players.find((p) => p.id === id)?.name)
      .filter(Boolean)
      .join(', ')
    addHistory(`${names} thắng ván #${state.handNumber}`)

    state.pot = 0
    sidePots.value = []
  }

  return {
    state,
    awaitingConfirm,
    nextPhaseLabel,
    showdownPlayerIds,
    sidePots,
    activePlayer,
    initGame,
    startHand,
    applyAction,
    confirmNextPhase,
    awardWinners,
  }
}
