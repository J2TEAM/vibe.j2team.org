import { reactive, ref, computed, onUnmounted } from 'vue'
import type { GameState, Player, PlayerAction, LobbyConfig } from '../types'
import { createDeck, shuffleDeck } from '../utils/deck'
import { bestHandFrom7, compareHands } from '../utils/hand-evaluator'
import { calculateSidePots } from '../utils/side-pots'
import { decideBotAction } from './use-bot-player'

let playerIdCounter = 0

function makeId(prefix: string): string {
  return `${prefix}-${++playerIdCounter}`
}

function createPlayer(
  name: string,
  chips: number,
  seatIndex: number,
  isBot: boolean,
  id?: string,
): Player {
  return {
    id: id ?? makeId(isBot ? 'bot' : 'human'),
    name,
    chips,
    holeCards: [],
    roundBet: 0,
    totalBet: 0,
    status: 'active',
    isBot,
    seatIndex,
    hasActed: false,
  }
}

const BOT_NAMES = [
  'Long',
  'Hoàng',
  'Hữu',
  'Thành',
  'Minh',
  'Sơn',
  'Ngọc',
  'Vũ',
  'Khanh',
  'Nghĩa',
  'Cương',
]

const BLIND_TIERS = [5, 10, 25, 50, 100, 200, 500, 1000]

