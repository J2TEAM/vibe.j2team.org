<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { useClipboard, useIntervalFn, useMediaQuery, useRafFn } from '@vueuse/core'
import meta from './meta'
import { useFuelRetailPrices } from './composables/useFuelRetailPrices'
import PriceBoard from './components/PriceBoard.vue'
import VehicleCascadePicker from './components/VehicleCascadePicker.vue'
import FuelSelector from './components/FuelSelector.vue'
import PumpScene from './components/PumpScene.vue'
import ReceiptPanel from './components/ReceiptPanel.vue'
import { DEFAULT_VEHICLE_ID, EMPTY_VEHICLE_ID, resolveVehicle } from './data/vehicleCatalog'
import type { FillPhaseCode } from './types'
import {
  SESSION_COUPLE_MS,
  SESSION_HOSE_PRIME_MS,
  SESSION_PREP_MS,
  SESSION_WALK_MS,
} from './sessionConstants'

type FuelDef = {
  id: string
  label: string
  icon: string
}

const FUEL_DEFS: FuelDef[] = [
  { id: 'ron95', label: 'Xăng RON 95-III', icon: 'lucide:flame' },
  { id: 'e5', label: 'Xăng E5 RON 92', icon: 'lucide:flame' },
  { id: 'diesel', label: 'Dầu Diesel', icon: 'lucide:droplet' },
]

const {
  prices: livePrices,
  isLoading: pricesLoading,
  isUsingFallback,
  lastUpdated,
  errorMsg: priceError,
  fetchPrices,
} = useFuelRetailPrices()

const fuels = computed(() =>
  FUEL_DEFS.map((def) => {
    const live = livePrices.value.find((p) => p.id === def.id)
    return {
      id: def.id,
      label: def.label,
      icon: def.icon,
      pricePerLiter: live?.pricePerLiter ?? 0,
      changeText: live?.changeText ?? '',
    }
  }),
)

const selectedVehicleId = ref<string>(DEFAULT_VEHICLE_ID)
const selectedFuelId = ref<string>(FUEL_DEFS[0]!.id)

const selectedVehicle = computed(() => resolveVehicle(selectedVehicleId.value))
const canPump = computed(
  () => selectedVehicleId.value !== EMPTY_VEHICLE_ID && selectedVehicle.value.capacityLiters > 0,
)
const selectedFuel = computed(() => fuels.value.find((f) => f.id === selectedFuelId.value)!)

onMounted(() => {
  fetchPrices()
})

const hoseSessionKey = ref(0)

const fillingState = ref<'idle' | 'filling' | 'complete'>('idle')
const liters = ref(0)
const displayedLiters = ref(0)
const pulseArmed = ref(false)
const sessionStartedAt = ref<number | null>(null)
const sessionElapsedMs = ref(0)
const hoseLinePercent = ref(0)
const attendantAtVehicle = ref(false)
const fillPhaseCode = ref<FillPhaseCode>('idle')

const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')

/** Thời điểm bắt đầu tính lít / % bình — sau khi ống đã đầy (prep + đi + cắm + chảy ống) */
function sessionPreTankMs() {
  if (prefersReducedMotion.value) return 0
  return SESSION_PREP_MS + SESSION_WALK_MS + SESSION_COUPLE_MS + SESSION_HOSE_PRIME_MS
}

const minFillMs = 5000
const maxFillMs = 10000
const fillDurationMs = computed(() => {
  const cap = selectedVehicle.value.capacityLiters
  if (cap <= 0) return minFillMs
  const ms = 4000 + cap * 120
  return Math.max(minFillMs, Math.min(maxFillMs, ms))
})

const progressPercent = computed(() => {
  if (selectedVehicle.value.capacityLiters <= 0) return 0
  return Math.max(
    0,
    Math.min(100, (displayedLiters.value / selectedVehicle.value.capacityLiters) * 100),
  )
})

const totalCost = computed(() => liters.value * selectedFuel.value.pricePerLiter)
const displayedTotalCost = computed(() => displayedLiters.value * selectedFuel.value.pricePerLiter)

function formatMoneyVn(amount: number) {
  return Math.round(amount).toLocaleString('vi-VN') + 'đ'
}

const litersOdo = computed(() =>
  selectedVehicle.value ? Math.round(displayedLiters.value * 100) / 100 : 0,
)
const costOdo = computed(() => Math.round(displayedTotalCost.value))

const litersText = computed(() => litersOdo.value.toFixed(2))
const totalCostText = computed(() => formatMoneyVn(costOdo.value))

