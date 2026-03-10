<script setup lang="ts">
// Trang chính Corner: Selector CTA → Summary Card → Chi tiết H2H
import { storeToRefs } from 'pinia'
import CornerLayoutShell from './components/CornerLayoutShell.vue'
import TeamSelector from './components/TeamSelector.vue'
import CornerSummaryCard from './components/CornerSummaryCard.vue'
import TeamCornerSummary from './components/TeamCornerSummary.vue'
import CornerHistoryCard from './components/CornerHistoryCard.vue'
import OverRatesComparisonCard from './components/OverRatesComparisonCard.vue'
import H2HTotalCornersCard from './components/H2HTotalCornersCard.vue'
import H2HMatchesTable from './components/H2HMatchesTable.vue'
import { useCornerStore } from './store/useCornerStore'

const store = useCornerStore()
const {
  isPredicting,
  showResults,
  selectedHomeTeam,
  selectedAwayTeam,
  selectedHomeStats,
  selectedAwayStats,
} = storeToRefs(store)
</script>

<template>
  <CornerLayoutShell>
    <!-- ROW 1: Selector CTA (chọn đội + nút Predict) -->
    <section class="animate-fade-up animate-delay-3">
      <TeamSelector />
    </section>

    <!-- Hiệu ứng đang dự đoán -->
    <section
      v-if="isPredicting"
      class="mt-5 border border-accent-sky/30 bg-bg-surface p-6 sm:p-8 flex flex-col items-center gap-4"
    >
      <div class="flex gap-2">
        <span class="size-2.5 bg-accent-sky rounded-full animate-pulse" />
        <span
          class="size-2.5 bg-accent-sky rounded-full animate-pulse"
          style="animation-delay: 0.2s"
        />
        <span
          class="size-2.5 bg-accent-sky rounded-full animate-pulse"
          style="animation-delay: 0.4s"
        />
      </div>
      <div class="text-center">
        <p class="font-display text-lg text-accent-sky font-semibold">Đang phân tích mô hình...</p>
        <p class="mt-1 text-text-dim text-xs">
          Tổng hợp dữ liệu đối đầu, thống kê rolling, xác suất over/under
        </p>
      </div>
      <div class="w-full max-w-xs h-1 bg-bg-elevated overflow-hidden">
        <div class="h-full bg-accent-sky animate-progress-bar" />
      </div>
    </section>

    <!-- Kết quả (chỉ hiện sau predict) -->
    <template v-if="showResults">
      <!-- ROW 2: Summary Card (tên đội lớn + O/U cards + statistics) -->
      <section class="animate-fade-up mt-5">
        <CornerSummaryCard />
      </section>

      <!-- ROW 3: Team stats -->
      <section class="animate-fade-up mt-5" style="animation-delay: 100ms">
        <div class="grid gap-5 sm:grid-cols-2">
          <TeamCornerSummary
            v-if="selectedHomeTeam && selectedHomeStats"
            :team="selectedHomeTeam"
            :stats="selectedHomeStats"
            side="HOME"
          />
          <TeamCornerSummary
            v-if="selectedAwayTeam && selectedAwayStats"
            :team="selectedAwayTeam"
            :stats="selectedAwayStats"
            side="AWAY"
          />
        </div>
      </section>

      <!-- ROW 4: Corner History + Over Rates -->
      <section class="animate-fade-up mt-5" style="animation-delay: 200ms">
        <div class="grid gap-5 sm:grid-cols-2">
          <CornerHistoryCard />
          <OverRatesComparisonCard />
        </div>
      </section>

      <!-- ROW 5: H2H Total Corners + H2H Table -->
      <section class="animate-fade-up mt-5" style="animation-delay: 300ms">
        <div class="grid gap-5 sm:grid-cols-2">
          <H2HTotalCornersCard />
          <H2HMatchesTable />
        </div>
      </section>
    </template>
  </CornerLayoutShell>
</template>
