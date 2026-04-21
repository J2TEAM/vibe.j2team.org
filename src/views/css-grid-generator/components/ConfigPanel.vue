<script setup lang="ts">
import { Icon } from '@iconify/vue'
import type { GridConfig } from '../types'
import { MAX_COLS, MAX_GAP, MAX_ROWS, MIN_COLS, MIN_GAP, MIN_ROWS } from '../types'

defineProps<{
  config: GridConfig
}>()

const emit = defineEmits<{
  reset: []
  'update:config': [patch: Partial<GridConfig>]
}>()

function updateColumns(event: Event) {
  const val = Number((event.target as HTMLInputElement).value)
  emit('update:config', { columns: Math.max(MIN_COLS, Math.min(MAX_COLS, val)) })
}

function updateRows(event: Event) {
  const val = Number((event.target as HTMLInputElement).value)
  emit('update:config', { rows: Math.max(MIN_ROWS, Math.min(MAX_ROWS, val)) })
}

function updateGap(event: Event) {
  const val = Number((event.target as HTMLInputElement).value)
  emit('update:config', { gap: Math.max(MIN_GAP, Math.min(MAX_GAP, val)) })
}
</script>

<template>
  <div class="border border-border-default bg-bg-surface p-4">
    <div class="flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-6">
      <!-- Title -->
      <h2
        class="font-display text-sm font-semibold tracking-widest text-text-secondary uppercase flex items-center gap-2 sm:hidden"
      >
        <Icon icon="lucide:settings-2" class="size-4 text-accent-coral" />
        Cấu hình lưới
      </h2>

      <!-- Columns -->
      <div class="flex-1 min-w-[140px]">
        <label class="block text-text-dim text-xs mb-1.5 font-display tracking-wide">
          Cột (Columns)
        </label>
        <div class="flex items-center gap-3">
          <input
            type="range"
            :min="MIN_COLS"
            :max="MAX_COLS"
            :value="config.columns"
            class="flex-1 accent-accent-coral h-1.5 cursor-pointer"
            @input="updateColumns"
          />
          <span class="font-mono text-sm text-accent-coral w-6 text-right tabular-nums">
            {{ config.columns }}
          </span>
        </div>
      </div>

      <!-- Rows -->
      <div class="flex-1 min-w-[140px]">
        <label class="block text-text-dim text-xs mb-1.5 font-display tracking-wide">
          Hàng (Rows)
        </label>
        <div class="flex items-center gap-3">
          <input
            type="range"
            :min="MIN_ROWS"
            :max="MAX_ROWS"
            :value="config.rows"
            class="flex-1 accent-accent-amber h-1.5 cursor-pointer"
            @input="updateRows"
          />
          <span class="font-mono text-sm text-accent-amber w-6 text-right tabular-nums">
            {{ config.rows }}
          </span>
        </div>
      </div>

      <!-- Gap -->
      <div class="flex-1 min-w-[140px]">
        <label class="block text-text-dim text-xs mb-1.5 font-display tracking-wide">
          Khoảng cách (Gap)
        </label>
        <div class="flex items-center gap-3">
          <input
            type="range"
            :min="MIN_GAP"
            :max="MAX_GAP"
            :value="config.gap"
            class="flex-1 accent-accent-sky h-1.5 cursor-pointer"
            @input="updateGap"
          />
          <span class="font-mono text-sm text-accent-sky w-8 text-right tabular-nums">
            {{ config.gap }}px
          </span>
        </div>
      </div>

      <!-- Reset button -->
      <button
        class="border border-border-default bg-bg-elevated px-4 py-2 text-sm text-text-secondary font-display tracking-wide transition-all duration-200 shrink-0 hover:border-accent-coral hover:text-accent-coral hover:bg-accent-coral/5 flex items-center justify-center gap-2"
        @click="emit('reset')"
      >
        <Icon icon="lucide:rotate-ccw" class="size-4" />
        Reset
      </button>
    </div>
  </div>
</template>
