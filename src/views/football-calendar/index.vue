<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'

import type { UpcomingPeriod, Match } from './types'
import DateNavigator from './components/DateNavigator.vue'
import LeagueFilter from './components/LeagueFilter.vue'
import MatchCard from './components/MatchCard.vue'
import MatchDetailModal from './components/MatchDetailModal.vue'
import { useFootballCalendar } from './composables/useFootballCalendar'

const {
  viewMode,
  upcomingPeriod,
  selectedDate,
  selectedLeagues,
  allLeagues,
  nationalLeagues,
  internationalLeagues,
  hotSlugsSet,
  leagueMatches,
  totalMatches,
  filteredUpcomingDays,
  totalUpcomingMatches,
  periodLabel,
  loading,
  loadingUpcoming,
  error,
  initLeagues,
  fetchAll,
  setViewMode,
  setPeriod,
  goToPrevDay,
  goToNextDay,
  goToToday,
  goToDate,
  toggleLeague,
  selectGroup,
  deselectGroup,
} = useFootballCalendar()

const periods: { id: UpcomingPeriod; label: string; icon: string }[] = [
  { id: 'week', label: '7 ngày', icon: 'lucide:calendar-range' },
  { id: 'month', label: 'Tháng này', icon: 'lucide:calendar' },
  { id: 'year', label: 'Năm nay', icon: 'lucide:calendar-fold' },
]

const selectedMatch = ref<Match | null>(null)

function openMatch(match: Match) {
  selectedMatch.value = match
}

function closeMatch() {
  selectedMatch.value = null
}

onMounted(async () => {
  await initLeagues()
  fetchAll()
})
</script>

