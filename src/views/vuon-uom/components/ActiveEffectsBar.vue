<script setup lang="ts">
import type { ActiveEvent } from '../types'
import { useI18n } from '../composables/useI18n'
import { Icon } from '@iconify/vue'
import { EVENT_LUCIDE } from '../constants/icons'

defineProps<{
  activeEvents: ActiveEvent[]
}>()

const { t, locale } = useI18n()
</script>

<template>
  <div v-if="activeEvents.length > 0" class="flex flex-wrap gap-2">
    <div
      v-for="ae in activeEvents"
      :key="ae.event.id"
      :class="[
        'flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border',
        ae.event.type === 'opportunity'
          ? 'border-accent-sky/40 bg-accent-sky/10 text-accent-sky'
          : 'border-accent-coral/40 bg-accent-coral/10 text-accent-coral',
      ]"
    >
      <Icon :icon="EVENT_LUCIDE[ae.event.type]" class="w-3.5 h-3.5" />
      <span class="truncate max-w-[10rem]">{{ t(ae.event.title) }}</span>
      <span
        :class="[
          'ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none',
          ae.event.type === 'opportunity'
            ? 'bg-accent-sky/20 text-accent-sky'
            : 'bg-accent-coral/20 text-accent-coral',
        ]"
      >
        {{ ae.turnsLeft }}{{ locale === 'vi' ? 'L' : 'T' }}
      </span>
    </div>
  </div>
</template>
