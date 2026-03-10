<script setup lang="ts">
// Card tổng quan H2H: summary, model info
import { Icon } from '@iconify/vue'
import { storeToRefs } from 'pinia'
import { useCornerStore } from '../store/useCornerStore'

const store = useCornerStore()
const { selectedHomeTeam, selectedAwayTeam, h2hSummary, h2hForSelection, modelInfo } =
  storeToRefs(store)
</script>

<template>
  <section
    class="relative border border-border-default bg-bg-surface p-4 sm:p-5 overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-accent-coral hover:bg-bg-elevated hover:shadow-lg hover:shadow-accent-coral/5"
  >
    <!-- Background number -->
    <span
      class="absolute top-3 right-4 font-display text-5xl sm:text-6xl font-bold text-accent-amber/5 select-none pointer-events-none"
    >
      01
    </span>

    <h2 class="font-display text-lg font-semibold text-text-primary mb-3 flex items-center gap-2">
      <span class="text-accent-amber font-display text-sm tracking-widest">//</span>
      Tổng quan đối đầu
    </h2>

    <!-- Chưa chọn đủ đội -->
    <div v-if="!selectedHomeTeam || !selectedAwayTeam" class="text-text-dim text-sm">
      Chọn hai đội ở danh sách bên trái để xem thống kê đối đầu phạt góc.
    </div>

    <!-- Đã chọn nhưng không có H2H -->
    <div v-else-if="!h2hForSelection" class="text-text-dim text-sm flex items-center gap-2">
      <Icon icon="lucide:alert-circle" class="size-4 text-accent-amber" />
      <span>
        Chưa có đủ dữ liệu đối đầu cho
        <span class="text-text-primary">{{ selectedHomeTeam.name }}</span>
        vs
        <span class="text-text-primary">{{ selectedAwayTeam.name }}</span
        >.
      </span>
    </div>

    <!-- Hiển thị summary H2H -->
    <div v-else class="relative space-y-3 text-sm">
      <!-- Tiêu đề cặp đội -->
      <div class="flex flex-wrap items-center gap-2">
        <div class="font-display text-base sm:text-lg">
          {{ selectedHomeTeam.name }}
          <span class="text-text-dim text-xs sm:text-sm mx-1">vs</span>
          {{ selectedAwayTeam.name }}
        </div>
      </div>

      <!-- Summary stats -->
      <div v-if="h2hSummary" class="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div class="border border-border-default bg-bg-elevated p-2.5">
          <div class="text-[11px] text-text-dim mb-0.5">Avg Total Corners</div>
          <div class="font-mono text-sm text-accent-coral">
            {{ h2hSummary.avgTotalCorners.toFixed(1) }}
          </div>
        </div>
        <div class="border border-border-default bg-bg-elevated p-2.5">
          <div class="text-[11px] text-text-dim mb-0.5">Home nhiều hơn</div>
          <div class="font-display text-sm text-accent-coral">
            {{ h2hSummary.homeMoreCorners }}
          </div>
        </div>
        <div class="border border-border-default bg-bg-elevated p-2.5">
          <div class="text-[11px] text-text-dim mb-0.5">Away nhiều hơn</div>
          <div class="font-display text-sm text-accent-amber">
            {{ h2hSummary.awayMoreCorners }}
          </div>
        </div>
        <div class="border border-border-default bg-bg-elevated p-2.5">
          <div class="text-[11px] text-text-dim mb-0.5">Bằng nhau</div>
          <div class="font-display text-sm text-text-secondary">
            {{ h2hSummary.equalCorners }}
          </div>
        </div>
      </div>

      <!-- Model info -->
      <div
        v-if="modelInfo"
        class="pt-2 border-t border-border-default text-[11px] text-text-dim flex flex-wrap gap-x-4 gap-y-1"
      >
        <span class="inline-flex items-center gap-1">
          <Icon icon="lucide:cpu" class="size-3" />
          {{ modelInfo.type }}
        </span>
        <span class="inline-flex items-center gap-1">
          <Icon icon="lucide:layers" class="size-3" />
          {{ modelInfo.features }} features · window {{ modelInfo.window }}
        </span>
        <span class="inline-flex items-center gap-1">
          <Icon icon="lucide:activity" class="size-3" />
          RMSE {{ modelInfo.rmse }}
        </span>
      </div>
    </div>
  </section>
</template>
