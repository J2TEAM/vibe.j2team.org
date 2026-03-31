<script setup lang="ts">
import type { L10n, Stats, DerivedStats } from '../types'
import { useI18n } from '../composables/useI18n'
import { Icon } from '@iconify/vue'
import { TRACK_LUCIDE, DERIVED_LUCIDE } from '../constants/icons'

defineProps<{
  worldTitle: L10n
  narrative: L10n
  visionIds: number[]
  stats: Stats
  derived: DerivedStats
}>()

const emit = defineEmits<{ restart: [] }>()
const { t, locale, toggleLocale } = useI18n()

const STAT_DISPLAY = [
  { key: 'nature' as const, color: '#4ADE80', icon: TRACK_LUCIDE.nature },
  { key: 'human' as const, color: '#FFB830', icon: TRACK_LUCIDE.human },
  { key: 'economy' as const, color: '#FF6B4A', icon: TRACK_LUCIDE.economy },
  { key: 'digital' as const, color: '#38BDF8', icon: TRACK_LUCIDE.digital },
]
</script>

<template>
  <div
    class="min-h-screen bg-bg-deep flex flex-col items-center justify-center px-6 relative overflow-hidden"
  >
    <!-- Glow -->
    <div
      class="absolute inset-0 pointer-events-none"
      style="
        background: radial-gradient(
          ellipse at 50% 30%,
          rgba(255, 107, 74, 0.08) 0%,
          transparent 60%
        );
      "
    />

    <div class="relative z-10 max-w-sm w-full text-center space-y-6 animate-fade-up">
      <!-- Year label -->
      <p class="text-text-dim text-xs uppercase tracking-widest">
        {{ locale === 'vi' ? 'Năm 50 — Kết thúc' : 'Year 50 — End of Run' }}
      </p>

      <!-- World title -->
      <div>
        <h1 class="font-display text-3xl font-bold text-accent-coral mb-2">
          {{ t(worldTitle) }}
        </h1>
        <p class="text-text-secondary text-sm leading-relaxed italic">"{{ t(narrative) }}"</p>
      </div>

      <!-- Final stats -->
      <div class="grid grid-cols-4 gap-2 border border-border-default p-3">
        <div v-for="s in STAT_DISPLAY" :key="s.key" class="text-center">
          <div class="flex justify-center mb-1">
            <Icon :icon="s.icon" class="w-5 h-5" :style="{ color: s.color }" />
          </div>
          <div class="font-display font-bold text-sm" :style="{ color: s.color }">
            {{ stats[s.key] }}
          </div>
        </div>
      </div>

      <div class="flex justify-center gap-4 text-xs text-text-secondary">
        <span class="flex items-center gap-1">
          <Icon :icon="DERIVED_LUCIDE.harmony" class="w-3.5 h-3.5" />
          {{ locale === 'vi' ? 'Hòa Hợp' : 'Harmony' }} {{ derived.harmony }}
        </span>
        <span class="flex items-center gap-1">
          <Icon :icon="DERIVED_LUCIDE.sustainability" class="w-3.5 h-3.5" />
          {{ derived.sustainability }}
        </span>
        <span class="flex items-center gap-1">
          <Icon :icon="DERIVED_LUCIDE.connection" class="w-3.5 h-3.5" />
          {{ derived.connection }}
        </span>
      </div>

      <!-- Actions -->
      <div class="flex flex-col gap-3">
        <button
          class="w-full py-2.5 border border-accent-coral text-accent-coral font-semibold hover:bg-accent-coral hover:text-bg-deep transition-all"
          @click="emit('restart')"
        >
          {{ locale === 'vi' ? 'Chơi lại →' : 'Play Again →' }}
        </button>
        <button
          class="text-xs text-text-dim hover:text-text-secondary transition-colors"
          @click="toggleLocale"
        >
          {{ locale === 'vi' ? 'Switch to English' : 'Chuyển sang Tiếng Việt' }}
        </button>
      </div>
    </div>
  </div>
</template>
