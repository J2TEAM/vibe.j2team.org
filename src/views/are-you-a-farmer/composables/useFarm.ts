import { ref, computed } from 'vue'
import { useStorage, useIntervalFn } from '@vueuse/core'
import type { Seed, Plot, Toast, Quest } from '../types'

export const AVAILABLE_SEEDS: Seed[] = [
  { id: 'tomato', name: 'Cà chua', cost: 10, reward: 25, growTime: 10, icon: 'twemoji:tomato' },
  { id: 'carrot', name: 'Cà rốt', cost: 25, reward: 60, growTime: 25, icon: 'twemoji:carrot' },
  { id: 'potato', name: 'Khoai tây', cost: 40, reward: 100, growTime: 40, icon: 'twemoji:potato' },
  { id: 'corn', name: 'Bắp', cost: 80, reward: 220, growTime: 60, icon: 'twemoji:ear-of-corn' },
  {
    id: 'broccoli',
    name: 'Súp lơ',
    cost: 150,
    reward: 450,
    growTime: 90,
    icon: 'twemoji:broccoli',
  },
  {
    id: 'eggplant',
    name: 'Cà tím',
    cost: 250,
    reward: 800,
    growTime: 120,
    icon: 'twemoji:eggplant',
  },
  {
    id: 'watermelon',
    name: 'Dưa hấu',
    cost: 500,
    reward: 1800,
    growTime: 300,
    icon: 'twemoji:watermelon',
  },
  {
    id: 'strawberry',
    name: 'Dâu tây',
    cost: 800,
    reward: 3200,
    growTime: 600,
    icon: 'twemoji:strawberry',
  },
  {
    id: 'pineapple',
    name: 'Dứa',
    cost: 1500,
    reward: 6500,
    growTime: 1200,
    icon: 'twemoji:pineapple',
  },
  {
    id: 'grapes',
    name: 'Nho tím',
    cost: 3000,
    reward: 14000,
    growTime: 2400,
    icon: 'twemoji:grapes',
  },
  {
    id: 'cherries',
    name: 'Anh đào',
    cost: 7000,
    reward: 35000,
    growTime: 3600,
    icon: 'twemoji:cherries',
  },
  {
    id: 'dragonfruit',
    name: 'Thanh long',
    cost: 15000,
    reward: 85000,
    growTime: 7200,
    icon: 'twemoji:dragon-face',
  },
]

// Cập nhật mã màu chuẩn Design System cho Gacha
export const GACHA_OPTIONS = [
  { id: 'jackpot', label: '15.000 Xu', icon: 'twemoji:money-bag', color: '#FFB830' }, // accent-amber
  {
    id: 'storm',
    label: 'Bão Táp',
    icon: 'twemoji:cloud-with-lightning-and-rain',
    color: '#4A6180',
  }, // text-dim
  { id: 'rain', label: 'Mưa', icon: 'twemoji:cloud-with-rain', color: '#38BDF8' }, // accent-sky
  { id: 'pest', label: 'Đại Dịch', icon: 'twemoji:bug', color: '#FF6B4A' }, // accent-coral
  { id: 'mini_jackpot', label: '3.000 Xu', icon: 'twemoji:coin', color: '#8B9DB5' }, // text-secondary
  { id: 'thief', label: 'Trộm', icon: 'twemoji:ninja', color: '#1E2F42' }, // bg-elevated
  { id: 'fertilize', label: 'Thúc Chín', icon: 'twemoji:sparkles', color: '#F0EDE6' }, // text-primary
  { id: 'trash', label: '1 Xu', icon: 'twemoji:skull', color: '#253549' }, // border-default
]

const UPGRADE_PRICES = {
  fertilizer: [100, 300, 800, 2000, 5000],
  scythe: [150, 400, 1000, 2500, 6000],
}

const getNextEvenHour = () => {
  const now = new Date()
  const currentHour = now.getHours()
  const nextHour = currentHour % 2 === 0 ? currentHour + 2 : currentHour + 1
  const next = new Date(now)
  next.setHours(nextHour, 0, 0, 0)
  return next.getTime()
}

