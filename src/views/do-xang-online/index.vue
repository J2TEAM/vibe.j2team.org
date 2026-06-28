<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { useClipboard, useMediaQuery } from '@vueuse/core'
import meta from './meta'
import { useFuelRetailPrices } from './composables/useFuelRetailPrices'
import { useParkingAnimation } from './composables/useParkingAnimation'
import { useRefuelSession } from './composables/useRefuelSession'
import { stationStatusLabel, useRefuelUiState } from './composables/useRefuelStationMachine'
import PriceBoard from './components/PriceBoard.vue'
import VehicleCascadePicker from './components/VehicleCascadePicker.vue'
import FuelSelector from './components/FuelSelector.vue'
import FuelStationScene from './components/FuelStationScene.vue'
import ReceiptPanel from './components/ReceiptPanel.vue'
import { DEFAULT_VEHICLE_ID, EMPTY_VEHICLE_ID, resolveVehicle } from './data/vehicleCatalog'
import { SESSION_WALK_MS } from './sessionConstants'

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

const capacityLiters = computed(() => selectedVehicle.value.capacityLiters)

const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')

const { isParked, isParking, parkingProgress01, beginParking, resetParking } = useParkingAnimation({
  prefersReducedMotion,
})

const {
  hoseSessionKey,
  fillingState,
  liters,
  displayedLiters,
  pulseArmed,
  sessionElapsedMs,
  hoseLinePercent,
  attendantAtVehicle,
  fillPhaseCode,
  startFill,
  stopFill,
  resetFill: resetSessionOnly,
  resetSessionCore,
} = useRefuelSession({
  capacityLiters,
  prefersReducedMotion,
})

const refuelUiState = useRefuelUiState({
  isParked,
  isParking,
  fillingState,
  fillPhaseCode,
})

const getStationStateLabel = computed(() =>
  stationStatusLabel(refuelUiState.value, fillPhaseCode.value, fillingState.value),
)

onMounted(() => {
  fetchPrices()
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

watch([selectedVehicleId, selectedFuelId], () => {
  resetSessionCore()
  resetParking()
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

function handlePark() {
  if (!canPump.value) return
  if (isParking.value || isParked.value) return
  beginParking()
}

function handleStartRefuel() {
  if (!canPump.value) return
  if (!isParked.value) return
  if (fillingState.value === 'filling') return
  startFill()
}

function resetFill() {
  resetSessionOnly()
  resetParking()
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
          <FuelStationScene
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
            :is-parked="isParked"
            :is-parking="isParking"
            :parking-progress01="parkingProgress01"
            @park="handlePark"
            @start-refuel="handleStartRefuel"
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
