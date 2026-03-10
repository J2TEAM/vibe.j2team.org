<script setup lang="ts">
// Card tóm tắt stats đội (FOR, AGAINST, TOTAL, recentForm)
import type { TeamInfo, TeamSideStats } from '../types'

const props = defineProps<{
  team: TeamInfo
  stats: TeamSideStats
  side: 'HOME' | 'AWAY'
}>()

// Map ký tự form sang màu
const formColors: Record<string, string> = {
  W: 'text-accent-coral',
  D: 'text-text-secondary',
  L: 'text-text-dim',
}
</script>

<template>
  <div
    class="border border-border-default bg-bg-surface p-4 transition-all duration-300 hover:-translate-y-1 hover:border-accent-coral hover:bg-bg-elevated hover:shadow-lg hover:shadow-accent-coral/5"
  >
    <!-- Badge + tên đội -->
    <div class="flex items-center gap-2 mb-3">
      <span
        class="font-display text-[10px] tracking-widest uppercase px-1.5 py-0.5 border"
        :class="
          props.side === 'HOME'
            ? 'border-accent-coral text-accent-coral bg-accent-coral/10'
            : 'border-accent-amber text-accent-amber bg-accent-amber/10'
        "
      >
        {{ props.side }}
      </span>
      <span class="font-display text-sm text-text-primary">{{ props.team.name }}</span>
    </div>

    <!-- Stats grid 2×2 -->
    <div class="grid grid-cols-3 gap-2 mb-3">
      <div class="border border-border-default bg-bg-elevated p-2">
        <div class="text-[10px] text-text-dim mb-0.5">FOR</div>
        <div class="font-mono text-sm text-accent-coral">{{ props.stats.for.toFixed(1) }}</div>
      </div>
      <div class="border border-border-default bg-bg-elevated p-2">
        <div class="text-[10px] text-text-dim mb-0.5">AGAINST</div>
        <div class="font-mono text-sm text-accent-amber">{{ props.stats.against.toFixed(1) }}</div>
      </div>
      <div class="border border-border-default bg-bg-elevated p-2">
        <div class="text-[10px] text-text-dim mb-0.5">TOTAL</div>
        <div class="font-mono text-sm text-text-primary">{{ props.stats.total.toFixed(1) }}</div>
      </div>
    </div>

    <!-- Recent form -->
    <div>
      <div class="text-[10px] text-text-dim mb-1">Form gần đây</div>
      <div class="flex gap-1">
        <span
          v-for="(char, idx) in props.stats.recentForm.split('')"
          :key="idx"
          class="font-display text-xs font-bold w-5 h-5 flex items-center justify-center border border-border-default"
          :class="formColors[char] ?? 'text-text-dim'"
        >
          {{ char }}
        </span>
      </div>
    </div>
  </div>
</template>
