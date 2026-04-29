<script setup lang="ts">
import type { TurnHistoryEntry } from '../types'
import { useI18n } from '../composables/useI18n'
import { Icon } from '@iconify/vue'
import { TRACK_LUCIDE, EVENT_LUCIDE } from '../constants/icons'

defineProps<{
  history: TurnHistoryEntry[]
}>()

const { t, locale } = useI18n()

const STAT_CONFIG = [
  { key: 'nature' as const, color: '#4ADE80', icon: TRACK_LUCIDE.nature },
  { key: 'human' as const, color: '#FFB830', icon: TRACK_LUCIDE.human },
  { key: 'economy' as const, color: '#FF6B4A', icon: TRACK_LUCIDE.economy },
  { key: 'digital' as const, color: '#38BDF8', icon: TRACK_LUCIDE.digital },
]
</script>

<template>
  <div v-if="history.length > 0" class="px-4 py-3 border-t border-border-default">
    <p class="text-xs text-text-dim uppercase tracking-widest font-display mb-3">
      // {{ locale === 'vi' ? 'Lịch Sử' : 'Turn Log' }}
    </p>

    <!-- Entries newest-first -->
    <div class="space-y-3">
      <div
        v-for="entry in [...history].reverse()"
        :key="entry.turn"
        class="border border-border-default bg-bg-surface/60 rounded p-2.5 space-y-2"
      >
        <!-- Turn label -->
        <div class="flex items-center justify-between">
          <span class="text-xs text-text-dim font-display uppercase tracking-wide">
            {{ locale === 'vi' ? 'Lượt' : 'Turn' }} {{ entry.turn }}
          </span>
          <span class="text-xs text-text-dim">
            {{ locale === 'vi' ? 'Năm' : 'Yr' }} {{ entry.year }}
          </span>
        </div>

        <!-- Events this turn -->
        <div v-if="entry.events.length" class="flex flex-wrap gap-1">
          <span
            v-for="(ev, i) in entry.events"
            :key="i"
            class="text-xs px-1.5 py-0.5 rounded flex items-center gap-1"
            :class="
              ev.type === 'opportunity'
                ? 'bg-accent-sky/10 text-accent-sky'
                : 'bg-accent-coral/10 text-accent-coral'
            "
          >
            <Icon :icon="EVENT_LUCIDE[ev.type]" class="w-3 h-3" /> {{ t(ev.title) }}
          </span>
        </div>

        <!-- Cards played -->
        <div class="flex flex-wrap gap-1">
          <span
            v-for="(name, i) in entry.cardNames"
            :key="i"
            class="text-xs px-1.5 py-0.5 bg-bg-elevated text-text-secondary rounded border border-border-default"
          >
            {{ t(name) }}
          </span>
        </div>

        <!-- Stat snapshot mini-bars -->
        <div class="grid grid-cols-2 gap-x-3 gap-y-1">
          <div v-for="stat in STAT_CONFIG" :key="stat.key" class="flex items-center gap-1.5">
            <Icon :icon="stat.icon" class="w-3.5 h-3.5 shrink-0" :style="{ color: stat.color }" />
            <div class="flex-1 h-1 bg-bg-elevated rounded-full overflow-hidden">
              <div
                class="h-full rounded-full"
                :style="{ width: entry.statsSnapshot[stat.key] + '%', backgroundColor: stat.color }"
              />
            </div>
            <span class="text-xs w-5 text-right shrink-0" :style="{ color: stat.color }">
              {{ entry.statsSnapshot[stat.key] }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
