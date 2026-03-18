<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { useLocalStorage } from '@vueuse/core'
import { Icon } from '@iconify/vue'
import { BANNER_CONFIGS, BANNER_KEYS, BANNER_POOLS } from './data'
import {
  BASE_FIVE_STAR_RATE,
  BASE_FOUR_STAR_RATE,
  HARD_PITY_FIVE,
  HARD_PITY_FOUR,
  SOFT_PITY_START,
  createEmptyWishState,
  createEmptyWishStateByBanner,
  getFiveStarRate,
  performWishBatch,
} from './gacha'
import meta from './meta'
import type {
  WishBannerKey,
  WishHistoryEntry,
  WishItem,
  WishRarity,
  WishResult,
  WishState,
  WishStateByBanner,
} from './types'

type RollPhase = 'idle' | 'rolling' | 'revealing' | 'done'

interface RarityTheme {
  border: string
  text: string
  panel: string
}

const STORAGE_KEY = 'genshin-wish-simulator-state-v3'
const wishStateByBanner = useLocalStorage<WishStateByBanner>(
  STORAGE_KEY,
  createEmptyWishStateByBanner(),
)
const activeBanner = ref<WishBannerKey>('character')

const isRolling = ref(false)
const skipAnimation = ref(false)
const pendingBatch = ref<1 | 10>(1)
const latestResults = ref<WishResult[]>([])
const revealCount = ref(0)
const rollPhase = ref<RollPhase>('idle')
const activeAnimationRarity = ref<WishRarity | null>(null)
const showResultPopup = ref(false)
const showAllHistory = ref(false)
const lastBatchSize = ref<1 | 10 | null>(null)

const rarityThemes: Record<WishRarity, RarityTheme> = {
  3: {
    border: '#6f88a8',
    text: '#a7bdd8',
    panel: 'linear-gradient(155deg, rgba(66,92,124,0.32), rgba(22,34,50,0.9))',
  },
  4: {
    border: '#8f63ff',
    text: '#d0b8ff',
    panel:
      'linear-gradient(155deg, rgba(117,72,255,0.42), rgba(36,24,64,0.86), rgba(22,34,50,0.92))',
  },
  5: {
    border: '#f1c45b',
    text: '#ffe6a8',
    panel:
      'linear-gradient(155deg, rgba(241,196,91,0.44), rgba(92,71,22,0.78), rgba(22,34,50,0.92))',
  },
}

const activeBannerInfo = computed(() => BANNER_CONFIGS[activeBanner.value])
const bannerOptions = computed(() => BANNER_KEYS.map((key) => BANNER_CONFIGS[key]))
const wishState = computed(() => wishStateByBanner.value[activeBanner.value])

const stageRarityClass = computed(() => {
  return `stage-rarity-${activeAnimationRarity.value ?? 3}`
})

const showRollingOverlay = computed(() => {
  return rollPhase.value === 'rolling' || rollPhase.value === 'revealing'
})

const showFullscreenLayer = computed(() => {
  return showRollingOverlay.value || showResultPopup.value
})

const displayedResults = computed(() => {
  return latestResults.value.slice(0, revealCount.value)
})

const visibleHistory = computed(() => {
  return wishState.value.history.slice(0, showAllHistory.value ? 80 : 25)
})

const pity5Progress = computed(() => {
  return Math.min((wishState.value.pity5 / (HARD_PITY_FIVE - 1)) * 100, 100)
})

const pity4Progress = computed(() => {
  return Math.min((wishState.value.pity4 / (HARD_PITY_FOUR - 1)) * 100, 100)
})

const nextGuaranteedFive = computed(() => {
  return Math.max(1, HARD_PITY_FIVE - wishState.value.pity5)
})

const nextGuaranteedFour = computed(() => {
  return Math.max(1, HARD_PITY_FOUR - wishState.value.pity4)
})

const currentFiveStarRate = computed(() => {
  return (getFiveStarRate(wishState.value.pity5) * 100).toFixed(2)
})

const sessionSummary = computed(() => {
  if (latestResults.value.length === 0) {
    return null
  }
  const total3 = latestResults.value.filter((result) => result.rarity === 3).length
  const total4 = latestResults.value.filter((result) => result.rarity === 4).length
  const total5 = latestResults.value.filter((result) => result.rarity === 5).length
  const totalRateUp5 = latestResults.value.filter(
    (result) => result.rarity === 5 && result.isRateUp,
  ).length
  return { total3, total4, total5, totalRateUp5 }
})

const stageMainText = computed(() => {
  if (rollPhase.value === 'rolling' || rollPhase.value === 'revealing') {
    return
  }
  if (rollPhase.value === 'done' && activeAnimationRarity.value === 5) {
    return 'Ánh vàng 5 sao xuất hiện!'
  }
  if (rollPhase.value === 'done' && activeAnimationRarity.value === 4) {
    return 'Dấu hiệu tím 4 sao đã mở'
  }
  return 'Sẵn sàng cầu nguyện'
})

