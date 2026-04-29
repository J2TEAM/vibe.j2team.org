<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { computed } from 'vue'
import { useEventListener } from '@vueuse/core'
import type { Match } from '../types'

const props = defineProps<{
  match: Match
}>()

const emit = defineEmits<{
  close: []
}>()

useEventListener('keydown', (e: KeyboardEvent) => {
  if (e.key === 'Escape') emit('close')
})

const detail = computed(() => props.match.detail)

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function formLetterClass(letter: string): string {
  if (letter === 'W') return 'bg-green-500/20 text-green-400'
  if (letter === 'L') return 'bg-red-500/20 text-red-400'
  if (letter === 'D') return 'bg-yellow-500/20 text-yellow-400'
  return 'bg-bg-elevated text-text-dim'
}

function eventIcon(event: {
  isGoal: boolean
  isOwnGoal: boolean
  isRedCard: boolean
  isYellowCard: boolean
  isPenalty: boolean
}): string {
  if (event.isRedCard) return 'lucide:square'
  if (event.isYellowCard) return 'lucide:square'
  if (event.isOwnGoal) return 'lucide:goal'
  if (event.isPenalty) return 'lucide:circle-dot'
  if (event.isGoal) return 'lucide:goal'
  return 'lucide:circle'
}

function eventIconClass(event: {
  isGoal: boolean
  isOwnGoal: boolean
  isRedCard: boolean
  isYellowCard: boolean
}): string {
  if (event.isRedCard) return 'text-red-500'
  if (event.isYellowCard) return 'text-yellow-400'
  if (event.isOwnGoal) return 'text-red-400'
  if (event.isGoal) return 'text-accent-coral'
  return 'text-text-dim'
}

function eventLabel(event: {
  isGoal: boolean
  isOwnGoal: boolean
  isRedCard: boolean
  isYellowCard: boolean
  isPenalty: boolean
  type: string
}): string {
  if (event.isOwnGoal) return 'Phản lưới'
  if (event.isPenalty && event.isGoal) return 'Penalty'
  if (event.isRedCard) return 'Thẻ đỏ'
  if (event.isYellowCard) return 'Thẻ vàng'
  if (event.isGoal) return 'Bàn thắng'
  return event.type
}

const homeEvents = computed(() => {
  if (!detail.value) return []
  return detail.value.events.filter((e) => e.teamId === props.match.homeTeam.id)
})

const awayEvents = computed(() => {
  if (!detail.value) return []
  return detail.value.events.filter((e) => e.teamId === props.match.awayTeam.id)
})

interface StatRow {
  label: string
  home: string
  away: string
}

const statsRows = computed<StatRow[]>(() => {
  const hs = detail.value?.homeDetail.stats
  const as_ = detail.value?.awayDetail.stats
  if (!hs || !as_) return []

  return [
    { label: 'Kiểm soát bóng', home: `${hs.possession}%`, away: `${as_.possession}%` },
    { label: 'Tổng sút', home: hs.shots, away: as_.shots },
    { label: 'Sút trúng đích', home: hs.shotsOnTarget, away: as_.shotsOnTarget },
    { label: 'Phạt góc', home: hs.corners, away: as_.corners },
    { label: 'Phạm lỗi', home: hs.fouls, away: as_.fouls },
  ]
})

function statBarWidth(home: string, away: string): { homeWidth: string; awayWidth: string } {
  const h = parseFloat(home) || 0
  const a = parseFloat(away) || 0
  const total = h + a
  if (total === 0) return { homeWidth: '50%', awayWidth: '50%' }
  return {
    homeWidth: `${Math.round((h / total) * 100)}%`,
    awayWidth: `${Math.round((a / total) * 100)}%`,
  }
}
</script>

