import type { BoardCreature, CardData, CardEffect, PlayerState, GameState } from '../types'

// Generate unique instance IDs
let instanceCounter = 0
export function generateInstanceId(): string {
  return `inst-${Date.now()}-${instanceCounter++}`
}

export function useCardEffects() {
  // Create a board creature from a card
  function createBoardCreature(card: CardData): BoardCreature {
    return {
      instanceId: generateInstanceId(),
      card,
      currentAtk: card.atk,
      currentHp: card.hp,
      maxHp: card.hp,
      keywords: [...card.keywords],
      canAttack: card.keywords.includes('rush'),
      hasAttacked: false,
      weapon: null,
      buffs: [],
      poisonStacks: 0,
      frozen: false,
    }
  }

  // Apply a single effect
  function applyEffect(
    effect: CardEffect,
    state: GameState,
    side: 'player' | 'opponent',
    targetIndex?: number,
  ): string[] {
    const logs: string[] = []
    const friendly = side === 'player' ? state.player : state.opponent
    const enemy = side === 'player' ? state.opponent : state.player

    switch (effect.type) {
      case 'damage': {
        if (effect.target === 'enemy_creature' && targetIndex !== undefined) {
          const target = enemy.board[targetIndex]
          if (target) {
            target.currentHp -= effect.value
            logs.push(`Gây ${effect.value} sát thương cho ${target.card.name}`)
          }
        } else if (effect.target === 'enemy_hero') {
          enemy.hp -= effect.value
          logs.push(`Gây ${effect.value} sát thương cho Hero đối thủ`)
        } else if (effect.target === 'friendly_hero') {
          friendly.hp -= effect.value
          logs.push(`Gây ${effect.value} sát thương cho Hero mình`)
        } else if (effect.target === 'random_enemy') {
          const targets = enemy.board.filter((c): c is BoardCreature => c !== null)
          if (targets.length > 0) {
            const t = targets[Math.floor(Math.random() * targets.length)]!
            t.currentHp -= effect.value
            logs.push(`Gây ${effect.value} sát thương cho ${t.card.name}`)
          }
        }
        break
      }
      case 'aoe_damage': {
        if (effect.target === 'all_enemies') {
          for (const c of enemy.board) {
            if (c) {
              c.currentHp -= effect.value
              logs.push(`Gây ${effect.value} sát thương cho ${c.card.name}`)
            }
          }
        } else if (effect.target === 'all_creatures') {
          for (const c of [...friendly.board, ...enemy.board]) {
            if (c) {
              c.currentHp -= effect.value
            }
          }
          logs.push(`Gây ${effect.value} sát thương cho TẤT CẢ quân`)
        }
        break
      }
      case 'heal': {
        if (effect.target === 'friendly_hero') {
          friendly.hp = Math.min(friendly.maxHp, friendly.hp + effect.value)
          logs.push(`Hồi ${effect.value} HP cho Hero`)
        } else if (effect.target === 'friendly_creature' && targetIndex !== undefined) {
          const target = friendly.board[targetIndex]
          if (target) {
            target.currentHp = Math.min(target.maxHp, target.currentHp + effect.value)
            logs.push(`Hồi ${effect.value} HP cho ${target.card.name}`)
          }
        }
        break
      }
      case 'draw': {
        const count = Math.min(effect.value, friendly.deck.length)
        for (let i = 0; i < count; i++) {
          if (friendly.hand.length < 7 && friendly.deck.length > 0) {
            friendly.hand.push(friendly.deck.shift()!)
          }
        }
        logs.push(`Rút ${count} lá`)
        break
      }
      case 'buff_atk': {
        if (effect.target === 'friendly_creature' && targetIndex !== undefined) {
          const target = friendly.board[targetIndex]
          if (target) {
            target.currentAtk += effect.value
            logs.push(`+${effect.value} ATK cho ${target.card.name}`)
          }
        } else if (effect.target === 'all_friendlies') {
          for (const c of friendly.board) {
            if (c) c.currentAtk += effect.value
          }
          logs.push(`+${effect.value} ATK cho tất cả quân bạn`)
        }
        break
      }
      case 'buff_hp': {
        if (effect.target === 'friendly_creature' && targetIndex !== undefined) {
          const target = friendly.board[targetIndex]
          if (target) {
            target.currentHp += effect.value
            target.maxHp += effect.value
            logs.push(`+${effect.value} HP cho ${target.card.name}`)
          }
        }
        break
      }
      case 'debuff_atk': {
        if (effect.target === 'enemy_creature' && targetIndex !== undefined) {
          const target = enemy.board[targetIndex]
          if (target) {
            target.currentAtk = Math.max(0, target.currentAtk - effect.value)
            logs.push(`-${effect.value} ATK cho ${target.card.name}`)
          }
        } else if (effect.target === 'all_enemies') {
          for (const c of enemy.board) {
            if (c) c.currentAtk = Math.max(0, c.currentAtk - effect.value)
          }
          logs.push(`-${effect.value} ATK cho tất cả quân đối thủ`)
        }
        break
      }
      case 'destroy': {
        if (effect.target === 'random_enemy') {
          const targets = enemy.board.map((c, i) => (c ? i : -1)).filter((i) => i >= 0)
          if (targets.length > 0) {
            const idx = targets[Math.floor(Math.random() * targets.length)]!
            const destroyed = enemy.board[idx]!
            logs.push(`Tiêu diệt ${destroyed.card.name}`)
            enemy.graveyard.push(destroyed.card)
            enemy.board[idx] = null
          }
        } else if (effect.target === 'enemy_creature' && targetIndex !== undefined) {
          const target = enemy.board[targetIndex]
          if (target) {
            logs.push(`Tiêu diệt ${target.card.name}`)
            enemy.graveyard.push(target.card)
            enemy.board[targetIndex] = null
          }
        }
        break
      }
      case 'freeze': {
        if (effect.target === 'enemy_creature' && targetIndex !== undefined) {
          const target = enemy.board[targetIndex]
          if (target) {
            target.frozen = true
            logs.push(`Đóng băng ${target.card.name}`)
          }
        }
        break
      }
      case 'silence': {
        if (
          (effect.target === 'enemy_creature' || effect.target === 'any_creature') &&
          targetIndex !== undefined
        ) {
          const board = effect.target === 'enemy_creature' ? enemy.board : friendly.board
          const target = board[targetIndex]
          if (target) {
            target.keywords = []
            target.buffs = []
            target.poisonStacks = 0
            target.frozen = false
            logs.push(`Silence ${target.card.name}`)
          }
        }
        break
      }
      case 'summon': {
        const tokenCard: CardData = {
          id: 'token',
          name: 'Token',
          type: 'creature',
          rarity: 'common',
          cost: 0,
          atk: 1,
          hp: 1,
          description: '',
          flavor: '',
          keywords: [],
          effects: [],
        }
        for (let i = 0; i < effect.value; i++) {
          const emptySlot = friendly.board.indexOf(null)
          if (emptySlot !== -1) {
            friendly.board[emptySlot] = createBoardCreature(tokenCard)
          }
        }
        logs.push(`Triệu hồi ${effect.value} Token`)
        break
      }
      case 'return_hand': {
        if (effect.target === 'enemy_creature' && targetIndex !== undefined) {
          const target = enemy.board[targetIndex]
          if (target && enemy.hand.length < 7) {
            enemy.hand.push(target.card)
            enemy.board[targetIndex] = null
            logs.push(`Trả ${target.card.name} về tay đối thủ`)
          }
        }
        break
      }
      case 'gain_mana': {
        friendly.mana = Math.min(10, friendly.mana + effect.value)
        logs.push(`+${effect.value} Mana`)
        break
      }
      default:
        break
    }
    return logs
  }

  // Clean up dead creatures
  function removeDeadCreatures(playerState: PlayerState): string[] {
    const logs: string[] = []
    for (let i = 0; i < playerState.board.length; i++) {
      const creature = playerState.board[i]
      if (creature && creature.currentHp <= 0) {
        logs.push(`${creature.card.name} bị tiêu diệt!`)
        playerState.graveyard.push(creature.card)
        // Deathrattle effects would be triggered here
        playerState.board[i] = null
      }
    }
    return logs
  }

  // Combat between two creatures
  function resolveCombat(attacker: BoardCreature, defender: BoardCreature): string[] {
    const logs: string[] = []

    // Check shield on defender
    if (defender.keywords.includes('shield')) {
      defender.keywords = defender.keywords.filter((k) => k !== 'shield')
      logs.push(`${defender.card.name} chặn sát thương bằng Shield!`)
    } else {
      defender.currentHp -= attacker.currentAtk
      logs.push(
        `${attacker.card.name} tấn công ${defender.card.name} gây ${attacker.currentAtk} sát thương`,
      )
    }

    // Counter attack
    if (attacker.keywords.includes('shield')) {
      attacker.keywords = attacker.keywords.filter((k) => k !== 'shield')
      logs.push(`${attacker.card.name} chặn phản sát thương bằng Shield!`)
    } else {
      attacker.currentHp -= defender.currentAtk
    }

    // Poison
    if (attacker.keywords.includes('poison') && defender.currentHp > 0) {
      defender.poisonStacks++
      logs.push(`${defender.card.name} bị nhiễm độc!`)
    }

    // Stealth removed after attacking
    if (attacker.keywords.includes('stealth')) {
      attacker.keywords = attacker.keywords.filter((k) => k !== 'stealth')
    }

    return logs
  }

  // Attack hero directly
  function attackHero(attacker: BoardCreature, targetPlayer: PlayerState): string[] {
    const logs: string[] = []
    targetPlayer.hp -= attacker.currentAtk
    logs.push(`${attacker.card.name} tấn công Hero gây ${attacker.currentAtk} sát thương!`)

    if (attacker.keywords.includes('lifesteal')) {
      logs.push(`${attacker.card.name} hút ${attacker.currentAtk} HP!`)
    }

    if (attacker.keywords.includes('stealth')) {
      attacker.keywords = attacker.keywords.filter((k) => k !== 'stealth')
    }

    return logs
  }

  return {
    createBoardCreature,
    applyEffect,
    removeDeadCreatures,
    resolveCombat,
    attackHero,
  }
}
