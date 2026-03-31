<script setup lang="ts">
import { Icon } from '@iconify/vue'
import type { Match } from '../types'

defineProps<{
  match: Match
}>()

const emit = defineEmits<{
  select: [match: Match]
}>()

function formatTime(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
}

function statusLabel(match: Match): string {
  if (match.status.isCompleted) return 'Kết thúc'
  if (match.status.isInProgress) return match.status.displayClock || 'Đang diễn ra'
  return formatTime(match.date)
}

function statusClass(match: Match): string {
  if (match.status.isInProgress) return 'text-green-400 animate-pulse'
  if (match.status.isCompleted) return 'text-text-dim'
  return 'text-accent-amber'
}

function hasGoalEvents(match: Match): boolean {
  return match.detail?.events.some((e) => e.isGoal) ?? false
}
</script>

<template>
  <button
    class="group cursor-pointer border border-border-default bg-bg-surface p-4 text-left transition-all duration-300 hover:-translate-y-0.5 hover:border-accent-coral/50 hover:bg-bg-elevated"
    @click="emit('select', match)"
  >
    <!-- Status -->
    <div class="mb-3 flex items-center justify-between">
      <span :class="statusClass(match)" class="text-xs font-semibold tracking-wide uppercase">
        {{ statusLabel(match) }}
      </span>
      <div class="flex items-center gap-1.5">
        <span v-if="match.venue" class="hidden max-w-30 truncate text-xs text-text-dim sm:inline">
          {{ match.venue }}
        </span>
        <Icon
          icon="lucide:chevron-right"
          class="size-3.5 text-text-dim transition-transform group-hover:translate-x-0.5 group-hover:text-accent-coral"
        />
      </div>
    </div>

    <!-- Teams -->
    <div class="flex items-center gap-3">
      <!-- Home team -->
      <div class="flex flex-1 items-center gap-2.5">
        <img
          v-if="match.homeTeam.logo"
          :src="match.homeTeam.logo"
          :alt="match.homeTeam.shortName"
          class="size-7 object-contain"
          loading="lazy"
        />
        <div
          v-else
          class="flex size-7 items-center justify-center bg-bg-elevated text-[10px] text-text-dim"
        >
          {{ match.homeTeam.abbreviation }}
        </div>
        <span
          class="flex-1 truncate text-sm font-medium"
          :class="
            match.status.isCompleted && match.homeScore > match.awayScore
              ? 'text-text-primary'
              : 'text-text-secondary'
          "
        >
          {{ match.homeTeam.shortName }}
        </span>
      </div>

      <!-- Score -->
      <div class="flex min-w-[64px] items-center justify-center gap-1.5 text-center">
        <template v-if="match.status.isScheduled">
          <span class="text-lg font-bold text-text-dim">vs</span>
        </template>
        <template v-else>
          <span
            class="text-lg font-bold tabular-nums"
            :class="
              match.homeScore >= match.awayScore ? 'text-text-primary' : 'text-text-secondary'
            "
          >
            {{ match.homeScore }}
          </span>
          <span class="text-text-dim">-</span>
          <span
            class="text-lg font-bold tabular-nums"
            :class="
              match.awayScore >= match.homeScore ? 'text-text-primary' : 'text-text-secondary'
            "
          >
            {{ match.awayScore }}
          </span>
        </template>
      </div>

      <!-- Away team -->
      <div class="flex flex-1 flex-row-reverse items-center gap-2.5">
        <img
          v-if="match.awayTeam.logo"
          :src="match.awayTeam.logo"
          :alt="match.awayTeam.shortName"
          class="size-7 object-contain"
          loading="lazy"
        />
        <div
          v-else
          class="flex size-7 items-center justify-center bg-bg-elevated text-[10px] text-text-dim"
        >
          {{ match.awayTeam.abbreviation }}
        </div>
        <span
          class="flex-1 truncate text-right text-sm font-medium"
          :class="
            match.status.isCompleted && match.awayScore > match.homeScore
              ? 'text-text-primary'
              : 'text-text-secondary'
          "
        >
          {{ match.awayTeam.shortName }}
        </span>
      </div>
    </div>

    <!-- Quick goal scorers preview -->
    <div
      v-if="hasGoalEvents(match) && match.detail"
      class="mt-2.5 flex gap-3 border-t border-border-default/50 pt-2"
    >
      <div class="flex-1 space-y-0.5">
        <div
          v-for="event in match.detail.events.filter(
            (e) => e.isGoal && e.teamId === match.homeTeam.id,
          )"
          :key="`${event.minute}-${event.playerName}`"
          class="flex items-center gap-1 text-[10px] text-text-dim"
        >
          <Icon icon="lucide:goal" class="size-2.5 text-accent-coral" />
          <span class="truncate">{{ event.playerName }}</span>
          <span class="tabular-nums">{{ event.minute }}</span>
        </div>
      </div>
      <div class="flex-1 space-y-0.5">
        <div
          v-for="event in match.detail.events.filter(
            (e) => e.isGoal && e.teamId === match.awayTeam.id,
          )"
          :key="`${event.minute}-${event.playerName}`"
          class="flex items-center justify-end gap-1 text-[10px] text-text-dim"
        >
          <span class="tabular-nums">{{ event.minute }}</span>
          <span class="truncate text-right">{{ event.playerName }}</span>
          <Icon icon="lucide:goal" class="size-2.5 text-accent-coral" />
        </div>
      </div>
    </div>
  </button>
</template>