const litersOdometerKey = computed(() => litersOdo.value.toFixed(2))
const costOdometerKey = computed(() => costOdo.value.toString())

const showReceipt = computed(() => fillingState.value === 'complete' && canPump.value)

const fakeStationMultiplier = 1.15
const fakeStationCost = computed(() => totalCost.value * fakeStationMultiplier)
const savedCost = computed(() => Math.max(0, fakeStationCost.value - totalCost.value))

const receiptText = computed(() => {
  const vehicle = selectedVehicle.value
  const fuel = selectedFuel.value
  const saved = Math.round(savedCost.value)
  return [
    'Đổ Xăng Online — web giải trí',
    `Xe: ${vehicle.name} - ${vehicle.description}`,
    `Loại xăng: ${fuel.label}`,
    `Đã đổ: ${liters.value.toFixed(2)} L`,
    `Tổng tiền: ${formatMoneyVn(totalCost.value)}`,
    `Đã tiết kiệm: ${saved.toLocaleString('vi-VN')}đ so với trạm mẫu`,
    isUsingFallback.value
      ? 'Giá mẫu — không lấy được giá thực'
      : `Giá cập nhật: ${lastUpdated.value}`,
    'Xăng thật vẫn phải ra trạm nhé!',
  ].join('\n')
})

const { copy, copied } = useClipboard()

const getStationStateLabel = computed(() => {
  if (fillingState.value === 'idle') return 'Chờ bắt đầu'
  if (fillingState.value === 'complete') return 'Đã đầy bình'
  switch (fillPhaseCode.value) {
    case 'prep':
      return 'Lấy vòi tại trụ...'
    case 'walk':
      return 'Kéo ống tới xe...'
    case 'couple':
      return 'Đang cắm vòi vào xe...'
    case 'hose':
      return 'Xăng đang chảy trong ống...'
    case 'tank':
      return 'Xăng đang vào bình xe...'
    default:
      return 'Đang đổ...'
  }
})

function applyFillingTick() {
  if (fillingState.value !== 'filling') return
  if (sessionStartedAt.value === null) return

  const cap = selectedVehicle.value.capacityLiters
  if (cap <= 0) return

  const now = performance.now()
  const t = now - sessionStartedAt.value
  const pre = sessionPreTankMs()

  if (prefersReducedMotion.value) {
    attendantAtVehicle.value = true
    hoseLinePercent.value = 100
    fillPhaseCode.value = 'tank'
  } else if (t < SESSION_PREP_MS) {
    attendantAtVehicle.value = false
    hoseLinePercent.value = 0
    fillPhaseCode.value = 'prep'
    liters.value = 0
    return
  } else if (t < SESSION_PREP_MS + SESSION_WALK_MS) {
    attendantAtVehicle.value = false
    hoseLinePercent.value = 0
    fillPhaseCode.value = 'walk'
    liters.value = 0
    return
  } else if (t < SESSION_PREP_MS + SESSION_WALK_MS + SESSION_COUPLE_MS) {
    attendantAtVehicle.value = true
    hoseLinePercent.value = 0
    fillPhaseCode.value = 'couple'
    liters.value = 0
    return
  } else {
    attendantAtVehicle.value = true
    const hoseStart = SESSION_PREP_MS + SESSION_WALK_MS + SESSION_COUPLE_MS
    if (t < pre) {
      fillPhaseCode.value = 'hose'
      const u = Math.max(0, Math.min(1, (t - hoseStart) / SESSION_HOSE_PRIME_MS))
      // smoothstep: đầu/cuối chảy chậm hơn — cảm giác xăng “lấp ống” từ từ
      const eased = u * u * (3 - 2 * u)
      hoseLinePercent.value = Math.min(100, eased * 100)
      liters.value = 0
      return
    }
    hoseLinePercent.value = 100
    fillPhaseCode.value = 'tank'
  }

  const tankElapsed = t - pre
  const ratio = Math.max(0, Math.min(1, tankElapsed / fillDurationMs.value))
  liters.value = cap * ratio

  if (ratio >= 1) {
    pause()
    fillingState.value = 'complete'
    fillPhaseCode.value = 'done'
  }
}

const { pause, resume } = useIntervalFn(applyFillingTick, 80, { immediate: false })

