import { ref, reactive, computed } from 'vue'
import { computeDelay, computeMaxStamina, resolveDamage } from '../utils/damage'
import type {
  Character,
  CharacterPreset,
  Weapon,
  WeaponId,
  BuffId,
  BuffItem,
  TurnState,
  Wind,
  GameResult,
  CharacterStats,
  GameMap,
  MapId,
} from '../types'

// ─── Animal presets ───────────────────────────────────────────────────────

export const ANIMAL_PRESETS: CharacterPreset[] = [
  {
    emoji: '🐻',
    name: 'Gấu',
    description: 'Bể máu, phòng thủ cao',
    stats: { atk: 100, def: 160, agi: 60, lck: 80, armor: 60, maxHp: 1200 },
  },
  {
    emoji: '🐯',
    name: 'Hổ',
    description: 'Tấn công mạnh, nhanh nhẹn',
    stats: { atk: 220, def: 80, agi: 100, lck: 120, armor: 20, maxHp: 900 },
  },
  {
    emoji: '🦊',
    name: 'Cáo',
    description: 'Cực may mắn, nhanh nhất',
    stats: { atk: 120, def: 60, agi: 160, lck: 200, armor: 10, maxHp: 750 },
  },
  {
    emoji: '🐺',
    name: 'Sói',
    description: 'Cân bằng, tấn công ổn định',
    stats: { atk: 160, def: 120, agi: 120, lck: 100, armor: 30, maxHp: 1000 },
  },
  {
    emoji: '🐸',
    name: 'Ếch',
    description: 'Tốc độ siêu cao, delay thấp',
    stats: { atk: 80, def: 80, agi: 220, lck: 120, armor: 10, maxHp: 800 },
  },
  {
    emoji: '🐷',
    name: 'Heo',
    description: 'Pháo đài sống, giáp dày',
    stats: { atk: 80, def: 140, agi: 60, lck: 60, armor: 80, maxHp: 1300 },
  },
  {
    emoji: '🐮',
    name: 'Bò',
    description: 'Ổn định, HP cao',
    stats: { atk: 100, def: 120, agi: 80, lck: 80, armor: 50, maxHp: 1100 },
  },
  {
    emoji: '🐨',
    name: 'Gấu túi',
    description: 'Phòng thủ + may mắn',
    stats: { atk: 80, def: 180, agi: 40, lck: 140, armor: 70, maxHp: 1150 },
  },
  {
    emoji: '🐼',
    name: 'Gấu trúc',
    description: 'Toàn diện, không yếu điểm',
    stats: { atk: 130, def: 130, agi: 100, lck: 100, armor: 40, maxHp: 1000 },
  },
  {
    emoji: '🦁',
    name: 'Sư tử',
    description: 'Sát thương tối đa, mong manh',
    stats: { atk: 250, def: 50, agi: 120, lck: 130, armor: 10, maxHp: 800 },
  },
]

// ─── Weapon definitions ────────────────────────────────────────────────────

export const WEAPONS: Record<WeaponId, Weapon> = {
  grenade: {
    id: 'grenade',
    name: 'Lựu đạn',
    emoji: '💣',
    baseDamage: 120,
    minAngle: 15,
    maxAngle: 85,
    explosionRadius: 55,
    delayBase: 80,
    projectileCount: 1,
  },
  brick: {
    id: 'brick',
    name: 'Lu gạch',
    emoji: '🧱',
    baseDamage: 160,
    minAngle: 10,
    maxAngle: 70,
    explosionRadius: 38,
    delayBase: 100,
    projectileCount: 1,
  },
  lightning: {
    id: 'lightning',
    name: 'Sấm sét',
    emoji: '⚡',
    baseDamage: 110,
    minAngle: 10,
    maxAngle: 60,
    explosionRadius: 30,
    delayBase: 70,
    projectileCount: 1,
  },
  dart: {
    id: 'dart',
    name: 'Phi tiêu',
    emoji: '🎯',
    baseDamage: 90,
    minAngle: 5,
    maxAngle: 55,
    explosionRadius: 22,
    delayBase: 40,
    projectileCount: 1,
  },
  fridge: {
    id: 'fridge',
    name: 'Tủ lạnh',
    emoji: '🧊',
    baseDamage: 140,
    minAngle: 20,
    maxAngle: 80,
    explosionRadius: 45,
    delayBase: 90,
    projectileCount: 1,
  },
}

