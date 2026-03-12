import type { ItemType } from './useGameLogic'

export type AIDifficulty = 'easy' | 'normal' | 'hard'

export interface AIDecisionContext {
  cylinder: boolean[]
  liveAtReload: number
  blankAtReload: number

  aiHp: number
  playerHp: number

  aiItems: ItemType[]

  isSawedOff: boolean
  isPlayerHandcuffed: boolean

  knownNextShell?: boolean
}

export interface AIDecisionResult {
  target: 'player' | 'ai'
  reason: string
}

export interface AIItemDecision {
  item: ItemType | null
  reason: string
}

/* =========================================================
UTILS
========================================================= */

function liveProbability(cylinder: boolean[]): number {
  if (cylinder.length === 0) return 0
  return cylinder.filter(Boolean).length / cylinder.length
}

function effectiveDamage(isSawedOff: boolean) {
  return isSawedOff ? 2 : 1
}

/* =========================================================
EXPECTED VALUE AI (NORMAL)
========================================================= */

interface EVResult {
  evShootPlayer: number
  evShootSelf: number
  recommendation: 'player' | 'ai'
}

function calculateEV(
  cylinder: boolean[],
  aiHp: number,
  playerHp: number,
  isSawedOff: boolean,
): EVResult {
  const pLive = liveProbability(cylinder)
  const pBlank = 1 - pLive

  const dmg = effectiveDamage(isSawedOff)

  const killBonus = dmg >= playerHp ? 10 : 0
  const selfPenalty = aiHp === 1 ? 20 : 1

  const evShootPlayer = pLive * (dmg + killBonus)
  const evShootSelf = pBlank * 1.5 - pLive * selfPenalty

  return {
    evShootPlayer,
    evShootSelf,
    recommendation: evShootPlayer >= evShootSelf ? 'player' : 'ai',
  }
}

/* =========================================================
ITEM DECISION
========================================================= */

export function getAIItemDecision(
  ctx: AIDecisionContext,
  difficulty: AIDifficulty,
): AIItemDecision {
  const { aiItems, cylinder, aiHp, knownNextShell } = ctx

  if (aiItems.length === 0) return { item: null, reason: '' }

  if (difficulty !== 'hard') {
    const forgetChance = difficulty === 'easy' ? 0.6 : 0.25
    if (Math.random() < forgetChance) return { item: null, reason: '' }
  }

  const pLive = liveProbability(cylinder)

  if (aiItems.includes('magnifying_glass') && knownNextShell === undefined) {
    return {
      item: 'magnifying_glass',
      reason: 'Furina dùng kính lúp để xem viên đạn tiếp theo.',
    }
  }

  if (knownNextShell === true && aiItems.includes('handsaw') && !ctx.isSawedOff) {
    return {
      item: 'handsaw',
      reason: 'Furina biết chắc đạn thật → cưa để gây x2 damage.',
    }
  }

  if (aiItems.includes('cigarette') && aiHp <= 1) {
    return {
      item: 'cigarette',
      reason: 'Furina hồi HP khẩn cấp.',
    }
  }

  if (aiItems.includes('handcuffs') && !ctx.isPlayerHandcuffed && pLive > 0.6) {
    return {
      item: 'handcuffs',
      reason: 'Furina còng tay đối thủ để giữ lượt.',
    }
  }

  if (aiItems.includes('beer') && cylinder.length > 1 && pLive < 0.4) {
    return {
      item: 'beer',
      reason: 'Furina skip viên đạn hiện tại.',
    }
  }

  return { item: null, reason: '' }
}

/* =========================================================
SMART DECISION (NORMAL)
========================================================= */

function makeSmartDecision(ctx: AIDecisionContext): AIDecisionResult {
  const { cylinder, aiHp, playerHp, isSawedOff, knownNextShell } = ctx

  const liveCount = cylinder.filter(Boolean).length
  const blankCount = cylinder.length - liveCount

  if (knownNextShell !== undefined) {
    return {
      target: knownNextShell ? 'player' : 'ai',
      reason: knownNextShell ? 'Furina biết chắc đạn thật.' : 'Furina biết chắc đạn rỗng.',
    }
  }

  if (blankCount === 0) {
    return { target: 'player', reason: 'Toàn đạn thật.' }
  }

  if (liveCount === 0) {
    return { target: 'ai', reason: 'Toàn đạn rỗng.' }
  }

  const ev = calculateEV(cylinder, aiHp, playerHp, isSawedOff)

  return {
    target: ev.recommendation,
    reason: 'Furina quyết định theo Expected Value.',
  }
}

