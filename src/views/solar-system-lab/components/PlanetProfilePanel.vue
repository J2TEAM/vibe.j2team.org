<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { computed } from 'vue'
import type { PlanetDefinition, PlanetSeasonData } from '../types'

const props = defineProps<{
  selectedPlanet: PlanetDefinition
  seasonData: PlanetSeasonData
  selectedDistanceMillionKm: number
  selectedOrbitSpeedKmS: number
  selectedOrbitProgress: number
  earthOrbitProgress: number
  selectedSizeVsEarth: number
  selectedYearVsEarth: number
  sizeComparePercent: number
  yearComparePercent: number
}>()

const insolationPercent = computed(() =>
  Math.max(5, Math.round(props.seasonData.insolationIndex * 100)),
)

function formatNumber(value: number, digits = 1): string {
  return value.toLocaleString('vi-VN', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
}
</script>

<template>
  <aside
    class="border border-border-default bg-bg-surface p-4 sm:p-5 animate-fade-up animate-delay-3"
  >
    <h2 class="flex items-center gap-3 font-display text-2xl font-semibold">
      <span class="font-display text-sm tracking-widest text-accent-amber">//</span>
      Hồ sơ hành tinh
    </h2>

    <div class="mt-4 border border-border-default bg-bg-elevated p-4">
      <p class="font-display text-xs tracking-widest text-text-dim">
        {{ selectedPlanet.englishName }}
      </p>
      <h3 class="mt-2 text-2xl font-semibold text-accent-amber">{{ selectedPlanet.name }}</h3>
      <p class="mt-3 text-sm leading-relaxed text-text-secondary">
        {{ selectedPlanet.description }}
      </p>
      <p class="mt-2 text-sm leading-relaxed text-accent-sky">{{ selectedPlanet.learningHint }}</p>
    </div>

    <dl class="mt-4 grid gap-2 text-sm">
      <div
        class="flex items-center justify-between border border-border-default bg-bg-elevated px-3 py-2"
      >
        <dt class="text-text-secondary">Khoảng cách đến Mặt Trời</dt>
        <dd class="font-semibold">{{ formatNumber(selectedDistanceMillionKm, 1) }} triệu km</dd>
      </div>

      <div
        class="flex items-center justify-between border border-border-default bg-bg-elevated px-3 py-2"
      >
        <dt class="text-text-secondary">Chu kỳ quỹ đạo</dt>
        <dd class="font-semibold">{{ formatNumber(selectedPlanet.orbitalPeriodDays, 1) }} ngày</dd>
      </div>

      <div
        class="flex items-center justify-between border border-border-default bg-bg-elevated px-3 py-2"
      >
        <dt class="text-text-secondary">Vận tốc quỹ đạo</dt>
        <dd class="font-semibold">{{ formatNumber(selectedOrbitSpeedKmS, 1) }} km/s</dd>
      </div>

      <div
        class="flex items-center justify-between border border-border-default bg-bg-elevated px-3 py-2"
      >
        <dt class="text-text-secondary">Đường kính</dt>
        <dd class="font-semibold">{{ selectedPlanet.diameterKm.toLocaleString('vi-VN') }} km</dd>
      </div>

      <div
        class="flex items-center justify-between border border-border-default bg-bg-elevated px-3 py-2"
      >
        <dt class="text-text-secondary">Độ lệch tâm quỹ đạo (e)</dt>
        <dd class="font-semibold">{{ formatNumber(selectedPlanet.eccentricity, 3) }}</dd>
      </div>

      <div
        class="flex items-center justify-between border border-border-default bg-bg-elevated px-3 py-2"
      >
        <dt class="text-text-secondary">Độ nghiêng quỹ đạo (i)</dt>
        <dd class="font-semibold">{{ formatNumber(selectedPlanet.orbitalInclinationDeg, 2) }}°</dd>
      </div>

      <div
        class="flex items-center justify-between border border-border-default bg-bg-elevated px-3 py-2"
      >
        <dt class="text-text-secondary">Độ nghiêng trục quay</dt>
        <dd class="font-semibold">{{ formatNumber(selectedPlanet.axialTiltDeg, 2) }}°</dd>
      </div>

      <div
        class="flex items-center justify-between border border-border-default bg-bg-elevated px-3 py-2"
      >
        <dt class="text-text-secondary">Số vệ tinh tự nhiên</dt>
        <dd class="font-semibold">{{ selectedPlanet.moons }}</dd>
      </div>

      <div
        class="flex items-center justify-between border border-border-default bg-bg-elevated px-3 py-2"
      >
        <dt class="text-text-secondary">Chu kỳ tự quay</dt>
        <dd class="font-semibold">{{ selectedPlanet.rotationLabel }}</dd>
      </div>
    </dl>

    <div class="mt-4 space-y-3 border border-border-default bg-bg-elevated p-4">
      <div>
        <div class="mb-1 flex items-center justify-between text-xs">
          <span class="font-display tracking-widest text-text-dim">TIẾN TRÌNH NĂM HÀNH TINH</span>
          <span>{{ formatNumber(selectedOrbitProgress, 1) }}%</span>
        </div>
        <div class="h-2 bg-bg-deep">
          <div class="h-full bg-accent-amber" :style="{ width: `${selectedOrbitProgress}%` }" />
        </div>
      </div>

      <div>
        <div class="mb-1 flex items-center justify-between text-xs">
          <span class="font-display tracking-widest text-text-dim">TIẾN TRÌNH NĂM TRÁI ĐẤT</span>
          <span>{{ formatNumber(earthOrbitProgress, 1) }}%</span>
        </div>
        <div class="h-2 bg-bg-deep">
          <div class="h-full bg-accent-coral" :style="{ width: `${earthOrbitProgress}%` }" />
        </div>
      </div>

      <div>
        <div class="mb-1 flex items-center justify-between text-xs">
          <span class="font-display tracking-widest text-text-dim">KÍCH THƯỚC SO VỚI TRÁI ĐẤT</span>
          <span>{{ formatNumber(selectedSizeVsEarth, 2) }}x</span>
        </div>
        <div class="h-2 bg-bg-deep">
          <div class="h-full bg-accent-sky" :style="{ width: `${sizeComparePercent}%` }" />
        </div>
      </div>

      <div>
        <div class="mb-1 flex items-center justify-between text-xs">
          <span class="font-display tracking-widest text-text-dim">ĐỘ DÀI NĂM SO VỚI TRÁI ĐẤT</span>
          <span>{{ formatNumber(selectedYearVsEarth, 2) }}x</span>
        </div>
        <div class="h-2 bg-bg-deep">
          <div class="h-full bg-accent-coral" :style="{ width: `${yearComparePercent}%` }" />
        </div>
      </div>
    </div>

    <div class="mt-4 border border-border-default bg-bg-elevated p-4">
      <div class="mb-3 flex items-center gap-2 text-accent-sky">
        <Icon icon="lucide:sun-snow" class="size-4" />
        <span class="font-display text-xs tracking-widest">MÙA MÔ PHỎNG THEO TRỤC NGHIÊNG</span>
      </div>

      <div class="grid gap-2 text-sm">
        <div class="flex items-center justify-between">
          <span class="text-text-secondary">Bắc bán cầu</span>
          <span class="font-semibold">{{ seasonData.northSeason }}</span>
        </div>
        <div class="flex items-center justify-between">
          <span class="text-text-secondary">Nam bán cầu</span>
          <span class="font-semibold">{{ seasonData.southSeason }}</span>
        </div>
        <div class="flex items-center justify-between">
          <span class="text-text-secondary">Độ lệch Mặt Trời giả lập</span>
          <span class="font-semibold">{{ formatNumber(seasonData.subsolarLatitudeDeg, 1) }}°</span>
        </div>
        <div class="flex items-center justify-between">
          <span class="text-text-secondary">Trục nghiêng dùng để hiển thị</span>
          <span class="font-semibold">{{ formatNumber(seasonData.axialTiltShownDeg, 2) }}°</span>
        </div>
      </div>

      <div class="mt-3">
        <div class="mb-1 flex items-center justify-between text-xs">
          <span class="font-display tracking-widest text-text-dim">MỨC CHÊNH BỨC XẠ THEO MÙA</span>
          <span>{{ insolationPercent }}%</span>
        </div>
        <div class="h-2 bg-bg-deep">
          <div class="h-full bg-accent-sky" :style="{ width: `${insolationPercent}%` }" />
        </div>
      </div>

      <p
        v-if="seasonData.retrogradeRotation"
        class="mt-3 text-xs leading-relaxed text-text-secondary"
      >
        Hành tinh này quay nghịch chiều (retrograde), nên cảm nhận mùa được đảo hướng so với phần
        lớn các hành tinh còn lại.
      </p>
    </div>
  </aside>
</template>
