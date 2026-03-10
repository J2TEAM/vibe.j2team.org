<script setup lang="ts">
// Trang chính Corner: layout grid với TeamSelector + nút Predict + các chart/table H2H
import { Icon } from '@iconify/vue'
import { storeToRefs } from 'pinia'
import CornerLayoutShell from './components/CornerLayoutShell.vue'
import TeamSelector from './components/TeamSelector.vue'
import CornerSummaryCard from './components/CornerSummaryCard.vue'
import ProbabilityByThresholdCard from './components/ProbabilityByThresholdCard.vue'
import TeamCornerSummary from './components/TeamCornerSummary.vue'
import CornerHistoryCard from './components/CornerHistoryCard.vue'
import OverRatesComparisonCard from './components/OverRatesComparisonCard.vue'
import H2HTotalCornersCard from './components/H2HTotalCornersCard.vue'
import H2HMatchesTable from './components/H2HMatchesTable.vue'
import { useCornerStore } from './store/useCornerStore'

const store = useCornerStore()
const {
  hasFullSelection,
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
    <!-- Row 1: TeamSelector + Summary + Probability -->
    <section class="animate-fade-up animate-delay-3">
      <div class="grid gap-5 lg:grid-cols-[1.1fr_2fr]">
        <!-- Cột trái: chọn đội -->
        <div>
          <TeamSelector />

          <!-- Nút Predict -->
          <button
            v-if="hasFullSelection"
            :disabled="isPredicting"
            class="mt-4 w-full border border-accent-coral bg-accent-coral/10 text-accent-coral font-display font-semibold text-sm tracking-wider uppercase px-5 py-3 transition-all duration-300 hover:bg-accent-coral hover:text-bg-deep disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            @click="store.predict()"
          >
            <template v-if="isPredicting">
              <!-- Hiệu ứng loading: spinner -->
              <svg
                class="animate-spin size-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                />
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              <span>Đang phân tích dữ liệu...</span>
            </template>
            <template v-else>
              <Icon icon="lucide:brain" class="size-4" />
              <span>Dự đoán</span>
            </template>
          </button>
        </div>

        <!-- Cột phải: summary + probability -->
        <div class="flex flex-col gap-4 sm:gap-5">
          <CornerSummaryCard />
          <ProbabilityByThresholdCard />
        </div>
      </div>
    </section>

    <!-- Hiệu ứng đang dự đoán (scan bar) -->
    <section
      v-if="isPredicting"
      class="mt-5 border border-accent-coral/30 bg-bg-surface p-6 sm:p-8 flex flex-col items-center gap-4"
    >
      <!-- Pulse dots -->
      <div class="flex gap-2">
        <span class="size-2.5 bg-accent-coral rounded-full animate-pulse" />
        <span
          class="size-2.5 bg-accent-coral rounded-full animate-pulse"
          style="animation-delay: 0.2s"
        />
        <span
          class="size-2.5 bg-accent-coral rounded-full animate-pulse"
          style="animation-delay: 0.4s"
        />
      </div>
      <div class="text-center">
        <p class="font-display text-lg text-accent-coral font-semibold">
          Đang phân tích mô hình...
        </p>
        <p class="mt-1 text-text-dim text-xs">
          Tổng hợp dữ liệu đối đầu, thống kê rolling, over rates
        </p>
      </div>
      <!-- Progress bar giả -->
      <div class="w-full max-w-xs h-1 bg-bg-elevated overflow-hidden">
        <div class="h-full bg-accent-coral animate-progress-bar" />
      </div>
    </section>

    <!-- Kết quả (chỉ hiện sau khi predict xong) -->
    <template v-if="showResults">
      <!-- Row 2: Team stats -->
      <section class="animate-fade-up mt-5">
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

      <!-- Row 3: Corner History + Over Rates -->
      <section class="animate-fade-up mt-5" style="animation-delay: 100ms">
        <div class="grid gap-5 sm:grid-cols-2">
          <CornerHistoryCard />
          <OverRatesComparisonCard />
        </div>
      </section>

      <!-- Row 4: H2H Total Corners + H2H Table -->
      <section class="animate-fade-up mt-5" style="animation-delay: 200ms">
        <div class="grid gap-5 sm:grid-cols-2">
          <H2HTotalCornersCard />
          <H2HMatchesTable />
        </div>
      </section>
    </template>
  </CornerLayoutShell>
</template>