/* =========================================================
NIGHTMARE AI (HARD)
========================================================= */

interface GameState {
  cylinder: boolean[]
  aiHp: number
  playerHp: number
  isSawedOff: boolean
}

type Action = 'shoot_player' | 'shoot_self'

function evaluateState(state: GameState): number {
  if (state.playerHp <= 0) return 100
  if (state.aiHp <= 0) return -100

  const hpAdvantage = state.aiHp - state.playerHp
  const pLive = liveProbability(state.cylinder)

  return hpAdvantage + pLive * 0.5
}

function simulate(state: GameState, action: Action): GameState {
  const cylinder = [...state.cylinder]
  const shell = cylinder.shift()

  if (shell === undefined) return state

  let aiHp = state.aiHp
  let playerHp = state.playerHp

  if (shell) {
    if (action === 'shoot_player') {
      playerHp -= effectiveDamage(state.isSawedOff)
    } else {
      aiHp -= 1
    }
  }

  return {
    cylinder,
    aiHp,
    playerHp,
    isSawedOff: state.isSawedOff,
  }
}

function minimax(state: GameState, depth: number, aiTurn: boolean): number {
  if (depth === 0 || state.aiHp <= 0 || state.playerHp <= 0) {
    return evaluateState(state)
  }

  const actions: Action[] = ['shoot_player', 'shoot_self']

  if (aiTurn) {
    let best = -Infinity

    for (const action of actions) {
      const next = simulate(state, action)
      const score = minimax(next, depth - 1, false)
      best = Math.max(best, score)
    }

    return best
  } else {
    let worst = Infinity

    for (const action of actions) {
      const next = simulate(state, action)
      const score = minimax(next, depth - 1, true)
      worst = Math.min(worst, score)
    }

    return worst
  }
}

function makeNightmareDecision(ctx: AIDecisionContext): AIDecisionResult {
  const state: GameState = {
    cylinder: ctx.cylinder,
    aiHp: ctx.aiHp,
    playerHp: ctx.playerHp,
    isSawedOff: ctx.isSawedOff,
  }

  const actions: Action[] = ['shoot_player', 'shoot_self']

  let bestScore = -Infinity
  let bestAction: Action = 'shoot_player'

  for (const action of actions) {
    const next = simulate(state, action)
    const score = minimax(next, 2, false)

    if (score > bestScore) {
      bestScore = score
      bestAction = action
    }
  }

  return {
    target: bestAction === 'shoot_player' ? 'player' : 'ai',
    reason: 'Furina sử dụng Minimax để dự đoán kết quả của mỗi hành động.',
  }
}

/* =========================================================
DIFFICULTY NOISE
========================================================= */

function applyDifficultyNoise(
  decision: AIDecisionResult,
  difficulty: AIDifficulty,
): AIDecisionResult {
  const chance: Record<AIDifficulty, number> = {
    easy: 0.4,
    normal: 0.15,
    hard: 0,
  }

  if (Math.random() < chance[difficulty]) {
    const target = Math.random() < 0.5 ? 'player' : 'ai'
    return {
      target,
      reason: 'Furina random.',
    }
  }

  return decision
}

/* =========================================================
PUBLIC API
========================================================= */

export function getAIDecision(
  ctx: AIDecisionContext,
  difficulty: AIDifficulty = 'normal',
): AIDecisionResult {
  if (difficulty === 'hard') {
    return makeNightmareDecision(ctx)
  }

  const smartDecision = makeSmartDecision(ctx)
  return applyDifficultyNoise(smartDecision, difficulty)
}

/* =========================================================
MAGNIFYING GLASS CALLBACK
========================================================= */

export function onMagnifyingGlassReveal(
  ctx: AIDecisionContext,
  isLive: boolean,
): AIDecisionContext {
  return { ...ctx, knownNextShell: isLive }
}