<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 pt-16 backdrop-blur-sm"
      @click.self="emit('close')"
    >
      <div class="w-full max-w-lg border border-border-default bg-bg-deep shadow-2xl">
        <!-- Header -->
        <div
          class="flex items-center justify-between border-b border-border-default bg-bg-surface px-5 py-4"
        >
          <div>
            <div class="text-xs text-text-dim">
              {{ formatDate(match.date) }} · {{ formatTime(match.date) }}
            </div>
            <div v-if="detail?.venue" class="mt-0.5 text-xs text-text-dim">
              <Icon icon="lucide:map-pin" class="mr-1 inline size-3" />{{ detail.venue
              }}<template v-if="detail.venueCity">, {{ detail.venueCity }}</template>
              <template v-if="detail.attendance">
                · {{ detail.attendance.toLocaleString('vi-VN') }} khán giả</template
              >
            </div>
          </div>
          <button
            class="flex size-8 items-center justify-center text-text-dim transition hover:text-text-primary"
            @click="emit('close')"
          >
            <Icon icon="lucide:x" class="size-5" />
          </button>
        </div>

        <!-- Scoreboard -->
        <div class="flex items-center gap-4 px-5 py-6">
          <!-- Home -->
          <div class="flex flex-1 flex-col items-center gap-2">
            <img
              v-if="match.homeTeam.logo"
              :src="match.homeTeam.logo"
              :alt="match.homeTeam.shortName"
              class="size-14 object-contain"
            />
            <span class="text-center text-sm font-medium text-text-primary">{{
              match.homeTeam.shortName
            }}</span>
            <!-- Form -->
            <div v-if="detail?.homeDetail.form" class="flex gap-0.5">
              <span
                v-for="(letter, i) in detail.homeDetail.form.split('')"
                :key="i"
                class="flex size-5 items-center justify-center text-[10px] font-bold"
                :class="formLetterClass(letter)"
                >{{ letter }}</span
              >
            </div>
            <div v-if="detail?.homeDetail.record" class="text-[10px] text-text-dim">
              {{ detail.homeDetail.record }}
            </div>
          </div>

          <!-- Score -->
          <div class="text-center">
            <div v-if="match.status.isScheduled" class="text-3xl font-bold text-text-dim">vs</div>
            <div v-else class="flex items-center gap-3">
              <span class="text-4xl font-bold tabular-nums text-text-primary">{{
                match.homeScore
              }}</span>
              <span class="text-xl text-text-dim">-</span>
              <span class="text-4xl font-bold tabular-nums text-text-primary">{{
                match.awayScore
              }}</span>
            </div>
            <div
              class="mt-1 text-xs font-semibold uppercase"
              :class="
                match.status.isInProgress
                  ? 'text-green-400'
                  : match.status.isCompleted
                    ? 'text-text-dim'
                    : 'text-accent-amber'
              "
            >
              {{
                match.status.isCompleted
                  ? 'Kết thúc'
                  : match.status.isInProgress
                    ? match.status.displayClock || 'Đang diễn ra'
                    : formatTime(match.date)
              }}
            </div>
          </div>

          <!-- Away -->
          <div class="flex flex-1 flex-col items-center gap-2">
            <img
              v-if="match.awayTeam.logo"
              :src="match.awayTeam.logo"
              :alt="match.awayTeam.shortName"
              class="size-14 object-contain"
            />
            <span class="text-center text-sm font-medium text-text-primary">{{
              match.awayTeam.shortName
            }}</span>
            <div v-if="detail?.awayDetail.form" class="flex gap-0.5">
              <span
                v-for="(letter, i) in detail.awayDetail.form.split('')"
                :key="i"
                class="flex size-5 items-center justify-center text-[10px] font-bold"
                :class="formLetterClass(letter)"
                >{{ letter }}</span
              >
            </div>
            <div v-if="detail?.awayDetail.record" class="text-[10px] text-text-dim">
              {{ detail.awayDetail.record }}
            </div>
          </div>
        </div>

        <!-- Headline -->
        <div v-if="detail?.headline" class="border-t border-border-default px-5 py-3">
          <p class="text-sm font-medium text-accent-amber">{{ detail.headline }}</p>
          <p
            v-if="detail.headlineDescription"
            class="mt-1 line-clamp-3 text-xs text-text-secondary"
          >
            {{ detail.headlineDescription }}
          </p>
        </div>

        <!-- Match Events (goals, cards) -->
        <div
          v-if="detail && detail.events.length > 0"
          class="border-t border-border-default px-5 py-4"
        >
          <h3
            class="mb-3 font-display text-xs font-semibold tracking-wide text-text-secondary uppercase"
          >
            Diễn biến trận đấu
          </h3>

          <div class="space-y-2">
            <!-- Home events -->
            <div
              v-for="event in homeEvents"
              :key="`h-${event.minute}-${event.playerName}`"
              class="flex items-center gap-2"
            >
              <Icon :icon="eventIcon(event)" class="size-3.5" :class="eventIconClass(event)" />
              <span class="text-xs font-medium text-text-primary">{{ event.playerName }}</span>
              <span class="text-[10px] text-text-dim">{{ eventLabel(event) }}</span>
              <span class="ml-auto text-xs font-semibold tabular-nums text-text-dim">{{
                event.minute
              }}</span>
            </div>

            <div
              v-if="homeEvents.length > 0 && awayEvents.length > 0"
              class="border-t border-border-default/50"
            />

            <!-- Away events -->
            <div
              v-for="event in awayEvents"
              :key="`a-${event.minute}-${event.playerName}`"
              class="flex items-center gap-2"
            >
              <Icon :icon="eventIcon(event)" class="size-3.5" :class="eventIconClass(event)" />
              <span class="text-xs font-medium text-text-primary">{{ event.playerName }}</span>
              <span class="text-[10px] text-text-dim">{{ eventLabel(event) }}</span>
              <span class="ml-auto text-xs font-semibold tabular-nums text-text-dim">{{
                event.minute
              }}</span>
            </div>
          </div>
        </div>

        <!-- Statistics -->
        <div v-if="statsRows.length > 0" class="border-t border-border-default px-5 py-4">
          <h3
            class="mb-3 font-display text-xs font-semibold tracking-wide text-text-secondary uppercase"
          >
            Thống kê
          </h3>

          <div class="space-y-3">
            <div v-for="row in statsRows" :key="row.label">
              <div class="mb-1 flex items-center justify-between text-xs">
                <span class="font-medium tabular-nums text-text-primary">{{ row.home }}</span>
                <span class="text-text-dim">{{ row.label }}</span>
                <span class="font-medium tabular-nums text-text-primary">{{ row.away }}</span>
              </div>
              <div class="flex h-1.5 overflow-hidden bg-bg-elevated">
                <div
                  class="bg-accent-coral/70 transition-all duration-500"
                  :style="{ width: statBarWidth(row.home, row.away).homeWidth }"
                />
                <div
                  class="bg-accent-sky/70 transition-all duration-500"
                  :style="{ width: statBarWidth(row.home, row.away).awayWidth }"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- No detail fallback -->
        <div v-if="!detail" class="border-t border-border-default px-5 py-8 text-center">
          <Icon icon="lucide:info" class="mx-auto mb-2 size-6 text-text-dim" />
          <p class="text-xs text-text-dim">Chưa có thông tin chi tiết cho trận đấu này</p>
        </div>
      </div>
    </div>
  </Teleport>
</template>
