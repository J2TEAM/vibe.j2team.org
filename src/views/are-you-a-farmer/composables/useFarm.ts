import { ref, computed } from 'vue'
import { useStorage, createSharedComposable, useIntervalFn } from '@vueuse/core'
import type { Seed, Plot, Toast, Quest } from '../types'

const AVAILABLE_SEEDS: Seed[] = [
  // Nhóm cơ bản (Tiền ít, lớn nhanh)
  { id: 'tomato', name: 'Cà chua', cost: 10, reward: 25, growTime: 10, icon: 'twemoji:tomato' },
  { id: 'carrot', name: 'Cà rốt', cost: 25, reward: 60, growTime: 25, icon: 'twemoji:carrot' },
  { id: 'potato', name: 'Khoai tây', cost: 40, reward: 100, growTime: 40, icon: 'twemoji:potato' },

  // Nhóm trung cấp (Bắt đầu cần đầu tư thời gian)
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

  // Nhóm cao cấp (Thời gian dài, lợi nhuận khủng)
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

  // Nhóm "Nhà giàu" (Chỉ dành cho đại gia cày cuốc)
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
  }, // Dùng tạm icon mặt rồng cho ngầu
]

const UPGRADE_PRICES = {
  fertilizer: [100, 300, 800, 2000, 5000],
  scythe: [150, 400, 1000, 2500, 6000],
}

// --- CẤU HÌNH GACHA 8 Ô ---
export const GACHA_OPTIONS = [
  { id: 'jackpot', label: '15.000 Xu', icon: 'twemoji:money-bag', color: '#fde047' },
  {
    id: 'storm',
    label: 'Bão Táp',
    icon: 'twemoji:cloud-with-lightning-and-rain',
    color: '#9ca3af',
  },
  { id: 'rain', label: 'Mưa', icon: 'twemoji:cloud-with-rain', color: '#93c5fd' },
  { id: 'pest', label: 'Đại Dịch', icon: 'twemoji:bug', color: '#fca5a5' },
  { id: 'mini_jackpot', label: '3.000 Xu', icon: 'twemoji:coin', color: '#86efac' },
  { id: 'thief', label: 'Trộm', icon: 'twemoji:ninja', color: '#d1d5db' },
  { id: 'fertilize', label: 'Thúc Chín', icon: 'twemoji:sparkles', color: '#f9a8d4' },
  { id: 'trash', label: '1 Xu', icon: 'twemoji:skull', color: '#e5e7eb' },
]

const getNextEvenHour = () => {
  const now = new Date()
  const currentHour = now.getHours()
  const nextHour = currentHour % 2 === 0 ? currentHour + 2 : currentHour + 1
  const next = new Date(now)
  next.setHours(nextHour, 0, 0, 0)
  return next.getTime()
}

