<script setup lang="ts">
/**
 * MoveHistory — Lịch sử nước đi
 */
import { Icon } from '@iconify/vue'

defineProps<{
  history: string[]
}>()
</script>

<template>
  <section v-if="history.length > 0" class="mb-8">
    <h2 class="font-display text-lg font-semibold text-text-primary mb-4 flex items-center gap-3">
      <span class="text-accent-sky font-display text-sm tracking-widest">//</span>
      Lịch sử nước đi
    </h2>
    <div
      class="border border-border-default bg-bg-surface divide-y divide-border-default max-h-48 overflow-y-auto"
    >
      <div
        v-for="(move, index) in history"
        :key="index"
        class="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-bg-elevated"
      >
        <div
          class="w-6 h-6 flex items-center justify-center flex-shrink-0"
          :class="move.startsWith('Bạn') ? 'text-accent-coral' : 'text-accent-sky'"
        >
          <Icon :icon="move.startsWith('Bạn') ? 'lucide:user' : 'lucide:cpu'" class="w-4 h-4" />
        </div>
        <span class="text-text-secondary text-sm font-body">{{ move }}</span>
        <span class="ml-auto text-text-dim text-xs font-mono tabular-nums">
          #{{ history.length - index }}
        </span>
      </div>
    </div>
  </section>
</template>