// ─── Buff definitions ──────────────────────────────────────────────────────

export const BUFFS: Record<BuffId, BuffItem> = {
  dmg10: {
    id: 'dmg10',
    name: '+10% Sát thương',
    description: 'Tăng 10% sát thương',
    staminaCost: 20,
    delayAdd: 10,
    damageMultiplier: 1.1,
    extraShots: 0,
    isTrident: false,
    isTeleport: false,
  },
  dmg20: {
    id: 'dmg20',
    name: '+20% Sát thương',
    description: 'Tăng 20% sát thương',
    staminaCost: 35,
    delayAdd: 20,
    damageMultiplier: 1.2,
    extraShots: 0,
    isTrident: false,
    isTeleport: false,
  },
  dmg30: {
    id: 'dmg30',
    name: '+30% Sát thương',
    description: 'Tăng 30% sát thương',
    staminaCost: 55,
    delayAdd: 30,
    damageMultiplier: 1.3,
    extraShots: 0,
    isTrident: false,
    isTeleport: false,
  },
  dmg40: {
    id: 'dmg40',
    name: '+40% Sát thương',
    description: 'Tăng 40% sát thương',
    staminaCost: 75,
    delayAdd: 45,
    damageMultiplier: 1.4,
    extraShots: 0,
    isTrident: false,
    isTeleport: false,
  },
  dmg50: {
    id: 'dmg50',
    name: '+50% Sát thương',
    description: 'Tăng 50% sát thương',
    staminaCost: 100,
    delayAdd: 65,
    damageMultiplier: 1.5,
    extraShots: 0,
    isTrident: false,
    isTeleport: false,
  },
  extra1: {
    id: 'extra1',
    name: '+1 Viên đạn',
    description: 'Bắn thêm 1 viên (giảm 30% damage/viên)',
    staminaCost: 60,
    delayAdd: 40,
    damageMultiplier: 0.7,
    extraShots: 1,
    isTrident: false,
    isTeleport: false,
  },
  trident: {
    id: 'trident',
    name: 'Ba tia',
    description: '3 viên theo hình quạt',
    staminaCost: 80,
    delayAdd: 50,
    damageMultiplier: 0.6,
    extraShots: 0,
    isTrident: true,
    isTeleport: false,
  },
  teleport: {
    id: 'teleport',
    name: 'Bay',
    description: 'Di chuyển tức thời đến vị trí mới',
    staminaCost: 50,
    delayAdd: 30,
    damageMultiplier: 1.0,
    extraShots: 0,
    isTrident: false,
    isTeleport: true,
  },
}

// ─── Map definitions ───────────────────────────────────────────────────────

export const MAPS: Record<MapId, GameMap> = {
  valley: {
    id: 'valley',
    name: 'Thung Lũng',
    width: 800,
    height: 480,
    skyColor: '#1a3a5c',
    groundColor: '#4a7c3f',
    groundPattern: 'hills',
  },
  castle: {
    id: 'castle',
    name: 'Lâu đài',
    width: 800,
    height: 480,
    skyColor: '#2d1b4e',
    groundColor: '#A06E47',
    groundPattern: 'pillars',
  },
  island: {
    id: 'island',
    name: 'Hòn đảo',
    width: 800,
    height: 480,
    skyColor: '#0d3b5e',
    groundColor: '#0F2161',
    groundPattern: 'flat',
  },
}

// ─── Character factory ─────────────────────────────────────────────────────

function makeCharacter(
  id: number,
  name: string,
  color: string,
  emoji: string,
  stats: CharacterStats,
  weapon: Weapon,
  isAI: boolean,
): Character {
  const maxStamina = computeMaxStamina(stats.agi)
  return {
    id,
    name,
    build: 'custom',
    color,
    emoji,
    stats,
    hp: stats.maxHp,
    maxHp: stats.maxHp,
    stamina: maxStamina,
    maxStamina,
    delayAccum: 0,
    weapon,
    x: 0,
    y: 0,
    facingRight: id === 0,
    isAI,
    isFalling: false,
    fallVy: 0,
    alive: true,
  }
}

// ─── State ─────────────────────────────────────────────────────────────────

