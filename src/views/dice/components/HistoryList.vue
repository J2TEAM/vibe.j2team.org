<script setup lang="ts">
import type { HistoryEntry } from '../types'

defineProps<{
  history: HistoryEntry[]
  winCount: number
  loseCount: number
  isOpen: boolean
}>()

const emit = defineEmits<{
  (e: 'update:isOpen', value: boolean): void
  (e: 'verify', item: HistoryEntry): void
}>()
</script>

<template>
  <div class="mt-6">
    <button
      class="w-full flex items-center justify-between border border-border-default bg-bg-surface px-5 py-3 font-display text-xs transition-all hover:border-accent-sky hover:bg-bg-elevated uppercase tracking-widest"
      @click="emit('update:isOpen', !isOpen)"
    >
      <span class="flex items-center gap-2">
        <span class="text-accent-sky text-xs tracking-widest font-bold">//</span>
        History
        <span class="text-text-dim ml-1"
          >({{ history.length }} entries · {{ winCount }}W / {{ loseCount }}L)</span
        >
      </span>
      <span class="text-text-dim text-xs font-bold">{{ isOpen ? 'CLOSE ▲' : 'EXPAND ▼' }}</span>
    </button>

    <div v-if="isOpen" class="border border-t-0 border-border-default bg-bg-surface">
      <div
        v-if="history.length === 0"
        class="py-8 text-center text-text-dim text-xs font-display tracking-widest uppercase opacity-40"
      >
        No history records
      </div>
      <div v-else class="overflow-y-auto max-h-72 custom-scrollbar">
        <table class="w-full text-[11px] font-display uppercase tracking-widest">
          <thead class="sticky top-0 bg-bg-elevated shadow-sm">
            <tr class="text-text-dim tracking-wide font-bold">
              <th class="text-left px-4 py-3"># Nonce</th>
              <th class="text-center px-2 py-3">Target</th>
              <th class="text-center px-2 py-3">Mode</th>
              <th class="text-center px-2 py-3">Result</th>
              <th class="text-right px-4 py-3">Profit</th>
              <th class="text-center px-3 py-3">Fairness</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="item in history"
              :key="item.nonce"
              class="border-t border-border-default transition-colors hover:bg-bg-elevated"
              :class="item.won ? 'bg-accent-sky/[0.03]' : 'bg-transparent'"
            >
              <td class="px-4 py-2.5 text-text-dim font-mono">{{ item.nonce }}</td>
              <td class="text-center px-2 py-2.5 text-text-secondary font-mono">
                {{ item.prediction }}
              </td>
              <td class="text-center px-2 py-2.5 text-text-secondary">
                {{ item.mode === 'under' ? 'UNDER' : 'OVER' }}
              </td>
              <td
                class="text-center px-2 py-2.5 font-bold"
                :class="item.won ? 'text-accent-sky' : 'text-accent-coral'"
              >
                {{ String(item.result).padStart(2, '0') }}
              </td>
              <td
                class="text-right px-4 py-2.5 font-bold font-mono"
                :class="item.delta > 0 ? 'text-accent-sky' : 'text-accent-coral'"
              >
                {{ item.delta > 0 ? '+' : '' }}{{ item.delta.toFixed(2) }}
              </td>
              <td class="text-center px-3 py-2.5">
                <button
                  class="text-accent-sky hover:underline text-base leading-none"
                  @click="emit('verify', item)"
                  title="Verify provenance"
                >
                  🔍
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