function _useFarm() {
  const coins = useStorage('farmer-coins', 100)
  const level = useStorage('farmer-level', 1)
  const xp = useStorage('farmer-xp', 0)
  const xpToNextLevel = computed(() => level.value * 150)
  const upgrades = useStorage('farmer-upgrades', { fertilizer: 0, scythe: 0 })

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

  if (typeof window !== 'undefined') {
    let keyBuffer = ''
    window.addEventListener('keydown', (e) => {
      keyBuffer += e.key.toLowerCase()
      if (keyBuffer.length > 20) keyBuffer = keyBuffer.slice(-20)
      if (keyBuffer.includes('j2team')) {
        coins.value += 99999
        showToast('🚀 XIN CHÀO PHÁP SƯ CODE DẠO! HACK THÀNH CÔNG 99.999 XU!', 'success')
        keyBuffer = ''
      }
    })
  }

  const quests = useStorage<Quest[]>('farmer-quests', [
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
      title: 'Đại gia tiền lẻ',
      description: 'Kiếm tổng cộng 1000 Xu',
      type: 'earn',
      target: 1000,
      progress: 0,
      reward: 500,
      isClaimed: false,
    },
    {
      id: 'q5',
      title: 'Vua Dưa Hấu',
      description: 'Thu hoạch 5 Dưa hấu',
      type: 'harvest',
      targetId: 'watermelon',
      target: 5,
      progress: 0,
      reward: 1000,
      isClaimed: false,
    },
  ])
  const nextQuestReset = useStorage('farmer-quest-reset', getNextEvenHour())
  const questResetCountdown = ref('')
  const toasts = ref<Toast[]>([])
  let toastId = 0

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = ++toastId
    toasts.value.push({ id, message, type })
    setTimeout(() => {
      toasts.value = toasts.value.filter((t) => t.id !== id)
    }, 4000)
  }

  const checkQuestReset = () => {
    const current = Date.now()
    if (current >= nextQuestReset.value) {
      quests.value.forEach((q) => {
        q.progress = 0
        q.isClaimed = false
      })
      nextQuestReset.value = getNextEvenHour()
      showToast('Nhiệm vụ đã được làm mới! Cày tiếp đi chớ ngủ!', 'info')
    }
    const diff = nextQuestReset.value - Date.now()
    if (diff > 0) {
      const h = Math.floor(diff / (1000 * 60 * 60))
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const s = Math.floor((diff % (1000 * 60)) / 1000)
      questResetCountdown.value = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    }
  }
  checkQuestReset()

  const now = ref(Date.now())
  useIntervalFn(() => {
    now.value = Date.now()
    checkQuestReset()
    plots.value.forEach((p) => {
      if (p.seedId && p.plantedAt) {
        const seed = getActualSeedInfo(p.seedId)
        if (seed) {
          const elapsed = (Date.now() - p.plantedAt) / 1000
          if (!p.hasBug && elapsed < seed.growTime && elapsed > 2 && Math.random() < 0.01)
            p.hasBug = true
          if (p.hasBug) p.plantedAt += 1000
        }
      }
    })
  }, 1000)

  const isNight = computed(() => {
    const hour = new Date().getHours()
    return hour >= 18 || hour < 6
  })

  const trackAction = (
    type: 'harvest' | 'water' | 'earn',
    amount: number = 1,
    targetId?: string | null,
  ) => {
    quests.value.forEach((q) => {
      if (!q.isClaimed && q.type === type && (type !== 'harvest' || q.targetId === targetId)) {
        q.progress = Math.min(q.target, q.progress + amount)
      }
    })
  }

  const selectedSeed = ref<Seed | null>(null)

  const getActualSeedInfo = (seedId: string | null) => {
    const base = AVAILABLE_SEEDS.find((s) => s.id === seedId)
    if (!base) return null
    return {
      ...base,
      growTime: Math.max(1, base.growTime * (1 - upgrades.value.fertilizer * 0.1)),
      reward: Math.floor(base.reward * (1 + upgrades.value.scythe * 0.2)),
    }
  }

  const buyUpgrade = (type: 'fertilizer' | 'scythe') => {
    const currentLv = upgrades.value[type]
    if (currentLv >= 5) return
    const cost = UPGRADE_PRICES[type][currentLv]
    if (cost === undefined) return

    if (coins.value >= cost) {
      coins.value -= cost
      upgrades.value[type]++
      showToast('Nâng cấp thành công! Máy xịn cày tiền mới sướng!', 'success')
    } else {
      showToast(`Có ${coins.value} Xu mà đòi mua đồ ${cost} Xu à? Đi cày đi!`, 'error')
    }
  }

  const coinTargetRef = ref<HTMLElement | null>(null)
  const flyingCoins = ref<
    { id: number; startX: number; startY: number; endX: number; endY: number; amount: number }[]
  >([])
  let flyId = 0

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
    trackAction('earn', amount)
    if (seedId) trackAction('harvest', 1, seedId)

    setTimeout(() => {
      coins.value += amount
      flyingCoins.value = flyingCoins.value.filter((c) => c.id !== id)
      xp.value += amount
      if (xp.value >= xpToNextLevel.value) {
        xp.value -= xpToNextLevel.value
        level.value++
        const bonus = level.value * 100
        coins.value += bonus
        showToast(`🎉 Lên cấp ${level.value}! Sếp thưởng nóng ${bonus} Xu!`, 'success')
      }
    }, 800)
  }

  const smashBug = (event: MouseEvent, plotId: number) => {
    const plot = plots.value.find((p) => p.id === plotId)
    if (plot && plot.hasBug) {
      plot.hasBug = false
      harvestCrop(event, 5, null)
      showToast('Bốp! Tiểu cường đã đăng xuất, lụm 5 Xu!', 'success')
    }
  }

  // --- HỆ THỐNG TRẢ THƯỞNG 8 Ô (40% CÓ LỢI, 60% CÓ HẠI) ---
  const applyGachaReward = (resultId: string, event: MouseEvent | null) => {
    switch (resultId) {
      case 'jackpot':
        harvestCrop(event, 15000, null) // Tăng từ 2000 lên 15.000 Xu
        showToast('🎰 SIÊU NỔ HŨ 15.000 XU! Đổi đời là đây chứ đâu!', 'success')
        break
      case 'mini_jackpot':
        harvestCrop(event, 3000, null) // Tăng từ 500 lên 3000 Xu
        showToast('💰 Trúng mánh lớn! Lụm 3.000 Xu bỏ túi!', 'success')
        break
      case 'refund':
        harvestCrop(event, 1000, null) // Hoàn lại đúng giá vé mới
        showToast('⚖️ Hoà vốn! Thở phào nhẹ nhõm...', 'info')
        break
      case 'trash':
        harvestCrop(event, 1, null)
        showToast('💀 Nhận 1 Xu an ủi. Thôi cờ bạc là bác thằng bần...', 'error')
        break
      case 'rain':
        plots.value.forEach((p) => {
          if (p.seedId && !p.watered) {
            const seed = getActualSeedInfo(p.seedId)
            if (seed) {
              p.watered = true
              p.plantedAt = Date.now() - (seed.growTime / 2) * 1000
            }
          }
        })
        showToast('🌧️ Mưa nhân tạo! Đã tự động tưới cho toàn bộ vườn đang khát!', 'success')
        break
      case 'fertilize':
        plots.value.forEach((p) => {
          if (p.seedId) {
            const seed = getActualSeedInfo(p.seedId)
            if (seed) {
              p.watered = true
              p.hasBug = false
              p.plantedAt = Date.now() - seed.growTime * 1000
            }
          }
        })
        showToast('✨ Rắc phân bón thần kỳ! Toàn bộ cây đã chín ngay lập tức!', 'success')
        break
      case 'storm':
        const plantedPlots = plots.value.filter((p) => p.seedId !== null)
        if (plantedPlots.length > 0) {
          const randomPlot = plantedPlots[Math.floor(Math.random() * plantedPlots.length)]

          // Thêm dòng if này để TypeScript yên tâm là randomPlot chắc chắn tồn tại
          if (randomPlot) {
            randomPlot.seedId = null
            randomPlot.plantedAt = null
            randomPlot.watered = false
            randomPlot.hasBug = false
            showToast('🌪️ Bão táp vừa cuốn phăng đi 1 cây của bạn rồi!', 'error')
          }
        } else {
          showToast('🌪️ Bão quét qua... may quá vườn trống không!', 'info')
        }
        break
      case 'pest':
        const hasPlants = plots.value.some((p) => p.seedId !== null)
        if (hasPlants) {
          plots.value.forEach((p) => {
            if (p.seedId) p.hasBug = true
          })
          showToast('🐛 Đại dịch sâu bọ! Cây cối ngừng lớn, mau bắt sâu!', 'error')
        } else {
          showToast('🐛 Đàn sâu bay qua... nhưng không có lá để ăn!', 'info')
        }
        break
      case 'thief':
        const lost = Math.floor(coins.value * 0.1)
        if (lost > 0) {
          coins.value -= lost
          showToast(`🥷 Trộm viếng thăm! Cuỗm mất ${lost} Xu của bạn!`, 'error')
        } else {
          showToast(`🥷 Trộm mò vào... thấy bạn nghèo rớt mồng tơi nên chê!`, 'info')
        }
        break
    }
  }

  const claimQuest = (questId: string, event: MouseEvent) => {
    const q = quests.value.find((q) => q.id === questId)
    if (q && q.progress >= q.target && !q.isClaimed) {
      q.isClaimed = true
      harvestCrop(event, q.reward, null)
      showToast(`Hoàn thành: ${q.title}! Đỉnh quá khum?`, 'success')
    }
  }

  const unlockPlot = (plotId: number) => {
    const plot = plots.value.find((p) => p.id === plotId)
    if (plot && !plot.isUnlocked) {
      if (coins.value >= plot.unlockCost) {
        coins.value -= plot.unlockCost
        plot.isUnlocked = true
        showToast('Đã mua thêm đất! Chuẩn bị làm địa chủ rồi!', 'success')
      } else {
        showToast(`Cố quá thành quá cố đấy Nông dân, cày đủ ${plot.unlockCost} Xu đi!`, 'error')
      }
    }
  }

  return {
    coins,
    plots,
    selectedSeed,
    AVAILABLE_SEEDS,
    now,
    isNight,
    toasts,
    showToast,
    unlockPlot,
    coinTargetRef,
    flyingCoins,
    harvestCrop,
    level,
    xp,
    xpToNextLevel,
    upgrades,
    UPGRADE_PRICES,
    getActualSeedInfo,
    buyUpgrade,
    quests,
    claimQuest,
    trackAction,
    questResetCountdown,
    smashBug,
    applyGachaReward,
  }
}

export const useFarm = createSharedComposable(_useFarm)
