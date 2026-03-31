import { computed, ref } from 'vue'
import { useLocalStorage } from '@vueuse/core'
import { useIntervalFn } from '@vueuse/core'
import type {
  PlayerState,
  Quest,
  ActiveQuest,
  QuestTemplate,
  Rarity,
  Rank,
  Notification,
  BossConfig,
  ShopItem,
} from '../types'
import {
  RARITY_CONFIG,
  RARITIES,
  RANK_CONFIG,
  RANK_UP_COSTS,
  BOARD_SIZE,
  REFRESH_COST,
  SS_BOSS_INTERVAL,
  SS_MAX_EXP,
  SS_MIN_EXP,
} from '../constants'

export const isDataLoaded = ref(false)
export let AVAILABLE_QUESTS: QuestTemplate[] = []
export let SHOP_ITEMS: ShopItem[] = []
export let BOSS_CONFIG: Partial<Record<Rank, BossConfig>> = {}
export let SS_BOSS_POOL: BossConfig[] = []

function randFrom<T>(arr: T[]): T {
  const item = arr[Math.floor(Math.random() * arr.length)]
  if (item === undefined) throw new Error('Empty array')
  return item
}

function generateUid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

function rollRarity(): Rarity {
  const total = RARITIES.reduce((sum, r) => sum + RARITY_CONFIG[r].weight, 0)
  let roll = Math.random() * total
  for (const rarity of RARITIES) {
    roll -= RARITY_CONFIG[rarity].weight
    if (roll <= 0) return rarity
  }
  return 'white'
}

function buildQuestFromTemplate(template: QuestTemplate, rarity: Rarity): Quest {
  const cfg = RARITY_CONFIG[rarity]
  return {
    uid: generateUid(),
    templateId: template.id,
    name: template.name,
    description: template.description,
    category: template.category,
    icon: template.icon,
    rarity,
    exp: Math.round(template.baseExp * cfg.expMult),
    gold: Math.round(template.baseGold * cfg.goldMult),
    durationMinutes: Math.max(1, Math.round(template.baseDurationMinutes * cfg.timeMult)),
    hpRestore: Math.round(template.baseHpRestore * cfg.hpRestoreMult),
  }
}

const defaultPlayer: PlayerState = {
  hp: 100,
  maxHp: 100,
  exp: 0,
  gold: 30,
  rank: 'E',
  completedCount: 0,
  skippedCount: 0,
  bossesDefeated: 0,
  expBoostCharges: 0,
  maxActiveQuests: 3,
  freeSkipCharges: 0,
  bigExpScrollCharges: 0,
  ssLastBossTriggerExp: 0,
  shopPurchases: {},
}

