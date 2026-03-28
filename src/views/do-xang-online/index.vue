<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { Icon } from '@iconify/vue'
import { useClipboard, useIntervalFn, useMediaQuery, useRafFn } from '@vueuse/core'
import meta from './meta'
import { useFuelRetailPrices } from './composables/useFuelRetailPrices'

type Vehicle = {
  id: string
  name: string
  description: string
  capacityLiters: number
  icon: string
}

type FuelDef = {
  id: string
  label: string
  icon: string
}

const vehicles: Vehicle[] = [
  {
    id: 'air-blade',
    name: 'Air Blade',
    description: 'Xe tay ga phổ thông',
    capacityLiters: 5.5,
    icon: 'lucide:bike',
  },
  {
    id: 'vision',
    name: 'Vision',
    description: 'Xe tay ga nhỏ gọn',
    capacityLiters: 5.2,
    icon: 'lucide:bike',
  },
  {
    id: 'winner-x',
    name: 'Winner X',
    description: 'Xe số thể thao',
    capacityLiters: 4.5,
    icon: 'lucide:bike',
  },
  {
    id: 'sh-mode',
    name: 'SH Mode',
    description: 'Xe tay ga cao cấp',
    capacityLiters: 5.5,
    icon: 'lucide:bike',
  },
  {
    id: 'wave-alpha',
    name: 'Wave Alpha',
    description: 'Xe số tiết kiệm',
    capacityLiters: 4,
    icon: 'lucide:bike',
  },
  {
    id: 'oto',
    name: 'Ô tô',
    description: 'Xe hơi 4 bánh',
    capacityLiters: 50,
    icon: 'lucide:car',
  },
]

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

const selectedVehicleId = ref<string>(vehicles[0]!.id)
const selectedFuelId = ref<string>(FUEL_DEFS[0]!.id)

const selectedVehicle = computed(() => vehicles.find((v) => v.id === selectedVehicleId.value)!)
const selectedFuel = computed(() => fuels.value.find((f) => f.id === selectedFuelId.value)!)

onMounted(() => {
  fetchPrices()
})

const fillingState = ref<'idle' | 'filling' | 'complete'>('idle')
const liters = ref(0)
const displayedLiters = ref(0)
const pulseArmed = ref(false)
const fillStartedAt = ref<number | null>(null)

const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')