const stageSubText = computed(() => {
  if (rollPhase.value === 'rolling') {
    return pendingBatch.value === 10
      ? 'Đang gom 10 lần cầu nguyện trong một phiên.'
      : 'Đang tạo hiệu ứng triệu hồi cho lượt quay.'
  }
  if (rollPhase.value === 'revealing') {
    return `Kết quả đang mở ${revealCount.value}/${pendingBatch.value}.`
  }
  if (rollPhase.value === 'done') {
    return 'Bạn có thể tiếp tục quay hoặc xem lịch sử.'
  }
  return 'Nhấn Cầu nguyện x1 hoặc Cầu nguyện x10 để bắt đầu.'
})

const hasFacebookLink = computed(() => {
  if (!meta.facebook) {
    return false
  }
  return meta.facebook.startsWith('http://') || meta.facebook.startsWith('https://')
})

watch(activeBanner, () => {
  latestResults.value = []
  revealCount.value = 0
  activeAnimationRarity.value = null
  rollPhase.value = 'idle'
  showResultPopup.value = false
  lastBatchSize.value = null
  showAllHistory.value = false
})

const timeFormatter = new Intl.DateTimeFormat('vi-VN', {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
})

function formatTime(timestamp: number): string {
  return timeFormatter.format(timestamp)
}

function rarityLabel(rarity: WishRarity): string {
  return `${rarity} sao`
}

function itemTypeIcon(type: WishHistoryEntry['itemType']): string {
  return type === 'Nhân vật' ? 'lucide:user-round' : 'lucide:sword'
}

function rarityCardStyle(rarity: WishRarity): Record<string, string> {
  const theme = rarityThemes[rarity]
  return {
    borderColor: theme.border,
    background: theme.panel,
  }
}

function rarityTextStyle(rarity: WishRarity): Record<string, string> {
  return {
    color: rarityThemes[rarity].text,
  }
}

function itemArtVars(item: WishItem): Record<string, string> {
  const hueA =
    item.type === 'Nhân vật'
      ? (item.visualSeed * 17 + 230 + item.rarity * 7) % 360
      : (item.visualSeed * 13 + 25 + item.rarity * 11) % 360
  const hueB = (hueA + 42) % 360
  const rotation = `${(item.visualSeed * 9) % 360}deg`
  const glow = item.rarity === 5 ? '0.95' : item.rarity === 4 ? '0.72' : '0.52'

  return {
    '--wish-art-hue-a': `${hueA}`,
    '--wish-art-hue-b': `${hueB}`,
    '--wish-art-rot': rotation,
    '--wish-art-glow': glow,
  }
}