watch([selectedVehicleId, selectedFuelId], () => {
  pause()
  liters.value = 0
  displayedLiters.value = 0
  fillingState.value = 'idle'
  pulseArmed.value = false
  sessionStartedAt.value = null
  sessionElapsedMs.value = 0
  hoseLinePercent.value = 0
  attendantAtVehicle.value = false
  fillPhaseCode.value = 'idle'
})

const { pause: pauseDisplay, resume: resumeDisplay } = useRafFn(
  ({ delta }) => {
    if (fillingState.value === 'filling' && sessionStartedAt.value !== null) {
      sessionElapsedMs.value = performance.now() - sessionStartedAt.value
    } else if (fillingState.value !== 'filling') {
      sessionElapsedMs.value = 0
    }

    if (prefersReducedMotion.value) return
    if (fillingState.value !== 'filling') return

    if (!pulseArmed.value && sessionStartedAt.value !== null) {
      const now = performance.now()
      const t = now - sessionStartedAt.value
      if (t >= sessionPreTankMs() + 400) pulseArmed.value = true
    }

    const cap = selectedVehicle.value.capacityLiters
    const target = Math.min(liters.value, cap)
    const diff = target - displayedLiters.value

    if (Math.abs(diff) < 0.0005) {
      displayedLiters.value = target
      return
    }

    const alpha = 1 - Math.exp(-delta / 180)
    displayedLiters.value += diff * alpha
  },
  { immediate: false },
)

watch(
  fillingState,
  (state) => {
    if (prefersReducedMotion.value) {
      pauseDisplay()
      displayedLiters.value =
        state === 'complete' ? selectedVehicle.value.capacityLiters : liters.value
      return
    }

    if (state === 'filling') {
      resumeDisplay()
      return
    }

    pauseDisplay()
    displayedLiters.value =
      state === 'complete' ? selectedVehicle.value.capacityLiters : liters.value
  },
  { immediate: true },
)

watch(liters, (value) => {
  if (!prefersReducedMotion.value) return
  if (fillingState.value !== 'filling') return
  displayedLiters.value = value
})

const dropSeeds = computed(() => {
  const seed = `${selectedVehicleId.value}-${selectedFuelId.value}`
  let hash = 0
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0
  const rand = () => {
    hash = (1103515245 * hash + 12345) >>> 0
    return (hash % 10000) / 10000
  }

  return Array.from({ length: 8 }, (_, i) => {
    const left = 50 + (rand() * 30 - 15)
    const delay = rand() * 0.6
    const duration = 0.65 + rand() * 0.5
    return { key: `${seed}-${i}`, left, delay, duration }
  })
})

function startFill() {
  if (!canPump.value) return
  if (fillingState.value === 'complete') return
  if (fillingState.value === 'idle') {
    liters.value = 0
    displayedLiters.value = 0
  }

  hoseSessionKey.value += 1

  const now = performance.now()
  sessionStartedAt.value = now
  pulseArmed.value = false
  if (prefersReducedMotion.value) {
    attendantAtVehicle.value = true
    hoseLinePercent.value = 100
    fillPhaseCode.value = 'tank'
    pulseArmed.value = true
  } else {
    attendantAtVehicle.value = false
    hoseLinePercent.value = 0
    fillPhaseCode.value = 'prep'
  }
  fillingState.value = 'filling'
  resume()
  applyFillingTick()
}

function stopFill() {
  if (fillingState.value !== 'filling') return
  pause()
  fillingState.value = 'idle'
  displayedLiters.value = liters.value
  pulseArmed.value = false
  sessionStartedAt.value = null
  sessionElapsedMs.value = 0
  hoseLinePercent.value = 0
  attendantAtVehicle.value = false
  fillPhaseCode.value = 'idle'
}

function resetFill() {
  pause()
  liters.value = 0
  displayedLiters.value = 0
  fillingState.value = 'idle'
  pulseArmed.value = false
  sessionStartedAt.value = null
  sessionElapsedMs.value = 0
  hoseLinePercent.value = 0
  attendantAtVehicle.value = false
  fillPhaseCode.value = 'idle'
}

async function handleCopyReceipt() {
  await copy(receiptText.value)
}
</script>