const minFillMs = 5000
const maxFillMs = 10000
const fillDurationMs = computed(() => {
  // Đảm bảo cảm giác "rót" chậm: dung tích càng lớn -> thời gian càng dài (5-10s).
  const cap = selectedVehicle.value.capacityLiters
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

const progressOdo = computed(() => Math.round(progressPercent.value))
const progressOdometerKey = computed(() => progressOdo.value.toString())

const showReceipt = computed(() => fillingState.value === 'complete')

const fakeStationMultiplier = 1.15
const fakeStationCost = computed(() => totalCost.value * fakeStationMultiplier)
const savedCost = computed(() => Math.max(0, fakeStationCost.value - totalCost.value))

const receiptText = computed(() => {
  const vehicle = selectedVehicle.value
  const fuel = selectedFuel.value
  const saved = Math.round(savedCost.value)
  return [
    'Đổ Xăng Online (web giải trí)',
    `Xe: ${vehicle.name} - ${vehicle.description}`,
    `Loại xăng: ${fuel.label}`,
    `Đã đổ: ${liters.value.toFixed(2)} L`,
    `Tổng tiền: ${formatMoneyVn(totalCost.value)}`,
    `Đã tiết kiệm: ${saved.toLocaleString('vi-VN')}đ (so với “trạm xăng thật” giả lập)`,
    isUsingFallback.value
      ? 'Giá mẫu (không lấy được giá thực)'
      : `Giá cập nhật: ${lastUpdated.value}`,
    'Xăng thật vẫn phải ra trạm nhé!',
  ].join('\n')
})

const { copy, copied } = useClipboard()

const getStationStateLabel = computed(() => {
  if (fillingState.value === 'idle') return 'Chờ bắt đầu'
  if (fillingState.value === 'filling') return 'Đang đổ...'
  return 'Đã đầy bình'
})

const { pause, resume } = useIntervalFn(
  () => {
    if (fillingState.value !== 'filling') return

    const cap = selectedVehicle.value.capacityLiters
    if (fillStartedAt.value === null) return

    const elapsed = performance.now() - fillStartedAt.value
    const ratio = Math.max(0, Math.min(1, elapsed / fillDurationMs.value))
    liters.value = cap * ratio

    if (ratio >= 1) {
      pause()
      fillingState.value = 'complete'
    }
  },
  80,
  { immediate: false },
)

watch([selectedVehicleId, selectedFuelId], () => {
  pause()
  liters.value = 0
  displayedLiters.value = 0
  fillingState.value = 'idle'
  pulseArmed.value = false
  fillStartedAt.value = null
})

const { pause: pauseDisplay, resume: resumeDisplay } = useRafFn(
  ({ delta }) => {
    if (prefersReducedMotion.value) return
    if (fillingState.value !== 'filling') return

    if (!pulseArmed.value && fillStartedAt.value !== null) {
      const now = performance.now()
      if (now - fillStartedAt.value >= 700) pulseArmed.value = true
    }

    const cap = selectedVehicle.value.capacityLiters
    const target = Math.min(liters.value, cap)
    const diff = target - displayedLiters.value

    if (Math.abs(diff) < 0.0005) {
      displayedLiters.value = target
      return
    }

    // Smoothly interpolate toward the real liters value.
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

// If reduced motion is enabled, we still want progress values to update
// (but without the "lerp display" animation loop).
watch(liters, (value) => {
  if (!prefersReducedMotion.value) return
  if (fillingState.value !== 'filling') return
  displayedLiters.value = value
})

const dropSeeds = computed(() => {
  // Deterministic across renders (based on vehicle/fuel ids).
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
  if (fillingState.value === 'complete') return
  if (prefersReducedMotion.value) {
    // Don't jump straight to "complete" even if reduced motion is enabled.
    // We still want the progress timing to feel consistent for the user.
    liters.value = 0
    displayedLiters.value = 0
    pulseArmed.value = false
    fillStartedAt.value = performance.now()
    fillingState.value = 'filling'
    resume()
    return
  }

  if (fillingState.value === 'idle') {
    liters.value = 0
    displayedLiters.value = 0
  }

  fillingState.value = 'filling'
  pulseArmed.value = false
  fillStartedAt.value = performance.now()
  resume()
}

function stopFill() {
  if (fillingState.value !== 'filling') return
  pause()
  fillingState.value = 'idle'
  displayedLiters.value = liters.value
  pulseArmed.value = false
  fillStartedAt.value = null
}

function resetFill() {
  pause()
  liters.value = 0
  displayedLiters.value = 0
  fillingState.value = 'idle'
  pulseArmed.value = false
  fillStartedAt.value = null
}

async function handleCopyReceipt() {
  await copy(receiptText.value)
}
</script>

<template>
  <div class="min-h-screen bg-bg-deep text-text-primary font-body">
    <div class="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      <header class="mb-10 sm:mb-16">
        <h1
          class="font-display text-4xl min-[375px]:text-5xl sm:text-6xl font-bold text-accent-coral animate-fade-up animate-delay-1"
        >
          Đổ Xăng Online
        </h1>
        <p
          class="mt-4 text-text-secondary text-lg max-w-2xl mx-auto animate-fade-up animate-delay-2"
        >
          Xăng tăng giá quá cao, chiến tranh và đủ thứ loạn xì ngầu. Thôi đổ online cho vui!
        </p>
        <p class="mt-2 text-text-dim text-sm text-center animate-fade-up animate-delay-3">
          Chọn xe, chọn loại xăng, rồi bấm bắt đầu. Web giải trí thôi — xăng thật vẫn phải ra trạm
          nhé!
        </p>
        <p
          class="mt-4 text-text-dim text-xs text-center font-display tracking-wide animate-fade-up animate-delay-4"
        >
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

      <!-- Vehicles -->
      <section class="mb-10 sm:mb-16">
        <h2
          class="font-display text-2xl font-semibold flex items-center gap-3 mb-6 animate-fade-up animate-delay-3"
        >
          <span class="text-accent-coral text-sm tracking-widest font-display">//</span>
          Chọn phương tiện
        </h2>

        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <button
            v-for="v in vehicles"
            :key="v.id"
            type="button"
            class="vehicleCard text-left border border-border-default bg-bg-surface p-5 transition-all duration-300 hover:-translate-y-1 hover:border-accent-coral hover:bg-bg-elevated hover:shadow-lg hover:shadow-accent-coral/5 cursor-pointer relative overflow-hidden"
            :class="
              v.id === selectedVehicleId
                ? 'border-accent-coral bg-bg-elevated shadow-lg shadow-accent-coral/10'
                : ''
            "
            @click="selectedVehicleId = v.id"
          >
            <span
              aria-hidden="true"
              class="absolute inset-0 bg-accent-coral/10 opacity-0 transition-opacity duration-300 pointer-events-none"
              :class="v.id === selectedVehicleId ? 'opacity-100' : 'opacity-0'"
            />
            <span
              aria-hidden="true"
              class="absolute left-0 top-0 bottom-0 w-1 bg-accent-coral opacity-0 transition-opacity duration-300 pointer-events-none"
              :class="v.id === selectedVehicleId ? 'opacity-100' : 'opacity-0'"
            />

            <div class="relative z-10 flex items-start gap-4">
              <div
                class="vehicleIconWrap w-12 h-12 flex items-center justify-center border border-border-default bg-bg-elevated transition-transform duration-300"
                :class="v.id === selectedVehicleId ? 'vehicleIconWrap--selected' : ''"
              >
                <Icon :icon="v.icon" class="w-6 h-6 text-accent-amber" />
              </div>
              <div class="flex-1">
                <div class="flex items-center gap-3">
                  <div class="font-display font-bold text-text-primary">{{ v.name }}</div>
                  <div
                    class="font-display text-xs tracking-widest text-accent-coral"
                    :class="v.id === selectedVehicleId ? 'vehicleValuePulse' : ''"
                  >
                    - {{ v.capacityLiters }}L
                  </div>
                </div>
                <div class="text-text-secondary text-sm mt-2">
                  {{ v.description }}
                </div>
              </div>
            </div>
          </button>
        </div>
      </section>

      <!-- Fuel -->
      <section class="mb-10 sm:mb-16">
        <div
          class="flex flex-wrap items-center justify-between gap-3 mb-6 animate-fade-up animate-delay-4"
        >
          <h2 class="font-display text-2xl font-semibold flex items-center gap-3">
            <span class="text-accent-amber text-sm tracking-widest font-display">//</span>
            Chọn loại xăng
          </h2>
          <div class="flex items-center gap-3">
            <span class="text-text-dim text-xs font-display">
              <template v-if="pricesLoading">Đang tải giá...</template>
              <template v-else-if="lastUpdated">Cập nhật: {{ lastUpdated }}</template>
            </span>
            <button
              type="button"
              class="flex items-center gap-1.5 border border-border-default bg-bg-surface text-text-secondary font-display text-xs px-3 py-1.5 transition-colors hover:border-accent-amber hover:bg-bg-elevated cursor-pointer disabled:opacity-40"
              :disabled="pricesLoading"
              @click="fetchPrices"
            >
              <Icon
                icon="lucide:refresh-cw"
                class="w-3.5 h-3.5"
                :class="pricesLoading ? 'animate-spin' : ''"
              />
              Làm mới giá
            </button>
          </div>
        </div>

        <div
          v-if="priceError && isUsingFallback"
          class="mb-4 border border-accent-amber/30 bg-accent-amber/5 px-4 py-2 text-xs text-accent-amber font-display"
        >
          Không lấy được giá thực ({{ priceError }}). Đang dùng giá mẫu.
        </div>

        <div class="grid gap-4 sm:grid-cols-3">
          <button
            v-for="f in fuels"
            :key="f.id"
            type="button"
            class="fuelCard text-left border border-border-default bg-bg-surface p-5 transition-all duration-300 hover:-translate-y-1 hover:border-accent-coral hover:bg-bg-elevated hover:shadow-lg hover:shadow-accent-coral/5 cursor-pointer relative overflow-hidden"
            :class="
              f.id === selectedFuelId
                ? 'border-accent-coral bg-bg-elevated shadow-lg shadow-accent-coral/10'
                : ''
            "
            @click="selectedFuelId = f.id"
          >
            <span
              aria-hidden="true"
              class="absolute inset-0 bg-accent-coral/10 opacity-0 transition-opacity duration-300 pointer-events-none"
              :class="f.id === selectedFuelId ? 'opacity-100' : 'opacity-0'"
            />
            <span
              aria-hidden="true"
              class="absolute left-0 top-0 bottom-0 w-1 bg-accent-coral opacity-0 transition-opacity duration-300 pointer-events-none"
              :class="f.id === selectedFuelId ? 'opacity-100' : 'opacity-0'"
            />

            <div class="relative z-10 flex items-start gap-4">
              <div
                class="fuelIconWrap w-12 h-12 flex items-center justify-center border border-border-default bg-bg-elevated transition-transform duration-300"
                :class="f.id === selectedFuelId ? 'fuelIconWrap--selected' : ''"
              >
                <Icon :icon="f.icon" class="w-6 h-6 text-accent-amber" />
              </div>
              <div class="flex-1">
                <div
                  class="font-display font-bold"
                  :class="f.id === selectedFuelId ? 'fuelValuePulse' : ''"
                >
                  {{ f.label }}
                </div>
                <div
                  class="mt-2 font-display text-sm tracking-widest text-accent-amber"
                  :class="f.id === selectedFuelId ? 'fuelPricePulse' : ''"
                >
                  {{ formatMoneyVn(f.pricePerLiter) }}/L
                </div>
                <div v-if="f.changeText" class="text-text-dim text-xs mt-1 font-display">
                  {{ f.changeText }}
                </div>
                <div v-else class="text-text-dim text-xs mt-1">
                  {{ isUsingFallback ? 'Giá mẫu (chưa cập nhật)' : 'Giá bán lẻ VnExpress' }}
                </div>
              </div>
            </div>
          </button>
        </div>
      </section>

      <!-- Station -->
      <section class="mb-10 sm:mb-16">
        <h2
          class="font-display text-2xl font-semibold flex items-center gap-3 mb-6 animate-fade-up animate-delay-5"
        >
          <span class="text-accent-sky text-sm tracking-widest font-display">//</span>
          Trạm xăng
        </h2>

        <div class="border border-border-default bg-bg-surface p-6">
          <div class="flex flex-col lg:flex-row gap-6">
            <div class="lg:w-1/3">
              <div class="flex items-center justify-between gap-4">
                <div>
                  <div class="font-display text-sm tracking-widest text-accent-coral">
                    Xe đang chọn
                  </div>
                  <div class="mt-2 font-display text-xl font-bold">{{ selectedVehicle.name }}</div>
                  <div class="text-text-secondary text-sm mt-1">
                    {{ selectedVehicle.description }}
                  </div>
                </div>
                <div class="text-right">
                  <div class="font-display text-text-secondary text-xs tracking-widest">//</div>
                  <div
                    :key="progressOdometerKey"
                    class="odometerNumber font-display text-4xl font-bold text-text-primary"
                    :class="fillingState === 'filling' && pulseArmed ? 'progressPulse' : ''"
                  >
                    {{ progressOdo }}%
                  </div>
                </div>
              </div>

              <div class="mt-6 border border-border-default bg-bg-elevated p-4">
                <div class="flex items-center justify-between gap-4">
                  <div class="flex items-center gap-3">
                    <Icon icon="lucide:flame" class="w-5 h-5 text-accent-coral" />
                    <div class="font-display text-sm tracking-widest text-accent-coral">
                      Trạng thái
                    </div>
                  </div>
                  <div class="font-display text-sm text-text-secondary">
                    {{ getStationStateLabel }}
                  </div>
                </div>

                <div class="mt-4 space-y-2">
                  <div class="flex items-center justify-between gap-4 text-sm">
                    <span class="text-text-dim">Số lít đã đổ</span>
                    <span
                      :key="litersOdometerKey"
                      class="odometerNumber font-display font-bold text-accent-sky"
                    >
                      {{ litersText }} L
                    </span>
                  </div>
                  <div class="flex items-center justify-between gap-4 text-sm">
                    <span class="text-text-dim">Tổng tiền</span>
                    <span
                      :key="costOdometerKey"
                      class="odometerNumber font-display font-bold text-accent-amber"
                    >
                      {{ totalCostText }}
                    </span>
                  </div>
                </div>
              </div>

              <div class="mt-4 text-sm text-text-secondary">
                <span class="text-accent-amber font-display font-bold">Mẹo:</span>
                Đây chỉ là web giải trí, xăng thật vẫn phải ra trạm nhé!
              </div>
            </div>

            <div class="flex-1">
              <div class="border border-border-default bg-bg-elevated p-4">
                <div class="flex items-center justify-between gap-4">
                  <div class="font-display text-sm tracking-widest text-accent-amber">
                    Đổ xăng ảo
                  </div>
                  <div class="font-display text-sm text-text-dim">
                    Dung tích: {{ selectedVehicle.capacityLiters }}L
                  </div>
                </div>

                <div
                  class="mt-4 relative bg-bg-deep/50 border border-border-default overflow-hidden"
                  style="height: 220px"
                >
                  <div
                    class="absolute inset-x-0 bottom-0 h-20 bg-bg-elevated/60 border-t border-border-default"
                  />

                  <!-- Gauge -->
                  <div class="absolute left-0 right-0 bottom-0 h-3 border-t border-border-default">
                    <div
                      class="h-full bg-accent-sky transition-all duration-300"
                      :style="{ width: `${progressPercent}%` }"
                    />
                  </div>

                  <!-- Tank liquid (filled level) -->
                  <div
                    class="absolute left-8 right-8 bottom-10 h-28 border border-border-default bg-bg-elevated/10 overflow-hidden pointer-events-none"
                  >
                    <div
                      class="tankLiquidFill"
                      :style="{ height: `${progressPercent}%` }"
                      :class="
                        fillingState === 'filling' && pulseArmed ? 'tankLiquidFill--live' : ''
                      "
                    >
                      <div
                        class="tankWave"
                        :class="fillingState === 'filling' && pulseArmed ? 'tankWave--live' : ''"
                      />
                    </div>
                  </div>

                  <!-- Pump / Body -->
                  <div
                    class="absolute left-1/2 top-0 -translate-x-1/2 w-64 h-full"
                    :class="fillingState === 'filling' && pulseArmed ? 'pumpVibrate' : ''"
                  >
                    <div
                      class="absolute left-1/2 top-12 -translate-x-1/2 w-44 h-36 border border-border-default bg-bg-surface"
                    />

                    <div
                      class="absolute left-1/2 top-3 -translate-x-1/2 w-16 h-24 border border-border-default bg-bg-elevated relative"
                    >
                      <div
                        class="absolute left-1/2 top-2 -translate-x-1/2 w-6 h-10 border border-border-default bg-bg-surface"
                      />

                      <div class="absolute left-1/2 top-0 -translate-x-1/2 w-8 h-6">
                        <div
                          class="h-full w-full border border-border-default bg-accent-coral/10"
                          :class="fillingState === 'filling' && pulseArmed ? 'nozzleGlow' : ''"
                        />
                      </div>

                      <div
                        v-if="fillingState === 'filling' && pulseArmed && !prefersReducedMotion"
                        class="nozzleStream"
                      />
                    </div>

                    <!-- Drops -->
                    <template v-if="fillingState === 'filling' && !prefersReducedMotion">
                      <div
                        v-for="d in dropSeeds"
                        :key="d.key"
                        class="drop"
                        :style="{
                          left: `${d.left}%`,
                          animationDelay: `${d.delay}s`,
                          animationDuration: `${d.duration}s`,
                        }"
                      />
                    </template>

                    <div
                      class="absolute left-1/2 bottom-10 -translate-x-1/2 w-28 h-2 bg-border-default"
                    >
                      <div
                        class="h-full bg-accent-amber transition-all duration-300"
                        :style="{ width: `${progressPercent}%` }"
                      />
                    </div>
                  </div>

                  <!-- Labels -->
                  <div
                    class="absolute left-4 top-4 text-xs font-display tracking-widest text-text-dim"
                  >
                    {{ selectedFuel.label }}
                  </div>
                  <div
                    class="absolute right-4 top-4 text-xs font-display tracking-widest text-accent-sky"
                    :class="fillingState === 'filling' && pulseArmed ? 'progressPulse' : ''"
                  >
                    {{ progressOdo }}%
                  </div>
                </div>

                <div
                  class="mt-4 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between"
                >
                  <div class="flex items-center gap-3">
                    <button
                      v-if="fillingState === 'idle'"
                      type="button"
                      class="bg-accent-coral text-bg-deep font-display font-bold px-5 py-2 transition-all hover:bg-accent-amber active:scale-95 disabled:opacity-50 cursor-pointer"
                      @click="startFill"
                    >
                      Bắt đầu đổ
                    </button>
                    <button
                      v-if="fillingState === 'filling'"
                      type="button"
                      class="bg-accent-amber text-bg-deep font-display font-bold px-5 py-2 transition-all hover:bg-accent-coral active:scale-95 disabled:opacity-50 cursor-pointer"
                      @click="stopFill"
                    >
                      Dừng
                    </button>

                    <button
                      type="button"
                      class="border border-border-default bg-bg-surface text-text-primary font-display font-bold px-5 py-2 transition-colors hover:border-accent-coral hover:bg-bg-elevated active:scale-95 disabled:opacity-50 cursor-pointer"
                      @click="resetFill"
                    >
                      Reset
                    </button>
                  </div>

                  <div class="text-text-dim text-sm sm:text-right">
                    Giá đang áp dụng:
                    <span class="text-accent-amber font-display font-bold"
                      >{{ selectedFuel.pricePerLiter.toLocaleString('vi-VN') }}đ</span
                    >/L
                    <span v-if="isUsingFallback" class="block text-xs text-text-dim mt-0.5"
                      >(giá mẫu)</span
                    >
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div class="flex gap-1.5 justify-center mt-10 animate-fade-up animate-delay-6">
        <span v-for="n in 40" :key="n" class="w-1 h-1 rounded-full bg-border-default" />
      </div>

      <!-- Footer -->
      <footer class="mt-12 text-center text-text-dim text-sm">
        <div class="mb-4">Đây là web giải trí. Xăng thật vẫn phải ra trạm nhé!</div>
        <RouterLink to="/" class="text-accent-coral link-underline"> Quay về trang chủ </RouterLink>
      </footer>
    </div>

    <!-- Receipt overlay -->
    <div
      v-if="showReceipt"
      class="fixed inset-0 z-50 flex items-center justify-center bg-bg-deep/70 p-4"
      role="dialog"
      aria-modal="true"
    >
      <div class="w-full max-w-2xl border border-accent-coral bg-bg-surface p-6">
        <div class="flex items-start justify-between gap-4">
          <div>
            <div class="font-display text-accent-coral text-sm tracking-widest">// RECEIPT</div>
            <div class="font-display text-2xl font-bold mt-2">Biên nhận đổ xăng online</div>
            <div class="text-text-secondary text-sm mt-2">
              Cho vui thôi — chứ ngoài đời phải ra trạm thật.
            </div>
          </div>
          <button
            type="button"
            class="border border-border-default bg-bg-elevated text-text-primary font-display font-bold px-3 py-2 transition-colors hover:border-accent-coral hover:bg-bg-surface cursor-pointer"
            @click="resetFill"
          >
            Đóng
          </button>
        </div>

        <div class="mt-5 border border-border-default bg-bg-elevated p-4">
          <div class="grid gap-3 sm:grid-cols-2">
            <div>
              <div class="text-text-dim text-xs tracking-widest font-display">Xe</div>
              <div class="font-display font-bold mt-1">{{ selectedVehicle.name }}</div>
              <div class="text-text-secondary text-sm mt-1">{{ selectedVehicle.description }}</div>
            </div>
            <div>
              <div class="text-text-dim text-xs tracking-widest font-display">Loại xăng</div>
              <div class="font-display font-bold mt-1">{{ selectedFuel.label }}</div>
              <div class="text-accent-amber text-sm mt-1 font-display font-bold">
                {{ selectedFuel.pricePerLiter.toLocaleString('vi-VN') }}đ/L
              </div>
            </div>
            <div>
              <div class="text-text-dim text-xs tracking-widest font-display">Đã đổ</div>
              <div
                :key="litersOdometerKey"
                class="odometerNumber font-display font-bold text-accent-sky text-lg mt-1"
              >
                {{ litersText }} L
              </div>
            </div>
            <div>
              <div class="text-text-dim text-xs tracking-widest font-display">Tổng tiền</div>
              <div
                :key="costOdometerKey"
                class="odometerNumber font-display font-bold text-accent-amber text-lg mt-1"
              >
                {{ totalCostText }}
              </div>
            </div>
          </div>

          <div class="mt-4 border-t border-border-default pt-4">
            <div class="font-display font-bold text-accent-coral">
              Đã tiết kiệm: {{ Math.round(savedCost).toLocaleString('vi-VN') }}đ
            </div>
            <div class="text-text-secondary text-sm mt-2">
              So với “trạm xăng thật” giả lập (1.15x). Lý do: web muốn bạn cười nhiều hơn.
            </div>
          </div>
        </div>

        <div class="mt-5 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <button
            type="button"
            class="bg-accent-coral text-bg-deep font-display font-bold px-5 py-2 transition-all hover:bg-accent-amber active:scale-95 cursor-pointer"
            @click="handleCopyReceipt"
          >
            {{ copied ? 'Đã copy biên nhận' : 'Copy biên nhận' }}
          </button>

          <div class="text-text-dim text-sm">Nhớ uống nước, nhưng xăng thì ra trạm thật nhé.</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.drop {
  position: absolute;
  top: 58px;
  width: 8px;
  height: 10px;
  background: rgba(255, 184, 48, 0.95);
  border: 1px solid rgba(255, 184, 48, 0.8);
  border-radius: 2px;
  transform: translateY(-10px);
  opacity: 0;
  animation-name: fuelDrop;
  animation-timing-function: ease-in;
  animation-iteration-count: infinite;
  will-change: transform, opacity;
}

@keyframes fuelDrop {
  0% {
    opacity: 0;
    transform: translateY(-10px);
  }
  12% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: translateY(92px);
  }
}

.nozzleGlow {
  animation: nozzleGlow 0.7s ease-in-out infinite;
}

@keyframes nozzleGlow {
  0% {
    box-shadow: 0 0 0 rgba(255, 107, 74, 0);
  }
  50% {
    box-shadow: 0 0 22px rgba(255, 107, 74, 0.55);
  }
  100% {
    box-shadow: 0 0 0 rgba(255, 107, 74, 0);
  }
}

.pumpVibrate {
  animation: pumpVibrate 0.25s ease-in-out infinite;
  transform-origin: center;
}

@keyframes pumpVibrate {
  0% {
    transform: translateX(0);
  }
  50% {
    transform: translateX(-1.5px);
  }
  100% {
    transform: translateX(0);
  }
}

.tankLiquidFill {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(56, 189, 248, 0.22);
  transition: height 0.08s linear;
}

.tankLiquidFill--live {
  box-shadow: 0 0 28px rgba(56, 189, 248, 0.25);
}

.tankWave {
  position: absolute;
  left: -30%;
  right: -30%;
  top: -12px;
  height: 24px;
  background: linear-gradient(
    90deg,
    rgba(56, 189, 248, 0),
    rgba(56, 189, 248, 0.35),
    rgba(56, 189, 248, 0)
  );
  border-radius: 9999px;
  opacity: 0;
  transform: translateX(0);
  will-change: transform, opacity;
}

.tankWave--live {
  opacity: 1;
  animation: tankWaveMove 0.9s linear infinite;
}

@keyframes tankWaveMove {
  from {
    transform: translateX(-24px);
  }
  to {
    transform: translateX(48px);
  }
}

.nozzleStream {
  position: absolute;
  left: 50%;
  top: 10px;
  width: 2px;
  height: 70px;
  transform: translateX(-50%);
  background: linear-gradient(to bottom, rgba(255, 107, 74, 0.85), rgba(56, 189, 248, 0.35));
  border-radius: 2px;
  opacity: 0.95;
  filter: drop-shadow(0 0 10px rgba(56, 189, 248, 0.25));
  animation: nozzleStreamFlow 0.18s ease-in-out infinite;
  will-change: transform, opacity;
}

@keyframes nozzleStreamFlow {
  0%,
  100% {
    transform: translateX(-50%) scaleY(1);
  }
  50% {
    transform: translateX(-50%) scaleY(0.85);
    opacity: 0.7;
  }
}

.odometerNumber {
  display: inline-block;
  animation: odometerFlip 0.28s ease-out;
}

@keyframes odometerFlip {
  0% {
    transform: translateY(6px);
    opacity: 0;
  }
  100% {
    transform: translateY(0);
    opacity: 1;
  }
}

.progressPulse {
  animation: progressPulse 0.9s ease-in-out infinite;
  transform-origin: center;
}

@keyframes progressPulse {
  0%,
  100% {
    transform: translateY(0) scale(1);
  }
  50% {
    transform: translateY(-2px) scale(1.03);
  }
}

.vehicleIconWrap--selected {
  animation: vehicleIconPulse 0.85s ease-in-out infinite;
}

@keyframes vehicleIconPulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.08);
  }
}

.vehicleValuePulse {
  animation: vehicleValuePulse 1s ease-in-out infinite;
}

@keyframes vehicleValuePulse {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-1px);
  }
}

.fuelIconWrap--selected {
  animation: vehicleIconPulse 0.85s ease-in-out infinite;
}

.fuelValuePulse {
  animation: vehicleValuePulse 1s ease-in-out infinite;
}

.fuelPricePulse {
  animation: progressPulse 0.9s ease-in-out infinite;
}

@media (prefers-reduced-motion: reduce) {
  .progressPulse,
  .vehicleIconWrap--selected,
  .vehicleValuePulse,
  .pumpVibrate,
  .tankWave--live,
  .nozzleStream,
  .tankLiquidFill--live,
  .odometerNumber,
  .fuelIconWrap--selected,
  .fuelValuePulse,
  .fuelPricePulse {
    animation: none;
  }
}
</style>