export function usePokerGame() {
  const state = reactive<GameState>({
    phase: 'waiting',
    players: [],
    communityCards: [],
    pot: 0,
    currentBet: 0,
    activePlayerIndex: 0,
    dealerIndex: 0,
    winners: [],
    handNumber: 0,
    lastActionText: '',
    smallBlind: 10,
    bigBlind: 20,
    actionHistory: [],
  })

  const localPlayerIdRef = ref('')
  let deck: ReturnType<typeof createDeck> = []
  let botTimeout: ReturnType<typeof setTimeout> | null = null
  let blindIncreaseHands = 0

  const localPlayerId = computed(() => localPlayerIdRef.value)
  const activePlayer = computed(() => state.players[state.activePlayerIndex])
  const isMyTurn = computed(() => {
    const p = activePlayer.value
    return (
      !!p &&
      p.id === localPlayerIdRef.value &&
      state.phase !== 'waiting' &&
      state.phase !== 'showdown'
    )
  })

  function addHistory(text: string) {
    state.actionHistory.push(text)
    state.lastActionText = text
  }

  function initGame(config: LobbyConfig) {
    const newHostId = makeId('host')
    localPlayerIdRef.value = newHostId
    blindIncreaseHands = config.blindIncreaseHands

    state.smallBlind = config.smallBlind
    state.bigBlind = config.smallBlind * 2
    state.players = []
    state.phase = 'waiting'
    state.handNumber = 0
    state.winners = []
    state.communityCards = []
    state.pot = 0
    state.currentBet = 0
    state.actionHistory = []

    state.players.push(createPlayer(config.playerName, config.startingChips, 0, false, newHostId))

    const usedNames = new Set([config.playerName])
    const shuffledBotNames = [...BOT_NAMES].sort(() => Math.random() - 0.5)
    let botNameIndex = 0
    for (let i = 0; i < config.botCount; i++) {
      while (
        botNameIndex < shuffledBotNames.length &&
        usedNames.has(shuffledBotNames[botNameIndex] ?? '')
      ) {
        botNameIndex++
      }
      const botName = shuffledBotNames[botNameIndex] ?? `Bot ${i + 1}`
      botNameIndex++
      state.players.push(createPlayer(botName, config.startingChips, i + 1, true))
    }
  }

  function startHand() {
    if (state.players.length < 2) return

    state.handNumber++
    state.communityCards = []
    state.pot = 0
    state.currentBet = 0
    state.winners = []
    state.actionHistory = []
    state.lastActionText = ''

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

    state.players = state.players.filter((p) => p.chips > 0 || p.id === localPlayerIdRef.value)

    for (const p of state.players) {
      p.holeCards = []
      p.roundBet = 0
      p.totalBet = 0
      p.hasActed = false
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

    deck = shuffleDeck(createDeck())

    const isHeadsUp = activePlayers.length === 2
    const dealStart = isHeadsUp ? state.dealerIndex : (state.dealerIndex + 1) % state.players.length

    const dealOrder = getActivePlayersCyclicFrom(dealStart)

    for (const p of dealOrder) {
      p.holeCards = [dealCard(), dealCard()]
    }

    const sbPlayer = dealOrder[0]
    const bbPlayer = dealOrder[1]

    if (sbPlayer && bbPlayer) {
      const sbAmount = Math.min(sbPlayer.chips, state.smallBlind)
      const bbAmount = Math.min(bbPlayer.chips, state.bigBlind)

      sbPlayer.chips -= sbAmount
      sbPlayer.roundBet = sbAmount
      sbPlayer.totalBet = sbAmount
      if (sbPlayer.chips === 0) sbPlayer.status = 'all-in'

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

    for (const p of dealOrder) {
      p.hasActed = false
    }

    state.phase = 'pre-flop'
    scheduleNextAction()
  }

  function dealCard() {
    const card = deck.pop()
    if (!card) throw new Error('Deck empty')
    return card
  }

  function getActivePlayersCyclicFrom(startIndex: number): Player[] {
    const result: Player[] = []
    let idx = startIndex
    for (let i = 0; i < state.players.length; i++) {
      const p = state.players[idx]
      if (p && p.status !== 'out') result.push(p)
      idx = (idx + 1) % state.players.length
    }
    return result
  }

  function applyAction(playerId: string, action: PlayerAction) {
    const player = state.players.find((p) => p.id === playerId)
    if (!player || player.status !== 'active') return

    const playerIdx = state.players.indexOf(player)
    if (playerIdx !== state.activePlayerIndex) return

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
      addHistory(`${remaining[0].name} thắng ${state.pot.toLocaleString()}`)
      state.pot = 0
      state.phase = 'showdown'
      return
    }

    if (isBettingRoundOver()) {
      advancePhase()
    } else {
      advanceActivePlayer()
      scheduleNextAction()
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

    switch (state.phase) {
      case 'pre-flop':
        state.phase = 'flop'
        state.communityCards.push(dealCard(), dealCard(), dealCard())
        break
      case 'flop':
        state.phase = 'turn'
        state.communityCards.push(dealCard())
        break
      case 'turn':
        state.phase = 'river'
        state.communityCards.push(dealCard())
        break
      case 'river':
        resolveShowdown()
        return
      default:
        return
    }

    const firstActive = getActivePlayersCyclicFrom(
      (state.dealerIndex + 1) % state.players.length,
    ).find((p) => p.status === 'active')
    if (firstActive) {
      state.activePlayerIndex = state.players.indexOf(firstActive)
    }

    if (!state.players.some((p) => p.status === 'active')) {
      advancePhase()
      return
    }

    scheduleNextAction()
  }

  function resolveShowdown() {
    state.phase = 'showdown'

    const contenders = state.players.filter((p) => p.status !== 'folded' && p.status !== 'out')

    if (contenders.length === 0) return

    if (contenders.length === 1 && contenders[0]) {
      contenders[0].chips += state.pot
      state.winners = [
        {
          playerId: contenders[0].id,
          playerName: contenders[0].name,
          amount: state.pot,
          handResult: null,
        },
      ]
      state.pot = 0
      return
    }

    const pots = calculateSidePots(state.players)

    if (pots.length <= 1) {
      const handResults = contenders.map((p) => ({
        player: p,
        result: bestHandFrom7([...p.holeCards, ...state.communityCards]),
      }))
      handResults.sort((a, b) => compareHands(b.result, a.result))

      const best = handResults[0]
      if (!best) return

      const winners = handResults.filter((h) => compareHands(h.result, best.result) === 0)
      const share = Math.floor(state.pot / winners.length)
      const remainder = state.pot - share * winners.length

      for (let i = 0; i < winners.length; i++) {
        const w = winners[i]
        if (!w) continue
        w.player.chips += share + (i === 0 ? remainder : 0)
      }

      state.winners = winners.map((w) => ({
        playerId: w.player.id,
        playerName: w.player.name,
        amount: share,
        handResult: w.result,
      }))
    } else {
      const allWinnerAmounts = new Map<
        string,
        { amount: number; result: ReturnType<typeof bestHandFrom7> | null }
      >()

      for (const pot of pots) {
        const eligible = contenders.filter((p) => pot.eligibleIds.includes(p.id))
        if (eligible.length === 0) continue

        const handResults = eligible.map((p) => ({
          player: p,
          result: bestHandFrom7([...p.holeCards, ...state.communityCards]),
        }))
        handResults.sort((a, b) => compareHands(b.result, a.result))

        const best = handResults[0]
        if (!best) continue

        const winners = handResults.filter((h) => compareHands(h.result, best.result) === 0)
        const share = Math.floor(pot.amount / winners.length)
        const remainder = pot.amount - share * winners.length

        for (let i = 0; i < winners.length; i++) {
          const w = winners[i]
          if (!w) continue
          const amt = share + (i === 0 ? remainder : 0)
          w.player.chips += amt
          const existing = allWinnerAmounts.get(w.player.id)
          if (existing) {
            existing.amount += amt
          } else {
            allWinnerAmounts.set(w.player.id, { amount: amt, result: w.result })
          }
        }
      }

      state.winners = [...allWinnerAmounts.entries()].map(([id, data]) => {
        const p = state.players.find((pl) => pl.id === id)
        return {
          playerId: id,
          playerName: p?.name ?? '',
          amount: data.amount,
          handResult: data.result,
        }
      })
    }

    state.pot = 0
  }

  function scheduleNextAction() {
    const player = state.players[state.activePlayerIndex]
    if (!player?.isBot || state.phase === 'showdown' || state.phase === 'waiting') return

    if (botTimeout) clearTimeout(botTimeout)
    const delay = 600 + Math.random() * 1000
    botTimeout = setTimeout(() => {
      const current = state.players[state.activePlayerIndex]
      if (
        current?.isBot &&
        current.status === 'active' &&
        state.phase !== 'showdown' &&
        state.phase !== 'waiting'
      ) {
        applyAction(current.id, decideBotAction(current, state))
      }
    }, delay)
  }

  onUnmounted(() => {
    if (botTimeout) clearTimeout(botTimeout)
  })

  return {
    state,
    localPlayerId,
    isMyTurn,
    activePlayer,
    initGame,
    startHand,
    applyAction,
  }
}
