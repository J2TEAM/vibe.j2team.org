<script setup lang="ts">
import type { GameEvent } from '../types'
import { useI18n } from '../composables/useI18n'
import { Icon } from '@iconify/vue'
import { TRACK_LUCIDE, RESOURCE_LUCIDE, EVENT_LUCIDE } from '../constants/icons'

defineProps<{
  events: GameEvent[]
}>()

const emit = defineEmits<{
  choose: [eventId: string]
}>()

const { t, locale } = useI18n()

const TRACK_COLORS: Record<string, string> = {
  nature: '#4ADE80',
  human: '#FFB830',
  economy: '#FF6B4A',
  digital: '#38BDF8',
}
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" />

    <div
      class="relative bg-bg-surface border border-border-default rounded-2xl max-w-md w-full p-6 space-y-4 animate-fade-up"
    >
      <h2
        class="font-display text-lg font-bold text-text-primary text-center uppercase tracking-widest"
      >
        {{ locale === 'vi' ? 'Chọn Sự Kiện' : 'Choose an Event' }}
      </h2>
      <p class="text-xs text-text-dim text-center">
        {{
          locale === 'vi'
            ? 'Chọn 1 trong 3 sự kiện để áp dụng'
            : 'Pick 1 of 3 events to apply this turn'
        }}
      </p>

      <div class="space-y-3">
        <button
          v-for="event in events"
          :key="event.id"
          :class="[
            'w-full text-left rounded-xl border p-4 transition-all touch-manipulation',
            'hover:scale-[1.02] active:scale-[0.98]',
            event.type === 'opportunity'
              ? 'border-accent-sky/40 bg-accent-sky/5 hover:border-accent-sky hover:bg-accent-sky/10'
              : 'border-accent-coral/40 bg-accent-coral/5 hover:border-accent-coral hover:bg-accent-coral/10',
          ]"
          @click="emit('choose', event.id)"
        >
          <div class="flex items-center gap-2 mb-1">
            <Icon
              :icon="EVENT_LUCIDE[event.type]"
              class="w-5 h-5"
              :class="event.type === 'opportunity' ? 'text-accent-sky' : 'text-accent-coral'"
            />
            <span
              :class="[
                'font-display font-bold text-sm',
                event.type === 'opportunity' ? 'text-accent-sky' : 'text-accent-coral',
              ]"
            >
              {{ t(event.title) }}
            </span>
          </div>
          <p class="text-text-secondary text-xs leading-relaxed mb-2">
            {{ t(event.description) }}
          </p>
          <div class="flex gap-2 flex-wrap items-center">
            <span
              v-if="event.duration && event.duration > 1"
              class="text-xs font-semibold text-text-secondary bg-bg-elevated rounded-full px-2 py-0.5"
            >
              {{ event.duration }}{{ locale === 'vi' ? ' lượt' : ' turns' }}
            </span>
            <span
              v-if="event.budgetDelta !== 0"
              class="text-xs font-semibold flex items-center gap-0.5"
              :class="event.budgetDelta > 0 ? 'text-accent-amber' : 'text-accent-coral'"
            >
              <Icon :icon="RESOURCE_LUCIDE.budget" class="w-3 h-3" />{{
                event.budgetDelta > 0 ? '+' : ''
              }}{{ event.budgetDelta }}
            </span>
            <span
              v-if="event.energyDelta !== 0"
              class="text-xs font-semibold flex items-center gap-0.5"
              :class="event.energyDelta > 0 ? 'text-accent-sky' : 'text-accent-coral'"
            >
              <Icon :icon="RESOURCE_LUCIDE.energy" class="w-3 h-3" />{{
                event.energyDelta > 0 ? '+' : ''
              }}{{ event.energyDelta }}
            </span>
            <template v-for="(val, key) in event.meterDeltas" :key="key">
              <span
                v-if="val !== 0"
                class="text-xs font-semibold flex items-center gap-0.5"
                :class="val! > 0 ? 'text-green-400' : 'text-accent-coral'"
              >
                <Icon
                  :icon="TRACK_LUCIDE[key as keyof typeof TRACK_LUCIDE]"
                  class="w-3 h-3"
                  :style="{ color: TRACK_COLORS[key as string] }"
                />{{ val! > 0 ? '+' : '' }}{{ val }}
              </span>
            </template>
          </div>
        </button>
      </div>
    </div>
  </div>
</template>