export function useGameState() {
  const player = useLocalStorage<PlayerState>('bounty-board-player', { ...defaultPlayer })
  const boardQuests = useLocalStorage<Quest[]>('bounty-board-quests', [])
  const activeQuests = useLocalStorage<ActiveQuest[]>('bounty-board-active', [])

  const notifications = ref<Notification[]>([])

  async function initGameData() {
    if (isDataLoaded.value) return
    try {
      const res = await fetch('/bounty-board/data.json')
      const data = await res.json()
      AVAILABLE_QUESTS = data.quests || []
      SHOP_ITEMS = data.shopItems || []
      BOSS_CONFIG = data.bossConfig || {}
      SS_BOSS_POOL = data.ssBossPool || []

      if (boardQuests.value.length === 0) {
        fillBoard()
      }
      isDataLoaded.value = true
    } catch (err) {
      console.error('Lỗi tải dữ liệu Hội Thợ Săn:', err)
    }
  }

  // Popup state for rank-up event
  const rankUpEvent = ref<{ rank: Rank; boss: BossConfig } | null>(null)

  // Backfill for existing saves
  if (!player.value.maxActiveQuests) player.value.maxActiveQuests = 3
  if (player.value.freeSkipCharges === undefined) player.value.freeSkipCharges = 0
  if (player.value.bigExpScrollCharges === undefined) player.value.bigExpScrollCharges = 0
  if (player.value.ssLastBossTriggerExp === undefined) player.value.ssLastBossTriggerExp = 0
  if (!player.value.shopPurchases) player.value.shopPurchases = {}
  if (player.value.skippedCount === undefined) player.value.skippedCount = 0
  if (player.value.bossesDefeated === undefined) player.value.bossesDefeated = 0

  function pushNotif(type: Notification['type'], message: string) {
    const id = generateUid()
    notifications.value.push({ id, type, message })
    setTimeout(() => {
      notifications.value = notifications.value.filter((n) => n.id !== id)
    }, 5000)
  }

  function clearRankUpEvent() {
    rankUpEvent.value = null
  }

  // ── Board ──────────────────────────────────────────────────────────────────

  function pickUniqueTemplates(count: number, excludeIds: Set<string>): QuestTemplate[] {
    const pool = AVAILABLE_QUESTS.filter((t) => !excludeIds.has(t.id))
    const shuffled = [...pool].sort(() => Math.random() - 0.5)
    return shuffled.slice(0, Math.min(count, shuffled.length))
  }

  function fillBoard() {
    const excluded = new Set<string>()
    const templates = pickUniqueTemplates(BOARD_SIZE, excluded)
    boardQuests.value = templates.map((t) => buildQuestFromTemplate(t, rollRarity()))
  }

  function refreshBoard(force = false) {
    if (!force) {
      if (player.value.gold < REFRESH_COST) {
        pushNotif('warning', `Không đủ Vàng! Cần ${REFRESH_COST} Gold để làm mới bảng.`)
        return
      }
      player.value.gold -= REFRESH_COST
    }
    fillBoard()
    pushNotif('success', '🎲 Bảng nhiệm vụ đã được làm mới!')
  }

  function acceptQuest(uid: string) {
    const maxSlots = player.value.maxActiveQuests ?? 3
    const nonBossActive = activeQuests.value.filter((q) => !q.isBoss).length
    if (nonBossActive >= maxSlots) {
      pushNotif(
        'warning',
        `Đã đạt giới hạn ${maxSlots} nhiệm vụ cùng lúc! Mua Huy Hiệu để mở thêm.`,
      )
      return
    }

    const idx = boardQuests.value.findIndex((q) => q.uid === uid)
    if (idx === -1) return
    const quest = boardQuests.value[idx]
    if (!quest) return

    const now = Date.now()
    const active: ActiveQuest = {
      ...quest,
      acceptedAt: now,
      endTime: now + quest.durationMinutes * 60 * 1000,
      isBoss: false,
    }
    activeQuests.value.push(active)

    const existingIds = new Set([
      ...boardQuests.value.map((q) => q.templateId),
      ...activeQuests.value.map((q) => q.templateId),
    ])
    existingIds.delete(quest.templateId)
    const pool = AVAILABLE_QUESTS.filter((t) => !existingIds.has(t.id))
    if (pool.length > 0) {
      boardQuests.value.splice(idx, 1, buildQuestFromTemplate(randFrom(pool), rollRarity()))
    } else {
      boardQuests.value.splice(idx, 1)
    }

    pushNotif('success', `⚔️ Đã chấp nhận: ${quest.name}`)
  }

  function randomAccept() {
    if (boardQuests.value.length === 0) return
    acceptQuest(randFrom(boardQuests.value).uid)
  }

  // ── Boss System ───────────────────────────────────────────────────────────

  function spawnBossQuest(cfg: BossConfig) {
    const now = Date.now()
    const boss: ActiveQuest = {
      uid: generateUid(),
      templateId: `boss-${generateUid()}`,
      name: cfg.name,
      description: cfg.description,
      category: 'social',
      icon: cfg.icon,
      rarity: 'gold',
      exp: 0,
      gold: cfg.goldReward,
      durationMinutes: cfg.durationMinutes,
      hpRestore: 9999,
      acceptedAt: now,
      endTime: now + cfg.durationMinutes * 60 * 1000,
      isBoss: true,
    }
    activeQuests.value.push(boss)
  }

  function triggerRankBoss(rank: Rank) {
    const cfg = BOSS_CONFIG[rank]
    if (!cfg) return
    spawnBossQuest(cfg)
    // Show rank-up popup
    rankUpEvent.value = { rank, boss: cfg }
    pushNotif('boss', `⚠️ NHIỆM VỤ THĂNG CẤP [${rank}]: ${cfg.name}`)
  }

  function triggerSSRandomBoss() {
    const boss = randFrom(SS_BOSS_POOL)
    spawnBossQuest(boss)
    pushNotif('boss', `⚠️ BOSS SS XUẤT HIỆN: ${boss.name} — ${boss.goldReward} Gold!`)
  }

  // ── Quest Completion ──────────────────────────────────────────────────────

  function applyExpGain(base: number): number {
    let gain = base
    if ((player.value.bigExpScrollCharges ?? 0) > 0) {
      gain = base * 5
      player.value.bigExpScrollCharges = (player.value.bigExpScrollCharges ?? 1) - 1
      pushNotif('success', `🧠 EXP x5 kích hoạt! Còn ${player.value.bigExpScrollCharges} lần.`)
    } else if (player.value.expBoostCharges > 0) {
      gain = base * 2
      player.value.expBoostCharges = Math.max(0, player.value.expBoostCharges - 1)
      pushNotif('success', `✨ EXP x2 kích hoạt! Còn ${player.value.expBoostCharges} lần.`)
    }
    player.value.exp += gain
    return gain
  }

  function checkSsEndgame() {
    if (player.value.rank !== 'SS') return

    // Game complete: total EXP reaches 3600
    if (player.value.exp >= SS_MAX_EXP) {
      if ((player.value.ssLastBossTriggerExp ?? 0) < SS_MAX_EXP) {
        player.value.ssLastBossTriggerExp = SS_MAX_EXP
        pushNotif(
          'levelup',
          '🏆🏆🏆 PHÁ ĐẢO! Đạt 3600 EXP — Ngươi đã là Huyền Thoại Bất Tử thật sự!',
        )
      }
      return
    }

    // Every 300 EXP above SS_MIN_EXP (1500), spawn a random boss
    const expAboveSs = Math.max(0, player.value.exp - SS_MIN_EXP)
    const last = player.value.ssLastBossTriggerExp ?? 0
    const next = last + SS_BOSS_INTERVAL
    if (expAboveSs >= next) {
      player.value.ssLastBossTriggerExp = next
      triggerSSRandomBoss()
    }
  }

  function checkRankUp() {
    const rankOrder: Rank[] = ['F', 'E', 'D', 'C', 'B', 'A', 'S', 'SS']
    let currentIdx = rankOrder.indexOf(player.value.rank)

    while (currentIdx < rankOrder.length - 1) {
      const nextRank = rankOrder[currentIdx + 1]
      if (!nextRank) break
      const nextCfg = RANK_CONFIG.find((r) => r.label === nextRank)
      if (!nextCfg) break
      if (player.value.exp < nextCfg.minExp) break

      const cost = RANK_UP_COSTS[nextRank] ?? 0
      if (player.value.gold < cost) {
        pushNotif(
          'warning',
          `EXP đủ lên Rank ${nextRank}! Cần thêm ${cost - player.value.gold} Gold để thăng cấp.`,
        )
        break
      }

      player.value.gold -= cost
      player.value.rank = nextRank
      currentIdx++

      const goldMsg = cost > 0 ? ` (−${cost} Gold)` : ''
      const cfg = RANK_CONFIG.find((r) => r.label === nextRank)
      pushNotif('levelup', `🎉 THĂNG HẠNG ${nextRank} — ${cfg?.title ?? ''}!${goldMsg}`)

      // Trigger rank-up boss
      triggerRankBoss(nextRank)
    }
  }

  function completeQuest(uid: string) {
    const idx = activeQuests.value.findIndex((q) => q.uid === uid)
    if (idx === -1) return
    const quest = activeQuests.value[idx]
    if (!quest) return

    if (quest.isBoss) {
      const gold = quest.gold
      player.value.gold += gold
      player.value.hp = player.value.maxHp
      player.value.bossesDefeated++
      activeQuests.value.splice(idx, 1)
      pushNotif('boss', `🏆 BOSS ĐÃ BẠI! +${gold} Gold + Hồi Đầy Máu!`)
      return
    }

    const gained = applyExpGain(quest.exp)
    player.value.gold += quest.gold
    player.value.hp = Math.min(player.value.maxHp, player.value.hp + quest.hpRestore)
    player.value.completedCount++
    activeQuests.value.splice(idx, 1)

    checkRankUp()
    checkSsEndgame()
    pushNotif('success', `🙌 Xong! +${gained} EXP, +${quest.gold} Gold, +${quest.hpRestore} HP`)
  }

  function failQuest(uid: string) {
    const idx = activeQuests.value.findIndex((q) => q.uid === uid)
    if (idx === -1) return
    const quest = activeQuests.value[idx]
    if (!quest) return

    if (quest.isBoss) {
      const cfg = BOSS_CONFIG[player.value.rank]
      const pct = cfg?.failHpLossPercent ?? 0.4
      const hpLoss = Math.round(player.value.maxHp * pct)
      player.value.hp = Math.max(0, player.value.hp - hpLoss)
      activeQuests.value.splice(idx, 1)
      pushNotif('fail', `💥 Boss đánh bại bạn! −${hpLoss} HP (−${Math.round(pct * 100)}% máu)`)
      return
    }

    const hpLoss = Math.round(player.value.maxHp * 0.1)
    const expLoss = Math.min(player.value.exp, 5)
    player.value.hp = Math.max(0, player.value.hp - hpLoss)
    player.value.exp = Math.max(0, player.value.exp - expLoss)
    activeQuests.value.splice(idx, 1)
    pushNotif('fail', `💀 Thất bại: ${quest.name} — −${hpLoss} HP, −${expLoss} EXP`)
  }

  function skipQuest(uid: string) {
    const idx = activeQuests.value.findIndex((q) => q.uid === uid)
    if (idx === -1) return
    const quest = activeQuests.value[idx]
    if (!quest) return

    if (quest.isBoss) {
      pushNotif('warning', '⚠️ Không thể bỏ qua Nhiệm Vụ Thăng Cấp! Hoàn thành hoặc chờ hết giờ.')
      return
    }

    if ((player.value.freeSkipCharges ?? 0) > 0) {
      player.value.freeSkipCharges = (player.value.freeSkipCharges ?? 1) - 1
      player.value.skippedCount++
      activeQuests.value.splice(idx, 1)
      pushNotif(
        'success',
        `🛡️ Bỏ qua miễn phí: ${quest.name} (còn ${player.value.freeSkipCharges} lệnh)`,
      )
      return
    }

    const hpLoss = Math.round(player.value.maxHp * 0.1)
    const goldLoss = Math.min(player.value.gold, 5)
    const expLoss = Math.min(player.value.exp, 5)
    player.value.hp = Math.max(0, player.value.hp - hpLoss)
    player.value.gold = Math.max(0, player.value.gold - goldLoss)
    player.value.exp = Math.max(0, player.value.exp - expLoss)
    player.value.skippedCount++
    activeQuests.value.splice(idx, 1)
    pushNotif('warning', `⏩ Bỏ qua: ${quest.name} — −${hpLoss} HP, −${goldLoss} Gold`)
  }

  // ── Shop ──────────────────────────────────────────────────────────────────

  function buyItem(itemId: string) {
    const item = SHOP_ITEMS.find((i) => i.id === itemId)
    if (!item) return
    if (player.value.gold < item.price) {
      pushNotif('warning', `Không đủ Vàng! Cần ${item.price} Gold.`)
      return
    }
    player.value.gold -= item.price

    if (item.effect === 'hp_potion') {
      const healed = Math.min(30, player.value.maxHp - player.value.hp)
      player.value.hp += healed
      pushNotif('success', `🧪 ${item.name}: +${healed} HP`)
    } else if (item.effect === 'exp_scroll') {
      player.value.expBoostCharges += 3
      pushNotif('success', `📜 ${item.name}: EXP x2 cho 3 nhiệm vụ!`)
    } else if (item.effect === 'dragon_heart') {
      player.value.maxHp += 20
      player.value.hp = player.value.maxHp
      pushNotif('success', `💎 ${item.name}: Máu Tối Đa +20, hồi đầy!`)
    } else if (item.effect === 'quest_slot') {
      const current = player.value.maxActiveQuests ?? 3
      if (current >= 6) {
        player.value.gold += item.price
        pushNotif('warning', 'Đã đạt giới hạn tối đa 6 nhiệm vụ!')
        return
      }
      player.value.maxActiveQuests = current + 1
      pushNotif(
        'success',
        `🔓 ${item.name}: Nhận được ${player.value.maxActiveQuests} nhiệm vụ cùng lúc!`,
      )
    } else if (item.effect === 'big_hp_potion') {
      const healed = Math.min(60, player.value.maxHp - player.value.hp)
      player.value.hp += healed
      pushNotif('success', `❤️‍🔥 ${item.name}: +${healed} HP!`)
    } else if (item.effect === 'gold_scroll') {
      // +20% of current gold, max 10 purchases
      const purchases = player.value.shopPurchases[item.id] ?? 0
      const cap = item.maxOwned ?? 10
      if (purchases >= cap) {
        player.value.gold += item.price
        pushNotif('warning', `🪩 ${item.name}: Đã mua tối đa ${cap} lần!`)
        return
      }
      const bonus = Math.floor(player.value.gold * 0.2)
      player.value.gold += bonus
      player.value.shopPurchases[item.id] = purchases + 1
      pushNotif(
        'success',
        `🪩 ${item.name}: +${bonus} Gold (20% của ${player.value.gold - bonus}G)! Lần ${purchases + 1}/${cap}.`,
      )
    } else if (item.effect === 'free_skip') {
      player.value.freeSkipCharges = (player.value.freeSkipCharges ?? 0) + 1
      pushNotif(
        'success',
        `🛡️ ${item.name}: +1 lệnh xá tội (tổng ${player.value.freeSkipCharges})!`,
      )
    } else if (item.effect === 'big_exp_scroll') {
      player.value.bigExpScrollCharges = (player.value.bigExpScrollCharges ?? 0) + 1
      pushNotif(
        'success',
        `🧠 ${item.name}: +1 lần EXP x5 (tổng ${player.value.bigExpScrollCharges})!`,
      )
    } else if (item.effect === 'big_gold') {
      player.value.gold += 250
      pushNotif('success', `💰 ${item.name}: +250 Gold!`)
    } else if (item.effect === 'time_extend') {
      const now = Date.now()
      const extended = activeQuests.value.filter((q) => !q.isBoss && now < q.endTime)
      if (extended.length === 0) {
        player.value.gold += item.price
        pushNotif('warning', 'Không có nhiệm vụ nào đang làm để kéo dài!')
        return
      }
      activeQuests.value = activeQuests.value.map((q) =>
        !q.isBoss && now < q.endTime ? { ...q, endTime: q.endTime + 60 * 60 * 1000 } : q,
      )
      pushNotif('success', `⏳ ${item.name}: +60 phút cho ${extended.length} nhiệm vụ!`)
    } else if (item.effect === 'warrior_gauntlet') {
      player.value.maxHp += 50
      player.value.hp = player.value.maxHp
      pushNotif('success', `🛡️ ${item.name}: Máu Tối Đa +50, hồi đầy!`)
    } else if (item.effect === 'instant_exp') {
      player.value.exp += 100
      checkRankUp()
      pushNotif('success', `💎 Đá Tri Thức: +100 EXP ngay lập tức!`)
    }
  }

  // ── Auto-fail expired ──────────────────────────────────────────────────────

  function checkExpired() {
    const now = Date.now()
    const expired = activeQuests.value.filter((q) => now >= q.endTime)
    for (const q of expired) failQuest(q.uid)
  }

  useIntervalFn(checkExpired, 5000)

  // ── Computed ──────────────────────────────────────────────────────────────

  const currentRankConfig = computed(() => RANK_CONFIG.find((r) => r.label === player.value.rank))

  const expProgress = computed(() => {
    if (player.value.rank === 'SS') {
      if (player.value.exp >= SS_MAX_EXP) return 100
      // Progress toward next 300-EXP boss checkpoint above SS_MIN_EXP=1500
      const expAboveSs = Math.max(0, player.value.exp - SS_MIN_EXP)
      const last = player.value.ssLastBossTriggerExp ?? 0
      const inRange = expAboveSs - last
      return Math.min(100, Math.max(0, Math.round((inRange / SS_BOSS_INTERVAL) * 100)))
    }
    const cfg = currentRankConfig.value
    if (!cfg || cfg.nextExp === null) return 100
    const rangeSize = cfg.nextExp - cfg.minExp
    if (rangeSize <= 0) return 0
    const inRange = player.value.exp - cfg.minExp
    return Math.min(100, Math.max(0, Math.round((inRange / rangeSize) * 100)))
  })

  const hpPercent = computed(() => Math.round((player.value.hp / player.value.maxHp) * 100))

  const isGameComplete = computed(
    () => player.value.rank === 'SS' && player.value.exp >= SS_MAX_EXP,
  )

  const ssProgress = computed(() => {
    if (player.value.rank !== 'SS') return null
    const checkpoint = player.value.ssLastBossTriggerExp ?? 0
    const bossNum = Math.floor(checkpoint / SS_BOSS_INTERVAL)
    const totalBosses = SS_MAX_EXP / SS_BOSS_INTERVAL
    return { bossNum, totalBosses, nextAt: checkpoint + SS_BOSS_INTERVAL }
  })

  function resetPlayer() {
    player.value = { ...defaultPlayer }
    boardQuests.value = []
    activeQuests.value = []
    fillBoard()
    pushNotif('warning', '🔄 Đã reset nhân vật.')
  }

  return {
    player,
    boardQuests,
    activeQuests,
    notifications,
    rankUpEvent,
    clearRankUpEvent,
    refreshBoard,
    acceptQuest,
    randomAccept,
    completeQuest,
    failQuest,
    skipQuest,
    buyItem,
    resetPlayer,
    expProgress,
    hpPercent,
    currentRankConfig,
    isGameComplete,
    ssProgress,
    isDataLoaded,
    initGameData,
  }
}