const coins = useStorage('farmer-coins', 100)
const level = useStorage('farmer-level', 1)
const xp = useStorage('farmer-xp', 0)
const upgrades = useStorage('farmer-upgrades', { fertilizer: 0, scythe: 0 })
const nextQuestReset = useStorage('farmer-quest-reset', getNextEvenHour())
const questResetCountdown = ref('')
const isShaking = ref(false)
const selectedSeed = ref<Seed | null>(null)
const toasts = ref<Toast[]>([])
let toastId = 0
const coinTargetRef = ref<HTMLElement | null>(null)
const flyingCoins = ref<
  { id: number; startX: number; startY: number; endX: number; endY: number; amount: number }[]
>([])
let flyId = 0
const now = ref(Date.now())

const plots = useStorage<Plot[]>('farmer-plots-v6', [
  {
    id: 1,
    seedId: null,
    plantedAt: null,
    watered: false,
    isUnlocked: true,
    unlockCost: 0,
    hasBug: false,
  },
  {
    id: 2,
    seedId: null,
    plantedAt: null,
    watered: false,
    isUnlocked: true,
    unlockCost: 0,
    hasBug: false,
  },
  {
    id: 3,
    seedId: null,
    plantedAt: null,
    watered: false,
    isUnlocked: false,
    unlockCost: 50,
    hasBug: false,
  },
  {
    id: 4,
    seedId: null,
    plantedAt: null,
    watered: false,
    isUnlocked: false,
    unlockCost: 150,
    hasBug: false,
  },
  {
    id: 5,
    seedId: null,
    plantedAt: null,
    watered: false,
    isUnlocked: false,
    unlockCost: 400,
    hasBug: false,
  },
  {
    id: 6,
    seedId: null,
    plantedAt: null,
    watered: false,
    isUnlocked: false,
    unlockCost: 800,
    hasBug: false,
  },
  {
    id: 7,
    seedId: null,
    plantedAt: null,
    watered: false,
    isUnlocked: false,
    unlockCost: 1500,
    hasBug: false,
  },
  {
    id: 8,
    seedId: null,
    plantedAt: null,
    watered: false,
    isUnlocked: false,
    unlockCost: 3000,
    hasBug: false,
  },
  {
    id: 9,
    seedId: null,
    plantedAt: null,
    watered: false,
    isUnlocked: false,
    unlockCost: 6000,
    hasBug: false,
  },
])

const quests = useStorage<Quest[]>('farmer-quests-v3', [
  {
    id: 'q1',
    title: 'Khởi nghiệp',
    description: 'Thu hoạch 5 Cà chua',
    type: 'harvest',
    targetId: 'tomato',
    target: 5,
    progress: 0,
    reward: 100,
    isClaimed: false,
  },
  {
    id: 'q2',
    title: 'Người trữ nước',
    description: 'Tưới cây 10 lần',
    type: 'water',
    target: 10,
    progress: 0,
    reward: 150,
    isClaimed: false,
  },
  {
    id: 'q3',
    title: 'Nông dân cà rốt',
    description: 'Thu hoạch 10 Cà rốt',
    type: 'harvest',
    targetId: 'carrot',
    target: 10,
    progress: 0,
    reward: 300,
    isClaimed: false,
  },
  {
    id: 'q4',
    title: 'Dũng sĩ diệt sâu',
    description: 'Đập 5 con sâu',
    type: 'bug',
    target: 5,
    progress: 0,
    reward: 400,
    isClaimed: false,
  },
  {
    id: 'q5',
    title: 'Vua Bắp',
    description: 'Thu hoạch 10 Bắp',
    type: 'harvest',
    targetId: 'corn',
    target: 10,
    progress: 0,
    reward: 600,
    isClaimed: false,
  },
  {
    id: 'q6',
    title: 'Đại gia tiền lẻ',
    description: 'Kiếm 2000 Xu',
    type: 'earn',
    target: 2000,
    progress: 0,
    reward: 500,
    isClaimed: false,
  },
  {
    id: 'q7',
    title: 'Giải khát mùa hè',
    description: 'Thu hoạch 5 Dưa hấu',
    type: 'harvest',
    targetId: 'watermelon',
    target: 5,
    progress: 0,
    reward: 1500,
    isClaimed: false,
  },
  {
    id: 'q8',
    title: 'Trùm tư bản',
    description: 'Kiếm 15.000 Xu',
    type: 'earn',
    target: 15000,
    progress: 0,
    reward: 3000,
    isClaimed: false,
  },
])

