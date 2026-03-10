<script setup lang="ts">
// Trang chính Corner: layout grid với TeamSelector + các chart/table H2H
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
        </div>
        <!-- Cột phải: summary + probability -->
        <div class="flex flex-col gap-4 sm:gap-5">
          <CornerSummaryCard />
          <ProbabilityByThresholdCard />
        </div>
      </div>
    </section>

    <!-- Row 2: Team stats (chỉ hiện khi đã chọn đủ) -->
    <section v-if="hasFullSelection" class="animate-fade-up animate-delay-4 mt-5">
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
    <section v-if="hasFullSelection" class="animate-fade-up animate-delay-5 mt-5">
      <div class="grid gap-5 sm:grid-cols-2">
        <CornerHistoryCard />
        <OverRatesComparisonCard />
      </div>
    </section>

    <!-- Row 4: H2H Total Corners + H2H Table -->
    <section v-if="hasFullSelection" class="animate-fade-up animate-delay-6 mt-5">
      <div class="grid gap-5 sm:grid-cols-2">
        <H2HTotalCornersCard />
        <H2HMatchesTable />
      </div>
    </section>
  </CornerLayoutShell>
</template>