<template>
  <div class="min-h-screen bg-bg-deep">
    <div class="mx-auto max-w-5xl px-6 py-8">
      <!-- Back -->
      <RouterLink
        to="/"
        class="animate-fade-up mb-8 inline-flex items-center gap-2 border border-border-default bg-bg-surface px-5 py-2.5 text-sm text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
      >
        ← Trang chủ
      </RouterLink>

      <!-- Header -->
      <div class="animate-fade-up animate-delay-1 mb-8">
        <div class="mb-2 flex items-center gap-3">
          <Icon icon="lucide:calendar" class="size-8 text-accent-coral" />
          <h1 class="font-display text-3xl font-bold text-text-primary md:text-4xl">
            Lịch Bóng Đá
          </h1>
        </div>
        <p class="text-text-secondary">Theo dõi lịch thi đấu các giải bóng đá hàng đầu thế giới</p>
        <div class="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-dim">
          <span class="flex items-center gap-1">
            <Icon icon="lucide:database" class="size-3.5" />
            Dữ liệu từ ESPN Public API
          </span>
          <span class="flex items-center gap-1">
            <Icon icon="lucide:zap" class="size-3.5" />
            Cập nhật realtime, không cần API key
          </span>
          <span class="flex items-center gap-1">
            <Icon icon="lucide:trophy" class="size-3.5" />
            {{ allLeagues.length }} giải đấu · Tự động cập nhật giải mới
          </span>
        </div>
      </div>

      <!-- View mode tabs -->
      <div
        class="animate-fade-up animate-delay-2 mb-4 flex gap-1 border border-border-default bg-bg-surface p-1"
      >
        <button
          class="flex flex-1 items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium transition"
          :class="
            viewMode === 'upcoming'
              ? 'bg-accent-coral text-white'
              : 'text-text-secondary hover:text-text-primary'
          "
          @click="setViewMode('upcoming')"
        >
          <Icon icon="lucide:calendar-clock" class="size-4" />
          Sắp tới
        </button>
        <button
          class="flex flex-1 items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium transition"
          :class="
            viewMode === 'daily'
              ? 'bg-accent-coral text-white'
              : 'text-text-secondary hover:text-text-primary'
          "
          @click="setViewMode('daily')"
        >
          <Icon icon="lucide:calendar-days" class="size-4" />
          Theo ngày
        </button>
      </div>

      <!-- Period selector (upcoming mode only) -->
      <div v-if="viewMode === 'upcoming'" class="animate-fade-up animate-delay-2 mb-4 flex gap-2">
        <button
          v-for="p in periods"
          :key="p.id"
          class="flex items-center gap-1.5 border px-3.5 py-2 text-xs font-medium transition"
          :class="
            upcomingPeriod === p.id
              ? 'border-accent-amber/50 bg-accent-amber/10 text-accent-amber'
              : 'border-border-default text-text-dim hover:text-text-secondary'
          "
          @click="setPeriod(p.id)"
        >
          <Icon :icon="p.icon" class="size-3.5" />
          {{ p.label }}
        </button>
      </div>

      <!-- Controls -->
      <div
        class="animate-fade-up animate-delay-2 relative z-20 mb-6 grid gap-4"
        :class="viewMode === 'daily' ? 'lg:grid-cols-[1fr_280px]' : ''"
      >
        <LeagueFilter
          :national-leagues="nationalLeagues"
          :international-leagues="internationalLeagues"
          :selected-leagues="selectedLeagues"
          :hot-slugs="hotSlugsSet"
          @toggle="toggleLeague"
          @select-group="selectGroup"
          @deselect-group="deselectGroup"
        />
        <DateNavigator
          v-if="viewMode === 'daily'"
          :selected-date="selectedDate"
          @prev="goToPrevDay"
          @next="goToNextDay"
          @today="goToToday"
          @select-date="goToDate"
        />
      </div>

      <!-- ===== UPCOMING VIEW ===== -->
      <template v-if="viewMode === 'upcoming'">
        <!-- Loading -->
        <div v-if="loadingUpcoming" class="flex flex-col items-center gap-4 py-20">
          <Icon icon="lucide:loader-2" class="size-8 animate-spin text-accent-coral" />
          <span class="text-sm text-text-secondary">Đang tải lịch {{ periodLabel }}...</span>
        </div>

        <!-- Error -->
        <div v-else-if="error" class="animate-fade-up flex flex-col items-center gap-3 py-20">
          <Icon icon="lucide:wifi-off" class="size-10 text-accent-coral" />
          <p class="text-text-secondary">{{ error }}</p>
          <button
            class="border border-accent-coral px-5 py-2 text-sm text-accent-coral transition hover:bg-accent-coral hover:text-white"
            @click="fetchAll"
          >
            Thử lại
          </button>
        </div>

        <!-- No matches -->
        <div
          v-else-if="totalUpcomingMatches === 0"
          class="animate-fade-up flex flex-col items-center gap-3 py-20"
        >
          <Icon icon="lucide:calendar-x" class="size-10 text-text-dim" />
          <p class="text-text-secondary">Không tìm thấy trận đấu nào {{ periodLabel }}</p>
        </div>

        <!-- Upcoming days -->
        <div v-else class="animate-fade-up animate-delay-3 space-y-8">
          <div class="text-sm text-text-dim">
            {{ totalUpcomingMatches }} trận đấu {{ periodLabel }}
          </div>

          <div v-for="day in filteredUpcomingDays" :key="day.dateLabel" class="space-y-4">
            <!-- Day header -->
            <div
              class="sticky top-0 z-10 flex items-center justify-between border-b border-accent-coral/30 bg-bg-deep pb-2 pt-1"
            >
              <h2 class="font-display text-base font-semibold capitalize text-accent-coral">
                {{ day.dateLabel }}
              </h2>
              <span class="text-xs text-text-dim">{{ day.totalMatches }} trận</span>
            </div>

            <!-- League sections in day -->
            <div
              v-for="lm in day.leagueMatches"
              :key="`${day.dateLabel}-${lm.league.id}`"
              class="space-y-3"
            >
              <!-- League header -->
              <div class="flex items-center gap-2.5">
                <img
                  v-if="lm.league.logo"
                  :src="lm.league.logo"
                  :alt="lm.league.nameVi"
                  class="size-5 object-contain"
                  loading="lazy"
                />
                <Icon v-else icon="lucide:trophy" class="size-4 text-accent-amber" />
                <h3 class="text-sm font-medium text-text-primary">
                  {{ lm.league.nameVi }}
                </h3>
                <span v-if="lm.league.country" class="text-xs text-text-dim">
                  {{ lm.league.country }}
                </span>
              </div>

              <!-- Matches -->
              <div class="grid gap-3 sm:grid-cols-2">
                <MatchCard
                  v-for="match in lm.matches"
                  :key="match.id"
                  :match="match"
                  @select="openMatch"
                />
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- ===== DAILY VIEW ===== -->
      <template v-else>
        <!-- Loading -->
        <div v-if="loading" class="flex flex-col items-center gap-4 py-20">
          <Icon icon="lucide:loader-2" class="size-8 animate-spin text-accent-coral" />
          <span class="text-sm text-text-secondary">Đang tải lịch thi đấu...</span>
        </div>

        <!-- Error -->
        <div v-else-if="error" class="animate-fade-up flex flex-col items-center gap-3 py-20">
          <Icon icon="lucide:wifi-off" class="size-10 text-accent-coral" />
          <p class="text-text-secondary">{{ error }}</p>
          <button
            class="border border-accent-coral px-5 py-2 text-sm text-accent-coral transition hover:bg-accent-coral hover:text-white"
            @click="fetchAll"
          >
            Thử lại
          </button>
        </div>

        <!-- No matches -->
        <div
          v-else-if="totalMatches === 0"
          class="animate-fade-up flex flex-col items-center gap-3 py-20"
        >
          <Icon icon="lucide:calendar-x" class="size-10 text-text-dim" />
          <p class="text-text-secondary">Không có trận đấu nào trong ngày này</p>
          <div class="flex gap-3">
            <button
              class="border border-border-default px-5 py-2 text-sm text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
              @click="goToToday"
            >
              Về hôm nay
            </button>
            <button
              class="border border-accent-coral px-5 py-2 text-sm text-accent-coral transition hover:bg-accent-coral hover:text-white"
              @click="setViewMode('upcoming')"
            >
              Xem sắp tới
            </button>
          </div>
        </div>

        <!-- Match list -->
        <div v-else class="animate-fade-up animate-delay-3 space-y-6">
          <!-- Summary -->
          <div class="text-sm text-text-dim">
            {{ totalMatches }} trận đấu từ {{ leagueMatches.length }} giải
          </div>

          <!-- League sections -->
          <div v-for="lm in leagueMatches" :key="lm.league.id" class="space-y-3">
            <!-- League header -->
            <div class="flex items-center gap-2.5 border-b border-border-default pb-2">
              <img
                v-if="lm.league.logo"
                :src="lm.league.logo"
                :alt="lm.league.nameVi"
                class="size-6 object-contain"
                loading="lazy"
              />
              <Icon v-else icon="lucide:trophy" class="size-5 text-accent-amber" />
              <h2 class="font-display text-lg font-semibold text-text-primary">
                {{ lm.league.nameVi }}
              </h2>
              <span v-if="lm.league.country" class="text-xs text-text-dim">
                {{ lm.league.country }}
              </span>
              <span class="ml-auto text-xs text-text-dim"> {{ lm.matches.length }} trận </span>
            </div>

            <!-- Matches -->
            <div class="grid gap-3 sm:grid-cols-2">
              <MatchCard v-for="match in lm.matches" :key="match.id" :match="match" />
            </div>
          </div>
        </div>
      </template>

      <!-- Footer -->
      <footer
        class="mt-10 flex flex-wrap items-center justify-between gap-2 border-t border-border-default pt-4 text-xs text-text-dim"
      >
        <span>Được tạo bởi <span class="font-semibold text-text-primary">Hachi Tu</span></span>
        <div class="flex gap-3">
          <a
            href="https://github.com/hachitubg"
            target="_blank"
            rel="noopener noreferrer"
            class="flex items-center gap-1 transition-colors hover:text-accent-coral"
          >
            <Icon icon="lucide:github" class="size-3.5" /> GitHub
          </a>
          <a
            href="https://www.facebook.com/tuhachiz/"
            target="_blank"
            rel="noopener noreferrer"
            class="flex items-center gap-1 transition-colors hover:text-accent-coral"
          >
            <Icon icon="lucide:facebook" class="size-3.5" /> Facebook
          </a>
        </div>
      </footer>
    </div>

    <!-- Match Detail Modal -->
    <MatchDetailModal v-if="selectedMatch" :match="selectedMatch" @close="closeMatch" />
  </div>
</template>
