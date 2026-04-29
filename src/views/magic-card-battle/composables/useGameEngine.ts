import { ref, computed } from 'vue'
import type {
  GameState,
  PlayerState,
  BoardCreature,
  PlayerSide,
  GameLogEntry,
  AIDifficulty,
} from '../types'
import { useDeck } from './useDeck'
import { useCardEffects } from './useCardEffects'

function createEmptyPlayer(): PlayerState {
  return {
    hp: 30,
    maxHp: 30,
    mana: 0,
    maxMana: 0,
    deck: [],
    hand: [],
    board: [null, null, null, null, null],
    traps: [],
    graveyard: [],
  }
}

export function useGameEngine() {
  const { loadCards, buildRandomDeck, drawCards: deckDraw } = useDeck()
  const { createBoardCreature, applyEffect, removeDeadCreatures, resolveCombat, attackHero } =
    useCardEffects()

  const gameState = ref<GameState>({
    phase: 'lobby',
    turnPhase: 'start',
    currentTurn: 'player',
    turnNumber: 0,
    player: createEmptyPlayer(),
    opponent: createEmptyPlayer(),
    environment: { card: null, owner: null },
    winner: null,
    log: [],
  })

  const isLoading = ref(false)
  const selectedCardIndex = ref<number | null>(null)
  const selectedBoardIndex = ref<number | null>(null)
  const attackingIndex = ref<number | null>(null)
  const difficulty = ref<AIDifficulty>('normal')

  const isPlayerTurn = computed(() => gameState.value.currentTurn === 'player')
  const isGameOver = computed(() => gameState.value.phase === 'game_over')

  function addLog(side: PlayerSide, message: string, type: GameLogEntry['type'] = 'system') {
    gameState.value.log.push({
      turn: gameState.value.turnNumber,
      side,
      message,
      type,
    })
    // Keep only last 50 entries
    if (gameState.value.log.length > 50) {
      gameState.value.log = gameState.value.log.slice(-50)
    }
  }

  function checkWinCondition(): boolean {
    if (gameState.value.player.hp <= 0) {
      gameState.value.winner = 'opponent'
      gameState.value.phase = 'game_over'
      addLog('opponent', '🏆 AI THẮNG! Hero bạn đã gục ngã.', 'system')
      return true
    }
    if (gameState.value.opponent.hp <= 0) {
      gameState.value.winner = 'player'
      gameState.value.phase = 'game_over'
      addLog('player', '🏆 BẠN THẮNG! Hero đối thủ đã gục ngã!', 'system')
      return true
    }
    return false
  }

  // Start a new game
  async function startGame(diff: AIDifficulty = 'normal') {
    isLoading.value = true
    difficulty.value = diff
    await loadCards()

    const gs = gameState.value
    gs.phase = 'play'
    gs.turnPhase = 'main'
    gs.currentTurn = 'player'
    gs.turnNumber = 1
    gs.winner = null
    gs.log = []

    // Setup player
    gs.player = createEmptyPlayer()
    gs.player.deck = buildRandomDeck()
    gs.player.maxMana = 1
    gs.player.mana = 1
    const playerDraw = deckDraw(gs.player.deck, 4)
    gs.player.hand = playerDraw.drawn
    gs.player.deck = playerDraw.remaining

    // Setup opponent
    gs.opponent = createEmptyPlayer()
    gs.opponent.deck = buildRandomDeck()
    gs.opponent.maxMana = 1
    gs.opponent.mana = 1
    const oppDraw = deckDraw(gs.opponent.deck, 4)
    gs.opponent.hand = oppDraw.drawn
    gs.opponent.deck = oppDraw.remaining

    gs.environment = { card: null, owner: null }

    addLog('player', '⚔️ TRẬN ĐẤU BẮT ĐẦU! Lượt của bạn.', 'system')
    isLoading.value = false
  }

  // Play a card from hand
  function playCard(handIndex: number, boardTarget?: number) {
    if (!isPlayerTurn.value || gameState.value.phase !== 'play') return

    const gs = gameState.value
    const card = gs.player.hand[handIndex]
    if (!card || card.cost > gs.player.mana) return

    // Spend mana
    gs.player.mana -= card.cost

    // Remove from hand
    gs.player.hand.splice(handIndex, 1)

    switch (card.type) {
      case 'creature': {
        const emptySlot = gs.player.board.indexOf(null)
        if (emptySlot === -1) return // Board full
        const creature = createBoardCreature(card)
        gs.player.board[emptySlot] = creature
        addLog('player', `🃏 Triệu hồi ${card.name} (${card.atk}/${card.hp})`, 'play')

        // Apply battlecry effects
        if (card.keywords.includes('battlecry')) {
          for (const effect of card.effects) {
            const logs = applyEffect(effect, gs, 'player', boardTarget)
            logs.forEach((l) => addLog('player', `  ↳ ${l}`, 'effect'))
          }
        }
        break
      }
      case 'spell': {
        addLog('player', `✨ Sử dụng phép ${card.name}`, 'play')
        for (const effect of card.effects) {
          const logs = applyEffect(effect, gs, 'player', boardTarget)
          logs.forEach((l) => addLog('player', `  ↳ ${l}`, 'effect'))
        }
        gs.player.graveyard.push(card)
        break
      }
      case 'trap': {
        gs.player.traps.push({
          instanceId: `trap-${Date.now()}`,
          card,
        })
        addLog('player', `🪤 Đặt 1 bẫy úp mặt`, 'play')
        break
      }
      case 'support': {
        addLog('player', `💊 Sử dụng ${card.name}`, 'play')
        for (const effect of card.effects) {
          const logs = applyEffect(effect, gs, 'player', boardTarget)
          logs.forEach((l) => addLog('player', `  ↳ ${l}`, 'effect'))
        }
        gs.player.graveyard.push(card)
        break
      }
      case 'weapon': {
        if (boardTarget !== undefined) {
          const creature = gs.player.board[boardTarget]
          if (creature) {
            creature.currentAtk += card.atk
            creature.weapon = card
            if (card.keywords.length > 0) {
              creature.keywords.push(...card.keywords)
            }
            addLog('player', `🗡️ Trang bị ${card.name} cho ${creature.card.name}`, 'play')
          }
        }
        break
      }
      case 'environment': {
        gs.environment = { card, owner: 'player' }
        addLog('player', `🌍 Kích hoạt môi trường: ${card.name}`, 'environment')
        break
      }
    }

    // Clean up dead
    const deadLogs = [...removeDeadCreatures(gs.player), ...removeDeadCreatures(gs.opponent)]
    deadLogs.forEach((l) => addLog('player', l, 'effect'))
    checkWinCondition()
  }

  // Attack with a creature
  function attackWithCreature(attackerIdx: number, defenderIdx: number | 'hero') {
    if (!isPlayerTurn.value || gameState.value.phase !== 'play') return

    const gs = gameState.value
    const attacker = gs.player.board[attackerIdx]
    if (!attacker || !attacker.canAttack || attacker.hasAttacked || attacker.frozen) return

    // Check for taunt
    const hasTaunt = gs.opponent.board.some((c) => c?.keywords.includes('taunt'))
    if (hasTaunt && defenderIdx === 'hero') return
    if (hasTaunt && defenderIdx !== 'hero') {
      const defender = gs.opponent.board[defenderIdx]
      if (defender && !defender.keywords.includes('taunt')) return
    }

    if (defenderIdx === 'hero') {
      const logs = attackHero(attacker, gs.opponent)
      logs.forEach((l) => addLog('player', l, 'attack'))

      // Lifesteal
      if (attacker.keywords.includes('lifesteal')) {
        gs.player.hp = Math.min(gs.player.maxHp, gs.player.hp + attacker.currentAtk)
      }
    } else {
      const defender = gs.opponent.board[defenderIdx]
      if (!defender) return

      // Check stealth
      if (defender.keywords.includes('stealth')) return

      const logs = resolveCombat(attacker, defender)
      logs.forEach((l) => addLog('player', l, 'attack'))

      // Overflow — excess damage to hero
      if (attacker.keywords.includes('overflow') && defender.currentHp < 0) {
        const overflow = Math.abs(defender.currentHp)
        gs.opponent.hp -= overflow
        addLog('player', `💥 Overflow! ${overflow} sát thương lan sang Hero đối thủ!`, 'attack')
      }
    }

    attacker.hasAttacked = true

    // Clean up dead
    const deadLogs = [...removeDeadCreatures(gs.player), ...removeDeadCreatures(gs.opponent)]
    deadLogs.forEach((l) => addLog('player', l, 'effect'))
    checkWinCondition()
  }

  // End player's turn
  function endTurn() {
    if (!isPlayerTurn.value) return

    const gs = gameState.value

    // Apply poison
    for (const c of gs.player.board) {
      if (c && c.poisonStacks > 0) {
        c.currentHp -= c.poisonStacks
        addLog('player', `☠️ ${c.card.name} mất ${c.poisonStacks} HP do Poison`, 'effect')
      }
    }

    removeDeadCreatures(gs.player)
    if (checkWinCondition()) return

    // Switch to opponent turn
    gs.currentTurn = 'opponent'
    gs.turnNumber++

    // Opponent turn start
    startOpponentTurn()
  }

  function startOpponentTurn() {
    const gs = gameState.value

    // Increase mana
    gs.opponent.maxMana = Math.min(10, gs.opponent.maxMana + 1)
    gs.opponent.mana = gs.opponent.maxMana

    // Draw card
    if (gs.opponent.deck.length > 0 && gs.opponent.hand.length < 7) {
      gs.opponent.hand.push(gs.opponent.deck.shift()!)
    }

    // Unfreeze and reset attacks
    for (const c of gs.opponent.board) {
      if (c) {
        if (c.frozen) {
          c.frozen = false
        } else {
          c.canAttack = true
        }
        c.hasAttacked = false
      }
    }

    addLog('opponent', `🤖 Lượt AI (Mana: ${gs.opponent.mana}/${gs.opponent.maxMana})`, 'system')

    // AI plays
    setTimeout(() => {
      executeAITurn()
    }, 800)
  }

  // Simple AI logic
  function executeAITurn() {
    const gs = gameState.value

    // AI plays cards
    let played = 0
    const maxPlays = difficulty.value === 'easy' ? 2 : difficulty.value === 'normal' ? 3 : 5

    while (played < maxPlays) {
      const playable = gs.opponent.hand
        .map((c, i) => ({ card: c, index: i }))
        .filter((x) => x.card.cost <= gs.opponent.mana)
        .sort((a, b) => b.card.cost - a.card.cost) // Play expensive first

      if (playable.length === 0) break

      const { card, index } = playable[0]!

      // Remove from hand first
      gs.opponent.hand.splice(index, 1)
      gs.opponent.mana -= card.cost

      if (card.type === 'creature') {
        const emptySlot = gs.opponent.board.indexOf(null)
        if (emptySlot !== -1) {
          gs.opponent.board[emptySlot] = createBoardCreature(card)
          addLog('opponent', `🃏 AI triệu hồi ${card.name}`, 'play')

          if (card.keywords.includes('battlecry')) {
            for (const effect of card.effects) {
              const playerTargets = gs.player.board
                .map((c, i) => (c ? i : -1))
                .filter((i) => i >= 0)
              const targetIdx =
                playerTargets.length > 0
                  ? playerTargets[Math.floor(Math.random() * playerTargets.length)]
                  : undefined
              const logs = applyEffect(effect, gs, 'opponent', targetIdx)
              logs.forEach((l) => addLog('opponent', `  ↳ ${l}`, 'effect'))
            }
          }
        }
      } else if (card.type === 'spell') {
        addLog('opponent', `✨ AI sử dụng ${card.name}`, 'play')
        for (const effect of card.effects) {
          const playerTargets = gs.player.board.map((c, i) => (c ? i : -1)).filter((i) => i >= 0)
          const targetIdx =
            playerTargets.length > 0
              ? playerTargets[Math.floor(Math.random() * playerTargets.length)]
              : undefined
          const logs = applyEffect(effect, gs, 'opponent', targetIdx)
          logs.forEach((l) => addLog('opponent', `  ↳ ${l}`, 'effect'))
        }
        gs.opponent.graveyard.push(card)
      } else if (card.type === 'environment') {
        gs.environment = { card, owner: 'opponent' }
        addLog('opponent', `🌍 AI kích hoạt ${card.name}`, 'environment')
      } else {
        // Support/Weapon — apply to strongest creature
        const creatures = gs.opponent.board
          .map((c, i) => (c ? { creature: c, index: i } : null))
          .filter((x): x is { creature: BoardCreature; index: number } => x !== null)
          .sort((a, b) => b.creature.currentAtk - a.creature.currentAtk)

        if (creatures.length > 0) {
          const target = creatures[0]!
          if (card.type === 'weapon') {
            target.creature.currentAtk += card.atk
            addLog('opponent', `🗡️ AI trang bị ${card.name}`, 'play')
          } else {
            for (const effect of card.effects) {
              const logs = applyEffect(effect, gs, 'opponent', target.index)
              logs.forEach((l) => addLog('opponent', `  ↳ ${l}`, 'effect'))
            }
            addLog('opponent', `💊 AI sử dụng ${card.name}`, 'play')
          }
        }
        gs.opponent.graveyard.push(card)
      }

      played++
      removeDeadCreatures(gs.player)
      removeDeadCreatures(gs.opponent)
      if (checkWinCondition()) return
    }

    // AI attacks
    setTimeout(() => {
      aiAttackPhase()
    }, 600)
  }

  function aiAttackPhase() {
    const gs = gameState.value

    for (let i = 0; i < gs.opponent.board.length; i++) {
      const creature = gs.opponent.board[i]
      if (!creature || !creature.canAttack || creature.hasAttacked || creature.frozen) continue

      // Check for player taunt
      const tauntIdx = gs.player.board.findIndex((c) => c?.keywords.includes('taunt'))

      if (tauntIdx >= 0) {
        // Must attack taunt
        const defender = gs.player.board[tauntIdx]!
        const logs = resolveCombat(creature, defender)
        logs.forEach((l) => addLog('opponent', l, 'attack'))
      } else {
        // Attack hero or weakest creature based on difficulty
        const playerCreatures = gs.player.board
          .map((c, idx) => (c ? { creature: c, index: idx } : null))
          .filter((x): x is { creature: BoardCreature; index: number } => x !== null)

        const shouldAttackHero =
          difficulty.value === 'easy'
            ? Math.random() > 0.5
            : difficulty.value === 'normal'
              ? Math.random() > 0.4 || playerCreatures.length === 0
              : playerCreatures.length === 0 || creature.currentAtk >= 4

        if (shouldAttackHero || playerCreatures.length === 0) {
          const logs = attackHero(creature, gs.player)
          logs.forEach((l) => addLog('opponent', l, 'attack'))

          if (creature.keywords.includes('lifesteal')) {
            gs.opponent.hp = Math.min(gs.opponent.maxHp, gs.opponent.hp + creature.currentAtk)
          }
        } else {
          // Attack weakest creature
          const sorted = [...playerCreatures].sort(
            (a, b) => a.creature.currentHp - b.creature.currentHp,
          )
          const defender = sorted[0]!
          const logs = resolveCombat(creature, defender.creature)
          logs.forEach((l) => addLog('opponent', l, 'attack'))
        }
      }

      creature.hasAttacked = true
      removeDeadCreatures(gs.player)
      removeDeadCreatures(gs.opponent)
      if (checkWinCondition()) return
    }

    // End AI turn, switch to player
    setTimeout(() => {
      endOpponentTurn()
    }, 400)
  }

  function endOpponentTurn() {
    const gs = gameState.value

    // Apply poison to opponent creatures
    for (const c of gs.opponent.board) {
      if (c && c.poisonStacks > 0) {
        c.currentHp -= c.poisonStacks
      }
    }

    removeDeadCreatures(gs.opponent)
    if (checkWinCondition()) return

    // Switch to player
    gs.currentTurn = 'player'
    gs.turnNumber++
    gs.player.maxMana = Math.min(10, gs.player.maxMana + 1)
    gs.player.mana = gs.player.maxMana

    // Draw card
    if (gs.player.deck.length > 0 && gs.player.hand.length < 7) {
      gs.player.hand.push(gs.player.deck.shift()!)
    }

    // Unfreeze and reset attacks
    for (const c of gs.player.board) {
      if (c) {
        if (c.frozen) {
          c.frozen = false
        } else {
          c.canAttack = true
        }
        c.hasAttacked = false
      }
    }

    addLog(
      'player',
      `⚔️ Lượt ${gs.turnNumber} — Mana: ${gs.player.mana}/${gs.player.maxMana}`,
      'system',
    )
    selectedCardIndex.value = null
    selectedBoardIndex.value = null
    attackingIndex.value = null
  }

  return {
    gameState,
    isLoading,
    isPlayerTurn,
    isGameOver,
    selectedCardIndex,
    selectedBoardIndex,
    attackingIndex,
    difficulty,
    startGame,
    playCard,
    attackWithCreature,
    endTurn,
    addLog,
  }
}