<template>
  <div
    class="relative min-h-dvh bg-bg-deep text-text-primary font-body overflow-x-hidden pb-[max(0px,env(safe-area-inset-bottom))]"
  >
    <div class="pointer-events-none fixed inset-0 opacity-100" aria-hidden="true">
      <div
        class="absolute inset-0 bg-[radial-gradient(ellipse_85%_50%_at_50%_-15%,rgba(255,107,74,0.11),transparent_58%),radial-gradient(ellipse_55%_40%_at_100%_100%,rgba(56,189,248,0.07),transparent_55%)]"
      />
    </div>

    <div
      class="relative z-10 max-w-6xl mx-auto pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] sm:px-6 py-8 sm:py-10 md:py-14"
    >
      <header class="mb-6 sm:mb-8 md:mb-10 text-left sm:pr-4 md:pr-8">
        <p
          class="font-display text-[0.65rem] min-[400px]:text-xs tracking-[0.2em] text-accent-amber uppercase mb-3 animate-fade-up animate-delay-1"
        >
          Trạm ảo · vui thôi
        </p>
        <h1
          class="font-display text-[1.75rem] min-[360px]:text-4xl min-[375px]:text-5xl sm:text-6xl font-bold text-accent-coral leading-[1.08] animate-fade-up animate-delay-2"
        >
          Đổ Xăng Online
        </h1>
        <p
          class="mt-3 sm:mt-4 text-text-secondary text-sm sm:text-base md:text-lg max-w-2xl leading-relaxed animate-fade-up animate-delay-3"
        >
          Một góc trạm đêm: chọn xe, chọn vòi, rót thử — giá theo bảng thật khi tải được. Phiên bản
          minh họa có đến <span class="text-text-primary font-medium">2026</span> trong danh sách.
        </p>
        <p class="mt-3 text-text-dim text-sm max-w-2xl animate-fade-up animate-delay-3">
          Tác giả:
          <a
            :href="meta.facebook"
            target="_blank"
            rel="noopener noreferrer"
            class="text-accent-coral link-underline"
          >
            {{ meta.author }}
          </a>
        </p>
      </header>

      <PriceBoard
        :fuels="fuels"
        :prices-loading="pricesLoading"
        :last-updated="lastUpdated"
        :price-error="priceError"
        :is-using-fallback="isUsingFallback"
        class="animate-fade-up animate-delay-4"
        @refresh="fetchPrices"
      />

      <div
        class="mt-6 sm:mt-8 lg:mt-10 grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 lg:gap-8 items-start"
      >
        <div class="lg:col-span-5 space-y-6 animate-fade-up animate-delay-5">
          <VehicleCascadePicker v-model="selectedVehicleId" />
          <FuelSelector
            v-model="selectedFuelId"
            :fuels="fuels"
            :is-using-fallback="isUsingFallback"
          />
        </div>
        <div class="lg:col-span-7 animate-fade-up animate-delay-6">
          <PumpScene
            :vehicle="selectedVehicle"
            :can-pump="canPump"
            :fuel="{ label: selectedFuel.label, pricePerLiter: selectedFuel.pricePerLiter }"
            :filling-state="fillingState"
            :session-walk-ms="SESSION_WALK_MS"
            :session-elapsed-ms="sessionElapsedMs"
            :hose-session-key="hoseSessionKey"
            :attendant-at-vehicle="attendantAtVehicle"
            :fill-phase-code="fillPhaseCode"
            :hose-line-percent="hoseLinePercent"
            :progress-percent="progressPercent"
            :liters-text="litersText"
            :total-cost-text="totalCostText"
            :station-state-label="getStationStateLabel"
            :pulse-armed="pulseArmed"
            :prefers-reduced-motion="prefersReducedMotion"
            :drop-seeds="dropSeeds"
            :is-using-fallback="isUsingFallback"
            :liters-odometer-key="litersOdometerKey"
            :cost-odometer-key="costOdometerKey"
            @start-fill="startFill"
            @stop-fill="stopFill"
            @reset-fill="resetFill"
          />
        </div>
      </div>

      <footer
        class="mt-10 sm:mt-14 pt-6 sm:pt-8 border-t border-border-default text-center text-text-dim text-xs sm:text-sm px-1"
      >
        <p class="mb-3">Đây là web giải trí. Xăng thật vẫn phải ra trạm nhé!</p>
        <RouterLink to="/" class="text-accent-coral link-underline font-display">
          Quay về trang chủ
        </RouterLink>
      </footer>
    </div>

    <ReceiptPanel
      v-if="showReceipt"
      :selected-vehicle="selectedVehicle"
      :selected-fuel="selectedFuel"
      :liters-text="litersText"
      :total-cost-text="totalCostText"
      :saved-cost="savedCost"
      :copied="copied"
      :liters-odometer-key="litersOdometerKey"
      :cost-odometer-key="costOdometerKey"
      @close="resetFill"
      @copy="handleCopyReceipt"
    />
  </div>
</template>