let isGameLoopInitialized = false

export function useFarm() {
  const xpToNextLevel = computed(() => level.value * 150)

  if (!isGameLoopInitialized) {
    isGameLoopInitialized = true
    useIntervalFn(() => {
      const current = Date.now()
      now.value = current
      if (current >= nextQuestReset.value) {
        quests.value.forEach((q) => {
          q.progress = 0
          q.isClaimed = false
        })
        nextQuestReset.value = getNextEvenHour()
      }
      plots.value.forEach((p) => {
        if (p.seedId && p.plantedAt) {
          const seed = getActualSeedInfo(p.seedId)
          if (seed) {
            const elapsed = (current - p.plantedAt) / 1000
            if (!p.hasBug && elapsed > 2 && elapsed < seed.growTime && Math.random() < 0.08) {
              p.hasBug = true
            }
            if (p.hasBug) p.plantedAt += 1000
          }
        }
      })
      const diff = nextQuestReset.value - current
      if (diff > 0) {
        const h = Math.floor(diff / 3600000)
        const m = Math.floor((diff % 3600000) / 60000)
        const s = Math.floor((diff % 60000) / 1000)
        questResetCountdown.value = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
      }
    }, 1000)

    if (typeof window !== 'undefined') {
      let buf = ''
      window.addEventListener('keydown', (e) => {
        buf = (buf + e.key.toLowerCase()).slice(-20)
        if (buf.includes('j2team')) {
          coins.value += 99999
          triggerShake(300)
          showToast('🚀 HACK TRÀO PHÚ!', 'success')
          buf = ''
        }
      })
    }
  }

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = ++toastId
    toasts.value.push({ id, message, type })
    setTimeout(() => {
      toasts.value = toasts.value.filter((t) => t.id !== id)
    }, 4000)
  }

  const triggerShake = (duration = 500) => {
    isShaking.value = true
    setTimeout(() => {
      isShaking.value = false
    }, duration)
  }

  const getActualSeedInfo = (seedId: string | null) => {
    const base = AVAILABLE_SEEDS.find((s) => s.id === seedId)
    if (!base) return null
    return {
      ...base,
      growTime: Math.max(1, base.growTime * (1 - upgrades.value.fertilizer * 0.1)),
      reward: Math.floor(base.reward * (1 + upgrades.value.scythe * 0.2)),
    }
  }

  const selectSeed = (seed: Seed) => {
    selectedSeed.value = seed
  }

  const harvestCrop = (event: MouseEvent | null, amount: number, seedId?: string | null) => {
    let endX = window.innerWidth - 100
    let endY = 50
    if (coinTargetRef.value) {
      const rect = coinTargetRef.value.getBoundingClientRect()
      endX = rect.left + rect.width / 2
      endY = rect.top + rect.height / 2
    }
    const id = ++flyId
    const startX = event ? event.clientX : window.innerWidth / 2
    const startY = event ? event.clientY : window.innerHeight / 2
    flyingCoins.value.push({ id, startX, startY, endX, endY, amount })

    quests.value.forEach((q) => {
      if (!q.isClaimed && q.type === 'earn') q.progress = Math.min(q.target, q.progress + amount)
      if (!q.isClaimed && q.type === 'harvest' && seedId === q.targetId)
        q.progress = Math.min(q.target, q.progress + 1)
    })

    setTimeout(() => {
      coins.value += amount
      flyingCoins.value = flyingCoins.value.filter((c) => c.id !== id)
      xp.value += amount
      if (xp.value >= xpToNextLevel.value) {
        xp.value -= xpToNextLevel.value
        level.value++
        coins.value += level.value * 100
        showToast(`🎉 Lên cấp ${level.value}! Thưởng nóng ${level.value * 100} Xu!`, 'success')
      }
    }, 800)
  }

  const plantSeed = (plotId: number, seed: Seed) => {
    const plot = plots.value.find((p) => p.id === plotId)
    if (plot && coins.value >= seed.cost) {
      coins.value -= seed.cost
      plot.seedId = seed.id
      plot.plantedAt = Date.now()
      plot.watered = false
      plot.hasBug = false
      return true
    }
    return false
  }

  const waterPlot = (plotId: number) => {
    const plot = plots.value.find((p) => p.id === plotId)
    if (plot && plot.seedId) {
      const seed = getActualSeedInfo(plot.seedId)
      if (seed) {
        plot.watered = true
        plot.plantedAt = Date.now() - (seed.growTime / 2) * 1000
        quests.value.forEach((q) => {
          if (!q.isClaimed && q.type === 'water') q.progress = Math.min(q.target, q.progress + 1)
        })
      }
    }
  }

  const harvestPlot = (plotId: number, event: MouseEvent) => {
    const plot = plots.value.find((p) => p.id === plotId)
    if (plot && plot.seedId) {
      const seed = getActualSeedInfo(plot.seedId)
      if (seed) {
        harvestCrop(event, seed.reward, plot.seedId)
        plot.seedId = plot.plantedAt = null
        plot.watered = plot.hasBug = false
      }
    }
  }

  const applyGachaReward = (resultId: string, event: MouseEvent | null) => {
    switch (resultId) {
      case 'jackpot':
        triggerShake(1000)
        harvestCrop(event, 15000, null)
        break
      case 'mini_jackpot':
        harvestCrop(event, 3000, null)
        break
      case 'refund':
        harvestCrop(event, 1000, null)
        break
      case 'trash':
        harvestCrop(event, 1, null)
        break
      case 'rain':
        plots.value.forEach((p) => {
          if (p.seedId && !p.watered) waterPlot(p.id)
        })
        break
      case 'fertilize':
        plots.value.forEach((p) => {
          if (p.seedId) {
            const s = getActualSeedInfo(p.seedId)
            if (s) {
              p.watered = true
              p.hasBug = false
              p.plantedAt = Date.now() - s.growTime * 1000
            }
          }
        })
        break
      case 'storm':
        const planted = plots.value.filter((p) => p.seedId !== null)
        if (planted.length > 0) {
          triggerShake(500)
          const rp = planted[Math.floor(Math.random() * planted.length)]
          if (rp) {
            rp.seedId = rp.plantedAt = null
            rp.watered = rp.hasBug = false
            showToast('🌪️ Bão cuốn mất cây!', 'error')
          }
        }
        break
      case 'pest':
        plots.value.forEach((p) => {
          if (p.seedId) p.hasBug = true
        })
        break
      case 'thief':
        const lost = Math.floor(coins.value * 0.1)
        coins.value -= lost
        showToast(`🥷 Trộm cuỗm ${lost} Xu!`, 'error')
        break
    }
  }

  return {
    now,
    coins,
    plots,
    level,
    xp,
    xpToNextLevel,
    upgrades,
    isShaking,
    AVAILABLE_SEEDS,
    questResetCountdown,
    toasts,
    showToast,
    getActualSeedInfo,
    coinTargetRef,
    flyingCoins,
    selectedSeed,
    selectSeed,
    plantSeed,
    waterPlot,
    harvestPlot,
    applyGachaReward,
    triggerShake,
    UPGRADE_PRICES,
    buyUpgrade: (type: 'fertilizer' | 'scythe') => {
      const lv = upgrades.value[type]
      if (lv >= 5) return
      const cost = UPGRADE_PRICES[type][lv]
      if (typeof cost !== 'number') return
      if (coins.value >= cost) {
        coins.value -= cost
        upgrades.value[type]++
      }
    },
    unlockPlot: (id: number) => {
      const p = plots.value.find((x) => x.id === id)
      if (p && !p.isUnlocked && coins.value >= p.unlockCost) {
        coins.value -= p.unlockCost
        p.isUnlocked = true
      }
    },
    quests,
    claimQuest: (id: string, e: MouseEvent) => {
      const q = quests.value.find((x) => x.id === id)
      if (q && q.progress >= q.target && !q.isClaimed) {
        q.isClaimed = true
        harvestCrop(e, q.reward, null)
      }
    },
    smashBug: (e: MouseEvent, id: number) => {
      const p = plots.value.find((x) => x.id === id)
      if (p && p.hasBug) {
        p.hasBug = false
        harvestCrop(e, 5, null)
        quests.value.forEach((q) => {
          if (!q.isClaimed && q.type === 'bug') q.progress = Math.min(q.target, q.progress + 1)
        })
      }
    },
  }
}