export function useGameState() {
  const characters = reactive<Character[]>([])
  const turn = reactive<TurnState>({
    activeCharId: 0,
    phase: 'aiming',
    timeLeft: 15,
    angle: 45,
    power: 50,
    powerCharging: false,
    selectedBuffs: [],
    activeBuffCoeff: 1.0,
    activeShotCount: 1,
    isTrident: false,
    hasTeleport: false,
    lastAngle: null,
  })
  const wind = reactive<Wind>({ value: 0, changed: false })
  const turnCount = ref(0)
  const result = ref<GameResult | null>(null)
  const selectedMap = ref<MapId>('valley')

  const activeChar = computed(() => characters.find((c) => c.id === turn.activeCharId))

  const turnOrder = computed(() =>
    [...characters].filter((c) => c.alive).sort((a, b) => a.delayAccum - b.delayAccum),
  )

  // ─── Setup ───────────────────────────────────────────────────────────────

  function setupGame(
    p1Name: string,
    p1Weapon: WeaponId,
    p1Preset: CharacterPreset,
    p2Name: string,
    p2Weapon: WeaponId,
    p2Preset: CharacterPreset,
    vsAI: boolean,
    mapId: MapId,
  ) {
    characters.splice(0)
    result.value = null
    turnCount.value = 0
    selectedMap.value = mapId

    const emoji0 = p1Preset.emoji
    const emoji1 = p2Preset.emoji
    const c0 = makeCharacter(0, p1Name, '#FF6B4A', emoji0, p1Preset.stats, WEAPONS[p1Weapon], false)
    const c1 = makeCharacter(1, p2Name, '#38BDF8', emoji1, p2Preset.stats, WEAPONS[p2Weapon], vsAI)

    characters.push(c0, c1)

    // Positions set externally after terrain is ready
    rollWind()
    activateTurn(0)
  }

  function placeCharacters(map: GameMap, getGroundY: (x: number, fromY: number) => number) {
    const margin = 100
    const c0 = characters[0]
    const c1 = characters[1]
    if (!c0 || !c1) return

    c0.x = margin
    c0.y = getGroundY(margin, 0) - 24
    c0.facingRight = true

    c1.x = map.width - margin
    c1.y = getGroundY(map.width - margin, 0) - 24
    c1.facingRight = false
  }

  // ─── Turn management ─────────────────────────────────────────────────────

  function rollWind() {
    const prev = wind.value
    wind.value = Math.random() * 20 - 10 // -10 to +10
    wind.changed = wind.value !== prev
  }

  function activateTurn(charId: number) {
    const char = characters.find((c) => c.id === charId)
    if (!char) return

    turn.activeCharId = charId
    turn.phase = char.isAI ? 'ai_thinking' : 'buff_select'
    turn.timeLeft = 15
    turn.angle =
      char.weapon.minAngle + Math.floor((char.weapon.maxAngle - char.weapon.minAngle) / 2)
    turn.power = 50
    turn.powerCharging = false
    turn.selectedBuffs = []
    turn.activeBuffCoeff = 1.0
    turn.activeShotCount = 1
    turn.isTrident = false
    turn.hasTeleport = false
    // Refill stamina
    char.stamina = char.maxStamina
  }

  function advanceTurn() {
    const char = activeChar.value
    if (!char) return

    // Save last angle
    turn.lastAngle = turn.angle

    // Compute delay for this turn
    const itemDelay = turn.selectedBuffs.reduce((sum, id) => sum + BUFFS[id].delayAdd, 0)
    const delay = computeDelay(char.weapon.delayBase, itemDelay, char.stats.agi)
    char.delayAccum += delay

    turnCount.value++
    rollWind()

    // Next character = lowest delayAccum among alive
    const alive = characters.filter((c) => c.alive)
    if (alive.length === 0) return
    const next = alive.reduce((a, b) => (a.delayAccum <= b.delayAccum ? a : b))
    activateTurn(next.id)
  }

  // ─── Buff selection ───────────────────────────────────────────────────────

  function toggleBuff(id: BuffId) {
    const char = activeChar.value
    if (!char) return

    const buff = BUFFS[id]
    const idx = turn.selectedBuffs.indexOf(id)

    if (idx >= 0) {
      // Remove
      turn.selectedBuffs.splice(idx, 1)
      char.stamina += buff.staminaCost
    } else {
      // Prevent trident + extra mix
      if (buff.isTrident && turn.selectedBuffs.includes('extra1')) return
      if (id === 'extra1' && turn.isTrident) return
      // Check stamina
      if (char.stamina < buff.staminaCost) return
      char.stamina -= buff.staminaCost
      turn.selectedBuffs.push(id)
    }

    // Recompute composite buff state
    recomputeBuffState()
  }

  function recomputeBuffState() {
    let coeff = 1.0
    let shots = 1
    let trident = false
    let teleport = false

    for (const id of turn.selectedBuffs) {
      const b = BUFFS[id]
      if (b.isTrident) {
        trident = true
        coeff *= b.damageMultiplier
      } else if (b.isTeleport) {
        teleport = true
      } else if (b.extraShots > 0) {
        shots += b.extraShots
        coeff *= b.damageMultiplier
      } else {
        coeff *= b.damageMultiplier
      }
    }

    turn.activeBuffCoeff = coeff
    turn.activeShotCount = shots
    turn.isTrident = trident
    turn.hasTeleport = teleport
  }

  function confirmBuffs() {
    turn.phase = 'aiming'
  }

  // ─── Angle / Power controls ───────────────────────────────────────────────

  function adjustAngle(delta: number) {
    if (turn.phase !== 'aiming') return
    const char = activeChar.value
    if (!char) return
    const newAngle = turn.angle + delta
    turn.angle = Math.max(char.weapon.minAngle, Math.min(char.weapon.maxAngle, newAngle))
  }

  function startPowerCharge() {
    if (turn.phase !== 'aiming') return
    turn.powerCharging = true
    turn.power = 0
  }

  function tickPowerCharge(dt: number) {
    if (!turn.powerCharging) return
    turn.power = Math.min(100, turn.power + dt * 100)
  }

  function releasePower(): number {
    turn.powerCharging = false
    turn.phase = 'firing'
    return turn.power
  }

  // ─── Damage application ───────────────────────────────────────────────────

  function applyHit(targetId: number, attackerId: number): { damage: number; isCrit: boolean } {
    const target = characters.find((c) => c.id === targetId)
    const attacker = characters.find((c) => c.id === attackerId)
    if (!target || !attacker) return { damage: 0, isCrit: false }

    const { finalDamage, isCrit } = resolveDamage(
      attacker.weapon,
      attacker.stats,
      target.stats,
      turn.activeBuffCoeff,
    )

    target.hp = Math.max(0, target.hp - finalDamage)
    if (target.hp <= 0) {
      target.alive = false
      checkGameOver()
    }

    return { damage: finalDamage, isCrit }
  }

  // ─── Fall damage ──────────────────────────────────────────────────────────

  function applyFallOutOfMap(charId: number) {
    const char = characters.find((c) => c.id === charId)
    if (!char) return
    char.hp = 0
    char.alive = false
    checkGameOver()
  }

  // ─── Game over ────────────────────────────────────────────────────────────

  function checkGameOver() {
    const alive = characters.filter((c) => c.alive)
    if (alive.length <= 1) {
      const winner = alive[0] ?? null
      result.value = {
        winnerId: winner?.id ?? null,
        winnerName: winner?.name ?? null,
        turns: turnCount.value,
      }
    }
  }

  function isGameOver(): boolean {
    return result.value !== null
  }

  function clearResult() {
    result.value = null
  }

  // ─── Timer ────────────────────────────────────────────────────────────────

  function tickTimer(dt: number): boolean {
    if (turn.phase !== 'aiming' && turn.phase !== 'buff_select') return false
    turn.timeLeft = Math.max(0, turn.timeLeft - dt)
    if (turn.timeLeft <= 0) {
      // Auto-fire or skip
      if (turn.phase === 'buff_select') {
        turn.phase = 'aiming'
        turn.timeLeft = 10
      } else {
        // Auto fire at current settings
        return true // signal: timeout fire
      }
    }
    return false
  }

  return {
    characters,
    turn,
    wind,
    turnCount,
    result,
    selectedMap,
    activeChar,
    turnOrder,
    WEAPONS,
    BUFFS,
    MAPS,
    setupGame,
    placeCharacters,
    activateTurn,
    advanceTurn,
    toggleBuff,
    confirmBuffs,
    adjustAngle,
    startPowerCharge,
    tickPowerCharge,
    releasePower,
    applyHit,
    applyFallOutOfMap,
    isGameOver,
    clearResult,
    tickTimer,
    rollWind,
  }
}