function highestRarity(results: WishResult[]): WishRarity {
  let top: WishRarity = 3
  for (const result of results) {
    if (result.rarity > top) {
      top = result.rarity
    }
  }
  return top
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

function setActiveWishState(nextState: WishState): void {
  wishStateByBanner.value = {
    ...wishStateByBanner.value,
    [activeBanner.value]: nextState,
  }
}

function switchBanner(nextBanner: WishBannerKey): void {
  if (isRolling.value || activeBanner.value === nextBanner) {
    return
  }
  activeBanner.value = nextBanner
}

function closeResultPopup(): void {
  showResultPopup.value = false
  if (rollPhase.value === 'done') {
    rollPhase.value = 'idle'
  }
}

// Animation state: rolling -> revealing -> done cho mỗi phiên quay.
async function handleWish(count: 1 | 10): Promise<void> {
  if (isRolling.value) {
    return
  }

  isRolling.value = true
  pendingBatch.value = count
  revealCount.value = 0
  latestResults.value = []
  showResultPopup.value = false
  rollPhase.value = 'rolling'

  try {
    const { nextState, results } = performWishBatch(
      wishState.value,
      BANNER_POOLS[activeBanner.value],
      count,
    )
    activeAnimationRarity.value = highestRarity(results)

    const rollingDuration = skipAnimation.value ? 120 : count === 10 ? 1300 : 850
    await wait(rollingDuration)

    setActiveWishState(nextState)
    latestResults.value = results
    rollPhase.value = 'revealing'

    if (skipAnimation.value) {
      revealCount.value = results.length
    } else {
      const revealStep = count === 10 ? 95 : 170
      for (let index = 1; index <= results.length; index++) {
        revealCount.value = index
        await wait(revealStep)
      }
    }

    if (!skipAnimation.value && activeAnimationRarity.value === 5) {
      await wait(180)
    }

    rollPhase.value = 'done'
    lastBatchSize.value = count
    showResultPopup.value = true
  } finally {
    isRolling.value = false
  }
}

function resetHistory(): void {
  setActiveWishState(createEmptyWishState())
  latestResults.value = []
  revealCount.value = 0
  activeAnimationRarity.value = null
  rollPhase.value = 'idle'
  showResultPopup.value = false
  lastBatchSize.value = null
}
</script>

<template>
  <div class="relative min-h-screen overflow-hidden bg-bg-deep text-text-primary font-body">
    <div class="pointer-events-none absolute inset-0 bg-main-layer" />
    <div class="pointer-events-none absolute inset-0 bg-star-layer" />

    <div class="relative mx-auto max-w-6xl px-4 pb-12 pt-6 sm:px-6 sm:pt-10">
      <header
        class="mb-5 flex items-center justify-between border border-border-default bg-bg-surface/80 px-4 py-3 backdrop-blur-sm animate-fade-up"
      >
        <RouterLink
          to="/"
          class="inline-flex items-center gap-2 text-sm text-text-secondary transition hover:text-accent-coral"
        >
          <Icon icon="lucide:arrow-left" class="size-4" />
          <span class="hidden sm:inline">Quay lại trang chủ</span>
        </RouterLink>
        <p class="font-display text-xs tracking-[0.2em] text-text-dim sm:text-sm">WISH SIMULATOR</p>
      </header>

      <section
        class="border border-border-default bg-bg-surface/85 p-4 sm:p-5 animate-fade-up animate-delay-1"
      >
        <div class="mb-4 grid gap-2 sm:grid-cols-2">
          <button
            v-for="banner in bannerOptions"
            :key="banner.key"
            type="button"
            class="border px-3 py-2 text-left transition disabled:cursor-not-allowed disabled:opacity-50"
            :class="
              activeBanner === banner.key
                ? 'border-accent-coral bg-accent-coral/12 text-accent-coral'
                : 'border-border-default bg-bg-deep/55 text-text-secondary hover:border-accent-sky hover:text-accent-sky'
            "
            :disabled="isRolling"
            @click="switchBanner(banner.key)"
          >
            <p class="font-display text-sm">{{ banner.name }}</p>
            <p class="mt-1 text-xs text-text-dim">{{ banner.title }}</p>
          </button>
        </div>

        <div class="grid gap-3 lg:grid-cols-[1.1fr_1fr]">
          <article class="border border-border-default bg-bg-deep/70 p-4">
            <p class="font-display text-xs tracking-[0.2em] text-accent-sky">
              {{ activeBannerInfo.name }}
            </p>
            <h1 class="mt-2 font-display text-3xl font-bold text-accent-coral">Giả Lập Gacha</h1>
            <p class="mt-2 text-sm text-text-secondary">
              {{ activeBannerInfo.subtitle }}
            </p>

            <div class="mt-3 border border-border-default bg-bg-surface/40 p-3">
              <p class="text-[11px] uppercase tracking-widest text-text-dim">Rate-up 5 sao</p>
              <div class="mt-1 grid gap-1 sm:grid-cols-2">
                <p
                  v-for="name in activeBannerInfo.rateUp5Names"
                  :key="name"
                  class="font-display text-sm text-[#f1c45b] sm:text-base"
                >
                  {{ name }}
                </p>
              </div>
            </div>

            <div class="mt-3 grid gap-2 sm:grid-cols-3">
              <div
                v-for="name in activeBannerInfo.rateUp4Names"
                :key="name"
                class="border border-[#8f63ff]/40 bg-[#8f63ff]/12 px-2.5 py-2 text-[11px] text-[#d0b8ff]"
              >
                {{ name }}
              </div>
            </div>
          </article>

          <article class="border border-border-default bg-bg-deep/70 p-4">
            <div class="grid gap-2 text-xs sm:grid-cols-2">
              <div class="border border-border-default bg-bg-surface/35 px-3 py-2">
                <p class="text-text-dim">Tỉ lệ 5 sao cơ bản</p>
                <p class="mt-1 text-[#f1c45b]">{{ (BASE_FIVE_STAR_RATE * 100).toFixed(1) }}%</p>
              </div>
              <div class="border border-border-default bg-bg-surface/35 px-3 py-2">
                <p class="text-text-dim">Tỉ lệ 4 sao cơ bản</p>
                <p class="mt-1 text-[#c3a0ff]">{{ (BASE_FOUR_STAR_RATE * 100).toFixed(1) }}%</p>
              </div>
              <div class="border border-border-default bg-bg-surface/35 px-3 py-2">
                <p class="text-text-dim">Soft pity 5 sao</p>
                <p class="mt-1 text-text-secondary">Từ roll {{ SOFT_PITY_START }}</p>
              </div>
              <div class="border border-border-default bg-bg-surface/35 px-3 py-2">
                <p class="text-text-dim">Tỉ lệ hiện tại 5 sao</p>
                <p class="mt-1 text-[#f1c45b]">{{ currentFiveStarRate }}%</p>
              </div>
            </div>

            <div class="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <label class="inline-flex items-center gap-2 text-sm text-text-secondary">
                <input
                  v-model="skipAnimation"
                  type="checkbox"
                  class="h-4 w-4 border border-border-default bg-bg-deep accent-accent-coral"
                />
                Bỏ qua hiệu ứng
              </label>

              <div class="flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  class="inline-flex items-center justify-center gap-2 border border-[#f1c45b] bg-[#f1c45b] px-4 py-2 font-display text-sm font-semibold text-bg-deep transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                  :disabled="isRolling"
                  @click="handleWish(1)"
                >
                  <Icon icon="lucide:sparkles" class="size-4" />
                  Cầu nguyện x1
                </button>
                <button
                  type="button"
                  class="inline-flex items-center justify-center gap-2 border border-[#8f63ff] bg-[#8f63ff] px-4 py-2 font-display text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                  :disabled="isRolling"
                  @click="handleWish(10)"
                >
                  <Icon icon="lucide:stars" class="size-4" />
                  Cầu nguyện x10
                </button>
              </div>
            </div>
          </article>
        </div>
      </section>

      <section
        class="mt-6 border border-border-default bg-bg-surface/85 p-4 sm:p-5 animate-fade-up animate-delay-3"
      >
        <div class="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <h2 class="font-display text-xl text-text-primary">
            <span class="mr-2 text-sm tracking-widest text-accent-amber">//</span>
            Kết quả cầu nguyện
          </h2>
          <p v-if="sessionSummary && lastBatchSize" class="text-xs text-text-secondary">
            Phiên x{{ lastBatchSize }}: {{ sessionSummary.total3 }} vật phẩm 3★,
            <span class="text-[#c3a0ff]">{{ sessionSummary.total4 }} vật phẩm 4★</span>,
            <span class="text-[#f1c45b]">{{ sessionSummary.total5 }} vật phẩm 5★</span>,
            <span class="text-accent-coral">{{ sessionSummary.totalRateUp5 }} 5★ rate-up</span>
          </p>
        </div>

        <div
          v-if="displayedResults.length === 0"
          class="border border-border-default bg-bg-deep/70 px-4 py-8 text-center text-sm text-text-dim"
        >
          Chưa có kết quả mới. Nhấn Cầu nguyện để bắt đầu.
        </div>

        <TransitionGroup
          v-else
          name="wish-card"
          tag="div"
          class="grid gap-3 sm:grid-cols-2 lg:grid-cols-5"
        >
          <article
            v-for="result in displayedResults"
            :key="`${result.timestamp}-${result.rollNumber}`"
            class="wish-card border p-3"
            :class="`wish-card-${result.rarity}`"
            :style="rarityCardStyle(result.rarity)"
          >
            <div class="flex items-center justify-between gap-2">
              <div class="flex items-center gap-1">
                <Icon
                  v-for="star in result.rarity"
                  :key="star"
                  icon="lucide:star"
                  class="size-3.5"
                  :style="rarityTextStyle(result.rarity)"
                />
              </div>
              <p
                class="border border-border-default bg-bg-deep/65 px-2 py-0.5 text-[10px] uppercase tracking-wide"
                :style="rarityTextStyle(result.rarity)"
              >
                {{ rarityLabel(result.rarity) }}
              </p>
            </div>

            <div
              class="item-art mt-3"
              :class="result.item.type === 'Nhân vật' ? 'art-character' : 'art-weapon'"
              :style="itemArtVars(result.item)"
            >
              <svg
                v-if="result.item.type === 'Nhân vật'"
                viewBox="0 0 120 120"
                class="h-[88%] w-[88%] text-white/85"
                fill="currentColor"
              >
                <circle cx="60" cy="38" r="18" />
                <path d="M25 95c4-19 17-30 35-30 17 0 31 11 35 30H25z" />
                <path
                  d="M40 64c4-8 12-13 20-13s16 5 20 13"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="5"
                />
              </svg>
              <svg
                v-else
                viewBox="0 0 120 120"
                class="h-[88%] w-[88%] text-white/85"
                fill="currentColor"
              >
                <path d="M30 88l40-40 11 11-40 40-15 3z" />
                <path d="M72 38l12-12 10 10-12 12z" />
                <rect x="28" y="80" width="18" height="6" rx="2" />
                <rect x="24" y="88" width="18" height="6" rx="2" />
              </svg>
              <span class="item-seed">#{{ result.item.visualSeed }}</span>
            </div>

            <p class="mt-3 font-display text-sm text-text-primary">{{ result.item.name }}</p>

            <div class="mt-1 flex items-center gap-1 text-xs text-text-secondary">
              <Icon :icon="itemTypeIcon(result.item.type)" class="size-3.5" />
              {{ result.item.type }}
            </div>

            <div class="mt-2 text-[11px] text-text-dim">
              Roll #{{ result.rollNumber }} · P5 {{ result.pityBefore5 }} · P4
              {{ result.pityBefore4 }}
            </div>

            <p v-if="result.rarity >= 4" class="mt-2 text-xs">
              <span :class="result.isRateUp ? 'text-accent-coral' : 'text-text-dim'">
                {{ result.isRateUp ? 'Rate-up' : 'Không rate-up' }}
              </span>
              <span v-if="result.usedGuarantee5" class="text-accent-sky">
                · Đảm bảo đã kích hoạt</span
              >
            </p>
          </article>
        </TransitionGroup>
      </section>

      <section class="mt-6 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <article
          class="border border-border-default bg-bg-surface/85 p-4 sm:p-5 animate-fade-up animate-delay-4"
        >
          <h2 class="font-display text-xl text-text-primary">
            <span class="mr-2 text-sm tracking-widest text-accent-sky">//</span>
            Lịch sử {{ activeBannerInfo.name }}
          </h2>

          <div class="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              class="border border-border-default bg-bg-deep px-2.5 py-1 text-xs text-text-secondary transition hover:border-accent-sky hover:text-accent-sky"
              @click="showAllHistory = !showAllHistory"
            >
              {{ showAllHistory ? 'Thu gọn' : 'Xem thêm' }}
            </button>
            <button
              type="button"
              class="border border-accent-coral bg-accent-coral/10 px-2.5 py-1 text-xs text-accent-coral transition hover:bg-accent-coral hover:text-bg-deep"
              @click="resetHistory"
            >
              Đặt lại lịch sử
            </button>
          </div>

          <div
            v-if="wishState.history.length === 0"
            class="mt-3 border border-border-default bg-bg-deep/70 px-4 py-8 text-center text-sm text-text-dim"
          >
            Lịch sử trống.
          </div>

          <div v-else class="mt-3 space-y-2">
            <article
              v-for="entry in visibleHistory"
              :key="entry.id"
              class="flex flex-wrap items-center gap-2 border border-border-default bg-bg-deep/70 px-3 py-2 text-xs"
            >
              <span
                class="border border-border-default px-2 py-0.5 text-[10px]"
                :style="rarityTextStyle(entry.rarity)"
              >
                {{ entry.rarity }}★
              </span>
              <span class="inline-flex items-center gap-1 text-text-secondary">
                <Icon :icon="itemTypeIcon(entry.itemType)" class="size-3.5" />
                {{ entry.itemType }}
              </span>
              <span class="font-medium text-text-primary">{{ entry.itemName }}</span>
              <span
                v-if="entry.rarity >= 4"
                :class="entry.isRateUp ? 'text-accent-coral' : 'text-text-dim'"
              >
                {{ entry.isRateUp ? 'Rate-up' : 'Thường' }}
              </span>
              <span class="ml-auto text-text-dim"
                >#{{ entry.rollNumber }} · {{ formatTime(entry.timestamp) }}</span
              >
            </article>
          </div>
        </article>

        <article
          class="border border-border-default bg-bg-surface/85 p-4 sm:p-5 animate-fade-up animate-delay-5"
        >
          <h2 class="font-display text-xl text-text-primary">
            <span class="mr-2 text-sm tracking-widest text-accent-amber">//</span>
            Bảo hiểm & thống kê
          </h2>

          <div class="mt-3 space-y-4">
            <div>
              <div class="mb-1 flex items-center justify-between text-xs">
                <p class="text-text-secondary">Bảo hiểm 5 sao</p>
                <p class="text-[#f1c45b]">
                  {{ wishState.pity5 }}/{{ HARD_PITY_FIVE - 1 }} · còn {{ nextGuaranteedFive }} roll
                </p>
              </div>
              <div class="h-2 border border-border-default bg-bg-deep/70">
                <div
                  class="h-full bg-[#f1c45b] transition-all"
                  :style="{ width: `${pity5Progress}%` }"
                />
              </div>
            </div>

            <div>
              <div class="mb-1 flex items-center justify-between text-xs">
                <p class="text-text-secondary">Bảo hiểm 4 sao</p>
                <p class="text-[#c3a0ff]">
                  {{ wishState.pity4 }}/{{ HARD_PITY_FOUR - 1 }} · còn {{ nextGuaranteedFour }} roll
                </p>
              </div>
              <div class="h-2 border border-border-default bg-bg-deep/70">
                <div
                  class="h-full bg-[#8f63ff] transition-all"
                  :style="{ width: `${pity4Progress}%` }"
                />
              </div>
            </div>

            <div class="border border-border-default bg-bg-deep/70 px-3 py-2 text-xs">
              <div class="flex items-center justify-between">
                <p class="text-text-secondary">Lệch rate</p>
                <p :class="wishState.guaranteedRateUp5 ? 'text-accent-coral' : 'text-text-dim'">
                  {{ wishState.guaranteedRateUp5 ? 'Đang bật' : 'Chưa bật' }}
                </p>
              </div>
              <p v-if="wishState.guaranteedRateUp5" class="mt-2 text-accent-sky">
                Đảm bảo rate-up ở lần 5 sao kế tiếp
              </p>
            </div>
          </div>

          <div class="mt-4 grid gap-3 sm:grid-cols-2">
            <div class="border border-border-default bg-bg-deep/70 p-3">
              <p class="text-xs text-text-dim">Tổng số lượt quay</p>
              <p class="mt-1 font-display text-2xl text-text-primary">
                {{ wishState.stats.totalRolls }}
              </p>
            </div>
            <div class="border border-border-default bg-bg-deep/70 p-3">
              <p class="text-xs text-text-dim">Số 4 sao</p>
              <p class="mt-1 font-display text-2xl text-[#c3a0ff]">
                {{ wishState.stats.total4Star }}
              </p>
            </div>
            <div class="border border-border-default bg-bg-deep/70 p-3">
              <p class="text-xs text-text-dim">Số 5 sao</p>
              <p class="mt-1 font-display text-2xl text-[#f1c45b]">
                {{ wishState.stats.total5Star }}
              </p>
            </div>
            <div class="border border-border-default bg-bg-deep/70 p-3">
              <p class="text-xs text-text-dim">Số lần trúng rate-up 5 sao</p>
              <p class="mt-1 font-display text-2xl text-accent-coral">
                {{ wishState.stats.total5StarRateUp }}
              </p>
            </div>
          </div>
        </article>
      </section>

      <section
        class="mt-6 border border-border-default bg-bg-surface/85 p-4 sm:p-5 animate-fade-up animate-delay-6"
      >
        <h2 class="font-display text-xl text-text-primary">
          <span class="mr-2 text-sm tracking-widest text-accent-coral">//</span>
          Thông tin trang
        </h2>
        <div class="mt-2 space-y-1 text-sm text-text-secondary">
          <p>
            Tác giả:
            <span class="text-text-primary">{{ meta.author }}</span>
          </p>
          <p v-if="hasFacebookLink">
            Facebook:
            <a
              :href="meta.facebook"
              target="_blank"
              rel="noopener noreferrer"
              class="text-accent-sky transition hover:text-accent-coral"
            >
              {{ meta.facebook }}
            </a>
          </p>
          <p v-else>Facebook: {{ meta.facebook }}</p>
        </div>

        <RouterLink
          to="/"
          class="mt-3 inline-flex items-center gap-2 border border-border-default bg-bg-deep px-3 py-2 text-sm text-text-secondary transition hover:border-accent-coral hover:text-accent-coral"
        >
          <Icon icon="lucide:house" class="size-4" />
          Quay lại trang chủ
        </RouterLink>
      </section>
    </div>

    <Transition name="overlay-fade">
      <div
        v-if="showFullscreenLayer"
        class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6"
        @click.self="showResultPopup ? closeResultPopup() : null"
      >
        <div class="wish-overlay-backdrop" :class="stageRarityClass" />

        <article
          v-if="showRollingOverlay"
          class="relative z-[1] w-full max-w-3xl border border-border-default bg-bg-surface/90 p-4 backdrop-blur-sm sm:p-6"
        >
          <div class="roll-stage roll-stage-full" :class="stageRarityClass">
            <div class="stage-ring stage-ring-outer" />
            <div class="stage-ring stage-ring-inner" />
            <div class="stage-core" />
            <div class="stage-burst" />
            <div class="stage-streaks">
              <span
                v-for="line in 8"
                :key="line"
                class="stage-streak"
                :style="{ '--line-index': `${line}` }"
              />
            </div>
          </div>

          <div class="mt-4 text-center">
            <p class="font-display text-lg text-text-primary sm:text-2xl">{{ stageMainText }}</p>
            <p class="mt-1 text-xs text-text-secondary sm:text-sm">{{ stageSubText }}</p>
          </div>
        </article>

        <article
          v-else-if="showResultPopup"
          class="relative z-[1] flex max-h-[92vh] w-full max-w-6xl flex-col border border-border-default bg-bg-surface/95 p-4 backdrop-blur-md sm:p-6"
        >
          <div class="mb-4 flex items-start justify-between gap-3">
            <div>
              <p class="font-display text-2xl text-text-primary sm:text-3xl">
                Kết quả {{ activeBannerInfo.name }}
              </p>
              <p
                v-if="sessionSummary && lastBatchSize"
                class="mt-1 text-xs text-text-secondary sm:text-sm"
              >
                Phiên x{{ lastBatchSize }}: {{ sessionSummary.total3 }} vật phẩm 3★,
                <span class="text-[#c3a0ff]">{{ sessionSummary.total4 }} vật phẩm 4★</span>,
                <span class="text-[#f1c45b]">{{ sessionSummary.total5 }} vật phẩm 5★</span>
              </p>
            </div>

            <button
              type="button"
              class="inline-flex items-center gap-1 border border-border-default bg-bg-deep/70 px-3 py-1.5 text-sm text-text-secondary transition hover:border-accent-coral hover:text-accent-coral"
              @click="closeResultPopup"
            >
              <Icon icon="lucide:x" class="size-4" />
              Đóng
            </button>
          </div>

          <div class="overflow-y-auto pr-1">
            <TransitionGroup
              v-if="displayedResults.length > 0"
              name="wish-card"
              tag="div"
              class="grid gap-3 sm:grid-cols-2 lg:grid-cols-5"
            >
              <article
                v-for="result in displayedResults"
                :key="`popup-${result.timestamp}-${result.rollNumber}`"
                class="wish-card border p-3"
                :class="`wish-card-${result.rarity}`"
                :style="rarityCardStyle(result.rarity)"
              >
                <div class="flex items-center justify-between gap-2">
                  <div class="flex items-center gap-1">
                    <Icon
                      v-for="star in result.rarity"
                      :key="star"
                      icon="lucide:star"
                      class="size-3.5"
                      :style="rarityTextStyle(result.rarity)"
                    />
                  </div>
                  <p
                    class="border border-border-default bg-bg-deep/65 px-2 py-0.5 text-[10px] uppercase tracking-wide"
                    :style="rarityTextStyle(result.rarity)"
                  >
                    {{ rarityLabel(result.rarity) }}
                  </p>
                </div>

                <div
                  class="item-art mt-3"
                  :class="result.item.type === 'Nhân vật' ? 'art-character' : 'art-weapon'"
                  :style="itemArtVars(result.item)"
                >
                  <svg
                    v-if="result.item.type === 'Nhân vật'"
                    viewBox="0 0 120 120"
                    class="h-[88%] w-[88%] text-white/85"
                    fill="currentColor"
                  >
                    <circle cx="60" cy="38" r="18" />
                    <path d="M25 95c4-19 17-30 35-30 17 0 31 11 35 30H25z" />
                    <path
                      d="M40 64c4-8 12-13 20-13s16 5 20 13"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="5"
                    />
                  </svg>
                  <svg
                    v-else
                    viewBox="0 0 120 120"
                    class="h-[88%] w-[88%] text-white/85"
                    fill="currentColor"
                  >
                    <path d="M30 88l40-40 11 11-40 40-15 3z" />
                    <path d="M72 38l12-12 10 10-12 12z" />
                    <rect x="28" y="80" width="18" height="6" rx="2" />
                    <rect x="24" y="88" width="18" height="6" rx="2" />
                  </svg>
                  <span class="item-seed">#{{ result.item.visualSeed }}</span>
                </div>

                <p class="mt-3 font-display text-sm text-text-primary">{{ result.item.name }}</p>

                <div class="mt-1 flex items-center gap-1 text-xs text-text-secondary">
                  <Icon :icon="itemTypeIcon(result.item.type)" class="size-3.5" />
                  {{ result.item.type }}
                </div>

                <div class="mt-2 text-[11px] text-text-dim">
                  Roll #{{ result.rollNumber }} · P5 {{ result.pityBefore5 }} · P4
                  {{ result.pityBefore4 }}
                </div>

                <p v-if="result.rarity >= 4" class="mt-2 text-xs">
                  <span :class="result.isRateUp ? 'text-accent-coral' : 'text-text-dim'">
                    {{ result.isRateUp ? 'Rate-up' : 'Không rate-up' }}
                  </span>
                  <span v-if="result.usedGuarantee5" class="text-accent-sky">
                    · Đảm bảo đã kích hoạt</span
                  >
                </p>
              </article>
            </TransitionGroup>
          </div>
        </article>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.bg-main-layer {
  background:
    radial-gradient(circle at 10% 16%, rgb(143 99 255 / 24%), transparent 42%),
    radial-gradient(circle at 86% 11%, rgb(241 196 91 / 26%), transparent 40%),
    radial-gradient(circle at 75% 82%, rgb(255 107 74 / 20%), transparent 42%),
    linear-gradient(162deg, #0f1923 0%, #0d1722 100%);
}

.bg-star-layer {
  opacity: 0.16;
  background-image: radial-gradient(circle, rgb(240 237 230 / 70%) 1px, transparent 1px);
  background-size: 28px 28px;
}

.wish-overlay-backdrop {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 22% 24%, rgb(143 99 255 / 20%), transparent 45%),
    radial-gradient(circle at 84% 15%, rgb(241 196 91 / 26%), transparent 42%),
    radial-gradient(circle at 70% 80%, rgb(255 107 74 / 18%), transparent 48%), rgb(2 7 15 / 86%);
  backdrop-filter: blur(3px);
}

.roll-stage {
  position: relative;
  height: 200px;
  overflow: hidden;
  border: 1px solid rgb(37 53 73 / 90%);
  background: linear-gradient(145deg, rgb(18 29 42 / 90%), rgb(10 18 28 / 95%));
}

.roll-stage-full {
  height: min(56vh, 420px);
}

.stage-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  border-radius: 9999px;
  transform: translate(-50%, -50%);
  border: 1px solid rgb(255 255 255 / 25%);
}

.stage-ring-outer {
  width: 168px;
  height: 168px;
  animation: ring-rotate 5s linear infinite;
}

.stage-ring-inner {
  width: 106px;
  height: 106px;
  animation: ring-rotate-reverse 3.4s linear infinite;
}

.stage-core {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 48px;
  height: 48px;
  border-radius: 9999px;
  transform: translate(-50%, -50%);
  box-shadow: 0 0 40px rgb(255 255 255 / 45%);
  animation: core-pulse 1.4s ease-in-out infinite;
}

.stage-burst {
  position: absolute;
  inset: 0;
  opacity: 0.45;
  background: radial-gradient(circle at 50% 50%, rgb(255 255 255 / 35%), transparent 58%);
  animation: burst-pulse 1.8s ease-in-out infinite;
}

.stage-streaks {
  position: absolute;
  inset: 0;
}

.stage-streak {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 160px;
  height: 2px;
  background: linear-gradient(90deg, transparent, rgb(255 255 255 / 80%), transparent);
  transform-origin: center;
  transform: translate(-50%, -50%) rotate(calc(var(--line-index) * 22deg));
  animation: streak-flow 1.1s ease-in-out infinite;
  animation-delay: calc(var(--line-index) * 90ms);
}

.stage-rarity-3 .stage-core {
  background: #7e96b7;
}

.stage-rarity-4 .stage-core {
  background: #9b73ff;
}

.stage-rarity-5 .stage-core {
  background: #f1c45b;
  box-shadow:
    0 0 28px rgb(241 196 91 / 95%),
    0 0 72px rgb(241 196 91 / 45%);
}

.stage-rarity-4 .stage-ring,
.stage-rarity-4 .stage-streak {
  border-color: rgb(155 115 255 / 60%);
  background: linear-gradient(90deg, transparent, rgb(155 115 255 / 75%), transparent);
}

.stage-rarity-5 .stage-ring,
.stage-rarity-5 .stage-streak {
  border-color: rgb(241 196 91 / 70%);
  background: linear-gradient(90deg, transparent, rgb(241 196 91 / 88%), transparent);
}

.wish-card {
  backdrop-filter: blur(2px);
}

.wish-card-4 {
  box-shadow: 0 0 16px rgb(143 99 255 / 24%);
}

.wish-card-5 {
  box-shadow:
    0 0 22px rgb(241 196 91 / 38%),
    inset 0 0 20px rgb(241 196 91 / 10%);
  animation: card-gold-surge 0.9s ease;
}

.item-art {
  position: relative;
  height: 102px;
  border: 1px solid rgb(255 255 255 / 28%);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background:
    radial-gradient(circle at 16% 20%, hsl(var(--wish-art-hue-a) 85% 68% / 0.35), transparent 42%),
    radial-gradient(circle at 84% 85%, hsl(var(--wish-art-hue-b) 82% 56% / 0.28), transparent 46%),
    linear-gradient(145deg, rgb(17 26 40 / 80%), rgb(10 16 24 / 94%));
}

.item-art::before {
  content: '';
  position: absolute;
  inset: -35% -15%;
  transform: rotate(var(--wish-art-rot));
  background: linear-gradient(
    115deg,
    transparent 0%,
    rgb(255 255 255 / calc(var(--wish-art-glow) * 0.36)) 45%,
    transparent 60%
  );
  animation: sheen-pass 2.4s linear infinite;
}

.art-character svg {
  filter: drop-shadow(0 0 10px rgb(255 255 255 / 0.3));
}

.art-weapon svg {
  filter: drop-shadow(0 0 10px rgb(255 255 255 / 0.35));
}

.item-seed {
  position: absolute;
  right: 6px;
  bottom: 4px;
  font-size: 10px;
  color: rgb(255 255 255 / 55%);
}

.wish-card-enter-active,
.wish-card-leave-active {
  transition: all 0.2s ease;
}

.wish-card-enter-from,
.wish-card-leave-to {
  opacity: 0;
  transform: translateY(10px) scale(0.96);
}

.overlay-fade-enter-active,
.overlay-fade-leave-active {
  transition: opacity 0.2s ease;
}

.overlay-fade-enter-from,
.overlay-fade-leave-to {
  opacity: 0;
}

@keyframes ring-rotate {
  from {
    transform: translate(-50%, -50%) rotate(0deg);
  }
  to {
    transform: translate(-50%, -50%) rotate(360deg);
  }
}

@keyframes ring-rotate-reverse {
  from {
    transform: translate(-50%, -50%) rotate(360deg);
  }
  to {
    transform: translate(-50%, -50%) rotate(0deg);
  }
}

@keyframes core-pulse {
  0%,
  100% {
    transform: translate(-50%, -50%) scale(1);
  }
  50% {
    transform: translate(-50%, -50%) scale(1.15);
  }
}

@keyframes burst-pulse {
  0%,
  100% {
    opacity: 0.25;
  }
  50% {
    opacity: 0.65;
  }
}

@keyframes streak-flow {
  0%,
  100% {
    opacity: 0.2;
    width: 120px;
  }
  50% {
    opacity: 0.95;
    width: 200px;
  }
}

@keyframes sheen-pass {
  0% {
    transform: translateX(-20%) rotate(var(--wish-art-rot));
    opacity: 0;
  }
  15% {
    opacity: 0.7;
  }
  60%,
  100% {
    transform: translateX(28%) rotate(var(--wish-art-rot));
    opacity: 0;
  }
}

@keyframes card-gold-surge {
  0% {
    transform: scale(0.96);
    box-shadow: 0 0 0 rgb(241 196 91 / 0%);
  }
  55% {
    transform: scale(1.02);
    box-shadow:
      0 0 34px rgb(241 196 91 / 52%),
      inset 0 0 20px rgb(241 196 91 / 18%);
  }
  100% {
    transform: scale(1);
  }
}
</style>
