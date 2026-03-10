<template>
  <div
    v-if="hints.length > 0"
    class="absolute bottom-4 left-4 max-w-md bg-bg-surface/95 backdrop-blur-md border border-default rounded-sm shadow-2xl pointer-events-auto overflow-hidden"
    style="z-index: 40"
  >
    <div
      class="px-3 py-2 border-b border-default/50 flex justify-between items-center bg-bg-elevated/50"
    >
      <div class="flex items-center gap-2">
        <span class="text-xs">📊</span>
        <span class="font-display text-[9px] tracking-widest text-text-secondary"
          >ANALYSIS REPORT</span
        >
      </div>
      <button @click="$emit('dismiss')" class="text-text-dim hover:text-white text-xs">✕</button>
    </div>

    <!-- P50/P99 Stats -->
    <div v-if="stats" class="grid grid-cols-3 gap-[1px] bg-default/30 border-b border-default/30">
      <div class="bg-bg-surface p-2 text-center">
        <div class="text-[8px] text-text-dim font-display uppercase tracking-widest mb-0.5">
          P50 Latency
        </div>
        <div
          class="text-xs font-mono"
          :class="stats.p50Latency > 200 ? 'text-accent-amber' : 'text-accent-sky'"
        >
          {{ stats.p50Latency }}ms
        </div>
      </div>
      <div class="bg-bg-surface p-2 text-center">
        <div class="text-[8px] text-text-dim font-display uppercase tracking-widest mb-0.5">
          P99 Latency
        </div>
        <div
          class="text-xs font-mono"
          :class="stats.p99Latency > 500 ? 'text-accent-coral' : 'text-accent-sky'"
        >
          {{ stats.p99Latency }}ms
        </div>
      </div>
      <div class="bg-bg-surface p-2 text-center">
        <div class="text-[8px] text-text-dim font-display uppercase tracking-widest mb-0.5">
          Success Rate
        </div>
        <div
          class="text-xs font-mono"
          :class="stats.successRate < 99 ? 'text-accent-coral' : 'text-accent-sky'"
        >
          {{ stats.successRate }}%
        </div>
      </div>
    </div>

    <div class="max-h-64 overflow-y-auto custom-scrollbar p-1">
      <div
        v-for="(hint, i) in hints"
        :key="i"
        class="flex gap-3 p-2 border-b border-default/20 last:border-0 hover:bg-bg-elevated/20 transition-colors"
      >
        <div class="text-base shrink-0 pt-0.5">{{ hint.icon }}</div>
        <div class="flex-1">
          <div
            class="font-display text-[10px] tracking-widest mb-0.5 uppercase"
            :class="hint.color"
          >
            {{ hint.title }}
          </div>
          <div class="text-[10px] text-text-dim leading-relaxed">{{ hint.message }}</div>
          <button
            v-if="hint.action"
            @click="applyHint(i, hint)"
            :disabled="appliedHints.has(i)"
            class="mt-1.5 px-2 py-0.5 text-[9px] font-display tracking-wider border rounded-sm transition-all duration-200"
            :class="
              appliedHints.has(i)
                ? 'border-default/30 text-text-dim cursor-not-allowed opacity-50'
                : hint.color.includes('coral')
                  ? 'border-accent-coral/40 text-accent-coral hover:bg-accent-coral hover:text-bg-deep hover:shadow-[0_0_8px_rgba(255,107,74,0.3)]'
                  : 'border-accent-sky/40 text-accent-sky hover:bg-accent-sky hover:text-bg-deep hover:shadow-[0_0_8px_rgba(56,189,248,0.3)]'
            "
          >
            {{ appliedHints.has(i) ? '✓ Đã áp dụng' : `⚡ ${hint.action.label}` }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { SimHint, SimStats } from '../types'

const props = defineProps<{
  hints: SimHint[]
  stats: SimStats | null
}>()

defineEmits<{
  (e: 'dismiss'): void
}>()

const appliedHints = ref<Set<number>>(new Set())

watch(
  () => props.hints,
  () => {
    appliedHints.value = new Set()
  },
)

const applyHint = (index: number, hint: SimHint) => {
  if (hint.action && !appliedHints.value.has(index)) {
    hint.action.apply()
    appliedHints.value = new Set([...appliedHints.value, index])
  }
}
</script>
