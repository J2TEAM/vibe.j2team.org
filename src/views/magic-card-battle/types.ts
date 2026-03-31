// ===== Card Types =====
export type CardType = 'creature' | 'spell' | 'trap' | 'support' | 'weapon' | 'environment'
export type Rarity = 'common' | 'rare' | 'epic' | 'legendary'
export type Keyword =
  | 'rush'
  | 'shield'
  | 'stealth'
  | 'taunt'
  | 'lifesteal'
  | 'poison'
  | 'deathrattle'
  | 'battlecry'
  | 'overflow'

export type TrapTrigger = 'on_attack' | 'on_spell' | 'on_summon' | 'on_turn_start' | 'on_damage'

export type EffectType =
  | 'damage'
  | 'heal'
  | 'draw'
  | 'buff_atk'
  | 'buff_hp'
  | 'debuff_atk'
  | 'debuff_hp'
  | 'destroy'
  | 'summon'
  | 'freeze'
  | 'silence'
  | 'random_damage'
  | 'aoe_damage'
  | 'steal'
  | 'copy'
  | 'return_hand'
  | 'gain_mana'
  | 'reduce_cost'
  | 'set_environment'
  | 'none'

export type TargetType =
  | 'enemy_creature'
  | 'friendly_creature'
  | 'any_creature'
  | 'enemy_hero'
  | 'friendly_hero'
  | 'all_enemies'
  | 'all_friendlies'
  | 'all_creatures'
  | 'self'
  | 'random_enemy'
  | 'random_friendly'
  | 'none'

export interface CardEffect {
  type: EffectType
  value: number
  target: TargetType
}

export interface CardData {
  id: string
  name: string
  type: CardType
  rarity: Rarity
  cost: number
  atk: number
  hp: number
  description: string
  flavor: string
  keywords: Keyword[]
  effects: CardEffect[]
  trapTrigger?: TrapTrigger
  environmentId?: string
}

// ===== Game State Types =====
export type GamePhase = 'lobby' | 'mulligan' | 'play' | 'combat' | 'game_over'
export type TurnPhase = 'start' | 'main' | 'combat' | 'end'
export type PlayerSide = 'player' | 'opponent'

export interface BoardCreature {
  instanceId: string
  card: CardData
  currentAtk: number
  currentHp: number
  maxHp: number
  keywords: Keyword[]
  canAttack: boolean
  hasAttacked: boolean
  weapon: CardData | null
  buffs: CardData[]
  poisonStacks: number
  frozen: boolean
}

export interface TrapSlot {
  instanceId: string
  card: CardData
}

export interface PlayerState {
  hp: number
  maxHp: number
  mana: number
  maxMana: number
  deck: CardData[]
  hand: CardData[]
  board: (BoardCreature | null)[]
  traps: TrapSlot[]
  graveyard: CardData[]
}

export interface EnvironmentState {
  card: CardData | null
  owner: PlayerSide | null
}

export interface GameState {
  phase: GamePhase
  turnPhase: TurnPhase
  currentTurn: PlayerSide
  turnNumber: number
  player: PlayerState
  opponent: PlayerState
  environment: EnvironmentState
  winner: PlayerSide | null
  log: GameLogEntry[]
}

export interface GameLogEntry {
  turn: number
  side: PlayerSide
  message: string
  type: 'play' | 'attack' | 'effect' | 'trap' | 'environment' | 'system'
}

export type AIDifficulty = 'easy' | 'normal' | 'hard'
